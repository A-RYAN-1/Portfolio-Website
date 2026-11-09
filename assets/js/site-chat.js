// The "Ask about my work" box on the About tab. It indexes the page's own cards plus the three self-updating
// summaries (open source, projects, blog), then answers with quoted cards and links. See site-chat-core.js.
(function () {
  "use strict";
  var SOURCES = {
    oss: "https://a-ryan-1.github.io/oss/summary.json",
    builds: "https://a-ryan-1.github.io/builds/summary.json",
    blogs: "https://a-ryan-1.github.io/blogs/summary.json",
  };
  var form = document.querySelector("[data-site-chat-form]");
  if (!form || !window.siteChatCore) return;
  var input = form.querySelector("input");
  var out = document.querySelector("[data-site-chat-answer]");
  var core = window.siteChatCore;

  function chunks() {
    var list = [];
    document.querySelectorAll("[data-chat-chunk]").forEach(function (el) {
      list.push({ id: el.dataset.chatChunk, title: el.dataset.chatTitle || "", text: core.plain(el.textContent) });
    });
    return list;
  }

  function getJson(url) {
    return fetch(url, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  // Built on the first question, so a visitor who never asks costs three requests fewer.
  var indexPromise = null;
  function index() {
    if (!indexPromise) {
      indexPromise = Promise.all([getJson(SOURCES.oss), getJson(SOURCES.builds), getJson(SOURCES.blogs)]).then(function (r) {
        return core.buildIndex(core.buildDocs({ chunks: chunks(), oss: r[0], builds: r[1], blogs: r[2] }));
      });
    }
    return indexPromise;
  }

  function safeHref(u) {
    return /^#[a-z-]+$/.test(u) || /^https:\/\/(a-ryan-1\.github\.io|github\.com|medium\.com)\//.test(u) ? u : null;
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function render(result) {
    out.textContent = "";
    if (result.status === "refuse") {
      out.appendChild(el("p", "site-chat-refusal", "This site does not say anything about that, so I will not guess. Try a project, a technology, a blog post or an open-source repository by name."));
      return;
    }
    out.appendChild(el("p", "site-chat-lead", "From this site:"));
    var list = el("ul", "site-chat-hits");
    result.hits.forEach(function (h) {
      var li = el("li", "site-chat-hit");
      var href = safeHref(h.url);
      var title = href ? el("a", "text-link", h.title) : el("strong", "", h.title);
      if (href) {
        title.href = href;
        if (href.charAt(0) !== "#") {
          title.target = "_blank";
          title.rel = "noopener noreferrer";
        }
      }
      li.appendChild(title);
      li.appendChild(el("span", "site-chat-tab", " " + h.tab));
      li.appendChild(el("p", "site-chat-snippet", h.snippet));
      list.appendChild(li);
    });
    out.appendChild(list);
  }

  function ask(q) {
    q = q.trim();
    if (!q) return;
    out.textContent = "Looking through the site...";
    index().then(function (ix) {
      render(core.ask(ix, q));
    });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    ask(input.value);
  });
  document.querySelectorAll("[data-site-chat-suggest]").forEach(function (b) {
    b.addEventListener("click", function () {
      input.value = b.textContent;
      ask(b.textContent);
    });
  });
})();
