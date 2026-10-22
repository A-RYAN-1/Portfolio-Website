// Decides which Portfolio cards are visible for a category and a search query.
// Kept free of the DOM so tests/project-filter.test.js can run it in Node.
(function (root) {
  function tokens(query) {
    return query.toLowerCase().split(/\s+/).filter(Boolean);
  }

  // A card matches when its category fits and every search word appears in its text.
  function cardMatches(card, category, query) {
    const categoryOk = category === "all" || card.category === category;
    const text = card.text.toLowerCase();
    return categoryOk && tokens(query).every((word) => text.includes(word));
  }

  function resultLabel(count) {
    if (count === 0) return "No projects match your search.";
    return count === 1 ? "1 project shown" : count + " projects shown";
  }

  const api = { cardMatches, resultLabel };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.projectFilter = api;
})(typeof window !== "undefined" ? window : globalThis);
