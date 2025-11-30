"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useSettings } from "@/lib/settings-context";
import Image from "next/image";

export type LLMProvider = "openai" | "deepseek" | "claude" | "zhipu" | "doubao";

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}

const DEFAULT_SETTINGS: LLMSettings = {
  provider: "openai",
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o",
};

// 默认模型映射（当切换提供商时使用）
const DEFAULT_MODELS: Record<LLMProvider, string> = {
  openai: "gpt-4o",
  deepseek: "deepseek-chat",
  claude: "claude-sonnet-4-5-20250929",
  zhipu: "glm-4.6",
  doubao: "doubao-pro-32k",
};

const PROVIDER_DEFAULTS: Record<
  LLMProvider,
  { baseUrl: string; models: string[] }
> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    models: [
      "gpt-4o",
      "gpt-4o-mini",
      "gpt-4-turbo",
      "o1-preview",
      "o1-mini",
      "gpt-3.5-turbo",
    ],
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
  },
  claude: {
    baseUrl: "https://api.anthropic.com", // Claude SDK handles this, but we keep it for consistency
    models: [
      "claude-sonnet-4-5-20250929",
      "claude-haiku-4-5-20251001",
      "claude-opus-4-5-20251101",
      "claude-opus-4-1-20250805",
    ],
  },
  zhipu: {
    baseUrl: "https://open.bigmodel.cn/api/anthropic",
    models: ["GLM-4.6", "GLM-4.5", "GLM-4.5-air"],
  },
  doubao: {
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    models: [
      "Doubao-Seed-Code",
      "Doubao-Seed-1.6-lite",
      "Doubao-Seed-1.6",
      "Doubao-Seed-1.6-thinking",
    ],
  },
};

interface SettingsDialogProps {
  onSettingsChange?: (settings: LLMSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  onSettingsChange,
}) => {
  const {
    settings: contextSettings,
    setSettings: setContextSettings,
    testConnection,
  } = useSettings();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<LLMSettings>(
    contextSettings || DEFAULT_SETTINGS
  );
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "success" | "error" | null
  >(null);
  const [modelError, setModelError] = useState<string | null>(null);

  // Sync with context settings
  useEffect(() => {
    if (contextSettings) {
      setSettings(contextSettings);
    }
  }, [contextSettings]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 验证：如果选择自定义但模型名称为空，不允许保存
    const isCustomModel = !PROVIDER_DEFAULTS[settings.provider].models.includes(
      settings.model
    );
    if (isCustomModel && !settings.model.trim()) {
      setModelError("请输入模型名称");
      return;
    }

    setModelError(null);
    setContextSettings(settings);
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    setOpen(false);
    setConnectionStatus(null);
  };

  const handleTestConnection = async () => {
    if (!settings.apiKey.trim()) {
      setConnectionStatus("error");
      return;
    }

    setIsTesting(true);
    setConnectionStatus(null);

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

      if (response.ok) {
        setConnectionStatus("success");
      } else {
        setConnectionStatus("error");
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
    } finally {
      setIsTesting(false);
    }
  };

  const handleProviderChange = (val: LLMProvider) => {
    setSettings((prev) => ({
      ...prev,
      provider: val,
      baseUrl: PROVIDER_DEFAULTS[val].baseUrl,
      model: DEFAULT_MODELS[val],
    }));
    setModelError(null); // 切换提供商时清除错误
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          title="设置"
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
        >
          <Settings className="h-4 w-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] !rounded-xl !border-slate-200 !bg-white !text-slate-900 !shadow-sm dark:!bg-white dark:!border-slate-200 dark:!text-slate-900">
        <DialogHeader>
          <DialogTitle className="text-slate-900">AI 模型设置</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="provider" className="text-right text-slate-700">
                提供商
              </Label>
              <Select
                value={settings.provider}
                onValueChange={(val) =>
                  handleProviderChange(val as LLMProvider)
                }
              >
                <SelectTrigger className="col-span-3 !bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent className="!bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900">
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="deepseek">DeepSeek</SelectItem>
                  <SelectItem value="claude">Claude (Anthropic)</SelectItem>
                  <SelectItem value="zhipu">智谱 AI (Zhipu)</SelectItem>
                  <SelectItem value="doubao">豆包 (Doubao)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="apiKey" className="text-right text-slate-700">
                API Key
              </Label>
              <Input
                id="apiKey"
                type="password"
                value={settings.apiKey}
                onChange={(e) =>
                  setSettings({ ...settings, apiKey: e.target.value })
                }
                className="col-span-3 !bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900"
                placeholder="sk-..."
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="baseUrl" className="text-right text-slate-700">
                Base URL
              </Label>
              <Input
                id="baseUrl"
                value={settings.baseUrl}
                onChange={(e) =>
                  setSettings({ ...settings, baseUrl: e.target.value })
                }
                className="col-span-3 !bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900"
                placeholder="https://api.openai.com/v1"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="model" className="text-right text-slate-700">
                模型
              </Label>
              <div className="col-span-3 space-y-2">
                <Select
                  value={
                    PROVIDER_DEFAULTS[settings.provider].models.includes(
                      settings.model
                    )
                      ? settings.model
                      : "custom"
                  }
                  onValueChange={(val) => {
                    if (val !== "custom") {
                      setSettings({ ...settings, model: val });
                      setModelError(null); // 选择预设模型时清除错误
                    } else {
                      // 切换到自定义时，清空模型名称，让用户输入
                      setSettings({ ...settings, model: "" });
                      setModelError(null); // 切换时清除之前的错误
                    }
                  }}
                >
                  <SelectTrigger className="!bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900">
                    <SelectValue placeholder="选择或输入模型" />
                  </SelectTrigger>
                  <SelectContent className="!bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900">
                    {PROVIDER_DEFAULTS[settings.provider].models.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">自定义 (手动输入)</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={settings.model}
                  onChange={(e) => {
                    setSettings({ ...settings, model: e.target.value });
                    setModelError(null); // 输入时清除错误
                  }}
                  disabled={PROVIDER_DEFAULTS[
                    settings.provider
                  ].models.includes(settings.model)}
                  className={`!bg-white !border-slate-200 !text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-900 disabled:!bg-slate-50 disabled:!cursor-not-allowed disabled:!opacity-70 ${
                    modelError ? "!border-red-300 !ring-red-200" : ""
                  }`}
                  placeholder="输入模型名称，例如 gpt-4o-mini"
                />
                {modelError && (
                  <p className="text-sm text-red-600 mt-1">{modelError}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleTestConnection}
                disabled={isTesting || !settings.apiKey.trim()}
                className="!bg-white !border-slate-200 !text-slate-700 hover:!bg-slate-50 hover:!text-slate-900 dark:!bg-white dark:!border-slate-200 dark:!text-slate-700"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    测试中...
                  </>
                ) : (
                  "测试连接"
                )}
              </Button>
              {connectionStatus === "success" && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  连接成功
                </div>
              )}
              {connectionStatus === "error" && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <XCircle className="h-4 w-4" />
                  连接失败
                </div>
              )}
            </div>
            <Button
              type="submit"
              className="!bg-blue-600 !text-white hover:!bg-blue-700 dark:!bg-blue-600 dark:!text-white"
            >
              保存设置
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
