import multer from "multer";
import Tesseract from "tesseract.js";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { promisify } from "util";

// Dynamic import for pdf2pic to avoid initialization issues
let pdf2pic: any = null;

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
  private readonly tempDir = path.join(process.cwd(), "temp");

  constructor() {
    this.ensureUploadDirectory();
    this.ensureTempDirectory();
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
        // Clean up image file after processing
        if (file.path) await this.cleanupFile(file.path);
      } else if (file.mimetype === "application/pdf") {
        console.log("🔍 [File Processing] Processing PDF file:", file.mimetype);
        extractedText = await this.extractTextFromPDF(file.path);
        // PDF file cleanup is handled inside extractTextFromPDF after conversion
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

      // Clean up file even if processing failed
      if (file.path) await this.cleanupFile(file.path);

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
      console.log("ocr result: ", result);

      // Clean up optimized image
      // await this.cleanupFile(optimizedImagePath);

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
   * Extract text from PDF files by converting to images first
   */
  private async extractTextFromPDF(pdfPath: string): Promise<string> {
    try {
      console.log(
        `📄 [File Processing] Processing PDF by converting to images...`
      );

      // Convert PDF to images
      const imagePaths = await this.convertPDFToImages(pdfPath);

      if (imagePaths.length === 0) {
        throw new Error("Failed to convert PDF to images");
      }

      console.log(
        `🖼️ [File Processing] Converted PDF to ${imagePaths.length} images`
      );

      // Extract text from each image using OCR
      const allTexts: string[] = [];

      for (let i = 0; i < imagePaths.length; i++) {
        const imagePath = imagePaths[i];
        console.log(
          `📝 [File Processing] Processing page ${i + 1}/${imagePaths.length}`
        );

        try {
          const pageText = await this.extractTextFromImage(imagePath);
          if (pageText.trim()) {
            allTexts.push(`--- Page ${i + 1} ---\n${pageText}`);
          }
        } catch (error) {
          console.warn(
            `⚠️ [File Processing] Failed to process page ${i + 1}:`,
            error
          );
        }

        // Clean up page image
        // await this.cleanupFile(imagePath);
      }

      if (allTexts.length === 0) {
        throw new Error("No text could be extracted from any PDF pages");
      }

      const combinedText = allTexts.join("\n\n");
      console.log(
        `✅ [File Processing] Successfully extracted text from ${imagePaths.length} PDF pages`
      );

      // Clean up the original PDF file after successful conversion
      // await this.cleanupFile(pdfPath);

      return combinedText;
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
   * Convert PDF to images using pdf2pic
   */
  private async convertPDFToImages(pdfPath: string): Promise<string[]> {
    try {
      // Dynamically import pdf2pic to avoid initialization issues
      if (!pdf2pic) {
        try {
          const pdf2picModule = await import("pdf2pic");
          pdf2pic = pdf2picModule.fromPath;
        } catch (importError) {
          console.error(
            "❌ [File Processing] Failed to import pdf2pic:",
            importError
          );
          throw new Error("PDF to image conversion library not available");
        }
      }

      // Configure pdf2pic
      const options = {
        density: 300, // Higher density for better OCR results
        saveFilename: "page",
        savePath: this.tempDir,
        format: "png",
        width: 2480, // A4 width at 300 DPI
        height: 3508, // A4 height at 300 DPI
      };

      const convert = pdf2pic(pdfPath, options);

      // Get PDF info to determine number of pages
      const pdfInfo = await convert.bulk(-1, { responseType: "array" });
      const pageCount = pdfInfo?.length || 0;

      console.log(`📄 [File Processing] PDF has ${pageCount} pages`);

      // Convert all pages to images
      const imagePaths: string[] = [];

      for (let i = 1; i <= pageCount; i++) {
        try {
          const result = await convert(i, { responseType: "array" });
          if (result && result.length > 0 && result[0]) {
            const imagePath = path.join(this.tempDir, `page_${i}.png`);
            // Save the image data
            fs.writeFileSync(imagePath, result[0]);
            imagePaths.push(imagePath);
            console.log(`✅ [File Processing] Converted page ${i} to image`);
          }
        } catch (error) {
          console.warn(
            `⚠️ [File Processing] Failed to convert page ${i}:`,
            error
          );
        }
      }

      return imagePaths;
    } catch (error) {
      console.error(
        "❌ [File Processing] PDF to image conversion failed:",
        error
      );
      throw new Error(
        `Failed to convert PDF to images: ${
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
   * Ensure temp directory exists
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
      console.log(
        `📁 [File Processing] Created temp directory: ${this.tempDir}`
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
    tempDirectory: string;
  } {
    return {
      allowedTypes: this.allowedMimeTypes,
      maxFileSize: this.maxFileSize,
      uploadDirectory: this.uploadDir,
      tempDirectory: this.tempDir,
    };
  }
}
