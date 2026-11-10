const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const core = require("../assets/js/site-chat-core.js");
const { loadDocs, extractChunks, ROOT } = require("../eval/lib.js");

const index = core.buildIndex(loadDocs());

test("every marked card in index.html is extracted", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const marked = (html.match(/data-chat-chunk="/g) || []).length;
  assert.strictEqual(extractChunks(html).length, marked);
  assert.ok(marked >= 15);
});

test("a question about a named project returns that project first", () => {
  const r = core.ask(index, "Tell me about the fraud detection project");
  assert.strictEqual(r.status, "answer");
  assert.strictEqual(r.hits[0].id, "project:fintech-fraud-detection");
});

test("a question about something the site never mentions is refused", () => {
  for (const q of ["Does he know Rust?", "What is his salary?", "What is the weather today?"]) {
    const r = core.ask(index, q);
    assert.strictEqual(r.status, "refuse", q);
    assert.deepStrictEqual(r.hits, []);
  }
});

test("a question with only filler words is refused", () => {
  assert.strictEqual(core.ask(index, "what is the").status, "refuse");
  assert.strictEqual(core.ask(index, "").status, "refuse");
});

test("every shown snippet is a substring of a card's own text", () => {
  const texts = new Map(loadDocs().map((d) => [d.id, d.text]));
  for (const q of ["What has he built in Go?", "Any blog post about git?", "pull requests to Kepler"]) {
    const r = core.ask(index, q);
    for (const h of r.hits) {
      const stem = h.snippet.replace(/\.\.\.$/, "");
      assert.ok(texts.get(h.id).includes(stem), h.id + ": " + h.snippet);
    }
  }
});

test("the same question gives the same answer", () => {
  const a = JSON.stringify(core.ask(index, "open source work on Kubernetes"));
  const b = JSON.stringify(core.ask(index, "open source work on Kubernetes"));
  assert.strictEqual(a, b);
});

test("both question sets point only at cards that exist", () => {
  const ids = new Set(loadDocs().map((d) => d.id));
  for (const name of ["dev", "fresh", "holdout"]) {
    const set = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", name + ".json"), "utf8"));
    for (const c of set.cases) for (const e of c.expect) assert.ok(ids.has(e), name + ": " + e);
  }
});

for (const name of ["fresh", "holdout"]) {
  test(name + ".json still matches the hash recorded when it was frozen", () => {
    const now = crypto.createHash("sha256").update(fs.readFileSync(path.join(ROOT, "eval", name + ".json"))).digest("hex");
    const frozen = fs.readFileSync(path.join(ROOT, "eval", name + ".sha256"), "utf8").trim().split(/\s+/)[0];
    assert.strictEqual(now, frozen);
  });
}

test("regression floor on the dev set (tuned on, so only a floor)", () => {
  const set = JSON.parse(fs.readFileSync(path.join(ROOT, "eval", "dev.json"), "utf8"));
  let inScope = 0, hit = 0, outScope = 0, refused = 0;
  for (const c of set.cases) {
    const r = core.ask(index, c.q);
    if (c.expect.length === 0) { outScope++; if (r.status === "refuse") refused++; }
    else { inScope++; if (r.hits.some((h) => c.expect.includes(h.id))) hit++; }
  }
  assert.ok(hit / inScope >= 0.9, "hit@3 " + hit + "/" + inScope);
  assert.strictEqual(refused, outScope);
});
