/**
 * API Documentation — OpenAPI 3.0 specification served as JSON,
 * with a lightweight Swagger UI page using CDN assets.
 *
 * GET /api/docs      → Swagger UI HTML page
 * GET /api/docs.json → Raw OpenAPI spec
 */
import { Router, type Request, type Response } from "express";

const router = Router();

const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Act Up Platform API",
    version: "1.0.0",
    description:
      "Act Up is a free, open-source civic engagement platform that empowers citizens to track legislation, monitor representatives, and take collective action. This API powers the core platform features.",
    contact: { name: "Act Up Team" },
    license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
  },
  servers: [{ url: "/api", description: "Main API" }],
  tags: [
    { name: "Auth", description: "Authentication & registration" },
    { name: "Users", description: "User profile, roles & milestones" },
    { name: "Bills", description: "Legislation data & tracking" },
    { name: "Legislators", description: "Legislator lookup & data" },
    { name: "Representatives", description: "Representative tracking" },
    { name: "Search", description: "Unified search" },
    { name: "Challenges", description: "Gamification challenges" },
    { name: "Metrics", description: "Tipping-point & impact metrics" },
    { name: "Policy Intel", description: "Policy intelligence bridge" },
    { name: "OAuth", description: "Social login (Google, GitHub)" },
    { name: "Health", description: "Health checks" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password", "email"],
                properties: {
                  username: { type: "string", minLength: 3 },
                  password: { type: "string", minLength: 12, description: "Must contain uppercase, lowercase, and number" },
                  email: { type: "string", format: "email" },
                  displayName: { type: "string" },
                  district: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created (password excluded)" },
          "400": { description: "Validation error" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with username & password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful — sets session cookie" },
          "401": { description: "Invalid credentials" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out and clear session",
        responses: {
          "200": { description: "Logged out" },
        },
      },
    },
    "/auth/google": {
      get: {
        tags: ["OAuth"],
        summary: "Redirect to Google OAuth",
        responses: { "302": { description: "Redirect to Google consent screen" } },
      },
    },
    "/auth/github": {
      get: {
        tags: ["OAuth"],
        summary: "Redirect to GitHub OAuth",
        responses: { "302": { description: "Redirect to GitHub authorization" } },
      },
    },
    "/auth/oauth/config": {
      get: {
        tags: ["OAuth"],
        summary: "Get configured OAuth providers",
        responses: {
          "200": {
            description: "List of available providers",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    providers: {
                      type: "array",
                      items: { type: "string", enum: ["google", "github"] },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/users/me": {
      get: {
        tags: ["Users"],
        summary: "Get current user profile",
        security: [{ session: [] }],
        responses: {
          "200": { description: "User object (password excluded)" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/users/me/role": {
      get: {
        tags: ["Users"],
        summary: "Get current user's super-user role",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Super-user role object" },
          "401": { description: "Not authenticated" },
          "404": { description: "Role not found" },
        },
      },
      put: {
        tags: ["Users"],
        summary: "Update current user's role",
        security: [{ session: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  level: { type: "integer" },
                  progressToNextLevel: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated role" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/users/me/milestones": {
      get: {
        tags: ["Users"],
        summary: "Get user's progression milestones",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Array of milestones" },
          "401": { description: "Not authenticated" },
        },
      },
    },
    "/users/me/milestones/{id}": {
      put: {
        tags: ["Users"],
        summary: "Update a milestone's progress",
        security: [{ session: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  progress: { type: "number" },
                  completed: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated milestone" },
          "404": { description: "Not found" },
        },
      },
    },
    "/users/me/network-impact": {
      get: {
        tags: ["Metrics"],
        summary: "Get user's network impact stats",
        security: [{ session: [] }],
        responses: {
          "200": { description: "Network impact data" },
          "404": { description: "Not found" },
        },
      },
    },
    "/challenges": {
      get: {
        tags: ["Challenges"],
        summary: "List all challenges",
        security: [{ session: [] }],
        responses: { "200": { description: "Array of challenges" } },
      },
    },
    "/users/me/challenges": {
      get: {
        tags: ["Challenges"],
        summary: "Get user's active challenges",
        security: [{ session: [] }],
        responses: { "200": { description: "Array of user-challenge records" } },
      },
    },
    "/users/me/challenges/{challengeId}": {
      post: {
        tags: ["Challenges"],
        summary: "Start a challenge",
        security: [{ session: [] }],
        parameters: [{ name: "challengeId", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "201": { description: "Challenge started" },
          "404": { description: "Challenge not found" },
          "409": { description: "Already started" },
        },
      },
      put: {
        tags: ["Challenges"],
        summary: "Update challenge progress",
        security: [{ session: [] }],
        parameters: [{ name: "challengeId", in: "path", required: true, schema: { type: "integer" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  progress: { type: "number" },
                  completed: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated" },
          "404": { description: "Not found" },
        },
      },
    },
    "/bills": {
      get: {
        tags: ["Bills"],
        summary: "List all bills or redirect to search if query params provided",
        responses: { "200": { description: "Bills with pagination" } },
      },
    },
    "/bills/{id}": {
      get: {
        tags: ["Bills"],
        summary: "Get bill details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Bill object" },
          "404": { description: "Not found" },
        },
      },
    },
    "/bills/texas-authentic": {
      get: {
        tags: ["Bills"],
        summary: "Get authentic Texas bills (for complexity translator)",
        responses: { "200": { description: "Formatted bill array" } },
      },
    },
    "/legislators": {
      get: {
        tags: ["Legislators"],
        summary: "Fetch current Texas legislators from OpenStates API",
        responses: {
          "200": { description: "Array of legislator objects" },
          "400": { description: "API key not configured" },
        },
      },
    },
    "/legislators/texas-authentic": {
      get: {
        tags: ["Legislators"],
        summary: "Fetch authentic Texas legislators (with metadata)",
        responses: { "200": { description: "Wrapped legislator data with count" } },
      },
    },
    "/representatives": {
      get: {
        tags: ["Representatives"],
        summary: "Get representatives (optionally by district)",
        security: [{ session: [] }],
        parameters: [{ name: "district", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Array of representatives" } },
      },
    },
    "/representatives/{id}/responses": {
      get: {
        tags: ["Representatives"],
        summary: "Get a representative's responses/statements",
        security: [{ session: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Array of responses" } },
      },
    },
    "/representatives/{id}/track": {
      post: {
        tags: ["Representatives"],
        summary: "Track a representative",
        security: [{ session: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: {
          "201": { description: "Tracking created" },
          "409": { description: "Already tracking" },
        },
      },
    },
    "/search": {
      get: {
        tags: ["Search"],
        summary: "Unified search across bills & legislators",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2 } },
          { name: "type", in: "query", schema: { type: "string", enum: ["bill", "legislator"] } },
          { name: "chamber", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "party", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Search results with relevance scores" } },
      },
    },
    "/search/suggestions": {
      get: {
        tags: ["Search"],
        summary: "Get search suggestions",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Array of suggestion strings" } },
      },
    },
    "/search/trending": {
      get: {
        tags: ["Search"],
        summary: "Get trending search terms",
        responses: { "200": { description: "Array of trending terms" } },
      },
    },
    "/tipping-point": {
      get: {
        tags: ["Metrics"],
        summary: "Get latest tipping-point metrics",
        security: [{ session: [] }],
        responses: { "200": { description: "Tipping point metric data" } },
      },
    },
    "/integrations/policy-intel/status": {
      get: {
        tags: ["Policy Intel"],
        summary: "Get policy-intel service status",
        security: [{ session: [] }],
        responses: { "200": { description: "Status payload" } },
      },
    },
    "/integrations/policy-intel/briefing": {
      get: {
        tags: ["Policy Intel"],
        summary: "Get policy-intel briefing",
        security: [{ session: [] }],
        responses: { "200": { description: "Briefing payload" } },
      },
    },
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          "200": {
            description: "Server status",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    status: { type: "string", example: "ok" },
                    message: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/data-import/legislators": {
      post: {
        tags: ["Legislators"],
        summary: "Import legislator data from external collector",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["legislators"],
                properties: {
                  legislators: { type: "array", items: { type: "object" } },
                  source: { type: "string" },
                  collectedAt: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Import summary" },
          "400": { description: "Invalid data" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      session: {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
        description: "Session cookie set by /api/auth/login",
      },
    },
  },
};

// Serve raw OpenAPI JSON
router.get("/docs.json", (_req: Request, res: Response) => {
  res.json(openApiSpec);
});

// Serve Swagger UI via CDN
router.get("/docs", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "text/html");
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Act Up API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: "/api/docs.json", dom_id: "#swagger-ui", deepLinking: true });
  </script>
</body>
</html>`);
});

export default router;
