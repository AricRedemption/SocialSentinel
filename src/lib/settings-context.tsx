"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { LLMSettings } from "@/components/SettingsDialog";

interface SettingsContextType {
  settings: LLMSettings | null;
  setSettings: (settings: LLMSettings) => void;
  isConfigured: boolean;
  connectionStatus: "success" | "error" | null;
  testConnection: () => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_SETTINGS: LLMSettings = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o",
};

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettingsState] = useState<LLMSettings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"success" | "error" | null>(null);

  const testConnectionAndSave = useCallback(async (settingsToTest: LLMSettings) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          provider: settingsToTest.provider,
          apiKey: settingsToTest.apiKey,
          baseUrl: settingsToTest.baseUrl,
          model: settingsToTest.model,
          context: "test",
        }),
      });

      const status = response.ok ? "success" : "error";
      setConnectionStatus(status);
      localStorage.setItem("llm_connection_status", status);
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
      localStorage.setItem("llm_connection_status", "error");
    }
  }, []);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("llm_settings");
    const savedStatus = localStorage.getItem("llm_connection_status");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const loadedSettings = { ...DEFAULT_SETTINGS, ...parsed };
        setSettingsState(loadedSettings);
        
        // 如果已配置 API Key，自动测试连接
        if (loadedSettings.apiKey.trim()) {
          // 先恢复保存的状态（如果有）
          if (savedStatus) {
            setConnectionStatus(savedStatus as "success" | "error" | null);
          }
          // 然后异步测试连接并更新状态
          testConnectionAndSave(loadedSettings);
        } else {
          setConnectionStatus(null);
        }
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    } else if (savedStatus) {
      // 如果没有设置但有保存的状态，清除它
      localStorage.removeItem("llm_connection_status");
      setConnectionStatus(null);
    }
  }, [testConnectionAndSave]);

  const setSettings = useCallback((newSettings: LLMSettings) => {
    localStorage.setItem("llm_settings", JSON.stringify(newSettings));
    setSettingsState(newSettings);
    // 设置保存后自动测试连接
    if (newSettings.apiKey.trim()) {
      testConnectionAndSave(newSettings);
    } else {
      setConnectionStatus(null);
      localStorage.removeItem("llm_connection_status");
    }
  }, [testConnectionAndSave]);

  const isConfigured = settings !== null && settings.apiKey.trim() !== "";

  const testConnection = async (): Promise<boolean> => {
    if (!settings || !settings.apiKey) {
      return false;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "test" }],
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          context: "test",
        }),
      });

      return response.ok;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setSettings,
        isConfigured,
        connectionStatus,
        testConnection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
};

