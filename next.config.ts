import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { isServer }) {
    if (!isServer) {
      // mupdf WASM has Node.js conditional imports that need to be ignored in browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        module: false,
      }
      // Handle node: protocol imports (e.g. node:fs, node:path)
      config.plugins = config.plugins ?? []
      config.plugins.push(
        new (require('webpack').NormalModuleReplacementPlugin)(
          /^node:/,
          (resource: any) => {
            resource.request = resource.request.replace(/^node:/, '')
          }
        )
      )
    }
    return config
  },
}

export default nextConfig;
