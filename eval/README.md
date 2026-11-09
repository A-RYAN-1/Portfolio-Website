# Ask about my work: evaluation

The About tab has a box that answers questions about the site from the site's own cards. There is no language model: the question is matched against 43 cards (About text, four service areas, three certifications, nine projects, four blog posts, eleven open-source repositories and a few count cards) with BM25, and the answer is the best cards, quoted and linked. When the question uses words the site never uses, it answers with a refusal. Nothing is generated, so nothing outside the site can appear in an answer.

## What is measured

- **hit@3**: for a question with an expected card, one expected card is among the (up to three) cards shown. **hit@1**: it is the first one.
- **refused out-of-scope**: a question the site cannot answer (salary, weather, another language) gets the refusal and no cards.
- **wrongly refused**: an answerable question that got the refusal.
- Expected cards are listed by hand per question (`expect`; an empty list means out of scope). The cards come from `eval/fixtures/` (saved copies of the three summaries taken 2026-11-09) and `index.html`, through the same `buildDocs` the browser uses.

## Run it

```
node eval/run.js --misses          # all three sets
node eval/run.js --set holdout
node --test tests/*.test.js        # unit tests, set integrity and the freeze hashes
```

## The three sets

| Set | Questions | How it was made |
| --- | --- | --- |
| `dev.json` | 30 (22 in scope, 8 out) | Written with the site in view. The rules were tuned on it. |
| `fresh.json` | 25 (19 in, 6 out) | Written after tuning on `dev`, worded differently, frozen by hash (`fresh.sha256`) before the first run. |
| `holdout.json` | 24 (16 in, 8 out) | Written after the rules were tuned again, on `dev` and on the misses of `fresh`; frozen by hash (`holdout.sha256`) before its first run. |

`run.js` and the tests refuse to score a frozen set whose file no longer matches its hash.

## Results (2026-11-09)

| Version | Set | hit@3 | hit@1 | Out-of-scope refused | Wrongly refused |
| --- | --- | --- | --- | --- | --- |
| v1 | fresh (first run) | 9/19 (47.4%) | 9/19 | 6/6 | 10/19 |
| v2 | dev (tuned on) | 21/22 (95.5%) | 20/22 | 8/8 | 0/22 |
| v2 | fresh (tuned on its misses) | 19/19 | 19/19 | 6/6 | 0/19 |
| v2 | **holdout (the honest number)** | **12/16 (75.0%)** | 12/16 | 6/8 | 4/16 |

v1 refused half of the answerable questions because everyday words ("anything", "change", "town") counted as topics the site never mentions. v2 added stop words and a few synonyms (patch and change to contribution, repo to project, town to city, deployed to live), lowered the coverage threshold from 0.6 to 0.45 and refuses requests to write or ignore instructions. The `fresh` figure for v2 is not a fresh test any more; the `holdout` figure is.

Read with care:

- 16 answerable and 8 out-of-scope questions is a small sample; one question moves the rate by about six points.
- Holdout misses: Docker and deployment pipelines (the site never says Docker), "Alertmanager" (only in a PR title it does not contain), a question that joined study and leadership, and "Invoice Ninja pull request" (the repository card uses a different spelling).
- Holdout leaks: "Give me the CEO of Josh Software" and "Explain how Kubernetes scheduling works" were answered with cards (the About, AWS badge and role cards; the external-dns and Actual cards). The cards are quoted from the site and nothing false is stated, but the box should have refused. Gaps PW-8 and PW-9 in the dossier.
- Matching is by words, so a question phrased with none of the card's words is refused. That is the safe direction for a portfolio.
