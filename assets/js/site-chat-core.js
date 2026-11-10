// Retrieval over the site's own content, with no model and no server.
//
// A question is matched against the cards the site shows (About text, services, certifications, projects, blog
// posts, open-source contributions) with BM25. The answer is the best matching cards, quoted and linked, or a
// refusal when the question asks for terms the site never uses. Nothing is generated, so nothing outside the
// site can appear in an answer. Kept free of the DOM so tests/site-chat-core.test.js and eval/run.js run it in Node.
(function (root) {
  var OSS_SITE = "https://a-ryan-1.github.io/oss/";

  // Words that carry no topic. "work", "built" and "experience" are in the list on purpose: nearly every question
  // about a portfolio contains them, and they would otherwise make any question look answerable.
  var STOP = new Set(
    ("a an the and or but if then so of to in on at by for from with without about into over under as is are was were be been being " +
      "am do does did done has have had having it its this that these those there here he him his she her they them their i me my you your " +
      "we our who whom whose what which when where why how can could should would will shall may might must not no yes any some all " +
      "much more most other such than too very also just only tell show give list know knows read see find get got let please " +
      "aryan deshmukh work worked works working built build made make experience experiences kind like want need ever still " +
      "use using used today now currently anything something everything look first last new good best " +
      "hire hiring should recommend problem problems browser think thing things way").split(" "),
  );

  // Spellings that mean the same thing on this site.
  var SYNONYMS = {
    golang: "go",
    postgres: "postgresql",
    psql: "postgresql",
    k8s: "kubernetes",
    pr: "pull",
    prs: "pull",
    oss: "open",
    ml: "machine",
    ai: "machine",
    js: "javascript",
    ts: "typescript",
    rails: "rails",
    ror: "rails",
    articles: "post",
    article: "post",
    blogs: "post",
    blog: "post",
    wrote: "post",
    written: "post",
    writes: "post",
    posts: "post",
    app: "application",
    apps: "application",
    mobile: "application",
    contribution: "contribut",
    contributions: "contribut",
    contributed: "contribut",
    contribute: "contribut",
    contributor: "contribut",
    many: "count",
    total: "count",
    number: "count",
    blockchain: "web3",
    repo: "project",
    repos: "project",
    repository: "project",
    repositories: "project",
    patch: "contribut",
    patches: "contribut",
    change: "contribut",
    changes: "contribut",
    upstream: "open",
    accepted: "merged",
    deployed: "live",
    hosted: "live",
    configuration: "config",
    town: "city",
    cv: "resume",
    tests: "test",
    testing: "test",
  };

  function stem(w) {
    if (SYNONYMS[w]) return SYNONYMS[w];
    if (w.length > 5 && w.endsWith("ing")) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith("ies")) w = w.slice(0, -3) + "y";
    else if (w.length > 4 && w.endsWith("ed")) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith("es") && /(ch|sh|x|ss)es$/.test(w)) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) w = w.slice(0, -1);
    return SYNONYMS[w] || w;
  }

  // Multi-word phrases a visitor might use for what a card names with a tool.
  var PHRASES = [[/computer vision/g, "opencv mediapipe"], [/machine learning/g, "machine"], [/open[- ]source/g, "open source"]];

  function tokenize(text, keepStop) {
    var lowered = String(text || "").toLowerCase();
    PHRASES.forEach(function (p) {
      lowered = lowered.replace(p[0], p[1]);
    });
    var raw = lowered.match(/[a-z0-9]+/g) || [];
    var out = [];
    for (var i = 0; i < raw.length; i++) {
      if (!keepStop && STOP.has(raw[i])) continue;
      out.push(stem(raw[i]));
    }
    return out;
  }

  function plain(html) {
    return String(html || "")
      .replace(/<[^>]*>/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim();
  }

  // One document per card. `chunks` are the About-side cards read from the page: [{id, title, text}].
  function buildDocs(input) {
    var docs = [];
    (input.chunks || []).forEach(function (c) {
      var kind = /^cert-/.test(c.id)
        ? "certification achievement"
        : /^service-/.test(c.id)
          ? "skills area service"
          : c.id === "location"
            ? "based located lives city"
            : c.id === "role"
              ? "job title position role"
              : "about";
      docs.push({ id: c.id, title: c.title, text: c.text, extra: kind, url: "#about", tab: "About" });
    });

    var oss = input.oss;
    if (oss) {
      docs.push({
        id: "stat:oss",
        title: "Open source in numbers",
        text:
          oss.merged + " pull requests merged across " + oss.projects + " open-source projects with " + oss.stars +
          " combined stars, and " + oss.inReview + " more in review.",
        extra: "open source contribution count total how many",
        url: "#open-source",
        tab: "Open Source",
      });
      var byRepo = {};
      var order = [];
      (oss.all || []).forEach(function (pr) {
        if (!byRepo[pr.repo]) {
          byRepo[pr.repo] = { repo: pr.repo, language: pr.language, stars: pr.stars, titles: [] };
          order.push(pr.repo);
        }
        byRepo[pr.repo].titles.push(pr.title);
      });
      var described = {};
      (oss.top || []).forEach(function (t) {
        described[t.name] = t;
      });
      order.forEach(function (repo) {
        var r = byRepo[repo];
        var d = described[repo];
        docs.push({
          id: "oss:" + repo,
          title: repo,
          text:
            r.titles.length + " merged pull request" + (r.titles.length === 1 ? "" : "s") + " in " + repo +
            (r.language ? " (" + r.language + ")" : "") + ": " + r.titles.join("; ") + "." +
            (d && d.description ? " " + d.description : ""),
          extra: "open source contribution",
          url: d ? d.url : OSS_SITE,
          tab: "Open Source",
        });
      });
    }

    var builds = input.builds;
    if (builds) {
      docs.push({
        id: "stat:builds",
        title: "Projects in numbers",
        text: builds.projects + " projects built, " + builds.live + " of them live.",
        extra: "project count total how many",
        url: "#projects",
        tab: "Projects",
      });
      (builds.all || []).forEach(function (p) {
        docs.push({
          id: "project:" + p.name,
          title: p.title,
          text:
            p.tagline.replace(/.?$/, ".") + " Language: " + p.language + ". Topics: " + (p.topics || []).join(", ") + "." +
            (p.live ? " A live demo is hosted." : ""),
          extra: "project " + (p.kind || ""),
          url: p.url,
          tab: "Projects",
        });
      });
    }

    var blogs = input.blogs;
    if (blogs) {
      docs.push({
        id: "stat:blog",
        title: "Blog in numbers",
        text: blogs.posts + " blog posts published on Medium, about " + (blogs.all || []).map(function (p) { return p.category; }).join(", ") + ".",
        extra: "blog articles writing count total how many",
        url: "#blog",
        tab: "Blog",
      });
      (blogs.all || []).forEach(function (p) {
        docs.push({
          id: "post:" + p.slug,
          title: p.title,
          text: p.subtitle + " Category: " + p.category + ". Published " + p.publishedAt + ".",
          extra: "blog post article",
          url: p.url,
          tab: "Blog",
        });
      });
    }

    docs.push({
      id: "tab:resume",
      title: "Resume",
      text: "The current resume as a PDF, shown on the Resume tab and downloadable.",
      extra: "resume cv download",
      url: "#resume",
      tab: "Resume",
    });
    return docs;
  }

  var K1 = 1.2;
  var B = 0.75;

  function buildIndex(docs) {
    var tf = [];
    var len = [];
    var df = {};
    docs.forEach(function (d, i) {
      // The title counts twice; `extra` holds the card's kind in plain words ("blog post", "open source").
      var toks = tokenize(d.title + " " + d.title + " " + d.text + " " + (d.extra || ""), true).filter(function (t) { return !STOP.has(t); });
      var counts = {};
      toks.forEach(function (t) {
        counts[t] = (counts[t] || 0) + 1;
      });
      tf[i] = counts;
      len[i] = toks.length;
      Object.keys(counts).forEach(function (t) {
        df[t] = (df[t] || 0) + 1;
      });
    });
    var n = docs.length;
    var avg = len.reduce(function (a, b) { return a + b; }, 0) / (n || 1);
    function idf(t) {
      var f = df[t] || 0;
      return Math.log(1 + (n - f + 0.5) / (f + 0.5));
    }
    return { docs: docs, tf: tf, len: len, avg: avg, df: df, idf: idf, n: n };
  }

  // A question is answered only when the best card holds at least this share of the question's weight
  // (weight = idf of each topic word; a word the site never uses has the highest weight and is never held).
  var MIN_COVERAGE = 0.45;

  function snippet(doc, terms) {
    var sentences = doc.text.split(/(?<=[.!?])\s+/);
    var best = sentences[0] || body;
    var bestScore = -1;
    sentences.forEach(function (s) {
      var toks = new Set(tokenize(s));
      var score = 0;
      terms.forEach(function (t) {
        if (toks.has(t)) score++;
      });
      if (score > bestScore) {
        bestScore = score;
        best = s;
      }
    });
    return best.length > 240 ? best.slice(0, 237).trimEnd() + "..." : best;
  }

  function ask(index, question, options) {
    var opts = options || {};
    var maxHits = opts.maxHits || 3;
    // A request to produce something (a poem, a translation) or to change the rules is not a question about the site.
    if (/^\s*(please\s+)?(write|compose|generate|draft|translate|pretend|act as|ignore|forget|disregard)\b/i.test(String(question || ""))) {
      return { status: "refuse", reason: "not-a-question", terms: [], hits: [] };
    }
    var terms = Array.from(new Set(tokenize(question)));
    if (terms.length === 0) return { status: "refuse", reason: "no-topic", terms: terms, hits: [] };

    var maxIdf = Math.log(1 + (index.n + 0.5) / 0.5);
    var weight = {};
    var total = 0;
    terms.forEach(function (t) {
      weight[t] = index.df[t] ? index.idf(t) : maxIdf;
      total += weight[t];
    });

    var scored = [];
    index.docs.forEach(function (d, i) {
      var score = 0;
      var covered = 0;
      terms.forEach(function (t) {
        var f = index.tf[i][t] || 0;
        if (!f) return;
        var denom = f + K1 * (1 - B + (B * index.len[i]) / index.avg);
        score += index.idf(t) * ((f * (K1 + 1)) / denom);
        covered += weight[t];
      });
      if (score > 0) scored.push({ i: i, score: score, coverage: covered / total });
    });
    scored.sort(function (a, b) { return b.score - a.score || a.i - b.i; });
    if (scored.length === 0) return { status: "refuse", reason: "no-match", terms: terms, hits: [] };

    // Coverage is judged over the best few cards together: a question about two things can be answered by two cards.
    var top = scored.slice(0, maxHits);
    var union = new Set();
    top.forEach(function (h) {
      terms.forEach(function (t) {
        if (index.tf[h.i][t]) union.add(t);
      });
    });
    var covered = 0;
    union.forEach(function (t) {
      covered += weight[t];
    });
    var coverage = covered / total;
    if (coverage < MIN_COVERAGE) return { status: "refuse", reason: "uncovered", coverage: coverage, terms: terms, hits: [] };

    var floor = top[0].score * 0.5;
    var hits = top
      .filter(function (h) { return h.score >= floor; })
      .map(function (h) {
        var d = index.docs[h.i];
        return { id: d.id, title: d.title, tab: d.tab, url: d.url, snippet: snippet(d, terms), score: h.score };
      });
    return { status: "answer", coverage: coverage, terms: terms, hits: hits };
  }

  var api = { buildDocs: buildDocs, buildIndex: buildIndex, ask: ask, tokenize: tokenize, plain: plain, MIN_COVERAGE: MIN_COVERAGE };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.siteChatCore = api;
})(typeof window !== "undefined" ? window : globalThis);
