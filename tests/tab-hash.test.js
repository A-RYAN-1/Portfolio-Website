const test = require("node:test");
const assert = require("node:assert");
const { parseHash, buildHash } = require("../assets/js/tab-hash.js");

test("each tab hash opens that tab", () => {
  for (const tab of ["about", "resume", "portfolio", "blog", "contact"]) {
    assert.deepStrictEqual(parseHash("#" + tab), { tab, category: "all" });
  }
});

test("hashes are case-insensitive and work without the leading #", () => {
  assert.strictEqual(parseHash("#Resume").tab, "resume");
  assert.strictEqual(parseHash("blog").tab, "blog");
});

test("empty and unknown hashes fall back to About", () => {
  for (const hash of ["", "#", "#nope", "#portfolio-nope", undefined]) {
    assert.deepStrictEqual(parseHash(hash), { tab: "about", category: "all" });
  }
});

test("portfolio hashes carry a filter", () => {
  assert.deepStrictEqual(parseHash("#portfolio-open-source"), { tab: "portfolio", category: "open source" });
  assert.deepStrictEqual(parseHash("#portfolio-web-development"), { tab: "portfolio", category: "web development" });
  assert.deepStrictEqual(parseHash("#portfolio-others"), { tab: "portfolio", category: "others" });
});

test("buildHash is the inverse of parseHash", () => {
  assert.strictEqual(buildHash("resume", "all"), "#resume");
  assert.strictEqual(buildHash("portfolio", "all"), "#portfolio");
  assert.strictEqual(buildHash("portfolio", "open source"), "#portfolio-open-source");
  assert.strictEqual(buildHash("blog", "open source"), "#blog");
  for (const hash of ["#about", "#portfolio", "#portfolio-open-source", "#portfolio-app-development"]) {
    const { tab, category } = parseHash(hash);
    assert.strictEqual(buildHash(tab, category), hash);
  }
});
