// src/utilities/upload.ts
import path from "path";

export const FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/png", "image/webp", "image/gif"] as string[],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as string[],
  ALL: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ] as string[],
} as const;

export const FILE_SIZE_LIMITS = {
  TINY: 1 * 1024 * 1024, // 1MB
  SMALL: 2 * 1024 * 1024, // 2MB
  MEDIUM: 5 * 1024 * 1024, // 5MB
  LARGE: 10 * 1024 * 1024, // 10MB
} as const;

export interface UploadConfig {
  fieldName: string;
  allowedTypes: string[];
  maxSize: number;
  required?: boolean;
}

export interface UploadResult {
  fieldName: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  path: string;
  buffer: Buffer;
}

export const generateFileName = (
  originalName: string,
  prefix: string = ""
): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  const extension = path.extname(originalName);
  return `${prefix}${timestamp}-${random}${extension}`;
};

export const validateMimeType = (
  mimeType: string,
  allowedTypes: string[]
): boolean => {
  return allowedTypes.includes(mimeType);
};

export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};
