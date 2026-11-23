/* Ad + IAP stubs. No real ad SDK and no real charges. */
(function (root) {
  'use strict';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstElementChild;
  }

  function overlay(kind, title, body, cta, onClose) {
    var node = el(
      '<div class="ad-overlay" data-kind="' + kind + '" role="dialog" aria-modal="true">' +
        '<div class="ad-card">' +
          '<div class="ad-kicker">Placeholder · no real ad</div>' +
          '<h3>' + title + '</h3>' +
          '<p>' + body + '</p>' +
          '<button type="button" class="btn primary ad-ok">' + cta + '</button>' +
          '<button type="button" class="btn ghost ad-skip">Close</button>' +
        '</div>' +
      '</div>'
    );
    function done(ok) { if (node.parentNode) node.parentNode.removeChild(node); onClose(ok); }
    node.querySelector('.ad-ok').addEventListener('click', function () { done(true); });
    node.querySelector('.ad-skip').addEventListener('click', function () { done(false); });
    document.body.appendChild(node);
    return node;
  }

  var lastRewardedAt = 0;

  root.Ads = {
    lastRewardedAt: function () { return lastRewardedAt; },
    showRewarded: function (reason) {
      return new Promise(function (resolve) {
        overlay(
          'rewarded',
          'Rewarded ad',
          'A short placeholder for “' + (reason || 'reward') + '”. Watching would grant the reward. Nothing is shown or charged.',
          'Collect reward',
          function (ok) {
            if (ok) lastRewardedAt = Date.now();
            resolve(!!ok);
          }
        );
      });
    },
    showInterstitial: function () {
      return new Promise(function (resolve) {
        overlay(
          'interstitial',
          'Interstitial ad',
          'This pause would be a full-screen ad on a live build. It is only a placeholder.',
          'Continue',
          function () { resolve(true); }
        );
      });
    }
  };

  root.IAP = {
    purchase: function (productId) {
      return new Promise(function (resolve) {
        var p = root.Economy && root.Economy.product(productId);
        var title = p ? p.title : productId;
        overlay(
          'iap',
          'Purchase (demo)',
          '“' + title + '” would cost ' + (p ? root.Economy.formatPrice(p.priceUSD, 'USD') : '?') +
            '. This is a stub — nothing is billed.',
          'Pretend to buy',
          function (ok) { resolve(ok ? { ok: true, productId: productId } : { ok: false, cancelled: true }); }
        );
      });
    }
  };
})(typeof self !== 'undefined' ? self : this);
