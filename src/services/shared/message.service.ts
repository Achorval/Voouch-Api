// src/services/shared/message.service.ts
import { Twilio } from 'twilio';
import { AppError } from '../../utilities/error';

export class MessageService {
  private static client = new Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

  static async sendSMS(to: string, message: string): Promise<void> {
    try {
      await this.client.messages.create({
        body: message,
        to,
        from: process.env.TWILIO_PHONE_NUMBER
      });
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new AppError('Failed to send SMS', 500);
    }
  }

  // Predefined message methods
  static async sendVerificationCode(to: string, code: string): Promise<void> {
    const message = `${process.env.APP_NAME} verification code: ${code}. Valid for 10 minutes.`;
    await this.sendSMS(to, message);
  }

  static async sendTransactionAlert(to: string, details: {
    type: string;
    amount: number;
    reference: string;
  }): Promise<void> {
    const message = `${process.env.APP_NAME}: ${details.type} transaction of ${details.amount} completed. Ref: ${details.reference}`;
    await this.sendSMS(to, message);
  }

  static async sendLoginAlert(to: string, location: string): Promise<void> {
    const message = `${process.env.APP_NAME}: New login detected from ${location}. If this wasn't you, please secure your account immediately.`;
    await this.sendSMS(to, message);
  }
}