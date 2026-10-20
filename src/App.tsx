import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import { Shell } from "./components/Shell";
import { Home } from "./pages/Home";
import { Library } from "./pages/Library";
import { CollectionPage } from "./pages/Collection";
import { ManuscriptPage, WorkPage } from "./pages/Work";
import { PathwayPage, Pathways } from "./pages/Pathways";
import { About, Bookmarks, NotFound, Search, Soon, SOON_ROUTES } from "./pages/Misc";
import { Reader } from "./reader/Reader";

/** New pages start at the top; the reader positions itself. */
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => { if (!pathname.includes("/read")) window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export function App() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/works/:id/read/:ch?/:verse?" element={<Reader />} />
        <Route element={<Shell />}>
          <Route index element={<Library id="christianity" />} />
          <Route path="home" element={<Home />} />
          <Route path="library/:tradition/:tab?" element={<Library />} />
          <Route path="collections/:id" element={<CollectionPage />} />
          <Route path="works/:id" element={<WorkPage />} />
          <Route path="works/:id/manuscripts/:ms" element={<ManuscriptPage />} />
          <Route path="pathways" element={<Pathways />} />
          <Route path="pathways/:id" element={<PathwayPage />} />
          <Route path="search" element={<Search />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="about" element={<About />} />
          {SOON_ROUTES.map((r) => <Route key={r} path={r} element={<Soon page={r} />} />)}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  );
}
