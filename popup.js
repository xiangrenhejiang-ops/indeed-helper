// Trigger the hidden file input when the styled button is clicked
document.getElementById('upload-btn').addEventListener('click', () => {
  document.getElementById('resume-file').click();
});

let cachedResumeText = ""; // Cache the parsed resume text in memory

// --- Restore saved data when the popup opens ---
document.addEventListener('DOMContentLoaded', () => {
  const statusDiv = document.getElementById('status');
  const resultDiv = document.getElementById('analysisResult');

  chrome.storage.local.get(['resumeText', 'fileName', 'lastAnalysisHtml'], (result) => {
    // 1. Restore Resume Status
    if (result.resumeText && result.fileName) {
      cachedResumeText = result.resumeText;
      statusDiv.innerHTML = `🟢 <strong>Loaded:</strong> ${result.fileName}`;
      statusDiv.style.color = "#16a34a";
    }
    
    // 2. Restore Last Match Analysis HTML
    if (result.lastAnalysisHtml) {
      resultDiv.innerHTML = result.lastAnalysisHtml;
    }
  });
});

// Handle file selection and parsing
document.getElementById('resume-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const statusDiv = document.getElementById('status');
  statusDiv.innerText = "⏳ Reading PDF...";
  statusDiv.style.color = "#2563eb";

  const formData = new FormData();
  formData.append('resume', file);

  try {
    const response = await fetch('http://localhost:3000/api/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (response.ok && data.status === 'success') {
      cachedResumeText = data.analysis;
      statusDiv.innerHTML = `🟢 <strong>Loaded:</strong> ${data.fileName}`;
      statusDiv.style.color = "#16a34a";

      // Save resume data to local storage
      chrome.storage.local.set({ 
        resumeText: data.analysis, 
        fileName: data.fileName 
      });

    } else {
      statusDiv.innerText = `❌ Error: ${data.error || 'Upload failed'}`;
      statusDiv.style.color = "#dc2626";
    }
  } catch (error) {
    console.error('Fetch Error:', error);
    statusDiv.innerText = "❌ Error: Cannot connect to backend server.";
    statusDiv.style.color = "#dc2626";
  }
});

// Trigger matching analysis
document.getElementById('match-btn').addEventListener('click', async () => {
  const resultDiv = document.getElementById('analysisResult');
  const statusDiv = document.getElementById('status');

  if (!cachedResumeText) {
    alert("Please select and upload your resume PDF first!");
    return;
  }

  resultDiv.innerHTML = `<div class="empty-state">⏳ Scraping job details and asking Gemini...</div>`;

  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const activeTab = tabs[0];
    if (!activeTab) {
      resultDiv.innerHTML = `<div class="empty-state" style="color:#dc2626;">No active window found.</div>`;
      return;
    }

    chrome.tabs.sendMessage(activeTab.id, { action: "scrapeJob" }, async (response) => {
      if (chrome.runtime.lastError) {
        resultDiv.innerHTML = `
          <div class="empty-state" style="color:#dc2626; text-align:left;">
            <strong>Injection Error:</strong> Cannot access this page. <br><br>
            Please refresh the job page and make sure you are on LinkedIn or Indeed.
          </div>`;
        return;
      }

      if (!response || !response.success) {
        resultDiv.innerHTML = `<div class="empty-state" style="color:#dc2626;">${response?.error || 'Failed to scrape job content.'}</div>`;
        return;
      }

      const { title, description } = response.data;
      statusDiv.innerHTML = `🚀 Scraped! Analyzing match for ${title.substring(0, 20)}...`;
      statusDiv.style.color = "#2563eb";

      try {
        const matchResponse = await fetch('http://localhost:3000/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobTitle: title,
            jobDescription: description,
            resumeText: cachedResumeText
          })
        });

        const matchData = await matchResponse.json();

        if (matchResponse.ok && matchData.status === 'success') {
          statusDiv.innerHTML = `🟢 Match analysis completed!`;
          statusDiv.style.color = "#16a34a";

          let rawText = matchData.matchAnalysis;
          let scoreMatch = rawText.match(/Score:\s*(\d+)%/i);
          let scoreHeaderHtml = "";
          
          if (scoreMatch) {
            let score = parseInt(scoreMatch[1]);
            let badgeColor = score >= 75 ? '#dcfce7' : (score >= 40 ? '#fef9c3' : '#fee2e2');
            let textColor = score >= 75 ? '#16a34a' : (score >= 40 ? '#ca8a04' : '#dc2626');
            
            scoreHeaderHtml = `
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; border-bottom:1px solid #f1f5f9; padding-bottom:12px;">
                <span style="font-weight:700; font-size:14px; color:#0f172a;">Match Report</span>
                <span class="score-badge" style="background-color:${badgeColor}; color:${textColor};">${score}% Match</span>
              </div>
            `;
          }

          let formatted = rawText
            .replace(/###\s*(?:🎯\s*)?Match\s*Score:.*?\n/gi, '')
            .replace(/###\s*([^#\n\r]+)/g, '<div class="section-title">$1</div>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/^\s*[-*]\s*(.+)$/gm, '<div class="bullet-item">• $1</div>')
            .replace(/---\s*/g, '');

          const finalHtml = `
            <div style="text-align: left;">
              ${scoreHeaderHtml}
              <div style="max-height: 280px; overflow-y: auto; padding-right: 4px;">
                ${formatted}
              </div>
            </div>
          `;

          resultDiv.innerHTML = finalHtml;

          // Save the formatted report HTML to local storage
          chrome.storage.local.set({ lastAnalysisHtml: finalHtml });
          
        } else {
          resultDiv.innerHTML = `<div class="empty-state" style="color:#dc2626;">Error from AI: ${matchData.error}</div>`;
        }
      } catch (err) {
        console.error(err);
        resultDiv.innerHTML = `<div class="empty-state" style="color:#dc2626;">Failed to communicate with matching API.</div>`;
      }
    });
  });
});