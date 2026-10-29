import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The /api proxy lets the phone talk to the backend through the same address as the website,
// so only the frontend port needs to be reachable. HTTPS (needed for the phone camera) is
// switched on with: npm run dev:https
export default defineConfig(async () => {
  const plugins = [react()];
  if (process.env.HTTPS) {
    const { default: ssl } = await import("@vitejs/plugin-basic-ssl");
    plugins.push(ssl());
  }
  const proxy = { "/api": "http://localhost:5000" };
  return {
    plugins,
    server: { host: true, allowedHosts: true, proxy },
    preview: { host: true, allowedHosts: true, proxy },
  };
});
