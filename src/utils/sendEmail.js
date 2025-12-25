const transporter = require("../config/mail");

const sendEmail = async (to, link, type = "reset") => {
  const emailConfigs = {
    verification: {
      subject: "Verify Your Account",
      title: "Verify Your Email",
      message: "Click the button below to verify your email address and activate your account.",
      buttonText: "Verify Email",
      footerNote: "If you did not create an account, you can ignore this email."
    },
    reset: {
      subject: "Reset Your Password",
      title: "Reset Your Password",
      message: "Click the button below to reset your password. This link will expire in 15 minutes.",
      buttonText: "Reset Password",
      footerNote: "If you did not request this, you can ignore this email."
    }
  };

  const config = emailConfigs[type];

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: config.subject,
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center; padding: 30px;">
        <h2 style="color: #2563eb;">${config.title}</h2>
        <p>${config.message}</p>

        <a href="${link}" 
           style="
             display: inline-block;
             padding: 12px 25px;
             background-color: #2563eb;
             color: white;
             text-decoration: none;
             border-radius: 6px;
             font-weight: bold;
             margin-top: 20px;
           ">
           ${config.buttonText}
        </a>

        <p style="margin-top: 20px; font-size: 14px; color: #555;">
          If the button does not work, copy and paste this link in your browser:
        </p>
        <p style="word-break: break-all; color: #2563eb;">
          <a href="${link}" style="color: #2563eb; text-decoration: underline;">${link}</a>
        </p>

        <p style="margin-top: 20px; font-size: 12px; color: #555;">
          ${config.footerNote}
        </p>
      </div>
    `
  });
};

module.exports = sendEmail;