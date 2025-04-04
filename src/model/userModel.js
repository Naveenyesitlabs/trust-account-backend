const dbConn = require('../../dbConfig');
const bcrypt = require('bcrypt');

// Method to find a user by email

const findUserByEmail = async (email) => {
    const query = 'SELECT * FROM users WHERE email = ?';
    try {
        const [rows] = await dbConn.query(query, [email]);
        if (rows.length === 0) {
            return null;
        }
        return rows[0];
    } catch (err) {
        throw new Error('Database error');
    }
};



// Method to save a new user
const createUser = async (userData) => {
    const { email, phone, password, role } = userData;
    const query = 'INSERT INTO users (email, phone, password, role) VALUES (?, ?, ?, ?)';
    try {
        const result = await dbConn.query(query, [email, phone, password, role]);
        return result;
    } catch (err) {
        throw err;
    }
};


// Method to update the user password
const updateUserPassword = async (userId, hashedPassword) => {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
    try {
        const [result] = await dbConn.query(query, [hashedPassword, userId]);
        return result;
    } catch (err) {
        throw new Error('Error updating password');
    }
};

// Method to update OTP (if you're using OTP functionality)
const updateUserOtp = async (userId, otp) => {
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 5);
    const query = 'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?';

    try {
        const [result] = await dbConn.query(query, [otp, otpExpiry, userId]);
        return result;
    } catch (err) {
        throw new Error('Error updating OTP');
    }
};


module.exports = { findUserByEmail, createUser, updateUserOtp, updateUserPassword };