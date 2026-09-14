# ⚠️ Database Setup Required

## Error Found:
```
Could not find the table 'public.otp_verifications' in the schema cache
```

## ✅ Solution: Create OTP Table

### Step 1: Go to Supabase Dashboard

1. Open: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project: `cjxiicefkwdfulbfwbpa`
3. Go to: **SQL Editor**

### Step 2: Run This SQL

Copy and paste this into SQL Editor and click **RUN**:

```sql
-- Create OTP table
CREATE TABLE IF NOT EXISTS public.otp_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    expires_at TIMESTAMPTZ NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_otp_identifier_purpose 
ON public.otp_verifications(identifier, purpose);

CREATE INDEX IF NOT EXISTS idx_otp_expires_at 
ON public.otp_verifications(expires_at);

-- Enable RLS
ALTER TABLE public.otp_verifications ENABLE ROW LEVEL SECURITY;

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_otp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_otp_verifications_updated_at
    BEFORE UPDATE ON public.otp_verifications
    FOR EACH ROW
    EXECUTE FUNCTION update_otp_updated_at();

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM public.otp_verifications
    WHERE expires_at < NOW()
       OR (verified = TRUE AND created_at < NOW() - INTERVAL '1 hour');
END;
$$ LANGUAGE plpgsql;
```

### Step 3: Verify Table Created

Run this to verify:

```sql
SELECT * FROM public.otp_verifications LIMIT 1;
```

Expected: Empty result (no error)

---

## Alternative: Use SQL File

```bash
# If you have psql installed:
psql -h db.cjxiicefkwdfulbfwbpa.supabase.co -U postgres -d postgres < supabase/otp-schema.sql
```

---

## After Creating Table:

Restart your server:

```bash
npm start
```

Then test again:

```bash
npm run test:email-sms
```

---

## ✅ Checklist:

- [ ] Supabase SQL Editor opened
- [ ] SQL script executed
- [ ] Table verified (no error)
- [ ] Server restarted
- [ ] API tested successfully

---

**Once table is created, OTP system will work!** 🚀
