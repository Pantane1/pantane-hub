import type { LatLngBoundsExpression } from 'leaflet';

/**
 * Configuration for the Contact page's service-area map.
 *
 * IMPORTANT: nothing in `view` is a business location. Those numbers only
 * define which part of the world the map frames (a bounding box around Kenya).
 * PantaneHub has not published a street address, so no pin is shown.
 * If/when a real address exists, set `businessLocation` below — the map
 * component will then draw it, with no other code changes.
 */
export const serviceArea = {
  label: 'Kenya — General Service Area',
  heading: 'Serving Clients Across Kenya',
  description:
    "From Nairobi to the rest of Kenya, PantaneHub helps individuals and businesses build modern digital experiences. Get in touch to discuss your project, wherever you're based.",
  disclaimer: 'The map shows Kenya as a general service area, not a physical office location.',
  /** A general Kenya map — deliberately not directions to any specific place. */
  googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Kenya',

  /** MAP VIEW CONFIG ONLY (see note above). [south-west, north-east] corners. */
  view: {
    bounds: [[-4.8, 33.9], [5.2, 41.95]] as LatLngBoundsExpression,
    /** How far a visitor can pan away from Kenya. */
    maxBounds: [[-10, 27], [11, 48]] as LatLngBoundsExpression,
    minZoom: 5,
    maxZoom: 10,
  },

  /** Standard OpenStreetMap tiles (free, no API key). Attribution is required. */
  tiles: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
  },

  /**
   * RESERVED for a future real business address. Leave null for now.
   * Example: { lat: -1.2921, lng: 36.8219, label: 'Our office' }
   */
  businessLocation: null as null | { lat: number; lng: number; label: string },
};
