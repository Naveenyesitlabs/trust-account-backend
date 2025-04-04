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
