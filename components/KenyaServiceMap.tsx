import React, { useEffect, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { serviceArea } from '../data/serviceArea';

/** Tile requests that must fail (with none succeeding) before we show the fallback. */
const TILE_ERROR_THRESHOLD = 4;
/** If no tile has loaded at all after this long, treat the map service as unavailable. */
const TILE_TIMEOUT_MS = 10_000;

/**
 * Interactive OpenStreetMap framed on Kenya. Shows a general service area:
 * no marker is drawn unless serviceArea.businessLocation is set.
 * Sized entirely by its parent (reserve height there to avoid layout shift).
 */
const KenyaServiceMap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const map = L.map(el, {
      minZoom: serviceArea.view.minZoom,
      maxZoom: serviceArea.view.maxZoom,
      maxBounds: serviceArea.view.maxBounds,
      maxBoundsViscosity: 0.8,
      // Scroll-wheel zoom is opt-in (click/focus the map) so it never hijacks page scrolling.
      scrollWheelZoom: false,
      zoomSnap: 0.25, // lets Kenya fill the frame instead of snapping to a too-small whole zoom level
      zoomDelta: 0.5,
      zoomAnimation: !reducedMotion,
      fadeAnimation: !reducedMotion,
      markerZoomAnimation: !reducedMotion,
    });

    // fitBounds adapts the zoom to the container, so Kenya fills the frame at every breakpoint.
    map.fitBounds(serviceArea.view.bounds, { padding: [8, 8] });

    map.on('focus', () => map.scrollWheelZoom.enable());
    map.on('blur', () => map.scrollWheelZoom.disable());

    let loaded = 0;
    let errors = 0;
    const tiles = L.tileLayer(serviceArea.tiles.url, {
      attribution: serviceArea.tiles.attribution,
      maxZoom: serviceArea.view.maxZoom,
      crossOrigin: true,
    }).addTo(map);

    tiles.on('tileload', () => {
      loaded += 1;
      setFailed(false);
    });
    tiles.on('tileerror', () => {
      errors += 1;
      if (loaded === 0 && errors >= TILE_ERROR_THRESHOLD) setFailed(true);
    });
    const timeout = window.setTimeout(() => {
      if (loaded === 0) setFailed(true);
    }, TILE_TIMEOUT_MS);

    // Future-proofing: only drawn once a real address is configured. A plain circle
    // (not the default marker) avoids Leaflet's image-asset bundling pitfalls.
    const place = serviceArea.businessLocation;
    if (place) {
      L.circleMarker([place.lat, place.lng], {
        radius: 9, color: '#640000', weight: 3, fillColor: '#B67E7D', fillOpacity: 0.9,
      }).bindTooltip(place.label).addTo(map);
    }

    return () => {
      window.clearTimeout(timeout);
      map.remove(); // releases listeners/DOM; also makes React StrictMode's double-mount safe
    };
  }, []);

  return (
    <div className="relative isolate h-full w-full">
      <div
        ref={containerRef}
        className="h-full w-full rounded-2xl"
        aria-label="Interactive map of Kenya. Use the plus and minus buttons, or arrow keys when focused, to zoom and pan."
      />
      {failed && (
        <div
          role="status"
          className="absolute inset-0 z-[1000] flex flex-col items-center justify-center gap-3 rounded-2xl bg-brand-navy/95 p-6 text-center text-white"
        >
          <p className="text-sm font-bold">The map couldn't be loaded right now.</p>
          <p className="max-w-xs text-xs text-slate-300">
            This is usually a temporary connection issue. You can still view Kenya on Google Maps.
          </p>
          <a
            href={serviceArea.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-brand-rose px-4 py-2 text-xs font-bold text-brand-navy hover:bg-white transition-colors"
          >
            View Kenya on Google Maps ↗
          </a>
        </div>
      )}
    </div>
  );
};

export default KenyaServiceMap;
