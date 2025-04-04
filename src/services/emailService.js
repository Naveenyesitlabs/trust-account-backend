const nodemailer = require('nodemailer');

// Create a transporter using SMTP transport (Here using Gmail's SMTP server)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
});




const sendOtpEmail = async (email, otp, retries = 3) => {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: email,
        subject: 'Your OTP Verification Code',
        text: `Your Verification Code: ${otp}`,
        html: `<p> Your Verification Code: <strong>${otp}</strong></p>`,
    };

    const sendEmail = async () => {
        try {
            await transporter.sendMail(mailOptions);
            console.log('OTP email sent successfully!');
        } catch (err) {
            console.error('Error sending email:', err);
            if (retries > 0) {
                console.log(`Retrying... (${retries} attempts left)`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                await sendEmail(retries - 1);
            } else {
                throw new Error('Failed to send OTP email after multiple attempts');
            }
        }
    };

    await sendEmail();
};


// Function to send the password reset email
// const sendPasswordResetEmail = async (email, resetLink) => {
//     const mailOptions = {
//         from: process.env.GMAIL_USER,
//         to: email,
//         subject: 'Password Reset Request',
//         text: `Please click the following link to reset your password: ${resetLink}`,
//         html: `<p>Please click the following link to reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
//     };

//     try {
//         await transporter.sendMail(mailOptions);
//         console.log('Password reset email sent successfully!');
//     } catch (err) {
//         console.error('Error sending email:', err);
//         throw new Error('Failed to send password reset email');
//     }
// };

module.exports = { sendOtpEmail };
