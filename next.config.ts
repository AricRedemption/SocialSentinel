import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 默认使用 Turbopack
  // html2canvas 和 jspdf 是纯客户端库，不需要特殊的 webpack 配置
  // 如果需要使用 webpack，可以在运行时使用 --webpack 标志
};

export default nextConfig;
