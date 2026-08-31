# Greentree Prints – AI Agent Guidance (Generic)

> **📌 NOTE**: This file contains universal project guidance applicable to ANY AI coding
> assistant (Cursor, Windsurf, Aider, Claude Code, etc.).
>
> For **Claude Code-specific** workflows and deployment procedures, see [CLAUDE.md](./CLAUDE.md).

## Project Overview

Greentree Prints is a neighbourhood 3D printing side business in Greentree Village, Burnaby.
This repository contains its entire web presence: a single static HTML file deployed to
Vercel. There is no backend, no database, no build pipeline, and no dependency tree.

The site's job is to explain the service and capture inbound requests. It does the latter
without any server: form submissions are serialized into a `mailto:` URL and handed to the
visitor's own email client.

## Technology Stack

- **Markup/Style/Script**: HTML5, CSS, vanilla JavaScript — all inline in `index.html`
- **JS dialect**: ES5-compatible (`var`, no arrow functions, no modules). Match this style.
- **Build tooling**: none
- **Package manager**: none — there is deliberately no `package.json`
- **Hosting**: Vercel static hosting, team `lwcc`
- **External requests**: Google Fonts stylesheet only (Bricolage Grotesque, Karla, IBM Plex Mono)

## The Single-File Constraint

**`index.html` is the product.** It arrived complete and self-contained, and that is a
deliberate property, not an accident of early-stage scaffolding.

**Do not, without an explicit request:**

- Split the CSS or JS into separate files
- Introduce a framework, bundler, or build step
- Add a `package.json` or any dependency
- Reformat, reindent, or "clean up" the existing markup
- Rewrite the ES5-style JavaScript into modern syntax

Any of these turns a zero-maintenance asset into something with a toolchain to keep alive.
If a change genuinely warrants a build step, say so and ask — don't assume.

**Edits should be surgical.** Change the lines the task requires and nothing else. A diff
against the previous commit should be readable at a glance.

## Architecture

### Page structure

`index.html` is roughly:

| Lines | Content |
|-------|---------|
| 1–245 | `<head>`, inline `<style>`, font preconnects |
| 246–285 | `<header>` with nav anchored to page sections |
| 286–334 | `#paths` — service categories |
| 335–384 | `#quick` — short quote form (`#quickForm`) |
| 385–575 | `#request` — detailed request form (`#reqForm`) with branching sections |
| 576–638 | Supporting content sections |
| 639+ | `<footer>` and the inline `<script>` |

Line numbers drift as content is edited — grep for the `id` rather than trusting them.

### Form model

Both forms are client-side only:

1. The user fills fields; branching detail blocks (`#hDesc`, `#kDesc`, `#pDesc`, `#rItem`,
   `#cDesc`) show or hide based on the selected category.
2. On submit, a validation pass populates `#quickErr` / `#reqErr` on failure.
3. On success, the handler builds a plain-text body, then sets
   `window.location.href = 'mailto:' + CONTACT_EMAIL + ...`
4. A confirmation block (`#quickSuccess` / `#reqSuccess`) is revealed.

There is no network request and no data persistence. Nothing about a submission is stored
anywhere the business controls until the email arrives.

### Configuration

Exactly one configurable value exists:

```js
var CONTACT_EMAIL = "hirechriscameron@gmail.com";
```

A guard checks `CONTACT_EMAIL.indexOf('example.com') === -1` before submitting. Leaving a
placeholder address in place disables both forms **silently** — no console error, no user
feedback. This is the project's one real footgun.

## Development Workflow

### Making a content change

1. Edit `index.html` directly
2. Open it in a browser and confirm the affected section renders
3. If a form was touched, submit it and confirm the `mailto:` opens with the right body
4. Commit with a message naming the section changed
5. Push to `main` — Vercel deploys automatically

### Verification checklist for any change

- [ ] Page renders with no console errors
- [ ] Both forms still submit and produce a correctly addressed `mailto:`
- [ ] Branching detail sections still show/hide correctly
- [ ] Nav anchors still resolve (no renamed `id`s left dangling)
- [ ] Responsive layout holds at mobile width
- [ ] `git diff` contains only lines the task required

### Testing

There is no test suite and adding one would be disproportionate. Verification is visual and
manual, per the checklist above.

## Common Tasks

| Task | How |
|------|-----|
| Preview locally | `open index.html` |
| Serve over HTTP | `python3 -m http.server 8000 --bind 0.0.0.0` |
| Change contact email | Edit `CONTACT_EMAIL` near line 648 |
| Deploy to production | `git push origin main` (auto) or `vercel --prod` |
| Check deploy status | `vercel ls` |
| Find a section | `grep -n 'id="section-name"' index.html` |

## Troubleshooting

**Forms silently do nothing.** `CONTACT_EMAIL` contains `example.com`. Set a real address.

**Site prompts for login.** Vercel deployment protection is enabled. It must stay off — this
is a public marketing page.

**Layout broken after an edit.** The CSS is inline and order-dependent. Check whether a
selector was moved above the rule it was overriding.

## Related Documentation

- [README.md](./README.md) — human-facing overview and setup
- [CLAUDE.md](./CLAUDE.md) — Claude Code workflows, deployment, custom domain procedure
- `~/AGENTS.md` — universal agent rules for this machine
