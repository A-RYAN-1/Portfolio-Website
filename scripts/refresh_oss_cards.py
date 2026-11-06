#!/usr/bin/env python3
"""Generate the cards and the proof line on the portfolio's Open Source tab from merged pull requests.

Runs daily in .github/workflows/refresh-oss-cards.yml and by hand. One card per upstream project for PRs
by A-RYAN-1 merged into other people's repos (the same rule as the profile README Action), newest first.
The cards replace everything between <!-- oss-cards:start --> and <!-- oss-cards:end -->; the proof line
sits between <!-- oss-stats:start --> and <!-- oss-stats:end -->. Card image: the PR's GitHub preview image,
padded to 4:3, saved under assets/images/oss/. Never hand-edit the cards.

Needs the gh CLI with GH_TOKEN and Pillow.
Usage: refresh_oss_cards.py            dry run, prints the diff
       refresh_oss_cards.py --write    applies it
"""
import datetime
import difflib
import html
import io
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT
INDEX = SITE / "index.html"
IMAGES = SITE / "assets" / "images" / "oss"
SKIP_OWNERS = {"a-ryan-1", "biagiopietro"}  # our own repos and forks of other contributors, as in the profile Action
START, END = "<!-- oss-cards:start -->", "<!-- oss-cards:end -->"
STATS_START, STATS_END = "<!-- oss-stats:start -->", "<!-- oss-stats:end -->"
ENV = dict(os.environ)  # GH_TOKEN comes from the workflow
INDENT = " " * 14


def gh(*args):
    # GitHub's secondary rate limit answers 403 to bursts: wait and retry
    for wait in (0, 60, 120, 240):
        time.sleep(wait)
        r = subprocess.run(["gh", *args], capture_output=True, text=True, env=ENV)
        if r.returncode == 0:
            return json.loads(r.stdout)
        if "rate limit" not in r.stderr:
            break
    raise RuntimeError(r.stderr.strip())


def stars(n):
    return f"{n / 1000:.1f}k".replace(".0k", "k") if n >= 1000 else str(n)


def clean_title(title):
    # "chore: migrate admin breadcrumbs" reads as a commit, not a card: drop the conventional prefix
    t = re.sub(r"^[a-z]+(\([^)]*\))?!?:\s*", "", title)
    return t[:1].upper() + t[1:]


def merged_prs():
    found = gh("search", "prs", "--author", "A-RYAN-1", "--merged", "--limit", "100", "--json", "url,repository", "--", "-user:A-RYAN-1")
    prs, meta = [], {}
    for p in found:
        repo = p["repository"]["nameWithOwner"]
        if repo.split("/")[0].lower() in SKIP_OWNERS:
            continue
        if repo not in meta:
            meta[repo] = gh("api", f"repos/{repo}")
        num = p["url"].rstrip("/").split("/")[-1]
        v = gh("pr", "view", num, "-R", repo, "--json", "title,mergedAt,url,number")
        prs.append({"repo": repo, "name": repo.split("/")[1], "number": v["number"], "title": clean_title(v["title"]),
                    "url": v["url"], "merged": v["mergedAt"][:10],
                    "lang": meta[repo].get("language") or "", "stars": stars(meta[repo]["stargazers_count"]),
                    "stars_n": meta[repo]["stargazers_count"]})
    return sorted(prs, key=lambda p: (p["merged"], p["number"]), reverse=True)


def group(prs):
    # one card per repo, newest project first; the image is the newest PR's preview
    out = {}
    for p in prs:
        g = out.setdefault(p["repo"], {**p, "prs": []})
        g["prs"].append(p)
    for g in out.values():
        g["merged"] = max(x["merged"] for x in g["prs"])
        g["first"] = min(x["merged"] for x in g["prs"])
    return sorted(out.values(), key=lambda g: (g["merged"], g["repo"]), reverse=True)


def image_name(p):
    return f"{p['repo'].replace('/', '-').lower()}-{p['number']}.jpg"


def card(p):
    i = INDENT
    when = datetime.date.fromisoformat(p["merged"])
    n = len(p["prs"])
    meta = f"{p['lang']} · {p['stars']} stars · {n} merged PR{'s' if n > 1 else ''} · {when:%b} {when.year}"
    return f"""{i}<li
{i}  class="project-item active"
{i}  data-filter-item
{i}  data-category="open source"
{i}>
{i}  <a
{i}    href="https://github.com/{html.escape(p['repo'])}/pulls?q=is%3Apr+author%3AA-RYAN-1+is%3Amerged"
{i}    target="_blank"
{i}    rel="noopener noreferrer"
{i}  >
{i}    <figure class="project-img">
{i}      <div class="project-item-icon-box">
{i}        <ion-icon name="eye-outline"></ion-icon>
{i}      </div>
{i}      <img
{i}        src="./assets/images/oss/{image_name(p)}"
{i}        alt="{html.escape(p['repo'])} merged pull requests: {html.escape('; '.join(x['title'] for x in p['prs']))}"
{i}        loading="lazy"
{i}      />
{i}    </figure>
{i}    <h3 class="project-title">{html.escape(p['name'])}</h3>
{i}    <p class="project-category">{html.escape(meta)}</p>
{i}  </a>
{i}</li>"""


def fetch(url):
    # GitHub's preview-image service answers 429 to quick bursts: pause, and back off on 429
    for wait in (2, 10, 30, 60):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(url, timeout=60) as r:
                return r.read()
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError(f"still rate-limited: {url}")


def stats_block(groups):
    # the proof line above the cards: counts come from the same merged PRs as the cards
    n_prs = sum(len(g["prs"]) for g in groups)
    total = sum(g["stars_n"] for g in groups)
    i = INDENT
    return (f"{STATS_START}\n{i}<strong>{n_prs}</strong> merged pull requests in <strong>{len(groups)}</strong> "
            f"projects with <strong>{stars(total)}</strong> GitHub stars combined, newest first.\n{i}{STATS_END}")


def main():
    write = "--write" in sys.argv
    prs = group(merged_prs())
    old = INDEX.read_text(encoding="utf-8")
    new = old
    if STATS_START in new:
        new = re.sub(re.escape(STATS_START) + r"[\s\S]*?" + re.escape(STATS_END), lambda _: stats_block(prs), new, count=1)
    block = f"{START}\n" + "\n\n".join(card(p) for p in prs) + f"\n\n{INDENT}{END}"
    if START in new:
        new = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), lambda _: block, new, count=1)
    else:
        anchor = '<ul class="project-list">\n'
        assert anchor in new, "project list not found"
        new = new.replace(anchor, anchor + INDENT + block + "\n\n", 1)
    print(f"{len(prs)} merged PR(s): " + ", ".join(f"{p['repo']} x{len(p['prs'])}" for p in prs))
    missing = [p for p in prs if not (IMAGES / image_name(p)).exists()]
    for p in missing:
        print(f"image: fetch {image_name(p)} from the PR's GitHub preview")
    if new == old:
        print("index.html: no change")
    else:
        sys.stdout.writelines(difflib.unified_diff(old.splitlines(True), new.splitlines(True), "index.html", "index.html (new)", n=1))
    if not write:
        print("\nDry run. Re-run with --write to apply.")
        return
    from PIL import Image
    IMAGES.mkdir(parents=True, exist_ok=True)
    for p in missing:
        og = Image.open(io.BytesIO(fetch(f"https://opengraph.githubassets.com/1/{p['repo']}/pull/{p['number']}"))).convert("RGB")
        og = og.resize((600, round(600 * og.height / og.width)), Image.LANCZOS)
        canvas = Image.new("RGB", (600, 450), "white")
        canvas.paste(og, (0, (450 - og.height) // 2))
        canvas.save(IMAGES / image_name(p), "JPEG", quality=85, optimize=True)
    if new != old:
        INDEX.write_text(new, encoding="utf-8", newline="\n")
    print("Written.")


if __name__ == "__main__":
    main()
