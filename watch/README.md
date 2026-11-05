# Law Watch

Law Watch keeps the law registry current (blueprint Phase 4). It has two parts, and a person reviews and merges every
change:

1. **The watch** (`.github/workflows/watch.yml`, running `scripts/watch.ts`). Every Monday at 06:23 UTC it fetches each
   official feed and page the registry watches and compares it with the last run. When something changed, it opens
   an issue for that jurisdiction, labelled `law-watch` and `law:<id>`, listing the new items. If that issue is
   already open, it comments on it instead. Sources that fail to load go in one `[watch] Source failing` issue,
   labelled `law-watch-failing`, so a failure is never silent; that issue closes itself once every source loads.
2. **The verify task**: a weekly Claude task that follows [`verify-prompt.md`](verify-prompt.md). It works through
   the open watch issues, checks each possible change against the official sources, and prepares a pull request for
   any field that needs to change, or comments and labels the issue `no-change`.

## What it watches

Each entry lists its watched sources under `watch`. Each item gives a `url` on one of the entry's official domains, a
`type`, and the `language` of the page:

| `type` | What it reads | What counts as a change |
|---|---|---|
| `rss`, `atom` | A feed's items: title, link and date | A new or changed item |
| `html` | The part of the page that `selector` (a CSS selector) picks out | New links, or edited text, inside that part |
| `api` | A JSON response, such as SPARQL results from the EU's Cellar endpoint | Any change to the response |

```yaml
watch:
  - url: https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/
    type: html
    selector: main .listing
    language: en
```

Pick feeds where they exist, and point a selector at a stable list of news or changes, not the whole page, so a
changed banner or date doesn't raise a false alarm. A source two entries share is fetched once.

## How it behaves

- **One request per source per run**, at most one per second to each site, with the user agent
  `Bansat-LawWatch/1.0 (+https://github.com/bewithkhan/bansat)`. It reads each site's `robots.txt` first, and a page
  that robots.txt disallows is reported as failing, not fetched.
- **State without commits.** Between runs the state lives in a workflow artifact (`law-watch-state`, kept 90 days),
  so the watch never commits to the repo. It holds a hash plus each item's title, link and date, never page text
  (BR-05). With no earlier state, a run sets a baseline and opens no change issues.
- **Least privilege.** The workflow can read the repo and its own artifacts, and write issues. It holds no secrets.

## Running it yourself

```sh
node scripts/watch.ts --state /tmp/watch-state.json --write-state /tmp/watch-state.json   # print what changed
node scripts/watch.ts --only uk,ie --state /tmp/watch-state.json                          # some entries only
node scripts/watch.test.ts                                                                # the tests, offline
```

Without `--issues`, it prints the report and opens nothing. The tests replay a known past change, the Data (Use and
Access) Act 2025 amending the Data Protection Act 2018, from fixtures.
