# 🔐 OTP Password Reset API - Quick Reference

## ✅ Updates Complete

আপনার Express + Supabase backend এখন **OTP-based password reset** support করে!

---

## 📝 Changed Files

### 1. `src/schemas/auth.js`
✅ Added validation schemas:
- `sendOTPSchema` - Phone/Email validation
- `verifyOTPSchema` - OTP (6 digits) validation
- `resendOTPSchema` - Identifier validation
- `resetPasswordOTPSchema` - Complete reset validation

### 2. `src/routes/auth.js`
✅ Updated imports to include new schemas
✅ All OTP endpoints now use **Zod validation**
✅ Proper error handling with validation messages

### 3. `src/utils/otpStore.js` (Already created)
✅ OTP generation & storage
✅ Expiry handling (5 minutes)
✅ Attempt limiting (max 3)

### 4. `src/utils/sendOTP.js` (Already created)
✅ Email/SMS sending utility
✅ Development mode logging

---

## 🔌 API Endpoints

### 1. Send OTP
```bash
POST /api/auth/send-otp
Content-Type: application/json

{
  "identifier": "user@example.com"
}
```

**Validation:**
- `identifier` required (min 1 char)

**Response:**
```json
{
  "success": true,
  "message": "A 6-digit OTP was sent to your email",
  "identifier": "user@example.com",
  "otp": "123456"  // Development only
}
```

---

### 2. Verify OTP
```bash
POST /api/auth/verify-otp
Content-Type: application/json

{
  "identifier": "user@example.com",
  "otp": "123456"
}
```

**Validation:**
- `identifier` required
- `otp` must be exactly 6 digits

**Response:**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "resetToken": "temp-token-12345",
  "identifier": "user@example.com"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

---

### 3. Resend OTP
```bash
POST /api/auth/resend-otp
Content-Type: application/json

{
  "identifier": "user@example.com"
}
```

**Validation:**
- `identifier` required

**Rate Limiting:**
- Can only resend after 1 minute
- Returns remaining time if too soon

**Response:**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "identifier": "user@example.com",
  "otp": "654321"  // Development only
}
```

---

### 4. Reset Password with OTP
```bash
POST /api/auth/reset-password-otp
Content-Type: application/json

{
  "identifier": "user@example.com",
  "resetToken": "temp-token-12345",
  "newPassword": "NewSecure123!"
}
```

**Validation:**
- `identifier` required
- `resetToken` required
- `newPassword` min 6 characters, max 128

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password."
}
```

---

## 🧪 Testing with cURL

### Step 1: Send OTP
```bash
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"test@example.com\"}"
```

### Step 2: Verify OTP (use OTP from console)
```bash
curl -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"test@example.com\",\"otp\":\"123456\"}"
```

### Step 3: Reset Password (use resetToken from step 2)
```bash
curl -X POST http://localhost:3000/api/auth/reset-password-otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"test@example.com\",\"resetToken\":\"token-here\",\"newPassword\":\"NewPass123\"}"
```

---

## ✨ Validation Features

### Automatic Error Messages:
```json
{
  "error": "Invalid request data.",
  "details": [
    {
      "field": "identifier",
      "message": "Phone or Email is required"
    },
    {
      "field": "otp",
      "message": "OTP must be 6 digits"
    }
  ]
}
```

### Password Validation:
- Minimum: 6 characters
- Maximum: 128 characters
- Enforced by Zod schema

---

## 🔒 Security Features

✅ **Input Validation** - All inputs validated with Zod
✅ **OTP Expiry** - 5 minutes validity
✅ **Rate Limiting** - 1 minute cooldown for resend
✅ **Attempt Limiting** - Max 3 wrong attempts
✅ **Token Expiry** - Reset token valid for 10 minutes
✅ **User Privacy** - Doesn't reveal if email exists
✅ **Auto Cleanup** - OTPs deleted after use

---

## 🚀 Quick Start

### 1. Install dependencies (if not already):
```bash
npm install
```

### 2. Set environment variable:
```bash
# .env
NODE_ENV=development  # Shows OTP in response
```

### 3. Start server:
```bash
npm start
```

### 4. Test the flow:
```bash
# Terminal 1: Watch logs for OTP
npm start

# Terminal 2: Send OTP request
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"identifier\":\"your-email@example.com\"}"

# Check Terminal 1 for OTP or check response
```

---

## 📧 Production Setup

### For Email (SendGrid):
```bash
npm install @sendgrid/mail
```

Update `src/utils/sendOTP.js`:
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendOTPEmail(email, otp) {
  await sgMail.send({
    to: email,
    from: 'noreply@yourapp.com',
    subject: 'Password Reset OTP',
    text: `Your OTP is: ${otp}`,
    html: `<p>Your OTP is: <strong>${otp}</strong></p>`,
  });
}
```

---

## 🎯 Comparison: Before vs After

### Before (Link-based):
```javascript
// Old: Supabase email link
await supabase.auth.resetPasswordForEmail(email);
// User gets email with link
// User clicks link → redirects to app
```

### After (OTP-based):
```javascript
// New: OTP flow
POST /api/auth/send-otp → User gets 6-digit code
POST /api/auth/verify-otp → Verify code
POST /api/auth/reset-password-otp → Set new password
```

---

## ✅ All Done!

Your backend is now ready with:
- ✅ OTP-based password reset
- ✅ Proper Zod validation
- ✅ Error handling
- ✅ Rate limiting
- ✅ Security features
- ✅ Development mode testing

**Next:** Integrate with your Flutter app using the complete guide in `OTP_PASSWORD_RESET_GUIDE.md`! 🚀
