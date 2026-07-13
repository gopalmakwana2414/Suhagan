import { Queue, Worker, Job } from "bullmq";
import { checkRedisConnection, getRedisClient } from "../config/redis.js";
import { env } from "../config/env.js";
import logger from "../utils/logger.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { User } from "../models/User.js";
import mongoose from "mongoose";
import { razorpay } from "./razorpayService.js";
import { generateInvoicePDFBuffer } from "./invoiceService.js";
import { sendOrderConfirmationEmail, sendAdminOrderAlert } from "./emailService.js";

// Job Names
export const JOB_INVOICE_AND_EMAIL = "INVOICE_AND_EMAIL";
export const JOB_RELEASE_STOCK_RESERVATION = "RELEASE_STOCK_RESERVATION";

const QUEUE_NAME = "payment-jobs-queue";

let paymentQueue: Queue | null = null;
let queueWorker: Worker | null = null;

// Job processors
const processReleaseStockReservation = async (orderId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      logger.warn(`Order ${orderId} not found for stock release`);
      await session.abortTransaction();
      session.endSession();
      return;
    }

    if (order.paymentStatus === "pending" && order.orderStatus === "pending") {
      // Before cancelling, double check with Razorpay if order.razorpayOrderId exists
      if (order.razorpayOrderId) {
        try {
          const razorpayOrder = await razorpay.orders.fetch(order.razorpayOrderId);
          if (razorpayOrder && (razorpayOrder.status === "paid" || (razorpayOrder.amount_paid && razorpayOrder.amount_paid > 0))) {
            logger.info(`Stock release worker: Order ${orderId} was paid on Razorpay (status: ${razorpayOrder.status}, amount_paid: ${razorpayOrder.amount_paid}). Settling order instead of cancelling.`);
            
            // Settle order
            order.paymentStatus = "paid";
            order.orderStatus = "confirmed";
            
            // Attempt to find successful payment ID
            try {
              const payments = await razorpay.orders.fetchPayments(order.razorpayOrderId);
              if (payments && payments.items && payments.items.length > 0) {
                const successfulPayment = payments.items.find((p: any) => p.status === "captured" || p.status === "authorized");
                if (successfulPayment) {
                  order.paymentId = successfulPayment.id;
                } else {
                  order.paymentId = payments.items[0].id;
                }
              }
            } catch (payErr: any) {
              logger.error(`Stock release worker: Failed to fetch payments for Razorpay order ${order.razorpayOrderId}: ${payErr.message}`);
            }

            await order.save({ session });
            await session.commitTransaction();
            session.endSession();

            // Enqueue Invoice & Email background job
            await enqueueJob(JOB_INVOICE_AND_EMAIL, order._id.toString());
            return;
          }
        } catch (rzpErr: any) {
          logger.error(`Stock release worker: Failed to verify Razorpay status for Order ${orderId}: ${rzpErr.message}. Throwing to trigger retry.`);
          throw rzpErr; // Propagate to BullMQ to retry the job
        }
      }

      // If we got here, payment has truly failed (or was never paid on Razorpay)
      logger.info(`Stock reservation expired for order ${orderId}. Restoring stock.`);
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }
      order.paymentStatus = "failed";
      order.orderStatus = "cancelled";
      await order.save({ session });
      logger.info(`Order ${orderId} cancelled due to payment expiration.`);
    } else {
      logger.info(`Order ${orderId} is status: payment=${order.paymentStatus}, order=${order.orderStatus}. No stock release needed.`);
    }

    await session.commitTransaction();
  } catch (err: any) {
    await session.abortTransaction();
    logger.error(`Error in stock release transaction for order ${orderId}: ${err.message}`);
    throw err;
  } finally {
    session.endSession();
  }
};

const processInvoiceAndEmail = async (orderId: string) => {
  logger.info(`Processing invoice and emails for order ${orderId}`);
  const order = await Order.findById(orderId)
    .populate("shippingAddress")
    .populate("items.product", "name sku thumbnail originalPrice salePrice")
    .populate("user", "name email mobile");

  if (!order) {
    throw new Error(`Order ${orderId} not found for invoice and emails`);
  }

  if (order.invoiceSent) {
    logger.info(`Invoice already sent for order ${orderId}. Skipping.`);
    return;
  }

  const user = order.user as any;
  const address = order.shippingAddress as any;
  if (!user || !address) {
    throw new Error(`Missing user or address for order ${orderId}`);
  }

  // Generate PDF Buffer
  const pdfBuffer = await generateInvoicePDFBuffer(order as any);

  // Format address & items for the email template
  const addressString = `${address.fullName}\n${address.addressLine1}${
    address.addressLine2 ? ", " + address.addressLine2 : ""
  }\n${address.city}, ${address.state} - ${address.postalCode}\n${address.country}\nPhone: ${address.mobileNumber}`;

  const itemsForEmail = order.items.map((item: any) => ({
    name: item.product?.name || "Saree Product",
    quantity: item.quantity,
    price: item.price,
  }));

  // Send customer confirmation email with PDF attachment
  await sendOrderConfirmationEmail({
    to: user.email,
    customerName: user.name,
    orderId: order._id.toString(),
    orderDate: order.createdAt,
    items: itemsForEmail,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    address: addressString,
    pdfBuffer,
  });

  // Mark as sent
  order.invoiceSent = true;
  await order.save();

  // Send admin alert
  try {
    await sendAdminOrderAlert(order);
  } catch (adminErr: any) {
    logger.error(`Admin order alert email failed for order ${order._id}: ${adminErr.message}`);
    // Do not fail the whole job if the admin alert email fails, since the customer invoice was sent
  }
};

// General job router
const executeJob = async (name: string, orderId: string) => {
  switch (name) {
    case JOB_RELEASE_STOCK_RESERVATION:
      await processReleaseStockReservation(orderId);
      break;
    case JOB_INVOICE_AND_EMAIL:
      await processInvoiceAndEmail(orderId);
      break;
    default:
      logger.warn(`Unknown job name: ${name}`);
  }
};

// Initialize BullMQ if Redis is active
const initQueue = () => {
  if (checkRedisConnection()) {
    const connectionOptions = env.REDIS_URL
      ? env.REDIS_URL
      : {
          host: env.REDIS_HOST,
          port: env.REDIS_PORT,
          password: env.REDIS_PASSWORD || undefined,
        };

    paymentQueue = new Queue(QUEUE_NAME, {
      connection: connectionOptions as any,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000, // retry after 5s, 10s, 20s...
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });

    queueWorker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        logger.info(`👷 [Worker] Processing job ${job.name} (ID: ${job.id}) for order ${job.data.orderId}`);
        await executeJob(job.name, job.data.orderId);
      },
      {
        connection: connectionOptions as any,
        concurrency: 10,
      }
    );

    queueWorker.on("completed", (job) => {
      logger.info(`✅ [Worker] Job ${job.name} (ID: ${job.id}) completed successfully.`);
    });

    queueWorker.on("failed", (job, err) => {
      logger.error(`❌ [Worker] Job ${job?.name} (ID: ${job?.id}) failed: ${err.message}`);
    });
  } else {
    logger.warn("⚠️ Queue running in Local/In-Memory fallback mode.");
  }
};

// Call initQueue on load
setTimeout(initQueue, 1000); // Small timeout to ensure Redis connection resolves first

/**
 * Enqueues a job for processing
 * @param name Job type (JOB_INVOICE_AND_EMAIL or JOB_RELEASE_STOCK_RESERVATION)
 * @param orderId Target order ID
 * @param delayMs Delay in milliseconds (for stock reservation timeout)
 */
export const enqueueJob = async (name: string, orderId: string, delayMs: number = 0): Promise<void> => {
  if (checkRedisConnection() && paymentQueue) {
    try {
      await paymentQueue.add(name, { orderId }, { delay: delayMs });
      logger.info(`📦 Enqueued BullMQ job: ${name} for order ${orderId} (delay: ${delayMs}ms)`);
      return;
    } catch (err: any) {
      logger.error(`❌ BullMQ add job failed: ${err.message}. Falling back to in-memory execution.`);
    }
  }

  // Local In-Memory Fallback Execution
  logger.info(`📦 Enqueuing local in-memory job: ${name} for order ${orderId} (delay: ${delayMs}ms)`);
  
  if (delayMs > 0) {
    setTimeout(async () => {
      try {
        logger.info(`👷 [Local Queue] Running delayed job ${name} for order ${orderId}`);
        await executeJob(name, orderId);
      } catch (err: any) {
        logger.error(`❌ [Local Queue] Delayed job ${name} failed: ${err.message}`);
      }
    }, delayMs);
  } else {
    // Run asynchronously outside current execution tick
    setImmediate(async () => {
      let attempts = 0;
      const maxAttempts = 3;
      let delay = 5000;

      while (attempts < maxAttempts) {
        try {
          logger.info(`👷 [Local Queue] Running immediate job ${name} for order ${orderId} (attempt ${attempts + 1})`);
          await executeJob(name, orderId);
          return;
        } catch (err: any) {
          attempts++;
          logger.error(`❌ [Local Queue] Immediate job ${name} failed: ${err.message}`);
          if (attempts >= maxAttempts) {
            logger.error(`❌ [Local Queue] Job ${name} failed completely after ${maxAttempts} attempts.`);
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
        }
      }
    });
  }
};

export default {
  enqueueJob,
  JOB_INVOICE_AND_EMAIL,
  JOB_RELEASE_STOCK_RESERVATION,
};
