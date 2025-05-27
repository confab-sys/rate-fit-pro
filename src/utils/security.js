// Security monitoring and middleware utilities
import { logSecurityEvent } from '../firebase';

// Security configuration
const SECURITY_CONFIG = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_WINDOW: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX: 100
};

// Track failed login attempts
const failedAttempts = new Map();

// Track rate limiting
const rateLimits = new Map();

// Security monitoring
export const securityMonitor = {
  // Record failed login attempt
  recordFailedLogin: (email, ip) => {
    const key = `${email}-${ip}`;
    const attempts = failedAttempts.get(key) || { count: 0, lastAttempt: Date.now() };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    failedAttempts.set(key, attempts);

    logSecurityEvent('Failed Login Attempt', {
      email,
      ip,
      attemptCount: attempts.count
    });

    // Check if we should alert
    if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      logSecurityEvent('Security Alert: Multiple Failed Logins', {
        email,
        ip,
        attempts: attempts.count
      });
    }
  },

  // Check if account is locked
  isAccountLocked: (email, ip) => {
    const key = `${email}-${ip}`;
    const attempts = failedAttempts.get(key);
    if (!attempts) return false;

    if (attempts.count >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      const lockoutTime = attempts.lastAttempt + SECURITY_CONFIG.LOCKOUT_DURATION;
      if (Date.now() < lockoutTime) {
        return true;
      }
      // Reset if lockout period has passed
      failedAttempts.delete(key);
      return false;
    }
    return false;
  },

  // Reset failed attempts
  resetFailedAttempts: (email, ip) => {
    const key = `${email}-${ip}`;
    failedAttempts.delete(key);
    logSecurityEvent('Login Attempts Reset', { email, ip });
  },

  // Check rate limit
  checkRateLimit: (ip) => {
    const now = Date.now();
    const rateLimit = rateLimits.get(ip) || { count: 0, windowStart: now };
    
    // Reset if window has passed
    if (now - rateLimit.windowStart > SECURITY_CONFIG.RATE_LIMIT_WINDOW) {
      rateLimit.count = 0;
      rateLimit.windowStart = now;
    }

    // Increment count
    rateLimit.count += 1;
    rateLimits.set(ip, rateLimit);

    // Check if over limit
    if (rateLimit.count > SECURITY_CONFIG.RATE_LIMIT_MAX) {
      logSecurityEvent('Rate Limit Exceeded', { ip, count: rateLimit.count });
      return false;
    }

    return true;
  }
};

// Input validation
export const validateInput = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  pin: (pin) => {
    return /^[0-9]{6}$/.test(pin);
  },

  name: (name) => {
    return typeof name === 'string' && name.length >= 2 && name.length <= 50;
  },

  sanitizeString: (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[<>]/g, ''); // Basic XSS prevention
  }
};

// Security headers middleware
export const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

// Request validation middleware
export const validateRequest = (req, res, next) => {
  // Check rate limit
  const ip = req.ip;
  if (!securityMonitor.checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  // Validate content type
  if (req.headers['content-type'] !== 'application/json') {
    return res.status(400).json({ error: 'Invalid content type' });
  }

  // Validate request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = validateInput.sanitizeString(req.body[key]);
      }
    });
  }

  next();
};

// Export security configuration
export const config = SECURITY_CONFIG; 