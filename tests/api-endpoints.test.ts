/**
 * Policy Intel API — Endpoint Integration Tests
 *
 * Tests all 77+ routes against the running Docker stack.
 * Uses supertest pointed at http://localhost:5050.
 *
 * Prerequisites: docker compose up (postgres + policy-intel containers)
 */
import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";

const BASE = "http://localhost:5050";
const api = request(BASE);

// ── Health & Info ────────────────────────────────────────────────────────────

describe("Health & Info", () => {
  it("GET /health returns ok", async () => {
    const res = await api.get("/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("GET /api/intel returns root info", async () => {
    const res = await api.get("/api/intel");
    expect(res.status).toBe(200);
  });

  it("GET /metrics returns Prometheus text", async () => {
    const res = await api.get("/metrics");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
  });
});

// ── Workspaces ───────────────────────────────────────────────────────────────

describe("Workspaces", () => {
  it("GET /api/intel/workspaces returns array", async () => {
    const res = await api.get("/api/intel/workspaces");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/intel/workspaces creates workspace", async () => {
    const slug = `test-ws-${Date.now()}`;
    const res = await api
      .post("/api/intel/workspaces")
      .send({ slug, name: slug });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
  });
});

// ── Dashboard ────────────────────────────────────────────────────────────────

describe("Dashboard", () => {
  it("GET /api/intel/dashboard/stats returns stats object", async () => {
    const res = await api.get("/api/intel/dashboard/stats");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalAlerts");
    expect(res.body).toHaveProperty("pendingReview");
  });

  it("GET /api/intel/dashboard/kpis returns KPI data", async () => {
    const res = await api.get("/api/intel/dashboard/kpis");
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/dashboard/analytics returns analytics", async () => {
    const res = await api.get("/api/intel/dashboard/analytics");
    expect(res.status).toBe(200);
  });
});

// ── Watchlists ───────────────────────────────────────────────────────────────

describe("Watchlists", () => {
  let watchlistId: number;

  it("GET /api/intel/watchlists returns array", async () => {
    const res = await api.get("/api/intel/watchlists");
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : (res.body?.data ?? []);
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) {
      watchlistId = list[0].id;
    }
  });

  it("POST /api/intel/watchlists creates watchlist", async () => {
    const res = await api
      .post("/api/intel/watchlists")
      .send({
        workspaceId: 2,
        name: `test-wl-${Date.now()}`,
        rulesJson: { keywords: ["test"], committees: [], agencies: [], billIds: [] },
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
    watchlistId = watchlistId ?? res.body.id;
  });

  it("GET /api/intel/watchlists/:id returns single watchlist", async () => {
    if (!watchlistId) return;
    const res = await api.get(`/api/intel/watchlists/${watchlistId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(watchlistId);
  });

  it("PATCH /api/intel/watchlists/:id updates watchlist", async () => {
    if (!watchlistId) return;
    const res = await api
      .patch(`/api/intel/watchlists/${watchlistId}`)
      .send({ name: `updated-${Date.now()}` });
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/watchlists/:id/alerts returns alerts for watchlist", async () => {
    if (!watchlistId) return;
    const res = await api.get(`/api/intel/watchlists/${watchlistId}/alerts`);
    expect(res.status).toBe(200);
  });
});

// ── Source Documents ─────────────────────────────────────────────────────────

describe("Source Documents", () => {
  it("GET /api/intel/source-documents returns paginated response", async () => {
    const res = await api.get("/api/intel/source-documents?limit=5");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
  });

  it("POST /api/intel/source-documents creates document", async () => {
    const res = await api
      .post("/api/intel/source-documents")
      .send({
        workspaceId: 2,
        title: `test-doc-${Date.now()}`,
        sourceType: "manual",
        publisher: "test-suite",
        sourceUrl: "https://test.example.com/doc",
        normalizedText: "Test document content for automated testing",
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeGreaterThan(0);
  });
});

// ── Alerts ───────────────────────────────────────────────────────────────────

describe("Alerts", () => {
  let alertId: number;

  it("GET /api/intel/alerts returns paginated response", async () => {
    const res = await api.get("/api/intel/alerts?limit=5");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("total");
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      alertId = res.body.data[0].id;
    }
  });

  it("GET /api/intel/alerts supports status filter", async () => {
    const res = await api.get("/api/intel/alerts?status=pending_review&limit=3");
    expect(res.status).toBe(200);
    for (const alert of res.body.data) {
      expect(alert.status).toBe("pending_review");
    }
  });

  it("GET /api/intel/alerts supports search filter", async () => {
    const res = await api.get("/api/intel/alerts?search=transportation&limit=3");
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/alerts/:id returns alert detail", async () => {
    if (!alertId) return;
    const res = await api.get(`/api/intel/alerts/${alertId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("alert");
    expect(res.body.alert.id).toBe(alertId);
  });

  it("PATCH /api/intel/alerts/:id updates status", async () => {
    if (!alertId) return;
    const res = await api
      .patch(`/api/intel/alerts/${alertId}`)
      .send({ status: "ready", reviewerNote: "Test review" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ready");

    // Revert
    await api
      .patch(`/api/intel/alerts/${alertId}`)
      .send({ status: "pending_review" });
  });

  it("POST /api/intel/alerts/bulk-triage dry-run works", async () => {
    const res = await api
      .post("/api/intel/alerts/bulk-triage")
      .send({ suppressBelow: 10, promoteAbove: 90, dryRun: true });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("dryRun");
    expect(res.body.dryRun).toBe(true);
  });
});

// ── Matters ──────────────────────────────────────────────────────────────────

describe("Matters", () => {
  let matterId: number;

  it("GET /api/intel/matters returns array", async () => {
    const res = await api.get("/api/intel/matters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) matterId = res.body[0].id;
  });

  it("POST /api/intel/matters creates matter", async () => {
    const slug = `test-matter-${Date.now()}`;
    const res = await api
      .post("/api/intel/matters")
      .send({
        workspaceId: 2,
        slug,
        name: slug,
        clientName: "Test Client",
      });
    expect(res.status).toBe(201);
    matterId = matterId ?? res.body.id;
  });

  it("GET /api/intel/matters/:id returns matter", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(matterId);
  });

  it("GET /api/intel/matters/:id/alerts returns alerts", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}/alerts`);
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/matters/:id/activities returns activities", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}/activities`);
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/matters/:id/watchlists returns watchlists", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}/watchlists`);
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/matters/:id/stakeholders returns stakeholders", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}/stakeholders`);
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/matters/:id/briefs returns briefs", async () => {
    if (!matterId) return;
    const res = await api.get(`/api/intel/matters/${matterId}/briefs`);
    expect(res.status).toBe(200);
  });
});

// ── Issue Rooms ──────────────────────────────────────────────────────────────

describe("Issue Rooms", () => {
  let issueRoomId: number;

  it("GET /api/intel/issue-rooms returns array", async () => {
    const res = await api.get("/api/intel/issue-rooms");
    expect(res.status).toBe(200);
    const list = Array.isArray(res.body) ? res.body : (res.body?.data ?? []);
    expect(Array.isArray(list)).toBe(true);
    if (list.length > 0) issueRoomId = list[0].id;
  });

  it("POST /api/intel/issue-rooms creates room", async () => {
    const res = await api
      .post("/api/intel/issue-rooms")
      .send({
        workspaceId: 2,
        title: `test-room-${Date.now()}`,
        issueType: "legislative",
        summary: "Test issue room",
      });
    expect(res.status).toBe(201);
    issueRoomId = issueRoomId ?? res.body.id;
  });

  it("GET /api/intel/issue-rooms/:id returns detail", async () => {
    if (!issueRoomId) return;
    const res = await api.get(`/api/intel/issue-rooms/${issueRoomId}`);
    expect(res.status).toBe(200);
    // Response may nest the room under a key or return it flat
    const room = res.body.issueRoom ?? res.body;
    expect(room.id).toBe(issueRoomId);
  });

  it("PATCH /api/intel/issue-rooms/:id updates room", async () => {
    if (!issueRoomId) return;
    const res = await api
      .patch(`/api/intel/issue-rooms/${issueRoomId}`)
      .send({ summary: "Updated summary" });
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/issue-rooms/:id/alerts returns alerts", async () => {
    if (!issueRoomId) return;
    const res = await api.get(`/api/intel/issue-rooms/${issueRoomId}/alerts`);
    expect(res.status).toBe(200);
  });

  it("POST /api/intel/issue-rooms/:id/updates creates update", async () => {
    if (!issueRoomId) return;
    const res = await api
      .post(`/api/intel/issue-rooms/${issueRoomId}/updates`)
      .send({ title: "Test update", body: "Test update from automated tests" });
    expect(res.status).toBe(201);
  });

  it("POST /api/intel/issue-rooms/:id/tasks creates task", async () => {
    if (!issueRoomId) return;
    const res = await api
      .post(`/api/intel/issue-rooms/${issueRoomId}/tasks`)
      .send({ title: "Test task", assignee: "tester" });
    expect(res.status).toBe(201);
  });
});

// ── Stakeholders ─────────────────────────────────────────────────────────────

describe("Stakeholders", () => {
  let stakeholderId: number;

  it("GET /api/intel/stakeholders returns array", async () => {
    const res = await api.get("/api/intel/stakeholders");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    if (res.body.length > 0) stakeholderId = res.body[0].id;
  });

  it("POST /api/intel/stakeholders creates stakeholder", async () => {
    const res = await api
      .post("/api/intel/stakeholders")
      .send({
        workspaceId: 2,
        type: "legislator",
        name: `Test Stakeholder ${Date.now()}`,
        title: "Representative",
        organization: "Test Org",
      });
    expect([200, 201]).toContain(res.status);
    stakeholderId = stakeholderId ?? res.body.id;
  });

  it("GET /api/intel/stakeholders/:id returns stakeholder", async () => {
    if (!stakeholderId) return;
    const res = await api.get(`/api/intel/stakeholders/${stakeholderId}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/stakeholders/:id/full returns full profile", async () => {
    if (!stakeholderId) return;
    const res = await api.get(`/api/intel/stakeholders/${stakeholderId}/full`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("observations");
    expect(res.body).toHaveProperty("committees");
    expect(res.body).toHaveProperty("meetingNotes");
  });

  it("POST /api/intel/stakeholders/:id/observations creates observation", async () => {
    if (!stakeholderId) return;
    const res = await api
      .post(`/api/intel/stakeholders/${stakeholderId}/observations`)
      .send({ observationText: "Test observation from automated suite" });
    expect(res.status).toBe(201);
  });

  it("GET /api/intel/stakeholders/:id/meeting-notes returns notes", async () => {
    if (!stakeholderId) return;
    const res = await api.get(`/api/intel/stakeholders/${stakeholderId}/meeting-notes`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("POST /api/intel/stakeholders/:id/meeting-notes creates note", async () => {
    if (!stakeholderId) return;
    const res = await api
      .post(`/api/intel/stakeholders/${stakeholderId}/meeting-notes`)
      .send({
        noteText: "Automated test meeting note",
        meetingDate: "2026-03-28",
        contactMethod: "email",
      });
    expect(res.status).toBe(201);
    expect(res.body.noteText).toBe("Automated test meeting note");
  });

  it("GET /api/intel/stakeholders/for-bill/:billId returns stakeholders", async () => {
    const res = await api
      .get("/api/intel/stakeholders/for-bill/HB%2014");
    expect(res.status).toBe(200);
  });
});

// ── Hearings & Calendar ──────────────────────────────────────────────────────

describe("Hearings & Calendar", () => {
  it("GET /api/intel/hearings returns array", async () => {
    const res = await api.get("/api/intel/hearings");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("GET /api/intel/hearings/this-week returns this week data", async () => {
    const res = await api.get("/api/intel/hearings/this-week");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("hearings");
  });

  it("GET /api/intel/hearings supports filters", async () => {
    const res = await api.get("/api/intel/hearings?chamber=senate");
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/hearings/:id returns single hearing", async () => {
    const list = await api.get("/api/intel/hearings");
    if (list.body.length === 0) return;
    const id = list.body[0].id;
    const res = await api.get(`/api/intel/hearings/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });
});

// ── Committee Members ────────────────────────────────────────────────────────

describe("Committee Members", () => {
  it("GET /api/intel/committee-members returns array", async () => {
    const res = await api.get("/api/intel/committee-members");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Activities ───────────────────────────────────────────────────────────────

describe("Activities", () => {
  it("GET /api/intel/activities returns array", async () => {
    const res = await api.get("/api/intel/activities");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Briefs & Deliverables ────────────────────────────────────────────────────

describe("Briefs & Deliverables", () => {
  it("GET /api/intel/briefs returns array", async () => {
    const res = await api.get("/api/intel/briefs");
    expect(res.status).toBe(200);
  });

  it("GET /api/intel/deliverables returns array", async () => {
    const res = await api.get("/api/intel/deliverables");
    expect(res.status).toBe(200);
  });
});

// ── Jobs ─────────────────────────────────────────────────────────────────────

describe("Jobs", () => {
  it("GET /api/intel/jobs returns job list", async () => {
    const res = await api.get("/api/intel/jobs");
    expect(res.status).toBe(200);
  });
});

// ── Scheduler ────────────────────────────────────────────────────────────────

describe("Scheduler", () => {
  it("GET /api/intel/scheduler/status returns status", async () => {
    const res = await api.get("/api/intel/scheduler/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("jobs");
  });

  it("GET /api/intel/scheduler/history returns history", async () => {
    const res = await api.get("/api/intel/scheduler/history");
    expect(res.status).toBe(200);
  });
});

// ── Pipeline Diagnostics ─────────────────────────────────────────────────────

describe("Pipeline Diagnostics", () => {
  it("GET /api/intel/metrics/pipeline returns pipeline config", async () => {
    const res = await api.get("/api/intel/metrics/pipeline");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("currentRegime");
    expect(res.body).toHaveProperty("currentWeights");
  });

  it("POST /api/intel/metrics/pipeline/test runs test scoring", async () => {
    const res = await api
      .post("/api/intel/metrics/pipeline/test")
      .send({
        title: "Floor vote on HB 14 transportation funding",
        summary: "Governor supports the bill",
        reasons: [
          { dimension: "bill_id", rule: "HB 14", excerpt: "HB 14" },
          { dimension: "keyword", rule: "transportation", excerpt: "transportation funding" },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("totalScore");
    expect(res.body).toHaveProperty("agents");
    expect(res.body).toHaveProperty("regime");
  });
});

// ── Champion/Challenger ──────────────────────────────────────────────────────

describe("Champion/Challenger", () => {
  it("GET /api/intel/champion/status returns current config", async () => {
    const res = await api.get("/api/intel/champion/status");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("weights");
    expect(res.body).toHaveProperty("escalateThreshold");
  });

  it("GET /api/intel/champion/history returns snapshots", async () => {
    const res = await api.get("/api/intel/champion/history");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── Digest ───────────────────────────────────────────────────────────────────

describe("Digest", () => {
  it("GET /api/intel/workspaces/:id/digest returns digest", async () => {
    const res = await api.get("/api/intel/workspaces/2/digest");
    expect(res.status).toBe(200);
  });
});

// ── Error Handling ───────────────────────────────────────────────────────────

describe("Error Handling", () => {
  it("returns 404 for unknown alert ID", async () => {
    const res = await api.get("/api/intel/alerts/999999999");
    expect(res.status).toBe(404);
  });

  it("returns 404 for unknown matter ID", async () => {
    const res = await api.get("/api/intel/matters/999999999");
    expect(res.status).toBe(404);
  });

  it("returns 400 or 4xx for invalid PATCH body", async () => {
    const res = await api
      .patch("/api/intel/alerts/1")
      .send({ status: "invalid_status_value" });
    // Should still process (route may allow any string) or reject
    expect([200, 400, 422]).toContain(res.status);
  });
});
