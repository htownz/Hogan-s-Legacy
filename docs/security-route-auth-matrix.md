# Security Route Auth Matrix

Last updated: 2026-03-31

This matrix documents current authorization requirements for high-risk mutation surfaces hardened in the March 2026 remediation pass.

## Role resolution

- Admin users: `ADMIN_USER_IDS` (comma-separated numeric user IDs)
- Moderator users: `MODERATOR_USER_IDS` (comma-separated numeric user IDs)
- Admin checks are deny-by-default when no IDs are configured.

## HTTP mutation endpoints

| Route | Method | Authentication | Authorization rule | Test coverage |
|---|---|---|---|---|
| /api/community/suggestions | POST | Required session | Authenticated user only | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id | PUT | Required session | Suggestion owner only | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id | DELETE | Required session | Suggestion owner only | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id/feature | PATCH | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id/categories | POST | Required session | Suggestion owner only | `tests/authz-mutation-routes.test.ts` |
| /api/community/categories/:id | DELETE | Required session | Suggestion owner or admin | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id/upvote | POST | Required session | Authenticated user only | `tests/authz-mutation-routes.test.ts` |
| /api/community/suggestions/:id/comments | POST | Required session | Authenticated user only | `tests/authz-mutation-routes.test.ts` |
| /api/community/comments/:id | PUT | Required session | Comment owner or admin | `tests/authz-mutation-routes.test.ts` |
| /api/community/comments/:id | DELETE | Required session | Comment owner or admin | `tests/authz-mutation-routes.test.ts` |
| /api/civic-terms | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/civic-terms/:id | PATCH | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/civic-terms/:id | DELETE | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/infographics/templates | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/verification/rules | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/verification/users/:userId/credentials/:credentialType | PUT | Required session | Self or admin | `tests/authz-mutation-routes.test.ts` |
| /api/feedback/:id/status | PATCH | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/scout-bot-analytics/advanced-analysis | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/scout-bot-analytics/historical-trends | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/scout-bot-analytics/anomalies | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/scout-bot-analytics/anomalies/:id/review | PATCH | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |
| /api/scout-bot-analytics/reports | POST | Required session | Admin only | `tests/authz-mutation-routes.test.ts` |

## Debug endpoints

| Route | Method | Registration guard | Auth requirements | Test coverage |
|---|---|---|---|---|
| /api/debug/bills/count | GET | Disabled when `NODE_ENV=production` and `ENABLE_DEBUG_ROUTES!=true` | Authenticated + admin | `tests/authz-mutation-routes.test.ts` |
| /api/debug/bills/sample | GET | Same as above | Authenticated + admin | Covered by route-level policy in matrix |
| /api/debug/bills/validity | GET | Same as above | Authenticated + admin | Covered by route-level policy in matrix |

## WebSocket authorization surfaces

| Endpoint | Handshake auth | Server-derived identity | Client userId trust |
|---|---|---|---|
| /ws/collaborative | Session cookie (`connect.sid`) | Yes | Removed |
| /ws/bill-editing | Session cookie (`connect.sid`) | Yes | Removed |
| /ws/annotations (shared setup module) | Session cookie (`connect.sid`) | Yes | Removed |
| /ws/annotations (inline in `routes.ts`) | Session cookie (`connect.sid`) | Yes | Removed |

## Remaining auth debt to track

- Existing `@ts-nocheck` usage remains broad in request-boundary files and should continue burning down in future passes.
