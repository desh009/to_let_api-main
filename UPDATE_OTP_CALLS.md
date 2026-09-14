# 🔄 OTP Function Calls - Update Required

## ⚠️ Important: All OTP functions are now ASYNC

সব `storeOTP`, `verifyOTP`, `deleteOTP`, `hasValidOTP`, `getOTPRemainingTime` functions এখন **async** এবং database use করছে।

---

## 🔧 Required Updates in `src/routes/auth.js`

### Find & Replace Pattern:

#### 1. storeOTP calls:
**Before:**
```javascript
storeOTP(identifier, otp);
```

**After:**
```javascript
await storeOTP(identifier, otp, 'purpose');
```

#### 2. verifyOTP calls:
**Before:**
```javascript
const result = verifyOTP(identifier, otp);
```

**After:**
```javascript
const result = await verifyOTP(identifier, otp, 'purpose');
```

#### 3. deleteOTP calls:
**Before:**
```javascript
deleteOTP(identifier);
```

**After:**
```javascript
await deleteOTP(identifier, 'purpose');
```

#### 4. hasValidOTP calls:
**Before:**
```javascript
if (hasValidOTP(identifier)) {
```

**After:**
```javascript
if (await hasValidOTP(identifier, 'purpose')) {
```

#### 5. getOTPRemainingTime calls:
**Before:**
```javascript
const remainingTime = getOTPRemainingTime(identifier);
```

**After:**
```javascript
const remainingTime = await getOTPRemainingTime(identifier, 'purpose');
```

---

## 📝 Purpose Values:

- `'registration'` - For registration OTPs
- `'password_reset'` - For password reset OTPs
- `'login'` - For login OTPs (if implemented)
- `'general'` - Default fallback

---

## ✅ Example Complete Updates:

### Registration Send OTP:
```javascript
// Generate and store OTP
const otp = generateOTP();
await storeOTP(email, otp, 'registration');

// Send OTP via email
await sendOTP(email, otp, 'registration');
```

### Registration Verify OTP:
```javascript
// Verify OTP
const result = await verifyOTP(email, otp, 'registration');

if (!result.success) {
  return res.status(400).json({ 
    success: false,
    error: result.error 
  });
}

// Clean up OTPs
await deleteOTP(email, 'registration');
```

### Registration Resend OTP:
```javascript
// Check if there's already a valid OTP
if (await hasValidOTP(email, 'registration')) {
  const remainingTime = await getOTPRemainingTime(email, 'registration');
  
  if (remainingTime > 240) {
    return res.status(429).json({ 
      error: 'Please wait before requesting a new OTP',
      remainingTime: 300 - remainingTime
    });
  }
}

// Generate and store new OTP
const otp = generateOTP();
await storeOTP(email, otp, 'registration');
```

### Password Reset Send OTP:
```javascript
// Generate and store OTP
const otp = generateOTP();
await storeOTP(identifier, otp, 'password_reset');

// Send OTP via email or SMS
await sendOTP(identifier, otp, 'password_reset');
```

### Password Reset Verify OTP:
```javascript
// Verify OTP
const result = await verifyOTP(identifier, otp, 'password_reset');

if (!result.success) {
  return res.status(400).json({ 
    success: false,
    error: result.error 
  });
}

// Generate a temporary reset token
const resetToken = generateOTP() + Date.now().toString();
await storeOTP(`reset_${identifier}`, resetToken, 'password_reset_token');

// Delete original OTP
await deleteOTP(identifier, 'password_reset');
```

---

## 🚨 Common Mistakes to Avoid:

### ❌ Wrong (Forgot await):
```javascript
storeOTP(email, otp, 'registration'); // Won't work!
```

### ✅ Correct:
```javascript
await storeOTP(email, otp, 'registration');
```

### ❌ Wrong (Missing purpose):
```javascript
await storeOTP(email, otp); // Uses 'general' purpose
```

### ✅ Correct:
```javascript
await storeOTP(email, otp, 'registration');
```

---

## 🔍 Quick Fix Script

আমি একটা fixed version তৈরি করি? (Y/N)

If yes, I'll create a complete updated `auth.js` file with all async calls properly handled.
