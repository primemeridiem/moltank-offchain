import { treaty } from '@elysiajs/eden';
import { app } from '@/app/api/[[...slugs]]/route';

// Server-side Eden client - direct function calls without HTTP overhead
// Use this in Server Components and API routes
export const serverApi = treaty(app).api;

// Type for the app - used for client-side treaty
export type App = typeof app;

// Client-side Eden client - makes HTTP requests
// Use this in Client Components ('use client')
// The baseUrl will be resolved relative to the current origin in the browser
export const createClientApi = (baseUrl: string = '') => treaty<App>(baseUrl).api;

// Isomorphic API client - works in both server and client contexts
// Uses typeof process to avoid hydration errors during build time
export const api =
  typeof process !== 'undefined'
    ? treaty(app).api
    : treaty<App>(
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
      ).api;
