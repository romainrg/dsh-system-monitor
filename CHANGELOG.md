# Changelog

## 1.0.0

First public release.

**Thirteen tabs**: Système, Tâches, Kubernetes, Docker, Processus, Réseau,
Sécurité, GitHub, Confluence, Jira, Projet, Veille tech & IA, Veille cyber.

- Host reads on five independent cadences (2 s, 15 s, 60 s, 120 s, 10 min), each
  served from a cache so a slow source never delays another.
- Twelve allowlisted controls (containers, VM, pods, rollouts, processes, Jira
  transitions), each validated against the last snapshot before a command is
  built. Nothing runs through a shell.
- Jira reader over REST v2/v3 with token candidate fallback and per-project KPIs.
- Confluence and GitHub (through the authenticated `gh` CLI) for the workspace.
- Tech and security watch with an `og:image` fallback and an SSRF-guarded image
  proxy.
- A local to-do list stored in one JSON file under `$DSH_HOME`, written
  atomically, bounded and validated on the Host.
- French and English dictionaries, dark and light themes.
