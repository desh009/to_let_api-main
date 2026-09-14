# 🚀 Production-Ready OTP Setup Guide

## ✅ Changes Made

আপনার OTP system এখন production-ready:

1. **✅ Persistent Storage** - Supabase database table (না in-memory)
2. **✅ Email Delivery** - Supabase Edge Function integration
3. **✅ Proper Error Handling** - Async/await সহ
4. **✅ Purpose-based OTP** - registration, password_reset আলাদা
5. **✅ Auto Cleanup** - Expired OTPs automatically delete হয়

---

## 📦 Updated Files

### 1. `supabase/otp-schema.sql` ✅ (NEW)
- OTP storage table
- Indexes for performance
- Auto-cleanup function
- RLS enabled

### 2. `src/utils/otpStore.js` ✅ (UPDATED)
- Database-based storage (not in-memory)
- Async functions
- Purpose parameter
- Auto-expiry handling

### 3. `src/utils/sendOTP.js` ✅ (UPDATED)
- Beautiful HTML email templates
- Supabase Edge Function integration
- Purpose-based templates
- Development mode fallback

---

## 🗄️ Step 1: Create Database Table

Run this SQL in your Supabase SQL Editor:

```bash
# Navigate to: Supabase Dashboard → SQL Editor → New Query
```

```sql
-- Paste contents of supabase/otp-schema.sql
```

Or using CLI:

```bash
psql -h <your-supabase-host> -U postgres -d postgres < supabase/otp-schema.sql
```

### Verify Table Created:

```sql
SELECT * FROM public.otp_verifications LIMIT 1;
```

---

## 📧 Step 2: Setup Email Delivery

### Option A: Supabase Edge Function (Recommended)

#### 1. Create Edge Function:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Create edge function
supabase functions new send-otp-email
```

#### 2. Edit `supabase/functions/send-otp-email/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

serve(async (req) => {
  try {
    const { to, subject, html } = await req.json()

    // Using Resend.com (free tier: 100 emails/day)
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'To-Let Bangladesh <noreply@yourdomain.com>',
        to: [to],
        subject,
        html,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.message || 'Failed to send email')
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
```

#### 3. Deploy Edge Function:

```bash
# Set secret
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Deploy
supabase functions deploy send-otp-email
```

#### 4. Get Resend API Key (FREE):

1. Go to [https://resend.com](https://resend.com)
2. Sign up (Free: 100 emails/day)
3. Create API Key
4. Add to Supabase secrets

---

### Option B: SendGrid (Alternative)

#### 1. Install SendGrid:

```bash
npm install @sendgrid/mail
```

#### 2. Update `src/utils/sendOTP.js`:

```javascript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOTPEmail(email, otp, purpose = 'verification') {
  const { subject, htmlContent } = getEmailTemplate(otp, purpose);
  
  await sgMail.send({
    to: email,
    from: 'noreply@yourdomain.com', // Verified sender
    subject,
    html: htmlContent,
  });
  
  return true;
}
```

#### 3. Get SendGrid API Key:

1. Sign up: [https://sendgrid.com](https://sendgrid.com)
2. Free tier: 100 emails/day
3. Create API Key
4. Add to `.env`:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

---

### Option C: SMTP (Gmail, etc.)

#### 1. Install Nodemailer:

```bash
npm install nodemailer
```

#### 2. Update `src/utils/sendOTP.js`:

```javascript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD, // App-specific password
  },
});

export async function sendOTPEmail(email, otp, purpose = 'verification') {
  const { subject, htmlContent } = getEmailTemplate(otp, purpose);
  
  await transporter.sendMail({
    from: '"To-Let Bangladesh" <noreply@yourdomain.com>',
    to: email,
    subject,
    html: htmlContent,
  });
  
  return true;
}
```

#### 3. Gmail Setup:

1. Enable 2FA: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Create App Password
3. Add to `.env`:

```env
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 🧪 Step 3: Test Everything

### 1. Test Database Connection:

```javascript
// Test script: test-otp-db.js
import { storeOTP, verifyOTP } from './src/utils/otpStore.js';

async function test() {
  // Store OTP
  const result = await storeOTP('test@example.com', '123456', 'registration');
  console.log('Store result:', result);
  
  // Verify OTP
  const verifyResult = await verifyOTP('test@example.com', '123456', 'registration');
  console.log('Verify result:', verifyResult);
}

test();
```

```bash
node test-otp-db.js
```

### 2. Test Email Sending:

```bash
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"your-email@gmail.com","password":"Test1234"}'
```

Check your email inbox!

### 3. Complete Flow Test:

```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123"}'

# 2. Verify OTP (use OTP from email)
curl -X POST http://localhost:3000/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","otp":"123456","name":"John Doe","password":"SecurePass123"}'
```

---

## 🔧 Step 4: Environment Variables

Update your `.env` file:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key

# Node Environment
NODE_ENV=production  # Set to 'development' for testing

# Email Service (choose one)

# Option A: Resend (via Supabase Edge Function)
# RESEND_API_KEY=re_xxxxxxxxxxxxx (set via: supabase secrets set)

# Option B: SendGrid
# SENDGRID_API_KEY=SG.xxxxxxxxxxxxx

# Option C: Gmail SMTP
# SMTP_EMAIL=your-email@gmail.com
# SMTP_PASSWORD=your-app-password
```

---

## 🔄 Step 5: Auto Cleanup (Optional)

Setup automatic cleanup of expired OTPs:

### Option A: Cron Job (Supabase)

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup every 30 minutes
SELECT cron.schedule(
  'cleanup-expired-otps',
  '*/30 * * * *',
  'SELECT cleanup_expired_otps()'
);

-- View scheduled jobs
SELECT * FROM cron.job;
```

### Option B: Node.js Cron

```bash
npm install node-cron
```

```javascript
// src/cron/cleanup-otps.js
import cron from 'node-cron';
import { cleanupExpiredOTPs } from '../utils/otpStore.js';

// Run every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('Running OTP cleanup...');
  await cleanupExpiredOTPs();
  console.log('OTP cleanup completed');
});
```

Add to `src/server.js`:

```javascript
import './cron/cleanup-otps.js';
```

---

## 📊 Monitoring

### Check OTP Table:

```sql
-- Total OTPs
SELECT COUNT(*) FROM public.otp_verifications;

-- Active OTPs
SELECT COUNT(*) FROM public.otp_verifications
WHERE expires_at > NOW() AND verified = FALSE;

-- OTPs by purpose
SELECT purpose, COUNT(*) 
FROM public.otp_verifications
GROUP BY purpose;

-- Recent OTPs
SELECT identifier, purpose, created_at, expires_at, verified
FROM public.otp_verifications
ORDER BY created_at DESC
LIMIT 10;
```

---

## 🔒 Security Checklist

- [x] ✅ OTP stored in database (persistent)
- [x] ✅ 5 minute expiry
- [x] ✅ Max 3 attempts
- [x] ✅ Rate limiting (1 min resend cooldown)
- [x] ✅ Purpose-based OTPs
- [x] ✅ Email templates (HTML)
- [x] ✅ Auto cleanup
- [x] ✅ RLS enabled
- [x] ✅ Service role only access
- [x] ✅ Development mode (console logs)
- [x] ✅ Production mode (real emails)

---

## 🚀 Deployment

### Vercel Deployment:

```bash
# Install Vercel CLI
npm install -g vercel

# Add environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add NODE_ENV production

# Deploy
vercel --prod
```

### Environment Variables in Vercel:

1. Go to: Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - `NODE_ENV=production`
   - Email service keys (if needed)

---

## 📝 Testing Checklist

### Registration Flow:
- [ ] Send OTP → Check database
- [ ] Receive email → Verify HTML template
- [ ] Verify correct OTP → Success
- [ ] Verify wrong OTP → Error
- [ ] Verify expired OTP → Error
- [ ] Max 3 attempts → Blocked
- [ ] Resend OTP → New OTP generated

### Password Reset Flow:
- [ ] Send OTP → Check database
- [ ] Verify OTP → Success
- [ ] Reset password → Success

---

## 🎯 Summary

### Before (Development):
- ❌ In-memory storage (data lost on restart)
- ❌ Console.log only (no real emails)
- ❌ Not production-ready

### After (Production):
- ✅ Database storage (persistent)
- ✅ Real email delivery
- ✅ Beautiful HTML templates
- ✅ Auto cleanup
- ✅ Monitoring
- ✅ Secure & scalable

---

## 📞 Troubleshooting

### Issue: OTPs not stored
**Solution:** Run `supabase/otp-schema.sql`

### Issue: Emails not sending
**Solution:** 
1. Check email service API key
2. Check `.env` file
3. Check logs for errors
4. Verify sender email

### Issue: "Table not found"
**Solution:** Run database migration

### Issue: OTPs expired immediately
**Solution:** Check server timezone

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [SendGrid Documentation](https://docs.sendgrid.com)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Nodemailer Documentation](https://nodemailer.com)

---

**Your OTP system is now production-ready! 🎉**

Choose your email service → Setup → Deploy → Test → Launch! 🚀
