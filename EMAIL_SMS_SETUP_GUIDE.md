# 📧📱 Email & SMS OTP Setup Guide

## ✅ What's Been Fixed

1. ✅ **Email Service** - Nodemailer with Gmail SMTP
2. ✅ **SMS Service** - Twilio integration
3. ✅ **Direct Registration** - Disabled (OTP required)
4. ✅ **Environment Variables** - Complete `.env.example`

---

## 📧 Email Setup (Gmail SMTP)

### Step 1: Enable 2-Factor Authentication

1. Go to: [https://myaccount.google.com/security](https://myaccount.google.com/security)
2. Click "2-Step Verification"
3. Follow steps to enable 2FA

### Step 2: Create App Password

1. Go to: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Select app: "Mail"
3. Select device: "Other" → Enter "To-Let API"
4. Click "Generate"
5. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

### Step 3: Add to `.env`

```env
# Gmail SMTP
SMTP_SERVICE=gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=abcdefghijklmnop  # Remove spaces!

NODE_ENV=development  # or production
```

### Step 4: Test Email

```bash
# Start server
npm start

# Send test OTP
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"your-email@gmail.com","password":"Test1234"}'
```

**Check your Gmail inbox!** 📧

---

## 📱 SMS Setup (Twilio - Optional)

### Step 1: Sign Up for Twilio (FREE Trial)

1. Go to: [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for free account
3. Verify your phone number
4. Get **$15 free credit** (enough for ~100 SMS)

### Step 2: Get Phone Number

1. Dashboard → Phone Numbers → Buy a number
2. Choose a number with SMS capability
3. **Cost:** $0 (using free trial credit)

### Step 3: Get Credentials

1. Dashboard → Account Info
2. Copy:
   - **Account SID** (e.g., `AC1234567890abcdef...`)
   - **Auth Token** (click "View" to reveal)

### Step 4: Add to `.env`

```env
# Twilio SMS
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your-auth-token-here
TWILIO_PHONE_NUMBER=+12345678900

NODE_ENV=development  # or production
```

### Step 5: Test SMS

```bash
# Send test OTP to phone
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"+8801712345678"}'
```

**Check your phone!** 📱

---

## ⚙️ Complete `.env` Configuration

### Development Mode (Testing):

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key

# Development mode - OTPs log to console
NODE_ENV=development

# Gmail SMTP
SMTP_SERVICE=gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Twilio SMS (Optional)
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12345678900
```

### Production Mode:

```env
PORT=3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-key

# Production mode - Real emails/SMS
NODE_ENV=production

# Gmail SMTP
SMTP_SERVICE=gmail
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Twilio SMS
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12345678900
```

---

## 🧪 Testing

### Test 1: Email OTP (Registration)

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "your-email@gmail.com",
    "password": "Test1234"
  }'

# Expected: Email received with OTP
# Check console log in development mode
```

### Test 2: SMS OTP (Password Reset)

```bash
# Send OTP
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "+8801712345678"
  }'

# Expected: SMS received with OTP
# Check console log in development mode
```

### Test 3: Direct Registration (Should Fail)

```bash
# Try old endpoint
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@example.com",
    "password": "Test1234"
  }'

# Expected Response (410 Gone):
{
  "error": "Direct registration is disabled. Please use /register/send-otp endpoint.",
  "message": "OTP verification is required for registration.",
  "endpoints": {
    "sendOTP": "POST /api/auth/register/send-otp",
    "verifyOTP": "POST /api/auth/register/verify-otp",
    "resendOTP": "POST /api/auth/register/resend-otp"
  }
}
```

---

## 🔧 Troubleshooting

### Issue: "Invalid login" error with Gmail

**Solution:**
1. Make sure 2FA is enabled
2. Use App Password, not your Gmail password
3. Remove spaces from App Password
4. Check: SMTP_SERVICE=gmail

### Issue: "Authentication failed" with Twilio

**Solution:**
1. Verify Account SID and Auth Token
2. Check phone number format: `+12345678900` (with +)
3. Ensure trial account is active

### Issue: Emails not received

**Solution:**
1. Check spam folder
2. Verify SMTP credentials
3. Check console logs for errors
4. Test with: `NODE_ENV=development` first

### Issue: SMS not received

**Solution:**
1. Verify phone number format (E.164: +8801712345678)
2. Check Twilio trial balance
3. Add verified numbers in Twilio console (trial mode)
4. Check console logs

---

## 📊 Email Template Preview

### Registration Email:

```
To-Let Bangladesh
──────────────────
Verify Your Email Address

Thank you for registering with To-Let Bangladesh!

Your verification code is:

┌───────────┐
│  123456   │
└───────────┘

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.
```

### Password Reset Email:

```
To-Let Bangladesh
──────────────────
Reset Your Password

We received a request to reset your password.

Your password reset code is:

┌───────────┐
│  123456   │
└───────────┘

This code will expire in 5 minutes.

If you didn't request a password reset, please ignore this email.
```

---

## 🔒 Security Notes

### Gmail:
- ✅ Use App Passwords (not main password)
- ✅ Keep credentials in `.env` (not in code)
- ✅ Add `.env` to `.gitignore`
- ✅ Use different email for production

### Twilio:
- ✅ Keep Auth Token secret
- ✅ Set spending limits
- ✅ Enable geographic restrictions (optional)
- ✅ Monitor usage dashboard

---

## 💰 Cost Breakdown

### Gmail SMTP:
- **Free:** Up to 500 emails/day
- **Cost after limit:** $0 (just use another Gmail account)

### Twilio SMS:
- **Free Trial:** $15 credit (~100 SMS)
- **After trial:** $0.0075 per SMS (Bangladesh)
- **Monthly:** ~$1 for 133 SMS

### Total Monthly Cost:
- **Email only:** FREE
- **Email + SMS (100/month):** ~$0.75
- **Email + SMS (500/month):** ~$3.75

---

## 🚀 Deployment Checklist

### Before Deploy:

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Add all SMTP credentials
- [ ] Add Twilio credentials (if using SMS)
- [ ] Test email sending
- [ ] Test SMS sending (if enabled)
- [ ] Verify direct `/register` is disabled
- [ ] Check logs for errors

### Environment Variables (Vercel/Railway/Heroku):

```bash
# Required
NODE_ENV=production
SUPABASE_URL=...
SUPABASE_KEY=...

# Email
SMTP_SERVICE=gmail
SMTP_EMAIL=...
SMTP_PASSWORD=...

# SMS (Optional)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
```

---

## 📝 API Endpoints Status

| Endpoint | Status | Notes |
|----------|--------|-------|
| `POST /api/auth/register` | ❌ Disabled | Returns 410 with OTP endpoints |
| `POST /api/auth/register/send-otp` | ✅ Email | Sends OTP via Gmail |
| `POST /api/auth/register/verify-otp` | ✅ Active | Verifies & creates account |
| `POST /api/auth/send-otp` | ✅ Email/SMS | Auto-detects email vs phone |
| `POST /api/auth/verify-otp` | ✅ Active | Verifies password reset OTP |

---

## ✅ Summary

| Feature | Before | After |
|---------|--------|-------|
| **Email** | ❌ Not configured | ✅ Gmail SMTP |
| **SMS** | ❌ Not implemented | ✅ Twilio |
| **Direct Register** | ⚠️ Enabled | ✅ Disabled |
| **OTP Required** | ⚠️ Optional | ✅ Mandatory |
| **Templates** | ❌ None | ✅ HTML emails |

---

## 🎯 Next Steps

1. **Setup Gmail:**
   - Enable 2FA
   - Create App Password
   - Add to `.env`

2. **Setup Twilio (Optional):**
   - Sign up for free
   - Get phone number
   - Add credentials to `.env`

3. **Test:**
   ```bash
   npm start
   # Test registration with email
   # Test password reset with phone
   ```

4. **Deploy:**
   ```bash
   vercel --prod
   # or
   git push heroku main
   ```

**Your OTP system is now fully configured! 🎉**

Gmail SMTP for emails + Twilio for SMS + Direct registration disabled! 🚀
