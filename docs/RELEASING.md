# Releasing and rollback

Lightweight process: Git tags, a changelog, and GitHub Releases. No release tooling.

## Branches

- `main` is production. Every push deploys to https://scriptorias.vercel.app.
- `dev` is integration. Every push gets a Vercel preview and a CI run.
- Never force-push or reset `main`.

## Versioning

Semantic Versioning in the 0.x series until public launch:

- **MINOR** (`0.1.0` → `0.2.0`): new features, behavior or content-model changes.
- **PATCH** (`0.1.0` → `0.1.1`): fixes only.

Releases are cut **only for approved milestones**, not for every commit or merge. Work merged to
`main` between releases is listed under *Unreleased* in `CHANGELOG.md`.

## Cutting a release

1. **Approve the milestone.** Decide the version number.
2. **Prepare on `dev`.** Move the *Unreleased* entries in `CHANGELOG.md` under a new heading
   `## [x.y.z] - YYYY-MM-DD`, update the compare links, and set `"version"` in `package.json`
   (then `npm install --package-lock-only`).
3. **Check.** CI passes on `dev`, and the Vercel preview is reviewed.
4. **Merge.** Fast-forward `main` to `dev` (`git checkout main && git merge --ff-only dev && git push`),
   or merge a pull request.
5. **Verify production.** The Vercel deployment succeeds, and the live smoke checks pass: homepage,
   Christianity library, a work overview, the reader with chapter navigation, bookmarks surviving a
   reload, and Continue Reading.
6. **Tag the exact production commit** with an annotated tag:
   ```
   git tag -a vX.Y.Z <production-sha> -m "vX.Y.Z: <one-line summary>"
   git push origin vX.Y.Z
   ```
7. **Publish the GitHub Release.** GitHub → Releases → *Draft a new release* → choose the tag,
   title `vX.Y.Z`, and paste that version's `CHANGELOG.md` section. Mark it as a pre-release while
   in 0.x. (Creating a Release needs a GitHub account or a fine-grained token with Contents
   read/write; the deploy key can push tags but cannot use the Releases API. The release token
   is kept in the release machine's macOS Keychain, never in the repository.)

## Rollback

Choose by urgency. Both keep Git history intact.

### A. Immediate: Vercel Instant Rollback (minutes, no Git changes)

1. Vercel → project **scriptorias** → **Deployments**.
2. Find the last good **Production** deployment (its commit SHA matches a release tag, e.g. `v0.1.0`).
3. **⋯ → Instant Rollback** (or **Promote to Production**). On the Hobby plan Vercel may only allow
   rolling back to the immediately previous production deployment; otherwise use B.
4. Run the production smoke checks.

While a rollback is active, Vercel stops promoting new pushes to production. That is intentional:
it holds the stable version while the fix is prepared. Fix forward with B, then use **Undo
Rollback** or promote the fixed deployment.

### B. Durable: revert on a branch (preserves history)

Revert the bad change instead of resetting `main`:

```
git checkout -b rollback/<issue> main
git revert <bad-sha>                      # one commit
git revert --no-edit <good-tag>..main     # or: everything since the last good release
git push -u origin rollback/<issue>
```

Open a pull request into `main`. CI runs, and Vercel builds a preview of the rolled-back code.
Review it, merge, and verify production. If the reverted work is still wanted, re-apply it later on
`dev` with a fix (`git revert <revert-sha>`).

### Rolling back past v0.1.0 (to the prototype)

Avoid this unless it's a last resort. v0.1.0 upgraded browser data once (`sc.schema = 2`) and
switched to clean URLs. The prototype would:

- read migrated Didache chapter 1 bookmarks (`didache.1.3`) as Wikisource segment numbers, which
  points them at the wrong passage (chapter bookmarks are unaffected);
- not serve clean URLs (`/works/didache`), because it has no `vercel.json` rewrites.

## Tags

- `prototype-v1`: the static prototype (preserved).
- `v0.1.0`: first React/TypeScript release.
