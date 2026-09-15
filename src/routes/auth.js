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
  hasValidOTP,
} from '../utils/otpStore.js';

import { sendOTP } from '../utils/sendOTP.js';
import {
  findUserByEmail,
} from '../utils/listAllUsers.js';

import {
  otpRequestLimiter,
  authLimiter,
} from '../middleware/rateLimit.js';


// ======================================================
// OTP SETTINGS
// ======================================================

const OTP_VALIDITY_SECONDS = 5 * 60;
const OTP_RESEND_COOLDOWN_SECONDS = 60;


// ======================================================
// ROUTER
// ======================================================

const authRouter = Router();


// ======================================================
// VALIDATION ERROR
// ======================================================

function validationError(res, parsed) {
  return res.status(422).json({
    error: 'Invalid request data.',
    details: parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    })),
  });
}


// ======================================================
// AUTH RESPONSE
// ======================================================

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


// ======================================================
// REGISTRATION WITH OTP
// ======================================================


// ------------------------------------------------------
// SEND REGISTRATION OTP
// ------------------------------------------------------

authRouter.post(
  '/register/send-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    const parsed =
      sendRegisterOTPSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed);
    }

    try {
      const {
        email,
        name,
        password,
      } = parsed.data;

      const normalizedEmail =
        email.trim().toLowerCase();


      // Check existing user
      const existingUser =
        await findUserByEmail(normalizedEmail);

      if (existingUser) {
        return res.status(409).json({
          error:
            'An account already exists with this email.',
        });
      }


      // Generate OTP
      const otp = generateOTP();


      // IMPORTANT:
      // Check whether OTP was actually stored
      const storeResult = await storeOTP(
        normalizedEmail,
        otp,
        'registration'
      );

      if (!storeResult.success) {
        console.error(
          'Failed to store registration OTP:',
          storeResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create OTP. Please try again.',
        });
      }


      // Send OTP
      await sendOTP(
        normalizedEmail,
        otp,
        'registration'
      );


      return res.json({
        success: true,

        message:
          'A 6-digit OTP was sent to your email',

        email: normalizedEmail,

        ...(process.env.NODE_ENV === 'development' && {
          otp,
        }),
      });

    } catch (error) {
      console.error(
        'Send registration OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ------------------------------------------------------
// VERIFY REGISTRATION OTP
// ------------------------------------------------------

authRouter.post(
  '/register/verify-otp',
  authLimiter,
  async (req, res, next) => {
    const parsed =
      verifyRegisterOTPSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed);
    }

    try {
      const {
        email,
        otp,
        name,
        password,
      } = parsed.data;

      const normalizedEmail =
        email.trim().toLowerCase();


      // Verify OTP
      const result = await verifyOTP(
        normalizedEmail,
        otp,
        'registration'
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }


      // Create Supabase user
      const {
        error: createError,
      } = await supabase.auth.admin.createUser({
        email: normalizedEmail,
        password,

        email_confirm: true,

        user_metadata: {
          name,
        },
      });


      if (createError) {
        if (
          createError.code === 'email_exists' ||
          createError.code === 'user_already_exists'
        ) {
          return res.status(409).json({
            error:
              'An account already exists with this email.',
          });
        }

        throw createError;
      }


      // Auto login
      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });


      if (
        loginError ||
        !data.session
      ) {
        throw (
          loginError ||
          new Error(
            'Unable to create a session.'
          )
        );
      }


      // Delete registration OTP
      const deleteResult =
        await deleteOTP(
          normalizedEmail,
          'registration'
        );

      if (!deleteResult.success) {
        console.error(
          'Failed to delete registration OTP:',
          deleteResult.error
        );
      }


      return res.status(201).json({
        success: true,

        message:
          'Registration successful!',

        data: authResponse(
          data.session
        ),
      });

    } catch (error) {
      console.error(
        'Verify registration OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ------------------------------------------------------
// RESEND REGISTRATION OTP
// ------------------------------------------------------

authRouter.post(
  '/register/resend-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    try {
      const {
        email,
      } = req.body;


      if (!email) {
        return res.status(400).json({
          error: 'Email is required',
        });
      }


      const normalizedEmail =
        email.trim().toLowerCase();


      // Check cooldown
      if (
        await hasValidOTP(
          normalizedEmail,
          'registration'
        )
      ) {
        const otpSecondsLeft =
          await getOTPRemainingTime(
            normalizedEmail,
            'registration'
          );

        const secondsSinceSent =
          OTP_VALIDITY_SECONDS -
          otpSecondsLeft;

        const waitSecondsLeft =
          OTP_RESEND_COOLDOWN_SECONDS -
          secondsSinceSent;


        if (waitSecondsLeft > 0) {
          return res.status(429).json({
            error:
              'Please wait before requesting a new OTP',

            remainingTime:
              waitSecondsLeft,
          });
        }
      }


      // Generate OTP
      const otp = generateOTP();


      // Store OTP and CHECK result
      const storeResult =
        await storeOTP(
          normalizedEmail,
          otp,
          'registration'
        );

      if (!storeResult.success) {
        console.error(
          'Failed to store registration OTP:',
          storeResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create OTP. Please try again.',
        });
      }


      // Send OTP
      await sendOTP(
        normalizedEmail,
        otp,
        'registration'
      );


      return res.json({
        success: true,

        message:
          'OTP resent successfully',

        email: normalizedEmail,

        ...(process.env.NODE_ENV === 'development' && {
          otp,
        }),
      });

    } catch (error) {
      console.error(
        'Resend registration OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// DIRECT REGISTRATION DISABLED
// ======================================================

authRouter.post(
  '/register',
  async (req, res) => {
    return res.status(410).json({
      error:
        'Direct registration is disabled. Please use /register/send-otp endpoint.',

      message:
        'OTP verification is required for registration.',

      endpoints: {
        sendOTP:
          'POST /api/auth/register/send-otp',

        verifyOTP:
          'POST /api/auth/register/verify-otp',

        resendOTP:
          'POST /api/auth/register/resend-otp',
      },

      documentation:
        'See REGISTRATION_OTP_GUIDE.md for details',
    });
  }
);


// ======================================================
// LOGIN
// ======================================================

authRouter.post(
  '/login',
  authLimiter,
  async (req, res, next) => {
    const parsed =
      loginSchema.safeParse(req.body);

    if (!parsed.success) {
      return validationError(res, parsed);
    }

    try {
      const {
        data,
        error,
      } =
        await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });


      if (
        error ||
        !data.session
      ) {
        throw (
          error ||
          new Error(
            'Unable to create session.'
          )
        );
      }


      return res.json({
        data: authResponse(
          data.session
        ),
      });

    } catch (error) {
      if (
        error.code ===
        'invalid_credentials'
      ) {
        return res.status(401).json({
          error:
            'Email or password is incorrect.',
        });
      }

      return next(error);
    }
  }
);


// ======================================================
// FORGOT PASSWORD
// ======================================================

authRouter.post(
  '/forgot-password',
  otpRequestLimiter,
  async (req, res, next) => {
    const parsed =
      forgotPasswordSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const normalizedEmail =
        parsed.data.email
          .trim()
          .toLowerCase();


      // Check user
      const existingUser =
        await findUserByEmail(
          normalizedEmail
        );


      // Do not reveal account existence
      if (!existingUser) {
        return res.json({
          success: true,

          message:
            'If an account exists for this email, a 6-digit OTP has been sent.',

          identifier:
            normalizedEmail,
        });
      }


      // Generate OTP
      const otp = generateOTP();


      // Store OTP and CHECK result
      const storeResult =
        await storeOTP(
          normalizedEmail,
          otp,
          'password_reset'
        );


      if (!storeResult.success) {
        console.error(
          'Failed to store password reset OTP:',
          storeResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create OTP. Please try again.',
        });
      }


      // Send email
      await sendOTP(
        normalizedEmail,
        otp,
        'password_reset'
      );


      return res.json({
        success: true,

        message:
          'If an account exists for this email, a 6-digit OTP has been sent.',

        identifier:
          normalizedEmail,

        ...(process.env.NODE_ENV === 'development' && {
          otp,
        }),
      });

    } catch (error) {
      console.error(
        'Forgot password OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// SEND PASSWORD RESET OTP
// ======================================================

authRouter.post(
  '/send-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    const parsed =
      sendOTPSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const identifier =
        parsed.data.identifier;

      const normalizedIdentifier =
        identifier
          .trim()
          .toLowerCase();


      // Only email supported
      const isEmail =
        normalizedIdentifier.includes('@');


      if (!isEmail) {
        return res.status(400).json({
          error:
            'Phone-based password reset is not available yet. Please use your email.',
        });
      }


      // Find user
      const existingUser =
        await findUserByEmail(
          normalizedIdentifier
        );


      // Do not reveal account existence
      if (!existingUser) {
        return res.json({
          success: true,

          message:
            'If an account exists, an OTP has been sent.',

          identifier:
            normalizedIdentifier,
        });
      }


      // Generate OTP
      const otp = generateOTP();


      // Store OTP and CHECK result
      const storeResult =
        await storeOTP(
          normalizedIdentifier,
          otp,
          'password_reset'
        );


      if (!storeResult.success) {
        console.error(
          'Failed to store password reset OTP:',
          storeResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create OTP. Please try again.',
        });
      }


      // Send OTP
      await sendOTP(
        normalizedIdentifier,
        otp,
        'password_reset'
      );


      return res.json({
        success: true,

        message:
          'A 6-digit OTP was sent to your email',

        identifier:
          normalizedIdentifier,

        ...(process.env.NODE_ENV === 'development' && {
          otp,
        }),
      });

    } catch (error) {
      console.error(
        'Send OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// VERIFY PASSWORD RESET OTP
// ======================================================

authRouter.post(
  '/verify-otp',
  authLimiter,
  async (req, res, next) => {
    const parsed =
      verifyOTPSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const {
        identifier,
        otp,
      } = parsed.data;


      const normalizedIdentifier =
        identifier
          .trim()
          .toLowerCase();


      // Verify OTP
      const result =
        await verifyOTP(
          normalizedIdentifier,
          otp,
          'password_reset'
        );


      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
        });
      }


      // Generate secure reset token
      const resetToken =
        randomBytes(32).toString('hex');


      // Store reset token
      const tokenStoreResult =
        await storeOTP(
          normalizedIdentifier,
          resetToken,
          'password_reset_token'
        );


      if (!tokenStoreResult.success) {
        console.error(
          'Failed to store password reset token:',
          tokenStoreResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create reset token. Please try again.',
        });
      }


      // Delete original OTP
      const deleteResult =
        await deleteOTP(
          normalizedIdentifier,
          'password_reset'
        );


      if (!deleteResult.success) {
        console.error(
          'Failed to delete verified OTP:',
          deleteResult.error
        );
      }


      return res.json({
        success: true,

        message:
          'OTP verified successfully',

        resetToken,

        identifier:
          normalizedIdentifier,
      });

    } catch (error) {
      console.error(
        'Verify OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// RESEND PASSWORD RESET OTP
// ======================================================

authRouter.post(
  '/resend-otp',
  otpRequestLimiter,
  async (req, res, next) => {
    const parsed =
      resendOTPSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const identifier =
        parsed.data.identifier;


      const normalizedIdentifier =
        identifier
          .trim()
          .toLowerCase();


      // Only email supported
      if (
        !normalizedIdentifier.includes('@')
      ) {
        return res.status(400).json({
          error:
            'Phone-based password reset is not available yet. Please use your email.',
        });
      }


      // Check cooldown
      if (
        await hasValidOTP(
          normalizedIdentifier,
          'password_reset'
        )
      ) {
        const otpSecondsLeft =
          await getOTPRemainingTime(
            normalizedIdentifier,
            'password_reset'
          );


        const secondsSinceSent =
          OTP_VALIDITY_SECONDS -
          otpSecondsLeft;


        const waitSecondsLeft =
          OTP_RESEND_COOLDOWN_SECONDS -
          secondsSinceSent;


        if (waitSecondsLeft > 0) {
          return res.status(429).json({
            error:
              'Please wait before requesting a new OTP',

            remainingTime:
              waitSecondsLeft,
          });
        }
      }


      // Generate new OTP
      const otp = generateOTP();


      // Store and CHECK
      const storeResult =
        await storeOTP(
          normalizedIdentifier,
          otp,
          'password_reset'
        );


      if (!storeResult.success) {
        console.error(
          'Failed to store password reset OTP:',
          storeResult.error
        );

        return res.status(500).json({
          success: false,
          error:
            'Failed to create OTP. Please try again.',
        });
      }


      // Send OTP
      await sendOTP(
        normalizedIdentifier,
        otp,
        'password_reset'
      );


      return res.json({
        success: true,

        message:
          'OTP resent successfully',

        identifier:
          normalizedIdentifier,

        ...(process.env.NODE_ENV === 'development' && {
          otp,
        }),
      });

    } catch (error) {
      console.error(
        'Resend OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// RESET PASSWORD USING RESET TOKEN
// ======================================================

authRouter.post(
  '/reset-password-otp',
  authLimiter,
  async (req, res, next) => {
    const parsed =
      resetPasswordOTPSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const {
        identifier,
        resetToken,
        newPassword,
      } = parsed.data;


      const normalizedIdentifier =
        identifier
          .trim()
          .toLowerCase();


      // Only email supported
      if (
        !normalizedIdentifier.includes('@')
      ) {
        return res.status(400).json({
          error:
            'Phone-based password reset not yet implemented. Please use email.',
        });
      }


      // Verify reset token
      const result =
        await verifyOTP(
          normalizedIdentifier,
          resetToken,
          'password_reset_token'
        );


      if (!result.success) {
        return res.status(400).json({
          success: false,
          error:
            'Invalid or expired reset token',
        });
      }


      // Find user
      const user =
        await findUserByEmail(
          normalizedIdentifier
        );


      if (!user) {
        return res.status(404).json({
          error: 'User not found',
        });
      }


      // Update password
      const {
        error: updateError,
      } =
        await supabase.auth.admin.updateUserById(
          user.id,
          {
            password: newPassword,
          }
        );


      if (updateError) {
        throw updateError;
      }


      // Delete reset token
      const deleteResult =
        await deleteOTP(
          normalizedIdentifier,
          'password_reset_token'
        );


      if (!deleteResult.success) {
        console.error(
          'Failed to delete reset token:',
          deleteResult.error
        );
      }


      return res.json({
        success: true,

        message:
          'Password reset successfully. You can now login with your new password.',
      });

    } catch (error) {
      console.error(
        'Reset password OTP error:',
        error
      );

      return next(error);
    }
  }
);


// ======================================================
// RESET PASSWORD - LOGGED IN USER
// ======================================================

authRouter.post(
  '/reset-password',
  requireSupabaseUser,
  async (req, res, next) => {
    const parsed =
      resetPasswordSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      return validationError(
        res,
        parsed
      );
    }

    try {
      const {
        error,
      } =
        await supabase.auth.admin.updateUserById(
          req.user.id,
          {
            password:
              parsed.data.password,
          },
        );


      if (error) {
        throw error;
      }


      return res.json({
        message:
          'Password has been updated.',
      });

    } catch (error) {
      return next(error);
    }
  }
);


// ======================================================
// LOGOUT
// ======================================================

authRouter.post(
  '/logout',
  requireSupabaseUser,
  async (req, res) => {
    try {
      const authorization =
        req.headers.authorization || '';

      const token =
        authorization.startsWith('Bearer ')
          ? authorization.substring(7)
          : null;


      if (!token) {
        return res.status(400).json({
          error: 'No token provided.',
        });
      }


      const {
        error,
      } =
        await supabase.auth.admin.signOut(
          token
        );


      if (error) {
        console.error(
          'Logout error:',
          error
        );
      }


      return res.json({
        success: true,

        message:
          'Successfully logged out.',
      });

    } catch (error) {
      console.error(
        'Logout error:',
        error
      );


      return res.json({
        success: true,

        message:
          'Successfully logged out.',
      });
    }
  }
);


// ======================================================
// CURRENT USER
// ======================================================

authRouter.get(
  '/me',
  requireSupabaseUser,
  async (req, res, next) => {
    try {
      return res.json({
        data: {
          uid: req.user.id,

          email:
            req.user.email,

          name:
            req.user.user_metadata?.name ||
            null,

          emailVerified:
            req.user.email_confirmed_at !==
            null,

          createdAt:
            req.user.created_at,
        },
      });

    } catch (error) {
      return next(error);
    }
  }
);


// ======================================================
// REFRESH TOKEN
// ======================================================

authRouter.post(
  '/refresh',
  async (req, res) => {
    const {
      refreshToken,
    } = req.body;


    if (!refreshToken) {
      return res.status(400).json({
        error:
          'Refresh token is required.',
      });
    }


    try {
      const {
        data,
        error,
      } =
        await supabase.auth.refreshSession({
          refresh_token:
            refreshToken,
        });


      if (
        error ||
        !data.session
      ) {
        throw (
          error ||
          new Error(
            'Unable to refresh session.'
          )
        );
      }


      return res.json({
        data:
          authResponse(
            data.session
          ),
      });

    } catch (error) {
      console.error(
        'Refresh token error:',
        error
      );

      return res.status(401).json({
        error:
          'Invalid or expired refresh token.',
      });
    }
  }
);


// ======================================================
// EXPORT
// ======================================================

export {
  authRouter,
};