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
  onClusterSelect?: (jobs: JobMarker[]) => void;
}

interface Cluster {
  id: string;
  lat: number;
  lng: number;
  jobs: JobMarker[];
  hasUrgent: boolean;
  bounds: L.LatLngBounds;
}

// SVG icons for categories (inline for popup HTML)
const categoryIconSvgs: Record<string, string> = {
  'Prace fizyczne': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/></svg>',
  'Sprzątanie': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08"/><path d="M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z"/></svg>',
  'Przeprowadzki': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
  'Eventy': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12v0c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10"/><path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11v0c-.11.7-.72 1.22-1.43 1.22H17"/><path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98v0C9.52 4.9 9 5.52 9 6.23V7"/><path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z"/></svg>',
  'Gastronomia': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Z"/><path d="m18 15-5.1 5.1a2 2 0 0 1-2.8 0L6 16"/><path d="m22 22-3-3"/></svg>',
  'Ogród': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/><circle cx="12" cy="12" r="3"/><path d="m8 16 1.5-1.5"/><path d="M14.5 9.5 16 8"/><path d="m8 8 1.5 1.5"/><path d="M14.5 14.5 16 16"/></svg>',
  'Transport': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  'Montaż i naprawy': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'Opieka': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  'Dostawy': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>',
  'IT i komputery': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="12" x="3" y="4" rx="2" ry="2"/><line x1="2" x2="22" y1="20" y2="20"/></svg>',
  'Edukacja i szkolenia': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>',
  'Uroda i zdrowie': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  'Finanse i prawo': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  'Motoryzacja': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><path d="M9 17h6"/><circle cx="17" cy="17" r="2"/></svg>',
  'Instalacje': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="m4.22 4.22 2.83 2.83"/><path d="m16.95 16.95 2.83 2.83"/><path d="m16.95 7.05 2.83-2.83"/><path d="m4.22 19.78 2.83-2.83"/></svg>',
  'Sztuka i rzemiosło': '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/></svg>',
};

function getCategoryIconSvg(category: string | undefined): string {
  if (!category) return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';
  return categoryIconSvgs[category] || '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>';
}

// Constants
const DOLNOSLASKIE_CENTER: L.LatLngTuple = [51.1, 17.0];
const DEFAULT_ZOOM = 9;
const MIN_ZOOM = 9;
const MAX_ZOOM = 18;

// Put all job/cluster markers in a dedicated pane so they always render above tiles
const JOB_MARKERS_PANE = "job-markers";

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
  heatmapPoints,
  onClusterSelect,
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
    // Ensure layer exists (use dedicated pane so markers always render above tiles)
    if (!markersLayerRef.current) {
      markersLayerRef.current = L.layerGroup([], { pane: JOB_MARKERS_PANE }).addTo(map);
    }

    // Always clear markers first (important when filters produce 0 results)
    markersLayerRef.current.clearLayers();

    console.log(`[WorkMap] updateMarkers called: ${jobs.length} jobs total, zoom: ${zoom}`);

    if (jobs.length === 0) return;

    // Use ALL jobs for clustering (not just viewport) to ensure markers are always visible
    const { clusters, singles } = computeClusters(map, jobs, zoom);

    console.log(`[WorkMap] Computed: ${clusters.length} clusters, ${singles.length} singles`);

    // Cache the results
    const boundsKey = getBoundsKey(bounds);
    const jobsKey = jobs.map((j) => j.id).join("|");

    clusterCacheRef.current = {
      zoom,
      boundsKey,
      jobsKey,
      clusters,
      singles,
    };

    // Add single markers
    singles.forEach((job) => {
      const icon = createJobIcon(job.urgent, true);
      const marker = L.marker([job.lat, job.lng], {
        icon,
        pane: JOB_MARKERS_PANE,
        zIndexOffset: job.urgent ? 400 : 300,
      });

      marker.bindPopup(
        `
        <div class="job-popup-modern">
          <div class="job-popup-badge-row">
            ${job.urgent ? '<span class="badge-urgent">🔥 PILNE</span>' : ''}
            ${job.category ? `<span class="badge-category">${job.category}</span>` : ''}
          </div>
          <h3 class="job-popup-title">${job.title}</h3>
          <div class="job-popup-location">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            <span>${job.miasto}${job.district ? `, ${job.district}` : ''}</span>
          </div>
          ${job.budget ? `
            <div class="job-popup-budget">
              <span class="budget-value">${job.budget} zł</span>
            </div>
          ` : ''}
          <a href="/jobs/${job.id}" class="job-popup-cta">
            Zobacz szczegóły
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      `,
        { minWidth: 260, maxWidth: 320, className: "modern-popup" },
      );

      markersLayerRef.current!.addLayer(marker);
    });

    // Add cluster markers
    clusters.forEach((cluster) => {
      const icon = createClusterIcon(cluster.jobs.length, cluster.hasUrgent);
      const marker = L.marker([cluster.lat, cluster.lng], {
        icon,
        pane: JOB_MARKERS_PANE,
        zIndexOffset: 500,
      });

      // Generate ALL job preview cards for popup (with scroll)
      const jobPreview = cluster.jobs
        .map(
          (j) => `
            <a href="/jobs/${j.id}" class="cluster-job-item">
              <div class="cluster-job-icon">${getCategoryIconSvg(j.category)}</div>
              <div class="cluster-job-content">
                <div class="cluster-job-title">${j.title.substring(0, 26)}${j.title.length > 26 ? "..." : ""}</div>
                ${j.budget ? `<div class="cluster-job-price">${j.budget} zł</div>` : '<div class="cluster-job-price-na">Do negocjacji</div>'}
              </div>
            </a>
          `,
        )
        .join("");

      marker.bindPopup(
        `
        <div class="cluster-popup">
          <div class="cluster-popup-header">${cluster.jobs.length} ofert w tym miejscu</div>
          <div class="cluster-popup-list">
            ${jobPreview}
          </div>
        </div>
      `,
        { minWidth: 280, maxWidth: 320, className: "cluster-popup-wrapper" },
      );

      markersLayerRef.current!.addLayer(marker);
    });
  }, [jobs, isLoaded, computeClusters, onClusterSelect]);

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

    // Dedicated pane for job markers (keeps them above tiles/overlays)
    map.createPane(JOB_MARKERS_PANE);
    const jobPane = map.getPane(JOB_MARKERS_PANE);
    if (jobPane) {
      jobPane.style.zIndex = "650";
      jobPane.style.pointerEvents = "auto";
    }

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

    // Event handlers - only update on zoom change, not on pan
    let lastZoom = map.getZoom();
    
    const handleZoomEnd = () => {
      const newZoom = map.getZoom();
      setCurrentZoom(newZoom);
      setViewportBounds(map.getBounds());
      // Only recalculate clusters when zoom changes
      if (newZoom !== lastZoom) {
        lastZoom = newZoom;
        scheduleUpdate();
      }
    };

    const handleMoveEnd = () => {
      setViewportBounds(map.getBounds());
      // Don't recalculate on pan - markers are already placed at correct coordinates
    };

    map.on('zoomend', handleZoomEnd);
    map.on('moveend', handleMoveEnd);
    map.on('resize', handleZoomEnd);

    mapRef.current = map;
    setViewportBounds(map.getBounds());
    setIsLoaded(true);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      if (markersLayerRef.current) {
        markersLayerRef.current.clearLayers();
        markersLayerRef.current = null;
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
        className="w-full h-full relative z-0"
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
          padding: 10px 14px;
          min-width: 180px;
        }
        
        .cluster-tooltip-header {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 8px;
          color: #1f2937;
        }
        
        .cluster-preview-item {
          font-size: 12px;
          color: #4b5563;
          padding: 3px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cluster-tooltip-more {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 6px;
        }
        
        .cluster-tooltip-hint {
          font-size: 11px;
          color: #8b5cf6;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #e5e7eb;
          font-weight: 500;
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
        
        /* Modern Popup Styles */
        .modern-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
          border: 1px solid rgba(0,0,0,0.05);
        }
        
        .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        
        .leaflet-popup-content {
          margin: 0;
        }
        
        .job-popup-modern {
          padding: 20px;
          min-width: 260px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .job-popup-badge-row {
          display: flex;
          gap: 8px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        
        .badge-urgent {
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        
        .badge-category {
          background: #f3f4f6;
          color: #4b5563;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .job-popup-title {
          font-size: 18px;
          font-weight: 700;
          color: #111827;
          line-height: 1.3;
          margin: 0 0 12px 0;
          padding-right: 20px;
        }
        
        .job-popup-location {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #6b7280;
          font-size: 13px;
          margin-bottom: 16px;
        }
        
        .job-popup-location svg {
          flex-shrink: 0;
          color: #9ca3af;
        }
        
        .job-popup-budget {
          display: inline-block;
          padding: 6px 12px;
          background: #ecfdf5;
          border-radius: 6px;
          margin-bottom: 16px;
        }
        
        .budget-value {
          font-size: 16px;
          font-weight: 700;
          color: #059669;
        }
        
        .job-popup-cta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 16px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: #1f2937;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .job-popup-cta:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .job-popup-cta svg {
          transition: transform 0.2s ease;
        }
        
        .job-popup-cta:hover svg {
          transform: translateX(3px);
        }
        
        .leaflet-popup-close-button {
          top: 12px !important;
          right: 12px !important;
          width: 24px !important;
          height: 24px !important;
          font-size: 20px !important;
          line-height: 22px !important;
          color: #9ca3af !important;
          background: #f3f4f6 !important;
          border-radius: 50% !important;
          text-align: center;
        }
        
        .leaflet-popup-close-button:hover {
           color: #1f2937 !important;
           background: #e5e7eb !important;
         }

        /* Cluster popup styles */
        .cluster-popup-wrapper .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          padding: 0;
        }
        
        .cluster-popup-wrapper .leaflet-popup-content {
          margin: 0;
        }
        
        .cluster-popup {
          padding: 16px;
          font-family: system-ui, -apple-system, sans-serif;
        }
        
        .cluster-popup-header {
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .cluster-popup-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 4px;
        }
        
        .cluster-popup-list::-webkit-scrollbar {
          width: 6px;
        }
        
        .cluster-popup-list::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }
        
        .cluster-popup-list::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }
        
        .cluster-popup-list::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        
        .cluster-job-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
        }
        
        .cluster-job-item:hover {
          background: #f0fdf4;
          border-color: #86efac;
          transform: translateX(2px);
        }
        
        .cluster-job-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .cluster-job-icon svg {
          stroke: white;
        }
        
        .cluster-job-content {
          flex: 1;
          min-width: 0;
        }
        
        .cluster-job-title {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .cluster-job-price {
          font-size: 13px;
          font-weight: 700;
          color: #059669;
          margin-top: 2px;
        }
        
        .cluster-job-price-na {
          font-size: 11px;
          color: #9ca3af;
          margin-top: 2px;
        }
        
        .cluster-popup-more {
          display: block;
          width: 100%;
          margin-top: 10px;
          padding: 10px 16px;
          background: #1f2937;
          color: white;
          font-size: 13px;
          font-weight: 600;
          text-align: center;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .cluster-popup-more:hover {
          background: #111827;
        }

        /* Keep our job markers above tiles */
        .leaflet-job-markers-pane { z-index: 650 !important; }

        .leaflet-top, .leaflet-bottom { z-index: 800 !important; }
        .leaflet-control { z-index: 800 !important; }

        .leaflet-control-attribution a[href*="leaflet"],
        .leaflet-control-attribution img,
        .leaflet-control-attribution svg {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
