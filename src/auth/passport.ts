/**
 * Passport Authentication Configuration
 * OAuth strategies for Google, GitHub, and local authentication
 */

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import bcrypt from "bcrypt";
import db from "../db/connection";
import { logger } from "../utils/logger";
import { v4 as uuidv4 } from "uuid";

// Type definitions
interface User {
  id: string;
  email: string;
  full_name?: string;
  access_level: string;
  github_username?: string;
  avatar_url?: string;
}

interface OAuthProfile {
  id: string;
  emails?: Array<{ value: string; verified?: boolean }>;
  displayName?: string;
  photos?: Array<{ value: string }>;
  username?: string;
  _json?: Record<string, unknown>;
}

/**
 * Serialize user for session
 */
passport.serializeUser((user: Express.User, done) => {
  const typedUser = user as User;
  done(null, typedUser.id);
});

/**
 * Deserialize user from session
 */
passport.deserializeUser(async (id: string, done) => {
  try {
    const result = await db.query(
      "SELECT id, email, full_name, access_level, github_username, avatar_url FROM users WHERE id = $1 AND is_active = true",
      [id],
    );

    if (result.rows.length === 0) {
      return done(null, false);
    }

    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

/**
 * Local Strategy - Email/Password authentication
 */
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const result = await db.query(
          "SELECT * FROM users WHERE email = $1 AND is_active = true",
          [email.toLowerCase()],
        );

        if (result.rows.length === 0) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(
          password,
          user.password_hash,
        );
        if (!validPassword) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // Update last login
        await db.query("UPDATE users SET last_login = NOW() WHERE id = $1", [
          user.id,
        ]);

        logger.info("Local authentication successful", {
          userId: user.id,
          email: user.email,
        });

        return done(null, {
          userId: user.id, // Required by JWTPayload
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          access_level: user.access_level,
          github_username: user.github_username,
          avatar_url: user.avatar_url,
        });
      } catch (error) {
        logger.error("Local authentication error", { error });
        return done(error);
      }
    },
  ),
);

/**
 * Google OAuth Strategy
 */
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
      },
      async (accessToken, refreshToken, profile: OAuthProfile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email from Google"), undefined);
          }

          // Check if OAuth account exists
          const oauthResult = await db.query(
            "SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2",
            ["google", profile.id],
          );

          let userId: string;

          if (oauthResult.rows.length > 0) {
            // Existing OAuth account
            userId = oauthResult.rows[0].user_id;

            // Update OAuth account
            await db.query(
              `UPDATE oauth_accounts
           SET access_token = $1, refresh_token = $2, display_name = $3, profile_photo = $4, raw_profile = $5
           WHERE provider = $6 AND provider_user_id = $7`,
              [
                accessToken,
                refreshToken,
                profile.displayName,
                profile.photos?.[0]?.value,
                JSON.stringify(profile._json),
                "google",
                profile.id,
              ],
            );
          } else {
            // Check if user exists by email
            const userResult = await db.query(
              "SELECT id FROM users WHERE email = $1",
              [email.toLowerCase()],
            );

            if (userResult.rows.length > 0) {
              userId = userResult.rows[0].id;
            } else {
              // Create new user
              const licenseKey = `WS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
              const newUserResult = await db.query(
                `INSERT INTO users (email, full_name, avatar_url, license_key, is_verified)
             VALUES ($1, $2, $3, $4, true)
             RETURNING id`,
                [
                  email.toLowerCase(),
                  profile.displayName,
                  profile.photos?.[0]?.value,
                  licenseKey,
                ],
              );
              userId = newUserResult.rows[0].id;
            }

            // Create OAuth account link
            await db.query(
              `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, display_name, profile_photo, access_token, refresh_token, raw_profile)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                userId,
                "google",
                profile.id,
                email,
                profile.displayName,
                profile.photos?.[0]?.value,
                accessToken,
                refreshToken,
                JSON.stringify(profile._json),
              ],
            );
          }

          // Get full user data
          const userResult = await db.query(
            "SELECT id, email, full_name, access_level, avatar_url FROM users WHERE id = $1",
            [userId],
          );

          const user = userResult.rows[0];
          logger.info("Google OAuth authentication successful", {
            userId,
            email,
          });
          done(null, {
            userId: user.id,
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            access_level: user.access_level,
            avatar_url: user.avatar_url,
          });
        } catch (error) {
          logger.error("Google OAuth error", { error });
          done(error as Error, undefined);
        }
      },
    ),
  );
}

/**
 * GitHub OAuth Strategy
 */
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL || "/api/auth/github/callback",
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: OAuthProfile,
        done: (error: Error | null, user?: Express.User) => void,
      ) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email from GitHub"), undefined);
          }

          // Check if OAuth account exists
          const oauthResult = await db.query(
            "SELECT user_id FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2",
            ["github", profile.id],
          );

          let userId: string;

          if (oauthResult.rows.length > 0) {
            // Existing OAuth account
            userId = oauthResult.rows[0].user_id;

            // Update OAuth account
            await db.query(
              `UPDATE oauth_accounts
           SET access_token = $1, display_name = $2, profile_photo = $3, raw_profile = $4
           WHERE provider = $5 AND provider_user_id = $6`,
              [
                accessToken,
                profile.displayName,
                profile.photos?.[0]?.value,
                JSON.stringify(profile._json),
                "github",
                profile.id,
              ],
            );

            // Update user's GitHub info
            await db.query(
              "UPDATE users SET github_username = $1, avatar_url = $2 WHERE id = $3",
              [profile.username, profile.photos?.[0]?.value, userId],
            );
          } else {
            // Check if user exists by email
            const userResult = await db.query(
              "SELECT id FROM users WHERE email = $1",
              [email.toLowerCase()],
            );

            if (userResult.rows.length > 0) {
              userId = userResult.rows[0].id;

              // Update GitHub info
              await db.query(
                "UPDATE users SET github_username = $1, avatar_url = $2 WHERE id = $3",
                [profile.username, profile.photos?.[0]?.value, userId],
              );
            } else {
              // Create new user
              const licenseKey = `WS-${uuidv4().substring(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
              const newUserResult = await db.query(
                `INSERT INTO users (email, full_name, github_username, avatar_url, license_key, is_verified)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING id`,
                [
                  email.toLowerCase(),
                  profile.displayName,
                  profile.username,
                  profile.photos?.[0]?.value,
                  licenseKey,
                ],
              );
              userId = newUserResult.rows[0].id;
            }

            // Create OAuth account link
            await db.query(
              `INSERT INTO oauth_accounts (user_id, provider, provider_user_id, email, display_name, profile_photo, access_token, raw_profile)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                userId,
                "github",
                profile.id,
                email,
                profile.displayName,
                profile.photos?.[0]?.value,
                accessToken,
                JSON.stringify(profile._json),
              ],
            );
          }

          // Get full user data
          const userResult = await db.query(
            "SELECT id, email, full_name, access_level, github_username, avatar_url FROM users WHERE id = $1",
            [userId],
          );

          const user = userResult.rows[0];
          logger.info("GitHub OAuth authentication successful", {
            userId,
            email,
          });
          done(null, {
            userId: user.id,
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            access_level: user.access_level,
            github_username: user.github_username,
            avatar_url: user.avatar_url,
          });
        } catch (error) {
          logger.error("GitHub OAuth error", { error });
          done(error as Error, undefined);
        }
      },
    ),
  );
}

export default passport;
