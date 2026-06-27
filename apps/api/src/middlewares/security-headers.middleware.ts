import type { RequestHandler } from "express";

export function createSecurityHeadersMiddleware(): RequestHandler {
  return (_req, res, next) => {
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'"
    );
    next();
  };
}

export const securityHeaders = createSecurityHeadersMiddleware();
