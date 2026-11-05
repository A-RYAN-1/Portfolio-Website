const test = require("node:test");
const assert = require("node:assert");
const { parseHash, buildHash } = require("../assets/js/tab-hash.js");

test("each tab hash opens that tab", () => {
  for (const tab of ["about", "resume", "open-source", "projects", "blog", "contact"]) {
    assert.deepStrictEqual(parseHash("#" + tab), { tab, category: "all" });
  }
});

test("hashes are case-insensitive and work without the leading #", () => {
  assert.strictEqual(parseHash("#Resume").tab, "resume");
  assert.strictEqual(parseHash("blog").tab, "blog");
  assert.strictEqual(parseHash("#Open-Source").tab, "open-source");
});

test("empty and unknown hashes fall back to About", () => {
  for (const hash of ["", "#", "#nope", "#projects-nope", "#portfolio-nope", "#projects-open-source", undefined]) {
    assert.deepStrictEqual(parseHash(hash), { tab: "about", category: "all" });
  }
});

test("projects hashes carry a filter", () => {
  assert.deepStrictEqual(parseHash("#projects-web-development"), { tab: "projects", category: "web development" });
  assert.deepStrictEqual(parseHash("#projects-app-development"), { tab: "projects", category: "app development" });
  assert.deepStrictEqual(parseHash("#projects-others"), { tab: "projects", category: "others" });
});

test("links shared before the split still land on the right tab", () => {
  assert.deepStrictEqual(parseHash("#portfolio"), { tab: "projects", category: "all" });
  assert.deepStrictEqual(parseHash("#portfolio-open-source"), { tab: "open-source", category: "all" });
  assert.deepStrictEqual(parseHash("#portfolio-web-development"), { tab: "projects", category: "web development" });
  assert.deepStrictEqual(parseHash("#portfolio-others"), { tab: "projects", category: "others" });
});

test("buildHash is the inverse of parseHash", () => {
  assert.strictEqual(buildHash("resume", "all"), "#resume");
  assert.strictEqual(buildHash("projects", "all"), "#projects");
  assert.strictEqual(buildHash("projects", "web development"), "#projects-web-development");
  assert.strictEqual(buildHash("open-source", "web development"), "#open-source");
  assert.strictEqual(buildHash("blog", "others"), "#blog");
  for (const hash of ["#about", "#open-source", "#projects", "#projects-others", "#projects-app-development"]) {
    const { tab, category } = parseHash(hash);
    assert.strictEqual(buildHash(tab, category), hash);
  }
});
