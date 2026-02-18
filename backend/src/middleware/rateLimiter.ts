import rateLimit from 'express-rate-limit';

/**
 * Rate limiter middleware to prevent API abuse.
 * Limits each IP to 6 requests per 10 minutes.
 */
export const rateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 6, // Limit each IP to 6 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests. Please try again after 10 minutes."
        });
    },
});
