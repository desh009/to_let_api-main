# 🚀 Quick Start - Email & SMS OTP

## ✅ সব কিছু Ready!

1. ✅ Email service (Gmail SMTP)
2. ✅ SMS service (Twilio)
3. ✅ Direct registration disabled
4. ✅ OTP mandatory for registration

---

## 📋 Setup Checklist (5 Minutes)

### Step 1: Gmail Setup (2 minutes)

1. **Enable 2FA:** [https://myaccount.google.com/security](https://myaccount.google.com/security)

2. **Create App Password:** [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - App: Mail
   - Device: Other (To-Let API)
   - Copy 16-character password

3. **Update `.env`:**
   ```env
   SMTP_SERVICE=gmail
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=abcdefghijklmnop
   NODE_ENV=development
   ```

### Step 2: Test Email (1 minute)

```bash
# Option A: Quick test script
npm run test:email-sms

# Option B: Manual test
npm start
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"your-email@gmail.com","password":"Test1234"}'
```

**✅ Check your Gmail inbox!**

---

## 📱 SMS Setup (Optional - 5 minutes)

### Step 1: Twilio Account

1. Sign up: [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Get $15 free credit
3. Buy a phone number (FREE with trial credit)

### Step 2: Get Credentials

Dashboard → Account Info:
- **Account SID:** `AC1234...`
- **Auth Token:** Click "View"

### Step 3: Update `.env`

```env
TWILIO_ACCOUNT_SID=AC1234567890abcdef
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+12345678900
```

### Step 4: Test SMS

```bash
npm run test:email-sms
```

**✅ Check your phone!**

---

## 🧪 Testing

### Test Script (Easiest):

```bash
npm run test:email-sms
```

Output:
```
=================================
  Email & SMS OTP Test Script
=================================

📋 Configuration Check:

NODE_ENV: development
SMTP_EMAIL: ✅ Set
SMTP_PASSWORD: ✅ Set
TWILIO_ACCOUNT_SID: ✅ Set

📧 Testing Email OTP...
Sending OTP to: your-email@gmail.com
✅ Email sent successfully!

📱 Testing SMS OTP...
Sending SMS to: +8801712345678
✅ SMS sent successfully!
```

### Manual Testing:

#### Registration Flow:
```bash
# 1. Send OTP
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@gmail.com",
    "password": "Test1234"
  }'

# 2. Check email for OTP

# 3. Verify OTP
curl -X POST http://localhost:3000/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@gmail.com",
    "otp": "123456",
    "name": "Test User",
    "password": "Test1234"
  }'
```

#### Password Reset Flow:
```bash
# 1. Send OTP (Email)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@gmail.com"}'

# 2. Send OTP (Phone)
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"identifier":"+8801712345678"}'

# 3. Check email/phone for OTP

# 4. Verify OTP
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "identifier":"test@gmail.com",
    "otp":"123456"
  }'
```

#### Direct Registration (Should Fail):
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "test@gmail.com",
    "password": "Test1234"
  }'

# Expected: 410 Gone
{
  "error": "Direct registration is disabled. Please use /register/send-otp endpoint."
}
```

---

## 🔧 Troubleshooting

### Gmail: "Invalid login"
- ✅ Use App Password (not Gmail password)
- ✅ Remove spaces from password
- ✅ Check `SMTP_SERVICE=gmail`

### Gmail: Not receiving emails
- ✅ Check spam folder
- ✅ Wait 1-2 minutes
- ✅ Check console logs

### Twilio: "Authentication failed"
- ✅ Check Account SID & Auth Token
- ✅ Phone format: `+12345678900`

### Twilio: SMS not received
- ✅ Add phone to verified list (trial mode)
- ✅ Check trial balance
- ✅ Phone format: `+8801712345678` (E.164)

---

## 📊 What Works Now

| Feature | Status | Notes |
|---------|--------|-------|
| Email OTP | ✅ Working | Gmail SMTP configured |
| SMS OTP | ✅ Working | Twilio configured |
| Direct Registration | ❌ Disabled | Returns 410 error |
| OTP Registration | ✅ Required | Email verification mandatory |
| Password Reset (Email) | ✅ Working | Sends OTP via email |
| Password Reset (Phone) | ✅ Working | Sends OTP via SMS |

---

## 🎯 Development vs Production

### Development Mode:
```env
NODE_ENV=development
```
- ✅ OTPs log to console
- ✅ Email/SMS failures don't block
- ✅ Easier testing

### Production Mode:
```env
NODE_ENV=production
```
- ✅ OTPs NOT logged
- ✅ Failures return errors
- ✅ Real email/SMS only

---

## 💰 Cost

### Gmail:
- **FREE:** 500 emails/day
- **After:** Use another Gmail account

### Twilio:
- **Trial:** $15 credit (~100 SMS)
- **After:** $0.0075/SMS
- **100 SMS/month:** ~$0.75

### Total:
- **Email only:** FREE
- **Email + SMS (100/month):** ~$0.75

---

## 🚀 Deploy

### Environment Variables:

```bash
# Vercel
vercel env add SMTP_EMAIL
vercel env add SMTP_PASSWORD
vercel env add TWILIO_ACCOUNT_SID
vercel env add TWILIO_AUTH_TOKEN
vercel env add NODE_ENV production

vercel --prod
```

### Or copy `.env`:
```bash
cp .env.example .env
# Fill in credentials
# Deploy to Vercel/Railway/Heroku
```

---

## ✅ Checklist

- [ ] Gmail 2FA enabled
- [ ] App Password created
- [ ] Credentials in `.env`
- [ ] `npm run test:email-sms` passes
- [ ] Email received
- [ ] SMS received (if using Twilio)
- [ ] Direct `/register` returns 410
- [ ] Registration with OTP works
- [ ] Password reset with email works
- [ ] Password reset with phone works

---

## 📚 Files

| File | Purpose |
|------|---------|
| `EMAIL_SMS_SETUP_GUIDE.md` | Detailed setup guide |
| `QUICK_START_EMAIL_SMS.md` | This quick start |
| `test-email-sms.js` | Test script |
| `.env.example` | Environment template |
| `src/utils/sendOTP.js` | Email/SMS implementation |

---

## 🎉 Done!

আপনার OTP system এখন সম্পূর্ণ ready:

✅ Gmail SMTP configured
✅ Twilio SMS configured  
✅ Direct registration disabled
✅ OTP mandatory
✅ Production ready

**Test করুন:**
```bash
npm run test:email-sms
```

**Deploy করুন:**
```bash
vercel --prod
```

🚀 **Let's go!**
