# Environment Variables Setup Guide

This guide will help you set up all the required environment variables for the Mini-Games platform.

## Quick Start

1. Copy `.env.example` to `.env` in the root directory
2. Fill in the values below
3. Restart your server

## Required Variables

### 1. Database Configuration

```env
MONGODB_URI=mongodb://localhost:27017/minigames
```

**Options:**
- **Local MongoDB**: `mongodb://localhost:27017/minigames`
- **MongoDB Atlas**: Get connection string from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

### 2. Server Configuration

```env
PORT=3000
BASE_URL=http://localhost:3000
```

- **PORT**: Port your server runs on (default: 3000)
- **BASE_URL**: 
  - **Development**: `http://localhost:3000`
  - **Production**: `https://yourdomain.com` (for email verification links)

### 3. JWT Secret

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Generate a secure random string:**
```bash
# On Linux/Mac:
openssl rand -base64 32

# Or use an online generator
```

### 4. Email Configuration

#### Option A: Resend (Recommended - Easiest!)

**Free tier: 3,000 emails/month, 100 emails/day**

1. Sign up at: https://resend.com/signup
2. Verify your email address
3. Go to **API Keys** → **Create API Key**
4. Copy the API key (starts with `re_`)

```env
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=onboarding@resend.dev
```

**Note:** For production, you'll need to verify your domain in Resend to use a custom email address.

#### Option B: SMTP (Gmail, Outlook, etc.)

##### For Gmail:

1. **Enable 2-Step Verification** on your Google account
2. Go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Generate an app password for "Mail"
4. Use that app password (not your regular password)

```env
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
```

#### For Other Email Providers:

**Outlook/Hotmail:**
```env
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Yahoo:**
```env
SMTP_USER=your-email@yahoo.com
SMTP_PASS=your-app-password
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_SECURE=false
```

**Custom SMTP (SendGrid, Mailgun, etc.):**
```env
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_SECURE=false
```

### 5. Optional: Custom "From" Email

```env
EMAIL_FROM=noreply@yourdomain.com
```

If not set, it will use `SMTP_USER` as the sender.

### 6. Environment

```env
NODE_ENV=development
```

- **development**: Uses test email service if SMTP not configured
- **production**: Requires SMTP configuration

## Complete .env File Example

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/minigames

# Server Configuration
PORT=3000
BASE_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Gmail Example)
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false

# Optional
EMAIL_FROM=noreply@yourdomain.com
NODE_ENV=development
```

## Testing Email Configuration

After setting up your `.env` file:

1. Restart your server
2. Check the console for: `✅ Email service configured successfully`
3. Try registering a new user
4. Check your email inbox for the verification email

## Troubleshooting

### Email not sending?

1. **Check console logs** - Look for email service errors
2. **Verify SMTP credentials** - Make sure username/password are correct
3. **Check firewall** - Port 587 must be open
4. **Gmail users** - Must use App Password, not regular password
5. **Test connection** - The server will log connection status on startup

### Development Mode

If SMTP is not configured, the system will:
- Use Ethereal Email (test service)
- Show preview URLs in **server console only** (not to users)
- Still allow registration, but emails won't be real

## Security Notes

⚠️ **Never commit `.env` file to git!**
- `.env` is already in `.gitignore`
- Use `.env.example` as a template
- Use different secrets for development and production

