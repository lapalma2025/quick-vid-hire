import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { MapFilters } from "@/pages/WorkMap";
import { JobMarker } from "@/hooks/useVehicleData";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  jobs: JobMarker[];
  hasUrgent: boolean;
  bounds: L.LatLngBounds;
}

// Constants
const DOLNOSLASKIE_CENTER: L.LatLngTuple = [51.1, 17.0];
const DEFAULT_ZOOM = 9;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

// Cluster radius in pixels - jobs within this distance get clustered
const CLUSTER_RADIUS_PX = 60;
// Zoom level at which we stop clustering
const NO_CLUSTER_ZOOM = 14;

// Memoization cache for clustering
interface ClusterCache {
  zoom: number;
  boundsKey: string;
  jobsKey: string;
  clusters: Cluster[];
  singles: JobMarker[];
}

// Calculate distance between two points in pixels at given zoom
function getPixelDistance(map: L.Map, lat1: number, lng1: number, lat2: number, lng2: number): number {
  const p1 = map.latLngToContainerPoint([lat1, lng1]);
  const p2 = map.latLngToContainerPoint([lat2, lng2]);
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
}

// Calculate weighted centroid (gives more weight to urgent jobs)
function getWeightedCentroid(jobs: JobMarker[]): { lat: number; lng: number } {
  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;
  
  jobs.forEach(job => {
    const weight = job.urgent ? 2 : 1;
    weightedLat += job.lat * weight;
    weightedLng += job.lng * weight;
    totalWeight += weight;
  });
  
  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
  };
}

// Create bounds key for cache invalidation
function getBoundsKey(bounds: L.LatLngBounds): string {
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  return `${sw.lat.toFixed(4)},${sw.lng.toFixed(4)},${ne.lat.toFixed(4)},${ne.lng.toFixed(4)}`;
}

function createJobIcon(urgent: boolean = false, animate: boolean = false) {
  const color = urgent ? "#ef4444" : "#8b5cf6";
  const size = urgent ? 36 : 32;
  
  return L.divIcon({
    className: `job-marker ${animate ? 'animate-in' : ''}`,
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
  const size = Math.min(56, 36 + Math.log2(count + 1) * 6);
  const clusterColor = hasUrgent ? "#dc2626" : "#f59e0b";
  
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
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const clusterCacheRef = useRef<ClusterCache | null>(null);
  const updateTimeoutRef = useRef<number | null>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(DEFAULT_ZOOM);
  const [viewportBounds, setViewportBounds] = useState<L.LatLngBounds | null>(null);

  // Filter jobs to viewport
  const visibleJobs = useMemo(() => {
    if (!viewportBounds || jobs.length === 0) return jobs;
    
    return jobs.filter(job => {
      return viewportBounds.contains([job.lat, job.lng]);
    });
  }, [jobs, viewportBounds]);

  // Compute clusters with caching
  const computeClusters = useCallback((
    map: L.Map, 
    jobsToCluster: JobMarker[], 
    zoom: number
  ): { clusters: Cluster[]; singles: JobMarker[] } => {
    // At high zoom, don't cluster
    if (zoom >= NO_CLUSTER_ZOOM) {
      return { clusters: [], singles: jobsToCluster };
    }

    const clusters: Cluster[] = [];
    const singles: JobMarker[] = [];
    const processed = new Set<string>();

    // Sort jobs by urgency first (urgent jobs become cluster centers)
    const sortedJobs = [...jobsToCluster].sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return 0;
    });

    sortedJobs.forEach(job => {
      if (processed.has(job.id)) return;

      // Find all jobs within cluster radius
      const nearbyJobs: JobMarker[] = [job];
      processed.add(job.id);

      sortedJobs.forEach(otherJob => {
        if (processed.has(otherJob.id)) return;
        
        const distance = getPixelDistance(map, job.lat, job.lng, otherJob.lat, otherJob.lng);
        if (distance <= CLUSTER_RADIUS_PX) {
          nearbyJobs.push(otherJob);
          processed.add(otherJob.id);
        }
      });

      if (nearbyJobs.length === 1) {
        singles.push(job);
      } else {
        // Create cluster
        const centroid = getWeightedCentroid(nearbyJobs);
        const hasUrgent = nearbyJobs.some(j => j.urgent);
        
        // Calculate bounds for this cluster
        const lats = nearbyJobs.map(j => j.lat);
        const lngs = nearbyJobs.map(j => j.lng);
        const bounds = L.latLngBounds(
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        );

        clusters.push({
          id: `cluster-${job.id}`,
          lat: centroid.lat,
          lng: centroid.lng,
          jobs: nearbyJobs,
          hasUrgent,
          bounds,
        });
      }
    });

    return { clusters, singles };
  }, []);

  // Update markers on map
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;

    const zoom = map.getZoom();
    const bounds = map.getBounds();
    const boundsKey = getBoundsKey(bounds);
    const jobsKey = jobs.map(j => j.id).join(',');

    // Check cache
    const cache = clusterCacheRef.current;
    if (cache && cache.zoom === zoom && cache.boundsKey === boundsKey && cache.jobsKey === jobsKey) {
      return; // No changes needed
    }

    // Filter to visible jobs
    const visible = jobs.filter(job => bounds.contains([job.lat, job.lng]));
    
    // Compute new clusters
    const { clusters, singles } = computeClusters(map, visible, zoom);

    // Update cache
    clusterCacheRef.current = {
      zoom,
      boundsKey,
      jobsKey,
      clusters,
      singles,
    };

    // Clear existing markers
    if (markersLayerRef.current) {
      markersLayerRef.current.clearLayers();
    } else {
      markersLayerRef.current = L.layerGroup().addTo(map);
    }

    // Add single markers
    singles.forEach(job => {
      const icon = createJobIcon(job.urgent, true);
      const marker = L.marker([job.lat, job.lng], { 
        icon,
        zIndexOffset: job.urgent ? 400 : 300,
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
      
      markersLayerRef.current!.addLayer(marker);
    });

    // Add cluster markers
    clusters.forEach(cluster => {
      const icon = createClusterIcon(cluster.jobs.length, cluster.hasUrgent);
      const marker = L.marker([cluster.lat, cluster.lng], { 
        icon,
        zIndexOffset: 500,
      });

      // Click handler - fitBounds to show all jobs in cluster
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        
        // Expand bounds slightly for padding
        const expandedBounds = cluster.bounds.pad(0.2);
        
        map.flyToBounds(expandedBounds, {
          duration: 0.5,
          easeLinearity: 0.25,
          maxZoom: NO_CLUSTER_ZOOM,
          padding: [40, 40],
        });
      });

      // Tooltip on hover
      const jobPreview = cluster.jobs.slice(0, 3).map(j => 
        `<div class="cluster-preview-item">${j.urgent ? '🔴' : '🟣'} ${j.title.substring(0, 30)}${j.title.length > 30 ? '...' : ''}</div>`
      ).join('');
      
      marker.bindTooltip(`
        <div class="cluster-tooltip">
          <div class="cluster-tooltip-header">${cluster.jobs.length} ofert</div>
          ${jobPreview}
          ${cluster.jobs.length > 3 ? `<div class="cluster-tooltip-more">+${cluster.jobs.length - 3} więcej</div>` : ''}
          <div class="cluster-tooltip-hint">Kliknij aby przybliżyć</div>
        </div>
      `, { 
        direction: 'top',
        offset: [0, -20],
        className: 'cluster-tooltip-wrapper'
      });

      markersLayerRef.current!.addLayer(marker);
    });

    // Fallback: if no visible markers after update, pan to nearest
    if (visible.length === 0 && jobs.length > 0) {
      const mapCenter = map.getCenter();
      let nearestJob = jobs[0];
      let minDistance = Infinity;

      jobs.forEach(job => {
        const dist = mapCenter.distanceTo([job.lat, job.lng]);
        if (dist < minDistance) {
          minDistance = dist;
          nearestJob = job;
        }
      });

      toast.info("Przesunięto mapę do najbliższych ofert", { duration: 2000 });
      map.flyTo([nearestJob.lat, nearestJob.lng], DEFAULT_ZOOM + 1, {
        duration: 0.5,
      });
    }
  }, [jobs, isLoaded, computeClusters]);

  // Debounced update
  const scheduleUpdate = useCallback(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = window.setTimeout(() => {
      updateMarkers();
    }, 100);
  }, [updateMarkers]);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const dolnoslaskieBounds = L.latLngBounds(
      [50.10, 14.80],
      [51.85, 17.95]
    );

    const map = L.map(mapContainerRef.current, {
      center: DOLNOSLASKIE_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      maxBounds: dolnoslaskieBounds,
      maxBoundsViscosity: 1.0,
      attributionControl: false,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
    });

    // Use a faster tile layer
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      maxZoom: MAX_ZOOM,
      updateWhenIdle: true,
      updateWhenZooming: false,
    }).addTo(map);

    L.control.attribution({
      position: 'bottomright',
      prefix: false,
    }).addAttribution('© <a href="https://www.openstreetmap.org/copyright">OSM</a> | <a href="https://carto.com/attributions">CARTO</a>').addTo(map);

    // Event handlers with debouncing
    const handleViewChange = () => {
      setCurrentZoom(map.getZoom());
      setViewportBounds(map.getBounds());
      scheduleUpdate();
    };

    map.on('zoomend', handleViewChange);
    map.on('moveend', handleViewChange);
    map.on('resize', handleViewChange);

    mapRef.current = map;
    setViewportBounds(map.getBounds());
    setIsLoaded(true);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      map.remove();
      mapRef.current = null;
    };
  }, [scheduleUpdate]);

  // Update markers when jobs or filters change
  useEffect(() => {
    if (isLoaded) {
      // Clear cache to force recalculation
      clusterCacheRef.current = null;
      updateMarkers();
    }
  }, [jobs, isLoaded, updateMarkers]);

  // Update heatmap
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

  return (
    <div className="relative z-0 h-full w-full">
      <div 
        ref={mapContainerRef} 
        className="w-full h-full"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Ładowanie mapy...</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-border/50 text-xs z-10">
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
            <span>Klaster ofert</span>
          </div>
        </div>
      </div>

      {/* Visible jobs count */}
      {visibleJobs.length > 0 && (
        <div className="absolute top-4 right-4 bg-violet-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg z-20 animate-fade-in">
          {visibleJobs.length} {visibleJobs.length === 1 ? 'oferta' : visibleJobs.length < 5 ? 'oferty' : 'ofert'} w widoku
        </div>
      )}

      {/* Zoom hint */}
      {currentZoom < NO_CLUSTER_ZOOM - 2 && visibleJobs.length > 5 && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-card/95 backdrop-blur-sm text-foreground px-4 py-2 rounded-full text-xs font-medium shadow-lg border border-border/50 z-20">
          Przybliż, aby zobaczyć pojedyncze oferty
        </div>
      )}

      <style>{`
        .job-marker.animate-in .job-pin {
          animation: marker-pop 0.3s ease-out;
        }
        
        @keyframes marker-pop {
          0% { transform: rotate(-45deg) scale(0); opacity: 0; }
          60% { transform: rotate(-45deg) scale(1.1); }
          100% { transform: rotate(-45deg) scale(1); opacity: 1; }
        }
        
        .cluster-marker-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s ease;
        }
        
        .cluster-marker:hover .cluster-marker-wrapper {
          transform: scale(1.1);
        }
        
        .cluster-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          opacity: 0;
          animation: pulse 2s ease-out infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        
        .cluster-core {
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .cluster-marker:hover .cluster-core {
          box-shadow: 0 6px 16px rgba(0,0,0,0.35);
        }
        
        .cluster-count {
          color: white;
          font-weight: bold;
          font-size: 13px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        
        .cluster-tooltip-wrapper {
          padding: 0;
        }
        
        .cluster-tooltip-wrapper .leaflet-tooltip-content {
          margin: 0;
        }
        
        .cluster-tooltip {
          padding: 8px 12px;
          min-width: 160px;
        }
        
        .cluster-tooltip-header {
          font-weight: 600;
          font-size: 13px;
          margin-bottom: 6px;
          color: #1f2937;
        }
        
        .cluster-preview-item {
          font-size: 11px;
          color: #4b5563;
          padding: 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cluster-tooltip-more {
          font-size: 10px;
          color: #9ca3af;
          margin-top: 4px;
        }
        
        .cluster-tooltip-hint {
          font-size: 10px;
          color: #6b7280;
          margin-top: 6px;
          padding-top: 6px;
          border-top: 1px solid #e5e7eb;
          font-style: italic;
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
        
        .leaflet-popup-content-wrapper {
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        
        .leaflet-popup-content {
          margin: 0;
        }
        
        .job-popup {
          padding: 12px 16px;
          min-width: 200px;
        }
        
        .job-popup-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
          padding-right: 20px;
        }
        
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
        
        .job-popup-content {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .job-popup-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        
        .job-popup-row .label {
          color: #6b7280;
        }
        
        .job-popup-row .value {
          font-weight: 500;
          color: #1f2937;
        }
        
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
        
        .leaflet-pane { z-index: 1 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 10 !important; }
        .leaflet-control { z-index: 10 !important; }
        
        .leaflet-control-attribution a[href*="leaflet"],
        .leaflet-control-attribution img,
        .leaflet-control-attribution svg {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
