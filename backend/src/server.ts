import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { verifyRedisConnection } from "./config/redis.js";
import https from "https";

// Enable connection pooling and KeepAlive globally for HTTPS requests
const globalAgent = https.globalAgent as any;
globalAgent.keepAlive = true;
globalAgent.maxSockets = 100;
globalAgent.keepAliveMsecs = 1000;

const startServer = async () => {
  await connectDB();
  await verifyRedisConnection();

  app.listen(env.PORT, () => {
    console.log(`🚀 Server running on port ${env.PORT}`);
  });
};

startServer();