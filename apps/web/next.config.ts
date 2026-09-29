import type { NextConfig } from "next";
const config: NextConfig = {
  // Docker uses a minimal standalone bundle; local builds support `npm start`.
  output: process.env.BUILD_STANDALONE === "1" ? "standalone" : undefined,
  allowedDevOrigins: ["127.0.0.1"],
};
export default config;
