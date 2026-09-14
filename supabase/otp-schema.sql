-- =====================================================
-- OTP Storage Table for Production
-- =====================================================

-- Create OTP table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- email or phone
    otp VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'registration', 'password_reset', 'login'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_otp_identifier_purpose ON public.otp_verifications(identifier, purpose);
CREATE INDEX idx_otp_expires_at ON public.otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- No public access - only backend service role can access
-- (No policies needed, service role bypasses RLS)

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_otp_verifications_updated_at
    BEFORE UPDATE ON public.otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_otp_updated_at();

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_verifications
    WHERE expires_at < NOW()
       OR (verified = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a cron job to auto-cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-otps', '*/30 * * * *', 'SELECT cleanup_expired_otps()');

COMMENT ON TABLE public.otp_verifications IS 'Stores OTP codes for email/phone verification';
COMMENT ON COLUMN public.otp_verifications.identifier IS 'Email or phone number';
COMMENT ON COLUMN public.otp_verifications.purpose IS 'registration, password_reset, or login';
COMMENT ON COLUMN public.otp_verifications.attempts IS 'Number of failed verification attempts';
