import http from "node:http";

import { Server } from "socket.io";

import { app } from "./app.js";
import { env } from "./config/env.js";

const httpServer = http.createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: env.FRONTEND_URL,
    credentials: true,
  },
});

/* -------------------------------------------------------------------------- */
/*                              SOCKET.IO                                     */
/* -------------------------------------------------------------------------- */

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${socket.id} (${reason})`);
  });
});

/* -------------------------------------------------------------------------- */
/*                              HTTP SERVER                                   */
/* -------------------------------------------------------------------------- */

httpServer.listen(env.PORT, () => {
  console.log(`🚀 PestBack API running on port ${env.PORT}`);
});

/* -------------------------------------------------------------------------- */
/*                         SHUTDOWN                                           */
/* -------------------------------------------------------------------------- */

function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down PestBack API...`);

  httpServer.close((error) => {
    if (error) {
      console.error("HTTP server shutdown failed:", error);
      process.exit(1);
    }

    console.log("HTTP server closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => {
  shutdown("SIGTERM");
});

process.on("SIGINT", () => {
  shutdown("SIGINT");
});
