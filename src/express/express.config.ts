import express, { Application } from "express";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { RateLimitConfig } from "../config.js";

const ExpressConfig = (config: RateLimitConfig): Application => {
  const app = express();

  // enable rate limiting
  // Set number of expected proxies
  app.set("trust proxy", config.rateLimitNumberOfProxies);
  // Define rate limiter
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMinutes * 60 * 1000,
    max: config.rateLimitMaxRequests, // Limit each IP to <amount> requests per `window`
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  app.use(limiter);

  // request logging. dev: console | production: file
  const logs = process.env.NODE_ENV === "production" ? "combined" : "dev";
  app.use(morgan(logs));

  // secure apps by setting various HTTP headers
  app.use(helmet());

  // enable CORS - Cross Origin Resource Sharing
  app.use(cors());

  // make query params insensitive to uppercase
  app.use((req, res, next) => {
    req.query = Object.keys(req.query).reduce(
      (newQuery, key) => {
        const value = req.query[key];

        if (typeof value === "string") {
          newQuery[key.toLowerCase()] = value;
        } else if (Array.isArray(value)) {
          newQuery[key.toLowerCase()] = value.join(",");
        }

        return newQuery;
      },
      {} as { [key: string]: string },
    );
    next();
  });

  return app;
};

export default ExpressConfig;
