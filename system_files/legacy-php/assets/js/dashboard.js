/**
 * MamaTrack GPS — Dashboard UI Utilities (dashboard.js)
 * Shared interface handlers for sidebar, modals, tab switching, and loading states
 */

const DashboardUI = (function () {
    
    /**
     * Set up dynamic tab switching in templates
     */
    function setupTabs() {
        document.querySelectorAll('.tab-item').forEach(button => {
            button.addEventListener('click', () => {
                const tabContainer = button.closest('.tab-nav').nextElementSibling;
                const targetTab = button.dataset.tab;
                
                // Toggle active buttons
                button.closest('.tab-nav').querySelectorAll('.tab-item').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                // Toggle active contents
                if (tabContainer) {
                    tabContainer.querySelectorAll('.tab-content').forEach(content => {
                        if (content.id === targetTab) {
                            content.classList.add('active');
                        } else {
                            content.classList.remove('active');
                        }
                    });
                }
            });
        });
    }

    /**
     * Show loading screen overlay
     */
    function showLoading(text = 'Loading system...') {
        let overlay = document.getElementById('global-loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'global-loading-overlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <div class="loading-text" id="global-loading-text">${text}</div>
            `;
            document.body.appendChild(overlay);
        } else {
            document.getElementById('global-loading-text').textContent = text;
            overlay.classList.remove('hidden');
        }
    }

    /**
     * Hide loading overlay
     */
    function hideLoading() {
        const overlay = document.getElementById('global-loading-overlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Setup custom modal behaviors
     */
    function setupModals() {
        // Close modal on click close or background click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal(overlay.id);
                }
            });
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const overlay = btn.closest('.modal-overlay');
                if (overlay) {
                    closeModal(overlay.id);
                }
            });
        });
    }

    /**
     * Open a modal dialog
     */
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden'; // prevent scrolling underneath
        }
    }

    /**
     * Close a modal dialog
     */
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    /**
     * Responsive Sidebar toggle
     */
    function setupSidebar() {
        const burgerBtn = document.querySelector('.hamburger-btn');
        const sidebar = document.querySelector('.sidebar');
        
        if (burgerBtn && sidebar) {
            burgerBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                sidebar.classList.toggle('open');
            });

            document.addEventListener('click', (e) => {
                if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== burgerBtn) {
                    sidebar.classList.remove('open');
                }
            });
        }
    }

    /**
     * Handle duty status toggle button events
     */
    function setupDutyToggle(roleApiUrl) {
        const dutyCheckbox = document.getElementById('duty-switch');
        if (dutyCheckbox) {
            dutyCheckbox.addEventListener('change', async () => {
                const isDuty = dutyCheckbox.checked;
                showLoading('Updating duty status...');
                try {
                    const res = await fetch(roleApiUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'toggle_duty', is_on_duty: isDuty })
                    });
                    const data = await res.json();
                    hideLoading();
                    if (data.success) {
                        const label = document.getElementById('duty-status-label');
                        if (label) label.textContent = isDuty ? 'ON DUTY' : 'OFF DUTY';
                        NotificationManager.show('Status Updated', `You are now ${isDuty ? 'online' : 'offline'}.`, 'success');
                    } else {
                        dutyCheckbox.checked = !isDuty; // revert on failure
                        NotificationManager.show('Error', data.error || 'Failed to update status', 'warning');
                    }
                } catch (e) {
                    hideLoading();
                    dutyCheckbox.checked = !isDuty; // revert
                    NotificationManager.show('Error', 'Connection failure', 'danger');
                }
            });
        }
    }

    /**
     * Set up dynamic avatar uploads + camera capture + delete
     */
    function setupAvatarUpload(uploadApiUrl) {
        // Create avatar action modal (photo options picker)
        function showAvatarOptions(uploadApiUrl) {
            // Remove any existing modal
            const existing = document.getElementById('avatar-options-modal');
            if (existing) existing.remove();

            const modal = document.createElement('div');
            modal.id = 'avatar-options-modal';
            modal.style.cssText = `
                position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(6px);
                display:flex; align-items:center; justify-content:center; z-index:9999;
                padding:16px;
            `;

            const hasAvatar = !!document.querySelector('.user-avatar img, .profile-avatar-large img');

            modal.innerHTML = `
                <div style="background:#fff; border-radius:20px; padding:24px; max-width:340px; width:100%; box-shadow:0 24px 64px rgba(0,0,0,0.2); font-family:Inter,sans-serif;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin:0;">Profile Photo</h3>
                        <button id="avatar-modal-close" style="background:#f1f5f9; border:none; border-radius:8px; width:32px; height:32px; cursor:pointer; font-size:1rem; color:#64748b;">&times;</button>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        <!-- Upload from gallery -->
                        <label style="display:flex; align-items:center; gap:14px; padding:14px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#f8fafc'">
                            <input type="file" id="avatar-gallery-input" accept="image/*" style="display:none;">
                            <span style="font-size:1.5rem;">🖼️</span>
                            <div>
                                <div style="font-weight:600; color:#0f172a; font-size:0.9rem;">Choose from Gallery</div>
                                <div style="font-size:0.75rem; color:#64748b;">Upload photo from your device</div>
                            </div>
                        </label>

                        <!-- Take photo with camera -->
                        <div id="avatar-webcam-trigger" style="display:flex; align-items:center; gap:14px; padding:14px 16px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; cursor:pointer; transition:background 0.15s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#f8fafc'">
                            <span style="font-size:1.5rem;">📷</span>
                            <div>
                                <div style="font-weight:600; color:#0f172a; font-size:0.9rem;">Take a Photo</div>
                                <div style="font-size:0.75rem; color:#64748b;">Use your device camera</div>
                            </div>
                        </div>

                        ${hasAvatar ? `
                        <!-- Remove photo -->
                        <button id="avatar-remove-btn" style="display:flex; align-items:center; gap:14px; padding:14px 16px; background:#fff5f5; border:1px solid #fee2e2; border-radius:12px; cursor:pointer; width:100%; text-align:left; transition:background 0.15s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#fff5f5'">
                            <span style="font-size:1.5rem;">🗑️</span>
                            <div>
                                <div style="font-weight:600; color:#ef4444; font-size:0.9rem;">Remove Photo</div>
                                <div style="font-size:0.75rem; color:#f87171;">Revert to default avatar</div>
                            </div>
                        </button>` : ''}
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            // Close modal
            modal.querySelector('#avatar-modal-close').addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            // Gallery upload
            modal.querySelector('#avatar-gallery-input').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) { modal.remove(); await uploadAvatarFile(uploadApiUrl, file); }
            });

            // Camera capture trigger
            modal.querySelector('#avatar-webcam-trigger').addEventListener('click', () => {
                startWebcamCapture(uploadApiUrl);
            });
        }

        // Live webcam overlay capture
        function startWebcamCapture(uploadApiUrl) {
            const modal = document.createElement('div');
            modal.id = 'webcam-capture-modal';
            modal.style.cssText = `
                position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px);
                display:flex; align-items:center; justify-content:center; z-index:10000;
                padding:16px;
            `;
            modal.innerHTML = `
                <div style="background:#fff; border-radius:20px; padding:24px; max-width:440px; width:100%; box-shadow:0 24px 64px rgba(0,0,0,0.3); font-family:Inter,sans-serif; text-align:center;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                        <h3 style="font-size:1.1rem; font-weight:700; color:#0f172a; margin:0;">Capture Profile Photo</h3>
                        <button id="webcam-modal-close" style="background:#f1f5f9; border:none; border-radius:8px; width:32px; height:32px; cursor:pointer; font-size:1rem; color:#64748b;">&times;</button>
                    </div>
                    <div style="position:relative; width:100%; aspect-ratio:1; background:#000; border-radius:12px; overflow:hidden; margin-bottom:20px;">
                        <video id="webcam-preview" autoplay playsinline style="width:100%; height:100%; object-fit:cover; transform:scaleX(-1);"></video>
                        <div id="webcam-loading" style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.9rem; background:#0f172a;">
                            <span>Starting camera...</span>
                        </div>
                    </div>
                    <div style="display:flex; gap:12px; justify-content:center;">
                        <button id="webcam-capture-btn" style="padding:12px 24px; background:#10b981; color:#fff; border:none; border-radius:12px; font-weight:600; cursor:pointer; font-size:0.95rem; display:flex; align-items:center; gap:8px; transition:transform 0.1s;" onmousedown="this.style.transform='scale(0.95)'" onmouseup="this.style.transform='scale(1)'" disabled>
                            <span>📸 Capture</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            const video = modal.querySelector('#webcam-preview');
            const captureBtn = modal.querySelector('#webcam-capture-btn');
            const loadingEl = modal.querySelector('#webcam-loading');
            let stream = null;

            navigator.mediaDevices.getUserMedia({
                video: { width: 480, height: 480, facingMode: 'user' },
                audio: false
            })
            .then(s => {
                stream = s;
                video.srcObject = s;
                video.onloadedmetadata = () => {
                    loadingEl.style.display = 'none';
                    captureBtn.removeAttribute('disabled');
                };
            })
            .catch(err => {
                console.error('Webcam stream failed:', err);
                loadingEl.innerHTML = `<span style="color:#f87171; padding: 12px;">Camera access denied or unavailable: ${err.message}</span>`;
            });

            const stopStreamAndRemove = () => {
                if (stream) {
                    stream.getTracks().forEach(track => track.stop());
                }
                modal.remove();
            };

            modal.querySelector('#webcam-modal-close').addEventListener('click', stopStreamAndRemove);
            modal.addEventListener('click', (e) => { if (e.target === modal) stopStreamAndRemove(); });

            captureBtn.addEventListener('click', () => {
                const width = video.videoWidth || 480;
                const height = video.videoHeight || 480;
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, width, height);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        const file = new File([blob], 'webcam_avatar.png', { type: 'image/png' });
                        stopStreamAndRemove();
                        
                        const optModal = document.getElementById('avatar-options-modal');
                        if (optModal) optModal.remove();
                        
                        await uploadAvatarFile(uploadApiUrl, file);
                    }
                }, 'image/png');
            });

            // Remove photo
            const removeBtn = modal.querySelector('#avatar-remove-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', async () => {
                    modal.remove();
                    const avatarEl = document.querySelector('.user-avatar, .profile-avatar-large');
                    await deleteAvatar(uploadApiUrl, avatarEl);
                });
            }
        }

        // Override all file inputs to show the options modal instead
        document.querySelectorAll('.avatar-file-input').forEach(input => {
            const parentLabel = input.closest('label');
            if (parentLabel) {
                parentLabel.addEventListener('click', (e) => {
                    e.preventDefault();
                    showAvatarOptions(uploadApiUrl);
                });
            }
        });

        // Click on any avatar area (not label) shows options
        document.querySelectorAll('.user-avatar, .profile-avatar-large').forEach(avatarEl => {
            avatarEl.addEventListener('click', (e) => {
                const parentLabel = avatarEl.closest('label');
                if (!parentLabel) {
                    e.preventDefault();
                    showAvatarOptions(uploadApiUrl);
                }
            });

            // Right-click still shows context menu if has image
            avatarEl.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                showAvatarOptions(uploadApiUrl);
            });
        });

        // Click on any dynamic delete button triggers the options modal
        document.querySelectorAll('.avatar-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const avatarEl = document.querySelector('.user-avatar, .profile-avatar-large');
                await deleteAvatar(uploadApiUrl, avatarEl);
            });
        });
    }

    /**
     * Upload an avatar file (from gallery or camera)
     */
    async function uploadAvatarFile(uploadApiUrl, file) {
        const formData = new FormData();
        formData.append('avatar', file);

        showLoading('Uploading profile photo...');
        try {
            const res = await fetch(uploadApiUrl, { method: 'POST', body: formData });
            const data = await res.json();
            hideLoading();

            if (data.success) {
                // Update all avatar elements
                document.querySelectorAll('.user-avatar, .profile-avatar-large').forEach(container => {
                    container.innerHTML = `<img src="../uploads/avatars/${data.avatar}" alt="Avatar" style="width:100%; height:100%; object-fit:cover; border-radius:50%;">`;
                    container.style.background = 'none';
                });
                // Show remove buttons
                document.querySelectorAll('.avatar-delete-btn').forEach(btn => {
                    btn.style.display = 'inline-block';
                });
                NotificationManager.show('Success', 'Profile photo updated successfully.', 'success');
            } else {
                NotificationManager.show('Error', data.error || 'Upload failed', 'warning');
            }
        } catch (e) {
            hideLoading();
            NotificationManager.show('Error', 'Connection failed', 'danger');
        }
    }

    /**
     * Delete current profile avatar
     */
    async function deleteAvatar(uploadApiUrl, avatarEl) {
        if (!confirm('Remove your profile picture?')) return;
        showLoading('Removing profile picture...');
        try {
            const res = await fetch(uploadApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'delete_avatar' })
            });
            const data = await res.json();
            hideLoading();
            if (data.success) {
                // Reset all avatar containers to initials/emoji
                document.querySelectorAll('.user-avatar, .profile-avatar-large').forEach(el => {
                    const img = el.querySelector('img');
                    if (img) img.remove();
                });
                // Hide any remove buttons/icons
                document.querySelectorAll('.avatar-delete-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
                NotificationManager.show('Done', 'Profile picture removed.', 'success');
            } else {
                NotificationManager.show('Error', data.error || 'Could not remove picture.', 'danger');
            }
        } catch (e) {
            hideLoading();
            NotificationManager.show('Error', 'Connection failed', 'danger');
        }
    }



    return {
        setupTabs,
        showLoading,
        hideLoading,
        setupModals,
        openModal,
        closeModal,
        setupSidebar,
        setupDutyToggle,
        setupAvatarUpload
    };
})();

// Automatic setups
document.addEventListener('DOMContentLoaded', () => {
    DashboardUI.setupTabs();
    DashboardUI.setupModals();
    DashboardUI.setupSidebar();
    DashboardUI.setupAvatarUpload('../api/profile_upload.php');
});
