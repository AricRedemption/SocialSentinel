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
import { Settings } from "lucide-react";

export type LLMProvider = "openai" | "deepseek" | "claude";

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

const PROVIDER_DEFAULTS: Record<
  LLMProvider,
  { baseUrl: string; models: string[] }
> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    models: ["deepseek-chat", "deepseek-coder"],
  },
  claude: {
    baseUrl: "https://api.anthropic.com", // Claude SDK handles this, but we keep it for consistency
    models: [
      "claude-3-5-sonnet-20240620",
      "claude-3-opus-20240229",
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307",
    ],
  },
};

interface SettingsDialogProps {
  onSettingsChange: (settings: LLMSettings) => void;
}

export const SettingsDialog: React.FC<SettingsDialogProps> = ({
  onSettingsChange,
}) => {
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("llm_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        onSettingsChange({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, [onSettingsChange]);

  const handleSave = () => {
    localStorage.setItem("llm_settings", JSON.stringify(settings));
    onSettingsChange(settings);
    setOpen(false);
  };

  const handleProviderChange = (val: LLMProvider) => {
    setSettings((prev) => ({
      ...prev,
      provider: val,
      baseUrl: PROVIDER_DEFAULTS[val].baseUrl,
      model: PROVIDER_DEFAULTS[val].models[0],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="设置">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI 模型设置</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="provider" className="text-right">
              提供商
            </Label>
            <Select
              value={settings.provider}
              onValueChange={(val) => handleProviderChange(val as LLMProvider)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="deepseek">DeepSeek</SelectItem>
                <SelectItem value="claude">Claude (Anthropic)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={settings.apiKey}
              onChange={(e) =>
                setSettings({ ...settings, apiKey: e.target.value })
              }
              className="col-span-3"
              placeholder="sk-..."
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="baseUrl" className="text-right">
              Base URL
            </Label>
            <Input
              id="baseUrl"
              value={settings.baseUrl}
              onChange={(e) =>
                setSettings({ ...settings, baseUrl: e.target.value })
              }
              className="col-span-3"
              placeholder="https://api.openai.com/v1"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="model" className="text-right">
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
                  } else {
                    // If switching to custom, keep current value but allow edit
                    // or maybe clear it? Let's keep it simple:
                    // If they select custom, we don't change the text input immediately
                    // but we need a way to show the text input.
                    // Actually, let's just make the Select update the text input
                    // and have the text input always be the source of truth.
                    // But standard UI pattern for "Select or Type" is tricky.
                    // Let's use a ComboBox or just a Select that populates an Input.
                    setSettings({ ...settings, model: "" });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择或输入模型" />
                </SelectTrigger>
                <SelectContent>
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
                onChange={(e) =>
                  setSettings({ ...settings, model: e.target.value })
                }
                placeholder="输入模型名称，例如 gpt-4o-mini"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>保存设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
