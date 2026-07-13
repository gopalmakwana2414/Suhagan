import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import { checkRedisConnection, isRedisHealthy } from "./config/redis.js";

import authRoutes from "./routes/authRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import wishlistRoutes from "./routes/wishlistRoutes";
import addressRoutes from "./routes/addressRoutes";
import orderRoutes from "./routes/orderRoutes";
import adminRoutes from "./routes/adminRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import couponRoutes from "./routes/couponRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import paymentRoutes from "./routes/paymentRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import contactRoutes from "./routes/contactRoutes";

import { apiLimiter, contactLimiter } from "./middlewares/rateLimiter";
import { notFound, errorHandler } from "./middlewares/error";

const app = express();

// Trust the first proxy hop (needed on Render/Railway/Heroku/Vercel/behind Nginx
// so req.ip and rate-limiting see the real client IP, not the proxy's).
app.set("trust proxy", 1);

app.use(
  express.json({
    limit: "10mb",
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookies
app.use(cookieParser());

// Compression — shrinks JSON/HTML responses for faster page loads
app.use(compression());

// Security
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:3000"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(helmet());

// General rate limiting — broad abuse protection on all API routes
app.use("/api", apiLimiter);

// Logger (only verbose in development)
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", authRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/wishlist", wishlistRoutes);

app.use("/api/addresses", addressRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/reviews", reviewRoutes);

app.use("/api/coupons", couponRoutes);

app.use("/api/dashboard", dashboardRoutes);

app.use("/api/payment", paymentRoutes);

app.use("/api/admin", adminRoutes);

app.use("/api/banners", bannerRoutes);

app.use("/api/contact", contactLimiter, contactRoutes);

// Health Check
app.get("/health", async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const redisConnected = checkRedisConnection();
  const redisHealthy = await isRedisHealthy();

  const isProd = process.env.NODE_ENV === "production";
  
  // In production, Redis is strictly required for API to be considered healthy
  const healthy = dbConnected && (!isProd || redisHealthy);
  const status = healthy ? 200 : 503;

  res.status(status).json({
    success: healthy,
    message: healthy ? "Kaumudi API is healthy" : "Kaumudi API is unhealthy",
    services: {
      database: dbConnected ? "connected" : "disconnected",
      redis: redisConnected ? (redisHealthy ? "healthy" : "connected but unhealthy") : "disconnected",
    },
    timestamp: new Date().toISOString(),
  });
});

// 404 + Global Error Handler (must be registered last)
app.use(notFound);
app.use(errorHandler);

export default app;
