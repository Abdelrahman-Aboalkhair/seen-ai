// Cloudinary Configuration Service

import { v2 as cloudinary } from "cloudinary";

export class CloudinaryConfig {
  private static instance: CloudinaryConfig;

  private constructor() {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.CLOUD_API_KEY,
      api_secret: process.env.CLOUD_API_SECRET,
    });

    console.log("☁️ [Cloudinary] Configuration initialized:", {
      cloudName: process.env.CLOUD_NAME,
      hasApiKey: !!process.env.CLOUD_API_KEY,
      hasApiSecret: !!process.env.CLOUD_API_SECRET,
    });
  }

  public static getInstance(): CloudinaryConfig {
    if (!CloudinaryConfig.instance) {
      CloudinaryConfig.instance = new CloudinaryConfig();
    }
    return CloudinaryConfig.instance;
  }

  public getCloudinary() {
    return cloudinary;
  }

  public isConfigured(): boolean {
    return !!(
      process.env.CLOUD_NAME &&
      process.env.CLOUD_API_KEY &&
      process.env.CLOUD_API_SECRET
    );
  }
}

export default CloudinaryConfig.getInstance();
