import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["xlsx", "bcryptjs", "pg", "pg-native", "@prisma/adapter-pg", "@prisma/client"],
};

export default nextConfig;
