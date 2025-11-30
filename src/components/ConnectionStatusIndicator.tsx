"use client";

import React from "react";
import { useSettings } from "@/lib/settings-context";

export const ConnectionStatusIndicator: React.FC = () => {
  const { connectionStatus, isConfigured } = useSettings();

  // 根据连接状态显示不同的指示器
  if (!isConfigured) {
    // 未配置：显示灰色点
    return (
      <div
        className="w-3 h-3 rounded-full bg-gray-400"
        title="未配置 API"
      />
    );
  }

  if (connectionStatus === "success") {
    // 连接成功：显示绿色脉冲点
    return (
      <div
        className="w-3 h-3 rounded-full bg-green-500 animate-pulse"
        title="API 连接正常"
      />
    );
  }

  if (connectionStatus === "error") {
    // 连接失败：显示红色点
    return (
      <div
        className="w-3 h-3 rounded-full bg-red-500"
        title="API 连接失败"
      />
    );
  }

  // 连接状态未知（测试中）：显示黄色点
  return (
    <div
      className="w-3 h-3 rounded-full bg-yellow-500 animate-pulse"
      title="正在测试连接..."
    />
  );
};

