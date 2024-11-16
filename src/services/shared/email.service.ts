// src/services/shared/email.service.ts
import nodemailer, { Transporter, TransportOptions } from "nodemailer";
// import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { AppError } from "../../utilities/error";
import { formatAmount, formatPaymentMethod } from "../../utilities/helper";

export class EmailService {
  private static transporter: Transporter = nodemailer.createTransport({
    service: process.env.SMTP_SERVICE, // e.g., 'gmail', 'sendgrid'
    // If not using a predefined service, use host and port:
    /* 
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // true for 465, false for other ports
    */
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  } as SMTPTransport.Options);

  // private static transporter: Transporter = createTransport({
  //   host: process.env.SMTP_HOST,
  //   port: process.env.SMTP_PORT,
  //   secure: true,
  //   auth: {
  //     user: process.env.SMTP_USER,
  //     pass: process.env.SMTP_PASS
  //   }
  // });

  private static getEmailTemplate(
    templateName: string,
    data: Record<string, any>
  ): string {
    switch (templateName) {
      case "verification":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Verify Your Email Address</h1>
            <p>Welcome to ${process.env.APP_NAME}! Please click the button below to verify your email address:</p>
            <a href="${data.verificationLink}" 
               style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Verify Email
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${data.verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't request this verification, please ignore this email.</p>
          </div>
        `;

      case "welcome":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Welcome to ${process.env.APP_NAME}!</h1>
            <p>Hi ${data.firstName},</p>
            <p>Thank you for joining ${process.env.APP_NAME}. We're excited to have you on board!</p>
            <a href="${data.loginLink}"
               style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Login to Your Account
            </a>
            <p>If you have any questions, feel free to contact our support team.</p>
          </div>
        `;

      case "password-reset":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Reset Your Password</h1>
            <p>You requested to reset your password. Click the button below to create a new password:</p>
            <a href="${data.resetLink}"
               style="display: inline-block; padding: 10px 20px; background-color: #007bff; 
                      color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
              Reset Password
            </a>
            <p>Or copy and paste this link in your browser:</p>
            <p>${data.resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this password reset, please ignore this email.</p>
          </div>
        `;

      case "transaction-alert":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Transaction ${data.status}</h1>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Type:</strong> ${data.type}</p>
              <p><strong>Amount:</strong> ${data.amount}</p>
              <p><strong>Reference:</strong> ${data.reference}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Status:</strong> ${data.status}</p>
            </div>
            <p>If you didn't perform this transaction, please contact our support team immediately.</p>
          </div>
        `;

      case "kyc-approval":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>KYC Verification Approved!</h1>
            
            <p>Congratulations! Your KYC verification (Level ${data.kycLevel}) has been approved.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0;">Your New Account Benefits:</h2>
              <ul style="padding-left: 20px;">
                ${data.benefits
                  .map(
                    (benefit: string) => `
                  <li style="margin-bottom: 10px;">${benefit}</li>
                `
                  )
                  .join("")}
              </ul>
            </div>

            <p>You can now enjoy these features by logging into your account:</p>
            <a href="${data.loginLink}" 
                style="display: inline-block; background-color: #007bff; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                      margin: 20px 0;">
              Login to Your Account
            </a>

            <p>If you have any questions about your new account features, please contact our support team at 
                <a href="mailto:${data.supportEmail}">${data.supportEmail}</a>.</p>

            <p>Best regards,<br>${data.appName} Team</p>
          </div>
        `;

      case "kyc-rejection":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>KYC Verification Update Required</h1>
            
            <p>We've reviewed your KYC verification submission and found some items that need your attention.</p>
            
            <div style="background-color: #fff3f3; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h2 style="margin-top: 0; color: #dc3545;">Reason for Update:</h2>
              <p style="margin-bottom: 0;">${data.reason}</p>
            </div>

            <h2>Next Steps:</h2>
            <ol style="padding-left: 20px;">
              <li>Review the feedback provided above</li>
              <li>Gather the required documentation</li>
              <li>Submit your updated verification</li>
            </ol>

            <p>You can update your KYC submission by clicking the button below:</p>
            <a href="${data.kycLink}" 
                style="display: inline-block; background-color: #28a745; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 5px; 
                      margin: 20px 0;">
              Update KYC Verification
            </a>

            <p>Need help? Our support team is available to assist you:</p>
            <ul style="padding-left: 20px;">
              <li>Email: <a href="mailto:${data.supportEmail}">${data.supportEmail}</a></li>
              <li>Support hours: Monday to Friday, 9 AM - 5 PM</li>
            </ul>

            <p>Best regards,<br>${data.appName} Team</p>
          </div>
        `;

      case "status-change":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Account Status Update</h1>
            <p>Your account status has been updated to: <strong>${data.status}</strong></p>
            ${data.reason ? `<p>Reason: ${data.reason}</p>` : ""}
            <p>If you have any questions about this change, please contact our support team at ${data.supportEmail}.</p>
            ${
              data.status === "active"
                ? `<p>You can now <a href="${data.loginLink}">log in to your account</a>.</p>`
                : ""
            }
            <p>Best regards,<br>${data.appName} Team</p>
          </div>
        `;

      case "temp-password":
        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <h1>Your Temporary Password</h1>
            <p>A temporary password has been generated for your account.</p>
            <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">
              <p style="margin: 0; font-family: monospace; font-size: 18px;">${data.tempPassword}</p>
            </div>
            <p><strong>Important:</strong> For security reasons, please:</p>
            <ol>
              <li>Log in using this temporary password at <a href="${data.loginLink}">${data.loginLink}</a></li>
              <li>Change your password immediately after logging in</li>
              <li>Do not share this password with anyone</li>
            </ol>
            <p>If you did not request this password reset, please contact our support team immediately at ${data.supportEmail}.</p>
            <p>Best regards,<br>${data.appName} Team</p>
          </div>
        `;

      case "transaction-notification":
        const actionColors = {
          approve: "#28a745",
          decline: "#dc3545",
          reverse: "#ffc107",
        };

        const actionMessages = {
          approve:
            "Your transaction has been approved and processed successfully.",
          decline:
            "Your transaction has been declined. Please review the details below.",
          reverse:
            "Your transaction has been reversed. The amount will be refunded according to your payment method.",
        };

        return `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
            <div style="background-color: ${actionColors[data.action as keyof typeof actionColors]}; 
                        padding: 2px; border-radius: 5px 5px 0 0;">
            </div>
            
            <div style="border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; padding: 20px;">
              <h1 style="color: #333; margin-top: 0;">Transaction ${data.action.charAt(0).toUpperCase() + data.action.slice(1)}</h1>
              
              <p style="color: #666;">
                ${actionMessages[data.action as keyof typeof actionMessages]}
              </p>
              
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
                <h2 style="margin-top: 0; font-size: 18px; color: #333;">Transaction Details</h2>
                
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Reference</td>
                    <td style="padding: 8px 0; text-align: right; font-family: monospace;">${data.reference}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Amount</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold;">${data.amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Type</td>
                    <td style="padding: 8px 0; text-align: right;">${data.type}</td>
                  </tr>
                  ${
                    data.description
                      ? `
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Description</td>
                    <td style="padding: 8px 0; text-align: right;">${data.description}</td>
                  </tr>
                  `
                      : ""
                  }
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Payment Method</td>
                    <td style="padding: 8px 0; text-align: right;">${data.paymentMethod}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666;">Date</td>
                    <td style="padding: 8px 0; text-align: right;">${data.date}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 20px 0;">
                <a href="${data.dashboardLink}"
                   style="display: inline-block; padding: 12px 24px; background-color: #007bff; 
                          color: white; text-decoration: none; border-radius: 5px;">
                  View Transaction Details
                </a>
              </div>
              
              ${
                data.action === "decline"
                  ? `
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; 
                          border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404; font-size: 16px;">What can I do?</h3>
                <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                  <li>Check your payment details and try again</li>
                  <li>Contact your bank to ensure your card is active</li>
                  <li>Try a different payment method</li>
                  <li>Contact our support team for assistance</li>
                </ul>
              </div>
              `
                  : ""
              }

              ${
                data.action === "reverse"
                  ? `
              <div style="background-color: #fff3cd; border: 1px solid #ffeeba; padding: 15px; 
                          border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #856404; font-size: 16px;">Refund Information</h3>
                <p style="margin: 10px 0; color: #856404;">
                  The refund has been initiated and will be processed according to your payment method's 
                  standard processing time:
                </p>
                <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                  <li>Card payments: 3-5 business days</li>
                  <li>Bank transfers: 1-2 business days</li>
                  <li>Wallet: Instant</li>
                </ul>
              </div>
              `
                  : ""
              }

              <p style="color: #666; margin-top: 20px;">
                If you have any questions about this transaction, please contact our support team at 
                <a href="mailto:${data.supportEmail}" style="color: #007bff;">${data.supportEmail}</a>
              </p>

              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; 
                          font-size: 12px; color: #666;">
                <p style="margin: 0;">This is an automated message, please do not reply directly to this email.</p>
              </div>
            </div>
          </div>
        `;

      default:
        throw new AppError(`Email template ${templateName} not found`, 500);
    }
  }

  static async sendPasswordChangeNotification(to: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: "Password Changed Successfully",
      templateName: "password-change",
      templateData: {
        loginLink: `${process.env.APP_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });
  }

  static async sendEmail(options: {
    to: string;
    subject: string;
    templateName: string;
    templateData: Record<string, any>;
  }): Promise<void> {
    try {
      const html = this.getEmailTemplate(
        options.templateName,
        options.templateData
      );

      await this.transporter.sendMail({
        from: `${process.env.APP_NAME} <${process.env.SMTP_FROM}>`,
        to: options.to,
        subject: options.subject,
        html,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new AppError("Failed to send email", 500);
    }
  }

  // Predefined email methods
  static async sendVerificationEmail(to: string, token: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: "Verify Your Email Address",
      templateName: "verification",
      templateData: {
        verificationLink: `${process.env.APP_URL}/verify-email?token=${token}`,
      },
    });
  }

  static async sendWelcomeEmail(to: string, firstName: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Welcome to ${process.env.APP_NAME}`,
      templateName: "welcome",
      templateData: {
        firstName,
        loginLink: `${process.env.APP_URL}/login`,
      },
    });
  }

  static async sendPasswordResetEmail(
    to: string,
    token: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: "Reset Your Password",
      templateName: "password-reset",
      templateData: {
        resetLink: `${process.env.APP_URL}/reset-password?token=${token}`,
      },
    });
  }

  static async sendTransactionAlert(
    to: string,
    transactionDetails: {
      type: string;
      amount: number;
      reference: string;
      date: Date;
      status: string;
    }
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Transaction ${transactionDetails.status}`,
      templateName: "transaction-alert",
      templateData: transactionDetails,
    });
  }

  /**
   * Send status change notification to user
   */
  static async sendStatusChangeNotification(
    to: string,
    status: string,
    reason: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Account Status Updated: ${status.toUpperCase()}`,
      templateName: "status-change",
      templateData: {
        status,
        reason,
        appName: process.env.APP_NAME,
        supportEmail: process.env.SUPPORT_EMAIL,
        loginLink: `${process.env.APP_URL}/login`,
      },
    });
  }

  /**
   * Send temporary password to user
   */
  static async sendTemporaryPasswordEmail(
    to: string,
    tempPassword: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: "Your Temporary Password",
      templateName: "temp-password",
      templateData: {
        tempPassword,
        appName: process.env.APP_NAME,
        loginLink: `${process.env.APP_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL,
      },
    });
  }

  /**
   * Send KYC approval notification
   */
  static async sendKycApprovalEmail(
    to: string,
    kycLevel: number
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: "KYC Verification Approved",
      templateName: "kyc-approval",
      templateData: {
        kycLevel,
        loginLink: `${process.env.APP_URL}/login`,
        supportEmail: process.env.SUPPORT_EMAIL,
        appName: process.env.APP_NAME,
        benefits: this.getKycLevelBenefits(kycLevel),
      },
    });
  }

  /**
   * Send KYC rejection notification
   */
  static async sendKycRejectionEmail(
    to: string,
    reason: string
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: "KYC Verification Update Required",
      templateName: "kyc-rejection",
      templateData: {
        reason,
        supportEmail: process.env.SUPPORT_EMAIL,
        appName: process.env.APP_NAME,
        kycLink: `${process.env.APP_URL}/kyc/verify`,
      },
    });
  }

  /**
   * Get KYC level benefits for email template
   */
  private static getKycLevelBenefits(level: number): string[] {
    const benefits = {
      1: ["Daily transaction limit of ₦50,000", "Maximum balance of ₦200,000"],
      2: [
        "Daily transaction limit of ₦200,000",
        "Maximum balance of ₦500,000",
        "Access to virtual cards",
      ],
      3: [
        "Daily transaction limit of ₦5,000,000",
        "Unlimited maximum balance",
        "Access to physical cards",
        "International transfers",
      ],
    };

    return benefits[level as keyof typeof benefits] || [];
  }

  /**
   * Send transaction notification email
   */
  static async sendTransactionNotification(
    to: string,
    action: string,
    transaction: {
      reference: string;
      amount: number;
      type: string;
      description?: string;
      paymentMethod: string;
      createdAt: Date;
    }
  ): Promise<void> {
    const subjects = {
      approve: "Transaction Approved",
      decline: "Transaction Declined",
      reverse: "Transaction Reversed",
    };

    await this.sendEmail({
      to,
      subject: subjects[action as keyof typeof subjects],
      templateName: "transaction-notification",
      templateData: {
        action,
        reference: transaction.reference,
        amount: formatAmount(transaction.amount),
        type: transaction.type,
        description: transaction.description,
        paymentMethod: formatPaymentMethod(transaction.paymentMethod),
        date: transaction.createdAt.toLocaleString(),
        supportEmail: process.env.SUPPORT_EMAIL,
        appName: process.env.APP_NAME,
        dashboardLink: `${process.env.APP_URL}/dashboard/transactions`,
      },
    });
  }
}
