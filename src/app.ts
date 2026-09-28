import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import cookieParser from "cookie-parser";

import { env } from "./config/env.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import routes from "./routes/index.js";

export const app = express();

/* -------------------------------------------------------------------------- */
/*                           GLOBAL MIDDLEWARE                                */
/* -------------------------------------------------------------------------- */

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(helmet());

app.use(pinoHttp());

/* -------------------------------------------------------------------------- */
/*                        RAZORPAY WEBHOOK RAW BODY                           */
/* -------------------------------------------------------------------------- */

/**
 * IMPORTANT:
 *
 * Razorpay webhook signature verification requires
 * the exact raw request body.
 *
 * These routes MUST be registered before express.json().
 */

app.use(
  "/api/v1/payments/webhooks/razorpay",
  express.raw({
    type: "application/json",
    limit: "1mb",
  }),
);

app.use(
  "/api/v1/subscriptions/webhooks/razorpay",
  express.raw({
    type: "application/json",
    limit: "1mb",
  }),
);

/* -------------------------------------------------------------------------- */
/*                              BODY PARSERS                                  */
/* -------------------------------------------------------------------------- */

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

/* -------------------------------------------------------------------------- */
/*                                  HEALTH                                    */
/* -------------------------------------------------------------------------- */

app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "PestBack API is healthy",
  });
});

/* -------------------------------------------------------------------------- */
/*                                API ROUTES                                  */
/* -------------------------------------------------------------------------- */

app.use("/api/v1", routes);

/* -------------------------------------------------------------------------- */
/*                            ERROR HANDLER                                   */
/* -------------------------------------------------------------------------- */

/**
 * MUST BE LAST.
 */

app.use(errorMiddleware);