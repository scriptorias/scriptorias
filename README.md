# Scriptorias

*Discover Your Path.* A digital library of ancient religious and historical writings, starting with Christianity.

Static HTML/CSS/JS with no build step. To run it, serve the folder (`python3 -m http.server`) and open `index.html`.

- `index.html`: app shell (sidebar, main, mobile tab bar)
- `app.js`: hash router and views (library, collection, work reader, paths, search, bookmarks)
- `styles.css`: design tokens and layout (desktop sidebar; phone drawer and tab bar below 820px)
- `data/library.js`: catalog of traditions, collections, works, paths, and work detail (About, Themes, Related)
- `data/1-enoch.js`: R. H. Charles' 1912 translation of 1 Enoch, chapters 1–16 (public domain, via Wikisource), parsed into chapters, verses, and poetry lines

Routes: `#/library/christianity`, `#/c/<collection>`, `#/w/<work>/<read|about|themes|related>/<chapter>/<verse>`, `#/path/<id>`, `#/search/<q>`, `#/bookmarks`.
