const uploadBtn = document.getElementById('upload-btn');
const matchBtn = document.getElementById('match-btn');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('analysisResult');
const fileInput = document.getElementById('resume-file');

let cachedResumeText = "";

uploadBtn.addEventListener('click', () => {
  fileInput.click();
});

document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get(['resumeText', 'fileName', 'lastAnalysisHtml'], (result) => {
    if (result.resumeText && result.fileName) {
      cachedResumeText = result.resumeText;
      statusDiv.innerHTML = `🟢 <strong>Loaded:</strong> ${result.fileName}`;
      statusDiv.style.color = "#16a34a";
      matchBtn.disabled = false;
    }
    if (result.lastAnalysisHtml) {
      resultDiv.innerHTML = result.lastAnalysisHtml;
    }
  });
});

fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  matchBtn.disabled = true;
  matchBtn.innerText = "⏳ Parsing Resume...";
  statusDiv.innerText = "⏳ Reading PDF & Parsing...";
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

      await chrome.storage.local.set({ 
        resumeText: data.analysis, 
        fileName: data.fileName 
      });

      matchBtn.disabled = false;
      matchBtn.innerText = "⚡ Analyze Job Match";
    } else {
      statusDiv.innerText = `❌ Error: ${data.error || 'Upload failed'}`;
      statusDiv.style.color = "#dc2626";
      matchBtn.innerText = "⚡ Analyze Job Match";
    }
  } catch (error) {
    console.error(error);
    statusDiv.innerText = "❌ Error: Cannot connect to backend server.";
    statusDiv.style.color = "#dc2626";
    matchBtn.innerText = "⚡ Analyze Job Match";
  }
});

function sendMessageWithRetry(tabId, message, retries = 5, delay = 200) {
  return new Promise((resolve) => {
    function attempt() {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if ((chrome.runtime.lastError || !response) && retries > 0) {
          retries--;
          setTimeout(attempt, delay);
        } else {
          resolve(response);
        }
      });
    }
    attempt();
  });
}

matchBtn.addEventListener('click', async () => {
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

    const response = await sendMessageWithRetry(activeTab.id, { action: "scrapeJob" });

    if (!response || !response.success) {
      resultDiv.innerHTML = `<div class="empty-state" style="color:#dc2626;">${response?.error || 'Job description not found.'}</div>`;
      return;
    }

    const { title, description } = response.data;
    statusDiv.innerHTML = `🚀 Scraped! Analyzing match for ${title.substring(0, 25)}...`;
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