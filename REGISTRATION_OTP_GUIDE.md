# 📝 Registration with OTP - Complete Guide

## 🎯 Overview

Registration flow এখন OTP-based! User email verify করার পরেই account create হবে।

---

## 🔄 Registration Flow

```
User enters: Name, Email, Password
    ↓
POST /api/auth/register/send-otp
    ↓
User receives 6-digit OTP via email
    ↓
User enters OTP
    ↓
POST /api/auth/register/verify-otp
    ↓
Account created + Auto-login
    ↓
User redirected to Home
```

---

## 🔌 API Endpoints

### 1. Send Registration OTP

**Request:**
```http
POST /api/auth/register/send-otp
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Validation:**
- `name` - minimum 2 characters, maximum 80
- `email` - valid email format, maximum 254 characters
- `password` - minimum 8 characters, maximum 128

**Success Response (200):**
```json
{
  "success": true,
  "message": "A 6-digit OTP was sent to your email",
  "email": "john@example.com",
  "otp": "123456"  // Only in development mode
}
```

**Error Response - Email exists (409):**
```json
{
  "error": "An account already exists with this email."
}
```

**Error Response - Validation (422):**
```json
{
  "error": "Invalid request data.",
  "details": [
    {
      "field": "email",
      "message": "Invalid email"
    },
    {
      "field": "password",
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
```

---

### 2. Verify OTP and Complete Registration

**Request:**
```http
POST /api/auth/register/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**Validation:**
- `email` - valid email format
- `otp` - exactly 6 digits
- `name` - minimum 2 characters
- `password` - minimum 8 characters

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful!",
  "data": {
    "user": {
      "uid": "uuid-123",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "idToken": "access-token-here",
    "refreshToken": "refresh-token-here",
    "expiresIn": 3600
  }
}
```

**Error Response - Invalid OTP (400):**
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

Possible OTP errors:
- "OTP not found or expired"
- "OTP expired"
- "Too many failed attempts"
- "Invalid OTP"

**Error Response - Email exists (409):**
```json
{
  "error": "An account already exists with this email."
}
```

---

### 3. Resend Registration OTP

**Request:**
```http
POST /api/auth/register/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "email": "john@example.com",
  "otp": "654321"  // Only in development
}
```

**Rate Limit Response (429):**
```json
{
  "error": "Please wait before requesting a new OTP",
  "remainingTime": 45  // seconds
}
```

---

## 💻 Flutter Implementation

### Dependencies
```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.0
  pin_code_fields: ^8.0.1
```

---

### Screen 1: Registration Form

```dart
// lib/screens/auth/register_screen.dart

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class RegisterScreen extends StatefulWidget {
  @override
  _RegisterScreenState createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _sendOTP() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/auth/register/send-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'name': _nameController.text.trim(),
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Navigate to OTP verification screen
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => VerifyRegistrationOTPScreen(
              name: _nameController.text.trim(),
              email: data['email'],
              password: _passwordController.text,
              otp: data['otp'], // For testing only
            ),
          ),
        );
      } else {
        _showError(data['error'] ?? 'Failed to send OTP');
      }
    } catch (e) {
      _showError('Network error: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: Color(0xFFB85C48),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.person_add,
                    color: Colors.white,
                    size: 28,
                  ),
                ),
                SizedBox(height: 24),

                // Title
                Text(
                  'Create Account',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                  ),
                ),
                SizedBox(height: 8),

                // Description
                Text(
                  'Sign up to get started with To-Let Bangladesh',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                SizedBox(height: 32),

                // Name field
                Text(
                  'Full Name',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    hintText: 'Enter your name',
                    prefixIcon: Icon(Icons.person_outline, color: Colors.grey),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB85C48), width: 2),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your name';
                    }
                    if (value.length < 2) {
                      return 'Name must be at least 2 characters';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),

                // Email field
                Text(
                  'Email',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                TextFormField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(
                    hintText: 'Enter your email',
                    prefixIcon: Icon(Icons.email_outlined, color: Colors.grey),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB85C48), width: 2),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter your email';
                    }
                    if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                      return 'Please enter a valid email';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16),

                // Password field
                Text(
                  'Password',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black87,
                  ),
                ),
                SizedBox(height: 8),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    hintText: 'Enter your password',
                    prefixIcon: Icon(Icons.lock_outline, color: Colors.grey),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                        color: Colors.grey,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide.none,
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey[300]!),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Color(0xFFB85C48), width: 2),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter a password';
                    }
                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 24),

                // Register Button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _sendOTP,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Color(0xFFB85C48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(28),
                      ),
                      elevation: 0,
                    ),
                    child: _isLoading
                        ? CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'Sign Up',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
                SizedBox(height: 16),

                // Already have account
                Center(
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Already have an account? ',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Text(
                          'Log In',
                          style: TextStyle(
                            color: Color(0xFFB85C48),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

---

### Screen 2: Verify OTP

```dart
// lib/screens/auth/verify_registration_otp_screen.dart

import 'package:flutter/material.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:async';
import 'package:shared_preferences/shared_preferences.dart';

class VerifyRegistrationOTPScreen extends StatefulWidget {
  final String name;
  final String email;
  final String password;
  final String? otp; // For testing

  VerifyRegistrationOTPScreen({
    required this.name,
    required this.email,
    required this.password,
    this.otp,
  });

  @override
  _VerifyRegistrationOTPScreenState createState() =>
      _VerifyRegistrationOTPScreenState();
}

class _VerifyRegistrationOTPScreenState
    extends State<VerifyRegistrationOTPScreen> {
  final _otpController = TextEditingController();
  bool _isLoading = false;
  int _resendTimer = 300; // 5 minutes
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startTimer();

    // For testing - auto-fill OTP
    if (widget.otp != null) {
      Future.delayed(Duration(seconds: 1), () {
        _otpController.text = widget.otp!;
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _otpController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _timer = Timer.periodic(Duration(seconds: 1), (timer) {
      if (_resendTimer > 0) {
        setState(() => _resendTimer--);
      } else {
        timer.cancel();
      }
    });
  }

  String get _timerText {
    final minutes = (_resendTimer ~/ 60).toString().padLeft(2, '0');
    final seconds = (_resendTimer % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _verifyOTP() async {
    if (_otpController.text.length != 6) {
      _showError('Please enter complete OTP');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/auth/register/verify-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': widget.email,
          'otp': _otpController.text,
          'name': widget.name,
          'password': widget.password,
        }),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 201 && data['success'] == true) {
        // Store auth token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', data['data']['idToken']);
        await prefs.setString('refresh_token', data['data']['refreshToken']);
        await prefs.setString('user_id', data['data']['user']['uid']);

        // Show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Registration successful!'),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to home
        Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
      } else {
        _showError(data['error'] ?? 'Invalid OTP');
      }
    } catch (e) {
      _showError('Network error: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _resendOTP() async {
    try {
      final response = await http.post(
        Uri.parse('http://localhost:3000/api/auth/register/resend-otp'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': widget.email}),
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        setState(() => _resendTimer = 300);
        _startTimer();

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('OTP resent successfully'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        _showError(data['error'] ?? 'Failed to resend OTP');
      }
    } catch (e) {
      _showError('Network error: $e');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icon
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Color(0xFFB85C48),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  Icons.mark_email_read_outlined,
                  color: Colors.white,
                  size: 28,
                ),
              ),
              SizedBox(height: 24),

              // Title
              Text(
                'Verify Your Email',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
              SizedBox(height: 8),

              // Description
              Text(
                'We\'ve sent a 6-digit OTP to\n${widget.email}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.5,
                ),
              ),
              SizedBox(height: 32),

              // OTP Input
              PinCodeTextField(
                appContext: context,
                length: 6,
                controller: _otpController,
                keyboardType: TextInputType.number,
                animationType: AnimationType.fade,
                pinTheme: PinTheme(
                  shape: PinCodeFieldShape.box,
                  borderRadius: BorderRadius.circular(12),
                  fieldHeight: 56,
                  fieldWidth: 48,
                  activeFillColor: Colors.white,
                  inactiveFillColor: Colors.white,
                  selectedFillColor: Colors.white,
                  activeColor: Color(0xFFB85C48),
                  inactiveColor: Colors.grey[300]!,
                  selectedColor: Color(0xFFB85C48),
                ),
                enableActiveFill: true,
                onCompleted: (code) => _verifyOTP(),
                onChanged: (value) {},
              ),
              SizedBox(height: 24),

              // Resend OTP
              Center(
                child: _resendTimer > 0
                    ? Text(
                        'Resend OTP in $_timerText',
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 14,
                        ),
                      )
                    : GestureDetector(
                        onTap: _resendOTP,
                        child: Text(
                          'Resend OTP',
                          style: TextStyle(
                            color: Color(0xFFB85C48),
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ),
              ),
              SizedBox(height: 32),

              // Verify Button
              SizedBox(
                width: double.infinity,
                height: 56,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOTP,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFFB85C48),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(28),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? CircularProgressIndicator(color: Colors.white)
                      : Text(
                          'Verify & Register',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

---

## 🧪 Testing

### cURL Commands

#### Step 1: Send Registration OTP
```bash
curl -X POST http://localhost:3000/api/auth/register/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Check console for OTP: `📧 OTP for john@example.com: 123456`

#### Step 2: Verify OTP and Complete Registration
```bash
curl -X POST http://localhost:3000/api/auth/register/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "otp": "123456",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

#### Step 3: Resend OTP (if needed)
```bash
curl -X POST http://localhost:3000/api/auth/register/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email": "john@example.com"}'
```

---

## ✨ Features

✅ **Email Verification** - OTP verify করার পরেই account create হয়
✅ **Auto-login** - Registration সফল হলে automatically login হয়
✅ **Resend OTP** - 1 minute cooldown সহ
✅ **Rate Limiting** - Spam prevention
✅ **Validation** - Zod schemas দিয়ে proper validation
✅ **Error Handling** - User-friendly error messages
✅ **Backward Compatible** - Old `/register` endpoint still works

---

## 🔒 Security

✅ Email verification before account creation
✅ OTP expires in 5 minutes
✅ Maximum 3 wrong attempts
✅ 1 minute cooldown for resend
✅ Duplicate email check before sending OTP
✅ Password validation (min 8 characters)

---

## 📝 Notes

1. **Old Registration Endpoint** (`POST /api/auth/register`) still works for backward compatibility
2. **Development Mode** - OTP shown in response when `NODE_ENV=development`
3. **Production** - Configure email service in `src/utils/sendOTP.js`
4. **OTP Storage** - Currently in-memory, use Redis for production

---

**Registration এখন OTP-based! ✅ Email verify হওয়ার পরেই account create হবে!** 🎉
