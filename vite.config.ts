import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const api = "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    host: true,
    // В dev контент и загрузки отдаёт серверный процесс (npm run dev запускает оба)
    proxy: { "/api": api, "/uploads": api },
  },
});
