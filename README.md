# Greentree Prints

**Static single-page landing site for a neighbourhood 3D printing side business in Greentree Village, Burnaby.**

## Overview

Greentree Prints offers custom 3D printing to neighbours within walking distance — IKEA
accessories, replacement parts, kids' gear, and arbitrary models found online. This repo
holds the public landing page: one self-contained HTML file, no build step, no framework,
no backend.

The page's intake forms do not post to a server. They serialize the user's answers into a
`mailto:` link and hand off to the visitor's email client. The destination is the
`CONTACT_EMAIL` constant in the inline script — that is the only piece of configuration in
the entire project.

## Features

- Single-file page: markup, CSS, and JS all inline in `index.html`
- Two intake paths — a short "quick quote" form and a longer detailed request form
- Branching detail sections (household, kids, pets, repair, custom) that reveal based on selection
- Client-side validation with an inline error summary; no third-party form service
- `mailto:` submission — zero backend, zero data retention, zero recurring cost
- Google Fonts (Bricolage Grotesque / Karla / IBM Plex Mono) are the only external requests

## Technology Stack

- **Platform:** Static hosting on Vercel
- **Language:** HTML5 + vanilla CSS + vanilla JavaScript (ES5-compatible, no transpilation)
- **Build step:** None. The file is served exactly as committed.
- **Dependencies:** None. No `package.json`, no `node_modules`.
- **External assets:** Google Fonts stylesheet only

## Project Structure

```
greentree-prints/
├── index.html      # The entire site
├── README.md       # This file
├── AGENTS.md       # Universal AI agent guidance
├── CLAUDE.md       # Claude Code-specific patterns
└── .gitignore
```

## Getting Started

### Prerequisites

- A browser (to preview)
- `git` and the `gh` CLI (to push)
- `vercel` CLI (to deploy) — `npm install -g vercel`

### Setup

```bash
git clone git@github.com:learnwithcc/greentree-prints.git
cd greentree-prints
```

### Local preview

There is no dev server to configure. Either open the file directly:

```bash
open index.html
```

…or serve it over HTTP if you want to test behaviour that requires an origin:

```bash
python3 -m http.server 8000 --bind 0.0.0.0
# then visit http://localhost:8000
```

## Usage

### Changing the contact email

The single configuration value lives near line 648 of `index.html`:

```js
var CONTACT_EMAIL = "hirechriscameron@gmail.com";
```

The submit handler checks that this value does **not** contain `example.com` before firing
the `mailto:` redirect. If you ever revert it to a placeholder, both forms will silently
stop submitting.

### Editing content

All copy is plain HTML in `index.html`. Sections are anchored by `id` (`#paths`, `#quick`,
`#request`) and the nav links to those anchors — renaming an `id` means updating the nav.

### Deploying

Pushing to `main` triggers a production deploy on Vercel automatically. To deploy manually:

```bash
vercel --prod
```

## Deployment

- **Host:** Vercel, team `lwcc`
- **Repo:** `learnwithcc/greentree-prints` on GitHub
- **Trigger:** auto-deploy on push to `main`; pull requests get preview URLs
- **Framework preset:** Other (static). No build command, no output directory.
- **Deployment protection:** must stay **OFF** — this is a public marketing page. Vercel
  Authentication would put an SSO wall in front of prospective customers.

### Custom domain

See the "Custom Domain" section of [CLAUDE.md](./CLAUDE.md) for the full procedure.

## Troubleshooting

**Forms do nothing when submitted.** Check `CONTACT_EMAIL` — the guard at line ~703 aborts
submission if the address still contains `example.com`.

**The page asks visitors to log in.** Deployment protection got re-enabled on the Vercel
project. Turn it off in Project Settings → Deployment Protection.

**Fonts render as fallbacks.** The Google Fonts request failed. The page degrades to system
fonts by design; nothing is broken.

## Related Projects

Part of the personal/side-business portfolio under `~/FOCUS/DEV/`.
