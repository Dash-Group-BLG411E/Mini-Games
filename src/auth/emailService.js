const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
  constructor() {
    this.transporter = null;
    this.resend = null;
    this.brevoApi = null;
    this.isConfigured = false;
    this.useResend = false;
    this.useBrevoApi = false;
    this.initTransporter();
  }

  async initTransporter() {
    // Priority 1: Brevo (SendinBlue) HTTP API - Free, works on Render, 300 emails/day
    // Use API instead of SMTP to avoid Render's SMTP port blocking
    // Note: Get API key from Brevo dashboard > Settings > API Keys (not SMTP key)
    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY || process.env.BREVO_SMTP_KEY || process.env.SENDINBLUE_SMTP_KEY;
    
    if (brevoApiKey) {
      try {
        console.log('🔧 Attempting to configure Brevo HTTP API...');
        const brevo = require('@getbrevo/brevo');
        this.brevoApi = new brevo.TransactionalEmailsApi();
        // Set API key using the correct method
        this.brevoApi.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
        this.brevoApiKey = brevoApiKey; // Store for later use
        this.useBrevoApi = true;
        this.isConfigured = true;
        console.log('✅ Email service configured successfully (Brevo HTTP API)');
        return;
      } catch (error) {
        console.error('❌ Failed to configure Brevo API:');
        console.error('   Error:', error.message);
        console.error('   Stack:', error.stack);
        console.log('Falling back to other options...');
      }
    }

    // Priority 2: Resend API (if configured)
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      try {
        const { Resend } = require('resend');
        this.resend = new Resend(resendApiKey);
        this.useResend = true;
        this.isConfigured = true;
        console.log('✅ Email service configured successfully (Resend)');
        return;
      } catch (error) {
        console.error('Failed to initialize Resend:', error.message);
        console.log('Falling back to SMTP...');
      }
    }

    // Priority 3: Generic SMTP (Gmail, Outlook, etc.)
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (smtpUser && smtpPass) {
      try {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });
        
        await this.transporter.verify();
        this.isConfigured = true;
        console.log('✅ Email service configured successfully (SMTP)');
      } catch (error) {
        console.error('Failed to configure email service:', error.message);
        this.transporter = null;
        this.isConfigured = false;
      }
    } else {
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
        console.warn('Email service not configured. Set RESEND_API_KEY or SMTP_USER and SMTP_PASS environment variables.');
        this.isConfigured = false;
      }
    }
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  async sendVerificationEmail(email, username, token) {
    if (!this.isConfigured) {
      console.error('Email service not configured. Cannot send verification email.');
      return { 
        success: false, 
        error: 'Email service not configured. Please set BREVO_SMTP_KEY and BREVO_EMAIL, or RESEND_API_KEY, or SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    // Get BASE_URL - ensure it matches your sending domain for better deliverability
    // For production: Use your verified domain (e.g., https://yourdomain.com)
    // For development: http://localhost:3000 is fine
    let baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // Determine FROM email address
    // Priority: EMAIL_FROM env var > Brevo email > SMTP_USER > Resend default
    let fromEmail = process.env.EMAIL_FROM;
    
    if (!fromEmail) {
      // If using Brevo, use the Brevo email
      const brevoEmail = process.env.BREVO_EMAIL || process.env.SENDINBLUE_EMAIL;
      if (brevoEmail) {
        fromEmail = brevoEmail;
      } else {
        // Fallback to SMTP_USER or Resend default
        fromEmail = (process.env.SMTP_USER || process.env.EMAIL_USER) || 'onboarding@resend.dev';
      }
    }
    
    // If using Resend and EMAIL_FROM is set to a Gmail address, use Resend's default
    if (this.useResend && fromEmail.includes('@gmail.com') && !process.env.EMAIL_FROM_VERIFIED) {
      console.warn('⚠️  WARNING: Cannot send FROM Gmail address without domain verification.');
      console.warn('   Using onboarding@resend.dev as FROM address instead.');
      fromEmail = 'onboarding@resend.dev';
    }
    
    // Warn if using localhost with Resend (spam filter risk)
    if (this.useResend && baseUrl.includes('localhost')) {
      console.warn('⚠️  WARNING: Using localhost URL with Resend may trigger spam filters.');
      console.warn('   For production, set BASE_URL to your verified domain (e.g., https://yourdomain.com)');
    }

    const emailHtml = `
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
    `;

    const emailText = `
      Welcome to MiniGamesHub, ${username}!
      
      Please verify your email address by clicking the following link:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create an account, please ignore this email.
    `;

    // Use Brevo API if configured (Priority 1)
    if (this.useBrevoApi && this.brevoApi) {
      try {
        console.log('📧 Attempting to send email via Brevo API...');
        console.log('   From:', fromEmail);
        console.log('   To:', email);
        
        const brevo = require('@getbrevo/brevo');
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = 'Verify Your Email - MiniGamesHub';
        sendSmtpEmail.htmlContent = emailHtml;
        sendSmtpEmail.textContent = emailText;
        sendSmtpEmail.sender = { name: 'MiniGamesHub', email: fromEmail };
        sendSmtpEmail.to = [{ email: email }];
        
        const response = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
        
        // Brevo API returns { body: { messageId: '...' } }
        const emailId = response?.body?.messageId || response?.messageId;
        if (!emailId) {
          console.warn('⚠️  Brevo API did not return a message ID. Response:', JSON.stringify(response, null, 2));
          return { success: false, error: 'Email sent but no confirmation ID received' };
        }
        
        console.log('✅ Verification email sent via Brevo API:', emailId);
        console.log('   To:', email);
        return { success: true, messageId: emailId };
      } catch (error) {
        console.error('❌ Error sending verification email via Brevo API:');
        console.error('   Error:', error);
        console.error('   To:', email);
        if (error.response) {
          console.error('   Brevo API response:', error.response.body || error.response.text);
        }
        return { success: false, error: error.message || 'Failed to send email' };
      }
    }

    // Use Resend if configured (Priority 2)
    if (this.useResend && this.resend) {
      try {
        console.log('📧 Attempting to send email via Resend...');
        console.log('   From:', fromEmail);
        console.log('   To:', email);
        
        const response = await this.resend.emails.send({
          from: `MiniGamesHub <${fromEmail}>`,
          to: email,
          subject: 'Verify Your Email - MiniGamesHub',
          html: emailHtml,
          text: emailText
        });
        
        // Log full response for debugging
        console.log('📬 Resend API Response:', JSON.stringify(response, null, 2));
        
        // Check for errors in the response first
        if (response?.error) {
          console.error('❌ Resend API Error:', response.error);
          const errorMessage = response.error.message || 'Failed to send email';
          console.error('   Error details:', errorMessage);
          return { success: false, error: errorMessage };
        }
        
        // Resend API returns { data: { id: '...' } } or { id: '...' } depending on version
        const emailId = response?.data?.id || response?.id;
        
        if (!emailId) {
          console.warn('⚠️  Resend API did not return an email ID. Response:', response);
          return { success: false, error: 'Email sent but no confirmation ID received' };
        }
        
        console.log('✅ Verification email sent via Resend:', emailId);
        console.log('   To:', email);
        return { success: true, messageId: emailId };
      } catch (error) {
        console.error('❌ Error sending verification email via Resend:');
        console.error('   Error:', error);
        console.error('   Error message:', error.message);
        console.error('   To:', email);
        console.error('   From:', fromEmail);
        
        // Log more details about the error
        if (error.response) {
          console.error('   Resend API error response:', JSON.stringify(error.response, null, 2));
        }
        if (error.message) {
          console.error('   Error details:', error.message);
        }
        
        return { success: false, error: error.message || 'Failed to send email' };
      }
    }

    // Fallback to SMTP/Nodemailer
    if (!this.transporter) {
      return { success: false, error: 'Email transporter not available' };
    }

    const mailOptions = {
      from: fromEmail.includes('@') ? `"MiniGamesHub" <${fromEmail}>` : fromEmail,
      to: email,
      subject: 'Verify Your Email - MiniGamesHub',
      html: emailHtml,
      text: emailText
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent:', info.messageId);
      
      // Only log preview URL in development (Ethereal Email for testing)
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl && (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER)) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL PREVIEW URL (Development/Testing Only):');
        console.log(previewUrl);
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendResendVerificationEmail(email, username, token) {
    if (!this.isConfigured) {
      console.error('Email service not configured. Cannot send verification email.');
      return { 
        success: false, 
        error: 'Email service not configured. Please set BREVO_SMTP_KEY and BREVO_EMAIL, or RESEND_API_KEY, or SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    // Get BASE_URL - ensure it matches your sending domain for better deliverability
    let baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash if present
    const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

    // Determine FROM email address (same logic as sendVerificationEmail)
    let fromEmail = process.env.EMAIL_FROM;
    
    if (!fromEmail) {
      const brevoEmail = process.env.BREVO_EMAIL || process.env.SENDINBLUE_EMAIL;
      if (brevoEmail) {
        fromEmail = brevoEmail;
      } else {
        fromEmail = (process.env.SMTP_USER || process.env.EMAIL_USER) || 'onboarding@resend.dev';
      }
    }
    
    if (this.useResend && fromEmail.includes('@gmail.com') && !process.env.EMAIL_FROM_VERIFIED) {
      fromEmail = 'onboarding@resend.dev';
    }

    const emailHtml = `
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
    `;

    const emailText = `
      Email Verification Request
      
      Hello ${username},
      
      You requested a new verification email. Please click the following link to verify your email:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't request this email, please ignore it.
    `;

    // Use Brevo API if configured (Priority 1)
    if (this.useBrevoApi && this.brevoApi) {
      try {
        console.log('📧 Attempting to send resend verification email via Brevo API...');
        console.log('   From:', fromEmail);
        console.log('   To:', email);
        
        const brevo = require('@getbrevo/brevo');
        const sendSmtpEmail = new brevo.SendSmtpEmail();
        sendSmtpEmail.subject = 'Verify Your Email - MiniGamesHub';
        sendSmtpEmail.htmlContent = emailHtml;
        sendSmtpEmail.textContent = emailText;
        sendSmtpEmail.sender = { name: 'MiniGamesHub', email: fromEmail };
        sendSmtpEmail.to = [{ email: email }];
        
        const response = await this.brevoApi.sendTransacEmail(sendSmtpEmail);
        
        // Brevo API returns { body: { messageId: '...' } }
        const emailId = response?.body?.messageId || response?.messageId;
        if (!emailId) {
          console.warn('⚠️  Brevo API did not return a message ID. Response:', JSON.stringify(response, null, 2));
          return { success: false, error: 'Email sent but no confirmation ID received' };
        }
        
        console.log('✅ Resend verification email sent via Brevo API:', emailId);
        return { success: true, messageId: emailId };
      } catch (error) {
        console.error('❌ Error sending resend verification email via Brevo API:', error);
        if (error.response) {
          console.error('   Brevo API response:', error.response.body || error.response.text);
        }
        return { success: false, error: error.message || 'Failed to send email' };
      }
    }

    // Use Resend if configured (Priority 2)
    if (this.useResend && this.resend) {
      try {
        const response = await this.resend.emails.send({
          from: `MiniGamesHub <${fromEmail}>`,
          to: email,
          subject: 'Verify Your Email - MiniGamesHub',
          html: emailHtml,
          text: emailText
        });
        
        // Check for errors in the response first
        if (response?.error) {
          console.error('❌ Resend API Error:', response.error);
          const errorMessage = response.error.message || 'Failed to send email';
          return { success: false, error: errorMessage };
        }
        
        // Resend API returns { data: { id: '...' } } or { id: '...' } depending on version
        const emailId = response?.data?.id || response?.id;
        if (!emailId) {
          return { success: false, error: 'Email sent but no confirmation ID received' };
        }
        
        console.log('Resend verification email sent via Resend:', emailId);
        return { success: true, messageId: emailId };
      } catch (error) {
        console.error('Error sending resend verification email via Resend:', error);
        return { success: false, error: error.message };
      }
    }

    // Fallback to SMTP/Nodemailer
    if (!this.transporter) {
      return { success: false, error: 'Email transporter not available' };
    }

    const mailOptions = {
      from: fromEmail.includes('@') ? `"MiniGamesHub" <${fromEmail}>` : fromEmail,
      to: email,
      subject: 'Verify Your Email - MiniGamesHub',
      html: emailHtml,
      text: emailText
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Resend verification email sent:', info.messageId);
      
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl && (process.env.NODE_ENV === 'development' || !process.env.SMTP_USER)) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('📧 EMAIL PREVIEW URL (Development/Testing Only):');
        console.log(previewUrl);
        console.log('═══════════════════════════════════════════════════════════');
      }
      
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending resend verification email:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();

