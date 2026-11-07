const test = require("node:test");
const assert = require("node:assert/strict");
const h = require("../assets/js/site-highlights.js");

test("stars are shortened like GitHub's", () => {
  assert.equal(h.stars(950), "950");
  assert.equal(h.stars(1600), "1.6k");
  assert.equal(h.stars(10000), "10k");
  assert.equal(h.stars(102243), "102k");
});

test("only links to our sites, GitHub and its image hosts are written into the page", () => {
  assert.equal(h.safeUrl("https://github.com/rook/rook/pull/1"), "https://github.com/rook/rook/pull/1");
  assert.equal(h.safeUrl("https://opengraph.githubassets.com/1/rook/rook/pull/1"), "https://opengraph.githubassets.com/1/rook/rook/pull/1");
  assert.equal(h.safeUrl("https://a-ryan-1.github.io/builds/p/x/"), "https://a-ryan-1.github.io/builds/p/x/");
  assert.equal(h.safeUrl("javascript:alert(1)"), null);
  assert.equal(h.safeUrl("https://evil.example/a"), null);
  assert.equal(h.safeUrl(undefined), null);
});

test("a repository link maps to its name whatever the trailing path", () => {
  assert.equal(h.repoKey("https://github.com/A-RYAN-1/node-connect"), "node-connect");
  assert.equal(h.repoKey("https://github.com/A-RYAN-1/node-connect/"), "node-connect");
  assert.equal(h.repoKey("nothing"), null);
});

test("builds summary is indexed by repository name", () => {
  const idx = h.indexBuilds({ all: [{ repo: "https://github.com/A-RYAN-1/todo-app-pern", url: "u" }, { repo: "bad" }] });
  assert.deepEqual(Object.keys(idx), ["todo-app-pern"]);
});

test("the proof line carries the counts", () => {
  assert.deepEqual(h.proofLine({ merged: 21, projects: 11, stars: 102243, inReview: 16 }), { merged: 21, projects: 11, stars: "102k", inReview: 16 });
});
