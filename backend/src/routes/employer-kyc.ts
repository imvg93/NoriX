import express from 'express';
import { AuthRequest, authenticateToken, requireAdmin, requireEmployer } from '../middleware/auth';
import EmployerKYC from '../models/EmployerKYC';
import User from '../models/User';

const router = express.Router();

// POST /api/kyc/employer → Employer submits KYC details (defaults to pending)
// POST /api/kyc/employer
router.post('/employer', authenticateToken, requireEmployer, async (req: AuthRequest, res: express.Response) => {
  try {
    const employerId = req.user!._id;
    const { companyName, GSTNumber, PAN, documents } = req.body || {};

    // Upsert: allow resubmission to overwrite if in rejected/pending state
    const existing = await EmployerKYC.findOne({ employerId });
    if (existing && existing.status === 'approved') {
      return res.status(400).json({ success: false, message: 'KYC already approved.' });
    }

    const data = {
      employerId,
      companyName,
      GSTNumber,
      PAN,
      documents: documents || {},
      status: 'pending' as const,
      ...(existing?.status === 'rejected' ? { rejectionReason: undefined } : {})
    };

    const record = await EmployerKYC.findOneAndUpdate(
      { employerId },
      { $set: data },
      { new: true, upsert: true }
    );

    // Link to existing user-based KYC flow used by jobs
    await User.findByIdAndUpdate(
      employerId,
      {
        $set: {
          kycStatus: 'pending',
          kycPendingAt: new Date(),
          isVerified: false
        },
        $unset: { kycVerifiedAt: 1, kycRejectedAt: 1 }
      },
      { new: true }
    );

    return res.status(201).json({ success: true, data: record, message: 'Employer KYC submitted' });
  } catch (err: any) {
    console.error('Employer KYC submit error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to submit KYC' });
  }
});

// GET /api/kyc/admin/pending → Admin fetches all employers with pending KYC
router.get('/admin/pending', authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const records = await EmployerKYC.find({ status: 'pending' }).populate('employerId', 'name email companyName userType');
    return res.json({ success: true, data: records });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch pending KYCs' });
  }
});

// PATCH /api/kyc/admin/:id/approve → Admin approves KYC (status → approved)
router.patch('/admin/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const record = await EmployerKYC.findByIdAndUpdate(
      id,
      { $set: { status: 'approved', rejectionReason: undefined } },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'KYC record not found' });

    // Update user flags so job posting checks the same status as before
    await User.findByIdAndUpdate(
      record.employerId,
      {
        $set: {
          kycStatus: 'approved',
          kycVerifiedAt: new Date(),
          isVerified: true
        }
      }
    );
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to approve KYC' });
  }
});

// PATCH /api/kyc/admin/:id/reject → Admin rejects KYC (status → rejected)
router.patch('/admin/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body || {};
    const record = await EmployerKYC.findByIdAndUpdate(
      id,
      { $set: { status: 'rejected', rejectionReason: reason || 'Rejected' } },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: 'KYC record not found' });

    await User.findByIdAndUpdate(
      record.employerId,
      {
        $set: {
          kycStatus: 'rejected',
          kycRejectedAt: new Date(),
          isVerified: false
        }
      }
    );
    return res.json({ success: true, data: record });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to reject KYC' });
  }
});

// GET /api/kyc/employer/:id/status → Employer checks their KYC status
// GET /api/kyc/employer/:id/status
router.get('/employer/:id/status', authenticateToken, async (req: AuthRequest, res: express.Response) => {
  try {
    const { id } = req.params;
    // Allow self or admin to view
    const isSelf = req.user && (req.user._id as any).toString() === id;
    const isAdmin = req.user && req.user.userType === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Read canonical status from User for legacy compatibility
    const user = await User.findById(id).select('kycStatus');
    const record = await EmployerKYC.findOne({ employerId: id });
    const status = (user?.kycStatus as any) || record?.status || 'not-submitted';
    return res.json({ success: true, data: { status, kyc: record || null }, message: 'Employer KYC status' });
  } catch (err: any) {
    console.error('Employer KYC status error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to fetch KYC status' });
  }
});

export default router;



