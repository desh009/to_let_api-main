// Production-ready OTP store using Supabase database
import { supabase } from '../config/supabase.js';

// OTP expiry time (5 minutes)
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 3;

// Generate 6-digit OTP
export function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Store OTP in database
export async function storeOTP(identifier, otp, purpose = 'general') {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(
      expiresAt.getMinutes() + OTP_EXPIRY_MINUTES
    );

    // Delete any existing OTP for this identifier and purpose
    const { error: deleteError } = await supabase
      .from('otp_verifications')
      .delete()
      .eq('identifier', normalizedIdentifier)
      .eq('purpose', purpose);

    if (deleteError) {
      throw deleteError;
    }

    // Insert new OTP
    const { data, error: insertError } = await supabase
      .from('otp_verifications')
      .insert({
        identifier: normalizedIdentifier,
        otp,
        purpose,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        verified: false,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    if (!data) {
      throw new Error('OTP was not saved to database.');
    }

    console.log(
      `OTP stored successfully: ${normalizedIdentifier} [${purpose}]`
    );

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Store OTP error:', error);

    return {
      success: false,
      error: error.message || 'Failed to store OTP.',
    };
  }
}

// Verify OTP from database
export async function verifyOTP(
  identifier,
  otp,
  purpose = 'general'
) {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('identifier', normalizedIdentifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (!otpRecord) {
      return {
        success: false,
        error: 'OTP not found or expired',
      };
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      const { error: deleteError } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);

      if (deleteError) {
        console.error(
          'Failed to delete expired OTP:',
          deleteError
        );
      }

      return {
        success: false,
        error: 'OTP expired',
      };
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      const { error: deleteError } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);

      if (deleteError) {
        console.error(
          'Failed to delete OTP after max attempts:',
          deleteError
        );
      }

      return {
        success: false,
        error: 'Too many failed attempts',
      };
    }

    // Verify OTP
    if (String(otpRecord.otp) !== String(otp)) {
      const { error: updateError } = await supabase
        .from('otp_verifications')
        .update({
          attempts: otpRecord.attempts + 1,
        })
        .eq('id', otpRecord.id);

      if (updateError) {
        console.error(
          'Failed to update OTP attempts:',
          updateError
        );
      }

      return {
        success: false,
        error: 'Invalid OTP',
      };
    }

    // Mark as verified
    const { error: verifyError } = await supabase
      .from('otp_verifications')
      .update({
        verified: true,
      })
      .eq('id', otpRecord.id);

    if (verifyError) {
      throw verifyError;
    }

    console.log(
      `OTP verified successfully: ${normalizedIdentifier} [${purpose}]`
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error('Verify OTP error:', error);

    return {
      success: false,
      error: error.message || 'Failed to verify OTP.',
    };
  }
}

// Delete OTP after successful verification
export async function deleteOTP(
  identifier,
  purpose = 'general'
) {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .eq('identifier', normalizedIdentifier)
      .eq('purpose', purpose);

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error('Delete OTP error:', error);

    return {
      success: false,
      error: error.message || 'Failed to delete OTP.',
    };
  }
}

// Get remaining time for OTP
export async function getOTPRemainingTime(
  identifier,
  purpose = 'general'
) {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('expires_at')
      .eq('identifier', normalizedIdentifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Get OTP remaining time database error:',
        error
      );
      return 0;
    }

    if (!otpRecord) {
      return 0;
    }

    const remaining =
      new Date(otpRecord.expires_at) - new Date();

    return Math.max(
      0,
      Math.ceil(remaining / 1000)
    );
  } catch (error) {
    console.error(
      'Get OTP remaining time error:',
      error
    );

    return 0;
  }
}

// Check if OTP exists and is not expired
export async function hasValidOTP(
  identifier,
  purpose = 'general'
) {
  try {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    const { data: otpRecord, error } = await supabase
      .from('otp_verifications')
      .select('id, expires_at')
      .eq('identifier', normalizedIdentifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        'Has valid OTP database error:',
        error
      );
      return false;
    }

    if (!otpRecord) {
      return false;
    }

    // Check if expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      const { error: deleteError } = await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);

      if (deleteError) {
        console.error(
          'Failed to clean expired OTP:',
          deleteError
        );
      }

      return false;
    }

    return true;
  } catch (error) {
    console.error(
      'Has valid OTP error:',
      error
    );

    return false;
  }
}

// Clean up expired OTPs
export async function cleanupExpiredOTPs() {
  try {
    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .lt(
        'expires_at',
        new Date().toISOString()
      );

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      'Cleanup expired OTPs error:',
      error
    );

    return {
      success: false,
      error: error.message || 'Cleanup failed.',
    };
  }
}