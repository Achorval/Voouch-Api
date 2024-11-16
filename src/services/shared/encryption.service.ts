// src/controllers/auth/encryption.controller.ts
import crypto from "crypto";

export class EncryptionService {
  private static readonly algorithm = "aes-256-gcm";
  private static readonly keyLength = 32; // 256 bits
  private static readonly ivLength = 16; // 128 bits
  private static readonly authTagLength = 16;

  private static readonly encryptionKey = process.env.ENCRYPTION_KEY;

  /**
   * Encrypt sensitive card data
   */
  static async encryptCard(data: {
    number: string;
    cvv: string;
  }): Promise<{ number: string; cvv: string }> {
    return {
      number: await this.encrypt(data.number),
      cvv: await this.encrypt(data.cvv),
    };
  }

  /**
   * Decrypt card data
   */
  static async decryptCard(data: {
    number: string;
    cvv: string;
  }): Promise<{ number: string; cvv: string }> {
    return {
      number: await this.decrypt(data.number),
      cvv: await this.decrypt(data.cvv),
    };
  }

  /**
   * Encrypt data
   */
  private static async encrypt(text: string): Promise<string> {
    // Generate initialization vector
    const iv = crypto.randomBytes(this.ivLength);

    // Check if encryptionKey is define
    if (!this.encryptionKey) {
      throw new Error('Encryption key is not defined');
    }

    // Create cipher
    const cipher = crypto.createCipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, "hex"),
      iv
    );

    // Encrypt the data
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get auth tag
    const authTag = cipher.getAuthTag();

    // Combine IV, encrypted data, and auth tag
    return Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]).toString(
      "base64"
    );
  }

  /**
   * Decrypt data
   */
  private static async decrypt(encryptedData: string): Promise<string> {
    // Convert base64 to buffer
    const buffer = Buffer.from(encryptedData, "base64");

    // Extract IV, auth tag, and encrypted text
    const iv = buffer.slice(0, this.ivLength);
    const authTag = buffer.slice(
      this.ivLength,
      this.ivLength + this.authTagLength
    );
    const encryptedText = buffer.slice(this.ivLength + this.authTagLength);

    // Check if encryptionKey is define
    if (!this.encryptionKey) {
      throw new Error('Encryption key is not defined');
    }

    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      Buffer.from(this.encryptionKey, "hex"),
      iv
    );

    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  }
}
