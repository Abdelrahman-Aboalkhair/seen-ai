import { useState, useRef, useCallback } from "react";
import {
  Upload,
  X,
  File,
  Trash2,
  Plus,
  FileImage,
  FileText as FileTextIcon,
} from "lucide-react";
import { useTranslation } from "../../lib/i18n";

export interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  status: "uploading" | "uploaded" | "error";
  error?: string;
}

interface CVUploadFormProps {
  uploadedFiles: UploadedFile[];
  setUploadedFiles: (
    files: UploadedFile[] | ((prev: UploadedFile[]) => UploadedFile[])
  ) => void;
  cvTexts: string[];
  setCvTexts: (texts: string[] | ((prev: string[]) => string[])) => void;
  inputMethod: "file" | "text" | "mixed";
  setInputMethod: (method: "file" | "text" | "mixed") => void;
}

export function CVUploadForm({
  uploadedFiles,
  setUploadedFiles,
  cvTexts,
  setCvTexts,
  inputMethod,
  setInputMethod,
}: CVUploadFormProps) {
  const { t, isRTL } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      console.log("📁 handleFileUpload called with:", files.length, "files");

      const newFiles: UploadedFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "uploaded" as const,
      }));

      console.log("📁 New files to add:", newFiles);

      setUploadedFiles((prev) => {
        const updated = [...prev, ...newFiles];
        console.log("📁 Updated uploadedFiles state:", updated);
        return updated;
      });
    },
    [setUploadedFiles]
  );

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const addTextInput = () => {
    setCvTexts((prev) => [...prev, ""]);
  };

  const removeTextInput = (index: number) => {
    setCvTexts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTextInput = (index: number, value: string) => {
    setCvTexts((prev) => prev.map((text, i) => (i === index ? value : text)));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="h-8 w-8 text-blue-400" />;
    } else if (file.type === "application/pdf") {
      return <FileTextIcon className="h-8 w-8 text-red-400" />;
    } else {
      return <File className="h-8 w-8 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-400 mb-2">
        {t("services.cv_analysis.upload_cv")} *
      </label>

      {/* Input Method Toggle */}
      <div className="mb-4">
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => setInputMethod("file")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputMethod === "file"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            رفع ملفات
          </button>
          <button
            type="button"
            onClick={() => setInputMethod("text")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputMethod === "text"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            إدخال نصوص
          </button>
          <button
            type="button"
            onClick={() => setInputMethod("mixed")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              inputMethod === "mixed"
                ? "bg-cyan-500 text-white"
                : "bg-slate-700 text-gray-300 hover:bg-slate-600"
            }`}
          >
            مختلط
          </button>
        </div>
      </div>

      {/* File Upload Section */}
      {(inputMethod === "file" || inputMethod === "mixed") && (
        <div className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
              isDragOver
                ? "border-cyan-500 bg-cyan-500/10"
                : "border-slate-600 hover:border-slate-500 bg-slate-900"
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
            <div
              className="cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload
                className={`h-12 w-12 mx-auto mb-4 transition-colors ${
                  isDragOver ? "text-cyan-400" : "text-gray-400"
                }`}
              />
              <p className="text-gray-300 mb-2">
                {isDragOver
                  ? "أفلت الملفات هنا"
                  : "اسحب وأفلت الملفات هنا أو انقر للاختيار"}
              </p>
              <p className="text-sm text-gray-400">
                {t("services.cv_analysis.supported_formats")} أو صور
                (JPG/PNG/WEBP)
              </p>
            </div>
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">
                الملفات المرفوعة ({uploadedFiles.length})
              </h4>
              <div className="grid gap-2">
                {uploadedFiles.map((uploadedFile) => (
                  <div
                    key={uploadedFile.id}
                    className="flex items-center justify-between p-3 bg-slate-900 border border-slate-600 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getFileIcon(uploadedFile.file)}
                      <div>
                        <p className="text-sm font-medium text-white">
                          {uploadedFile.file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatFileSize(uploadedFile.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(uploadedFile.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="حذف الملف"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Input Section */}
      {(inputMethod === "text" || inputMethod === "mixed") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">
              نصوص السير الذاتية ({cvTexts.filter((t) => t.trim()).length})
            </h4>
            <button
              onClick={addTextInput}
              className="flex items-center space-x-1 px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة نص</span>
            </button>
          </div>

          <div className="space-y-3">
            {cvTexts.map((text, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400">
                    السيرة الذاتية {index + 1}
                  </span>
                  {cvTexts.length > 1 && (
                    <button
                      onClick={() => removeTextInput(index)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="حذف النص"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={text}
                  onChange={(e) => updateTextInput(index, e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                  placeholder="انسخ والصق نص السيرة الذاتية هنا..."
                  dir={isRTL() ? "rtl" : "ltr"}
                />
                {text.trim() && (
                  <p className="text-xs text-gray-400 mt-1">
                    {text.length} حرف
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 p-3 bg-slate-900/50 rounded-lg">
        <p className="text-sm text-gray-300">
          إجمالي السير الذاتية:{" "}
          {uploadedFiles.length + cvTexts.filter((t) => t.trim()).length}
        </p>
        <p className="text-sm text-gray-400">
          التكلفة الإجمالية:{" "}
          {(uploadedFiles.length + cvTexts.filter((t) => t.trim()).length) * 5}{" "}
          كريدت
        </p>
      </div>
    </div>
  );
}
