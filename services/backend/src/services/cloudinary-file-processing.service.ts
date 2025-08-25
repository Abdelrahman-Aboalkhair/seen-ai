// Cloudinary File Processing Service - Cloud-based file handling

import { v2 as cloudinary } from "cloudinary";
import cloudinaryConfig from "@/config/cloudinary.config.js";
import fs from "fs";
import path from "path";
import { promisify } from "util";

export interface CloudinaryFileResult {
  success: boolean;
  extractedText: string;
  cloudinaryUrl?: string;
  publicId?: string;
  error?: string;
  processingTime: number;
  fileType: string;
  fileSize: number;
  pageCount?: number;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  resourceType?: "image" | "raw" | "video" | "auto";
  transformation?: any[];
  eager?: any[];
  eagerAsync?: boolean;
}

export class CloudinaryFileProcessingService {
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
  ];

  constructor() {
    if (!cloudinaryConfig.isConfigured()) {
      console.warn(
        "⚠️ [Cloudinary] Configuration incomplete. Some features may not work."
      );
    }
  }

  /**
   * Process CV file using Cloudinary
   */
  async processCVFile(
    file: Express.Multer.File
  ): Promise<CloudinaryFileResult> {
    const startTime = Date.now();

    try {
      console.log(`☁️ [Cloudinary] Processing file: ${file.originalname}`);

      // Validate file
      if (!this.isValidFile(file)) {
        throw new Error(`Invalid file type: ${file.mimetype}`);
      }

      let extractedText = "";
      let cloudinaryUrl = "";
      let publicId = "";
      let pageCount = 1;

      if (file.mimetype.startsWith("image/")) {
        // Process image files
        const result = await this.processImageFile(file);
        extractedText = result.extractedText;
        cloudinaryUrl = result.cloudinaryUrl;
        publicId = result.publicId;
      } else if (file.mimetype === "application/pdf") {
        // Process PDF files
        try {
          const result = await this.processPDFFile(file);
          extractedText = result.extractedText;
          cloudinaryUrl = result.cloudinaryUrl;
          publicId = result.publicId;
          pageCount = result.pageCount || 1;
        } catch (cloudinaryError) {
          console.warn(
            "⚠️ [Cloudinary] PDF processing failed, falling back to local processing:",
            cloudinaryError
          );

          // Fallback to local PDF processing
          const localResult = await this.processPDFLocally(file);
          extractedText = localResult.extractedText;
          cloudinaryUrl = ""; // No Cloudinary URL for local processing
          publicId = ""; // No public ID for local processing
          pageCount = localResult.pageCount || 1;
        }
      }

      const processingTime = Date.now() - startTime;

      console.log(
        `✅ [Cloudinary] Successfully processed ${file.originalname}`
      );

      // Clean up local file
      await this.cleanupLocalFile(file.path);

      return {
        success: true,
        extractedText,
        cloudinaryUrl,
        publicId,
        processingTime,
        fileType: file.mimetype,
        fileSize: file.size,
        pageCount,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(
        `❌ [Cloudinary] Failed to process ${file.originalname}:`,
        error
      );

      // Clean up local file even if processing failed
      if (file.path) await this.cleanupLocalFile(file.path);

      return {
        success: false,
        extractedText: "",
        error: error instanceof Error ? error.message : "Unknown error",
        processingTime,
        fileType: file.mimetype,
        fileSize: file.size,
      };
    }
  }

  /**
   * Process image files with Cloudinary
   */
  private async processImageFile(file: Express.Multer.File): Promise<{
    extractedText: string;
    cloudinaryUrl: string;
    publicId: string;
  }> {
    try {
      // Processing image file...

      // Upload image to Cloudinary with OCR optimization
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "cv-uploads/images",
        resource_type: "image",
        transformation: [
          { width: 2000, height: 2000, crop: "limit" },
          { effect: "grayscale" },
          { quality: "auto:good" },
        ],
        eager: [
          {
            width: 2000,
            height: 2000,
            crop: "limit",
            effect: "grayscale",
            quality: "auto:best",
          },
        ],
        eager_async: false,
      });

      // Image uploaded successfully

      // Extract text using Cloudinary OCR (if available) or fallback to Tesseract
      let extractedText = "";
      try {
        // Try Cloudinary OCR first
        extractedText = await this.extractTextWithCloudinaryOCR(
          uploadResult.public_id
        );
      } catch (ocrError) {
        console.warn(
          "⚠️ [Cloudinary] OCR failed, using fallback method:",
          ocrError
        );
        // Fallback to Tesseract if Cloudinary OCR fails
        extractedText = await this.extractTextWithTesseract(file.path);
      }

      return {
        extractedText,
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      console.error("❌ [Cloudinary] Image processing failed:", error);
      throw error;
    }
  }

  /**
   * Process PDF files with Cloudinary
   */
  private async processPDFFile(file: Express.Multer.File): Promise<{
    extractedText: string;
    cloudinaryUrl: string;
    publicId: string;
    pageCount: number;
  }> {
    try {
      // Processing PDF file...

      // Upload PDF to Cloudinary with better transformation settings
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: "cv-uploads/pdfs",
        resource_type: "raw",
        format: "pdf",
        transformation: [{ quality: "auto:good" }],
        eager: [
          {
            width: 2480, // A4 width at 300 DPI
            height: 3508, // A4 height at 300 DPI
            crop: "limit",
            effect: "grayscale",
            quality: "auto:best",
            format: "png",
            page: "all", // Convert all pages to images
          },
        ],
        eager_async: false,
      });

      console.log("☁️ [Cloudinary] PDF uploaded successfully:", {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
      });

      // Extract text from PDF using Cloudinary transformations
      const extractedText = await this.extractTextFromPDFPages(
        uploadResult.public_id
      );

      return {
        extractedText,
        cloudinaryUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        pageCount: uploadResult.pages || 1,
      };
    } catch (error) {
      console.error("❌ [Cloudinary] PDF processing failed:", error);
      throw error;
    }
  }

  /**
   * Extract text using Cloudinary OCR
   */
  private async extractTextWithCloudinaryOCR(
    publicId: string
  ): Promise<string> {
    try {
      // Use Cloudinary's OCR capabilities
      const ocrResult = await cloudinary.api.resource(publicId, {
        ocr: "adv_ocr",
      });

      if (
        ocrResult.ocr &&
        ocrResult.ocr.adv_ocr &&
        ocrResult.ocr.adv_ocr.data
      ) {
        const textBlocks = ocrResult.ocr.adv_ocr.data.map(
          (block: any) => block.text
        );
        return textBlocks.join(" ").trim();
      }

      throw new Error("No OCR data available from Cloudinary");
    } catch (error) {
      console.warn("⚠️ [Cloudinary] OCR extraction failed:", error);
      throw error;
    }
  }

  /**
   * Extract text from PDF pages using Cloudinary transformations
   */
  private async extractTextFromPDFPages(publicId: string): Promise<string> {
    try {
      // Get PDF info to determine page count
      const pdfInfo = await cloudinary.api.resource(publicId, {
        resource_type: "raw",
      });

      const pageCount = pdfInfo.pages || 1;
      console.log(`📄 [Cloudinary] PDF has ${pageCount} pages`);

      const allTexts: string[] = [];

      // Process each page
      for (let page = 1; page <= pageCount; page++) {
        try {
          console.log(
            `📄 [Cloudinary] Processing page ${page}/${pageCount}...`
          );

          // Create page-specific transformation with better settings
          const pageUrl = cloudinary.url(publicId, {
            resource_type: "raw",
            transformation: [
              { page: page },
              { width: 2480, height: 3508, crop: "limit" }, // A4 dimensions
              { effect: "grayscale" },
              { quality: "auto:best" },
              { format: "png" },
            ],
          });

          console.log(`🖼️ [Cloudinary] Generated page URL: ${pageUrl}`);

          // Extract text from this page
          const pageText = await this.extractTextWithTesseractFromUrl(pageUrl);
          if (pageText.trim()) {
            allTexts.push(`--- Page ${page} ---\n${pageText}`);
            console.log(
              `✅ [Cloudinary] Page ${page} processed successfully, text length: ${pageText.length}`
            );
          } else {
            console.warn(`⚠️ [Cloudinary] Page ${page} produced no text`);
          }
        } catch (pageError) {
          console.warn(
            `⚠️ [Cloudinary] Failed to process page ${page}:`,
            pageError
          );
        }
      }

      if (allTexts.length === 0) {
        throw new Error("No text could be extracted from any PDF pages");
      }

      console.log(
        `✅ [Cloudinary] Successfully processed ${allTexts.length} pages`
      );
      return allTexts.join("\n\n");
    } catch (error) {
      console.error("❌ [Cloudinary] PDF text extraction failed:", error);
      throw error;
    }
  }

  /**
   * Fallback: Extract text using Tesseract from local file
   */
  private async extractTextWithTesseract(filePath: string): Promise<string> {
    try {
      // Dynamic import to avoid initialization issues
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng");
      const {
        data: { text },
      } = await worker.recognize(filePath);
      await worker.terminate();

      return text.trim();
    } catch (error) {
      console.error("❌ [Tesseract] OCR failed:", error);
      throw new Error("Failed to extract text from image");
    }
  }

  /**
   * Fallback: Process PDF locally if Cloudinary fails
   */
  private async processPDFLocally(file: Express.Multer.File): Promise<{
    extractedText: string;
    pageCount: number;
  }> {
    try {
      console.log("🔄 [Local Fallback] Processing PDF locally...");

      // Use the original file processing approach
      const { FileProcessingService } = await import(
        "./file-processing.service.js"
      );
      const localService = new FileProcessingService();

      const result = await localService.processCVFile(file);

      if (!result.success) {
        throw new Error(`Local PDF processing failed: ${result.error}`);
      }

      console.log("✅ [Local Fallback] PDF processed successfully locally");

      return {
        extractedText: result.extractedText,
        pageCount: 1, // Assume single page for local processing
      };
    } catch (error) {
      console.error("❌ [Local Fallback] Local PDF processing failed:", error);
      throw error;
    }
  }

  /**
   * Fallback: Extract text using Tesseract from URL
   */
  private async extractTextWithTesseractFromUrl(url: string): Promise<string> {
    try {
      console.log(`🔍 [Tesseract] Starting OCR for URL: ${url}`);

      // Dynamic import to avoid initialization issues
      const { createWorker } = await import("tesseract.js");

      const worker = await createWorker("eng");
      console.log("🔧 [Tesseract] Worker created, starting recognition...");

      const {
        data: { text },
      } = await worker.recognize(url);

      console.log(`✅ [Tesseract] OCR completed, text length: ${text.length}`);
      await worker.terminate();

      return text.trim();
    } catch (error) {
      console.error("❌ [Tesseract] OCR from URL failed:", error);

      // Try alternative approach: download image first, then process locally
      try {
        console.log(
          "🔄 [Tesseract] Trying alternative approach: download image first..."
        );
        const axios = await import("axios");
        const response = await axios.default.get(url, {
          responseType: "arraybuffer",
        });
        const buffer = Buffer.from(response.data);

        // Save to temp file
        const tempPath = path.join(
          process.cwd(),
          "temp",
          `temp_image_${Date.now()}.png`
        );
        fs.writeFileSync(tempPath, buffer);

        // Process with Tesseract
        const { createWorker } = await import("tesseract.js");
        const worker = await createWorker("eng");
        const {
          data: { text },
        } = await worker.recognize(tempPath);
        await worker.terminate();

        // Clean up temp file
        await this.cleanupLocalFile(tempPath);

        console.log(
          `✅ [Tesseract] Alternative approach succeeded, text length: ${text.length}`
        );
        return text.trim();
      } catch (altError) {
        console.error(
          "❌ [Tesseract] Alternative approach also failed:",
          altError
        );
        throw new Error(
          "Failed to extract text from image URL using multiple methods"
        );
      }
    }
  }

  /**
   * Validate uploaded file
   */
  private isValidFile(file: Express.Multer.File): boolean {
    if (!file) return false;
    if (!this.allowedMimeTypes.includes(file.mimetype)) return false;
    if (file.size > this.maxFileSize) return false;
    return true;
  }

  /**
   * Clean up local file
   */
  private async cleanupLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await promisify(fs.unlink)(filePath);
        console.log(
          `🧹 [Cloudinary] Cleaned up local file: ${path.basename(filePath)}`
        );
      }
    } catch (error) {
      console.warn("⚠️ [Cloudinary] Failed to cleanup local file:", error);
    }
  }

  /**
   * Get file processing statistics
   */
  getFileProcessingStats(): {
    allowedTypes: string[];
    maxFileSize: number;
    cloudinaryConfigured: boolean;
  } {
    return {
      allowedTypes: this.allowedMimeTypes,
      maxFileSize: this.maxFileSize,
      cloudinaryConfigured: cloudinaryConfig.isConfigured(),
    };
  }

  /**
   * Configure multer for file uploads (compatibility with existing routes)
   */
  async getMulterConfig() {
    const multerModule = await import("multer");
    const multer = multerModule.default;

    const storage = multer.diskStorage({
      destination: (req: any, file: any, cb: any) => {
        // Use temp directory for Cloudinary processing
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        cb(null, tempDir);
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        cb(null, `cv-${uniqueSuffix}${extension}`);
      },
    });

    const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
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
   * Validate uploaded file (compatibility with existing routes)
   */
  validateFile(file: Express.Multer.File): {
    isValid: boolean;
    error?: string;
    allowedTypes: string[];
    maxSize: number;
  } {
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
}
