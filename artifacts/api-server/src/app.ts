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
app.use(cors({ credentials: true, origin: true }));
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

// Redirect /storage/* → /api/storage/* so that image URLs constructed by
// the finalize endpoint (e.g. /storage/objects/…) resolve correctly when
// loaded in a browser <img> tag or React Native Image without the /api prefix.
// storageRouter's own paths all start with /storage/…, so a direct mount at
// /storage would double the prefix; a 307 redirect avoids that.
app.use('/storage', (req, res) => {
  res.redirect(307, `/api/storage${req.url}`);
});

app.use("/api", router);

export default app;
