"use client";

import React, { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isAnalyzing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  isAnalyzing,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.endsWith(".xlsx")) {
          onFileSelect(file);
        } else {
          setError("请上传 .xlsx 格式的文件");
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.name.endsWith(".xlsx")) {
          onFileSelect(file);
        } else {
          setError("请上传 .xlsx 格式的文件");
        }
      }
    },
    [onFileSelect]
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center cursor-pointer",
          isDragging
            ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50",
          isAnalyzing && "opacity-50 pointer-events-none"
        )}
      >
        <input
          type="file"
          accept=".xlsx"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />

        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Upload size={32} />
        </div>

        <h3 className="text-xl font-semibold text-slate-800 mb-2">
          {isAnalyzing ? "正在分析数据..." : "点击或拖拽上传文件"}
        </h3>

        <p className="text-slate-600 max-w-md">
          支持 SellerSprite/领星 导出的 .xlsx 评论数据文件。
          <br />
          <span className="text-xs text-slate-500 mt-2 block">
            严禁上传非标准格式文件
          </span>
        </p>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-in fade-in slide-in-from-bottom-2">
            <X size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
