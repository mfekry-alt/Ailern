# Vercel Environment Variables Guide

Add these to your Vercel project:
Settings > Environment Variables > Add

## Frontend Variables (for the main project):
VITE_APP_NAME=Ailern
VITE_API_URL=https://your-project.vercel.app/api
VITE_ENABLE_DEVTOOLS=false

## Important Notes:
1. The mockServiceWorker.js file must be in the public folder (already done ✓)
2. MSW (Mock Service Worker) is enabled in production to simulate the backend
3. All registration/login will work with mock data until you have a real backend
