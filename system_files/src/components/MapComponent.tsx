// MamaTrack GPS — Leaflet Map Component with GIS Heatmap & Geofence Support

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
  showHeatmap?: boolean;
  showDistrictGeofence?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
}

const MARKER_PATHS: Record<string, string> = {
  mother: '<circle cx="12" cy="7.5" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/>',
  driver: '<path d="M2 8.5h11v8H2z"/><path d="M13 11h4.2l2.8 3v2.5h-7z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="16.5" cy="18.5" r="1.8"/><path d="M7.5 10.5v3M6 12h3"/>',
  hospital: '<path d="M4 20V6.5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1V20"/><path d="M2.5 20h19"/><path d="M12 8.5v5M9.5 11h5"/>',
  emergency: '<path d="M12 3.2 21 19H3Z"/><path d="M12 9.5v4"/><path d="M12 16.4h.01"/>',
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
  showHeatmap = false,
  showDistrictGeofence = false,
  onMapClick
}) => {
  const { theme: appTheme } = useTheme();
  const theme = themeProp ?? appTheme;

  const [viewMode] = useState<'google' | 'satellite' | 'terrain'>('google');
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const heatmapGroupRef = useRef<L.LayerGroup | null>(null);
  const geofenceLayerRef = useRef<L.Polygon | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // 1. Initialize Map Object
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
    heatmapGroupRef.current = L.layerGroup().addTo(map);

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 600);

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

  // Handle map click events
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

  // Update Tile Layer
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
    mapRef.current.invalidateSize();
  }, [theme, viewMode]);

  // 2. Update Map view
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

  // 4. GIS Heatmap Density Layer (High-visibility multi-radius weighted density circles)
  useEffect(() => {
    if (!mapRef.current || !heatmapGroupRef.current) return;

    heatmapGroupRef.current.clearLayers();

    if (!showHeatmap) return;

    // Density clusters for Mukono sub-counties & emergency hotspots
    const emergencyHotspots = [
      { lat: 0.3536, lng: 32.7554, weight: 1.0, radius: 1200, label: 'Mukono Central Hotspot (PPH & Pre-eclampsia cluster)' },
      { lat: 0.3420, lng: 32.7680, weight: 0.85, radius: 1000, label: 'Goma Sub-county Cluster' },
      { lat: 0.3650, lng: 32.6910, weight: 0.7, radius: 900, label: 'Seeta / Nama Corridor' },
      { lat: 0.2980, lng: 32.8120, weight: 0.9, radius: 1400, label: 'Nama Rural District High-risk Zone' },
      { lat: 0.1450, lng: 32.8800, weight: 0.75, radius: 1600, label: 'Koome Islands Island Transport Delay Hotspot' }
    ];

    emergencyHotspots.forEach(h => {
      // Outer aura
      const aura = L.circle([h.lat, h.lng], {
        color: 'transparent',
        fillColor: '#ef4444',
        fillOpacity: 0.25 * h.weight,
        radius: h.radius,
        interactive: false
      });

      // Medium ring
      const mid = L.circle([h.lat, h.lng], {
        color: 'transparent',
        fillColor: '#f97316',
        fillOpacity: 0.35 * h.weight,
        radius: h.radius * 0.6,
        interactive: false
      });

      // Inner core
      const core = L.circle([h.lat, h.lng], {
        color: '#dc2626',
        weight: 1.5,
        fillColor: '#dc2626',
        fillOpacity: 0.55 * h.weight,
        radius: h.radius * 0.3
      }).bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong style="color: #b91c1c; font-size: 12px;">GIS Emergency Heatmap Hotspot</strong>
          <div style="font-size: 11px; margin-top: 2px;">${h.label}</div>
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Relative Density Index: ${(h.weight * 100).toFixed(0)}%</div>
        </div>
      `);

      heatmapGroupRef.current?.addLayer(aura);
      heatmapGroupRef.current?.addLayer(mid);
      heatmapGroupRef.current?.addLayer(core);
    });
  }, [showHeatmap]);

  // 5. Geofence Perimeter (Mukono District Operational Zone boundary)
  useEffect(() => {
    if (!mapRef.current) return;

    if (geofenceLayerRef.current) {
      geofenceLayerRef.current.remove();
      geofenceLayerRef.current = null;
    }

    if (showDistrictGeofence) {
      // Mukono District approx bounding coordinates
      const mukonoBoundaryCoords: [number, number][] = [
        [0.4200, 32.6500],
        [0.4400, 32.8200],
        [0.3200, 32.9200],
        [0.1000, 32.9500],
        [0.0800, 32.7800],
        [0.2500, 32.6600]
      ];

      const geofence = L.polygon(mukonoBoundaryCoords, {
        color: '#0284c7',
        weight: 2,
        dashArray: '6, 6',
        fillColor: '#38bdf8',
        fillOpacity: 0.06
      }).bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong style="color: #0369a1; font-size: 12px;">Mukono District Operational Geofence</strong>
          <div style="font-size: 11px; color: #475569;">GPS Emergency Tracking & Ambulances Zone</div>
        </div>
      `).addTo(mapRef.current);

      geofenceLayerRef.current = geofence;
    }
  }, [showDistrictGeofence]);

  // 6. Route Line (Polyline)
  const lastFittedRouteKey = useRef<string>('');
  const activeRouteCoordsRef = useRef<[number, number][]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline(routePoints, {
        color: '#f43f5e',
        weight: 5,
        opacity: 0.9,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(mapRef.current);
    }

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
        if (!res.ok) throw new Error('OSRM routing failed');
        const data = await res.json();

        if (!abortController.signal.aborted && data.routes && data.routes.length > 0 && mapRef.current && routeLineRef.current) {
          const osrmCoords = data.routes[0].geometry.coordinates;
          const roadPoints: [number, number][] = osrmCoords.map((c: [number, number]) => [c[1], c[0]]);

          routeLineRef.current.setLatLngs(roadPoints);
          activeRouteCoordsRef.current = roadPoints;
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
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

  // 7. Render Emergency distress radius circle
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

  // Invalidate map size
  const markersKey = useMemo(() => markers.map(m => `${m.id}-${m.lat}-${m.lng}`).join(','), [markers]);
  const routeKey = useMemo(() => routePoints.map(p => p.join(',')).join('|'), [routePoints]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [markersKey, routeKey, showHeatmap, showDistrictGeofence]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '350px' }}>
      <div 
        ref={mapContainerRef} 
        className={`map-container ${viewMode === 'satellite' ? 'satellite-mode' : ''}`} 
        style={{ width: '100%', height: '100%' }} 
      />

      {/* Official Map Watermark Badge */}
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
        <span>{showHeatmap ? 'Uganda MoH GIS Heatmap' : theme === 'dark' && viewMode === 'google' ? 'Dark GPS Map' : 'Google Maps'}</span>
      </div>
    </div>
  );
};
