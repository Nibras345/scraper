import rateLimit from 'express-rate-limit';

export const strictLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 7, // Limit each IP to 7 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again after 10 minutes'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
