// MamaTrack GPS — Leaflet Map Component (High Performance & Reliable Tile Load)

import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../contexts/ThemeContext';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  type: 'mother' | 'driver' | 'hospital' | 'emergency';
  label: string;
  sublabel?: string;
}

interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  routePoints?: [number, number][]; // [lat, lng] array
  emergencyCircle?: { lat: number; lng: number; radius: number } | null;
  interactive?: boolean;
  theme?: 'light' | 'dark';
  onMapClick?: (lat: number, lng: number) => void;
}

// Marker glyphs, drawn as inline SVG rather than emoji. Leaflet builds markers
// from an HTML string, so the icon has to be markup rather than a component.
// Emoji were unusable here: each platform draws its own cartoon, they cannot be
// recoloured against the marker fill, and they sit off-centre in the disc.
const MARKER_PATHS: Record<string, string> = {
  // expectant mother — person
  mother: '<circle cx="12" cy="7.5" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  // ambulance — van with a cross
  driver: '<path d="M2 8.5h11v8H2z"/><path d="M13 11h4.2l2.8 3v2.5h-7z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="16.5" cy="18.5" r="1.8"/><path d="M7.5 10.5v3M6 12h3"/>',
  // health facility — building with a cross
  hospital: '<path d="M4 20V6.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V20"/><path d="M2.5 20h19"/><path d="M12 8.5v5M9.5 11h5"/>',
  // emergency — alert
  emergency: '<path d="M12 3.2 21 19H3Z"/><path d="M12 9.5v4"/><path d="M12 16.4h.01"/>',
  // fallback — map pin
  default: '<path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z"/><circle cx="12" cy="10" r="2.4"/>',
};

const getMarkerIcon = (type: MapMarker['type']) => {
  const palette: Record<string, string> = {
    mother: 'linear-gradient(135deg, #ec4899, #be123c)',
    driver: 'linear-gradient(135deg, #f59e0b, #b45309)',
    hospital: 'linear-gradient(135deg, #10b981, #047857)',
    emergency: 'linear-gradient(135deg, #ef4444, #b91c1c)',
  };
  const color = palette[type] || 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
  const glyph = MARKER_PATHS[type] || MARKER_PATHS.default;

  const svg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="#ffffff" stroke-width="1.9" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">${glyph}</svg>`;

  return L.divIcon({
    html: `<div style="
      background: ${color};
      width: 38px;
      height: 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      border: 2px solid #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
      animation: ${type === 'emergency' ? 'pulse-marker 1.5s infinite alternate' : 'none'};
      position: relative;
    ">${svg}</div>
    <style>
      @keyframes pulse-marker {
        0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
        100% { transform: scale(1.15); box-shadow: 0 0 15px 5px rgba(239, 68, 68, 0); }
      }
    </style>`,
    className: 'custom-map-marker',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -19]
  });
};

export const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom = 13,
  markers = [],
  routePoints = [],
  emergencyCircle = null,
  interactive = true,
  theme: themeProp,
  onMapClick
}) => {
  // Fall back to the application theme rather than a hard-coded 'light'. Seven
  // of the eight maps never passed this prop, which left them on the light
  // basemap while the dashboard around them went dark.
  const { theme: appTheme } = useTheme();
  const theme = themeProp ?? appTheme;

  const [viewMode] = useState<'google' | 'satellite' | 'terrain'>('google');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Initialize Map Object (only once on mount)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: interactive,
      dragging: interactive,
      touchZoom: interactive,
      scrollWheelZoom: false,
    });

    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);

    // Multiple staggered size invalidation timers to ensure complete tile rendering on all viewports
    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

    // ResizeObserver for container changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      resizeObserver.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle map click events for interactive location picking
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    };

    if (onMapClick) {
      map.on('click', handleClick);
    }

    return () => {
      map.off('click', handleClick);
    };
  }, [onMapClick]);

  // Update Tile Layer dynamically when theme or viewMode changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (tileLayerRef.current) {
      tileLayerRef.current.remove();
    }

    let tileUrl = 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';
    let attribution = '&copy; Google Maps &mdash; Map data &copy; Google';

    if (viewMode === 'satellite') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=s,h&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Satellite &mdash; Imagery &copy; Google';
    } else if (viewMode === 'terrain') {
      tileUrl = 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}';
      attribution = '&copy; Google Maps Terrain &mdash; Map data &copy; Google';
    } else if (theme === 'dark') {
      // CartoDB Dark Matter tile layer for dark mode UI integration
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';
    }

    const tileLayer = L.tileLayer(tileUrl, {
      attribution: attribution,
      maxZoom: 20,
      maxNativeZoom: 19,
      subdomains: theme === 'dark' && viewMode === 'google' ? ['a', 'b', 'c', 'd'] : ['mt0', 'mt1', 'mt2', 'mt3']
    }).addTo(mapRef.current);

    tileLayerRef.current = tileLayer;

    // Immediately trigger size invalidation after tile swap
    mapRef.current.invalidateSize();
  }, [theme, viewMode]);


  // 2. Update Map view on center coordinates change
  const centerLat = center[0];
  const centerLng = center[1];
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([centerLat, centerLng], mapRef.current.getZoom());
    }
  }, [centerLat, centerLng]);

  // 3. Render and Update Markers
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    markersGroupRef.current.clearLayers();

    markers.forEach(m => {
      const markerIcon = getMarkerIcon(m.type);
      const marker = L.marker([m.lat, m.lng], { icon: markerIcon })
        .bindPopup(`
          <div style="font-family: 'Inter', sans-serif; padding: 4px;">
            <strong style="font-size: 0.9rem; display: block; margin-bottom: 2px;">${m.label}</strong>
            ${m.sublabel ? `<span style="font-size: 0.75rem; color: #64748b;">${m.sublabel}</span>` : ''}
          </div>
        `);
      markersGroupRef.current?.addLayer(marker);
    });
  }, [markers]);

  const lastFittedRouteKey = useRef<string>('');
  const activeRouteCoordsRef = useRef<[number, number][]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 4. Render and Update Route line (Polyline) — Stable, Single Route without flickering or alternate jumping
  useEffect(() => {
    if (!mapRef.current) return;

    if (!routePoints || routePoints.length < 2) {
      if (routeLineRef.current) {
        routeLineRef.current.remove();
        routeLineRef.current = null;
      }
      activeRouteCoordsRef.current = [];
      lastFittedRouteKey.current = '';
      return;
    }

    const start = routePoints[0];
    const end = routePoints[routePoints.length - 1];
    const routeIdentifier = `${start[0].toFixed(3)},${start[1].toFixed(3)}->${end[0].toFixed(3)},${end[1].toFixed(3)}`;

    // Cancel any previous in-flight OSRM request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    // Ensure polyline layer exists on map
    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints, {
        color: '#f43f5e',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(mapRef.current);
    }

    // Only fit map view once when a new route is first established
    if (lastFittedRouteKey.current !== routeIdentifier) {
      lastFittedRouteKey.current = routeIdentifier;
      const bounds = L.latLngBounds(routePoints);
      mapRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }

    const fetchRoadRoute = async () => {
      try {
        const coordsString = `${start[1]},${start[0]};${end[1]},${end[0]}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=false&alternatives=false`;

        const res = await fetch(url, { signal: abortController.signal });
        if (!res.ok) throw new Error('OSRM routing request failed');
        const data = await res.json();

        if (!abortController.signal.aborted && data.routes && data.routes.length > 0 && mapRef.current && routeLineRef.current) {
          const osrmCoords = data.routes[0].geometry.coordinates;
          const roadPoints: [number, number][] = osrmCoords.map((c: [number, number]) => [c[1], c[0]]);

          // Smoothly update the single existing polyline coordinates without removing/recreating layers
          routeLineRef.current.setLatLngs(roadPoints);
          activeRouteCoordsRef.current = roadPoints;
        }
      } catch (e: any) {
        if (e.name !== 'AbortError') {
          // If offline or OSRM fails, gracefully keep the direct connection polyline
          if (routeLineRef.current) {
            routeLineRef.current.setLatLngs(routePoints);
          }
        }
      }
    };

    fetchRoadRoute();

    return () => {
      abortController.abort();
    };
  }, [routePoints]);

  // 5. Render Emergency distress radius circle
  useEffect(() => {
    if (!mapRef.current) return;

    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }

    if (emergencyCircle) {
      const circle = L.circle([emergencyCircle.lat, emergencyCircle.lng], {
        color: '#f43f5e',
        fillColor: '#f43f5e',
        fillOpacity: 0.15,
        radius: emergencyCircle.radius,
        weight: 1.5
      }).addTo(mapRef.current);

      circleRef.current = circle;
    }
  }, [emergencyCircle]);

  // 6. Invalidate map size on window/render updates to prevent rendering glitches
  const markersKey = useMemo(() => markers.map(m => `${m.id}-${m.lat}-${m.lng}`).join(','), [markers]);
  const routeKey = useMemo(() => routePoints.map(p => p.join(',')).join('|'), [routePoints]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [markersKey, routeKey]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '350px' }}>
      <div 
        ref={mapContainerRef} 
        className={`map-container ${viewMode === 'satellite' ? 'satellite-mode' : ''}`} 
        style={{ width: '100%', height: '100%' }} 
      />

      {/* Official Google Maps Watermark Badge */}
      <div style={{
        position: 'absolute',
        bottom: '10px',
        left: '10px',
        zIndex: 1000,
        background: theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.92)',
        padding: '4px 10px',
        borderRadius: '6px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: theme === 'dark' ? '#60a5fa' : '#1a73e8',
        border: theme === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0',
        pointerEvents: 'none'
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#ea4335"/>
        </svg>
        <span>{theme === 'dark' && viewMode === 'google' ? 'Dark GPS Map' : 'Google Maps'}</span>
      </div>
    </div>
  );
};
