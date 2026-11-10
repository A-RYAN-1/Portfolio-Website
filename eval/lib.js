"use strict";
// Builds the same documents the browser builds, from the saved copies of the three summaries and index.html.
const fs = require("fs");
const path = require("path");
const core = require("../assets/js/site-chat-core.js");

const ROOT = path.join(__dirname, "..");
const FIX = path.join(__dirname, "fixtures");

function extractChunks(html) {
  const re = /<(p|li|address)\b[^>]*\bdata-chat-chunk="([^"]+)"[^>]*\bdata-chat-title="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/g;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push({ id: m[2], title: m[3], text: core.plain(m[4]) });
  return out;
}

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(FIX, name), "utf8"));
}

function loadDocs() {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  return core.buildDocs({
    chunks: extractChunks(html),
    oss: readJson("oss-summary.json"),
    builds: readJson("builds-summary.json"),
    blogs: readJson("blogs-summary.json"),
  });
}

module.exports = { extractChunks, loadDocs, readJson, FIX, ROOT };
