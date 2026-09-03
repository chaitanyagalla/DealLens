import { existsSync } from "node:fs";
import { resolve } from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import type { ApiErrorResponse } from "../shared/contracts.js";
import { LeadsController } from "./controllers/leads.controller.js";
import { LeadRepository } from "./repositories/lead.repository.js";
import { createLeadsRouter } from "./routes/leads.routes.js";

function errorResponse(code: string, message: string): ApiErrorResponse {
  return { error: { code, message } };
}

export function createApp(repository = new LeadRepository()) {
  const app = express();
  const leadsController = new LeadsController(repository);

  app.disable("x-powered-by");
  app.use(express.json({ limit: "50kb" }));

  app.get("/api/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.use("/api/leads", createLeadsRouter(leadsController));

  app.use("/api", (_request, response) => {
    response.status(404).json(
      errorResponse("API_ROUTE_NOT_FOUND", "The requested API route does not exist."),
    );
  });

  const clientDirectory = resolve(process.cwd(), "dist", "client");
  if (existsSync(clientDirectory)) {
    app.use(express.static(clientDirectory));
    app.use((request, response, next) => {
      if (request.method !== "GET") {
        next();
        return;
      }

      response.sendFile(resolve(clientDirectory, "index.html"));
    });
  }

  app.use(
    (error: unknown, _request: Request, response: Response, _next: NextFunction) => {
      console.error("Unhandled Shortlist API error", error);
      response.status(500).json(
        errorResponse("INTERNAL_ERROR", "Shortlist could not complete the request."),
      );
    },
  );

  return app;
}
