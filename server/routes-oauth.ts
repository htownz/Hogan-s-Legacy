/**
 * Real OAuth2 routes for Google and GitHub.
 *
 * Flow (standard Authorization Code grant):
 *   1. Client navigates to GET /api/auth/google  (or /github)
 *   2. Server redirects to the provider's consent screen
 *   3. Provider redirects back to GET /api/auth/google/callback
 *   4. Server exchanges the code for an access token, fetches profile,
 *      finds-or-creates the local user, logs them in via req.login(),
 *      and redirects to the SPA.
 *
 * Required env vars (per provider):
 *   GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
 *   GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
 *
 * If a provider's env vars are missing, its routes return 501.
 */

import { Router, Request, Response } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { hashPassword } from "./auth";
import { users } from "@shared/schema";
import { createLogger } from "./logger";

const log = createLogger("oauth");
const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCallbackUrl(req: Request, provider: string): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol;
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return `${proto}://${host}/api/auth/${provider}/callback`;
}

interface OAuthProviderConfig {
  clientId: string;
  clientSecret: string;
  authorizeUrl: string;
  tokenUrl: string;
  profileUrl: string;
  scope: string;
  parseProfile: (data: any) => { id: string; email: string; name: string; avatar?: string };
}

function googleConfig(): OAuthProviderConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    scope: "openid email profile",
    parseProfile: (data: any) => ({
      id: String(data.id),
      email: data.email,
      name: data.name || data.email,
      avatar: data.picture,
    }),
  };
}

function githubConfig(): OAuthProviderConfig | null {
  const clientId = process.env.GITHUB_CLIENT_ID?.trim();
  const clientSecret = process.env.GITHUB_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;
  return {
    clientId,
    clientSecret,
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    scope: "read:user user:email",
    parseProfile: (data: any) => ({
      id: String(data.id),
      email: data.email || `${data.login}@github.oauth`,
      name: data.name || data.login,
      avatar: data.avatar_url,
    }),
  };
}

const providers: Record<string, () => OAuthProviderConfig | null> = {
  google: googleConfig,
  github: githubConfig,
};

// ---------------------------------------------------------------------------
// Generic OAuth2 flow
// ---------------------------------------------------------------------------

/** Step 1: redirect the user to the provider's consent screen. */
function initiateOAuth(provider: string) {
  return (req: Request, res: Response) => {
    const cfg = providers[provider]?.();
    if (!cfg) {
      return res.status(501).json({
        message: `${provider} OAuth is not configured. Set ${provider.toUpperCase()}_CLIENT_ID and ${provider.toUpperCase()}_CLIENT_SECRET.`,
      });
    }

    // CSRF protection: store a random state value in the session
    const state = crypto.randomBytes(16).toString("hex");
    (req.session as any).oauthState = state;

    const params = new URLSearchParams({
      client_id: cfg.clientId,
      redirect_uri: getCallbackUrl(req, provider),
      response_type: "code",
      scope: cfg.scope,
      state,
    });

    // Google needs access_type for refresh tokens (we don't use them but it's best practice)
    if (provider === "google") {
      params.set("access_type", "offline");
      params.set("prompt", "select_account");
    }

    res.redirect(`${cfg.authorizeUrl}?${params.toString()}`);
  };
}

/** Step 2: callback — exchange code for token, fetch profile, find/create user, login. */
function handleOAuthCallback(provider: string) {
  return async (req: Request, res: Response) => {
    const cfg = providers[provider]?.();
    if (!cfg) {
      return res.redirect("/?error=oauth_not_configured");
    }

    const { code, state, error: oauthError } = req.query as Record<string, string>;

    if (oauthError) {
      log.warn({ provider, error: oauthError }, "OAuth denied by user");
      return res.redirect("/?error=oauth_denied");
    }

    // Validate CSRF state
    const expectedState = (req.session as any).oauthState;
    delete (req.session as any).oauthState;
    if (!state || !expectedState || state !== expectedState) {
      log.warn({ provider }, "OAuth state mismatch");
      return res.redirect("/?error=oauth_state_mismatch");
    }

    if (!code) {
      return res.redirect("/?error=oauth_no_code");
    }

    try {
      // Exchange code for access token
      const tokenRes = await fetch(cfg.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: new URLSearchParams({
          client_id: cfg.clientId,
          client_secret: cfg.clientSecret,
          code,
          redirect_uri: getCallbackUrl(req, provider),
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        const text = await tokenRes.text();
        log.error({ provider, status: tokenRes.status, body: text }, "Token exchange failed");
        return res.redirect("/?error=oauth_token_failed");
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        log.error({ provider, tokenData }, "No access_token in response");
        return res.redirect("/?error=oauth_no_token");
      }

      // Fetch user profile
      const profileRes = await fetch(cfg.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
      });
      if (!profileRes.ok) {
        log.error({ provider, status: profileRes.status }, "Profile fetch failed");
        return res.redirect("/?error=oauth_profile_failed");
      }

      const profileData = await profileRes.json();

      // For GitHub, email may not be in the profile — fetch from /user/emails
      if (provider === "github" && !profileData.email) {
        try {
          const emailsRes = await fetch("https://api.github.com/user/emails", {
            headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
          });
          if (emailsRes.ok) {
            const emails = await emailsRes.json();
            const primary = emails.find((e: any) => e.primary && e.verified);
            if (primary) profileData.email = primary.email;
          }
        } catch {
          // Non-fatal — fall through to parseProfile which generates a fallback
        }
      }

      const profile = cfg.parseProfile(profileData);

      // Find or create user
      const user = await findOrCreateOAuthUser(provider, profile);

      // Log the user in via passport session
      req.login(user, (err) => {
        if (err) {
          log.error({ err, provider }, "Session login failed after OAuth");
          return res.redirect("/?error=oauth_session_failed");
        }
        // Store userId in session for other middleware that reads it directly
        (req.session as any).userId = user.id;
        res.redirect("/dashboard");
      });
    } catch (err) {
      log.error({ err, provider }, "OAuth callback error");
      res.redirect("/?error=oauth_error");
    }
  };
}

/**
 * Find an existing user by OAuth provider+id, or by email.
 * If none exists, create a new account.
 */
async function findOrCreateOAuthUser(
  provider: string,
  profile: { id: string; email: string; name: string; avatar?: string },
) {
  const { db } = await import("./db");
  const { eq, and } = await import("drizzle-orm");

  // 1. Look for existing OAuth link
  const [existing] = await db
    .select()
    .from(users)
    .where(and(eq(users.oauthProvider, provider), eq(users.oauthId, profile.id)))
    .limit(1);

  if (existing) return existing;

  // 2. Look for existing user by email — link the OAuth identity
  const [byEmail] = await db
    .select()
    .from(users)
    .where(eq(users.email, profile.email))
    .limit(1);

  if (byEmail) {
    await db
      .update(users)
      .set({ oauthProvider: provider, oauthId: profile.id })
      .where(eq(users.id, byEmail.id));
    return { ...byEmail, oauthProvider: provider, oauthId: profile.id };
  }

  // 3. Create a new user
  // Generate a unique username from the name
  const baseUsername = profile.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 20) || "user";
  let username = baseUsername;
  let attempt = 0;
  while (true) {
    const taken = await storage.getUserByUsername(username);
    if (!taken) break;
    attempt++;
    username = `${baseUsername}${attempt}`;
  }

  // OAuth users get a random password (they never type it)
  const randomPw = crypto.randomBytes(32).toString("hex");
  const hashedPw = await hashPassword(randomPw);

  const [newUser] = await db
    .insert(users)
    .values({
      username,
      password: hashedPw,
      email: profile.email,
      name: profile.name,
      displayName: profile.name,
      profileImageUrl: profile.avatar || null,
      oauthProvider: provider,
      oauthId: profile.id,
    })
    .returning();

  log.info({ provider, userId: newUser.id, username }, "Created OAuth user");
  return newUser;
}

// ---------------------------------------------------------------------------
// Route definitions
// ---------------------------------------------------------------------------

// GET /api/auth/google → redirect to Google consent
router.get("/google", initiateOAuth("google"));
router.get("/google/callback", handleOAuthCallback("google"));

// GET /api/auth/github → redirect to GitHub consent
router.get("/github", initiateOAuth("github"));
router.get("/github/callback", handleOAuthCallback("github"));

// GET /api/auth/oauth/config — tell the client which providers are available
router.get("/oauth/config", (_req, res) => {
  res.json({
    google: !!process.env.GOOGLE_CLIENT_ID,
    github: !!process.env.GITHUB_CLIENT_ID,
  });
});

export default router;
