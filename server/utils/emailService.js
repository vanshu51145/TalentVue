const nodemailer = require("nodemailer");

let transporter = null;

// Mask the local part of an address so diagnostics never leak full
// recipient/account identifiers. Keeps the domain for verification.
const maskEmail = (address) => {
  if (typeof address !== "string" || !address.includes("@")) {
    return "***";
  }

  const [local, domain] = address.split("@");
  const safeLocal =
    local.length <= 2 ? "*" : `${local[0]}***${local[local.length - 1]}`;

  return `${safeLocal}@${domain}`;
};

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (!host) {
    // Never let Nodemailer silently fall back to localhost when SMTP_HOST is
    // missing — fail loudly with a clear, credential-free configuration error.
    throw new Error(
      "SMTP_HOST is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER and SMTP_PASS."
    );
  }

  // Safe diagnostic: host and port only — never log credentials or tokens.
  console.log(`SMTP transporter configured for ${host}:${port}`);

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
  });

  return transporter;
};

const sendResetPasswordEmail = async ({ email, resetUrl }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "TalentVue — Password Reset",
    text: `You requested a password reset for your TalentVue account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 15 minutes.

If you did not request this reset, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">TalentVue — Password Reset</h2>
        <p>You requested a password reset for your TalentVue account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        <p style="margin-top: 20px; font-size: 14px; color: #666;">This link will expire in 15 minutes.</p>
        <p style="font-size: 14px; color: #666;">If you did not request this reset, please ignore this email.</p>
      </div>
    `,
  };

  const info = await getTransporter().sendMail(mailOptions);

  // Safe diagnostics: never log the reset URL, token, credentials or full
  // recipient addresses. This captures what Nodemailer actually reported.
  console.log("SMTP send result:", {
    accepted: (info.accepted || []).map(maskEmail),
    rejected: (info.rejected || []).map(maskEmail),
    messageId: info.messageId,
    response: info.response,
  });

  return info;
};

module.exports = {
  sendResetPasswordEmail,
};
