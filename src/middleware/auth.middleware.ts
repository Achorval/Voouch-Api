// // src/middleware/auth.middleware.ts

// import { Request, Response, NextFunction } from 'express';
// import { and, eq } from 'drizzle-orm';
// import { db } from '../config/database';
// import { users } from '../db/schema';
// import { AuthUtils } from '../utilities/auth';
// import { AppError } from '../utilities/error';
// import { TokenPayload } from '../types/common/auth.types';

// declare global {
//   namespace Express {
//     interface Request {
//       user?: TokenPayload;
//     }
//   }
// }

// export const authenticate = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // Extract token from header
//     const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
//     // Verify token
    // const decoded = AuthUtils.verifyAccessToken(token);

//     // Check if user exists and is active
//     const user = await db
//       .select()
//       .from(users)
//       .where(
//         and(
//           eq(users.id, decoded.id),
//           eq(users.status, 'active')
//         )
//       )
//       .limit(1);

//     if (!user || user.length === 0) {
//       throw new AppError('User not found or inactive', 401);
//     }

//     // Add user to request object
//     req.user = decoded;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// export const authorize = (roles: string[]) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user) {
//       throw new AppError('Not authenticated', 401);
//     }

//     if (!roles.includes(req.user.role)) {
//       throw new AppError('Not authorized', 403);
//     }

//     next();
//   };
// };

// export const verifyEmailAuthentication = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) {
//     throw new AppError('Not authenticated', 401);
//   }

//   const user = await db
//     .select()
//     .from(users)
//     .where(eq(users.id, req.user.id))
//     .limit(1);

//   if (!user[0]?.isEmailVerified) {
//     throw new AppError('Email not verified', 403);
//   }

//   next();
// };

// export const checkUserStatus = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) {
//     throw new AppError('Not authenticated', 401);
//   }

//   const user = await db
//     .select()
//     .from(users)
//     .where(eq(users.id, req.user.id))
//     .limit(1);

//   if (!user[0] || user[0].status !== 'active') {
//     throw new AppError('Account is not active', 403);
//   }

//   if (user[0].failedLoginAttempts >= user[0].maxLoginAttempts) {
//     const lockoutUntil = user[0].lockoutUntil ? new Date(user[0].lockoutUntil) : null;
//     if (lockoutUntil && lockoutUntil > new Date()) {
//       throw new AppError(
//         `Account is locked. Try again after ${lockoutUntil.toLocaleString()}`,
//         403
//       );
//     }
//   }

//   next();
// };




// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { AuthUtils } from '../utilities/auth';
import { ErrorResponse } from '../utilities/error';
import { TokenPayload } from '../types/common/auth.types';
import { db } from '../config/database';
import { users } from '../db/schema';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const token = AuthUtils.extractTokenFromHeader(req.headers.authorization);
    
    // Verify token and get payload
    const payload = await AuthUtils.verifyAccessToken(token);
    
    // Get user from database
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email,
        status: users.status,
        isActive: users.isActive
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (!user) {
      throw ErrorResponse.unauthorized('User not found');
    }

    // Check if user is active
    if (!user.isActive || user.status !== 'active') {
      throw ErrorResponse.forbidden('Account is inactive or suspended');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req;
    
    if (!roles.includes(authReq?.user?.role ?? '')) {
      next(ErrorResponse.forbidden('You do not have permission to access this resource'));
      return;
    }
    
    next();
  };
};

// Optional auth middleware - doesn't require authentication but attaches user if token is valid
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = AuthUtils.extractTokenFromHeader(authHeader);
    const payload = await AuthUtils.verifyAccessToken(token);
    
    const [user] = await db
      .select({
        id: users.id,
        role: users.role,
        email: users.email,
        status: users.status
      })
      .from(users)
      .where(eq(users.id, payload.id))
      .limit(1);

    if (user) {
      req.user = {
        id: user.id,
        role: user.role,
        email: user.email
      };
    }

    next();
  } catch (error) {
    // Don't throw error for optional auth, just continue without user
    next();
  }
};