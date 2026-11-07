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

test("pages: count, clamp and slice", () => {
  assert.equal(h.pageCount(0), 1);
  assert.equal(h.pageCount(6), 1);
  assert.equal(h.pageCount(7), 2);
  assert.equal(h.pageCount(21), 4);
  assert.equal(h.clampPage("2", 4), 2);
  assert.equal(h.clampPage("0", 4), 1);
  assert.equal(h.clampPage("-3", 4), 1);
  assert.equal(h.clampPage("abc", 4), 1);
  assert.equal(h.clampPage("99", 4), 4);
  const items = Array.from({ length: 14 }, (_, i) => i + 1);
  assert.deepEqual(h.pageSlice(items, 1), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(h.pageSlice(items, 3), [13, 14]);
  assert.deepEqual(h.pageSlice(items, 99), [13, 14]);
  assert.deepEqual(h.pageSlice([], 1), []);
});

test("page window keeps the ends and the neighbours, with gaps as 0", () => {
  assert.deepEqual(h.pageWindow(1, 4), [1, 2, 3, 4]);
  assert.deepEqual(h.pageWindow(5, 10), [1, 0, 4, 5, 6, 0, 10]);
  assert.deepEqual(h.pageWindow(1, 10), [1, 2, 3, 4, 0, 10]);
  assert.deepEqual(h.pageWindow(10, 10), [1, 0, 7, 8, 9, 10]);
});

test("the page is kept in the query string and leaves other parameters alone", () => {
  assert.equal(h.pageFromSearch("", "oss"), 1);
  assert.equal(h.pageFromSearch("?oss=3", "oss"), 3);
  assert.equal(h.pageFromSearch("?x=1&oss=2", "oss"), 2);
  assert.equal(h.pageFromSearch("?oss=junk", "oss"), 1);
  assert.equal(h.searchWithPage("", "oss", 2), "?oss=2");
  assert.equal(h.searchWithPage("?oss=2", "oss", 1), "");
  assert.equal(h.searchWithPage("?x=1&oss=2", "oss", 3), "?x=1&oss=3");
});
