import nodemailer from 'nodemailer';
import User from '../models/User';
import Job from '../models/Job';

export interface EmailNotificationData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailNotificationService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Send new application notification to employer
  public async sendNewApplicationNotification(
    employerId: string,
    applicationData: any,
    studentData: any,
    jobData: any
  ): Promise<boolean> {
    try {
      const employer = await User.findById(employerId);
      if (!employer) {
        console.error('❌ Employer not found for email notification');
        return false;
      }

      const subject = `New Application Received - ${jobData.jobTitle}`;
      const html = this.generateNewApplicationEmailHTML(
        employer.name || employer.email,
        studentData,
        jobData,
        applicationData
      );

      const emailData: EmailNotificationData = {
        to: employer.email,
        subject,
        html,
        text: this.generateNewApplicationEmailText(employer.name || employer.email, studentData, jobData)
      };

      await this.sendEmail(emailData);
      console.log(`📧 New application email sent to employer: ${employer.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending new application email:', error);
      return false;
    }
  }

  // Send job approval notification to employer
  public async sendJobApprovalNotification(
    employerId: string,
    jobData: any
  ): Promise<boolean> {
    try {
      const employer = await User.findById(employerId);
      if (!employer) {
        console.error('❌ Employer not found for email notification');
        return false;
      }

      const subject = `Job Approved - ${jobData.jobTitle}`;
      const html = this.generateJobApprovalEmailHTML(
        employer.name || employer.email,
        jobData
      );

      const emailData: EmailNotificationData = {
        to: employer.email,
        subject,
        html,
        text: this.generateJobApprovalEmailText(employer.name || employer.email, jobData)
      };

      await this.sendEmail(emailData);
      console.log(`📧 Job approval email sent to employer: ${employer.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending job approval email:', error);
      return false;
    }
  }

  // Send job rejection notification to employer
  public async sendJobRejectionNotification(
    employerId: string,
    jobData: any,
    reason?: string
  ): Promise<boolean> {
    try {
      const employer = await User.findById(employerId);
      if (!employer) {
        console.error('❌ Employer not found for email notification');
        return false;
      }

      const subject = `Job Rejected - ${jobData.jobTitle}`;
      const html = this.generateJobRejectionEmailHTML(
        employer.name || employer.email,
        jobData,
        reason
      );

      const emailData: EmailNotificationData = {
        to: employer.email,
        subject,
        html,
        text: this.generateJobRejectionEmailText(employer.name || employer.email, jobData, reason)
      };

      await this.sendEmail(emailData);
      console.log(`📧 Job rejection email sent to employer: ${employer.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending job rejection email:', error);
      return false;
    }
  }

  // Send application status update to student
  public async sendApplicationStatusNotification(
    studentId: string,
    applicationData: any,
    jobData: any
  ): Promise<boolean> {
    try {
      const student = await User.findById(studentId);
      if (!student) {
        console.error('❌ Student not found for email notification');
        return false;
      }

      const subject = `Application Status Update - ${jobData.jobTitle}`;
      const html = this.generateApplicationStatusEmailHTML(
        student.name || student.email,
        applicationData,
        jobData
      );

      const emailData: EmailNotificationData = {
        to: student.email,
        subject,
        html,
        text: this.generateApplicationStatusEmailText(student.name || student.email, applicationData, jobData)
      };

      await this.sendEmail(emailData);
      console.log(`📧 Application status email sent to student: ${student.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error sending application status email:', error);
      return false;
    }
  }

  // Private method to send email
  private async sendEmail(emailData: EmailNotificationData): Promise<void> {
    const mailOptions = {
      from: `"MeWork Job Portal" <${process.env.SMTP_USER}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    await this.transporter.sendMail(mailOptions);
  }

  // Email template generators
  private generateNewApplicationEmailHTML(
    employerName: string,
    studentData: any,
    jobData: any,
    applicationData: any
  ): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New Application Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .student-info { background: #e0f2fe; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 New Application Received!</h1>
          </div>
          <div class="content">
            <p>Dear ${employerName},</p>
            
            <p>Great news! You have received a new application for your job posting.</p>
            
            <div class="job-card">
              <h3>📋 Job Details</h3>
              <p><strong>Position:</strong> ${jobData.jobTitle}</p>
              <p><strong>Company:</strong> ${jobData.companyName}</p>
              <p><strong>Location:</strong> ${jobData.location}</p>
              <p><strong>Type:</strong> ${jobData.jobType}</p>
            </div>
            
            <div class="student-info">
              <h3>👤 Applicant Information</h3>
              <p><strong>Name:</strong> ${studentData.name || studentData.email}</p>
              <p><strong>Email:</strong> ${studentData.email}</p>
              <p><strong>Phone:</strong> ${studentData.phone || 'Not provided'}</p>
              <p><strong>Applied On:</strong> ${new Date(applicationData.createdAt).toLocaleDateString()}</p>
            </div>
            
            <p>Please log in to your employer dashboard to review the full application and contact the candidate.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer" class="button">
              View Application
            </a>
            
            <p>Best regards,<br>The MeWork Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateJobApprovalEmailHTML(employerName: string, jobData: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Job Approved!</h1>
          </div>
          <div class="content">
            <p>Dear ${employerName},</p>
            
            <p>Congratulations! Your job posting has been approved and is now live on our platform.</p>
            
            <div class="job-card">
              <h3>📋 Approved Job Details</h3>
              <p><strong>Position:</strong> ${jobData.jobTitle}</p>
              <p><strong>Company:</strong> ${jobData.companyName}</p>
              <p><strong>Location:</strong> ${jobData.location}</p>
              <p><strong>Type:</strong> ${jobData.jobType}</p>
              <p><strong>Salary:</strong> ${jobData.salary || 'Not specified'}</p>
            </div>
            
            <p>Students can now view and apply for your job posting. You'll receive email notifications when applications are submitted.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer" class="button">
              View Job Posting
            </a>
            
            <p>Best regards,<br>The MeWork Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateJobRejectionEmailHTML(employerName: string, jobData: any, reason?: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Job Rejected</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .reason-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Job Rejected</h1>
          </div>
          <div class="content">
            <p>Dear ${employerName},</p>
            
            <p>We regret to inform you that your job posting has been rejected after review.</p>
            
            <div class="job-card">
              <h3>📋 Rejected Job Details</h3>
              <p><strong>Position:</strong> ${jobData.jobTitle}</p>
              <p><strong>Company:</strong> ${jobData.companyName}</p>
              <p><strong>Location:</strong> ${jobData.location}</p>
              <p><strong>Type:</strong> ${jobData.jobType}</p>
            </div>
            
            ${reason ? `
            <div class="reason-box">
              <h4>📝 Reason for Rejection:</h4>
              <p>${reason}</p>
            </div>
            ` : ''}
            
            <p>Please review our job posting guidelines and feel free to submit a new job posting that meets our requirements.</p>
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/employer" class="button">
              Post New Job
            </a>
            
            <p>Best regards,<br>The MeWork Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateApplicationStatusEmailHTML(studentName: string, applicationData: any, jobData: any): string {
    const statusColor = applicationData.status === 'approved' ? '#10b981' : 
                       applicationData.status === 'rejected' ? '#ef4444' : '#f59e0b';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Application Status Update</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: ${statusColor}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px; }
          .job-card { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .status-badge { display: inline-block; background: ${statusColor}; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; }
          .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Application Status Update</h1>
          </div>
          <div class="content">
            <p>Dear ${studentName},</p>
            
            <p>Your application status has been updated.</p>
            
            <div class="job-card">
              <h3>📋 Job Details</h3>
              <p><strong>Position:</strong> ${jobData.jobTitle}</p>
              <p><strong>Company:</strong> ${jobData.companyName}</p>
              <p><strong>Location:</strong> ${jobData.location}</p>
              <p><strong>Type:</strong> ${jobData.jobType}</p>
            </div>
            
            <p><strong>Status:</strong> <span class="status-badge">${applicationData.status.toUpperCase()}</span></p>
            
            ${applicationData.status === 'approved' ? `
              <p>🎉 Congratulations! Your application has been approved. The employer will contact you soon.</p>
            ` : applicationData.status === 'rejected' ? `
              <p>We're sorry to inform you that your application was not selected this time. Don't worry, keep applying to other opportunities!</p>
            ` : `
              <p>Your application is currently under review. We'll notify you once the employer makes a decision.</p>
            `}
            
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student-home" class="button">
              View Applications
            </a>
            
            <p>Best regards,<br>The MeWork Team</p>
          </div>
          <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Text versions of emails
  private generateNewApplicationEmailText(employerName: string, studentData: any, jobData: any): string {
    return `
New Application Received - ${jobData.jobTitle}

Dear ${employerName},

Great news! You have received a new application for your job posting.

Job Details:
- Position: ${jobData.jobTitle}
- Company: ${jobData.companyName}
- Location: ${jobData.location}
- Type: ${jobData.jobType}

Applicant Information:
- Name: ${studentData.name || studentData.email}
- Email: ${studentData.email}
- Phone: ${studentData.phone || 'Not provided'}

Please log in to your employer dashboard to review the full application and contact the candidate.

Best regards,
The MeWork Team
    `;
  }

  private generateJobApprovalEmailText(employerName: string, jobData: any): string {
    return `
Job Approved - ${jobData.jobTitle}

Dear ${employerName},

Congratulations! Your job posting has been approved and is now live on our platform.

Approved Job Details:
- Position: ${jobData.jobTitle}
- Company: ${jobData.companyName}
- Location: ${jobData.location}
- Type: ${jobData.jobType}
- Salary: ${jobData.salary || 'Not specified'}

Students can now view and apply for your job posting. You'll receive email notifications when applications are submitted.

Best regards,
The MeWork Team
    `;
  }

  private generateJobRejectionEmailText(employerName: string, jobData: any, reason?: string): string {
    return `
Job Rejected - ${jobData.jobTitle}

Dear ${employerName},

We regret to inform you that your job posting has been rejected after review.

Rejected Job Details:
- Position: ${jobData.jobTitle}
- Company: ${jobData.companyName}
- Location: ${jobData.location}
- Type: ${jobData.jobType}

${reason ? `Reason for Rejection: ${reason}` : ''}

Please review our job posting guidelines and feel free to submit a new job posting that meets our requirements.

Best regards,
The MeWork Team
    `;
  }

  private generateApplicationStatusEmailText(studentName: string, applicationData: any, jobData: any): string {
    return `
Application Status Update - ${jobData.jobTitle}

Dear ${studentName},

Your application status has been updated.

Job Details:
- Position: ${jobData.jobTitle}
- Company: ${jobData.companyName}
- Location: ${jobData.location}
- Type: ${jobData.jobType}

Status: ${applicationData.status.toUpperCase()}

${applicationData.status === 'approved' ? 
  "Congratulations! Your application has been approved. The employer will contact you soon." :
  applicationData.status === 'rejected' ? 
  "We're sorry to inform you that your application was not selected this time. Don't worry, keep applying to other opportunities!" :
  "Your application is currently under review. We'll notify you once the employer makes a decision."
}

Best regards,
The MeWork Team
    `;
  }
}

export default EmailNotificationService;
