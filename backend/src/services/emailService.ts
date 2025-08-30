import nodemailer from 'nodemailer';
import { OTP } from '../models/OTP';

// Enhanced logging for debugging
const logEmailError = (attempt: number, error: any, config: any) => {
  console.error(`📧 Email Error (Attempt ${attempt}):`, {
    error: error.message || error,
    code: error.code,
    command: error.command,
    responseCode: error.responseCode,
    response: error.response,
    config: {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.auth?.user ? '***' : 'NOT_SET',
      pass: config.auth?.pass ? '***' : 'NOT_SET'
    }
  });
};

// Create transporter with proper Gmail configuration
export const createTransporter = (config: {
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  pass?: string;
}) => {
  const transporterConfig = {
    host: config.host || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: config.port || Number(process.env.EMAIL_PORT) || 587,
    secure: config.secure !== undefined ? config.secure : (process.env.EMAIL_SECURE === 'true'),
    auth: {
      user: config.user || process.env.EMAIL_USER,
      pass: config.pass || process.env.EMAIL_PASS
    },
    // Gmail specific settings
    service: 'gmail',
    tls: {
      rejectUnauthorized: false
    }
  };

  console.log('📧 Creating transporter with config:', {
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    user: transporterConfig.auth.user ? '***' : 'NOT_SET',
    pass: transporterConfig.auth.pass ? '***' : 'NOT_SET'
  });

  return nodemailer.createTransport(transporterConfig);
};

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email with comprehensive error handling
export const sendOTPEmail = async (email: string, otp: string, purpose: 'verification' | 'password-reset' | 'login'): Promise<boolean> => {
  console.log(`📧 Attempting to send ${purpose} OTP to: ${email}`);

  // Validate configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Email configuration missing: EMAIL_USER or EMAIL_PASS not set');
    return false;
  }

  const subject = purpose === 'verification'
    ? 'Email Verification OTP - StudentJobs'
    : purpose === 'login'
    ? 'Login Verification OTP - StudentJobs'
    : 'Password Reset OTP - StudentJobs';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 30px;">
        <h2 style="color: #333; text-align: center; margin-bottom: 30px; font-size: 24px;">
          StudentJobs
        </h2>
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="color: #555; margin-bottom: 15px; font-size: 18px;">${subject}</h3>
          <p style="color: #666; margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
            Your verification code is:
          </p>
          <div style="background: linear-gradient(135deg, #007bff, #0056b3); color: white; font-size: 28px; font-weight: bold; 
                      text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
            ${otp}
          </div>
          <p style="color: #666; margin-top: 20px; font-size: 14px; line-height: 1.4;">
            ⏰ This code will expire in 5 minutes.<br>
            🔒 Do not share this code with anyone.<br>
            📧 If you didn't request this code, please ignore this email.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #999; font-size: 12px;">
            StudentJobs - Connecting Students with Opportunities
          </p>
        </div>
      </div>
    </div>
  `;

  const mailOptions = {
    from: `"StudentJobs" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html
  };

  // Attempt 1: Gmail SMTP with STARTTLS (Port 587)
  try {
    console.log('📧 Attempt 1: Gmail SMTP with STARTTLS (Port 587)');
    const transporter1 = createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });

    await transporter1.verify();
    console.log('✅ Transporter verified successfully');
    
    const result = await transporter1.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });
    return true;
  } catch (err1: any) {
    logEmailError(1, err1, {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });
  }

  // Attempt 2: Gmail SMTP with SSL (Port 465)
  try {
    console.log('📧 Attempt 2: Gmail SMTP with SSL (Port 465)');
    const transporter2 = createTransporter({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });

    await transporter2.verify();
    console.log('✅ Transporter verified successfully');
    
    const result = await transporter2.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });
    return true;
  } catch (err2: any) {
    logEmailError(2, err2, {
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });
  }

  // Attempt 3: Custom SMTP configuration from environment
  try {
    console.log('📧 Attempt 3: Custom SMTP configuration from environment');
    const transporter3 = createTransporter({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });

    await transporter3.verify();
    console.log('✅ Transporter verified successfully');
    
    const result = await transporter3.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', {
      messageId: result.messageId,
      response: result.response
    });
    return true;
  } catch (err3: any) {
    logEmailError(3, err3, {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });
  }

  console.error('❌ All email sending attempts failed');
  return false;
};

// Verify OTP with enhanced logging
export const verifyOTP = async (email: string, otp: string, purpose: 'verification' | 'password-reset' | 'login'): Promise<boolean> => {
  try {
    console.log(`🔍 Verifying OTP for ${email} with purpose: ${purpose}`);
    
    const otpRecord = await OTP.findOne({
      email: email.toLowerCase(),
      otp,
      purpose,
      expiresAt: { $gt: new Date() }
    });

    if (otpRecord) {
      console.log('✅ OTP verified successfully');
      // Delete the used OTP
      await OTP.findByIdAndDelete(otpRecord._id);
      console.log('🗑️ Used OTP deleted from database');
      return true;
    }

    console.log('❌ OTP verification failed: Invalid or expired OTP');
    return false;
  } catch (error) {
    console.error('❌ OTP verification error:', error);
    return false;
  }
};

// Clean expired OTPs with logging
export const cleanExpiredOTPs = async (): Promise<void> => {
  try {
    const result = await OTP.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log(`🧹 Cleaned ${result.deletedCount} expired OTPs`);
  } catch (error) {
    console.error('❌ Clean expired OTPs error:', error);
  }
};

// Get email configuration status
export const getEmailConfigStatus = () => {
  return {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || '587',
    secure: process.env.EMAIL_SECURE || 'false',
    user: process.env.EMAIL_USER ? '***' : 'NOT_SET',
    pass: process.env.EMAIL_PASS ? '***' : 'NOT_SET',
    configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  };
};
