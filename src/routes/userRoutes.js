const express = require('express');
const { login, signup, forgotPassword, verifyOtp, resetPassword } = require('../controller/userController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);


router.get('/protected', authenticateToken, authorizeRole(['user', 'admin', 'super-admin']), (req, res) => {
    res.json({
        message: 'You have access to this protected route',
        user: req.user,
    });
});

module.exports = router;
