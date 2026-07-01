// MamaTrack GPS — Leaflet Map Component

import React, { useEffect, useRef } from 'react';
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
  interactive = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const circleRef = useRef<L.Circle | null>(null);

  // 1. Initialize Map Object (only once)
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

    // Clear and high-contrast standard OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapRef.current = map;
    markersGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 2. Update Map view on center coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView(center, mapRef.current.getZoom());
    }
  }, [center[0], center[1]]);

  // 3. Render and Update Markers
  useEffect(() => {
    if (!mapRef.current || !markersGroupRef.current) return;

    // Clear existing markers
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

    // Remove existing route
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }

    if (routePoints.length > 1) {
      const polyline = L.polyline(routePoints, {
        color: '#f43f5e', // rose color matching mother/emergency path
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineJoin: 'round'
      }).addTo(mapRef.current);
      
      routeLineRef.current = polyline;

      // Fit map bounds to show route path
      const bounds = L.latLngBounds(routePoints);
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [routePoints]);

  // 5. Render Emergency distress radius circle
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing circle
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
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [markers, routePoints]);

  return <div ref={mapContainerRef} className="map-container" style={{ width: '100%', height: '100%', minHeight: '350px' }} />;
};
