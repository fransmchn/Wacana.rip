# CP6 final report

## Runtime setup

- Playwright `@playwright/test` added as devDependency only.
- Chromium and headless shell installed locally.
- QA script: `qa/ui-qa.mjs`.
- Screenshots: `qa/screens/`.
- Runtime server: `http://127.0.0.1:3000`.

## CP5.1 findings

### Button icon source

Code audit found no global `flex-direction: column` or global `display: block` affecting `.ui-button`. Button root already used `display: inline-flex`; root weakness was reliance on inherited/default flex direction and child content had no explicit label layout. Root selectors reviewed:

- `src/app/globals.css:116`: `.ui-button, .ui-icon-button`.
- `src/app/globals.css:379` before cleanup: broad `button` transition/active rules. It did not set layout, but was removed as duplicate primitive behavior.
- `src/app/globals.css:382`: mobile `.section-heading` `flex-direction: column`; unrelated section layout, not buttons.
- `src/components/tombstone.css:29`: `.tombstone-body` `flex-direction: column`; card body only, not buttons.

Fix: Button now wraps children in `.ui-button-label`; root and label both explicitly row/flex/no-wrap. Runtime measured 21 icon+text buttons on `/` and 7 on `/dev/ui` per viewport. All computed `flex-direction: row`; all vertical center deltas 0px.

### Purple avatar source

Search across `src/` found no `purple`, `violet`, `indigo`, `hsl()`, or `oklch()`. No hash color source existed. Initials inherited `.ui-avatar { color: var(--gold) }` at `src/app/globals.css:160`; screenshot purple was not reproducible after clearing `.next` and rebuilding. Initials now use deterministic user-ID tone classes: rose, gold, sage, slate in `src/lib/profile.ts` and `src/components/ui/Avatar.tsx`.

## Automated runtime table

Each route ran at 4 viewports. `overflow elements` excludes intentional horizontal chip rail children.

| Route | Viewport | H scroll | overflow elements | Buttons sm/md/lg | Input | Chip | Icon layout | Reduced motion | Dialog |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `/` | 375x667 | 375/375 | 0 | 32/40/48 | 44 | 36 | 21/21 pass | 0 animations | n/a |
| `/dev/ui` | 375x667 | 375/375 | 0 | 32/40/48 | 44 | 36 | 7/7 pass | 0 animations | 1 scroll, header/footer visible |
| `/` | 768x1024 | 768/768 | 0 | 32/40/48 | 44 | 36 | 21/21 pass | 0 animations | n/a |
| `/dev/ui` | 768x1024 | 768/768 | 0 | 32/40/48 | 44 | 36 | 7/7 pass | 0 animations | 1 scroll, header/footer visible |
| `/` | 1280x800 | 1280/1280 | 0 | 32/40/48 | 44 | 36 | 21/21 pass | 0 animations | n/a |
| `/dev/ui` | 1280x800 | 1280/1280 | 0 | 32/40/48 | 44 | 36 | 7/7 pass | 0 animations | 1 scroll, header/footer visible |
| `/` | 1920x1080 | 1920/1920 | 0 | 32/40/48 | 44 | 36 | 21/21 pass | 0 animations | n/a |
| `/dev/ui` | 1920x1080 | 1920/1920 | 0 | 32/40/48 | 44 | 36 | 7/7 pass | 0 animations | 1 scroll, header/footer visible |

Dialog height-specific runtime checks at 375px wide:

| Height | Header | Footer | Body overflow-x |
|---:|---:|---:|---|
| 600 | visible | visible | hidden |
| 667 | visible | visible | hidden |
| 800 | visible | visible | hidden |

Additional runtime checks:

- Login modal opened on `/`: visible; title `Masuk ke TPU Wacana`.
- `/` `/` key: search focused, aria-label `Cari judul atau penyebab`.
- Skip link: visible on focus; href `#main`.
- Escape: closes Login and preview dialogs; preview check returned closed.
- Scrollbar computed: `color-scheme: dark`; `scrollbar-color: rgba(255, 255, 255, 0.28) rgba(0, 0, 0, 0)` on html/body.
- Tombstone rows: runtime cards measured 457px at 375px; action buttons 32px each. Wider card-row equality covered by card-row data in `qa/ui-results.json`.

Not runtime-tested: full Tab traversal audit, contrast ratio computation, upload with real avatar file, Google OAuth, magic-link delivery, native share, screen reader, real touch hardware. Browser automation covered focus entry, Escape, skip link, and search shortcut only.

## Visual review

Screenshots reviewed from `qa/screens/`.

Fixed:

- Mobile home mist no longer reports right-edge overflow: `.mist-two` changed to stay inside viewport.
- Button label/icon alignment made explicit.
- UI preview no longer uses legacy panel class or arbitrary rounded/padding utility classes.
- Dialog screenshot showed footer staying visible and body scrolling once.

No clear remaining clipping or stacking defect found in reviewed screenshots. Taste suggestions, not defects: UI preview could use more compact vertical spacing; certificate palette could be exposed as design tokens if PNG export ever needs theme customization.

## Consistency audit

- Raw `<button>` outside `src/components/ui/`: avatar preset button and tombstone title button. Both are semantic custom controls with required native behavior and no existing primitive equivalent; preset requires `aria-pressed`, title requires card-specific transparent styling.
- Raw input outside primitives: loss checkbox, hidden avatar file input, crop range input. Native checkbox/range/file behavior is intentional; visual text inputs use `Input`, `Textarea`, or `Select`.
- `.panel` and `.modal-surface`: removed as active UI usage. `StatsBanner` and `UiPreview` now use `.surface-panel`; modal surface shadow is owned by `.ui-dialog`.
- Hex grep: only `certificatePalette` remains in `src/components/DeathCertificateModal.tsx`.
- Arbitrary Tailwind audit: no `rounded-[...]`, `p-[...]`, `text-[...]`, `bg-[#...]`, `shadow-[...]` found in source. Existing regular utility values remain outside requested arbitrary-value audit.
- Icon sizes: runtime/common sizes are 15/16/17/18/20/24; 15 and 17 remain in existing compact controls. No non-icon inline SVG except Google icon and certificate rendering.

## Documentation

Added `docs/UI-GUIDE.md`; README now documents `qa:ui`, `/dev/ui` production guard, and guide link.

## Changed files by area

- Tokens/layout: `src/app/globals.css`, `src/components/tombstone.css` history.
- Primitives: `src/components/ui/Button.tsx`, `Dialog.tsx`, `Avatar.tsx`, `UiPreview.tsx`.
- Product UI: `Header.tsx`, `ProfileModal.tsx`, `BuryModal.tsx`, `DeathCertificateModal.tsx`, `StatsBanner.tsx`, `TombstoneCard.tsx`, profile helpers.
- Data/profile: `src/lib/profile.ts`, profile service and SQL from prior checkpoints.
- QA/docs: `qa/ui-qa.mjs`, `docs/UI-GUIDE.md`, `.gitignore`, `README.md`, `package.json`, `package-lock.json`.

Main primitive list: Button, IconButton, Input, Textarea, Select, Chip, Avatar, Badge, Tooltip, Toast, Dialog, EmptyState, Skeleton, Switch.

## Open decisions

Still open: delete account flow, anonymous preferences, public profile page, footer links. Existing decisions remain: no `Makam saya` menu, no unsupported `profile_preferences`, no invalid footer routes.

## Runtime gaps and manual steps

- Upload avatar: login, open `Edit profil`, choose JPG/PNG/WebP under 2MB, crop, save, reload, verify old image cleanup in Supabase Storage.
- OAuth/magic link: configure Supabase, click each login method, complete provider/email flow, verify callback and session.
- Native share: create a grave, open certificate, test `Bagikan` on mobile browser and fallback download.
- Screen reader: inspect landmarks, dialog announcement, labels, live toasts, focus restoration with NVDA/VoiceOver.
- Touch: test bottom sheet drag/scroll, avatar crop pointer interaction, horizontal filter rail on real phone.

## Verification commands

- `npm run lint` — pass.
- `npm run build` — pass; `/dev/ui` remains guarded by `notFound()` in production and Playwright stays devDependency.
- `node --experimental-strip-types src/lib/profileValidation.test.ts` — pass.
- `node --experimental-strip-types src/lib/utils.test.ts` — pass.
- `npm run qa:ui` / `node qa/ui-qa.mjs` — runtime data generated in `qa/ui-results.json`.
