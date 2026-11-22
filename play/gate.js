/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"b66dad46263a15c334dda3faffc71af2","iv":"ea1010362a6c8b7f1751136c8ee624fa","ct":"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","mac":"32726aad9345dd5383155e87102b8fa4138b5660bdf92a733a71f5977a4aedf4"};

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
