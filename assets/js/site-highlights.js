// Fills the Open Source tab and the Blog tab (both paginated) and points the Projects cards at their case
// studies, from three self-updating sites:
//   https://a-ryan-1.github.io/oss/summary.json     counts and every merged pull request, newest first
//   https://a-ryan-1.github.io/builds/summary.json  every project and its case-study page
//   https://a-ryan-1.github.io/blogs/summary.json   every published post, newest first
// The Projects tab is drawn from the builds summary (title, one line, language, topics, case-study link). A card
// keeps the portfolio's own picture when the static fallback had one for that repository, else the site's image.
// Nothing here is hand-kept. If a request fails, the page keeps its static text and the link to the full site.
// Kept free of the DOM where possible so tests/site-highlights.test.js can run it in Node.
(function (root) {
  var OSS = "https://a-ryan-1.github.io/oss/summary.json";
  var BUILDS = "https://a-ryan-1.github.io/builds/summary.json";
  var BLOGS = "https://a-ryan-1.github.io/blogs/summary.json";

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

  // The Projects filter has three buttons. Mobile apps are "app development", anything with a web stack is
  // "web development", the rest (libraries, scripts, vision tools) is "others".
  var WEB = /^(react|nextjs|next-js|express|rails|ruby-on-rails|gin|fastapi|vue|svelte|astro|pern|nodejs|node-js|web3|frontend)$/;
  var MOBILE = /^(expo|react-native|android|ios|flutter)$/;
  function categoryFor(p) {
    var topics = (p && p.topics) || [];
    if (topics.some(function (t) { return MOBILE.test(t); })) return "app development";
    if (topics.some(function (t) { return WEB.test(t); })) return "web development";
    return "others";
  }

  // Projects with a safe case-study link, in the order the builds site gives (its manifests set the order).
  function projectItems(summary) {
    return (summary.all || []).filter(function (p) {
      return p && p.title && safeUrl(p.url);
    });
  }

  // "TypeScript, gin, go, postgresql": language first, then up to three topics.
  function projectLine(p) {
    return [p.language].concat((p.topics || []).slice(0, 3)).filter(Boolean).join(", ");
  }

  var PAGE_SIZE = 6;
  // The Blog tab shows two cards across, so a page is one row.
  var BLOG_PAGE_SIZE = 2;

  // A project with no picture of its own gets one of the generic pictures the other cards use, in turn,
  // instead of the site's text-only share image, so every row has the same picture shape.
  var GENERIC_PICTURES = ["./assets/images/project-1.jpg", "./assets/images/project-3.jpg", "./assets/images/project-4.png"];
  function genericPicture(n) {
    return GENERIC_PICTURES[n % GENERIC_PICTURES.length];
  }

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

  // "2026-11-01" -> "Nov 1, 2026".
  function longDate(iso) {
    var d = new Date(iso);
    return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear();
  }

  // Post subtitles come from Markdown front matter; show them without the inline marks.
  function plain(s) {
    return String(s == null ? "" : s).replace(/[`*]/g, "");
  }

  // Posts with a safe page link, newest first, whatever order the summary came in.
  function blogItems(summary) {
    return (summary.all || summary.latest || [])
      .filter(function (p) {
        return p && safeUrl(p.url) && p.title && /^\d{4}-\d{2}-\d{2}$/.test(String(p.publishedAt));
      })
      .sort(function (a, b) {
        return a.publishedAt < b.publishedAt ? 1 : a.publishedAt > b.publishedAt ? -1 : 0;
      });
  }

  // The page lives in the query string (?oss=2, ?blog=2) so the #open-source tab hash keeps working.
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
    categoryFor: categoryFor,
    projectItems: projectItems,
    projectLine: projectLine,
    month: month,
    longDate: longDate,
    plain: plain,
    blogItems: blogItems,
    safeUrl: safeUrl,
    proofLine: proofLine,
    repoKey: repoKey,
    indexBuilds: indexBuilds,
    PAGE_SIZE: PAGE_SIZE,
    BLOG_PAGE_SIZE: BLOG_PAGE_SIZE,
    genericPicture: genericPicture,
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

  // Paginates `items` into `list`, one makeCard(item) each, with the pager in `nav` and a spoken status in
  // `status`. The page lives in ?<key>=<n> and the tab hash stays, so page links, Back and #<hash> all work.
  function mountPager(o) {
    var list = o.list;
    var nav = o.nav;
    var status = o.status;
    var items = o.items;
    var page = pageFromSearch(location.search, o.key);
    var size = o.size || PAGE_SIZE;

    function pageLink(n, text, label) {
      var a = el("a", "oss-page", text);
      a.href = location.pathname + searchWithPage(location.search, o.key, n) + "#" + o.hash;
      a.dataset.page = String(n);
      if (label) a.setAttribute("aria-label", label);
      return a;
    }

    function draw(move) {
      var pages = pageCount(items.length, size);
      page = clampPage(page, pages);
      list.textContent = "";
      pageSlice(items, page, size).forEach(function (item) {
        list.appendChild(o.makeCard(item));
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
        var from = (page - 1) * size;
        status.textContent = items.length ? "Showing " + (from + 1) + " to " + Math.min(from + size, items.length) + " of " + items.length + " " + o.label : "";
      }
      if (move) list.scrollIntoView({ block: "start", behavior: "smooth" });
    }

    function go(n, push) {
      page = n;
      if (push) history.pushState(null, "", location.pathname + searchWithPage(location.search, o.key, n) + "#" + o.hash);
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
      page = pageFromSearch(location.search, o.key);
      draw(false);
    });
    draw(false);
  }

  function ossCard(pr) {
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

  function blogCard(p) {
    var li = el("li", "blog-post-item");
    var a = el("a");
    a.href = safeUrl(p.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    var fig = el("figure", "blog-banner-box");
    var img = el("img");
    var src = safeUrl(p.coverDark || p.cover);
    if (src) img.src = src;
    img.alt = p.coverAlt || "";
    img.loading = "lazy";
    fig.appendChild(img);
    a.appendChild(fig);
    var body = el("div", "blog-content");
    var meta = el("div", "blog-meta");
    meta.appendChild(el("p", "blog-category", p.category));
    meta.appendChild(el("span", "dot"));
    var t = el("time", null, longDate(p.publishedAt));
    t.setAttribute("datetime", p.publishedAt);
    meta.appendChild(t);
    body.appendChild(meta);
    body.appendChild(el("h3", "h3 blog-item-title", p.title));
    body.appendChild(el("p", "blog-text", plain(p.subtitle)));
    a.appendChild(body);
    li.appendChild(a);
    return li;
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
    mountPager({
      list: list,
      nav: document.querySelector("[data-oss-pager]"),
      status: document.querySelector("[data-oss-status]"),
      items: (s.all || s.latest || []).filter(function (pr) {
        return safeUrl(pr.url);
      }),
      key: "oss",
      hash: "open-source",
      label: "merged pull requests",
      makeCard: ossCard,
    });
  }

  // The static cards in index.html are only the fallback for a failed request; a good one replaces them.
  function renderBlog(s) {
    var list = document.querySelector("[data-blog-list]");
    if (!list) return;
    var items = blogItems(s);
    if (!items.length) return;
    mountPager({
      list: list,
      nav: document.querySelector("[data-blog-pager]"),
      status: document.querySelector("[data-blog-status]"),
      items: items,
      key: "blog",
      hash: "blog",
      size: BLOG_PAGE_SIZE,
      label: "posts",
      makeCard: blogCard,
    });
  }

  var nextGeneric = 0;

  function projectCard(p, localImage) {
    var li = el("li", "project-item active");
    li.setAttribute("data-filter-item", "");
    li.dataset.category = categoryFor(p);
    var a = el("a");
    a.href = safeUrl(p.url);
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    var fig = el("figure", "project-img");
    var box = el("div", "project-item-icon-box");
    var icon = document.createElement("ion-icon");
    icon.setAttribute("name", "eye-outline");
    box.appendChild(icon);
    fig.appendChild(box);
    var img = el("img");
    var src = localImage || genericPicture(nextGeneric++);
    if (src) img.src = src;
    img.alt = p.title + (p.tagline ? ": " + plain(p.tagline) : "");
    img.loading = "lazy";
    fig.appendChild(img);
    a.appendChild(fig);
    a.appendChild(el("h3", "project-title", p.title));
    a.appendChild(el("p", "project-category", projectLine(p)));
    li.appendChild(a);
    return li;
  }

  // The static cards in index.html are only the fallback for a failed request; a good one replaces them.
  function renderProjects(s) {
    var items = projectItems(s);
    var list = document.querySelector('[data-page="projects"] .project-list');
    if (!list || !items.length) return;
    var pictures = {};
    list.querySelectorAll(".project-item > a").forEach(function (a) {
      var img = a.querySelector("img");
      var k = repoKey(a.getAttribute("href"));
      if (k && img) pictures[k] = img.getAttribute("src");
    });
    list.textContent = "";
    nextGeneric = 0;
    items.forEach(function (p) {
      list.appendChild(projectCard(p, pictures[repoKey(p.repo)]));
    });
    document.dispatchEvent(new CustomEvent("projects:rendered"));
  }

  function run() {
    getJson(OSS).then(renderOss).catch(function () {});
    getJson(BUILDS).then(renderProjects).catch(function () {});
    getJson(BLOGS).then(renderBlog).catch(function () {});
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})(typeof window !== "undefined" ? window : globalThis);
