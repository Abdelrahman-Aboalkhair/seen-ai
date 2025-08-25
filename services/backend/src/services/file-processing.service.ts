// File Processing Service - Handles CV file uploads and text extraction

import multer from "multer";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Dynamic import for pdf-parse to avoid initialization issues
let pdfParse: any = null;

export interface FileProcessingResult {
  success: boolean;
  extractedText: string;
  error?: string;
  processingTime: number;
  fileType: string;
  fileSize: number;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  allowedTypes: string[];
  maxSize: number; // in bytes
}

export class FileProcessingService {
  private readonly allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly uploadDir = path.join(process.cwd(), "uploads");

  constructor() {
    this.ensureUploadDirectory();
  }

  /**
   * Configure multer for file uploads
   */
  getMulterConfig() {
    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, `cv-${uniqueSuffix}${extension}`);
      },
    });

    const fileFilter = (
      req: any,
      file: Express.Multer.File,
      cb: multer.FileFilterCallback
    ) => {
      if (this.allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(
          new Error(
            `Invalid file type. Allowed types: ${this.allowedMimeTypes.join(
              ", "
            )}`
          )
        );
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: this.maxFileSize,
      },
    });
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): FileValidationResult {
    if (!file) {
      return {
        isValid: false,
        error: "No file provided",
        allowedTypes: this.allowedMimeTypes,
        maxSize: this.maxFileSize,
      };
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      return {
        isValid: false,
        error: `Invalid file type: ${file.mimetype}`,
        allowedTypes: this.allowedMimeTypes,
        maxSize: this.maxFileSize,
      };
    }

    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(
          2
        )}MB. Max: ${(this.maxFileSize / 1024 / 1024).toFixed(2)}MB`,
        allowedTypes: this.allowedMimeTypes,
        maxSize: this.maxFileSize,
      };
    }

    return {
      isValid: true,
      allowedTypes: this.allowedMimeTypes,
      maxSize: this.maxFileSize,
    };
  }

  /**
   * Process uploaded CV file and extract text
   */
  async processCVFile(
    file: Express.Multer.File
  ): Promise<FileProcessingResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🔍 [File Processing] Processing file: ${file.originalname} (${file.mimetype})`
      );

      let extractedText = "";

      if (file.mimetype.startsWith("image/")) {
        extractedText = await this.extractTextFromImage(file.path);
      } else if (file.mimetype === "application/pdf") {
        extractedText = await this.extractTextFromPDF(file.path);
      } else {
        throw new Error(`Unsupported file type: ${file.mimetype}`);
      }

      const processingTime = Date.now() - startTime;

      console.log(
        `✅ [File Processing] Successfully extracted text from ${file.originalname}`,
        {
          textLength: extractedText.length,
          processingTime,
          fileType: file.mimetype,
          fileSize: file.size,
        }
      );

      return {
        success: true,
        extractedText,
        processingTime,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(
        `❌ [File Processing] Failed to process ${file.originalname}:`,
        error
      );

      return {
        success: false,
        extractedText: "",
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    } finally {
      // Clean up uploaded file
      await this.cleanupFile(file.path);
    }
  }

  /**
   * Extract text from image files using OCR
   */
  private async extractTextFromImage(imagePath: string): Promise<string> {
    try {
      console.log(`🖼️ [File Processing] Processing image with OCR...`);

      // Optimize image for better OCR results
      const optimizedImagePath = await this.optimizeImageForOCR(imagePath);

      // Extract text using Tesseract.js
      const result = await Tesseract.recognize(optimizedImagePath, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`📝 [OCR] Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      // Clean up optimized image
      await this.cleanupFile(optimizedImagePath);

      return result.data.text.trim();
    } catch (error) {
      console.error("❌ [File Processing] OCR processing failed:", error);
      throw new Error(
        `Failed to extract text from image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Extract text from PDF files
   */
  private async extractTextFromPDF(pdfPath: string): Promise<string> {
    try {
      console.log(`📄 [File Processing] Processing PDF...`);

      // Dynamically import pdf-parse to avoid initialization issues
      if (!pdfParse) {
        try {
          const pdfModule = await import("pdf-parse");
          pdfParse = pdfModule.default || pdfModule;
        } catch (importError) {
          console.error(
            "❌ [File Processing] Failed to import pdf-parse:",
            importError
          );
          throw new Error("PDF processing library not available");
        }
      }

      const dataBuffer = fs.readFileSync(pdfPath);
      const data = await pdfParse(dataBuffer);

      return data.text.trim();
    } catch (error) {
      console.error("❌ [File Processing] PDF processing failed:", error);
      throw new Error(
        `Failed to extract text from PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Optimize image for better OCR results
   */
  private async optimizeImageForOCR(imagePath: string): Promise<string> {
    try {
      const optimizedPath = imagePath.replace(/\.[^/.]+$/, "_optimized.png");

      await sharp(imagePath)
        .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
        .grayscale()
        .normalize()
        .png()
        .toFile(optimizedPath);

      return optimizedPath;
    } catch (error) {
      console.warn(
        "⚠️ [File Processing] Image optimization failed, using original:",
        error
      );
      return imagePath;
    }
  }

  /**
   * Clean up temporary files
   */
  private async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await promisify(fs.unlink)(filePath);
        console.log(
          `🧹 [File Processing] Cleaned up: ${path.basename(filePath)}`
        );
      }
    } catch (error) {
      console.warn("⚠️ [File Processing] Failed to cleanup file:", error);
    }
  }

  /**
   * Ensure upload directory exists
   */
  private ensureUploadDirectory(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(
        `📁 [File Processing] Created upload directory: ${this.uploadDir}`
      );
    }
  }

  /**
   * Get file processing statistics
   */
  getFileProcessingStats(): {
    allowedTypes: string[];
    maxFileSize: number;
    uploadDirectory: string;
  } {
    return {
      allowedTypes: this.allowedMimeTypes,
      maxFileSize: this.maxFileSize,
      uploadDirectory: this.uploadDir,
    };
  }
}
