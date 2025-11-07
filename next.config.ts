import type { NextConfig } from "next";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require("./package.json");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  /* config options here */
};

export default nextConfig;
