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
    // Calculate expiry time
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

    // Delete any existing OTP for this identifier and purpose
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('identifier', identifier)
      .eq('purpose', purpose);

    // Insert new OTP
    const { data, error } = await supabase
      .from('otp_verifications')
      .insert({
        identifier,
        otp,
        purpose,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        max_attempts: MAX_ATTEMPTS,
        verified: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Store OTP error:', error);
    return { success: false, error: error.message };
  }
}

// Verify OTP from database
export async function verifyOTP(identifier, otp, purpose = 'general') {
  try {
    // Get OTP record
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('identifier', identifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!otpRecord) {
      return { success: false, error: 'OTP not found or expired' };
    }

    // Check expiry
    if (new Date() > new Date(otpRecord.expires_at)) {
      // Delete expired OTP
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);
      
      return { success: false, error: 'OTP expired' };
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      // Delete after max attempts
      await supabase
        .from('otp_verifications')
        .delete()
        .eq('id', otpRecord.id);
      
      return { success: false, error: 'Too many failed attempts' };
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      // Increment attempts
      await supabase
        .from('otp_verifications')
        .update({ attempts: otpRecord.attempts + 1 })
        .eq('id', otpRecord.id);
      
      return { success: false, error: 'Invalid OTP' };
    }

    // Mark as verified
    await supabase
      .from('otp_verifications')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    return { success: true };
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { success: false, error: error.message };
  }
}

// Delete OTP after successful verification
export async function deleteOTP(identifier, purpose = 'general') {
  try {
    await supabase
      .from('otp_verifications')
      .delete()
      .eq('identifier', identifier)
      .eq('purpose', purpose);
    
    return { success: true };
  } catch (error) {
    console.error('Delete OTP error:', error);
    return { success: false, error: error.message };
  }
}

// Get remaining time for OTP
export async function getOTPRemainingTime(identifier, purpose = 'general') {
  try {
    const { data: otpRecord } = await supabase
      .from('otp_verifications')
      .select('expires_at')
      .eq('identifier', identifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return 0;
    }

    const remaining = new Date(otpRecord.expires_at) - new Date();
    return Math.max(0, Math.ceil(remaining / 1000)); // Return in seconds
  } catch (error) {
    console.error('Get OTP remaining time error:', error);
    return 0;
  }
}

// Check if OTP exists and not expired
export async function hasValidOTP(identifier, purpose = 'general') {
  try {
    const { data: otpRecord } = await supabase
      .from('otp_verifications')
      .select('expires_at')
      .eq('identifier', identifier)
      .eq('purpose', purpose)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!otpRecord) {
      return false;
    }

    // Check if expired
    if (new Date() > new Date(otpRecord.expires_at)) {
      // Clean up expired OTP
      await deleteOTP(identifier, purpose);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Has valid OTP error:', error);
    return false;
  }
}

// Clean up expired OTPs (call periodically)
export async function cleanupExpiredOTPs() {
  try {
    const { error } = await supabase
      .from('otp_verifications')
      .delete()
      .lt('expires_at', new Date().toISOString());

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Cleanup expired OTPs error:', error);
    return { success: false, error: error.message };
  }
}
