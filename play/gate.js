/* Jonidge play gate. The game list is AES-encrypted; this file does not contain the password. */
(function (global) {
  "use strict";

  var STORAGE = "jonidge-play-v1";
  var PAYLOAD = {"v":1,"iter":150000,"salt":"8a743cd00dc5d25d2dc6b90ffc8e3edc","iv":"1d30fb686e0379706f66b50873c9252a","ct":"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","mac":"741baafc2e2ade804da06171e493ece35a326f16ed00def88d9d3ef7ba994d21"};

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
