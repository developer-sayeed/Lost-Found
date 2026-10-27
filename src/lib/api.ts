/**
 * Backwards compatibility barrel export for API service.
 * All API implementations have been modularized into src/services/api/
 */
export * from '../services/api';
export { api as default } from '../services/api';
