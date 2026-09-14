// Production-ready OTP email/SMS sending
import nodemailer from 'nodemailer';
import twilio from 'twilio';

// Create email transporter (Gmail SMTP)
const createEmailTransporter = () => {
  // If using Gmail
  if (process.env.SMTP_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD, // App-specific password
      },
    });
  }
  
  // Generic SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

// Send OTP via Email
export async function sendOTPEmail(email, otp, purpose = 'verification') {
  try {
    // For development, log to console
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 OTP for ${email}: ${otp} (purpose: ${purpose})`);
    }

    // Check if email is configured
    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      console.warn('⚠️  Email not configured. Set SMTP_EMAIL and SMTP_PASSWORD in .env');
      
      // In development, just log and continue
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Email would be sent (development mode)');
        return true;
      }
      
      throw new Error('Email service not configured');
    }

    // Get email template based on purpose
    const { subject, htmlContent } = getEmailTemplate(otp, purpose);

    // Create transporter
    const transporter = createEmailTransporter();

    // Send email
    const info = await transporter.sendMail({
      from: `"To-Let Bangladesh" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject,
      html: htmlContent,
    });

    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Send OTP email error:', error);
    
    // In development, don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  Email sending failed but continuing in development mode');
      return true;
    }
    
    throw error;
  }
}

// Get email template based on purpose
function getEmailTemplate(otp, purpose) {
  const templates = {
    registration: {
      subject: 'Verify Your Email - To-Let Bangladesh',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #B85C48; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">To-Let Bangladesh</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Thank you for registering with To-Let Bangladesh!</p>
            
            <p>Your verification code is:</p>
            
            <div style="background-color: white; border: 2px solid #B85C48; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #B85C48; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
            </div>
            
            <p><strong>This code will expire in 5 minutes.</strong></p>
            
            <p>If you didn't request this code, please ignore this email.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply.<br>
              © ${new Date().getFullYear()} To-Let Bangladesh. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    },
    password_reset: {
      subject: 'Reset Your Password - To-Let Bangladesh',
      htmlContent: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #B85C48; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">To-Let Bangladesh</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>We received a request to reset your password.</p>
            
            <p>Your password reset code is:</p>
            
            <div style="background-color: white; border: 2px solid #B85C48; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #B85C48; margin: 0; font-size: 36px; letter-spacing: 8px;">${otp}</h1>
            </div>
            
            <p><strong>This code will expire in 5 minutes.</strong></p>
            
            <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply.<br>
              © ${new Date().getFullYear()} To-Let Bangladesh. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    },
  };

  return templates[purpose] || templates.registration;
}

// Send OTP via SMS (Twilio)
export async function sendOTPSMS(phone, otp, purpose = 'verification') {
  try {
    // For development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 SMS OTP for ${phone}: ${otp} (purpose: ${purpose})`);
    }

    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn('⚠️  SMS not configured. Set TWILIO credentials in .env');
      
      // In development, just log and continue
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SMS would be sent (development mode)');
        return true;
      }
      
      throw new Error('SMS service not configured');
    }

    // Create Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Format message based on purpose
    const message = purpose === 'registration'
      ? `Your To-Let registration OTP is: ${otp}. Valid for 5 minutes.`
      : `Your To-Let password reset OTP is: ${otp}. Valid for 5 minutes.`;

    // Send SMS
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });

    console.log(`✅ SMS sent successfully: ${result.sid}`);
    return true;
  } catch (error) {
    console.error('❌ Send OTP SMS error:', error);
    
    // In development, don't fail
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️  SMS sending failed but continuing in development mode');
      return true;
    }
    
    throw error;
  }
}

// Main function to send OTP (auto-detects email vs phone)
export async function sendOTP(identifier, otp, purpose = 'verification') {
  // Check if identifier is email or phone
  const isEmail = identifier.includes('@');
  
  if (isEmail) {
    return await sendOTPEmail(identifier, otp, purpose);
  } else {
    return await sendOTPSMS(identifier, otp, purpose);
  }
}
