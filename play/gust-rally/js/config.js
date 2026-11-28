/* Build/runtime config. Display name lives here. */
(function (root) {
  'use strict';
  root.KC_CONFIG = {
    version: '0.1.0',
    title: 'Gust Rally',            // final name ("Kite Clash" was taken on both stores, see docs/NAME-CHECK.md)
    appId: 'com.jonidge.gustrally',
    brand: 'Jonidge',
    supportEmail: 'jonidge@yahoo.com',
    copyrightYear: 2026,
    storageKey: 'gustrally:v1',
    ads: { enabled: false },        // prototype: rewarded ads are placeholders only (see docs/DESIGN.md §9)
    purchases: { mode: 'off' },
    backend: { mode: 'local', url: '', anonKey: '' }   // online ghosts stay OFF until mode='supabase' AND url + anonKey are set (docs/DESIGN.md §11)
  };
})(this);
