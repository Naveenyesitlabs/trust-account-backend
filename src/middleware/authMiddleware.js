const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.SECRET_KEY;

const authenticateToken = (req, res, next) => {
    console.log('Authorization Header:', req.headers['authorization']);
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};


const authorizeRole = (allowedRoles) => {
    return (req, res, next) => {
        if (allowedRoles.includes(req.user.role)) {
            next();
        } else {
            return res.status(403).json({ message: 'You do not have access to this route' });
        }
    };
};

module.exports = { authenticateToken, authorizeRole };
