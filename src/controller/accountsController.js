const fs = require('fs');
const path = require('path');
const { extractPdfData } = require('../utils/extractData');
const { createBankStatement } = require('../model/accountsModel');

const createBankStatementController = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const uploadDir = path.join(__dirname, '..', 'uploads');
        const filePath = path.join(uploadDir, req.file.filename);

        console.log('File saved at:', filePath);

        if (!fs.existsSync(filePath)) {
            throw new Error('File not found: ' + filePath);
        }

        const pdfData = await extractPdfData(filePath);

        console.log("Extracted Data:", pdfData);  // DEBUGGING OUTPUT

        if (!pdfData || !pdfData.customer_details || !pdfData.account_details) {
            throw new Error('Failed to extract valid data from PDF.');
        }

        // Map extracted data to match database fields
        const bankStatementData = {
            user_name: pdfData.customer_details?.customer_name || null,
            bank_name: pdfData.account_details?.bank_name || null,
            account_number: pdfData.account_details?.account_number || null,
            statement_period: pdfData.account_details?.statement_period || null,
            ending_balance: pdfData.balances?.closing_balance || null,
            transaction_details: JSON.stringify(pdfData.transactions) || null,
            daily_balance: pdfData.balances?.opening_balance || null
        };

        if (!bankStatementData.user_name || !bankStatementData.bank_name || !bankStatementData.account_number) {
            throw new Error("Missing required fields: user_name, bank_name, or account_number.");
        }

        // Insert into database
        const bankStatement = await createBankStatement(bankStatementData);
        console.log('Database Inserted:', bankStatement);

        res.status(201).json({
            message: 'Bank statement created successfully',
            id: bankStatement.id
        });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error creating bank statement: ' + error.message });
    }
};

module.exports = { createBankStatementController };
