const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createBankStatementController, getBankStatementsController } = require('../controller/accountsController');
const path = require('path');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '..', 'uploads');
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

router.post('/upload-statement', authenticateToken, upload.single('pdf'), createBankStatementController);
router.get('/get-statement', authenticateToken, getBankStatementsController);

module.exports = router;
