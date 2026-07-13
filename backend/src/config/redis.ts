import Redis from "ioredis";
import { env } from "./env.js";
import logger from "../utils/logger.js";

let redis: Redis | null = null;
let isRedisConnected = false;

const isProd = env.NODE_ENV === "production";

const initRedis = () => {
  const connectionString = env.REDIS_URL;
  
  const options: any = {
    maxRetriesPerRequest: null, // Required for BullMQ compatibility
    connectTimeout: 5000, // Timeout after 5 seconds
    retryStrategy(times: number) {
      if (!isProd) {
        // In local development, fail-fast and stop retrying after 1 attempt to avoid log spam
        if (times > 1) {
          logger.warn("Stopping Redis reconnect attempts in development.");
          return null; // Stop retrying
        }
        return 1000;
      }
      
      // In production, reconnect indefinitely using exponential backoff capped at 5s
      const delay = Math.min(times * 200, 5000);
      logger.info(`📡 [Redis] Connection lost. Attempting to reconnect (Attempt ${times}) in ${delay}ms...`);
      return delay;
    },
  };

  // Configure TLS if specified or if connection URL is secure (rediss://)
  if (env.REDIS_TLS || connectionString?.startsWith("rediss://")) {
    options.tls = {
      rejectUnauthorized: false, // Standard for cloud environments (Render, Heroku, AWS ElastiCache)
    };
  }

  if (connectionString) {
    logger.info("Initializing Redis with connection URL...");
    redis = new Redis(connectionString, options);
  } else if (env.REDIS_HOST) {
    logger.info(`Initializing Redis on ${env.REDIS_HOST}:${env.REDIS_PORT}...`);
    redis = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      ...options,
    });
  }

  if (redis) {
    redis.on("connect", () => {
      isRedisConnected = true;
      logger.info("📡 Redis Connected Successfully");
    });

    let lastLoggedErrorTime = 0;
    const ERROR_LOG_THROTTLE_MS = 60000;
    let lastErrorMsg = "";

    redis.on("error", (err: any) => {
      const wasConnected = isRedisConnected;
      isRedisConnected = false;
      
      const now = Date.now();
      if (wasConnected || err.message !== lastErrorMsg || now - lastLoggedErrorTime > ERROR_LOG_THROTTLE_MS) {
        logger.warn(`⚠️ Redis Connection Error: ${err.message}. Degrading to local memory fallbacks.`);
        lastLoggedErrorTime = now;
        lastErrorMsg = err.message;
      }
    });
  } else {
    logger.warn("⚠️ No Redis host or URL configured. Running on local memory fallbacks.");
  }
};

initRedis();

let connectionPromise: Promise<void> | null = null;

/**
 * Validates connection on application startup.
 * In production, it throws if Redis is down (fail-fast).
 * In development, it allows proceeding with a clean fallback message.
 */
export const verifyRedisConnection = async (): Promise<void> => {
  if (connectionPromise) return connectionPromise;

  connectionPromise = new Promise<void>((resolve, reject) => {
    if (isRedisConnected) {
      resolve();
      return;
    }

    const timeout = setTimeout(() => {
      cleanup();
      if (isRedisConnected) {
        resolve();
      } else {
        if (isProd) {
          reject(new Error("FAIL_FAST: Redis connection timed out after 5000ms. Redis is mandatory in production for payment locks and queues."));
        } else {
          logger.warn("⚠️ Redis server is not running. Starting in development fallback mode.");
          if (redis) redis.disconnect();
          resolve();
        }
      }
    }, 5000);

    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (err: any) => {
      if (isProd) {
        cleanup();
        reject(new Error(`FAIL_FAST: Redis connection failed: ${err.message}. Redis is mandatory in production.`));
      } else {
        cleanup();
        logger.warn("⚠️ Redis server is not running. Starting in development fallback mode.");
        if (redis) redis.disconnect();
        resolve();
      }
    };

    const cleanup = () => {
      clearTimeout(timeout);
      if (redis) {
        redis.off("ready", onConnect);
        redis.off("error", onError);
      }
    };

    if (redis) {
      if (redis.status === "ready") {
        cleanup();
        resolve();
      } else {
        redis.on("ready", onConnect);
        redis.on("error", onError);
      }
    } else {
      resolve();
    }
  });

  return connectionPromise;
};

/**
 * Pings the Redis instance to verify health.
 */
export const isRedisHealthy = async (): Promise<boolean> => {
  if (!redis || !isRedisConnected) return false;
  try {
    const result = await redis.ping();
    return result === "PONG";
  } catch {
    return false;
  }
};

/**
 * Clean disconnect for graceful shutdowns
 */
const gracefulShutdown = async () => {
  if (redis) {
    logger.info("Closing Redis connection gracefully...");
    try {
      await redis.quit();
      logger.info("Redis connection closed cleanly.");
    } catch (err: any) {
      logger.error(`Error closing Redis connection gracefully: ${err.message}`);
    }
  }
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export const getRedisClient = (): Redis | null => {
  return redis;
};

export const checkRedisConnection = (): boolean => {
  return isRedisConnected;
};

export default redis;
