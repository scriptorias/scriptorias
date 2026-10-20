# Scriptorias

*Discover Your Path.* A digital library of ancient religious and historical writings, starting with Christianity.

React + TypeScript + Vite, with all library content as validated JSON in `content/`.

```
npm install
npm run dev            # local dev server
npm run content:check  # importer drift + schema/reference validation
npm run typecheck
npm run build          # content check + production build to dist/
npm test               # Playwright end-to-end tests (run after build)
```

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): structure, routing, loading, persistence, Capacitor readiness
- [docs/CONTENT.md](docs/CONTENT.md): content model, canonical references, provenance, import workflow
- [docs/DECISIONS.md](docs/DECISIONS.md): architectural decisions and open questions
- [docs/REFERENCES.md](docs/REFERENCES.md): citation systems per work and how they were checked
- [docs/MIGRATION.md](docs/MIGRATION.md): identifier, URL, and browser-data migrations from the prototype

The static prototype is preserved at the `prototype-v1` tag.
