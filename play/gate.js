/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"519a8064261e31dacc2cd87b4f8ee939","iv":"38006197c64227fb3de443c2e985b380","ct":"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","mac":"60831114a404bff52fa6e08f18809b0b2abe255947f2a8b72f54e41e943fc789"};

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
