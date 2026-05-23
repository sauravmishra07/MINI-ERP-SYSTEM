import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { findOrCreateUser } from "../services/auth.service";
import { authConfig } from "./auth.config";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../utils/errors/app.error";

passport.use(
  new GoogleStrategy(
    {
      clientID: authConfig.googleClientId,
      clientSecret: authConfig.googleClientSecret,
      callbackURL: authConfig.googleCallbackUrl,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new UnauthorizedError("Email not provided by Google"));
        }

        if (!email.endsWith(authConfig.allowedEmailDomain)) {
          return done(
            new ForbiddenError(
              `Only ${authConfig.allowedEmailDomain} accounts are allowed`
            )
          );
        }

        const user = await findOrCreateUser(profile);
        return done(null, user);
      } catch (error) {
        return done(error as Error);
      }
    }
  )
);

export default passport;
