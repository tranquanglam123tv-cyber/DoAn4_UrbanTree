const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 📧 Dịch vụ Gửi Email Mã OTP (Email OTP Service)
 * Phụ trách: Đoàn Thế Thuần (MSSV: 2311031)
 */

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    });
  }
  return transporter;
}

/**
 * Gửi email chứa mã OTP 6 số xác thực
 * @param {string} toEmail Email người nhận
 * @param {string} otpCode Mã OTP 6 chữ số
 * @param {string} actionName Hành động (Đăng nhập / Đổi mật khẩu)
 */
async function sendOtpEmail(toEmail, otpCode, actionName = 'Đăng nhập vào Hệ thống UrbanTree') {
  const mailOptions = {
    from: process.env.SMTP_FROM || '"UrbanTree Security" <no-reply@urbantree.vn>',
    to: toEmail,
    subject: `[UrbanTree] Mã xác thực OTP của bạn là: ${otpCode}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e0ebd0; border-radius: 12px; background-color: #f6f5ec;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #174b36; margin: 0; font-size: 24px;">🌳 UrbanTree Smart Forestry</h1>
          <p style="color: #4c956c; font-size: 14px; margin-top: 4px;">Hệ thống Quản lý Cây xanh Đô thị thông minh</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <p style="font-size: 15px; color: #333333; margin-top: 0;">Xin chào,</p>
          <p style="font-size: 14px; color: #555555;">Bạn đang thực hiện <strong>${actionName}</strong>. Vui lòng sử dụng mã xác thực bảo mật 6 chữ số dưới đây:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #174b36; background-color: #f3e8b2; padding: 12px 28px; border-radius: 8px; border: 1px dashed #4c956c;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 13px; color: #e65100; font-weight: bold; text-align: center;">⏱️ Mã này có hiệu lực trong 5 phút. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
        </div>
        <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888888;">
          <p style="margin: 0;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email.</p>
          <p style="margin: 4px 0 0 0;">© 2026 UrbanTree Team. Phát triển bởi Trần Quang Lâm & Đoàn Thế Thuần.</p>
        </div>
      </div>
    `
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);
    console.log(`✅ [EmailService] Đã gửi mã OTP đến ${toEmail}: MessageId=${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ [EmailService] Không thể kết nối SMTP thật (${error.message}). Dev Fallback Code: [${otpCode}]`);
    return {
      success: false,
      devMode: true,
      otpCode: otpCode,
      message: 'SMTP chưa cấu hình tài khoản thực tế; đã sinh mã OTP chế độ phát triển.'
    };
  }
}

module.exports = {
  sendOtpEmail
};

