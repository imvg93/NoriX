const nodemailer = require('nodemailer');
require('dotenv').config();

async function testEmailConfiguration() {
  console.log('🧪 Testing Email Configuration...\n');

  // Check environment variables
  console.log('📋 Environment Variables:');
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'smtp.gmail.com');
  console.log('EMAIL_PORT:', process.env.EMAIL_PORT || '587');
  console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'false');
  console.log('EMAIL_USER:', process.env.EMAIL_USER ? '***' : 'NOT_SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' : 'NOT_SET');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASS environment variables');
    console.log('Please set these in your .env file:');
    console.log('EMAIL_USER=your-gmail@gmail.com');
    console.log('EMAIL_PASS=your-16-character-app-password');
    return;
  }

  // Test Gmail SMTP with STARTTLS (Port 587)
  console.log('📧 Testing Gmail SMTP with STARTTLS (Port 587)...');
  try {
    const transporter1 = nodemailer.createTransporter({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter1.verify();
    console.log('✅ Gmail SMTP with STARTTLS (Port 587) - SUCCESS');
    
    // Test sending a test email
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    const mailOptions = {
      from: `"StudentJobs Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'StudentJobs OTP System Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #ffffff; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); padding: 30px;">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px; font-size: 24px;">
              StudentJobs OTP System Test
            </h2>
            <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #555; margin-bottom: 15px; font-size: 18px;">✅ Email Configuration Test</h3>
              <p style="color: #666; margin-bottom: 20px; font-size: 16px; line-height: 1.5;">
                This is a test email to verify that your Gmail SMTP configuration is working correctly.
              </p>
              <div style="background: linear-gradient(135deg, #28a745, #20c997); color: white; font-size: 28px; font-weight: bold; 
                          text-align: center; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                TEST123
              </div>
              <p style="color: #666; margin-top: 20px; font-size: 14px; line-height: 1.4;">
                🎉 Your OTP system is configured correctly!<br>
                📧 You can now send OTP emails to users.<br>
                🔒 This test code is not valid for actual verification.
              </p>
            </div>
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                StudentJobs - Connecting Students with Opportunities
              </p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter1.sendMail(mailOptions);
    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', result.messageId);
    console.log('Response:', result.response);
    console.log('');
    console.log('📧 Check your email inbox for the test message');
    console.log('If you received the email, your OTP system is working correctly!');

  } catch (error) {
    console.error('❌ Gmail SMTP with STARTTLS (Port 587) - FAILED');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    console.error('Command:', error.command);
    console.error('Response:', error.response);
    console.log('');
    
    // Try SSL (Port 465) as fallback
    console.log('📧 Trying Gmail SMTP with SSL (Port 465)...');
    try {
      const transporter2 = nodemailer.createTransporter({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter2.verify();
      console.log('✅ Gmail SMTP with SSL (Port 465) - SUCCESS');
      console.log('Consider updating your .env file:');
      console.log('EMAIL_PORT=465');
      console.log('EMAIL_SECURE=true');
      
    } catch (error2) {
      console.error('❌ Gmail SMTP with SSL (Port 465) - FAILED');
      console.error('Error:', error2.message);
      console.log('');
      console.log('🔧 Troubleshooting Tips:');
      console.log('1. Ensure 2-Factor Authentication is enabled on your Gmail account');
      console.log('2. Generate a new App Password specifically for "Mail"');
      console.log('3. Use the 16-character App Password, not your regular password');
      console.log('4. Check if your Gmail account is not locked or suspended');
      console.log('5. Try enabling "Less secure app access" (not recommended for production)');
    }
  }
}

// Run the test
testEmailConfiguration().catch(console.error);

