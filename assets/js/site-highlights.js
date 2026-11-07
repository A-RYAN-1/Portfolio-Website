// Fills the Open Source tab (paginated) and points the Projects cards at their case studies, from the two
// self-updating sites:
//   https://a-ryan-1.github.io/oss/summary.json     counts and every merged pull request, newest first
//   https://a-ryan-1.github.io/builds/summary.json  every project and its case-study page
// The Projects card pictures are the portfolio's own images in assets/images and are never swapped.
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

  var PAGE_SIZE = 6;

  function pageCount(total, size) {
    return Math.max(1, Math.ceil(total / (size || PAGE_SIZE)));
  }

  // Anything that is not a whole number from 1 up falls back to page 1; past the end it stops at the last page.
  function clampPage(n, pages) {
    n = parseInt(n, 10);
    if (!isFinite(n) || n < 1) return 1;
    return Math.min(n, pages);
  }

  function pageSlice(items, page, size) {
    size = size || PAGE_SIZE;
    var p = clampPage(page, pageCount(items.length, size));
    return items.slice((p - 1) * size, p * size);
  }

  // Page numbers to show, 0 standing for a gap: 1 2 3, or 1 ... 4 5 6 ... 9.
  function pageWindow(page, pages) {
    var out = [];
    var last = 0;
    for (var n = 1; n <= pages; n++) {
      if (pages <= 7 || n === 1 || n === pages || Math.abs(n - page) <= 1 || (page <= 3 && n <= 4) || (page >= pages - 2 && n >= pages - 3)) {
        if (n - last > 1) out.push(0);
        out.push(n);
        last = n;
      }
    }
    return out;
  }

  // The page lives in the query string (?oss=2) so the #open-source tab hash keeps working.
  function pageFromSearch(search, key) {
    var m = new RegExp("[?&]" + key + "=([^&#]*)").exec(String(search || ""));
    return m ? clampPage(m[1], Infinity) : 1;
  }

  function searchWithPage(search, key, page) {
    var rest = String(search || "")
      .replace(/^\?/, "")
      .split("&")
      .filter(function (kv) {
        return kv && kv.split("=")[0] !== key;
      });
    if (page > 1) rest.push(key + "=" + page);
    return rest.length ? "?" + rest.join("&") : "";
  }

  var api = {
    stars: stars,
    month: month,
    safeUrl: safeUrl,
    proofLine: proofLine,
    repoKey: repoKey,
    indexBuilds: indexBuilds,
    PAGE_SIZE: PAGE_SIZE,
    pageCount: pageCount,
    clampPage: clampPage,
    pageSlice: pageSlice,
    pageWindow: pageWindow,
    pageFromSearch: pageFromSearch,
    searchWithPage: searchWithPage,
  };
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
    var items = (s.all || s.latest || []).filter(function (pr) {
      return safeUrl(pr.url);
    });
    var nav = document.querySelector("[data-oss-pager]");
    var status = document.querySelector("[data-oss-status]");
    var page = pageFromSearch(location.search, "oss");

    function card(pr) {
      var li = el("li", "project-item active");
      var a = el("a");
      a.href = safeUrl(pr.url);
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
      // GitHub makes these preview cards on demand and sometimes fails; keep the card tidy if it does.
      img.addEventListener("error", function () {
        img.hidden = true;
        fig.classList.add("project-img-missing");
      });
      fig.appendChild(img);
      a.appendChild(fig);
      a.appendChild(el("h3", "project-title", pr.repo.split("/")[1] + " #" + pr.number));
      a.appendChild(el("p", "project-category", [pr.language, stars(pr.stars) + " stars", month(pr.mergedAt)].filter(Boolean).join(" · ")));
      li.appendChild(a);
      return li;
    }

    function pageLink(n, text, label) {
      var a = el("a", "oss-page", text);
      a.href = location.pathname + searchWithPage(location.search, "oss", n) + "#open-source";
      a.dataset.page = String(n);
      if (label) a.setAttribute("aria-label", label);
      return a;
    }

    function draw(move) {
      var pages = pageCount(items.length);
      page = clampPage(page, pages);
      list.textContent = "";
      pageSlice(items, page).forEach(function (pr) {
        list.appendChild(card(pr));
      });
      if (nav) {
        nav.textContent = "";
        nav.hidden = pages <= 1;
        if (pages > 1) {
          nav.appendChild(page > 1 ? pageLink(page - 1, "Previous") : el("span", "oss-page oss-page-off", "Previous"));
          var ol = el("ol", "oss-pages");
          pageWindow(page, pages).forEach(function (n) {
            var li = el("li");
            if (n === 0) {
              li.textContent = "…";
              li.setAttribute("aria-hidden", "true");
            } else {
              var a = pageLink(n, String(n), "Page " + n + (n === page ? ", current" : ""));
              if (n === page) a.setAttribute("aria-current", "page");
              li.appendChild(a);
            }
            ol.appendChild(li);
          });
          nav.appendChild(ol);
          nav.appendChild(page < pages ? pageLink(page + 1, "Next") : el("span", "oss-page oss-page-off", "Next"));
        }
      }
      if (status) {
        var from = (page - 1) * PAGE_SIZE;
        status.textContent = items.length ? "Showing " + (from + 1) + " to " + Math.min(from + PAGE_SIZE, items.length) + " of " + items.length + " merged pull requests" : "";
      }
      if (move) list.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function go(n, push) {
      page = n;
      if (push) history.pushState(null, "", location.pathname + searchWithPage(location.search, "oss", n) + "#open-source");
      draw(push);
    }

    if (nav)
      nav.addEventListener("click", function (e) {
        var a = e.target.closest ? e.target.closest("a[data-page]") : null;
        if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        go(parseInt(a.dataset.page, 10), true);
      });
    window.addEventListener("popstate", function () {
      page = pageFromSearch(location.search, "oss");
      draw(false);
    });
    draw(false);
  }

  // The cards keep the portfolio's own pictures; only the link changes, to the project's case study.
  function renderProjects(s) {
    var by = indexBuilds(s);
    document.querySelectorAll('[data-page="projects"] .project-item > a').forEach(function (a) {
      var p = by[repoKey(a.getAttribute("href"))];
      var page = p && safeUrl(p.url);
      if (page) a.href = page;
    });
  }

  function run() {
    getJson(OSS).then(renderOss).catch(function () {});
    getJson(BUILDS).then(renderProjects).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})(typeof window !== "undefined" ? window : globalThis);
