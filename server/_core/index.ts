import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleStripeWebhook } from "../stripe/webhook";
import { registerSeoRoutes } from "../seo";
import { generateAndSendWeeklyReport } from "../weeklyReportGenerator";

/**
 * Schedule the weekly report to run every Monday at 8:00 AM UTC.
 * Uses setInterval with a check for the correct day/hour.
 */
function scheduleWeeklyReport() {
  const CHECK_INTERVAL = 60 * 60 * 1000; // Check every hour
  let lastReportWeek = -1;

  const checkAndSend = async () => {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday
    const hour = now.getUTCHours();
    const weekNumber = Math.floor(now.getTime() / (7 * 24 * 60 * 60 * 1000));

    // Send on Monday between 8:00-8:59 UTC, once per week
    if (dayOfWeek === 1 && hour === 8 && weekNumber !== lastReportWeek) {
      lastReportWeek = weekNumber;
      console.log("[Scheduler] Triggering weekly report...");
      try {
        await generateAndSendWeeklyReport();
      } catch (err) {
        console.error("[Scheduler] Weekly report failed:", err);
      }
    }
  };

  // Run check immediately on startup, then every hour
  setTimeout(checkAndSend, 5000);
  setInterval(checkAndSend, CHECK_INTERVAL);
  console.log("[Scheduler] Weekly report scheduled (Monday 8:00 UTC)");
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // IMPORTANT: Stripe webhook must be registered BEFORE json body parser
  // to preserve raw body for signature verification
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // SEO routes (sitemap.xml, robots.txt)
  registerSeoRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Schedule weekly report - runs every Monday at 8:00 AM UTC
    scheduleWeeklyReport();
  });
}

startServer().catch(console.error);
