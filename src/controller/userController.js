const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../model/userModel');
const { createUser, findUserByEmail } = require('../model/userModel');
const { sendOtpEmail } = require('../services/emailService');

const JWT_SECRET = process.env.SECRET_KEY;

// Login Controller

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ message: 'Invalid password' });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
            expiresIn: '1h',
        });
        return res.json({ token });
    } catch (err) {
        return res.status(500).json({ message: 'An error occurred during the login process', error: err.message });
    }
};


// Signup Controller
const signup = async (req, res) => {
    const { email, phone, password, confirmPassword, agreeToTerms } = req.body;

    if (!email || !phone || !password || !confirmPassword || agreeToTerms !== true) {
        return res.status(400).json({ message: 'All fields are required and you must agree to terms' });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            email,
            phone,
            password: hashedPassword,
            role: 'user', // Default role can be 'user', 'admin', etc.
        };

        await createUser(newUser);

        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ message: 'An error occurred during the signup process', error: err.message });
    }
};


// Generate a 6-digit OTP
const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000);
};

// forgot-password
const forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required' });
    }

    try {
        const user = await User.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: 'User not found with provided email' });
        }
        const otp = generateOtp();
        await User.updateUserOtp(user.id, otp);
        await sendOtpEmail(user.email, otp);

        return res.status(200).json({ message: 'OTP sent successfully to your email' });
    } catch (err) {
        console.error('Error in forgot password API:', err);
        return res.status(500).json({ message: 'An error occurred while processing the request', error: err.message });
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required' });
    }

    try {
        const user = await User.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: 'User not found with provided email' });
        }

        // Check if OTP has expired
        const currentTime = new Date();
        const otpExpiryTime = new Date(user.otp_expiry);

        if (currentTime > otpExpiryTime) {
            return res.status(400).json({ message: 'OTP has expired' });
        }

        if (user.otp !== parseInt(otp)) {
            return res.status(400).json({ message: 'Invalid OTP' });
        }

        return res.status(200).json({ message: 'OTP verified successfully' });
    } catch (err) {
        console.error('Error in OTP verification:', err);
        return res.status(500).json({ message: 'An error occurred while verifying OTP', error: err.message });
    }
};


// Reset Password
const resetPassword = async (req, res) => {
    const { email, newPassword, confirmPassword } = req.body;

    if (!email || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Email, new password, and confirm password are required' });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'Passwords do not match' });
    }

    try {
        const user = await User.findUserByEmail(email);

        if (!user) {
            return res.status(404).json({ message: 'User not found with provided email' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await User.updateUserPassword(user.id, hashedPassword);
        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Error resetting password:', err);
        return res.status(500).json({ message: 'An error occurred while resetting the password' });
    }
};



module.exports = { login, signup, forgotPassword, verifyOtp, resetPassword };
