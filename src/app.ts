// src/app.ts
import express, { Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { testConnection } from "./config/database";
import { notFound, errorHandler } from "./middleware/error.middleware";
import routes from "./routes";

const app: Express = express();

// Middlewares
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // Limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });

// app.use(limiter);

// Routes
app.use("/api/v1", routes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Start listening
    app.listen(env.PORT, () => {
      console.log(
        `✅ Server running on port ${env.PORT} in ${env.NODE_ENV} mode`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
