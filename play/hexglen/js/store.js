/* Hexglen save data: localStorage with in-memory fallback. Everything is local in this prototype. */
(function (root) {
  'use strict';
  var P = 'hexglen.v1.', mem = {};
  function raw(k) { try { return root.localStorage.getItem(P + k); } catch (e) { return mem[k] == null ? null : mem[k]; } }
  function put(k, v) { try { root.localStorage.setItem(P + k, v); } catch (e) { mem[k] = v; } if (root.HHPlatform) root.HHPlatform.Store.write(P + k, v); }
  function get(k, d) { var r = raw(k); if (r == null) return d; try { return JSON.parse(r); } catch (e) { return d; } }
  function set(k, v) { put(k, JSON.stringify(v)); }
  root.HHStore = {
    get: get, set: set,
    remove: function (k) { try { root.localStorage.removeItem(P + k); } catch (e) {} delete mem[k]; if (root.HHPlatform) root.HHPlatform.Store.remove(P + k); },
    reset: function () { if (root.HHPlatform) root.HHPlatform.Store.clearAll(); try { Object.keys(root.localStorage).forEach(function (k) { if (k.indexOf(P) === 0) root.localStorage.removeItem(k); }); } catch (e) {} mem = {}; }
  };
})(window);
