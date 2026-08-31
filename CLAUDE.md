# Greentree Prints – Claude Code Integration Guide

> **📌 NOTE**: This file contains Claude Code-specific workflows, deployment procedures, and
> operational runbooks for this project.
>
> For **universal AI agent guidance**, see [AGENTS.md](./AGENTS.md).

## Project Context

This is the smallest possible real project: one static HTML file on Vercel, fronting a
neighbourhood 3D printing side business. There is no build step, no dependency tree, and no
test suite. Almost every task here is either a content edit or a deployment operation.

The main risk is not breaking code — it's **over-engineering**. Read the "Single-File
Constraint" section of [AGENTS.md](./AGENTS.md) before proposing any structural change.

## Deployment Facts

| Setting | Value |
|---------|-------|
| GitHub repo | `learnwithcc/greentree-prints` |
| GitHub account | `learnwithcc` — a **personal account**, not an organization |
| Vercel scope | team `lwcc` |
| Framework preset | Other / static |
| Build command | none |
| Output directory | repo root |
| Production branch | `main` |
| Deployment protection | **must stay OFF** |

### Why deployment protection must stay off

Vercel Authentication puts an SSO login wall in front of every deployment URL. On an
internal dashboard that's correct; on a public marketing page it means prospective customers
hit a login screen instead of the site. If a deploy ever starts prompting for login, that
setting got re-enabled — turn it off in Project Settings → Deployment Protection.

Verify with:

```bash
vercel project inspect greentree-prints --scope lwcc
```

## Common Workflows

### 1. Content change → production

```bash
cd ~/FOCUS/DEV/greentree-prints
# edit index.html
open index.html                    # visual check
git add -A
git commit -m "Update <section> copy"
git push origin main               # Vercel auto-deploys
vercel ls --scope lwcc             # confirm the deploy landed
```

### 2. Preview before shipping

Push to any branch other than `main` and open a PR — Vercel builds a preview URL and comments
it on the PR. Or deploy a preview directly:

```bash
vercel --scope lwcc               # preview deployment
vercel --prod --scope lwcc        # production deployment
```

### 3. Rolling back a bad deploy

```bash
vercel ls --scope lwcc                        # find the last good deployment URL
vercel promote <deployment-url> --scope lwcc  # promote it to production
```

Then fix forward in git — promoting does not change what's on `main`.

## Custom Domain

When a domain gets pointed at this site, the procedure is:

### Step 1 — add the domain to the Vercel project

```bash
vercel domains add greentreeprints.com --scope lwcc
vercel domains inspect greentreeprints.com --scope lwcc
```

Or via the dashboard: Project → Settings → Domains → Add.

### Step 2 — configure DNS at the registrar

Vercel will print the exact records. The standard pair is:

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

**Always use the values Vercel prints rather than the ones above** — Vercel has changed its
apex IP before, and a stale IP produces a domain that resolves but 404s.

If the registrar supports `ALIAS`/`ANAME` at the apex, prefer that over the `A` record:

| Type | Name | Value |
|------|------|-------|
| `ALIAS` | `@` | `cname.vercel-dns.com` |

### Step 3 — choose a canonical host

Decide whether `greentreeprints.com` or `www.greentreeprints.com` is canonical, then set the
other to redirect in Project → Settings → Domains. Serving both without a redirect splits SEO
signal between two URLs for identical content.

### Step 4 — wait for TLS

Vercel provisions a Let's Encrypt certificate automatically once DNS resolves. This normally
takes a few minutes but can take up to an hour. `vercel domains inspect` shows verification
state.

### Step 5 — update the page if needed

`index.html` has no hardcoded absolute URLs to the deployment, so a domain change requires no
code edit. If Open Graph or canonical tags are ever added, they will need the real domain.

### If DNS is on Cloudflare

Set the records to **DNS-only** (grey cloud), not proxied. Cloudflare's proxy in front of
Vercel's edge causes redirect loops and breaks certificate issuance.

## Verification After Any Deploy

Per the machine-wide Deployment Verification Protocol:

1. **Reachability** — production URL returns 200, not a login redirect
2. **Visual spot-check** — load the page, confirm hero, `#paths`, `#quick`, `#request` render
3. **Console** — no JS errors, no failed requests beyond an optional font timeout
4. **Forms** — submit each form; confirm the `mailto:` opens addressed to `CONTACT_EMAIL`

The forms check is the one that actually matters. Everything else on this page is decoration;
the forms are the business function, and they fail silently when misconfigured.

## Task Management

Most work here is a single edit and does not warrant TodoWrite. Use it for:

- Custom domain setup (multi-step, spans DNS propagation)
- Any change touching both forms
- Deploy-and-verify sequences where a step could be forgotten

## When NOT to Use Sub-Agents

This project is one file of ~820 lines. Reading it directly is always cheaper and more
accurate than dispatching an Explore agent. Do not spawn sub-agents for codebase search here.

## Error Handling

### Forms submit but no email client opens

The `mailto:` fired but no default mail handler is registered on the visitor's machine. This
is a client-side condition, not a site bug. Worth noting as a known limitation of the
`mailto:` approach — a meaningful fraction of visitors on shared or locked-down machines
cannot submit at all. If inbound volume disappoints, this is the first thing to revisit
(a hosted form endpoint would be the fix, at the cost of the zero-backend property).

### Deploy succeeds but the page is stale

Vercel's edge cache. Hard-reload, or check `vercel ls` to confirm the newest deployment is
actually aliased to production.

## Quick Reference

| Task | Command |
|------|---------|
| Local preview | `open index.html` |
| Deploy preview | `vercel --scope lwcc` |
| Deploy production | `vercel --prod --scope lwcc` |
| List deployments | `vercel ls --scope lwcc` |
| Inspect project | `vercel project inspect greentree-prints --scope lwcc` |
| Add domain | `vercel domains add <domain> --scope lwcc` |
| Roll back | `vercel promote <url> --scope lwcc` |

---

**Version**: 1.0.0
**Last Updated**: 2026-08-30

**For universal AI guidance**, see [AGENTS.md](./AGENTS.md)
**For project overview**, see [README.md](./README.md)
