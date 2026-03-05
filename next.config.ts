import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  outputFileTracingExcludes: {
    '*': [
      // source maps
      'node_modules/**/*.map',
      '.next/**/*.map',
      // 测试文件
      'node_modules/**/__tests__/**',
      'node_modules/**/*.test.*',
      'node_modules/**/*.spec.*',
      // 文档
      'node_modules/**/README*',
      'node_modules/**/CHANGELOG*',
      'node_modules/**/LICENSE*',
      // TypeScript 源文件（运行时不需要）
      'node_modules/**/*.d.ts',
      // Turbopack / webpack 缓存
      '.next/cache/**',
    ],
  },
  
};


export default nextConfig
