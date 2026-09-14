// Quick test script for Email & SMS OTP
import { sendOTPEmail, sendOTPSMS } from './src/utils/sendOTP.js';
import dotenv from 'dotenv';

dotenv.config();

async function testEmail() {
  console.log('\n📧 Testing Email OTP...\n');
  
  try {
    const testEmail = process.env.TEST_EMAIL || 'your-email@gmail.com';
    const testOTP = '123456';
    
    console.log(`Sending OTP to: ${testEmail}`);
    await sendOTPEmail(testEmail, testOTP, 'registration');
    
    console.log('✅ Email sent successfully!');
    console.log('Check your inbox:', testEmail);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
}

async function testSMS() {
  console.log('\n📱 Testing SMS OTP...\n');
  
  try {
    const testPhone = process.env.TEST_PHONE || '+8801712345678';
    const testOTP = '654321';
    
    console.log(`Sending SMS to: ${testPhone}`);
    await sendOTPSMS(testPhone, testOTP, 'password_reset');
    
    console.log('✅ SMS sent successfully!');
    console.log('Check your phone:', testPhone);
  } catch (error) {
    console.error('❌ SMS test failed:', error.message);
  }
}

async function main() {
  console.log('=================================');
  console.log('  Email & SMS OTP Test Script');
  console.log('=================================');
  
  // Check configuration
  console.log('\n📋 Configuration Check:\n');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('SMTP_EMAIL:', process.env.SMTP_EMAIL ? '✅ Set' : '❌ Not set');
  console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Not set');
  console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Not set');
  console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Not set');
  
  // Test email
  await testEmail();
  
  // Test SMS
  await testSMS();
  
  console.log('\n=================================');
  console.log('  Test Complete');
  console.log('=================================\n');
}

main().catch(console.error);
