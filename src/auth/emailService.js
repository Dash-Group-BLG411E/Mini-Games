const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = null;
    this.isConfigured = false;
    this.initTransporter();
  }

  async initTransporter() {
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    // Check if email credentials are configured
    if (smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        
        // Verify connection
        await this.transporter.verify();
        this.isConfigured = true;
        console.log('Email service configured successfully');
      } catch (error) {
        console.error('Failed to configure email service:', error.message);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
      // For development/testing, use Ethereal Email if no credentials are set
      if (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER) {
        console.log('No email credentials found. Using Ethereal Email for testing...');
        try {
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });
          this.isConfigured = true;
          console.log('Ethereal Email test account created. Check console for email preview URLs.');
        } catch (error) {
          console.error('Failed to create Ethereal test account:', error.message);
          this.transporter = null;
          this.isConfigured = false;
        }
      } else {
        console.warn('Email service not configured. Set SMTP_USER and SMTP_PASS environment variables.');
        this.isConfigured = false;
      }
    }
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email, username, token) {
    // Check if email service is configured
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured. Cannot send verification email.');
      return { 
        success: false, 
        error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const fromEmail = process.env.EMAIL_FROM || 
                      (process.env.SMTP_USER || process.env.EMAIL_USER) || 
                      'noreply@minigameshub.com';

    const mailOptions = {
      from: fromEmail.includes('@') ? `"MiniGamesHub" <${fromEmail}>` : fromEmail,
      to: email,
      subject: 'Verify Your Email - MiniGamesHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 MiniGamesHub</h1>
            </div>
            <div class="content">
              <h2>Welcome, ${username}!</h2>
              <p>Thank you for registering with MiniGamesHub. Please verify your email address to complete your registration and start playing games.</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #7c3aed;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MiniGamesHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to MiniGamesHub, ${username}!
        
        Please verify your email address by clicking the following link:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      
      // If using Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL PREVIEW URL (Ethereal Email - Testing):');
        console.log(previewUrl);
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendResendVerificationEmail(email, username, token) {
    // Check if email service is configured
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured. Cannot send verification email.');
      return { 
        success: false, 
        error: 'Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    const fromEmail = process.env.EMAIL_FROM || 
                      (process.env.SMTP_USER || process.env.EMAIL_USER) || 
                      'noreply@minigameshub.com';

    const mailOptions = {
      from: fromEmail.includes('@') ? `"MiniGamesHub" <${fromEmail}>` : fromEmail,
      to: email,
      subject: 'Verify Your Email - MiniGamesHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #7c3aed, #4c1d95); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: #7c3aed; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 MiniGamesHub</h1>
            </div>
            <div class="content">
              <h2>Email Verification Request</h2>
              <p>Hello ${username},</p>
              <p>You requested a new verification email. Please click the button below to verify your email address:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #7c3aed;">${verificationUrl}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't request this email, please ignore it.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} MiniGamesHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Email Verification Request
        
        Hello ${username},
        
        You requested a new verification email. Please click the following link to verify your email:
        ${verificationUrl}
        
        This link will expire in 24 hours.
        
        If you didn't request this email, please ignore it.
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Resend verification email sent:', info.messageId);
      
      // If using Ethereal, log the preview URL
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL PREVIEW URL (Ethereal Email - Testing):');
        console.log(previewUrl);
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      return { success: true, messageId: info.messageId, previewUrl };
    } catch (error) {
      console.error('Error sending resend verification email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

