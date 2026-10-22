const test = require("node:test");
const assert = require("node:assert");
const { cardMatches, resultLabel } = require("../assets/js/project-filter.js");

const kepler = { category: "open source", text: "kepler Go 1.6k stars 3 merged PRs" };
const fintech = { category: "web development", text: "fintech-fraud-detection Ruby Rails Postgres" };

test("all category with an empty query shows every card", () => {
  assert.ok(cardMatches(kepler, "all", ""));
  assert.ok(cardMatches(fintech, "all", "   "));
});

test("category filter hides other categories", () => {
  assert.ok(cardMatches(kepler, "open source", ""));
  assert.ok(!cardMatches(fintech, "open source", ""));
});

test("search is case-insensitive and matches any part of the card text", () => {
  assert.ok(cardMatches(kepler, "all", "GO"));
  assert.ok(cardMatches(fintech, "all", "postgres"));
  assert.ok(!cardMatches(kepler, "all", "postgres"));
});

test("every word must match, in any order", () => {
  assert.ok(cardMatches(kepler, "all", "merged go"));
  assert.ok(!cardMatches(kepler, "all", "go rails"));
});

test("search and category combine", () => {
  assert.ok(!cardMatches(kepler, "web development", "kepler"));
  assert.ok(cardMatches(fintech, "web development", "rails"));
});

test("result label covers none, one and many", () => {
  assert.strictEqual(resultLabel(0), "No projects match your search.");
  assert.strictEqual(resultLabel(1), "1 project shown");
  assert.strictEqual(resultLabel(5), "5 projects shown");
});
