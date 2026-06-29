/**
 * MamaTrack GPS — Emergency Logic (emergency.js)
 * Handles triggering, tracking, and dispatching emergencies
 */

const EmergencyManager = (function () {
    let activeEmergency = null;
    let statusPollInterval = null;
    let locationSendInterval = null;

    /**
     * Trigger a new emergency from the mother's portal
     * @param {Object} options - { lat, lng, notes, requireCemonc }
     */
    async function trigger(options = {}) {
        const payload = {
            action: 'trigger',
            latitude: options.lat,
            longitude: options.lng,
            notes: options.notes || '',
            require_cemonc: options.requireCemonc || false,
        };

        try {
            const res = await fetch('../api/emergency.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (data.success) {
                activeEmergency = data.emergency;
                startStatusPolling(data.emergency.id);
                startLocationSending(data.emergency.id);
            }
            return data;
        } catch (err) {
            return { error: 'Network error. Please try again.' };
        }
    }

    /**
     * Cancel an active emergency
     */
    async function cancel(emergencyId, reason = '') {
        stopPolling();
        try {
            const res = await fetch('../api/emergency.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'cancel', emergency_id: emergencyId, reason }),
            });
            return await res.json();
        } catch (err) {
            return { error: 'Network error.' };
        }
    }

    /**
     * Admin: dispatch ambulance & doctor to an emergency
     */
    async function dispatch(emergencyId, driverId, hospitalId, doctorId) {
        try {
            const res = await fetch('../api/emergency.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'dispatch',
                    emergency_id: emergencyId,
                    driver_id: driverId,
                    hospital_id: hospitalId,
                    doctor_id: doctorId,
                }),
            });
            return await res.json();
        } catch (err) {
            return { error: 'Network error.' };
        }
    }

    /**
     * Driver: update trip status
     */
    async function updateStatus(emergencyId, status) {
        try {
            const res = await fetch('../api/emergency.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_status', emergency_id: emergencyId, status }),
            });
            return await res.json();
        } catch (err) {
            return { error: 'Network error.' };
        }
    }

    /**
     * Get emergency details
     */
    async function getDetails(emergencyId) {
        try {
            const res = await fetch(`../api/emergency.php?id=${emergencyId}`);
            return await res.json();
        } catch (err) {
            return { error: 'Network error.' };
        }
    }

    /**
     * List emergencies (admin/doctor)
     */
    async function list(filters = {}) {
        const params = new URLSearchParams(filters).toString();
        try {
            const res = await fetch(`../api/emergency.php?${params}`);
            return await res.json();
        } catch (err) {
            return { error: 'Network error.' };
        }
    }

    /**
     * Start polling for emergency status updates
     */
    function startStatusPolling(emergencyId, onUpdate) {
        stopPolling();
        statusPollInterval = setInterval(async () => {
            const data = await getDetails(emergencyId);
            if (data.emergency) {
                activeEmergency = data.emergency;
                if (onUpdate) onUpdate(data.emergency);
                updateStatusUI(data.emergency);
                if (['completed', 'cancelled'].includes(data.emergency.status)) {
                    stopPolling();
                }
            }
        }, 10000); // poll every 10 seconds
    }

    /**
     * Start sending GPS location updates
     */
    function startLocationSending(emergencyId) {
        if (!navigator.geolocation) return;
        locationSendInterval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                await fetch('../api/location.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        emergency_id: emergencyId,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                    }),
                });
            }, null, { enableHighAccuracy: true, timeout: 10000 });
        }, 15000); // every 15 seconds
    }

    /**
     * Stop all polling/sending intervals
     */
    function stopPolling() {
        if (statusPollInterval) { clearInterval(statusPollInterval); statusPollInterval = null; }
        if (locationSendInterval) { clearInterval(locationSendInterval); locationSendInterval = null; }
    }

    /**
     * Update the status tracker UI (mother portal)
     */
    function updateStatusUI(emergency) {
        const statusMap = {
            pending: 0,
            verified: 1,
            dispatched: 2,
            en_route: 3,
            arrived: 4,
            completed: 5,
        };
        const currentStep = statusMap[emergency.status] ?? 0;
        document.querySelectorAll('.status-step').forEach((el, i) => {
            el.classList.remove('completed', 'active');
            if (i < currentStep) el.classList.add('completed');
            else if (i === currentStep) el.classList.add('active');
        });

        // Update ETA display
        const etaEl = document.getElementById('eta-display');
        if (etaEl && emergency.eta_minutes) {
            etaEl.textContent = emergency.eta_minutes + ' min';
        }

        // Update driver info
        if (emergency.driver_name) {
            const driverEl = document.getElementById('driver-name');
            if (driverEl) driverEl.textContent = emergency.driver_name;
        }
    }

    /**
     * Calculate ETA string from minutes
     */
    function formatETA(minutes) {
        if (!minutes) return 'Calculating...';
        if (minutes < 60) return `${minutes} min`;
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}h ${m}m`;
    }

    /**
     * Get status badge HTML
     */
    function getStatusBadge(status) {
        const map = {
            pending: ['⏳ Pending', 'badge-amber'],
            verified: ['✅ Verified', 'badge-blue'],
            dispatched: ['🚑 Dispatched', 'badge-purple'],
            en_route: ['🛣️ En Route', 'badge-amber'],
            arrived: ['📍 Arrived', 'badge-blue'],
            completed: ['✅ Completed', 'badge-green'],
            cancelled: ['❌ Cancelled', 'badge-red'],
        };
        const [label, cls] = map[status] || ['Unknown', 'badge-gray'];
        return `<span class="badge ${cls}">${label}</span>`;
    }

    return {
        trigger, cancel, dispatch, updateStatus,
        getDetails, list, startStatusPolling, stopPolling,
        formatETA, getStatusBadge,
        get active() { return activeEmergency; },
    };
})();

if (typeof module !== 'undefined') module.exports = EmergencyManager;
