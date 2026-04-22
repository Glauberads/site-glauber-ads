/**
 * Rate limiting utilities to prevent spam
 * Uses localStorage to track submission attempts per session
 */

const RATE_LIMIT_KEY = "glauber_leads_attempts";
const MAX_ATTEMPTS = 3;
const TIME_WINDOW = 10 * 60 * 1000; // 10 minutes

interface RateLimitData {
  attempts: number;
  resetTime: number;
}

/**
 * Check if user can submit (hasn't exceeded rate limit)
 */
export const checkRateLimit = (): boolean => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (!stored) return true;

  const data: RateLimitData = JSON.parse(stored);
  const now = Date.now();

  // Reset if time window has passed
  if (now > data.resetTime) {
    localStorage.removeItem(RATE_LIMIT_KEY);
    return true;
  }

  // Check if attempts remain
  return data.attempts < MAX_ATTEMPTS;
};

/**
 * Record a successful submission attempt
 */
export const recordAttempt = (): void => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  const now = Date.now();

  if (!stored) {
    localStorage.setItem(
      RATE_LIMIT_KEY,
      JSON.stringify({
        attempts: 1,
        resetTime: now + TIME_WINDOW,
      } as RateLimitData)
    );
  } else {
    const data: RateLimitData = JSON.parse(stored);

    // Reset if time window passed
    if (now > data.resetTime) {
      localStorage.setItem(
        RATE_LIMIT_KEY,
        JSON.stringify({
          attempts: 1,
          resetTime: now + TIME_WINDOW,
        } as RateLimitData)
      );
    } else {
      // Increment attempts
      localStorage.setItem(
        RATE_LIMIT_KEY,
        JSON.stringify({
          attempts: data.attempts + 1,
          resetTime: data.resetTime,
        } as RateLimitData)
      );
    }
  }
};

/**
 * Get remaining attempts for user
 */
export const getAttemptsRemaining = (): number => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (!stored) return MAX_ATTEMPTS;

  const data: RateLimitData = JSON.parse(stored);
  const now = Date.now();

  if (now > data.resetTime) return MAX_ATTEMPTS;
  return Math.max(0, MAX_ATTEMPTS - data.attempts);
};

/**
 * Get time remaining until rate limit resets (in minutes)
 */
export const getResetTimeRemaining = (): number => {
  const stored = localStorage.getItem(RATE_LIMIT_KEY);
  if (!stored) return 0;

  const data: RateLimitData = JSON.parse(stored);
  const now = Date.now();

  if (now > data.resetTime) return 0;

  return Math.ceil((data.resetTime - now) / 60000);
};
