require('dotenv').config(); // 1. Load configuration from .env file
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const pdfParse = require('pdf-parse-fork');
// 2. Import the correct class from @google/generative-ai
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: 'uploads/' });

// 3. Initialize the Gemini client using your API Key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/api/status', (req, res) => {
    res.json({ message: "Backend server with Gemini Paid Tier is running perfectly!" });
});

app.post('/api/upload', upload.single('resume'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Please check frontend logic." });
    }
    
    console.log(`🚀 [Backend] Resume received successfully: ${req.file.originalname}`);

    try {
        // 4. Read and Parse local PDF file
        const fileBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(fileBuffer);
        const resumeText = pdfData.text.trim();

        console.log("📄 [Parser] Text extracted successfully. Sending context to Gemini API...");

        // 5. Structure the prompt to guide the AI analyzer
        const prompt = `
You are a professional technical recruiter and IT talent specialist. Please analyze the following candidate resume plain text and extract the information into three clear sections:
1. Core Technical Skills & Strengths
2. Key Project Experience Highlight
3. Actionable Optimization & Improvement Suggestions

Please provide the response in clear, readable English, keeping it professional and objective. Do not include introductory or polite small talk.

Resume Text Content:
${resumeText}
        `;

        // 6. Call the high-priority Paid Tier Gemini model
        // (You can use "gemini-3.5-flash" or "gemini-2.0-flash")
        const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiAnalysis = response.text();

        console.log("\n✨ [Gemini AI Analysis Result]:\n");
        console.log("--------------------------------------------------");
        console.log(aiAnalysis);
        console.log("--------------------------------------------------\n");

    // 7. Return the final structured response back to the extension frontend
      res.json({
        status: "success",
        fileName: req.file.originalname,
        analysis: aiAnalysis,
        resumeText: resumeText
      });

    } catch (error) {
        console.error("❌ [Server Error] Process failed during parsing or AI analysis:", error);
        res.status(500).json({ status: "error", message: "Failed to process and analyze resume content with Gemini." });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Week 3 backend server is ready at http://localhost:${PORT}`);
});

// --- Week 4: Job Matching API ---
// This endpoint receives the scraped job data and matches it with the parsed resume
app.post('/api/match', async (req, res) => {
  try {
    const { jobTitle, jobDescription, resumeText } = req.body;

    if (!jobDescription || !resumeText) {
      return res.status(400).json({
        status: 'error',
        error: 'Missing job description or resume data.'
      });
    }

    // Construct the prompt for Gemini to cross-reference resume and job description
    const prompt = `
      You are an expert career coach and recruiter. Analyze the fit between the candidate's resume and the job description below.
      
      [Job Title]
      ${jobTitle}

      [Job Description]
      ${jobDescription}

      [Candidate Resume]
      ${resumeText}

      Please provide a structured response with the following format (use Markdown):
      ### 🎯 Match Score: [Insert a percentage score here, e.g., 85%]
      
      ### 🌟 Key Strengths
      - [Bullet points indicating where the candidate aligns perfectly with the requirements]
      
      ### ⚠️ Gaps & Missing Skills
      - [Bullet points showing what requirements or skills are missing from the resume]
      
      ### 💡 Optimization Suggestions
      - [Actionable advice on how to tailor the resume for this specific role]
    `;

    // Call your Gemini API here (reusing your existing Gemini integration method)
    // Assuming you have a function or logic like model.generateContent(prompt)
    // For now, let's simulate or call your existing gemini instance:
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    res.json({
      status: 'success',
      matchAnalysis: analysisText
    });

  } catch (error) {
    console.error('Gemini Match Error:', error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to process AI matching analysis.'
    });
  }
});