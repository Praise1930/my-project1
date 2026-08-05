/**
 * MamaTrack GPS — Map Utilities (map.js)
 * Leaflet.js powered mapping for all dashboards
 */

const MapManager = (function () {
    let map = null;
    let markers = {};
    let routeLayer = null;
    let locationWatcher = null;
    let currentLocationMarker = null;

    // Bright tile layer (Standard OpenStreetMap) — shows road labels clearly with high contrast
    const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    const TILE_URL_FALLBACK = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Mukono District center
    const MUKONO_CENTER = [0.3535, 32.7550];
    const DEFAULT_ZOOM = 12;

    /**
     * Initialize the Leaflet map in a container element
     */
    function init(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        map = L.map(containerId, {
            center: options.center || MUKONO_CENTER,
            zoom: options.zoom || DEFAULT_ZOOM,
            zoomControl: false,
            attributionControl: true,
        });

        L.tileLayer(TILE_URL, {
            attribution: TILE_ATTR,
            subdomains: 'abc',
            maxZoom: 19,
            errorTileUrl: TILE_URL_FALLBACK,
        }).addTo(map);

        // Custom zoom control position
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        // Scale
        L.control.scale({ position: 'bottomleft', imperial: false }).addTo(map);

        return map;
    }

    /**
     * Create custom SVG marker icon
     */
    function createIcon(type) {
        const icons = {
            mother: { color: '#f472b6', emoji: '🤰', size: 36 },
            hospital: { color: '#3b82f6', emoji: '🏥', size: 32 },
            ambulance: { color: '#f59e0b', emoji: '🚑', size: 34 },
            doctor: { color: '#a855f7', emoji: '👨‍⚕️', size: 32 },
            driver: { color: '#22c55e', emoji: '🚗', size: 32 },
            emergency: { color: '#ef4444', emoji: '🆘', size: 40 },
            user: { color: '#60a5fa', emoji: '📍', size: 32 },
        };
        const cfg = icons[type] || icons.user;
        const html = `
            <div style="
                width:${cfg.size}px; height:${cfg.size}px;
                background:${cfg.color}20;
                border:2px solid ${cfg.color};
                border-radius:50%;
                display:flex; align-items:center; justify-content:center;
                font-size:${cfg.size * 0.5}px;
                box-shadow: 0 0 12px ${cfg.color}50;
                backdrop-filter: blur(6px);
            ">${cfg.emoji}</div>`;
        return L.divIcon({
            html,
            iconSize: [cfg.size, cfg.size],
            iconAnchor: [cfg.size / 2, cfg.size / 2],
            className: 'custom-marker',
        });
    }

    /**
     * Add or update a marker on the map
     */
    function setMarker(id, lat, lng, type, popupContent = '') {
        if (!map) return;
        if (markers[id]) {
            markers[id].setLatLng([lat, lng]);
            if (popupContent) markers[id].setPopupContent(popupContent);
        } else {
            const marker = L.marker([lat, lng], { icon: createIcon(type) }).addTo(map);
            if (popupContent) {
                marker.bindPopup(popupContent, { maxWidth: 280 });
            }
            markers[id] = marker;
        }
        return markers[id];
    }

    /**
     * Remove a marker by ID
     */
    function removeMarker(id) {
        if (markers[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    }

    /**
     * Draw a route between two coordinates using OSRM
     */
    async function drawRoute(fromLat, fromLng, toLat, toLng) {
        try {
            const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`;
            const response = await fetch(url);
            const data = await response.json();
            if (data.routes && data.routes[0]) {
                if (routeLayer) map.removeLayer(routeLayer);
                routeLayer = L.geoJSON(data.routes[0].geometry, {
                    style: {
                        color: '#3b82f6',
                        weight: 4,
                        opacity: 0.8,
                        dashArray: '10, 5',
                    },
                }).addTo(map);
                const bounds = routeLayer.getBounds();
                map.fitBounds(bounds, { padding: [40, 40] });
                return data.routes[0];
            }
        } catch (err) {
            console.warn('Route fetch failed, drawing straight line:', err);
            drawStraightLine(fromLat, fromLng, toLat, toLng);
        }
    }

    /**
     * Fallback: draw straight line between two points
     */
    function drawStraightLine(lat1, lng1, lat2, lng2) {
        if (routeLayer) map.removeLayer(routeLayer);
        routeLayer = L.polyline([[lat1, lng1], [lat2, lng2]], {
            color: '#f59e0b',
            weight: 3,
            dashArray: '8, 8',
            opacity: 0.7,
        }).addTo(map);
    }

    /**
     * Clear the current route
     */
    function clearRoute() {
        if (routeLayer) {
            map.removeLayer(routeLayer);
            routeLayer = null;
        }
    }

    /**
     * Start watching the user's live location
     */
    function startLocationWatch(onLocation, onError) {
        if (!navigator.geolocation) {
            if (onError) onError('Geolocation not supported');
            return;
        }
        locationWatcher = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng, accuracy } = pos.coords;
                updateCurrentLocation(lat, lng);
                if (onLocation) onLocation(lat, lng, accuracy);
            },
            (err) => {
                console.warn('Geolocation error:', err);
                if (onError) onError(err.message);
            },
            { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
        );
    }

    /**
     * Stop watching location
     */
    function stopLocationWatch() {
        if (locationWatcher !== null) {
            navigator.geolocation.clearWatch(locationWatcher);
            locationWatcher = null;
        }
    }

    /**
     * Update current-location marker (blue pulsing dot)
     */
    function updateCurrentLocation(lat, lng) {
        if (!map) return;
        const html = `
            <div style="position:relative; width:20px; height:20px;">
                <div style="position:absolute;inset:-8px;border-radius:50%;background:rgba(59,130,246,0.15);animation:pulseRing 2s ease infinite;"></div>
                <div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 10px rgba(59,130,246,0.5);"></div>
            </div>`;
        const icon = L.divIcon({ html, iconSize: [20, 20], iconAnchor: [10, 10], className: '' });
        if (currentLocationMarker) {
            currentLocationMarker.setLatLng([lat, lng]);
        } else {
            currentLocationMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 }).addTo(map);
        }
        // Add CSS animation if not already present
        if (!document.getElementById('pulseRingStyle')) {
            const style = document.createElement('style');
            style.id = 'pulseRingStyle';
            style.textContent = `@keyframes pulseRing { 0%{transform:scale(1);opacity:1} 100%{transform:scale(3);opacity:0} }`;
            document.head.appendChild(style);
        }
    }

    /**
     * Get a single GPS fix (one-time)
     */
    function getCurrentPosition() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) return reject('Geolocation not supported');
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
                (err) => reject(err.message),
                { enableHighAccuracy: true, timeout: 15000 }
            );
        });
    }

    /**
     * Center map on given coordinates
     */
    function flyTo(lat, lng, zoom = 15) {
        if (map) map.flyTo([lat, lng], zoom, { duration: 1.5 });
    }

    /**
     * Load all hospitals from API and add markers
     */
    async function loadHospitals() {
        try {
            const res = await fetch('../api/hospitals.php');
            const data = await res.json();
            if (data.hospitals) {
                data.hospitals.forEach(h => {
                    const popup = `
                        <div style="font-family:Inter,sans-serif;">
                            <strong style="color:#60a5fa;">🏥 ${h.name}</strong><br>
                            <span style="color:#94a3b8;font-size:0.75rem;">${h.facility_type}</span><br>
                            <span style="font-size:0.75rem;">Beds: ${h.available_beds}/${h.total_beds}</span>
                            ${h.has_cemonc ? '<br><span style="color:#4ade80;font-size:0.75rem;">✅ CEmONC</span>' : ''}
                        </div>`;
                    setMarker('hospital_' + h.id, h.latitude, h.longitude, 'hospital', popup);
                });
            }
        } catch (e) {
            console.error('Failed to load hospitals:', e);
        }
    }

    /**
     * Add emergency pulse circle to map
     */
    function addEmergencyCircle(lat, lng, radius = 500) {
        return L.circle([lat, lng], {
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.08,
            weight: 2,
            dashArray: '6, 6',
            radius,
        }).addTo(map);
    }

    return {
        init, setMarker, removeMarker, drawRoute, clearRoute,
        startLocationWatch, stopLocationWatch, getCurrentPosition,
        flyTo, loadHospitals, addEmergencyCircle, updateCurrentLocation,
        get instance() { return map; },
        MUKONO_CENTER,
    };
})();

// Export for module-aware environments
if (typeof module !== 'undefined') module.exports = MapManager;
