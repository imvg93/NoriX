import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Extend the Request interface to include user property
export interface AuthRequest extends Request {
  user?: any;
}

// Super Admin email - has access to all pages
const SUPER_ADMIN_EMAIL = 'mework2003@gmail.com';

// Check if user is super admin
export const isSuperAdmin = (user: any): boolean => {
  return user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};

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

    // Role is now directly stored in user.role - no resolution needed
    // Validate that role exists and is valid (super admin bypasses this)
    if (!isSuperAdmin(user) && (!user.role || !['student', 'individual', 'corporate', 'local'].includes(user.role))) {
      res.status(401).json({
        success: false,
        message: 'Invalid user role'
      });
      return;
    }

    // Mark super admin in user object for easy access
    if (isSuperAdmin(user)) {
      (user as any).isSuperAdmin = true;
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

// Check if user is student (super admin can bypass)
export const requireStudent = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  console.log('🔍 requireStudent middleware:', {
    hasUser: !!req.user,
    role: req.user?.role,
    userId: req.user?._id,
    isSuperAdmin: isSuperAdmin(req.user)
  });
  
  if (!req.user) {
    console.log('❌ requireStudent: No user found');
    res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in.'
    });
    return;
  }
  
  // Super admin can access student pages
  if (isSuperAdmin(req.user)) {
    console.log('✅ requireStudent: Super admin accessing student page');
    next();
    return;
  }
  
  if (req.user.role !== 'student') {
    console.log('❌ requireStudent: User is not a student:', req.user.role);
    res.status(403).json({
      success: false,
      message: 'Access denied. Student account required.'
    });
    return;
  }
  
  console.log('✅ requireStudent: User is a student, proceeding');
  next();
};

// Check if user is individual, corporate, or local (employer roles) - super admin can bypass
export const requireEmployer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  // Super admin can access employer pages
  if (isSuperAdmin(req.user)) {
    next();
    return;
  }

  if (req.user.role !== 'individual' && req.user.role !== 'corporate' && req.user.role !== 'local') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Employer account (individual, corporate, or local) required.'
    });
    return;
  }
  next();
};

// Check if user is individual - super admin can bypass
export const requireIndividual = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  if (isSuperAdmin(req.user)) {
    next();
    return;
  }

  if (req.user.role !== 'individual') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Individual account required.'
    });
    return;
  }
  next();
};

// Check if user is corporate - super admin can bypass
export const requireCorporate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  if (isSuperAdmin(req.user)) {
    next();
    return;
  }

  if (req.user.role !== 'corporate') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Corporate account required.'
    });
    return;
  }
  next();
};

// Check if user is local - super admin can bypass
export const requireLocal = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  if (isSuperAdmin(req.user)) {
    next();
    return;
  }

  if (req.user.role !== 'local') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Local business account required.'
    });
    return;
  }
  next();
};

// Note: Admin role removed - if needed, implement separately
// For now, this middleware is kept for backward compatibility but will always deny
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  res.status(403).json({
    success: false,
    message: 'Admin access is not available in the current role system.'
  });
  return;
};

// Check if user is verified employer (individual, corporate, or local) - super admin can bypass
export const requireVerifiedEmployer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
    return;
  }

  // Super admin can access verified employer pages
  if (isSuperAdmin(req.user)) {
    next();
    return;
  }

  if (req.user.role !== 'individual' && req.user.role !== 'corporate' && req.user.role !== 'local') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Employer account (individual, corporate, or local) required.'
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

// Check if user has required role(s) - super admin can bypass
export const requireRole = (roles: ('student' | 'individual' | 'corporate' | 'local' | 'admin')[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
      return;
    }

    // Super admin can access any role page
    if (isSuperAdmin(req.user)) {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
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
