/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"0db9acceb332981bfb89d1912e856671","iv":"520ebb15b8c78c601df7cd844854dcdc","ct":"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","mac":"85825d08401f17cd0d21ab9d97686df71d04cadd83c497cdd18c971a51789d43"};

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
