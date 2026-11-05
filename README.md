# Bansat (بنسټ)

**Lay the foundation before you build.**

*Bansat* is Pashto for "foundation". It is a blueprint-first framework and an [Agent Skill](https://code.claude.com/docs/en/skills) for Claude. It plans every new project, and audits every existing one, before any code is written. It covers:
- product requirements and architecture;
- security;
- UK/EU GDPR, PECR and Nigeria NDPA compliance;
- UI states, delivery and launch readiness.

Created by **Muhammad Tufail Khan** ([@bewithkhan](https://github.com/bewithkhan)).

## What's inside

| File | Purpose |
|---|---|
| `SKILL.md` | The skill: the instructions Claude follows |
| `reference/bansat-framework.md` | The full framework: 15 parts and 4 appendices, about 2,800 lines |
| `CITATION.cff` | Citation metadata. GitHub shows a **Cite this repository** button. |
| `LICENSE` · `LICENSE-CODE` | CC BY 4.0 for the text and templates; MIT for the code samples |

## Install

**Claude Code (terminal and VS Code)**: install once for all your projects:

```bash
# macOS / Linux
git clone https://github.com/bewithkhan/bansat ~/.claude/skills/bansat
```

```powershell
# Windows (PowerShell)
git clone https://github.com/bewithkhan/bansat "$HOME\.claude\skills\bansat"
```

Start a new Claude Code session and type `/bansat`. To update later, run `git pull` inside that folder.

To share it with a team in one project, copy the folder into that repo at `.claude/skills/bansat/` and commit it.

**Claude apps (web and desktop)**: add it as a skill in your Claude settings. See [Use skills in Claude](https://support.claude.com/en/articles/12512180-use-skills-in-claude).

**Other AI coding tools**: give the agent `reference/bansat-framework.md`, and paste its Part 12.1 rules into your `AGENTS.md` or rules file.

## Use

- **New project:** `/bansat I want to build …`, or just describe the project. You get a full `docs/BLUEPRINT.md` before any code.
- **Existing or live project:** `/bansat audit this repo`. You get a Day-0 risk triage, an as-is blueprint and a prioritised gap register.

## Cite

APA:

> Khan, M. T. (2026). *Bansat (بنسټ): A blueprint-first framework for building software* (Version 2.0) [Computer software]. GitHub. https://github.com/bewithkhan/bansat

BibTeX:

```bibtex
@misc{khan2026bansat,
  author       = {Khan, Muhammad Tufail},
  title        = {Bansat: A blueprint-first framework for building software},
  year         = {2026},
  note         = {Version 2.0},
  howpublished = {\url{https://github.com/bewithkhan/bansat}}
}
```

## Licence

- **Text and templates:** [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). You can use, adapt and share them, including commercially, if you keep this credit: *"Bansat (بنسټ) by Muhammad Tufail Khan, https://github.com/bewithkhan/bansat, CC BY 4.0"*.
- **Code samples:** MIT (see `LICENSE-CODE`).

## Disclaimer

Bansat summarises laws and regulator guidance as of 4 November 2026. It is not legal advice. Check the current rules before you launch, and get a qualified review for high-risk processing.
