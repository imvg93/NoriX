import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend the Request interface to include user property
export interface AuthRequest extends Request {
  user?: any;
}

// Verify JWT token
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 authenticateToken middleware:', {
      path: req.path,
      originalUrl: req.originalUrl,
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      method: req.method
    });

    if (!token) {
      console.log('❌ authenticateToken: No token provided');
      res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    if (!user.isActive) {
      res.status(401).json({
        success: false,
        message: 'User account is deactivated'
      });
      return;
    }

    // Resolve role: use existing role if set, otherwise derive from userType
    let resolvedRole: 'user' | 'admin';
    if (user.role === 'admin' || user.role === 'user') {
      resolvedRole = user.role;
    } else {
      // Handle null userType
      if (!user.userType) {
        resolvedRole = 'user';
      } else {
        resolvedRole = user.userType === 'admin' ? 'admin' : 'user';
      }
    }

    if (user.role !== resolvedRole) {
      user.role = resolvedRole;
      try {
        await user.save();
      } catch (saveError) {
        console.error('Failed to persist user role during authentication:', saveError);
      }
    }

    req.user = user as any;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  }
};

// Check if user is student
export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.log('🔍 requireStudent middleware:', {
    hasUser: !!req.user,
    userType: req.user?.userType,
    userId: req.user?._id
  });
  
  if (!req.user) {
    console.log('❌ requireStudent: No user found');
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
    return;
  }
  
  if (req.user.userType !== 'student') {
    console.log('❌ requireStudent: User is not a student:', req.user.userType);
    res.status(403).json({
      success: false,
      message: 'Access denied. Student account required.'
    });
    return;
  }
  
  console.log('✅ requireStudent: User is a student, proceeding');
  next();
};

// Check if user is employer
export const requireEmployer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.userType !== 'employer') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Employer account required.'
    });
    return;
  }
  next();
};

// Check if user is admin
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.userType !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin account required.'
    });
    return;
  }
  next();
};

// Check if user is verified employer
export const requireVerifiedEmployer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || req.user.userType !== 'employer') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Employer account required.'
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Employer account must be verified.'
    });
    return;
  }
  next();
};

// Check if user has required role(s)
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.userType)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions.'
      });
      return;
    }
    next();
  };
};

// Optional authentication (for public routes that can show additional info if authenticated)
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user as any;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

// Rate limiting middleware
export const rateLimit = (
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  max: number = 100 // limit each IP to 100 requests per windowMs
) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  // Clean up old rate limit entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, 60000); // Clean up every minute

  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
    } else {
      const requestData = requests.get(ip)!;
      
      if (now > requestData.resetTime) {
        requestData.count = 1;
        requestData.resetTime = now + windowMs;
      } else {
        requestData.count++;
      }

      if (requestData.count > max) {
        res.status(429).json({
          success: false,
          message: 'Too many requests, please try again later.'
        });
        return;
      }
    }

    next();
  };
};
