// MamaTrack GPS — Leaflet Map Component (High Performance & Reliable Tile Load)

import React, { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

// Marker icon generator using Emojis and styled HTML divs for maximum reliability
const getMarkerIcon = (type: MapMarker['type']) => {
  let emoji = '📍';
  let color = 'linear-gradient(135deg, #3b82f6, #1d4ed8)'; // primary blue

  if (type === 'mother') {
    emoji = '🤰';
    color = 'linear-gradient(135deg, #ec4899, #be123c)'; // pink/rose
  } else if (type === 'driver') {
    emoji = '🚑';
    color = 'linear-gradient(135deg, #f59e0b, #b45309)'; // amber/yellow
  } else if (type === 'hospital') {
    emoji = '🏥';
    color = 'linear-gradient(135deg, #10b981, #047857)'; // green/emerald
  } else if (type === 'emergency') {
    emoji = '🚨';
    color = 'linear-gradient(135deg, #ef4444, #b91c1c)'; // critical red
  }

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
      font-size: 1.25rem;
      animation: ${type === 'emergency' ? 'pulse-marker 1.5s infinite alternate' : 'none'};
      position: relative;
    ">${emoji}</div>
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
  theme = 'light',
  onMapClick
}) => {
  const [viewMode, setViewMode] = useState<'google' | 'satellite' | 'terrain'>('google');
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

  // 4. Render and Update Route line (Polyline)
  useEffect(() => {
    if (!mapRef.current) return;

    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routePoints.length > 1) {
      // Immediately render straight line polyline for instant responsiveness
      const fallbackPolyline = L.polyline(routePoints, {
        color: '#f43f5e',
        weight: 5,
        opacity: 0.85,
        lineJoin: 'round'
      }).addTo(mapRef.current);
      routeLineRef.current = fallbackPolyline;

      let active = true;

      const fetchRoadRoute = async () => {
        try {
          const coordsString = routePoints.map(p => `${p[1]},${p[0]}`).join(';');
          const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson`;

          const res = await fetch(url);
          if (!res.ok) throw new Error('OSRM routing request failed');
          const data = await res.json();

          if (active && data.routes && data.routes.length > 0 && mapRef.current) {
            const osrmCoords = data.routes[0].geometry.coordinates;
            const roadPoints: [number, number][] = osrmCoords.map((c: any) => [c[1], c[0]]);

            if (routeLineRef.current) {
              routeLineRef.current.remove();
            }

            const polyline = L.polyline(roadPoints, {
              color: '#f43f5e',
              weight: 5,
              opacity: 0.9,
              lineJoin: 'round'
            }).addTo(mapRef.current);

            routeLineRef.current = polyline;

            const bounds = L.latLngBounds(roadPoints);
            mapRef.current.fitBounds(bounds, { padding: [30, 30] });
          }
        } catch (e) {
          console.warn('MapComponent: OSRM routing fallback active.', e);
        }
      };

      fetchRoadRoute();

      return () => {
        active = false;
      };
    }
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
