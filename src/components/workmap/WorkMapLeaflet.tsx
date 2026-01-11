import { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapFilters } from "@/pages/WorkMap";
import { JobMarker } from "@/hooks/useVehicleData";
import { Loader2 } from "lucide-react";

declare module "leaflet" {
  function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      radius?: number;
      blur?: number;
      maxZoom?: number;
      max?: number;
      minOpacity?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

interface WorkMapLeafletProps {
  filters: MapFilters;
  jobs: JobMarker[];
  heatmapPoints: [number, number, number][];
}

interface JobCluster {
  key: string; // miasto or miasto-district for Wrocław
  miasto: string;
  district?: string;
  lat: number;
  lng: number;
  jobs: JobMarker[];
  hasUrgent: boolean;
}

// Województwo dolnośląskie - centered on Wrocław area
const DOLNOSLASKIE_CENTER: L.LatLngTuple = [51.1, 17.0];
const DEFAULT_ZOOM = 9;
const MIN_ZOOM = 9; // Prevents zooming out to see voivodeship names
const PRECISE_SPLIT_ZOOM = 15;

// Custom SVG markers

function createJobIcon(urgent: boolean = false) {
  const color = urgent ? "#ef4444" : "#8b5cf6";
  const size = urgent ? 36 : 32;
  
  return L.divIcon({
    className: "job-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
    html: `
      <div class="job-marker-wrapper" style="width: ${size}px; height: ${size}px;">
        ${urgent ? '<div class="job-pulse" style="background: #ef4444;"></div>' : ''}
        <div class="job-pin" style="background: ${color};">
          <svg viewBox="0 0 24 24" fill="white" width="${size * 0.5}" height="${size * 0.5}">
            <path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"/>
          </svg>
        </div>
      </div>
    `,
  });
}

function createClusterIcon(count: number, hasUrgent: boolean) {
  const size = Math.min(60, 40 + count * 2);
  // Cluster color: warm amber for clusters, red pulse only if urgent
  const clusterColor = "#f59e0b"; // Amber/warm yellow for clusters
  
  return L.divIcon({
    className: "cluster-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
    html: `
      <div class="cluster-marker-wrapper" style="width: ${size}px; height: ${size}px;">
        ${hasUrgent ? '<div class="cluster-pulse" style="background: #ef4444;"></div>' : ''}
        <div class="cluster-core" style="background: linear-gradient(135deg, ${clusterColor}, ${clusterColor}dd); width: ${size}px; height: ${size}px;">
          <span class="cluster-count">${count}</span>
        </div>
      </div>
    `,
  });
}

export function WorkMapLeaflet({ 
  filters, 
  jobs,
  heatmapPoints 
}: WorkMapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);
  const jobMarkersRef = useRef<L.Marker[]>([]);
  const clusterMarkersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);

  // Separate jobs into two groups:
  // 1. preciseJobs - have street-level geocoded coords, show as individual markers when zoomed
  // 2. clusteredJobs - no precise location, stay grouped by city forever
  const { preciseJobs, clustersByCity } = useMemo(() => {
    const shouldShowPrecise = currentZoom >= PRECISE_SPLIT_ZOOM;
    
    const precise: JobMarker[] = [];
    const clusters: Record<string, JobCluster> = {};
    
    jobs.forEach(job => {
      // Jobs with precise location (street geocoded) split off when zoomed
      if (job.hasPreciseLocation && shouldShowPrecise) {
        precise.push(job);
      } else {
        // Jobs without precise location stay clustered.
        // For Wrocław we cluster by district to avoid "all Wrocław jobs" collapsing into one marker.
        const miastoLower = job.miasto.toLowerCase();
        const districtLower = (job.district ?? "").toLowerCase();
        const key = miastoLower === "wrocław" ? `${miastoLower}::${districtLower}` : miastoLower;

        if (!clusters[key]) {
          clusters[key] = {
            key,
            miasto: job.miasto,
            district: job.district,
            lat: job.lat,
            lng: job.lng,
            jobs: [],
            hasUrgent: false,
          };
        }

        clusters[key].jobs.push(job);
        if (job.urgent) {
          clusters[key].hasUrgent = true;
        }

        // Calculate average position for cluster
        const totalLat = clusters[key].jobs.reduce((sum, j) => sum + j.lat, 0);
        const totalLng = clusters[key].jobs.reduce((sum, j) => sum + j.lng, 0);
        clusters[key].lat = totalLat / clusters[key].jobs.length;
        clusters[key].lng = totalLng / clusters[key].jobs.length;
      }
    });
    
    return { 
      preciseJobs: precise, 
      clustersByCity: Object.values(clusters) 
    };
  }, [jobs, currentZoom]);

  // Initialize map constrained to dolnośląskie only
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Bounds for Dolnośląskie voivodeship with padding
    const dolnoslaskieBounds = L.latLngBounds(
      [50.10, 14.80], // SW corner - extended west and south
      [51.85, 17.95]  // NE corner - extended east and north
    );

    const map = L.map(mapContainerRef.current, {
      center: DOLNOSLASKIE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      minZoom: MIN_ZOOM,
      maxZoom: 18,
      maxBounds: dolnoslaskieBounds,
      maxBoundsViscosity: 1.0, // Hard boundary - cannot pan outside
      attributionControl: false,
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
    }).addTo(map);

    // Add minimal attribution (required by OSM and CARTO licenses)
    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | <a href="https://carto.com/attributions">CARTO</a>').addTo(map);

    // Track zoom level changes
    map.on('zoomend', () => {
      setCurrentZoom(map.getZoom());
    });

    mapRef.current = map;
    setIsLoaded(true);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update heatmap layer
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (filters.showHeatmap && heatmapPoints.length > 0) {
      const radius = 15 + (filters.intensity / 100) * 25;
      
      const heatLayer = L.heatLayer(heatmapPoints, {
        radius,
        blur: 20,
        maxZoom: 17,
        max: 1.0,
        minOpacity: 0.3,
        gradient: {
          0.2: "#3b82f6",
          0.4: "#22d3ee",
          0.6: "#fbbf24",
          0.8: "#f97316",
          1.0: "#ef4444",
        },
      });

      heatLayer.addTo(mapRef.current);
      heatLayerRef.current = heatLayer;
    }
  }, [filters.showHeatmap, filters.intensity, heatmapPoints, isLoaded]);


  // Update job markers - precise jobs as individual markers, rest as clusters
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;

    // Clear existing markers
    jobMarkersRef.current.forEach(marker => marker.remove());
    jobMarkersRef.current = [];
    clusterMarkersRef.current.forEach(marker => marker.remove());
    clusterMarkersRef.current = [];

    // 1. Add individual markers for precise jobs (when zoomed in)
    preciseJobs.forEach(job => {
      const icon = createJobIcon(job.urgent);
      const marker = L.marker([job.lat, job.lng], { 
        icon,
        zIndexOffset: 350, // Higher than clusters
      });
      
      marker.bindPopup(`
        <div class="job-popup">
          <div class="job-popup-header">
            <span class="job-title">${job.title}</span>
            ${job.urgent ? '<span class="job-urgent-badge">PILNE</span>' : ''}
          </div>
          <div class="job-popup-content">
            <div class="job-popup-row">
              <span class="label">Lokalizacja:</span>
              <span class="value">${job.miasto}${job.district ? `, ${job.district}` : ''}</span>
            </div>
            ${job.category ? `
              <div class="job-popup-row">
                <span class="label">Kategoria:</span>
                <span class="value">${job.category}</span>
              </div>
            ` : ''}
            ${job.budget ? `
              <div class="job-popup-row">
                <span class="label">Budżet:</span>
                <span class="value">${job.budget} zł</span>
              </div>
            ` : ''}
          </div>
          <a href="/jobs/${job.id}" class="job-popup-link">Zobacz szczegóły →</a>
        </div>
      `, { minWidth: 220, maxWidth: 280 });
      
      marker.addTo(mapRef.current!);
      jobMarkersRef.current.push(marker);
    });

    // 2. Add cluster markers for jobs without precise location
    clustersByCity.forEach(cluster => {
      if (cluster.jobs.length === 0) return;
      
      if (cluster.jobs.length === 1) {
        // Single job in cluster - show regular marker
        const job = cluster.jobs[0];
        const icon = createJobIcon(job.urgent);
        const marker = L.marker([job.lat, job.lng], { 
          icon,
          zIndexOffset: 300,
        });
        
        marker.bindPopup(`
          <div class="job-popup">
            <div class="job-popup-header">
              <span class="job-title">${job.title}</span>
              ${job.urgent ? '<span class="job-urgent-badge">PILNE</span>' : ''}
            </div>
            <div class="job-popup-content">
              <div class="job-popup-row">
                <span class="label">Lokalizacja:</span>
                <span class="value">${job.miasto}${job.district ? `, ${job.district}` : ''}</span>
              </div>
              ${job.category ? `
                <div class="job-popup-row">
                  <span class="label">Kategoria:</span>
                  <span class="value">${job.category}</span>
                </div>
              ` : ''}
              ${job.budget ? `
                <div class="job-popup-row">
                  <span class="label">Budżet:</span>
                  <span class="value">${job.budget} zł</span>
                </div>
              ` : ''}
            </div>
            <a href="/jobs/${job.id}" class="job-popup-link">Zobacz szczegóły →</a>
          </div>
        `, { minWidth: 220, maxWidth: 280 });
        
        marker.addTo(mapRef.current!);
        clusterMarkersRef.current.push(marker);
      } else {
        // Multiple jobs without precise location - show cluster marker
        const icon = createClusterIcon(cluster.jobs.length, cluster.hasUrgent);
        const marker = L.marker([cluster.lat, cluster.lng], { 
          icon,
          zIndexOffset: 400,
        });
        
        // Show ALL jobs in scrollable list
        const jobListHtml = cluster.jobs
          .map(job => `
            <a href="/jobs/${job.id}" class="cluster-job-item">
              <div class="cluster-job-title">
                <span class="job-type-dot ${job.urgent ? 'urgent' : 'regular'}"></span>
                ${job.title}
              </div>
              <div class="cluster-job-meta">
                ${job.district ? `<span class="cluster-job-district">${job.district}</span>` : ''}
                ${job.category ? `<span>${job.category}</span>` : ''}
                ${job.budget ? `<span>${job.budget} zł</span>` : ''}
              </div>
            </a>
          `).join('');
        
        // Hint: these jobs don't have precise locations
        const hintText = "Oferty bez podanego adresu (tylko miasto/dzielnica)";
        
        marker.bindPopup(`
          <div class="cluster-popup">
            <div class="cluster-popup-header">
              <strong>${cluster.miasto}${cluster.district ? ` • ${cluster.district}` : ""}</strong>
              <span class="cluster-job-count">${cluster.jobs.length} ${cluster.jobs.length === 1 ? 'oferta' : cluster.jobs.length < 5 ? 'oferty' : 'ofert'}</span>
            </div>
            <div class="cluster-job-list">
              ${jobListHtml}
            </div>
            <div class="cluster-popup-hint">
              ${hintText}
            </div>
          </div>
        `, { minWidth: 280, maxWidth: 340, maxHeight: 400 });
        
        marker.addTo(mapRef.current!);
        clusterMarkersRef.current.push(marker);
      }
    });
  }, [preciseJobs, clustersByCity, currentZoom, isLoaded]);


  return (
    <div className="relative z-0">
      <div 
        ref={mapContainerRef} 
        className="w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden z-0"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Ładowanie mapy...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/50 text-xs">
        <div className="font-medium mb-2">Legenda</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-violet-500"></div>
            <span>Oferty pracy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Pilne oferty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-[10px] text-white font-bold">3</div>
            <span>Klaster ofert (kliknij)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Pojazdy MPK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-500 to-red-500"></div>
            <span>Hotspoty</span>
          </div>
        </div>
      </div>

      {/* Job count badge - positioned to avoid zoom controls */}
      {jobs.length > 0 && (
        <div className="absolute top-4 right-4 bg-violet-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-20">
          {jobs.length} {jobs.length === 1 ? 'oferta' : jobs.length < 5 ? 'oferty' : 'ofert'} na mapie
        </div>
      )}

      {/* Zoom hint - show when there are precise jobs to reveal */}
      {currentZoom < PRECISE_SPLIT_ZOOM && jobs.some(j => j.hasPreciseLocation) && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-xs font-medium shadow-lg border border-border/50 z-20">
          Przybliż mapę, aby zobaczyć oferty z dokładnym adresem
        </div>
      )}

      {/* Custom styles for markers */}
      <style>{`
        .hotspot-marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .hotspot-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        @keyframes pulse {
          0% {
            transform: scale(0.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        .hotspot-core {
          position: relative;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
          z-index: 2;
        }
        
        .hotspot-marker:hover .hotspot-core {
          transform: scale(1.1);
        }
        
        .hotspot-level {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: bold;
          color: #1f2937;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
          z-index: 3;
        }
        
        .vehicle-marker-wrapper {
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          transition: transform 0.2s ease;
        }
        
        .vehicle-marker:hover .vehicle-marker-wrapper {
          transform: scale(1.2);
        }
        
        .job-marker-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .job-pulse {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        .job-pin {
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
        }
        
        .job-pin svg {
          transform: rotate(45deg);
        }
        
        .job-marker:hover .job-pin {
          transform: rotate(-45deg) scale(1.1);
        }
        
        /* Cluster marker styles */
        .cluster-marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .cluster-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        .cluster-core {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transition: transform 0.2s ease;
          cursor: pointer;
        }
        
        .cluster-marker:hover .cluster-core {
          transform: scale(1.1);
        }
        
        .cluster-count {
          color: white;
          font-weight: bold;
          font-size: 14px;
        }
        
        /* Cluster popup styles */
        .cluster-popup {
          padding: 0;
          min-width: 260px;
        }
        
        .cluster-popup-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          padding-right: 30px;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .cluster-popup-header strong {
          font-size: 14px;
          color: #1f2937;
        }
        
        .cluster-job-count {
          font-size: 12px;
          color: #6b7280;
          background: #e5e7eb;
          padding: 2px 8px;
          border-radius: 12px;
        }
        
        .cluster-job-list {
          max-height: 220px;
          overflow-y: auto;
        }
        
        .cluster-job-item {
          display: block;
          padding: 10px 16px;
          border-bottom: 1px solid #f3f4f6;
          text-decoration: none;
          transition: background 0.15s;
        }
        
        .cluster-job-item:hover {
          background: #f9fafb;
        }
        
        .cluster-job-item:last-child {
          border-bottom: none;
        }
        
        .cluster-job-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 500;
          color: #1f2937;
          line-height: 1.3;
        }
        
        .job-type-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .job-type-dot.regular {
          background: #8b5cf6;
        }
        
        .job-type-dot.urgent {
          background: #ef4444;
        }
        
        .urgent-dot {
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .cluster-job-meta {
          display: flex;
          gap: 8px;
          margin-top: 4px;
          font-size: 11px;
          color: #6b7280;
        }
        
        .cluster-more-jobs {
          padding: 8px 16px;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
          background: #f9fafb;
        }
        
        .cluster-popup-hint {
          padding: 8px 16px;
          font-size: 11px;
          color: #9ca3af;
          text-align: center;
          border-top: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        
        .leaflet-popup-content {
          margin: 0;
        }
        
        .hotspot-popup, .job-popup {
          padding: 12px 16px;
          min-width: 200px;
        }
        
        .hotspot-popup-header, .job-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-right: 20px;
        }
        
        .hotspot-popup-header strong, .job-popup-header strong,
        .job-popup-header .job-title {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          flex: 1;
          word-break: break-word;
          line-height: 1.3;
        }
        
        .job-urgent-badge {
          background: #ef4444;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          flex-shrink: 0;
          white-space: nowrap;
        }
        
        .leaflet-popup-close-button {
          top: 8px !important;
          right: 8px !important;
          width: 20px !important;
          height: 20px !important;
          font-size: 18px !important;
          line-height: 18px !important;
          color: #6b7280 !important;
        }
        
        .leaflet-popup-close-button:hover {
          color: #1f2937 !important;
        }
        
        .hotspot-popup-content, .job-popup-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .hotspot-popup-row, .job-popup-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .hotspot-popup-row .label, .job-popup-row .label {
          color: #6b7280;
        }
        
        .hotspot-popup-row .value, .job-popup-row .value {
          font-weight: 500;
          color: #1f2937;
        }
        
        .hotspot-popup-row .value.bardzo-wysoka { color: #ef4444; }
        .hotspot-popup-row .value.wysoka { color: #f97316; }
        .hotspot-popup-row .value.średnia { color: #eab308; }
        .hotspot-popup-row .value.niska { color: #3b82f6; }
        
        .job-popup-link {
          display: block;
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          color: #8b5cf6;
          font-size: 12px;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }
        
        .job-popup-link:hover {
          color: #7c3aed;
        }
        
        .vehicle-popup {
          padding: 12px 16px;
          padding-right: 28px;
          font-size: 13px;
          min-width: 120px;
        }
        
        .vehicle-popup strong {
          display: block;
          margin-bottom: 4px;
          color: #1f2937;
        }
        
        /* Fix z-index for Leaflet controls */
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 10 !important; }
        .leaflet-control { z-index: 10 !important; }
        
        /* Hide Leaflet branding and Ukraine flag */
        .leaflet-control-attribution a[href*="leaflet"],
        .leaflet-control-attribution img,
        .leaflet-control-attribution svg {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
