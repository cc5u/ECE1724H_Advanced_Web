import type { NextConfig } from "next";

const rawMlApiUrl =
  process.env.ML_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_ML_API_URL?.trim() ||
  "http://localhost:8000/model_api";

let mlApiRewrite:
  | {
      source: string;
      destination: string;
    }
  | null = null;

try {
  const parsedMlApiUrl = new URL(rawMlApiUrl);
  const proxyPath = parsedMlApiUrl.pathname.replace(/\/$/, "") || "/model_api";

  mlApiRewrite = {
    source: `${proxyPath}/:path*`,
    destination: `${parsedMlApiUrl.origin}${proxyPath}/:path*`,
  };
} catch {
  mlApiRewrite = null;
}

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return mlApiRewrite ? [mlApiRewrite] : [];
  },
};

export default nextConfig;
