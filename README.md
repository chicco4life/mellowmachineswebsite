# Mellow Machines Lab website

**Instant Response. Infinite Character.**

The developer home for [Mellow Machines Lab](https://mellowmachines.com): open-source agent harness design, System One Models and expressive AI hardware and applications.

## Projects and guides

- [MellowHarness](https://github.com/Mellow-Machines-Lab/MellowHarness): immediate rules, typed model choices and a shared event log.
- [Buddygotchi](https://github.com/Mellow-Machines-Lab/buddygotchi): the companion example and supported Pixel/CYD hardware build.
- [AgentHooks](https://github.com/Mellow-Machines-Lab/AgentHooks): coding-agent event integration.
- [Technical sharing](https://mellowmachines.com/learn/): architecture, decision models, a latency sample, quickstarts and build guides.
- [Substack](https://mellowmachines.substack.com): the Lab publication and updates.

Co-authors: [Federico Li](https://github.com/chicco4life) and [0xfdsa](https://github.com/0xfdsa).

## Edit and preview

Use Node.js 24 or later and Python 3. The only authoring dependency is `marked`; the deployed site needs no server-side code or npm packages.

```sh
npm ci
npm run build
npm run check
python3 -m http.server 5176 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:5176/`. Reuse an existing preview server if that port is occupied.

- `content/home.html`: approved landing copy and demo markup.
- `content/articles.json`: guide definitions, sources, dates and related links.
- `content/*.md`: maintained article bodies, rendered during the build when the guide has a `markdown` entry.
- `content/resources.json`: the shared resource library.
- `content/site.json`: canonical domain, Lab description, public credits and pinned source revisions.
- `dist/`: static pages, styling, demo modules, images and recorded cues.

Update an article’s `updated` date when its content or meaningful links change. Keep publication dates and the historical Substack canonical intact. Do not treat build time as a freshness signal.

## GitHub Pages setup

The workflow builds and checks every push to `main`, then publishes **only `dist/`**. Pull requests run the build/checks without deploying.

1. Open [repository Pages settings](https://github.com/chicco4life/mellowmachineswebsite/settings/pages).
2. Set **Build and deployment → Source → GitHub Actions**.
3. Set **Custom domain** to `mellowmachines.com`.
4. Configure the DNS records below at your domain provider.
5. Enable **Enforce HTTPS** when GitHub’s certificate is available.
6. If the initial deployment ran before Pages was enabled, rerun it from [Actions](https://github.com/chicco4life/mellowmachineswebsite/actions).

| Type | Host | Value |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `chicco4life.github.io` |

These records are documented by [GitHub](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Preserve unrelated mail records. For Actions deployments, configure the custom domain in Pages settings; the included `dist/CNAME` documents the intended domain but does not set the repository setting by itself.

The site uses root-relative asset paths and canonical URLs for `mellowmachines.com`. Configure the custom domain before treating the default project URL as the working production site. No DNS changes are performed by this workflow.

## Demo and evidence boundaries

The four-minute buddy play is scripted. It uses existing animations, procedural cues and selected recorded voices. It makes no live model calls, captures no microphone input and does not measure hardware latency. Sound is opt-in; the default character is Pixel, with an optional WIP slime.

The latency guide reports an historical sample of 105 Jev decision passes with a 227 ms median. It includes the distribution and sanitized data, excluding private input events. That measures prepared-request-to-answer time, not complete user-to-device latency or decision accuracy.

Authored personality is implemented. Nightly auto-dream and learned long-term personality remain work in progress. The public Pixel hardware pack and the website’s recorded-voice demo have distinct asset scopes; see the build guide before buying parts.

The repository contains curated website source and assets. It excludes the internal growth hub, growth records, SEO strategy files, account credentials and the separate review host’s configuration. Original project and third-party notices remain applicable; this export does not create a blanket licence for all media.
