import express, { Router } from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const hoisted = vi.hoisted(() => {
  const communityStorageMock = {
    getAllBillSuggestions: vi.fn(),
    getBillSuggestionById: vi.fn(),
    getBillSuggestionsByBillId: vi.fn(),
    getBillSuggestionsByUserId: vi.fn(),
    getFeaturedBillSuggestions: vi.fn(),
    getTrendingBillSuggestions: vi.fn(),
    searchBillSuggestions: vi.fn(),
    createBillSuggestion: vi.fn(),
    updateBillSuggestion: vi.fn(),
    deleteBillSuggestion: vi.fn(),
    setFeaturedStatus: vi.fn(),
    getAllCategories: vi.fn(),
    getCategoryById: vi.fn(),
    getSuggestionCategories: vi.fn(),
    addCategory: vi.fn(),
    removeCategory: vi.fn(),
    toggleUpvote: vi.fn(),
    hasUserUpvoted: vi.fn(),
    getCommentById: vi.fn(),
    getSuggestionComments: vi.fn(),
    addComment: vi.fn(),
    updateComment: vi.fn(),
    deleteComment: vi.fn(),
  };

  const civicTermsStorageMock = {
    createCivicTerm: vi.fn(),
    updateCivicTerm: vi.fn(),
    deleteCivicTerm: vi.fn(),
    getAllCivicTerms: vi.fn(),
    getCivicTerm: vi.fn(),
    getCivicTermsByCategory: vi.fn(),
    getCivicTermsByDifficulty: vi.fn(),
    searchCivicTerms: vi.fn(),
    trackTermAppearance: vi.fn(),
    getRelatedTerms: vi.fn(),
  };

  const poolQueryMock = vi.fn();

  const feedbackStorageInstance = {
    createFeedback: vi.fn(),
    getAllFeedback: vi.fn(),
    getFeedbackStats: vi.fn(),
    updateFeedbackStatus: vi.fn(),
  };

  const infographicsStorageMock = {
    createTemplate: vi.fn(),
    getAllTemplates: vi.fn(),
    getTemplatesByType: vi.fn(),
    getTemplateById: vi.fn(),
  };

  const verificationStorageMock = {
    createVerificationRule: vi.fn(),
    updateUserVerificationCredential: vi.fn(),
  };

  const scoutAnalyticsStorageMock = {
    analyzeFinancialNetworks: vi.fn(),
    createAdvancedAnalysis: vi.fn(),
    createAutomatedReport: vi.fn(),
    createCrossDatasetAnomaly: vi.fn(),
    createHistoricalTrend: vi.fn(),
    detectCrossDatasetAnomalies: vi.fn(),
    generateAutomatedReport: vi.fn(),
    getAdvancedAnalysisByProfileId: vi.fn(),
    getAnomaliesByProfileId: vi.fn(),
    getAutomatedReports: vi.fn(),
    getHistoricalTrendsByEntityType: vi.fn(),
    reviewAnomaly: vi.fn(),
  };

  return {
    communityStorageMock,
    civicTermsStorageMock,
    poolQueryMock,
    feedbackStorageInstance,
    infographicsStorageMock,
    verificationStorageMock,
    scoutAnalyticsStorageMock,
  };
});

vi.mock("../server/storage-community", () => ({
  communityStorage: hoisted.communityStorageMock,
}));

vi.mock("../server/storage-civic-terms", () => ({
  civicTermsStorage: hoisted.civicTermsStorageMock,
}));

vi.mock("../server/db", () => ({
  pool: {
    query: hoisted.poolQueryMock,
  },
}));

vi.mock("../server/storage-feedback", () => ({
  FeedbackStorage: class FeedbackStorage {
    createFeedback = hoisted.feedbackStorageInstance.createFeedback;
    getAllFeedback = hoisted.feedbackStorageInstance.getAllFeedback;
    getFeedbackStats = hoisted.feedbackStorageInstance.getFeedbackStats;
    updateFeedbackStatus = hoisted.feedbackStorageInstance.updateFeedbackStatus;
  },
}));

vi.mock("../server/storage-infographics", () => ({
  infographicsStorage: hoisted.infographicsStorageMock,
}));

vi.mock("../server/storage", () => ({
  storage: {},
}));

vi.mock("../server/services/infographic-generator-service", () => ({
  infographicGeneratorService: {},
}));

vi.mock("../server/storage-verification", () => ({
  storage: hoisted.verificationStorageMock,
}));

vi.mock("../server/storage-scout-bot-analytics", () => ({
  ...hoisted.scoutAnalyticsStorageMock,
}));

vi.mock("../server/auth", () => ({
  isAuthenticated: (req: any, res: any, next: any) => {
    if (req?.session?.userId) {
      next();
      return;
    }
    res.status(401).json({ message: "Not authenticated" });
  },
}));

vi.mock("../server/middleware/auth-middleware", () => ({
  isAdmin: (req: any, res: any, next: any) => {
    if (!req?.session?.userId) {
      res.status(401).json({ error: "Unauthorized - Please log in to access this resource" });
      return;
    }

    const adminIds = String(process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);

    if (adminIds.includes(Number(req.session.userId))) {
      next();
      return;
    }

    res.status(403).json({ error: "Forbidden - Admin access required" });
  },
  isUserAdminById: (userId: number) => {
    const adminIds = String(process.env.ADMIN_USER_IDS || "")
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value > 0);
    return adminIds.includes(userId);
  },
}));

import { registerCommunityRoutes } from "../server/routes-community";
import { registerCivicTermsRoutes } from "../server/routes-civic-terms";
import { registerDebugRoutes } from "../server/routes-debug";
import { registerFeedbackRoutes } from "../server/routes-feedback";
import { registerInfographicsRoutes } from "../server/routes-infographics";
import { registerVerificationRoutes } from "../server/routes/verification-routes";
import { registerScoutBotAnalyticsRoutes } from "../server/routes-scout-bot-analytics";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use((req: any, _res, next) => {
    const userIdHeader = req.header("x-test-user-id");
    req.session = {};
    if (userIdHeader) {
      req.session.userId = Number(userIdHeader);
    }
    next();
  });

  const router = Router();
  registerCommunityRoutes(router);
  app.use(router);

  registerCivicTermsRoutes(app);
  registerFeedbackRoutes(app);
  registerInfographicsRoutes(app);
  registerVerificationRoutes(app);
  registerScoutBotAnalyticsRoutes(app);
  registerDebugRoutes(app);

  return app;
}

describe("Mutation endpoint authorization", () => {
  beforeEach(() => {
    process.env.ADMIN_USER_IDS = "1";
    process.env.NODE_ENV = "test";
    process.env.ENABLE_DEBUG_ROUTES = "false";
    vi.clearAllMocks();

    hoisted.communityStorageMock.getBillSuggestionById.mockResolvedValue({ id: 7, userId: 1 });
    hoisted.communityStorageMock.getCategoryById.mockResolvedValue({ id: 2, suggestionId: 7 });
    hoisted.communityStorageMock.getCommentById.mockResolvedValue({ id: 3, suggestionId: 7, userId: 1 });
    hoisted.communityStorageMock.updateComment.mockResolvedValue({ id: 3, suggestionId: 7, userId: 1, content: "x" });
  });

  afterEach(() => {
    delete process.env.ADMIN_USER_IDS;
    delete process.env.ENABLE_DEBUG_ROUTES;
  });

  it("returns 401 for all community mutation endpoints when unauthenticated", async () => {
    const app = buildApp();

    const cases: Array<{ method: "post" | "put" | "patch" | "delete"; path: string; body?: unknown }> = [
      { method: "post", path: "/api/community/suggestions", body: { title: "t", description: "d", rationale: "r" } },
      { method: "put", path: "/api/community/suggestions/7", body: { title: "updated" } },
      { method: "delete", path: "/api/community/suggestions/7" },
      { method: "patch", path: "/api/community/suggestions/7/feature", body: { featured: true } },
      { method: "post", path: "/api/community/suggestions/7/categories", body: { name: "Health" } },
      { method: "delete", path: "/api/community/categories/2" },
      { method: "post", path: "/api/community/suggestions/7/upvote" },
      { method: "post", path: "/api/community/suggestions/7/comments", body: { content: "hello" } },
      { method: "put", path: "/api/community/comments/3", body: { content: "updated" } },
      { method: "delete", path: "/api/community/comments/3" },
    ];

    for (const testCase of cases) {
      const req = request(app)[testCase.method](testCase.path);
      const response = testCase.body ? await req.send(testCase.body) : await req.send();
      expect(response.status).toBe(401);
    }
  });

  it("returns 401 for all civic terms mutation endpoints when unauthenticated", async () => {
    const app = buildApp();

    const postResponse = await request(app)
      .post("/api/civic-terms")
      .send({ term: "Open Meeting", definition: "desc", category: "process", difficulty: "easy" });
    expect(postResponse.status).toBe(401);

    const patchResponse = await request(app)
      .patch("/api/civic-terms/1")
      .send({ definition: "updated" });
    expect(patchResponse.status).toBe(401);

    const deleteResponse = await request(app).delete("/api/civic-terms/1");
    expect(deleteResponse.status).toBe(401);
  });

  it("returns 401 for newly hardened mutation endpoints when unauthenticated", async () => {
    const app = buildApp();

    const cases: Array<{ method: "post" | "put" | "patch"; path: string; body?: unknown }> = [
      { method: "post", path: "/api/infographics/templates", body: { name: "Template" } },
      { method: "post", path: "/api/verification/rules", body: { updateType: "bill" } },
      { method: "put", path: "/api/verification/users/10/credentials/official", body: { value: "x" } },
      { method: "post", path: "/api/scout-bot-analytics/advanced-analysis", body: {} },
      { method: "post", path: "/api/scout-bot-analytics/historical-trends", body: {} },
      { method: "post", path: "/api/scout-bot-analytics/anomalies", body: {} },
      { method: "patch", path: "/api/scout-bot-analytics/anomalies/1/review", body: { reviewed: true } },
      { method: "post", path: "/api/scout-bot-analytics/reports", body: {} },
    ];

    for (const testCase of cases) {
      const req = request(app)[testCase.method](testCase.path);
      const response = testCase.body ? await req.send(testCase.body) : await req.send();
      expect(response.status).toBe(401);
    }
  });

  it("enforces admin gate on feature mutation", async () => {
    const app = buildApp();

    const response = await request(app)
      .patch("/api/community/suggestions/7/feature")
      .set("x-test-user-id", "2")
      .send({ featured: true });

    expect(response.status).toBe(403);
  });

  it("enforces owner or admin for category deletion", async () => {
    const app = buildApp();

    hoisted.communityStorageMock.getCategoryById.mockResolvedValueOnce({ id: 2, suggestionId: 7 });
    hoisted.communityStorageMock.getBillSuggestionById.mockResolvedValueOnce({ id: 7, userId: 11 });

    const response = await request(app)
      .delete("/api/community/categories/2")
      .set("x-test-user-id", "2");

    expect(response.status).toBe(403);
  });

  it("enforces owner or admin for comment update and delete", async () => {
    const app = buildApp();

    hoisted.communityStorageMock.getCommentById.mockResolvedValue({ id: 3, suggestionId: 7, userId: 11 });

    const updateResponse = await request(app)
      .put("/api/community/comments/3")
      .set("x-test-user-id", "2")
      .send({ content: "new text" });

    expect(updateResponse.status).toBe(403);

    const deleteResponse = await request(app)
      .delete("/api/community/comments/3")
      .set("x-test-user-id", "2");

    expect(deleteResponse.status).toBe(403);
  });

  it("enforces admin or self authorization for verification credential updates", async () => {
    const app = buildApp();

    const response = await request(app)
      .put("/api/verification/users/99/credentials/official")
      .set("x-test-user-id", "2")
      .send({ value: "new" });

    expect(response.status).toBe(403);
  });

  it("enforces admin authorization on feedback status mutation", async () => {
    const app = buildApp();

    const response = await request(app)
      .patch("/api/feedback/1/status")
      .set("x-test-user-id", "2")
      .send({ status: "reviewed" });

    expect(response.status).toBe(403);
  });

  it("keeps debug routes disabled in production unless explicitly enabled", async () => {
    process.env.NODE_ENV = "production";
    process.env.ENABLE_DEBUG_ROUTES = "false";

    const app = buildApp();
    const response = await request(app).get("/api/debug/bills/count");

    expect(response.status).toBe(404);
  });
});
