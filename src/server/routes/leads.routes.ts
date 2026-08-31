import { Router } from "express";
import { LeadsController } from "../controllers/leads.controller.js";

export function createLeadsRouter(controller: LeadsController): Router {
  const router = Router();

  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.patch("/:id/decision", controller.updateDecision);

  return router;
}

