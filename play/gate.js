/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"aba7c488cb387020ef651a47eb9cfc82","iv":"336e91bf724fd30d6099f0bae8863e82","ct":"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","mac":"230a3ed09d14f49863fd10a3a98e8ad7b53e75980d6255eaa881a1148a331ff3"};

  function hasCryptoJs() {
    return typeof global.CryptoJS !== "undefined" && CryptoJS.AES && CryptoJS.PBKDF2;
  }

  function materialFromPassword(password, saltHex, iter) {
    var salt = CryptoJS.enc.Hex.parse(saltHex);
    var material = CryptoJS.PBKDF2(password, salt, {
      keySize: 16,
      iterations: iter,
      hasher: CryptoJS.algo.SHA256
    });
    return splitMaterial(material);
  }

  function materialFromStored(hex) {
    var material = CryptoJS.enc.Hex.parse(hex);
    return splitMaterial(material);
  }

  function splitMaterial(material) {
    return {
      encKey: CryptoJS.lib.WordArray.create(material.words.slice(0, 8), 32),
      macKey: CryptoJS.lib.WordArray.create(material.words.slice(8, 16), 32),
      hex: material.toString(CryptoJS.enc.Hex)
    };
  }

  function decryptPayload(keys) {
    var macSrc = PAYLOAD.salt + PAYLOAD.iv + PAYLOAD.ct;
    var mac = CryptoJS.HmacSHA256(macSrc, keys.macKey).toString(CryptoJS.enc.Hex);
    if (mac !== PAYLOAD.mac) throw new Error("mac");
    var raw = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(PAYLOAD.ct) },
      keys.encKey,
      {
        iv: CryptoJS.enc.Hex.parse(PAYLOAD.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      }
    );
    var text = raw.toString(CryptoJS.enc.Utf8);
    if (!text) throw new Error("empty");
    return JSON.parse(text);
  }

  function readToken() {
    try {
      return localStorage.getItem(STORAGE) || "";
    } catch (e) {
      return "";
    }
  }

  function writeToken(hex) {
    localStorage.setItem(STORAGE, "v1." + hex);
  }

  function clearToken() {
    try {
      localStorage.removeItem(STORAGE);
    } catch (e) {}
  }

  function tokenHex() {
    var t = readToken();
    if (!t || t.indexOf("v1.") !== 0) return "";
    var hex = t.slice(3);
    if (!/^[0-9a-f]{128}$/i.test(hex)) return "";
    return hex;
  }

  function unlock(password) {
    if (!hasCryptoJs()) return Promise.reject(new Error("crypto"));
    return new Promise(function (resolve, reject) {
      try {
        var keys = materialFromPassword(password, PAYLOAD.salt, PAYLOAD.iter);
        var catalog = decryptPayload(keys);
        writeToken(keys.hex);
        resolve(catalog);
      } catch (err) {
        reject(err);
      }
    });
  }

  function loadCatalog() {
    if (!hasCryptoJs()) return Promise.resolve(null);
    var hex = tokenHex();
    if (!hex) return Promise.resolve(null);
    return new Promise(function (resolve) {
      try {
        resolve(decryptPayload(materialFromStored(hex)));
      } catch (err) {
        clearToken();
        resolve(null);
      }
    });
  }

  function lock() {
    clearToken();
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  function iconHTML(game) {
    if (game.icon) {
      return '<img class="icon" src="' + esc(game.icon) + '" width="192" height="192" alt="">';
    }
    var letter = (game.name || "?").trim().charAt(0).toUpperCase();
    return '<span class="icon play-placeholder" aria-hidden="true">' + esc(letter) + "</span>";
  }

  function renderGames(catalog, root) {
    var games = (catalog && catalog.games) || [];
    root.innerHTML = games
      .map(function (game) {
        var notes = ["Prototype, may be buggy"].concat(game.notes || []);
        var href = "/play/" + encodeURIComponent(game.slug) + "/";
        var action = game.kind === "app" ? "Open" : "Play";
        return (
          '<article class="app-card play-card">' +
            iconHTML(game) +
            "<div>" +
              "<h2>" + esc(game.name) + "</h2>" +
            "</div>" +
            '<p class="oneliner">' + esc(game.blurb) + "</p>" +
            '<p class="play-note">' + esc(notes.join(" · ")) + "</p>" +
            '<div class="meta">' +
              '<span class="pill">Prototype</span>' +
              '<a class="btn-play" href="' + href + '">' + action + "</a>" +
            "</div>" +
          "</article>"
        );
      })
      .join("");
  }

  function showList(catalog) {
    var lockEl = document.getElementById("play-lock");
    var listEl = document.getElementById("play-list");
    var grid = document.getElementById("play-grid");
    if (!listEl || !grid) return;
    if (lockEl) lockEl.hidden = true;
    listEl.hidden = false;
    renderGames(catalog, grid);
  }

  function showLock(error) {
    var lockEl = document.getElementById("play-lock");
    var listEl = document.getElementById("play-list");
    var err = document.getElementById("play-error");
    if (listEl) listEl.hidden = true;
    if (lockEl) lockEl.hidden = false;
    if (err) {
      err.hidden = !error;
    }
    var input = document.getElementById("play-password");
    if (input && error) {
      input.focus();
      input.select();
    }
  }

  function initHub() {
    var form = document.getElementById("play-form");
    var relock = document.getElementById("play-relock");
    if (relock) {
      relock.addEventListener("click", function () {
        lock();
        showLock(false);
        var input = document.getElementById("play-password");
        if (input) {
          input.value = "";
          input.focus();
        }
      });
    }
    if (form) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var input = document.getElementById("play-password");
        var password = input ? input.value : "";
        var err = document.getElementById("play-error");
        if (err) err.hidden = true;
        unlock(password).then(
          function (catalog) {
            showList(catalog);
          },
          function () {
            showLock(true);
          }
        );
      });
    }
    loadCatalog().then(function (catalog) {
      if (catalog) showList(catalog);
      else showLock(false);
    });
  }

  global.JonidgePlay = {
    STORAGE: STORAGE,
    unlock: unlock,
    loadCatalog: loadCatalog,
    lock: lock,
    tokenOk: function () {
      return !!tokenHex();
    },
    initHub: initHub
  };
})(window);
