import rateLimit from 'express-rate-limit';

/**
 * Throttles the auth endpoints (register/login) per IP to blunt
 * brute-force / credential-stuffing attempts against passwords.
 *
 * Built as a factory (not a module-level singleton) so each app instance
 * gets its own counter store — otherwise every `createApp()` call (e.g.
 * one per test) would share global request counts.
 */
export function createAuthRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'TooManyRequestsError',
      message: 'Muitas tentativas. Tente novamente mais tarde.',
    },
  });
}
