import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import router from "./routes";
import storageRouter from "./routes/storage";
import { logger } from "./lib/logger";
import { loadCurrentUser } from "./lib/loadUser";
import { pool } from "@workspace/db";
import { startHoldExpiryJob } from "./lib/holdExpiry";

const app: Express = express();

// Replit's proxy terminates TLS and forwards requests over plain HTTP
// internally. Without this, Express doesn't consider the connection secure,
// so the session cookie's `secure: true` flag silently drops Set-Cookie —
// breaking cookie-based auth (e.g. the admin dashboard) entirely.
app.set("trust proxy", 1);

const PgSession = connectPgSimple(session);

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required.");
}

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
// CORS: only allow credentialed requests from this repl's own exact origins.
// `origin: true` (reflect any origin) + `credentials: true` is forbidden by
// the CORS spec and enables full CSRF — any attacker site can make
// authenticated API calls on behalf of logged-in users.
//
// Trusted origins are derived from Replit environment variables that are
// unique to this specific repl — another project cannot share these hostnames.
//   REPLIT_DEV_DOMAIN  — main dev hostname (admin dashboard, web preview)
//   REPLIT_EXPO_DEV_DOMAIN — Expo dev-client hostname (mobile web bundle)
//   CORS_ALLOWED_ORIGINS — comma-separated extra origins for production
function buildTrustedOrigins(): Set<string> {
  const origins = new Set<string>();

  if (process.env.REPLIT_DEV_DOMAIN) {
    origins.add(`https://${process.env.REPLIT_DEV_DOMAIN}`);
  }
  if (process.env.REPLIT_EXPO_DEV_DOMAIN) {
    origins.add(`https://${process.env.REPLIT_EXPO_DEV_DOMAIN}`);
  }

  // Extra origins for production custom domains, e.g.:
  //   CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
  for (const o of (process.env.CORS_ALLOWED_ORIGINS ?? "").split(",")) {
    const trimmed = o.trim();
    if (trimmed) origins.add(trimmed);
  }

  return origins;
}

const TRUSTED_ORIGINS = buildTrustedOrigins();

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      // Allow server-to-server / same-origin requests (no Origin header)
      if (!origin) return callback(null, true);
      if (TRUSTED_ORIGINS.has(origin)) return callback(null, true);
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({ pool, tableName: "session", createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // Replit dev domains (expo.pike.replit.dev vs pike.replit.dev) are
      // treated as cross-site by the browser, so we need SameSite=None +
      // Secure to allow the session cookie across both origins.
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(loadCurrentUser);

app.use("/api", router);

// Start background job to auto-expire held bookings
startHoldExpiryJob();

export default app;
