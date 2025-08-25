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
import { useCVAnalysisStore } from "../../stores/cvAnalysisStore";
import type { UploadedFile } from "../../stores/cvAnalysisStore";

export function CVUploadForm() {
  const { t, isRTL } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    uploadedFiles,
    inputMethod,
    cvText,
    setUploadedFiles,
    addUploadedFile,
    removeUploadedFile,
    setInputMethod,
    setCVText,
  } = useCVAnalysisStore();

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

      newFiles.forEach((file) => addUploadedFile(file));
    },
    [addUploadedFile]
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
    removeUploadedFile(fileId);
  };

  const addTextInput = () => {
    setInputMethod("mixed");
  };

  const removeTextInput = () => {
    setInputMethod("file");
    setCVText("");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) {
      return <FileImage className="w-8 h-8 text-blue-500" />;
    }
    if (file.type === "application/pdf") {
      return <File className="w-8 h-8 text-red-500" />;
    }
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Input Method Toggle */}
      <div className="flex space-x-4 rtl:space-x-reverse">
        <button
          type="button"
          onClick={() => setInputMethod("file")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMethod === "file"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FileImage className="w-4 h-4 inline mr-2" />
          {t("services.cv_analysis.upload_files")}
        </button>
        <button
          type="button"
          onClick={() => setInputMethod("text")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMethod === "text"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <FileTextIcon className="w-4 h-4 inline mr-2" />
          {t("services.cv_analysis.paste_text")}
        </button>
        <button
          type="button"
          onClick={() => setInputMethod("mixed")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            inputMethod === "mixed"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <Plus className="w-4 h-4 inline mr-2" />
          {t("services.cv_analysis.both")}
        </button>
      </div>

      {/* File Upload Section */}
      {(inputMethod === "file" || inputMethod === "mixed") && (
        <div className="space-y-4">
          {/* Drag & Drop Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDrop={handleFileDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {t("services.cv_analysis.drag_drop_files")}
            </p>
            <p className="text-gray-500 mb-4">
              {t("services.cv_analysis.supported_formats")}
            </p>
            <button
              type="button"
              onClick={openFileDialog}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t("services.cv_analysis.choose_files")}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-medium text-gray-900">
                {t("services.cv_analysis.uploaded_files")} (
                {uploadedFiles.length})
              </h3>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      {getFileIcon(file.file)}
                      <div>
                        <p className="font-medium text-gray-900">
                          {file.file.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(file.file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
            <h3 className="text-lg font-medium text-gray-900">
              {t("services.cv_analysis.cv_text")}
            </h3>
            {inputMethod === "mixed" && (
              <button
                type="button"
                onClick={removeTextInput}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                <X className="w-4 h-4 inline mr-1" />
                {t("common.remove")}
              </button>
            )}
          </div>
          <textarea
            value={cvText}
            onChange={(e) => setCVText(e.target.value)}
            placeholder={t("services.cv_analysis.cv_text_placeholder")}
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={6}
          />
        </div>
      )}

      {/* File Type Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">
          {t("services.cv_analysis.supported_formats_title")}
        </h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• JPG/PNG: Direct analysis using OpenAI Vision API</li>
          <li>• PDF: Text extraction and analysis (coming soon)</li>
          <li>• Text: Direct analysis of pasted content</li>
        </ul>
      </div>
    </div>
  );
}
