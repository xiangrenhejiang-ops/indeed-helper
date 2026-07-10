# Indeed AI Helper 🚀

A Chrome extension designed to help job seekers automatically analyze resumes and match them with Indeed job postings using Gemini AI.

---

## 🛠️ Project Progress

### Week 1 & 2: Project Setup & Local PDF Uploads
- Initialized the Chrome extension boilerplate with manifest.json.
- Set up a local backend server using Node.js, Express, and Multer to handle file uploads.
- Integrated pdf-parse-fork to smoothly extract text from local resume PDFs.

### Week 3: End-to-End Pipeline & Gemini Paid Tier Integration (Current)
- **Resolved Gemini API 503 Errors**: Addressed frequent server deadlocks and rate limits under the Free Tier by linking a billing account in Google AI Studio to activate Paid Tier (high-priority access). API requests now process instantly without congestion.
- **Frontend UI Dynamic Rendering**: Refactored popup.html and popup.js. Users can now upload their resumes and see the live Gemini analysis report (Core Skills, Project Highlights, and Actionable Suggestions) render directly inside the extension popup.

---

## 📅 Next Steps (Week 4)
We will dive straight into core feature expansions: implementing web scraping on Indeed job description pages. This will allow the AI to cross-reference the candidate's resume with specific job requirements and calculate automated matching scores.

---

## 🚀 How to Run Locally

### 1. Backend Server

# Install dependencies
npm install

# Start the server
node server.js


### 2. Chrome Extension
1. Open Chrome and navigate to chrome://extensions/
2. Enable Developer mode (top right switcher).
3. Click Load unpacked and select this project folder.