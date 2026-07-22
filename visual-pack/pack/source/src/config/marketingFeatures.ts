/** Public `/pricing` route + nav links — `VITE_PRICING_PAGE_ENABLED=true` in env (default on in .env.example). */
export const PRICING_PAGE_ENABLED = import.meta.env.VITE_PRICING_PAGE_ENABLED === 'true';

export const EXPORT_FORMATS = ['JSON', 'PNG', 'PDF', 'DXF', 'SVG'] as const;

export const EXPORT_FORMATS_LABEL = EXPORT_FORMATS.join(', ');

export const EXPORT_FORMAT_COUNT = EXPORT_FORMATS.length;
