const fs = require('fs');
let admin = fs.readFileSync('c:/fresh_Aura/Frontend/adminDashboard.html', 'utf8');

const navItem = `          <button class="nav-item" data-section="about">
            <svg
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4" />
              <path d="M12 8h.01" />
            </svg>
            About
          </button>
        </nav>`;
admin = admin.replace('        </nav>', navItem);

const aboutSection = `          <!-- ABOUT SECTION -->
          <div class="section" id="section-about">
            <div class="panel">
              <div class="panel-header">
                <span class="panel-title">Edit About Page</span>
              </div>
              <div class="panel-body" style="padding: 20px;">
                <div class="field" style="margin-bottom: 20px;">
                  <label for="aboutContentInput">About Content (Paragraphs)</label>
                  <textarea id="aboutContentInput" rows="10" placeholder="Enter content for the about page..."></textarea>
                  <div class="field-hint">Use double line breaks to separate paragraphs.</div>
                </div>
                <div class="field" style="margin-bottom: 20px;">
                  <label for="aboutVideoInput">Video URL (e.g. assets/freshauraa__.mp4)</label>
                  <div style="display: flex; gap: 10px;">
                    <input id="aboutVideoInput" type="text" placeholder="assets/freshauraa__.mp4" style="flex: 1;" />
                    <input type="file" id="aboutVideoUpload" accept="video/*" style="display: none;" onchange="uploadAboutVideo()" />
                    <button class="btn btn-outline" onclick="document.getElementById('aboutVideoUpload').click()">Upload Video</button>
                  </div>
                </div>
                <button class="btn btn-gold" onclick="saveAbout()">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      </main>`;
admin = admin.replace('        </div>\r\n      </main>', aboutSection).replace('        </div>\n      </main>', aboutSection);

const metaObj = `        about: {
          title: "About Page",
          sub: "Edit content and video for the About Us page.",
        }
      };`;
admin = admin.replace('      };', metaObj);

const switchSectionJS = `        if (name === "contacts") loadContacts();
        if (name === "about") loadAbout();
      }`;
admin = admin.replace('        if (name === "contacts") loadContacts();\r\n      }', switchSectionJS).replace('        if (name === "contacts") loadContacts();\n      }', switchSectionJS);

const loadAboutJS = `      // ABOUT LOGIC
      async function loadAbout() {
        try {
          const res = await fetch(\`\${API}/about\`);
          if (!res.ok) throw new Error("Failed to load about data");
          const data = await res.json();
          document.getElementById('aboutContentInput').value = data.content || '';
          document.getElementById('aboutVideoInput').value = data.videoUrl || '';
        } catch (err) {
          showToast(err.message, "error");
        }
      }

      async function saveAbout() {
        const content = document.getElementById('aboutContentInput').value;
        const videoUrl = document.getElementById('aboutVideoInput').value;
        try {
          const res = await fetch(\`\${API}/about\`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${localStorage.getItem('token')}\`
            },
            body: JSON.stringify({ content, videoUrl })
          });
          if (!res.ok) throw new Error("Failed to save about data");
          showToast("About page updated successfully", "success");
        } catch (err) {
          showToast(err.message, "error");
        }
      }

      async function uploadAboutVideo() {
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
admin = admin.replace('      // INIT', loadAboutJS);

fs.writeFileSync('c:/fresh_Aura/Frontend/adminDashboard.html', admin);
console.log('Successfully updated adminDashboard.html');
