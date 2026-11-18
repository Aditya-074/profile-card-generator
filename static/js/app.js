/**
 * User Profile Card Generator - Client-side Controller
 * Focuses on capturing form input, dispatching HTTP POST requests,
 * inspecting client-server payloads, and rendering formatted cards dynamically.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // DOM References
  // -------------------------------------------------------------------------
  const profileForm = document.getElementById('profile-form');
  const inputName = document.getElementById('input-name');
  const inputRole = document.getElementById('input-role');
  const inputBio = document.getElementById('input-bio');
  const inputAvatar = document.getElementById('input-avatar');
  const inputLocation = document.getElementById('input-location');
  const inputEmail = document.getElementById('input-email');
  const inputSkills = document.getElementById('input-skills');
  const inputGithub = document.getElementById('input-github');
  const inputLinkedin = document.getElementById('input-linkedin');
  const inputTwitter = document.getElementById('input-twitter');
  const inputWebsite = document.getElementById('input-website');

  const bioCounter = document.getElementById('bio-counter');
  const generateBtn = document.getElementById('generate-btn');
  const resetBtn = document.getElementById('reset-btn');
  const randomAvatarBtn = document.getElementById('random-avatar-btn');
  const presetSelect = document.getElementById('preset-select');

  // Card DOM elements
  const profileCard = document.getElementById('profile-card');
  const cardPillRole = document.getElementById('card-pill-role');
  const cardAvatar = document.getElementById('card-avatar');
  const cardName = document.getElementById('card-name');
  const cardRole = document.getElementById('card-role');
  const cardBio = document.getElementById('card-bio');
  const cardLocationWrap = document.getElementById('card-location-wrap');
  const cardLocation = document.getElementById('card-location');
  const cardEmailWrap = document.getElementById('card-email-wrap');
  const cardEmail = document.getElementById('card-email');
  const cardSkills = document.getElementById('card-skills');
  const socialGithub = document.getElementById('social-github');
  const socialLinkedin = document.getElementById('social-linkedin');
  const socialTwitter = document.getElementById('social-twitter');
  const socialWebsite = document.getElementById('social-website');
  const cardStatGenerated = document.getElementById('card-stat-generated');
  const cardStatWords = document.getElementById('card-stat-words');
  const previewStatus = document.getElementById('preview-status');

  // Toolbar & Inspector
  const copyJsonBtn = document.getElementById('copy-json-btn');
  const copyHtmlBtn = document.getElementById('copy-html-btn');
  const printCardBtn = document.getElementById('print-card-btn');
  const toggleInspectorBtn = document.getElementById('toggle-inspector-btn');
  const inspectorDrawer = document.getElementById('inspector-drawer');
  const closeInspectorBtn = document.getElementById('close-inspector-btn');
  const clearInspectorBtn = document.getElementById('clear-inspector-btn');
  const inspectorLogs = document.getElementById('inspector-logs');

  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const toastContainer = document.getElementById('toast-container');

  // Active state data
  let currentCardData = null;
  let cachedPresets = [];

  // -------------------------------------------------------------------------
  // Theme Management (Light / Dark)
  // -------------------------------------------------------------------------
  const savedTheme = localStorage.getItem('profilecard_theme') || 'light';
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggleBtn.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('profilecard_theme', next);
    updateThemeIcon(next);
  });

  function updateThemeIcon(theme) {
    const iconSpan = themeToggleBtn.querySelector('.theme-icon');
    if (iconSpan) {
      iconSpan.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
  }

  // -------------------------------------------------------------------------
  // Live HTTP Inspector Logger
  // Gives reviewers immediate visual feedback on the POST request-response cycle
  // -------------------------------------------------------------------------
  function logHttpTransaction(method, url, requestPayload, statusCode, responsePayload) {
    const logItem = document.createElement('div');
    logItem.className = 'inspector-log-item';

    const timestamp = new Date().toLocaleTimeString();
    const statusClass = `log-status-${statusCode}`;

    logItem.innerHTML = `
      <div class="log-meta">
        <div>
          <span class="log-method">${method}</span>
          <span style="margin-left: 6px; font-weight: 500;">${escapeHtml(url)}</span>
        </div>
        <div>
          <span class="${statusClass}">HTTP ${statusCode}</span>
          <span style="color: var(--text-light); margin-left: 6px;">${timestamp}</span>
        </div>
      </div>
      <div class="log-details">
        <div><strong style="color:var(--text-muted)">Request Body (JSON):</strong> <pre>${escapeHtml(JSON.stringify(requestPayload, null, 2))}</pre></div>
        <div style="margin-top: 4px;"><strong style="color:var(--text-muted)">Response Body (JSON):</strong> <pre>${escapeHtml(JSON.stringify(responsePayload, null, 2))}</pre></div>
      </div>
    `;

    const emptyNotice = inspectorLogs.querySelector('.inspector-empty');
    if (emptyNotice) {
      emptyNotice.remove();
    }

    inspectorLogs.insertBefore(logItem, inspectorLogs.firstChild);

    while (inspectorLogs.children.length > 20) {
      inspectorLogs.removeChild(inspectorLogs.lastChild);
    }
  }

  toggleInspectorBtn.addEventListener('click', () => {
    inspectorDrawer.classList.toggle('open');
  });

  closeInspectorBtn.addEventListener('click', () => {
    inspectorDrawer.classList.remove('open');
  });

  clearInspectorBtn.addEventListener('click', () => {
    inspectorLogs.innerHTML = '<div class="inspector-empty">Waiting for POST requests...</div>';
  });

  // -------------------------------------------------------------------------
  // Form Submission -> POST Request -> Backend -> Card Render
  // -------------------------------------------------------------------------
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = inputName.value.trim();
    if (!name) {
      showToast('Please enter your full name.', 'error');
      inputName.focus();
      return;
    }

    const selectedThemeRadio = document.querySelector('input[name="theme"]:checked');
    const theme = selectedThemeRadio ? selectedThemeRadio.value : 'indigo';

    // Prepare JSON payload for the POST request
    const payload = {
      name: name,
      role: inputRole.value.trim(),
      bio: inputBio.value.trim(),
      avatar_url: inputAvatar.value.trim(),
      location: inputLocation.value.trim(),
      email: inputEmail.value.trim(),
      skills: inputSkills.value.trim(),
      github: inputGithub.value.trim(),
      linkedin: inputLinkedin.value.trim(),
      twitter: inputTwitter.value.trim(),
      website: inputWebsite.value.trim(),
      theme: theme,
    };

    setBtnLoading(generateBtn, true, 'Generating Card...');
    updatePreviewStatus('Processing POST...');

    try {
      // 🚀 Asynchronous HTTP POST request to Flask backend
      const response = await fetch('/api/profile/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Log transaction to HTTP Inspector
      logHttpTransaction('POST', '/api/profile/generate', payload, response.status, data);

      if (!response.ok) {
        throw new Error(data.error || `Server returned error status: ${response.status}`);
      }

      // Success: render the formatted card
      currentCardData = data.card;
      renderProfileCard(data.card);
      updatePreviewStatus('Card Updated');
      showToast('Profile card generated successfully!', 'success');
    } catch (err) {
      console.error('POST Error:', err);
      showToast(err.message || 'Failed to generate profile card', 'error');
      updatePreviewStatus('Error', true);
    } finally {
      setBtnLoading(generateBtn, false, '✨ Generate Profile Card (POST)');
    }
  });

  // -------------------------------------------------------------------------
  // Card Rendering Logic
  // -------------------------------------------------------------------------
  function renderProfileCard(card) {
    // Theme accent update
    const allowedThemes = ['indigo', 'emerald', 'sunset', 'violet', 'cyberpunk', 'rose'];
    allowedThemes.forEach(t => profileCard.classList.remove(`theme-${t}`));
    profileCard.classList.add(`theme-${card.theme || 'indigo'}`);
    profileCard.setAttribute('data-theme', card.theme || 'indigo');

    // Identity
    cardName.textContent = card.name || 'Anonymous';
    cardRole.textContent = card.role || '';
    cardPillRole.textContent = card.role ? card.role.split(' ')[0] : 'Profile';

    // Avatar with error fallback
    cardAvatar.onerror = function() {
      this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(card.name)}&background=4f46e5&color=ffffff&size=256&bold=true`;
    };
    cardAvatar.src = card.avatar_url;

    // Location
    if (card.location) {
      cardLocationWrap.style.display = 'flex';
      cardLocation.textContent = card.location;
    } else {
      cardLocationWrap.style.display = 'none';
    }

    // Email
    if (card.email) {
      cardEmailWrap.style.display = 'flex';
      cardEmail.textContent = card.email;
      cardEmail.href = `mailto:${card.email}`;
    } else {
      cardEmailWrap.style.display = 'none';
    }

    // Bio
    cardBio.textContent = card.bio || 'No bio provided.';

    // Skills
    cardSkills.innerHTML = '';
    if (card.skills && card.skills.length > 0) {
      card.skills.forEach(skill => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = skill;
        cardSkills.appendChild(chip);
      });
      cardSkills.parentElement.style.display = 'block';
    } else {
      cardSkills.parentElement.style.display = 'none';
    }

    // Social Links
    configureSocialButton(socialGithub, card.social?.github, 'GitHub');
    configureSocialButton(socialLinkedin, card.social?.linkedin, 'LinkedIn');
    configureSocialButton(socialTwitter, card.social?.twitter, 'Twitter');
    configureSocialButton(socialWebsite, card.social?.website, 'Portfolio');

    // Stats
    if (card.stats) {
      cardStatGenerated.textContent = `⚡ Processed: ${card.stats.generated_at || 'Just now'}`;
      cardStatWords.textContent = `${card.stats.bio_word_count || 0} words`;
    }

    // Trigger subtle entrance bounce
    profileCard.style.animation = 'none';
    void profileCard.offsetWidth; // trigger reflow
    profileCard.style.animation = 'cardFadeIn 0.3s ease-out';
  }

  function configureSocialButton(btnElement, url, label) {
    if (url) {
      btnElement.style.display = 'inline-flex';
      btnElement.href = url;
    } else {
      btnElement.style.display = 'none';
    }
  }

  // -------------------------------------------------------------------------
  // Preset Profiles Loader
  // -------------------------------------------------------------------------
  async function loadPresetProfiles() {
    try {
      const res = await fetch('/api/presets');
      const data = await res.json();
      if (data.success && data.presets) {
        cachedPresets = data.presets;
      }
    } catch (err) {
      console.warn('Could not fetch preset profiles:', err);
    }
  }

  presetSelect.addEventListener('change', (e) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const preset = cachedPresets.find(p => p.id === selectedId);
    if (!preset) return;

    // Populate form fields
    inputName.value = preset.name || '';
    inputRole.value = preset.role || '';
    inputBio.value = preset.bio || '';
    inputAvatar.value = preset.avatar_url || '';
    inputLocation.value = preset.location || '';
    inputEmail.value = preset.email || '';
    inputSkills.value = preset.skills || '';
    inputGithub.value = preset.github || '';
    inputLinkedin.value = preset.linkedin || '';
    inputTwitter.value = preset.twitter || '';
    inputWebsite.value = preset.website || '';

    // Select matching theme radio
    const themeRadio = document.querySelector(`input[name="theme"][value="${preset.theme}"]`);
    if (themeRadio) {
      themeRadio.checked = true;
    }

    updateBioCounter();
    showToast(`Loaded "${preset.name}" preset! Click Generate to submit POST.`, 'info');

    // Automatically trigger submission to showcase immediate flow
    generateBtn.click();
  });

  // -------------------------------------------------------------------------
  // Random Avatar Generator Helper
  // -------------------------------------------------------------------------
  const sampleAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  ];

  randomAvatarBtn.addEventListener('click', () => {
    const randomIndex = Math.floor(Math.random() * sampleAvatars.length);
    inputAvatar.value = sampleAvatars[randomIndex];
    showToast('Random avatar selected!', 'info');
  });

  // -------------------------------------------------------------------------
  // Form Utilities & Helpers
  // -------------------------------------------------------------------------
  function updateBioCounter() {
    const len = inputBio.value.length;
    bioCounter.textContent = `${len} / 400`;
  }

  inputBio.addEventListener('input', updateBioCounter);

  resetBtn.addEventListener('click', () => {
    profileForm.reset();
    presetSelect.value = '';
    updateBioCounter();
    const defaultTheme = document.querySelector('input[name="theme"][value="indigo"]');
    if (defaultTheme) defaultTheme.checked = true;
    showToast('Form cleared.', 'info');
  });

  // Copy JSON
  copyJsonBtn.addEventListener('click', () => {
    if (!currentCardData) {
      showToast('Generate a card first!', 'error');
      return;
    }
    navigator.clipboard.writeText(JSON.stringify(currentCardData, null, 2))
      .then(() => showToast('Card JSON copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy JSON', 'error'));
  });

  // Copy HTML
  copyHtmlBtn.addEventListener('click', () => {
    const cardHtml = profileCard.outerHTML;
    navigator.clipboard.writeText(cardHtml)
      .then(() => showToast('Card HTML copied to clipboard!', 'success'))
      .catch(() => showToast('Failed to copy HTML', 'error'));
  });

  // Print / PDF
  printCardBtn.addEventListener('click', () => {
    window.print();
  });

  function updatePreviewStatus(text, isError = false) {
    previewStatus.textContent = text;
    previewStatus.style.color = isError ? 'var(--danger)' : 'var(--success)';
    previewStatus.style.backgroundColor = isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)';
  }

  function setBtnLoading(btn, isLoading, labelText) {
    const spinner = btn.querySelector('.btn-spinner');
    const label = btn.querySelector('.btn-label');
    btn.disabled = isLoading;
    if (spinner) spinner.style.display = isLoading ? 'inline-block' : 'none';
    if (label) label.textContent = labelText;
  }

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';

    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  updateBioCounter();
  loadPresetProfiles();

  // Populate initial active card data from the default DOM representation
  currentCardData = {
    name: 'Aditya Sharma',
    role: 'Lead Full-Stack Developer',
    location: 'New Delhi, India',
    email: 'aditya@example.com',
    bio: cardBio.textContent.trim(),
    skills: ['Python', 'Flask', 'JavaScript', 'HTML/CSS', 'REST APIs', 'SQLite'],
    theme: 'indigo',
    avatar_url: cardAvatar.src,
  };
});
