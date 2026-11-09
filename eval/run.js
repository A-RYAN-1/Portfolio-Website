"use strict";
// Usage: node eval/run.js [--set dev|fresh|holdout|all] [--misses]
// Scores the retrieval chat on a labelled question set. A case with an empty `expect` is out of scope and
// must be refused; any other case passes when one expected card is among the cards shown (hit@3) or is the
// first one shown (hit@1).
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const core = require("../assets/js/site-chat-core.js");
const { loadDocs } = require("./lib.js");

const args = process.argv.slice(2);
const setArg = args.includes("--set") ? args[args.indexOf("--set") + 1] : "all";
const showMisses = args.includes("--misses");

function frozenCheck(name) {
  const file = path.join(__dirname, name + ".json");
  const shaFile = path.join(__dirname, name + ".sha256");
  if (!fs.existsSync(file) || !fs.existsSync(shaFile)) return null;
  const now = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  const frozen = fs.readFileSync(shaFile, "utf8").trim().split(/\s+/)[0];
  return now === frozen;
}

function score(name, index) {
  const set = JSON.parse(fs.readFileSync(path.join(__dirname, name + ".json"), "utf8"));
  let inScope = 0, hit1 = 0, hit3 = 0, falseRefusal = 0, out = 0, refusedOut = 0;
  const misses = [];
  for (const c of set.cases) {
    const r = core.ask(index, c.q);
    if (c.expect.length === 0) {
      out++;
      if (r.status === "refuse") refusedOut++;
      else misses.push({ q: c.q, why: "answered an out-of-scope question", got: r.hits.map((h) => h.id) });
    } else {
      inScope++;
      const ids = r.hits.map((h) => h.id);
      if (r.status === "refuse") {
        falseRefusal++;
        misses.push({ q: c.q, why: "refused (" + r.reason + ", coverage " + (r.coverage || 0).toFixed(2) + ")", terms: r.terms });
      } else {
        if (c.expect.includes(ids[0])) hit1++;
        if (ids.some((id) => c.expect.includes(id))) hit3++;
        else misses.push({ q: c.q, why: "wrong cards", got: ids, expect: c.expect });
      }
    }
  }
  return { name, total: set.cases.length, inScope, hit1, hit3, falseRefusal, out, refusedOut, misses };
}

const pct = (a, b) => (b ? ((100 * a) / b).toFixed(1) + "%" : "n/a");
const index = core.buildIndex(loadDocs());
console.log("documents indexed: " + index.n);
const names = setArg === "all" ? ["dev", "fresh", "holdout"] : [setArg];
for (const n of names) {
  if (n !== "dev") {
    const ok = frozenCheck(n);
    if (ok === false) { console.error(n + ".json changed after it was frozen; the result would not be a fresh test."); process.exit(2); }
    if (ok === null) { console.error(n + ".json or " + n + ".sha256 is missing."); process.exit(2); }
  }
  if (!fs.existsSync(path.join(__dirname, n + ".json"))) continue;
  const s = score(n, index);
  console.log(`\n${s.name}: ${s.total} questions (${s.inScope} in scope, ${s.out} out of scope)`);
  console.log(`  hit@1 ${s.hit1}/${s.inScope} ${pct(s.hit1, s.inScope)}   hit@3 ${s.hit3}/${s.inScope} ${pct(s.hit3, s.inScope)}`);
  console.log(`  refused out-of-scope ${s.refusedOut}/${s.out} ${pct(s.refusedOut, s.out)}   wrongly refused in-scope ${s.falseRefusal}/${s.inScope} ${pct(s.falseRefusal, s.inScope)}`);
  if (showMisses) for (const m of s.misses) console.log("  MISS " + JSON.stringify(m));
}
