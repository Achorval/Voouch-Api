// // src/controllers/auth.controller.ts

// import { Request, Response, NextFunction } from 'express';
// import AuthService from '../../services/shared/auth.service';
// import { AppError } from '../../utilities/error';
// import { SuccessResponse } from '../../utilities/success';
// import type { LoginCredentials, RegisterData } from '../../types/common/auth.types';

// export class AuthController {
//   static async register(
//     req: Request<{}, {}, RegisterData>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const {user, tokens} = await AuthService.register(req.body);

//       SuccessResponse.created(res, {
//         message: 'Registration successful. Please check your email for verification.',
//         data: {user, tokens}
//       });

//     } catch (error) {
//       next(error);
//     }
//   }

//   static async login(
//     req: Request<{}, {}, LoginCredentials>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const result = await AuthService.login(req.body);

//       SuccessResponse.ok(res, {
//         message: 'Login successful',
//         data: result
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async verifyEmail(
//     req: Request<{}, {}, { token: string }>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       await AuthService.verifyEmail(req.body.token);

//       SuccessResponse.ok(res, {
//         message: 'Email verified successfully'
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async requestPasswordReset(
//     req: Request<{}, {}, { email: string }>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       await AuthService.requestPasswordReset(req.body.email);

//       SuccessResponse.accepted(res, {
//         message: 'If an account exists with this email, a password reset link will be sent'
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async resetPassword(
//     req: Request<{}, {}, { token: string; newPassword: string }>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       await AuthService.resetPassword(req.body.token, req.body.newPassword);

//       SuccessResponse.ok(res, {
//         message: 'Password reset successfully'
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async refreshToken(
//     req: Request<{}, {}, { refreshToken: string }>,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       const tokens = await AuthService.refreshToken(req.body.refreshToken);

//       SuccessResponse.ok(res, {
//         message: 'Token refreshed successfully',
//         data: { tokens }
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async logout(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       if (!req.user?.id) {
//         throw new AppError('Not authenticated', 401);
//       }

//       await AuthService.logout(req.user.id);

//       SuccessResponse.ok(res, {
//         message: 'Logged out successfully'
//       });
//     } catch (error) {
//       next(error);
//     }
//   }

//   static async deleteAccount(
//     req: Request,
//     res: Response,
//     next: NextFunction
//   ) {
//     try {
//       // await AuthService.deleteAccount(req.user!.userId);

//       SuccessResponse.noContent(res);
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// src/controllers/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "../../services/shared/auth.service";
import { RegisterInput, LoginInput } from "../../types/common/auth.types";
import { SuccessResponse } from "../../utilities/success";
import { ErrorResponse } from "../../utilities/error";
import { AuthUtils } from '../../utilities/auth';
import { ProfileService } from '../../services/user';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input: RegisterInput = req.body;
      const result = await AuthService.register(input);

      SuccessResponse.created(res, {
        message:
          "Registration successful. Please check your email for verification.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input: LoginInput = {
        identifier: req.body.identifier,
        password: req.body.password,
        deviceInfo: req.body.deviceInfo,
      };

      const result = await AuthService.login(input);

      SuccessResponse.ok(res, {
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      await AuthService.forgotPassword(email);

      SuccessResponse.ok(res, {
        message:
          "If an account exists with this email, you will receive password reset instructions",
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      await AuthService.resetPassword(token, password);

      SuccessResponse.ok(res, {
        message: "Password has been reset successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const tokens = await AuthService.refreshToken(refreshToken);

      SuccessResponse.ok(res, {
        message: "Tokens refreshed successfully",
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw ErrorResponse.unauthorized('User ID is required');
      }

      const { refreshToken, allDevices } = req.body;
      await AuthService.logout(req.user.id, { refreshToken, allDevices });

      SuccessResponse.ok(res, {
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = req.body;
      // Verify token
      const payload = await AuthUtils.verifyAccessToken(accessToken);

      // Get user details
      const user = await ProfileService.getProfile(payload.id);

      SuccessResponse.ok(res, {
        message: 'User retrieved successfully!',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
}
