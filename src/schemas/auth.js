import { z } from 'zod';

const email = z.string().trim().email().max(254);

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password: z.string().min(8).max(128),
});

// Registration OTP schemas
export const sendRegisterOTPSchema = z.object({
  email,
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
});

export const verifyRegisterOTPSchema = z.object({
  email,
  otp: z.string().length(6, 'OTP must be 6 digits'),
  name: z.string().trim().min(2).max(80),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const forgotPasswordSchema = z.object({ email });

// OTP-based password reset schemas
export const sendOTPSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone or Email is required'),
});

export const verifyOTPSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
  otp: z.string().length(6, 'OTP must be 6 digits'),
});

export const resendOTPSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
});

export const resetPasswordOTPSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
  resetToken: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8).max(128),
});
