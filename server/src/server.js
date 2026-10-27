const env = require("./config/env");
const app = require("./app");
const { connectDb } = require("./config/db");
const { startExpiryJob } = require("./services/expiry.service");


async function main() {
  await connectDb();
  startExpiryJob();

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`[server] listening on port ${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] received ${signal}, shutting down...`);
    server.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error("[server] failed to start:", err);
  process.exit(1);
});
