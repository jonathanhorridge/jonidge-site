#!/usr/bin/env node
/**
 * Build the password-protected /play/ section.
 * Usage: PLAY_PASSWORD=.... node tools/build-play.mjs
 * Does not print or embed the password. Regenerates play/gate.js from the catalog.
 */
import { readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import CryptoJS from "crypto-js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const password = process.env.PLAY_PASSWORD || "";
if (!password) {
  console.error("Set PLAY_PASSWORD and re-run.");
  process.exit(1);
}

const ITER = 150000;
const catalog = JSON.parse(readFileSync(join(root, "tools/play-catalog.json"), "utf8"));
const published = { games: catalog.games };
const plaintext = JSON.stringify(published);

const salt = CryptoJS.lib.WordArray.random(16);
const material = CryptoJS.PBKDF2(password, salt, {
  keySize: 16,
  iterations: ITER,
  hasher: CryptoJS.algo.SHA256
});
const encKey = CryptoJS.lib.WordArray.create(material.words.slice(0, 8), 32);
const macKey = CryptoJS.lib.WordArray.create(material.words.slice(8, 16), 32);
const iv = CryptoJS.lib.WordArray.random(16);
const encrypted = CryptoJS.AES.encrypt(plaintext, encKey, {
  iv,
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7
});
const ct = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
const payload = {
  v: 1,
  iter: ITER,
  salt: salt.toString(CryptoJS.enc.Hex),
  iv: iv.toString(CryptoJS.enc.Hex),
  ct,
  mac: CryptoJS.HmacSHA256(salt.toString(CryptoJS.enc.Hex) + iv.toString(CryptoJS.enc.Hex) + ct, macKey).toString(CryptoJS.enc.Hex)
};

// Round-trip check
const macSrc = payload.salt + payload.iv + payload.ct;
const mac2 = CryptoJS.HmacSHA256(macSrc, macKey).toString(CryptoJS.enc.Hex);
if (mac2 !== payload.mac) {
  console.error("HMAC mismatch during build");
  process.exit(1);
}
const check = CryptoJS.AES.decrypt(
  { ciphertext: CryptoJS.enc.Base64.parse(payload.ct) },
  encKey,
  { iv: CryptoJS.enc.Hex.parse(payload.iv), mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7 }
).toString(CryptoJS.enc.Utf8);
if (check !== plaintext) {
  console.error("Decrypt round-trip failed");
  process.exit(1);
}

const template = readFileSync(join(root, "tools/gate.template.js"), "utf8");
if (!template.includes("/*@@PAYLOAD@@*/")) {
  console.error("gate template is missing the payload placeholder");
  process.exit(1);
}
const gate = template.replace("/*@@PAYLOAD@@*/ null", JSON.stringify(payload));
writeFileSync(join(root, "play/gate.js"), gate);
console.log("Wrote play/gate.js (" + published.games.length + " games, payload " + JSON.stringify(payload).length + " bytes)");

const sources = [
  { slug: "sunplop", from: "/workspace/web-builds/sunplop" },
  { slug: "melt", from: "/workspace/melt/host/melt" },
  { slug: "rubber-band-bridge", from: "/workspace/builds/rubber-band-bridge" },
  { slug: "ferry-jam", from: "/workspace/ferry-jam/www" },
  { slug: "fin-to-feather", from: "/workspace/ftf-web/fin-to-feather" },
  { slug: "lilyward", from: "/workspace/tower-defense/www" },
  { slug: "clawcastle", from: "/workspace/clawcastle/www" },
  { slug: "radar-bite", from: "/workspace/radarbite/dist-jonidge" },
  { slug: "gust-rally", from: "/workspace/kite-clash/www" }
];

const SNIPPET = `<!-- jonidge-play-gate -->
<meta name="robots" content="noindex,nofollow">
<style id="jonidge-gate-css">html{visibility:hidden!important}</style>
<script>
(function(){
  try {
    var t = localStorage.getItem("jonidge-play-v1") || "";
    if (!/^v1\\.[0-9a-f]{128}$/i.test(t)) {
      location.replace("/play/");
      return;
    }
    var s = document.getElementById("jonidge-gate-css");
    if (s) s.remove();
  } catch (e) {
    location.replace("/play/");
  }
})();
</script>
`;

function inject(html) {
  var out = html.replace(/<meta\s+name=["']robots["'][^>]*>\s*/i, "");
  if (!/<head[^>]*>/i.test(out)) {
    throw new Error("no <head> found");
  }
  return out.replace(/<head[^>]*>/i, function (open) {
    return open + "\n" + SNIPPET;
  });
}

for (const game of sources) {
  if (!existsSync(game.from)) {
    console.error("Missing source:", game.from);
    process.exit(1);
  }
  const dest = join(root, "play", game.slug);
  rmSync(dest, { recursive: true, force: true });
  cpSync(game.from, dest, { recursive: true });
  const indexPath = join(dest, "index.html");
  if (!existsSync(indexPath)) {
    console.error("No index.html in", dest);
    process.exit(1);
  }
  const html = readFileSync(indexPath, "utf8");
  if (html.includes("jonidge-play-gate")) {
    console.log("Already gated:", game.slug);
    continue;
  }
  writeFileSync(indexPath, inject(html));
  console.log("Copied and gated /play/" + game.slug + "/");
}


const SPA_RESTORE = `<!-- jonidge-spa-restore -->
<script>
(function(){
  try {
    var k = "jonidge-radar-bite-path";
    var r = sessionStorage.getItem(k);
    if (!r) return;
    sessionStorage.removeItem(k);
    var project = location.hostname.endsWith("github.io");
    var base = project ? "/jonidge-site/" : "/";
    var prefix = base + "play/radar-bite/";
    var bare = prefix.slice(0, -1);
    if (r.indexOf(prefix) !== 0 && r.split("?")[0].split("#")[0] !== bare) return;
    if (r !== location.pathname + location.search + location.hash) {
      history.replaceState(null, "", r);
    }
  } catch (e) {}
})();
</script>
`;

const rbIndex = join(root, "play/radar-bite/index.html");
if (existsSync(rbIndex)) {
  let rbHtml = readFileSync(rbIndex, "utf8");
  if (!rbHtml.includes("jonidge-spa-restore")) {
    rbHtml = rbHtml.replace("<!-- jonidge-play-gate -->", "<!-- jonidge-play-gate -->\n" + SPA_RESTORE);
    writeFileSync(rbIndex, rbHtml);
    console.log("Added Radar Bite SPA path restore");
  }
}

// Replace the public /lilyward game with a noindex redirect to /play/.
const lilyPublic = join(root, "lilyward");
for (const name of ["assets", "css", "js", "manifest.webmanifest"]) {
  rmSync(join(lilyPublic, name), { recursive: true, force: true });
}
writeFileSync(
  join(lilyPublic, "index.html"),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Lilyward — Jonidge</title>
  <meta name="robots" content="noindex,nofollow">
  <meta http-equiv="refresh" content="0;url=/play/">
  <link rel="canonical" href="https://jonidge.com/play/">
  <script>location.replace("/play/");</script>
</head>
<body>
  <p><a href="/play/">Continue to In development</a></p>
</body>
</html>
`
);
console.log("Replaced public /lilyward with a redirect to /play/");
