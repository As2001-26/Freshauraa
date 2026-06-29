const fs = require('fs');

let admin = fs.readFileSync('c:/fresh_Aura/Frontend/adminDashboard.html', 'utf8');
let deleted = fs.readFileSync('c:/fresh_Aura/Frontend/deleted_lines.txt', 'utf8');

let newUploadUI = `                <div class="field" style="margin-bottom: 20px;">
                  <label for="aboutVideoInput">Video URL (e.g. assets/freshauraa__.mp4)</label>
                  <div style="display: flex; gap: 10px;">
                    <input id="aboutVideoInput" type="text" placeholder="assets/freshauraa__.mp4" style="flex: 1;" />
                    <input type="file" id="aboutVideoUpload" accept="video/*" style="display: none;" onchange="uploadAboutVideo()" />
                    <button class="btn btn-outline" onclick="document.getElementById('aboutVideoUpload').click()">Upload Video</button>
                  </div>
                </div>`;

let newUploadJS = `      async function uploadAboutVideo() {
        const fileInput = document.getElementById('aboutVideoUpload');
        const file = fileInput.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('video', file);

        try {
          showToast("Uploading video...", "info");
          const res = await fetch(\`\${API}/about/upload\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${localStorage.getItem('token')}\`
            },
            body: formData
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Upload failed");
          
          document.getElementById('aboutVideoInput').value = data.fileUrl;
          showToast("Video uploaded successfully", "success");
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          fileInput.value = '';
        }
      }

      // INIT`;

deleted = deleted.replace(/<div class="field" style="margin-bottom: 20px;">\s*<label for="aboutVideoInput">Video URL.*?<\/div>/s, newUploadUI);
deleted = deleted.replace('// INIT', newUploadJS);

let parts = admin.split('<span class="panel-title">Edit About Page</span>');
if (parts.length === 2) {
    let secondPartParts = parts[1].split('// INIT');
    let afterInit = secondPartParts.length > 1 ? secondPartParts[1] : '';
    let newAdmin = parts[0] + '<span class="panel-title">Edit About Page</span>\n' + deleted + '\n      const savedSection' + afterInit.split('const savedSection')[1];
    fs.writeFileSync('c:/fresh_Aura/Frontend/adminDashboard.html', newAdmin);
    console.log('Fixed adminDashboard.html');
} else {
    console.log('Could not find split point');
}
