import { defineNitroConfig } from "nitro/config";

// Force Nitro to build for Vercel when running on Vercel or when NITRO_PRESET
// is explicitly set. Defaults to cloudflare-module for local/dev builds.
export default defineNitroConfig({
  preset: process.env.NITRO_PRESET || (process.env.VERCEL ? "vercel" : "cloudflare-module"),
});
