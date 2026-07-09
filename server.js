const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const { PdfReader } = require('pdfreader');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

app.get('/api/status', (req, res) => {
    res.json({ message: "Week 2 server is running perfectly!" });
});

app.post('/api/upload', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Please check frontend logic." });
    }
    
    console.log("🚀 [Backend] Resume received successfully! File Details:", {
        originalName: req.file.originalname,
        savedAs: req.file.filename,
        size: `${(req.file.size / 1024).toFixed(2)} KB`
    });

    try {
        const fileBuffer = fs.readFileSync(req.file.path);
        
        const extractedText = await new Promise((resolve, reject) => {
            let fullText = "";
            new PdfReader().parseBuffer(fileBuffer, (err, item) => {
                if (err) {
                    reject(err);
                } else if (!item) {
                    resolve(fullText);
                } else if (item.text) {
                    fullText += item.text + " ";
                }
            });
        });
        
        console.log("\n📄 [Parser] Successfully extracted text from PDF:\n");
        console.log("--------------------------------------------------");
        console.log(extractedText.trim());
        console.log("--------------------------------------------------\n");

        res.json({
            status: "success",
            message: "Resume received and text parsed successfully on backend!",
            fileName: req.file.originalname,
            textLength: extractedText.length
        });

    } catch (parseError) {
        console.error("❌ [Parser Error] Failed to parse PDF file:", parseError);
        res.status(500).json({
            status: "error",
            message: "Failed to parse PDF content."
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Week 2 backend server is ready at http://localhost:${PORT}`);
});