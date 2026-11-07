// Fills the Open Source tab and refreshes the Projects cards from the two self-updating sites:
//   https://a-ryan-1.github.io/oss/summary.json     counts and the latest merged pull requests
//   https://a-ryan-1.github.io/builds/summary.json  every project with a fresh screenshot of its live site
// Nothing here is hand-kept. If a request fails, the page keeps its static text and the link to the full site.
// Kept free of the DOM where possible so tests/site-highlights.test.js can run it in Node.
(function (root) {
  var OSS = "https://a-ryan-1.github.io/oss/summary.json";
  var BUILDS = "https://a-ryan-1.github.io/builds/summary.json";

  function stars(n) {
    if (n >= 1000) return (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k";
    return String(n);
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function month(iso) {
    var d = new Date(iso);
    return MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }

  // Only https links to the two sites, GitHub and its image hosts are ever written into the page.
  function safeUrl(u) {
    return typeof u === "string" && /^https:\/\/(a-ryan-1\.github\.io|github\.com|opengraph\.githubassets\.com|avatars\.githubusercontent\.com)\//.test(u) ? u : null;
  }

  function proofLine(s) {
    return {
      merged: s.merged,
      projects: s.projects,
      stars: stars(s.stars),
      inReview: s.inReview,
    };
  }

  // "https://github.com/A-RYAN-1/node-connect" and ".../node-connect/" both map to "node-connect".
  function repoKey(url) {
    var m = /github\.com\/[^/]+\/([^/?#]+)/.exec(String(url || ""));
    return m ? m[1].toLowerCase() : null;
  }

  function indexBuilds(summary) {
    var out = {};
    (summary.all || []).forEach(function (p) {
      var k = repoKey(p.repo);
      if (k) out[k] = p;
    });
    return out;
  }

  var api = { stars: stars, month: month, safeUrl: safeUrl, proofLine: proofLine, repoKey: repoKey, indexBuilds: indexBuilds };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.siteHighlights = api;

  if (typeof document === "undefined") return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function getJson(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
  }

  function renderOss(s) {
    var line = document.querySelector("[data-oss-proof]");
    if (line) {
      var p = proofLine(s);
      line.textContent = "";
      [
        [p.merged, " merged pull requests in "],
        [p.projects, " projects with "],
        [p.stars, " GitHub stars combined"],
      ].forEach(function (pair) {
        line.appendChild(el("strong", null, String(pair[0])));
        line.appendChild(document.createTextNode(pair[1]));
      });
      if (p.inReview) line.appendChild(document.createTextNode(", and " + p.inReview + " more in review. Newest merges first."));
      else line.appendChild(document.createTextNode(". Newest merges first."));
    }
    var list = document.querySelector("[data-oss-latest]");
    if (!list) return;
    list.textContent = "";
    (s.latest || []).forEach(function (pr) {
      var href = safeUrl(pr.url);
      if (!href) return;
      var li = el("li", "project-item active");
      var a = el("a");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      var fig = el("figure", "project-img");
      var box = el("div", "project-item-icon-box");
      var icon = document.createElement("ion-icon");
      icon.setAttribute("name", "eye-outline");
      box.appendChild(icon);
      fig.appendChild(box);
      var img = el("img");
      var src = safeUrl(pr.image);
      if (src) img.src = src;
      img.alt = pr.repo + " #" + pr.number + ": " + pr.title;
      img.loading = "lazy";
      fig.appendChild(img);
      a.appendChild(fig);
      a.appendChild(el("h3", "project-title", pr.repo.split("/")[1] + " #" + pr.number));
      a.appendChild(el("p", "project-category", [pr.language, stars(pr.stars) + " stars", month(pr.mergedAt)].filter(Boolean).join(" · ")));
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function renderProjects(s) {
    var by = indexBuilds(s);
    document.querySelectorAll('[data-page="projects"] .project-item > a').forEach(function (a) {
      var p = by[repoKey(a.getAttribute("href"))];
      if (!p) return;
      var page = safeUrl(p.url);
      var image = safeUrl(p.image);
      if (page) a.href = page;
      var img = a.querySelector("img");
      if (img && image) {
        img.src = image;
        img.alt = p.title + ", live home page";
      }
    });
  }

  function run() {
    getJson(OSS).then(renderOss).catch(function () {});
    getJson(BUILDS).then(renderProjects).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})(typeof window !== "undefined" ? window : globalThis);
