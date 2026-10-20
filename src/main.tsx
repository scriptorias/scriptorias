import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import "@fontsource-variable/source-serif-4/opsz.css";
import "@fontsource-variable/source-serif-4/opsz-italic.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "./styles/app.css";
import { App } from "./App";
import { legacyHashToPath, migrateStorage } from "./lib/migrate";

// After a new deploy, an open tab may request chunks that no longer exist; reload to get the new build.
window.addEventListener("vite:preloadError", () => location.reload());

// Prototype links used hash routes (#/w/didache/read/1); rewrite them to clean paths.
const legacy = legacyHashToPath(location.hash);
if (legacy) history.replaceState(null, "", legacy);

// Upgrade stored bookmarks and positions before the first render (one time, see docs/MIGRATION.md).
migrateStorage()
  .catch((e) => console.error("storage migration failed", e))
  .finally(() => {
    createRoot(document.getElementById("root")!).render(
      <StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </StrictMode>,
    );
  });
