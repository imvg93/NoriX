import express from 'express';
import { getStatus } from '../controllers/verificationController';
import { authenticateToken, requireStudent } from '../middleware/auth';

const router = express.Router();

// Log when router is created
console.log('🔧 VerificationRoutes router created');

// Debug middleware to log all requests - MUST be first to catch all routes
router.use((req, res, next) => {
  console.log('🔍 VerificationRoutes middleware - Request received:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    baseUrl: req.baseUrl,
    route: '/api/verification' + req.path
  });
  next();
});

// Test route to verify routing works (no auth required)
router.get("/test", (req, res) => {
  console.log('✅ /api/verification/test route matched!', {
    path: req.path,
    originalUrl: req.originalUrl,
    method: req.method
  });
  res.json({ 
    message: 'Verification routes are working', 
    path: req.path, 
    originalUrl: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Main status route with authentication
router.get("/status", 
  (req, res, next) => {
    console.log('🔍 /status route handler called - Route MATCHED!', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      url: req.url,
      baseUrl: req.baseUrl
    });
    next();
  },
  authenticateToken, 
  requireStudent, 
  getStatus
);

// Catch-all for debugging - this should never be reached if routes are working
router.use((req, res, next) => {
  console.log('⚠️ VerificationRoutes catch-all reached:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl
  });
  next(); // Let it fall through to next router or notFound
});

// Log route registration
console.log('✅ VerificationRoutes: /status route registered with middleware');

export default router;

