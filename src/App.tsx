import { lazy, Suspense } from "react";
import { ContentProvider } from "./content/ContentContext";
import { Shell } from "./layout/Shell";

// Админка — отдельный чанк: посетители сайта её код не скачивают
const Admin = lazy(() => import("./admin/Admin"));

export default function App() {
  if (location.pathname.replace(/\/$/, "") === "/admin") {
    return (
      <Suspense fallback={null}>
        <Admin />
      </Suspense>
    );
  }
  return (
    <ContentProvider>
      <Shell />
    </ContentProvider>
  );
}
