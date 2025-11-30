"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Review } from "@/lib/types";
import { SettingsDialog, LLMSettings } from "./SettingsDialog";

interface ChatInterfaceProps {
  reviews: Review[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ reviews }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "您好！我是您的评论分析助手。请先点击右上角的设置按钮配置 AI 模型，然后您可以问我关于这些评论的任何问题。",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getRelevantContext = (query: string, reviews: Review[]) => {
    // Simple heuristic: take top 50 reviews that match keywords, or just top 20 if no keywords
    // In a real app, we would use vector search.
    // For now, let's just take a random sample of 30 reviews to fit in context window
    // or filter by simple keywords if possible.

    const keywords = query.split(" ").filter((k) => k.length > 1);
    let relevant = reviews;

    if (keywords.length > 0) {
      const filtered = reviews.filter((r) =>
        keywords.some((k) => r.content?.includes(k) || r.title?.includes(k))
      );
      if (filtered.length > 0) {
        relevant = filtered;
      }
    }

    // Limit to 30 reviews to avoid token limits (rough estimation)
    const sample = relevant
      .slice(0, 30)
      .map(
        (r) => `- [${r.rating}星] ${r.title}: ${r.content} (型号: ${r.variant})`
      )
      .join("\n");

    return `Total Reviews: ${reviews.length}\nSample Reviews:\n${sample}`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!settings || !settings.apiKey) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "请先配置 API Key。" },
      ]);
      return;
    }

    const userMessage = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const context = getRelevantContext(userMessage, reviews);

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages
            .concat({ role: "user", content: userMessage })
            .map((m) => ({ role: m.role, content: m.content })), // Send history
          provider: settings.provider,
          apiKey: settings.apiKey,
          baseUrl: settings.baseUrl,
          model: settings.model,
          context: context,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        assistantMessage += text;

        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = assistantMessage;
          return newMessages;
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "发生未知错误";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b py-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot size={24} className="text-blue-600" />
            <span>AI 智能问答</span>
          </div>
          <SettingsDialog onSettingsChange={setSettings} />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50"
          ref={scrollRef}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg flex gap-3 ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white border shadow-sm rounded-bl-none text-slate-900"
                }`}
              >
                {msg.role === "assistant" && (
                  <Bot size={20} className="mt-1 shrink-0 text-blue-600" />
                )}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <User size={20} className="mt-1 shrink-0 opacity-80" />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border shadow-sm p-3 rounded-lg rounded-bl-none flex items-center gap-2">
                <Bot size={20} className="text-blue-600" />
                <span className="text-sm text-slate-700 animate-pulse">
                  正在思考...
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={
                settings?.apiKey ? "输入您的问题..." : "请先配置 API Key"
              }
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-500"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
