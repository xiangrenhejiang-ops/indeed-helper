// 1. Trigger the hidden native file input when the custom button is clicked
document.getElementById('upload-btn').addEventListener('click', () => {
    document.getElementById('resume-file').click();
});

// 2. Listen for file changes and start the upload process once a file is selected
document.getElementById('resume-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    const statusDiv = document.getElementById('status');
    
    if (!file) return;

    // Optimistic UI update: notify user that uploading has started
    statusDiv.innerText = "Status: Uploading to server...";
    statusDiv.style.color = "#002ff7";

    // 3. Construct Multipart Form Data
    const formData = new FormData();
    // ⚠️ The key 'resume' must match the backend's upload.single('resume') configuration
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
        } else {
            statusDiv.innerText = `❌ Failed: ${data.error || 'Unknown error'}`;
            statusDiv.style.color = "red";
        }
    } catch (error) {
        console.error('Fetch Error:', error);
        statusDiv.innerText = "❌ Error: Cannot connect to backend server.";
        statusDiv.style.color = "red";
    }
});