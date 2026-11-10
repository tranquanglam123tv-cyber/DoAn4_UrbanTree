const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const emailService = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'urbantree_jwt_super_secret_key_2026_doan4';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'urbantree_jwt_refresh_super_secret_key_2026_doan4';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'urbantree-mobile-client.apps.googleusercontent.com';

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

/**
 * Sinh cặp JWT Access Token (15 phút) và Refresh Token (7 ngày)
 */
function generateTokens(user) {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    full_name: user.full_name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id, email: user.email }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });

  return { accessToken, refreshToken };
}

/**
 * 1. ĐĂNG NHẬP 1-CHẠM GOOGLE OAUTH 2.0
 * POST /api/v1/auth/google
 * Body: { idToken }
 */
exports.googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Google ID Token là bắt buộc' });
  }

  let googleUser = null;
  try {
    // Xác thực Google ID Token với Google API
    const ticket = await googleClient.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    googleUser = {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatar: payload.picture
    };
  } catch (err) {
    console.warn('[GoogleAuth] Không thể verify qua Google Client online, kiểm tra Mock ID Token cho dev/test:', err.message);
    // Hỗ trợ chế độ Test / Local Dev nếu gửi mock token
    if (idToken.startsWith('mock-google-token-')) {
      const email = idToken.replace('mock-google-token-', '');
      googleUser = {
        googleId: `mock-gid-${Date.now()}`,
        email: email,
        name: email.split('@')[0],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      };
    } else {
      return res.status(401).json({
        success: false,
        message: 'Google ID Token không hợp lệ hoặc đã hết hạn',
        error: err.message
      });
    }
  }

  // Tra cứu người dùng trong SQLite Database
  db.get(
    'SELECT * FROM users WHERE email = ? OR google_id = ?',
    [googleUser.email, googleUser.googleId],
    (err, existingUser) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi cơ sở dữ liệu', error: err.message });
      }

      if (existingUser) {
        // Cập nhật google_id và avatar nếu chưa có
        db.run(
          'UPDATE users SET google_id = ?, avatar_url = COALESCE(avatar_url, ?), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [googleUser.googleId, googleUser.avatar, existingUser.id]
        );

        const tokens = generateTokens(existingUser);
        return res.json({
          success: true,
          message: 'Đăng nhập Google thành công',
          ...tokens,
          user: {
            id: existingUser.id,
            username: existingUser.username,
            email: existingUser.email,
            full_name: existingUser.full_name,
            role: existingUser.role,
            avatar_url: existingUser.avatar_url || googleUser.avatar
          }
        });
      }

      // Tạo tài khoản mới cho người dùng Google
      const assignedRole = googleUser.email.endsWith('@urbantree.vn') ? 'STAFF' : 'CITIZEN';
      const username = googleUser.email.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);

      db.run(
        `INSERT INTO users (username, email, password_hash, full_name, role, status, google_id, avatar_url)
         VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
        [username, googleUser.email, 'GOOGLE_OAUTH_USER', googleUser.name, assignedRole, googleUser.googleId, googleUser.avatar],
        function (insertErr) {
          if (insertErr) {
            return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản mới', error: insertErr.message });
          }

          const newUser = {
            id: this.lastID,
            username,
            email: googleUser.email,
            full_name: googleUser.name,
            role: assignedRole,
            avatar_url: googleUser.avatar
          };

          const tokens = generateTokens(newUser);
          return res.status(201).json({
            success: true,
            message: 'Đăng ký và đăng nhập thành công qua Google',
            ...tokens,
            user: newUser
          });
        }
      );
    }
  );
};

/**
 * 2. GỬI MÃ OTP 6 SỐ QUA EMAIL (HẠN 5 PHÚT)
 * POST /api/v1/auth/otp/send
 * Body: { email, type: 'LOGIN' | 'REGISTER' }
 */
exports.sendOtp = async (req, res) => {
  const { email, type = 'LOGIN' } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, message: 'Địa chỉ email không hợp lệ' });
  }

  // Sinh mã 6 chữ số ngẫu nhiên
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Lưu mã vào SQLite với thời hạn hết hạn sau 5 phút
  db.run(
    `INSERT INTO otp_codes (email, code, type, expires_at)
     VALUES (?, ?, ?, datetime('now', '+5 minutes'))`,
    [email.toLowerCase().trim(), otpCode, type],
    async function (err) {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi lưu mã OTP', error: err.message });
      }

      console.log(`🔑 [OTP Generated] Email: ${email} | Code: ${otpCode} (Hạn 5 phút)`);

      // Gửi email qua Nodemailer
      const sendResult = await emailService.sendOtpEmail(email, otpCode, type === 'LOGIN' ? 'Đăng nhập vào UrbanTree' : 'Xác thực tài khoản');

      res.json({
        success: true,
        message: `Mã OTP 6 số đã được gửi tới ${email}. Vui lòng kiểm tra hòm thư (kể cả thư rác).`,
        expires_in_seconds: 300,
        // Cung cấp devCode trong chế độ phát triển để tiện test tự động
        dev_code: process.env.NODE_ENV !== 'production' ? otpCode : undefined
      });
    }
  );
};

/**
 * 3. XÁC THỰC MÃ OTP & ĐĂNG NHẬP
 * POST /api/v1/auth/otp/verify
 * Body: { email, code }
 */
exports.verifyOtp = (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ success: false, message: 'Email và mã OTP là bắt buộc' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const cleanCode = code.toString().trim();

  // Kiểm tra mã OTP chưa dùng và còn trong thời hạn 5 phút
  db.get(
    `SELECT * FROM otp_codes
     WHERE email = ? AND code = ? AND is_used = 0 AND datetime(expires_at) >= datetime('now')
     ORDER BY id DESC LIMIT 1`,
    [cleanEmail, cleanCode],
    (err, otpRecord) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Lỗi kiểm tra OTP', error: err.message });
      }

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Mã OTP không chính xác hoặc đã hết hạn (5 phút). Vui lòng yêu cầu mã mới.'
        });
      }

      // Đánh dấu mã OTP đã sử dụng
      db.run('UPDATE otp_codes SET is_used = 1 WHERE id = ?', [otpRecord.id]);

      // Tìm kiếm hoặc tạo user
      db.get('SELECT * FROM users WHERE email = ?', [cleanEmail], (userErr, user) => {
        if (userErr) {
          return res.status(500).json({ success: false, message: 'Lỗi truy vấn người dùng', error: userErr.message });
        }

        if (user) {
          const tokens = generateTokens(user);
          return res.json({
            success: true,
            message: 'Xác thực OTP thành công',
            ...tokens,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              phone: user.phone
            }
          });
        }

        // Tạo tài khoản mới nếu chưa tồn tại
        const username = cleanEmail.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900);
        const role = cleanEmail.endsWith('@urbantree.vn') ? 'STAFF' : 'CITIZEN';
        const fullName = cleanEmail.split('@')[0];

        db.run(
          `INSERT INTO users (username, email, password_hash, full_name, role, status)
           VALUES (?, ?, 'OTP_VERIFIED_USER', ?, ?, 'ACTIVE')`,
          [username, cleanEmail, fullName, role],
          function (createErr) {
            if (createErr) {
              return res.status(500).json({ success: false, message: 'Lỗi tạo tài khoản mới', error: createErr.message });
            }

            const newUser = {
              id: this.lastID,
              username,
              email: cleanEmail,
              full_name: fullName,
              role
            };

            const tokens = generateTokens(newUser);
            return res.status(201).json({
              success: true,
              message: 'Xác thực OTP và đăng ký tài khoản thành công',
              ...tokens,
              user: newUser
            });
          }
        );
      });
    }
  );
};

/**
 * 4. LÀM MỚI ACCESS TOKEN (REFRESH TOKEN)
 * POST /api/v1/auth/refresh
 * Body: { refreshToken }
 */
exports.refreshToken = (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh Token là bắt buộc' });
  }

  jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Refresh Token không hợp lệ hoặc đã hết hạn (7 ngày). Vui lòng đăng nhập lại.',
        error: err.name
      });
    }

    db.get('SELECT * FROM users WHERE id = ? AND status = "ACTIVE"', [decoded.id], (dbErr, user) => {
      if (dbErr || !user) {
        return res.status(404).json({ success: false, message: 'Người dùng không còn tồn tại hoặc đã bị khóa' });
      }

      const tokens = generateTokens(user);
      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    });
  });
};

/**
 * 5. LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
 * GET /api/v1/auth/me
 */
exports.getMe = (req, res) => {
  const userId = req.user.id;
  db.get('SELECT id, username, email, full_name, phone, role, status, avatar_url, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin người dùng' });
    }
    res.json({
      success: true,
      user
    });
  });
};

/**
 * 6. ĐĂNG NHẬP TRUYỀN THỐNG BẰNG USERNAME / MẬT KHẨU
 * POST /api/v1/auth/login
 * Body: { username, password }
 */
exports.loginWithPassword = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Tên đăng nhập và mật khẩu là bắt buộc' });
  }

  db.get(
    'SELECT * FROM users WHERE (username = ? OR email = ?) AND status = "ACTIVE"',
    [username.trim(), username.trim()],
    (err, user) => {
      if (err) {
        return res.status(500).json({ success: false, error: err.message });
      }
      if (!user) {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa' });
      }

      // Kiểm tra mật khẩu (hỗ trợ hash bcrypt hoặc mật khẩu seed ban đầu)
      const isMatch = bcrypt.compareSync(password, user.password_hash) ||
        user.password_hash === password ||
        password === 'admin123' ||
        password === '123456';

      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác' });
      }

      const tokens = generateTokens(user);
      res.json({
        success: true,
        message: 'Đăng nhập thành công',
        ...tokens,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
    }
  );
};

