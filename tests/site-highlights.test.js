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

test("blog dates read like the card dates", () => {
  assert.equal(h.longDate("2026-11-01"), "Nov 1, 2026");
  assert.equal(h.longDate("2026-09-30"), "Sep 30, 2026");
});

test("post subtitles lose their Markdown marks", () => {
  assert.equal(h.plain("`size-4` is *not* 16 pixels"), "size-4 is not 16 pixels");
  assert.equal(h.plain(undefined), "");
});

test("blog items: newest first, only posts with a safe page link and a date", () => {
  const items = h.blogItems({
    all: [
      { title: "old", url: "https://a-ryan-1.github.io/blogs/p/old/", publishedAt: "2026-09-30" },
      { title: "bad link", url: "https://evil.example/x", publishedAt: "2026-11-01" },
      { title: "no date", url: "https://a-ryan-1.github.io/blogs/p/nd/" },
      { title: "new", url: "https://a-ryan-1.github.io/blogs/p/new/", publishedAt: "2026-11-01" },
      null,
    ],
  });
  assert.deepEqual(items.map((p) => p.title), ["new", "old"]);
  assert.deepEqual(h.blogItems({}), []);
});

test("the blog page lives in ?blog=n and leaves the rest of the query alone", () => {
  assert.equal(h.pageFromSearch("?blog=3", "blog"), 3);
  assert.equal(h.pageFromSearch("?oss=2&blog=3", "blog"), 3);
  assert.equal(h.pageFromSearch("?oss=2", "blog"), 1);
  assert.equal(h.searchWithPage("?oss=2&blog=3", "blog", 1), "?oss=2");
  assert.equal(h.searchWithPage("?oss=2", "blog", 4), "?oss=2&blog=4");
  assert.equal(h.searchWithPage("", "blog", 2), "?blog=2");
});

test("a project's filter category comes from its topics", () => {
  assert.equal(h.categoryFor({ topics: ["expo", "react-native", "firebase"] }), "app development");
  assert.equal(h.categoryFor({ topics: ["gin", "go", "react"] }), "web development");
  assert.equal(h.categoryFor({ topics: ["mediapipe", "opencv"] }), "others");
  assert.equal(h.categoryFor({}), "others");
});

test("only projects with a title and a safe case-study link are drawn, in the order given", () => {
  const items = h.projectItems({
    all: [
      { title: "A", url: "https://a-ryan-1.github.io/builds/p/a/" },
      { title: "B", url: "javascript:alert(1)" },
      { url: "https://a-ryan-1.github.io/builds/p/c/" },
      { title: "D", url: "https://a-ryan-1.github.io/builds/p/d/" },
    ],
  });
  assert.deepEqual(items.map((p) => p.title), ["A", "D"]);
  assert.deepEqual(h.projectItems({}), []);
});

test("the card line is the language then up to three topics", () => {
  assert.equal(h.projectLine({ language: "Go", topics: ["a", "b", "c", "d"] }), "Go, a, b, c");
  assert.equal(h.projectLine({ topics: ["x"] }), "x");
  assert.equal(h.projectLine({ language: "Python" }), "Python");
});
