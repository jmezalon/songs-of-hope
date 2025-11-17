import { NextRequest, NextResponse } from "next/server"

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting (use Redis in production)
const store: RateLimitStore = {}

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

/**
 * Simple in-memory rate limiter
 * For production, use Redis or a dedicated rate limiting service
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = {
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 60, // 60 requests per minute
  }
): Promise<{ success: boolean; remaining: number; reset: number } | NextResponse> {
  // Get client identifier (IP address or user ID)
  const forwarded = request.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown"

  const token = ip
  const now = Date.now()
  const tokenData = store[token]

  if (!tokenData || now > tokenData.resetTime) {
    // First request or reset time passed
    store[token] = {
      count: 1,
      resetTime: now + config.interval,
    }

    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - 1,
      reset: store[token].resetTime,
    }
  }

  if (tokenData.count < config.uniqueTokenPerInterval) {
    // Increment count
    tokenData.count++

    return {
      success: true,
      remaining: config.uniqueTokenPerInterval - tokenData.count,
      reset: tokenData.resetTime,
    }
  }

  // Rate limit exceeded
  return NextResponse.json(
    {
      error: "Too many requests",
      message: `Rate limit exceeded. Try again in ${Math.ceil((tokenData.resetTime - now) / 1000)} seconds.`,
    },
    {
      status: 429,
      headers: {
        "X-RateLimit-Limit": config.uniqueTokenPerInterval.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": tokenData.resetTime.toString(),
        "Retry-After": Math.ceil((tokenData.resetTime - now) / 1000).toString(),
      },
    }
  )
}

/**
 * Middleware wrapper for rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: RateLimitConfig
) {
  return async (request: NextRequest) => {
    const rateLimitResult = await rateLimit(request, config)

    if (rateLimitResult instanceof NextResponse) {
      return rateLimitResult
    }

    // Add rate limit headers to response
    const response = await handler(request)
    response.headers.set("X-RateLimit-Limit", config?.uniqueTokenPerInterval.toString() || "60")
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimitResult.reset.toString())

    return response
  }
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60 * 1000) // Clean up every minute
