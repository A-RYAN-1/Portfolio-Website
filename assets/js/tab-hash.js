// Maps a URL fragment to a tab and a Portfolio filter, and back.
// Kept free of the DOM so tests/tab-hash.test.js can run it in Node.
(function (root) {
  const TABS = ["about", "resume", "portfolio", "blog", "contact"];
  const FILTERS = ["open source", "web development", "app development", "others"];

  // "#portfolio-open-source" -> { tab: "portfolio", category: "open source" }.
  // An unknown fragment falls back to the About tab with the "all" category.
  function parseHash(hash) {
    const name = String(hash || "").replace(/^#/, "").toLowerCase();
    if (TABS.includes(name)) return { tab: name, category: "all" };
    if (name.startsWith("portfolio-")) {
      const category = name.slice("portfolio-".length).replace(/-/g, " ");
      if (FILTERS.includes(category)) return { tab: "portfolio", category };
    }
    return { tab: "about", category: "all" };
  }

  // The inverse: only the Portfolio tab carries a category.
  function buildHash(tab, category) {
    if (tab === "portfolio" && FILTERS.includes(category)) {
      return "#portfolio-" + category.replace(/ /g, "-");
    }
    return "#" + tab;
  }

  const api = { TABS, FILTERS, parseHash, buildHash };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.tabHash = api;
})(typeof window !== "undefined" ? window : globalThis);
