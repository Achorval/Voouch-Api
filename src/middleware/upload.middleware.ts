// src/middleware/upload.middleware.ts
import { Request, Response } from 'express';
import multer from 'multer';
import { ErrorResponse } from '../utilities/error';
import { 
  FILE_TYPES, 
  FILE_SIZE_LIMITS, 
  UploadConfig, 
  UploadResult,
  validateMimeType,
  formatBytes,
  generateFileName 
} from '../utilities/upload';

// Configure storage
const storage = multer.memoryStorage();

// Create file filter
const createFileFilter = (config: UploadConfig) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (!validateMimeType(file.mimetype, config.allowedTypes)) {
      cb(new Error(
        `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`
      ));
      return;
    }
    cb(null, true);
  };
};

// Create upload middleware
const createUploadMiddleware = (config: UploadConfig) => {
  const upload = multer({
    storage,
    fileFilter: createFileFilter(config),
    limits: {
      fileSize: config.maxSize
    }
  });

  return async (req: Request): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const uploadHandler = upload.single(config.fieldName);
      
      uploadHandler(req as any, {} as Response, (error: any) => {
        // Handle Multer errors
        if (error instanceof multer.MulterError) {
          if (error.code === 'LIMIT_FILE_SIZE') {
            reject(ErrorResponse.badRequest(
              `File too large. Maximum size allowed is ${formatBytes(config.maxSize)}`
            ));
          } else {
            reject(ErrorResponse.badRequest(error.message));
          }
          return;
        }

        // Handle other errors
        if (error) {
          reject(ErrorResponse.badRequest(error.message));
          return;
        }

        // Check if file exists when required
        if (config.required && !req.file) {
          reject(ErrorResponse.badRequest(`${config.fieldName} is required`));
          return;
        }

        // Return empty result if no file and not required
        if (!req.file && !config.required) {
          resolve({} as UploadResult);
          return;
        }

        // Create upload result
        const result: UploadResult = {
          fieldName: req.file!.fieldname,
          originalName: req.file!.originalname,
          fileName: generateFileName(req.file!.originalname, config.fieldName),
          mimeType: req.file!.mimetype,
          size: req.file!.size,
          path: `/${config.fieldName}s/${req.file!.originalname}`,
          buffer: req.file!.buffer
        };

        resolve(result);
      });
    });
  };
};

// Predefined upload middlewares
export const handleUploadIcon = createUploadMiddleware({
  fieldName: 'icon',
  allowedTypes: [...FILE_TYPES.IMAGES], // Spread to create mutable array
  maxSize: FILE_SIZE_LIMITS.SMALL,
  required: false
});

export const uploadProviderLogo = createUploadMiddleware({
  fieldName: 'logo',
  allowedTypes: [...FILE_TYPES.IMAGES],
  maxSize: FILE_SIZE_LIMITS.MEDIUM, // 5MB as defined in your const
  required: false // Not required for updates
});


export const uploadServiceProviderLogo = createUploadMiddleware({
  fieldName: 'logo',
  allowedTypes: [...FILE_TYPES.IMAGES], // Spread to create mutable array
  maxSize: FILE_SIZE_LIMITS.MEDIUM,
  required: true
});

export const uploadUserAvatar = createUploadMiddleware({
  fieldName: 'avatar',
  allowedTypes: [...FILE_TYPES.IMAGES], // Spread to create mutable array
  maxSize: FILE_SIZE_LIMITS.SMALL,
  required: false
});

export const uploadDocument = createUploadMiddleware({
  fieldName: 'document',
  allowedTypes: [...FILE_TYPES.DOCUMENTS], // Spread to create mutable array
  maxSize: FILE_SIZE_LIMITS.LARGE,
  required: true
});