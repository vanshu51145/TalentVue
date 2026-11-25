const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendResetPasswordEmail } = require("../utils/emailService");

// Register User
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Please fill all fields",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Login User
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Please enter email and password",
      });
    }

    // Find user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Compare password
    const isPasswordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Forgot Password: send reset link to registered email
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Please provide your email address.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Generic response: do not reveal whether the email exists
      return res.status(200).json({
        message:
          "If an account exists for this email, a password reset link has been sent.",
      });
    }

    // Generate cryptographically secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before storing in MongoDB (never store plain text)
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Set expiry: 15 minutes from now
    const resetExpires = Date.now() + 15 * 60 * 1000;

    user.passwordResetToken = resetTokenHash;
    user.passwordResetExpires = resetExpires;

    await user.save();

    // Build reset link (frontend URL configurable via env var)
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(
      email
    )}`;

    try {
      await sendResetPasswordEmail({ email, resetUrl });
    } catch (emailError) {
      // Clear the token so a later retry starts fresh. Log server-side only:
      // never reveal to the caller whether the address exists or that
      // delivery failed (prevents account enumeration).
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      console.error("EMAIL SEND ERROR:", emailError.message);
    }

    res.status(200).json({
      message:
        "If an account exists for this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// Reset Password: validate token and set new password
const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword) {
      return res.status(400).json({
        message: "Email, reset token, and new password are required.",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    if (
      !user.passwordResetToken ||
      !user.passwordResetExpires
    ) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Check token expiry
    if (Date.now() > user.passwordResetExpires) {
      // Clear expired token
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      return res.status(400).json({
        message: "Reset token has expired. Please request a new one.",
      });
    }

    // Compare provided token with stored hash
    const isTokenValid = await bcrypt.compare(token, user.passwordResetToken);

    if (!isTokenValid) {
      return res.status(400).json({
        message: "Invalid or expired reset token.",
      });
    }

    // Hash the new password using existing bcrypt configuration
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;

    // Clear the used reset token and expiry (single-use)
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Record password change timestamp (for future JWT invalidation)
    user.passwordChangedAt = new Date();

    await user.save();

    res.status(200).json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
};