import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  sendOTPSchema,
  verifyOTPSchema,
  resendOTPSchema,
  resetPasswordOTPSchema,
  sendRegisterOTPSchema,
  verifyRegisterOTPSchema,
} from '../schemas/auth.js';
import { randomBytes } from 'node:crypto';
import { requireSupabaseUser } from '../middleware/auth.js';
import { supabase } from '../config/supabase.js';
import { 
  generateOTP, 
  storeOTP, 
  verifyOTP, 
  deleteOTP, 
  getOTPRemainingTime,
  hasValidOTP 
} from '../utils/otpStore.js';
import { sendOTP } from '../utils/sendOTP.js';
import { listAllUsers, findUserByEmail } from '../utils/listAllUsers.js';
import { otpRequestLimiter, authLimiter } from '../middleware/rateLimit.js';

// How long a client must wait between OTP requests, and the total OTP
// validity window. Kept in one place so the "resend" math below can't drift
// out of sync with utils/otpStore.js again.
const OTP_VALIDITY_SECONDS = 5 * 60; // must match OTP_EXPIRY_MINUTES in otpStore.js
const OTP_RESEND_COOLDOWN_SECONDS = 60;

const authRouter = Router();

function validationError(res, parsed) {
  return res.status(422).json({
    error: 'Invalid request data.',
    details: parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}

function authResponse(session) {
  return {
    user: {
      uid: session.user.id,
      email: session.user.email,
      name: session.user.user_metadata?.name || null,
    },
    idToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in,
  };
}

// ========================
// REGISTRATION WITH OTP
// ========================

// Send OTP for registration
authRouter.post('/register/send-otp', otpRequestLimiter, async (req, res, next) => {
  const parsed = sendRegisterOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { email, name, password } = parsed.data;
    
    // Check if user already exists (paginated across the whole user base)
    const existingUser = await findUserByEmail(email);
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'An account already exists with this email.' 
      });
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    
    // Store OTP in database with purpose
    await storeOTP(email, otp, 'registration');
    
    // Send OTP via email
    await sendOTP(email, otp, 'registration');
    
    return res.json({
      success: true,
      message: 'A 6-digit OTP was sent to your email',
      email,
      // For development only
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    return next(error);
  }
});

// Verify OTP and complete registration
authRouter.post('/register/verify-otp', authLimiter, async (req, res, next) => {
  const parsed = verifyRegisterOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { email, otp, name, password } = parsed.data;
    
    // Verify OTP from database
    const result = await verifyOTP(email, otp, 'registration');
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error 
      });
    }
    
    // Create user in Supabase
    const { error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since OTP is verified
      user_metadata: { name },
    });
    
    if (createError) {
      if (createError.code === 'email_exists' || createError.code === 'user_already_exists') {
        return res.status(409).json({ 
          error: 'An account already exists with this email.' 
        });
      }
      throw createError;
    }
    
    // Auto-login after registration
    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (loginError || !data.session) {
      throw loginError || new Error('Unable to create a session.');
    }
    
    // Clean up OTP from database
    await deleteOTP(email, 'registration');
    
    return res.status(201).json({ 
      success: true,
      message: 'Registration successful!',
      data: authResponse(data.session) 
    });
  } catch (error) {
    console.error('Verify registration OTP error:', error);
    return next(error);
  }
});

// Resend registration OTP
authRouter.post('/register/resend-otp', otpRequestLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const normalizedEmail = email.trim().toLowerCase();
    
    // Check if there's already a valid OTP in database
    if (await hasValidOTP(normalizedEmail, 'registration')) {
      const otpSecondsLeft = await getOTPRemainingTime(normalizedEmail, 'registration');
      const secondsSinceSent = OTP_VALIDITY_SECONDS - otpSecondsLeft;
      const waitSecondsLeft = OTP_RESEND_COOLDOWN_SECONDS - secondsSinceSent;

      // Allow resend only after the cooldown window has passed
      if (waitSecondsLeft > 0) {
        return res.status(429).json({ 
          error: 'Please wait before requesting a new OTP',
          remainingTime: waitSecondsLeft
        });
      }
    }
    
    // Generate and store new OTP in database
    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp, 'registration');
    
    // Send OTP
    await sendOTP(normalizedEmail, otp, 'registration');
    
    return res.json({
      success: true,
      message: 'OTP resent successfully',
      email: normalizedEmail,
      // For development only
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Resend registration OTP error:', error);
    return next(error);
  }
});

// Old direct registration (DISABLED - Use OTP registration instead)
// To enable direct registration without OTP, uncomment this endpoint
/*
authRouter.post('/register', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { error: createError } = await supabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { name: parsed.data.name },
    });
    if (createError) throw createError;

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (loginError || !data.session) throw loginError || new Error('Unable to create a session.');

    return res.status(201).json({ data: authResponse(data.session) });
  } catch (error) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
      return res.status(409).json({ error: 'An account already exists with this email.' });
    }
    return next(error);
  }
});
*/

// Redirect to OTP registration
authRouter.post('/register', async (req, res, next) => {
  return res.status(410).json({
    error: 'Direct registration is disabled. Please use /register/send-otp endpoint.',
    message: 'OTP verification is required for registration.',
    endpoints: {
      sendOTP: 'POST /api/auth/register/send-otp',
      verifyOTP: 'POST /api/auth/register/verify-otp',
      resendOTP: 'POST /api/auth/register/resend-otp',
    },
    documentation: 'See REGISTRATION_OTP_GUIDE.md for details',
  });
});

authRouter.post('/login', authLimiter, async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (error || !data.session) throw error || new Error('Unable to create a session.');
    return res.json({ data: authResponse(data.session) });
  } catch (error) {
    if (error.code === 'invalid_credentials') {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    return next(error);
  }
});

// Sends a 6-digit OTP (not a magic link) to the email for password reset.
// Uses the same 'password_reset' OTP purpose as /send-otp, so the client can
// continue the flow with the existing /verify-otp and /reset-password-otp
// endpoints below - this route is now just an email-only entry point into
// that same flow, kept for backward compatibility with existing clients.
authRouter.post('/forgot-password', otpRequestLimiter, async (req, res, next) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const normalizedEmail = parsed.data.email.trim().toLowerCase();

    // Verify user exists (paginated across the whole user base)
    const existingUser = await findUserByEmail(normalizedEmail);

    if (!existingUser) {
      // Don't reveal if the account exists or not
      return res.json({
        success: true,
        message: 'If an account exists for this email, a 6-digit OTP has been sent.',
        identifier: normalizedEmail,
      });
    }

    // Generate and store OTP in database
    const otp = generateOTP();
    await storeOTP(normalizedEmail, otp, 'password_reset');

    // Send OTP via email
    await sendOTP(normalizedEmail, otp, 'password_reset');

    return res.json({
      success: true,
      message: 'If an account exists for this email, a 6-digit OTP has been sent.',
      identifier: normalizedEmail,
      // For development only
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Forgot password OTP error:', error);
    return next(error);
  }
});

// ========================
// PASSWORD RESET WITH OTP
// ========================

// Send OTP for password reset (Phone or Email)
authRouter.post('/send-otp', otpRequestLimiter, async (req, res, next) => {
  const parsed = sendOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const identifier = parsed.data.identifier;
    
    // Normalize identifier
    const normalizedIdentifier = identifier.trim().toLowerCase();
    
    // Check if identifier is email or phone
    const isEmail = normalizedIdentifier.includes('@');

    // Phone-based password reset isn't implemented yet (see reset-password-otp
    // below), and accounts here don't have a verified phone number on file,
    // so there is no way to confirm this number belongs to a real user. Until
    // that exists, sending a real SMS to any submitted number is just an open
    // SMS-bombing vector — refuse it instead of paying to text strangers.
    if (!isEmail) {
      return res.status(400).json({
        error: 'Phone-based password reset is not available yet. Please use your email.',
      });
    }

    // Verify user exists in Supabase (paginated across the whole user base)
    const existingUser = await findUserByEmail(normalizedIdentifier);

    if (!existingUser) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: 'If an account exists, an OTP has been sent.',
        identifier: normalizedIdentifier,
      });
    }
    
    // Generate and store OTP in database
    const otp = generateOTP();
    await storeOTP(normalizedIdentifier, otp, 'password_reset');
    
    // Send OTP via email or SMS
    await sendOTP(normalizedIdentifier, otp, 'password_reset');
    
    return res.json({
      success: true,
      message: `A 6-digit OTP was sent to ${isEmail ? 'your email' : 'your phone'}`,
      identifier: normalizedIdentifier,
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return next(error);
  }
});

// Verify OTP
authRouter.post('/verify-otp', authLimiter, async (req, res, next) => {
  const parsed = verifyOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { identifier, otp } = parsed.data;
    
    const normalizedIdentifier = identifier.trim().toLowerCase();
    
    // Verify OTP from database
    const result = await verifyOTP(normalizedIdentifier, otp, 'password_reset');
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: result.error 
      });
    }
    
    // Generate a temporary reset token. This must NOT be guessable the way
    // `generateOTP() + Date.now()` was (a 6-digit code plus a public,
    // narrow-range timestamp) - use real randomness instead.
    const resetToken = randomBytes(32).toString('hex');
    await storeOTP(normalizedIdentifier, resetToken, 'password_reset_token');
    
    // Delete original OTP
    await deleteOTP(normalizedIdentifier, 'password_reset');
    
    return res.json({
      success: true,
      message: 'OTP verified successfully',
      resetToken,
      identifier: normalizedIdentifier,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return next(error);
  }
});

// Resend OTP
authRouter.post('/resend-otp', otpRequestLimiter, async (req, res, next) => {
  const parsed = resendOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const identifier = parsed.data.identifier;
    
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // See /send-otp: phone-based reset isn't implemented and phone numbers
    // aren't verified against any account, so don't send real SMS to them.
    if (!normalizedIdentifier.includes('@')) {
      return res.status(400).json({
        error: 'Phone-based password reset is not available yet. Please use your email.',
      });
    }
    
    // Check if there's already a valid OTP in database
    if (await hasValidOTP(normalizedIdentifier, 'password_reset')) {
      const otpSecondsLeft = await getOTPRemainingTime(normalizedIdentifier, 'password_reset');
      const secondsSinceSent = OTP_VALIDITY_SECONDS - otpSecondsLeft;
      const waitSecondsLeft = OTP_RESEND_COOLDOWN_SECONDS - secondsSinceSent;

      // Allow resend only after the cooldown window has passed
      if (waitSecondsLeft > 0) {
        return res.status(429).json({ 
          error: 'Please wait before requesting a new OTP',
          remainingTime: waitSecondsLeft // Seconds until resend is allowed
        });
      }
    }
    
    // Generate and store new OTP in database
    const otp = generateOTP();
    await storeOTP(normalizedIdentifier, otp, 'password_reset');
    
    // Send OTP
    await sendOTP(normalizedIdentifier, otp, 'password_reset');
    
    const isEmail = normalizedIdentifier.includes('@');
    
    return res.json({
      success: true,
      message: 'OTP resent successfully',
      identifier: normalizedIdentifier,
      // For development only
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return next(error);
  }
});

// Reset password with OTP token
authRouter.post('/reset-password-otp', authLimiter, async (req, res, next) => {
  const parsed = resetPasswordOTPSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { identifier, resetToken, newPassword } = parsed.data;
    
    const normalizedIdentifier = identifier.trim().toLowerCase();
    
    // Verify reset token from database
    const result = await verifyOTP(normalizedIdentifier, resetToken, 'password_reset_token');
    
    if (!result.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Get user by email
    const isEmail = normalizedIdentifier.includes('@');
    
    if (!isEmail) {
      return res.status(400).json({ 
        error: 'Phone-based password reset not yet implemented. Please use email.' 
      });
    }
    
    // Find user (paginated across the whole user base)
    const user = await findUserByEmail(normalizedIdentifier);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });
    
    if (updateError) {
      throw updateError;
    }
    
    // Delete reset token from database
    await deleteOTP(normalizedIdentifier, 'password_reset_token');
    
    return res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (error) {
    console.error('Reset password OTP error:', error);
    return next(error);
  }
});

authRouter.post('/reset-password', requireSupabaseUser, async (req, res, next) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) return validationError(res, parsed);

  try {
    const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
      password: parsed.data.password,
    });
    if (error) throw error;
    return res.json({ message: 'Password has been updated.' });
  } catch (error) {
    return next(error);
  }
});

// Logout endpoint
authRouter.post('/logout', requireSupabaseUser, async (req, res, next) => {
  try {
    // Get the access token from the Authorization header
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided.' });
    }

    // Sign out the user (invalidates the session)
    const { error } = await supabase.auth.admin.signOut(token);
    
    if (error) {
      console.error('Logout error:', error);
      // Even if there's an error, we'll return success for client-side cleanup
    }

    return res.json({ 
      success: true,
      message: 'Successfully logged out.' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    // Return success anyway for client-side cleanup
    return res.json({ 
      success: true,
      message: 'Successfully logged out.' 
    });
  }
});

// Get current user info
authRouter.get('/me', requireSupabaseUser, async (req, res, next) => {
  try {
    return res.json({
      data: {
        uid: req.user.id,
        email: req.user.email,
        name: req.user.user_metadata?.name || null,
        emailVerified: req.user.email_confirmed_at !== null,
        createdAt: req.user.created_at,
      },
    });
  } catch (error) {
    return next(error);
  }
});

// Refresh token
authRouter.post('/refresh', async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required.' });
  }

  try {
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw error || new Error('Unable to refresh session.');
    }

    return res.json({ data: authResponse(data.session) });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired refresh token.' });
  }
});

export { authRouter };
