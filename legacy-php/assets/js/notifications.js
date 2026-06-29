/**
 * MamaTrack GPS — Notifications & Toast Alerts (notifications.js)
 * Real-time notification banners, web notifications, and audio warnings.
 */

const NotificationManager = (function () {
    let container = null;
    let alarmSound = null;

    /**
     * Initialize notification container
     */
    function init() {
        if (document.getElementById('global-toast-container')) {
            container = document.getElementById('global-toast-container');
            return;
        }
        container = document.createElement('div');
        container.id = 'global-toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);

        // Preload emergency notification sound
        alarmSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav'); // siren/beep sound
        alarmSound.loop = true;
    }

    /**
     * Show a toast alert on the screen
     */
    function show(title, message, type = 'success', duration = 8000) {
        if (!container) init();

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const icons = {
            success: '✅',
            warning: '⚠️',
            danger: '🆘',
            emergency: '🚨',
            info: 'ℹ️'
        };
        const icon = icons[type] || '🔔';

        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">&times;</button>
        `;

        container.appendChild(toast);

        // Bind close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            removeToast(toast);
        });

        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                removeToast(toast);
            }, duration);
        }

        // Trigger request permission for push notify if supported
        requestBrowserPermission();

        // Show push notification if browser permits and window is hidden
        if (Notification.permission === 'granted' && document.hidden) {
            new Notification(title, {
                body: message,
                icon: '../assets/images/logo.png'
            });
        }

        return toast;
    }

    /**
     * Smoothly fade out and remove a toast
     */
    function removeToast(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Start sirens for emergency situations
     */
    function startAlarm() {
        if (alarmSound) {
            alarmSound.play().catch(e => console.log('Audio autoplay prevented. Interaction required first.', e));
        }
    }

    /**
     * Stop sirens
     */
    function stopAlarm() {
        if (alarmSound) {
            alarmSound.pause();
            alarmSound.currentTime = 0;
        }
    }

    /**
     * Request browser notification permission
     */
    function requestBrowserPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }

    /**
     * Poll the server for new notifications
     */
    function pollNotifications(onNewNotification, interval = 10000) {
        setInterval(async () => {
            try {
                const res = await fetch('../api/notifications.php?action=unread');
                const data = await res.json();
                if (data.notifications && data.notifications.length > 0) {
                    data.notifications.forEach(n => {
                        const type = n.type === 'emergency' ? 'danger' : 'info';
                        show(n.title, n.message, type);
                        
                        // Mark as read
                        fetch('../api/notifications.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'read', id: n.id })
                        });

                        if (onNewNotification) onNewNotification(n);
                    });
                }
            } catch (err) {
                console.warn('Notification poll failed:', err);
            }
        }, interval);
    }

    return {
        init,
        show,
        startAlarm,
        stopAlarm,
        pollNotifications,
        requestBrowserPermission
    };
})();

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    NotificationManager.init();
});
