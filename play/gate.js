/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"8e7d6c40293c4da05bafe727ac81b81d","iv":"3ea6281d2432d19b524ccf0b878f0091","ct":"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","mac":"cfd2c52e01608259471e13357bc8f73bae34d41b8059975df965c6f5558773be"};

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
