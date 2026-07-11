# AI Copilot Partner 🚀

An advanced, privacy-first Chrome Extension that automates job description scraping from major career platforms and conducts cross-reference matching analysis against your resume using the Gemini 1.5 Flash API.

---

## ✨ Features

- **Cross-Platform Scraping**: Robust, dynamic content injection supporting both **LinkedIn** (including complex dual-pane split layouts) and **Indeed**.
- **Resilient Fallback Pipeline**: Built-in substring fallback mechanics that scan full-page text context based on structural keywords, ensuring maximum structural uptime.
- **State Persistence (`chrome.storage`)**: The extension intelligently caches your parsed resume and the latest match report html natively within the browser, mitigating repetitive uploads and reducing redundant API quota overhead.
- **Premium UI/UX Rendering**: A sleek, modern custom markdown parser built using native Javascript regex to deliver responsive, dynamically-themed result badges (Green/Yellow/Red) mirroring candidate compatibility thresholds.

---

## 🛠️ Tech Stack

- **Frontend**: Chrome Extension Manifest V3, HTML5, Vanilla JavaScript, CSS3
- **Backend**: Node.js, Express.js
- **AI Engine**: Google Gemini API (`gemini-1.5-flash`)
- **Parsers**: `pdf-parse` for local file processing

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Node.js installed, and obtain an API key from Google AI Studio.

### 2. Backend Setup
1. Clone this repository and navigate to the root directory:
   cd indeed-helper
2. Install the server dependencies:
   npm install
3. Create a .env file in the root directory and add your Gemini API Key:
   GEMINI_API_KEY=your_actual_api_key_here
4. Fire up the local server:
   node server.js
   *The server will initialize and begin listening on http://localhost:3000.*

### 3. Chrome Extension Installation
1. Fire up Google Chrome and navigate to chrome://extensions/.
2. Toggle on Developer mode in the top-right corner.
3. Click Load unpacked Boston in the top-left corner.
4. Select the project directory (indeed-helper) that houses your manifest.json.

---

## 🎯 How to Use

1. Click on the AI Copilot Partner extension icon from your toolbar.
2. Hit 📁 Select Resume PDF to parse and persistently upload your resume into the local storage ecosystem.
3. Browse to any specific job description view on LinkedIn or Indeed.
4. Click ⚡ Analyze Job Match to view your dynamically-compiled, tailored compatibility report instantly!