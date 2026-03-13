# Docs Versioning

This project uses [Docusaurus versioning](https://docusaurus.io/docs/versioning).

## How it works

| Path                                                  | Purpose                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------- |
| `docs/docs/`                                          | **"Next" (unreleased)** — the docs you're actively editing |
| `docs/versioned_docs/version-X.Y.Z/`                  | Frozen snapshot for a released version                     |
| `docs/versioned_sidebars/version-X.Y.Z-sidebars.json` | Sidebar snapshot for that version                          |
| `docs/versions.json`                                  | Ordered list of all released versions (newest first)       |

The version dropdown in the navbar is driven entirely by `versions.json`.

## Releasing a new version

When the root `package.json` version is bumped (e.g. `1.9.1 → 1.9.2`):

1. **Update docs** for the new version inside `docs/docs/`.
2. **Snapshot** the new version from the repo root:

   ```bash
   npm run docs:version -- 1.9.2
   ```

   This runs `docusaurus docs:version 1.9.2` inside the `docs/` folder, which:

   - Copies `docs/docs/` → `docs/versioned_docs/version-1.9.2/`
   - Copies `docs/sidebars.js` → `docs/versioned_sidebars/version-1.9.2-sidebars.json`
   - Prepends `"1.9.2"` to `docs/versions.json`

3. **Commit** the new `versioned_docs/`, `versioned_sidebars/`, and `versions.json`.
4. **Build** as normal — the dropdown will now include `1.9.2`, `1.9.1`, `1.9.0`, etc.

## Editing old version docs

Edit files directly in `docs/versioned_docs/version-X.Y.Z/`. These are just markdown files.

## Deprecating / removing a version

Remove its entry from `versions.json` and delete the matching `versioned_docs/` and `versioned_sidebars/` directories.
