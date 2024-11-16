// src/services/shared/upload.service.ts
import { v2 as cloudinary } from "cloudinary";
import { ErrorResponse } from "../../utilities/error";
import { UploadResult } from "../../utilities/upload";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
    static async uploadToCloud(
        uploadResult: UploadResult,
        folder: string = "general"
    ): Promise<string> {
        try {
            // Convert buffer to base64
            const base64File = uploadResult.buffer.toString("base64");
            const dataUri = `data:${uploadResult.mimeType};base64,${base64File}`;

            // Upload to cloudinary
            const result = await cloudinary.uploader.upload(dataUri, {
                folder: `voouch/${folder}`,
                public_id: uploadResult.fileName.split(".")[0], // Remove extension
                resource_type: "auto",
                transformation: [{ quality: "auto:good" }],
            });

            // Return the secure_url directly from Cloudinary
            return result.secure_url;
        } catch (error) {
            console.error("Upload error:", error);
            throw ErrorResponse.internal("Failed to upload file");
        }
    }

    static async deleteFromCloud(url: string): Promise<void> {
        try {
            if (!url) return;

            // Extract public_id from Cloudinary URL
            const urlParts = url.split("/");
            const versionIndex = urlParts.findIndex((part) => part.startsWith("v"));

            if (versionIndex === -1) {
                throw new Error("Invalid Cloudinary URL format");
            }

            // Get all parts after the version number, excluding the file extension
            const publicIdParts = urlParts.slice(versionIndex + 1);
            const publicId = publicIdParts.join("/").replace(/\.[^/.]+$/, ""); // Remove file extension

            console.log("Attempting to delete public_id:", publicId); // Debugging log

            try {
                const result = await cloudinary.uploader.destroy(publicId);
                console.log("Cloudinary delete result:", result); // Debugging log

            if (result.result !== "ok") {
                throw new Error(`Failed to delete image: ${result.result}`);
            }
            } catch (deleteError: any) {
                console.error("Cloudinary delete error:", deleteError);
                throw new Error(
                    deleteError.message || "Failed to delete from Cloudinary"
                );
            }
        } catch (error: any) {
            console.error("Delete error:", error);
            throw ErrorResponse.internal(`Failed to delete file: ${error.message}`);
        }
    }

    // Helper method to extract public_id from Cloudinary URL
    static getPublicIdFromUrl(url: string): string | null {
        try {
            const regex = /\/v\d+\/(.+?)(?:\.[^/.]+)?$/;
            const match = url.match(regex);
            return match ? match[1] : null;
        } catch (error) {
            console.error("Error extracting public_id:", error);
            return null;
        }
    }
}
