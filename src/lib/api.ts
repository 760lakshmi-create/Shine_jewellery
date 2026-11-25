const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (
  configuredApiBaseUrl || (import.meta.env.DEV ? 'https://shine-jewellery.onrender.com/' : '/api')
).replace(/\/+$/, '');
