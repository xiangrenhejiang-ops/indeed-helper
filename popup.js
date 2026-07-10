// 1. Trigger the hidden native file input when the custom button is clicked
document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('resume-file').click();
});

// 2. Listen for file changes and start the upload process once a file is selected
document.getElementById('resume-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const statusDiv = document.getElementById('status');
    // 💡 核心改动 1：获取我们在 popup.html 里新增的分析结果展示容器
    const resultDiv = document.getElementById('analysisResult');

    if (!file) return;

    // Optimistic UI update: notify user that uploading has started
    statusDiv.innerText = "Status: Uploading to server...";
    statusDiv.style.color = "#002ff7";
    if (resultDiv) resultDiv.innerText = "Processing and analyzing your resume with Gemini AI...";

    // 3. Construct Multipart Form Data
    const formData = new FormData();
    formData.append('resume', file);

    try {
        // 4. Send an asynchronous POST request to the local Node.js server
        const response = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        // 5. Render frontend UI based on the structured response from backend
        if (response.ok && data.status === 'success') {
            statusDiv.innerText = `✅ Loaded: ${data.fileName}`;
            statusDiv.style.color = "green";
            
            // 💡 核心改动 2：成功拿到后端返回的 analysis 报告后，直接更新到界面上
            if (resultDiv) {
                resultDiv.innerText = data.analysis;
            }
        } else {
            statusDiv.innerText = `❌ Failed: ${data.error || 'Unknown error'}`;
            statusDiv.style.color = "red";
            if (resultDiv) resultDiv.innerText = "Analysis failed. Please check backend log.";
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        statusDiv.innerText = "❌ Error: Cannot connect to backend server.";
        statusDiv.style.color = "red";
        if (resultDiv) resultDiv.innerText = "Failed to load response from backend server.";
    }
});