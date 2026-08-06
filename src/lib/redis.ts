import { Redis } from "@upstash/redis"

const rawUrl = process.env.UPSTASH_REDIS_REST_URL || ""
const redisUrl = rawUrl.replace(/^rediss:\/\//, "https://")

export const redis = redisUrl
  ? new Redis({
      url: redisUrl,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null
