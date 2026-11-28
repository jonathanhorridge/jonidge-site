/* Build/runtime config. Display name lives here so a rename (see docs/NAME-CHECK.md) is one line. */
(function (root) {
  'use strict';
  root.KC_CONFIG = {
    version: '0.1.0',
    title: 'Gust Rally',            // working title: taken on both stores, recommended rename "Gust Rally"
    brand: 'Jonidge',
    supportEmail: 'jonidge@yahoo.com',
    copyrightYear: 2026,
    storageKey: 'gustrally:v1',
    ads: { enabled: false },        // prototype: rewarded ads are placeholders only (see docs/DESIGN.md §9)
    purchases: { mode: 'off' },
    backend: { mode: 'local' }      // 'local' ghost adapter; 'supabase' planned (docs/DESIGN.md §11)
  };
})(this);
