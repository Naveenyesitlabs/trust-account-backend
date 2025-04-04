// const fs = require("fs");
// const pdfParse = require("pdf-parse");
// const Tesseract = require("tesseract.js");

// /**
//  * Extracts text data from a PDF file.
//  * If the PDF is not readable, uses OCR (Tesseract.js) as a fallback.
//  */
// const extractPdfData = async (filePath) => {
//     try {
//         console.log("🔍 Checking file path:", filePath);
//         if (!fs.existsSync(filePath)) {
//             throw new Error("PDF file does not exist: " + filePath);
//         }

//         console.log("📂 Reading PDF file...");
//         const fileBuffer = fs.readFileSync(filePath);
//         const data = await pdfParse(fileBuffer);

//         console.log("📜 Extracted PDF Content:\n", data.text); // Log full extracted text

//         // If no text was extracted, try OCR
//         if (!data.text || data.text.trim() === "") {
//             console.warn("⚠️ No text extracted. Trying OCR...");
//             return extractPdfWithOCR(filePath);
//         }

//         console.log("🛠 Parsing Extracted Data...");
//         const parsedData = parseBankStatement(data.text);
//         console.log("✅ Parsed Data:", parsedData); // Log parsed data structure

//         return parsedData;
//     } catch (error) {
//         console.error("❌ Error parsing PDF:", error);
//         throw new Error("Failed to extract data from PDF.");
//     }
// };


// /**
//  * Uses OCR to extract text from scanned PDFs.
//  */
// const extractPdfWithOCR = async (filePath) => {
//     try {
//         const { data: { text } } = await Tesseract.recognize(filePath, "eng");

//         console.log("OCR Extracted Text:\n", text);

//         return parseBankStatement(text);
//     } catch (error) {
//         console.error("Error processing PDF with OCR:", error);
//         throw new Error("Failed to extract data from scanned PDF.");
//     }
// };

// /**
//  * Parses extracted text into structured bank statement data.
//  */
// const parseBankStatement = (text) => {
//     console.log("📜 Parsing Bank Statement...");
//     const lines = text.split("\n").map(line => line.trim()).filter(line => line);

//     let customerName = null;
//     let bankName = null;
//     let accountNumber = null;
//     let statementPeriod = null;
//     let openingBalance = null;
//     let closingBalance = null;
//     let accountType = null;
//     const transactions = [];

//     for (let i = 0; i < lines.length; i++) {
//         const line = lines[i];

//         console.log("🔎 Checking line:", line);

//         // Extract Customer Name
//         if (!customerName && line.match(/John Smith/i)) {
//             customerName = "John Smith";
//             console.log("✅ Customer Name:", customerName);
//         }

//         // Extract Bank Name
//         if (!bankName && line.match(/First Citizens Bank/i)) {
//             bankName = "First Citizens Bank";
//             console.log("✅ Bank Name:", bankName);
//         }

//         // Extract Account Number
//         const accountMatch = line.match(/Account Number:\s*([\d-]+)/);
//         if (accountMatch) {
//             accountNumber = accountMatch[1];
//             console.log("✅ Account Number:", accountNumber);
//         }

//         // Extract Statement Period
//         const statementPeriodMatch = line.match(/Period Covered:\s*([\d\/-]+)/);
//         if (statementPeriodMatch) {
//             statementPeriod = statementPeriodMatch[1];
//             console.log("✅ Statement Period:", statementPeriod);
//         }

//         // Extract Opening Balance
//         const openingBalanceMatch = line.match(/Opening Balance:\s*([\d,]+\.\d{2})/);
//         if (openingBalanceMatch) {
//             openingBalance = openingBalanceMatch[1].replace(/,/g, '');
//             console.log("✅ Opening Balance:", openingBalance);
//         }

//         // Extract Closing Balance
//         const closingBalanceMatch = line.match(/Closing Balance:\s*([\d,]+\.\d{2})/);
//         if (closingBalanceMatch) {
//             closingBalance = closingBalanceMatch[1].replace(/,/g, '');
//             console.log("✅ Closing Balance:", closingBalance);
//         }

//         // Extract Account Type
//         const accountTypeMatch = line.match(/Account Type:\s*(.*)/);
//         if (accountTypeMatch) {
//             accountType = accountTypeMatch[1].trim();
//             console.log("✅ Account Type:", accountType);
//         }

//         // Extract Transactions (Date | Description | Credit | Debit | Balance)
//         const transactionMatch = line.match(/(\d{2}\/\d{2}\/\d{4})\s+([\w\s-]+)\s+([\d,]*)\s+([\d,]*)\s+([\d,]+)/);
//         if (transactionMatch) {
//             const transaction = {
//                 date: transactionMatch[1],
//                 description: transactionMatch[2],
//                 credit: transactionMatch[3] ? parseFloat(transactionMatch[3].replace(/,/g, '')) : 0,
//                 debit: transactionMatch[4] ? parseFloat(transactionMatch[4].replace(/,/g, '')) : 0,
//                 balance: parseFloat(transactionMatch[5].replace(/,/g, ''))
//             };
//             transactions.push(transaction);
//             console.log("✅ Transaction:", transaction);
//         }
//     }

//     const extractedData = {
//         customer_details: { customer_name: customerName || "Unknown Customer" },
//         account_details: {
//             bank_name: bankName || "Unknown Bank",
//             account_number: accountNumber || "000-000-000-000",
//             statement_period: statementPeriod || null,
//             account_type: accountType || null
//         },
//         balances: {
//             opening_balance: openingBalance || "0.00",
//             closing_balance: closingBalance || "0.00"
//         },
//         transactions
//     };

//     console.log("🎯 Final Extracted Data:", extractedData);
//     return extractedData;
// };




// // Export functions
// module.exports = { extractPdfData };

const fs = require("fs");
const path = require("path");
const pdf2img = require("pdf-poppler");
const Tesseract = require("tesseract.js");

const extractPdfData = async (filePath) => {
    try {
        console.log("📄 Converting PDF to images...");

        const outputDir = path.join(__dirname, "temp_images");
        if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

        const opts = {
            format: "png",
            out_dir: outputDir,
            out_prefix: "bank_statement",
            page: null // Convert all pages
        };

        await pdf2img.convert(filePath, opts);
        console.log("✅ PDF converted to images.");

        // Get all images from the temp folder
        const images = fs.readdirSync(outputDir)
            .filter(file => file.startsWith("bank_statement") && file.endsWith(".png"))
            .map(file => path.join(outputDir, file));

        if (images.length === 0) throw new Error("No images found after conversion!");

        let extractedText = "";
        for (const imagePath of images) {
            console.log("🖼 Running OCR on:", imagePath);
            const { data: { text } } = await Tesseract.recognize(imagePath, "eng");

            extractedText += "\n" + text;
        }

        console.log("📜 OCR Extracted Text:\n", extractedText);

        if (!extractedText.trim()) throw new Error("OCR did not extract any text.");

        return parseBankStatement(extractedText);
    } catch (error) {
        console.error("❌ Error processing PDF with OCR:", error.message);
        throw new Error("Failed to extract data from scanned PDF.");
    }
};

const parseBankStatement = (text) => {
    console.log("🔍 Parsing extracted text...");

    const bankStatement = {
        customer_details: { customer_name: null },
        account_details: { bank_name: null, account_number: null, statement_period: null },
        balances: { opening_balance: null, closing_balance: null },
        transactions: []
    };

    const lines = text.split("\n").map(line => line.trim()).filter(line => line);

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("Account Number:")) {
            bankStatement.account_details.account_number = lines[i].split(":")[1].trim();
        } else if (lines[i].includes("Statement Date:")) {
            bankStatement.account_details.statement_period = lines[i].split(":")[1].trim();
        } else if (lines[i].includes("Account Holder:")) {
            bankStatement.customer_details.customer_name = lines[i].split(":")[1].trim();
        } else if (lines[i].includes("Bank Name:")) {
            bankStatement.account_details.bank_name = lines[i].split(":")[1].trim();
        } else if (lines[i].includes("Opening Balance:")) {
            bankStatement.balances.opening_balance = lines[i].split(":")[1].trim();
        } else if (lines[i].includes("Closing Balance:")) {
            bankStatement.balances.closing_balance = lines[i].split(":")[1].trim();
        } else if (lines[i].match(/^\d{2}\/\d{2}\/\d{4}/)) {
            const parts = lines[i].split(/\s{2,}/);
            if (parts.length >= 3) {
                const transaction = {
                    date: parts[0],
                    description: parts[1],
                    debit: parts.length > 3 ? parts[2] : null,
                    credit: parts.length > 3 ? parts[3] : parts[2],
                    balance: parts.length > 3 ? parts[4] : parts[3]
                };
                bankStatement.transactions.push(transaction);
            }
        }
    }

    console.log("✅ Parsed Bank Statement:", JSON.stringify(bankStatement, null, 2));
    return bankStatement;
};

module.exports = { extractPdfData };
