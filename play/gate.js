/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"4f8e188e4b9ef4a2e981c059a88bc3b1","iv":"5efc805fcecfe23b1a0b609ceb0618b5","ct":"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","mac":"abf50fc67d6140a2a49ae02e7c3e9f4bd6912e8c83d8ee5803f785ad20d0a7b9"};

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
