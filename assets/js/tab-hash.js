// Maps a URL fragment to a tab and a Projects filter, and back.
// Kept free of the DOM so tests/tab-hash.test.js can run it in Node.
(function (root) {
  const TABS = ["about", "resume", "open-source", "projects", "blog", "contact"];
  const FILTERS = ["web development", "app development", "others"];

  // "#projects-web-development" -> { tab: "projects", category: "web development" }.
  // Links shared before the Portfolio tab was split keep working: "#portfolio" opens
  // Projects, "#portfolio-open-source" opens Open Source and "#portfolio-<filter>" opens
  // Projects with that filter. An unknown fragment falls back to the About tab.
  function parseHash(hash) {
    const name = String(hash || "").replace(/^#/, "").toLowerCase();
    if (TABS.includes(name)) return { tab: name, category: "all" };
    if (name === "portfolio") return { tab: "projects", category: "all" };
    if (name === "portfolio-open-source") return { tab: "open-source", category: "all" };
    for (const prefix of ["projects-", "portfolio-"]) {
      if (name.startsWith(prefix)) {
        const category = name.slice(prefix.length).replace(/-/g, " ");
        if (FILTERS.includes(category)) return { tab: "projects", category };
      }
    }
    return { tab: "about", category: "all" };
  }

  // The inverse: only the Projects tab carries a category.
  function buildHash(tab, category) {
    if (tab === "projects" && FILTERS.includes(category)) {
      return "#projects-" + category.replace(/ /g, "-");
    }
    return "#" + tab;
  }

  const api = { TABS, FILTERS, parseHash, buildHash };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.tabHash = api;
})(typeof window !== "undefined" ? window : globalThis);
