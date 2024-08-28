import { env } from "@/env.mjs"

export function getURL() {
  if (env.NEXT_PUBLIC_VERCEL_URL.startsWith("localhost")) {
    return `http://${env.NEXT_PUBLIC_VERCEL_URL}`
  }

  return `https://${env.NEXT_PUBLIC_VERCEL_URL}`
}
