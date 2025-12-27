  const bcrypt = require("bcryptjs");
  const jwt = require("jsonwebtoken");
  const { Op } = require("sequelize"); 
  const User = require("../models/user");
  const sendEmail = require("../utils/sendEmail");

/* REGISTER */
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword } = req.body;

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Password mismatch" });

    // تحقق من وجود البريد أو رقم الهاتف مسبقًا
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) return res.status(400).json({ message: "Email already registered" });
      return res.status(400).json({ message: "Phone number already registered" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({ name, email, phone, password: hash });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const link = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

    // أرسل بريد التفعيل بدلاً من إعادة تعيين كلمة المرور
    await sendEmail(email, link, "verification");

    res.json({ message: "Check your email to verify account" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
  /* VERIFY EMAIL */
  exports.verifyEmail = async (req, res) => {
    try {
      const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
      await User.update({ emailVerified: true }, { where: { id: decoded.id } });
      res.send("Email verified successfully");
    } catch (err) {
      console.error(err);
      res.status(400).send("Invalid or expired token");
    }
  };

  exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `${process.env.BASE_URL}/api/auth/verify-email/${token}`;

    await sendEmail(email, link, 'verification');

    res.json({ message: 'Verification email resent successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
// GET /auth/check-verification?email=...
exports.checkVerification = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ emailVerified: user.emailVerified });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /auth/check-reset?email=...
exports.checkReset = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // نجلب حالة reset (في هذا المثال نعتبر كلمة المرور تغيرت إذا تم آخر تحديث بعد إنشاء الطلب)
    const passwordChanged = user.updated_at > user.created_at;
    res.json({ passwordChanged });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


  /* LOGIN */

exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ where: { email: req.body.email } });

    if (!user)
      return res.status(401).json({ message: "User not found" });

    if (!user.emailVerified)
      return res.status(403).json({ message: "Email not verified" });

    const ok = await bcrypt.compare(req.body.password, user.password);
    if (!ok)
      return res.status(401).json({ message: "Wrong credentials" });

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.googleLogin = async (req, res) => {
  try {
    const { email, name, googleId } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    let user = await User.findOne({ where: { email } });

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email,
        password: 'GOOGLE_ACCOUNT',  // قيمة افتراضية لتجاوز الـ notNull
        phone: '0000000000',         // قيمة افتراضية لتجاوز الـ notNull
        emailVerified: true,
      });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


exports.forgetPasswordEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const resetLink = `${process.env.BASE_URL}/api/auth/reset-password/${token}`;

    await sendEmail(email, resetLink);

    res.json({ message: "Reset link sent to email" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.renderResetPasswordPage = (req, res) => {
  const { token } = req.params;

  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Reset Password</title>
<style>
  body {
    font-family: 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #2563eb, #1e40af);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
  }
  .card {
    background: #fff;
    padding: 40px 30px;
    width: 400px;
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
    text-align: center;
  }
  h2 {
    margin-bottom: 25px;
    color: #1e40af;
  }
  input {
    width: 100%;
    padding: 14px;
    margin-top: 15px;
    border-radius: 8px;
    border: 1px solid #ccc;
    font-size: 16px;
  }
  button {
    width: 100%;
    padding: 14px;
    margin-top: 25px;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: white;
    font-size: 16px;
    cursor: pointer;
    font-weight: bold;
  }
  button:hover {
    background: #1e40af;
  }
  .msg {
    margin-top: 15px;
    text-align: center;
    color: red;
  }
</style>
</head>
<body>

<div class="card">
  <h2>Reset Your Password</h2>

  <form method="POST" action="/auth/reset-password-email">
    <input type="hidden" name="token" value="${token}" />
    <input type="password" name="newPassword" placeholder="New Password" required />
    <input type="password" name="confirmPassword" placeholder="Confirm Password" required />
    <button type="submit">Reset Password</button>
  </form>
</div>

</body>
</html>
  `);
};

exports.resetPasswordEmail = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword)
      return res.send("All fields are required");

    if (newPassword !== confirmPassword)
      return res.send("Passwords do not match");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) return res.send("User not found");

    const hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hash });

    res.send(`
      <h2 style="text-align:center;margin-top:50px;color:#1e40af">
        ✅ Password reset successfully
      </h2>
    `);
  } catch (err) {
    res.send("❌ Invalid or expired link");
  }
};