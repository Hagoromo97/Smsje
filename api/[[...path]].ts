import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "../server/routes";

let appPromise: Promise<express.Express> | null = null;

async function getApp() {
  if (!appPromise) {
    appPromise = (async () => {
      const app = express();
      app.set("trust proxy", 1);
      app.use(express.json());
      app.use(express.urlencoded({ extended: false }));

      await registerRoutes(app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      return app;
    })();
  }

  return appPromise;
}

export default async function handler(req: any, res: any) {
  const app = await getApp();
  return app(req, res);
}
