const express = require("express");
const router = express.Router();

const c = require("../controllers/auth.controller");

router.post("/register", c.register);
router.get("/verify-email/:token", c.verifyEmail);
router.post("/login", c.login);
router.post("/google", c.googleLogin);

router.post("/forget-password-email", c.forgetPasswordEmail);
router.get("/reset-password/:token", c.renderResetPasswordPage);
router.post("/reset-password-email", c.resetPasswordEmail);
router.post('/resend-verification', c.resendVerification);
router.get('/check-verification', c.checkVerification);
router.get('/check-reset', c.checkReset);






module.exports = router;
