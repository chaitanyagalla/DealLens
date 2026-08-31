import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { LeadRepository } from "../repositories/lead.repository.js";

describe("DealLens API", () => {
  let repository: LeadRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    repository = new LeadRepository();
    app = createApp(repository);
  });

  it("reports service health", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns all 20 analyzed queue items", async () => {
    const response = await request(app).get("/api/leads");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(20);
    expect(response.body[0]).toMatchObject({
      leadId: "dl-001",
      company: "Nimbus Health Systems",
      recommendedDecision: "SHORTLIST",
      analystDecision: null,
    });
    expect(response.body[0]).toHaveProperty("initialFitScore");
    expect(response.body[0]).toHaveProperty("dataConfidenceScore");
    expect(response.body[0]).toHaveProperty("enrichmentPriorityScore");
  });

  it("returns a complete lead detail response", async () => {
    const response = await request(app).get("/api/leads/dl-003");

    expect(response.status).toBe(200);
    expect(response.body.lead.enrichment.revenue.status).toBe("failed");
    expect(response.body.analysis.nextResearchAction.title).toBe("Verify revenue manually");
    expect(response.body.analysis.recommendedDecision).toBe("RESEARCH");
    expect(response.body.analystDecision).toBeNull();
  });

  it("returns a consistent error for an unknown lead", async () => {
    const response = await request(app).get("/api/leads/not-real");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "LEAD_NOT_FOUND",
        message: "The requested lead does not exist.",
      },
    });
  });

  it("rejects an invalid analyst decision", async () => {
    const response = await request(app)
      .patch("/api/leads/dl-001/decision")
      .send({ decision: "MAYBE" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_DECISION");
  });

  it("stores an analyst decision separately from the recommendation", async () => {
    const updateResponse = await request(app)
      .patch("/api/leads/dl-001/decision")
      .send({ decision: "REJECT" });
    const detailResponse = await request(app).get("/api/leads/dl-001");
    const queueResponse = await request(app).get("/api/leads");
    const queueItem = queueResponse.body.find(
      (item: { leadId: string }) => item.leadId === "dl-001",
    );

    expect(updateResponse.status).toBe(200);
    expect(detailResponse.body.analysis.recommendedDecision).toBe("SHORTLIST");
    expect(detailResponse.body.analystDecision).toBe("REJECT");
    expect(queueItem.analystDecision).toBe("REJECT");
  });

  it("clears an analyst decision with null", async () => {
    await request(app).patch("/api/leads/dl-001/decision").send({ decision: "RESEARCH" });
    const clearResponse = await request(app)
      .patch("/api/leads/dl-001/decision")
      .send({ decision: null });
    const detailResponse = await request(app).get("/api/leads/dl-001");

    expect(clearResponse.status).toBe(200);
    expect(clearResponse.body.analystDecision).toBeNull();
    expect(detailResponse.body.analystDecision).toBeNull();
  });

  it("returns a consistent error for an unknown API route", async () => {
    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("API_ROUTE_NOT_FOUND");
  });
});
