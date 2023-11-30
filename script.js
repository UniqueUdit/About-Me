(function () {
  var on = addEventListener,
    off = removeEventListener,
    $ = function (q) {
      return document.querySelector(q);
    },
    $$ = function (q) {
      return document.querySelectorAll(q);
    },
    $body = document.body,
    $inner = $('.inner'),
    client = (function () {
      var o = {
          browser: 'other',
          browserVersion: 0,
          os: 'other',
          osVersion: 0,
          mobile: false,
          canUse: null,
          flags: {
            lsdUnits: false,
          },
        },
        ua = navigator.userAgent,
        a, i;

      a = [
        ['firefox', /Firefox\/([0-9\.]+)/],
        ['edge', /Edge\/([0-9\.]+)/],
        ['safari', /Version\/([0-9\.]+).+Safari/],
        ['chrome', /Chrome\/([0-9\.]+)/],
        ['chrome', /CriOS\/([0-9\.]+)/],
        ['ie', /Trident\/.+rv:([0-9]+)/],
      ];

      for (i = 0; i < a.length; i++) {
        if (ua.match(a[i][1])) {
          o.browser = a[i][0];
          o.browserVersion = parseFloat(RegExp.$1);
          break;
        }
      }

      a = [
        ['ios', /([0-9_]+) like Mac OS X/, function (v) {
          return v.replace('_', '.').replace('_', '');
        }],
        ['ios', /CPU like Mac OS X/, function (v) {
          return 0;
        }],
        ['ios', /iPad; CPU/, function (v) {
          return 0;
        }],
        ['android', /Android ([0-9\.]+)/, null],
        ['mac', /Macintosh.+Mac OS X ([0-9_]+)/, function (v) {
          return v.replace('_', '.').replace('_', '');
        }],
        ['windows', /Windows NT ([0-9\.]+)/, null],
        ['undefined', /Undefined/, null],
      ];

      for (i = 0; i < a.length; i++) {
        if (ua.match(a[i][1])) {
          o.os = a[i][0];
          o.osVersion = parseFloat(
            a[i][2] ? a[i][2](RegExp.$1) : RegExp.$1
          );
          break;
        }
      }

      if (
        o.os == 'mac' &&
        'ontouchstart' in window &&
        ((screen.width == 1024 && screen.height == 1366) ||
          (screen.width == 834 && screen.height == 1112) ||
          (screen.width == 810 && screen.height == 1080) ||
          (screen.width == 768 && screen.height == 1024))
      )
        o.os = 'ios';

      o.mobile = o.os == 'android' || o.os == 'ios';

      var _canUse = document.createElement('div');

      o.canUse = function (property, value) {
        var style;
        style = _canUse.style;
        if (!(property in style)) return false;
        if (typeof value !== 'undefined') {
          style[property] = value;
          if (style[property] == '') return false;
        }
        return true;
      };

      o.flags.lsdUnits = o.canUse('width', '100dvw');

      return o;
    })(),
    trigger = function (t) {
      dispatchEvent(new Event(t));
    },
    cssRules = function (selectorText) {
      var ss = document.styleSheets,
        a = [],
        f = function (s) {
          var r = s.cssRules,
            i;
          for (i = 0; i < r.length; i++) {
            if (
              r[i] instanceof CSSMediaRule &&
              matchMedia(r[i].conditionText).matches
            )
              f(r[i]);
            else if (
              r[i] instanceof CSSStyleRule &&
              r[i].selectorText == selectorText
            )
              a.push(r[i]);
          }
        },
        x, i;

      for (i = 0; i < ss.length; i++) f(ss[i]);

      return a;
    },
    thisHash = function () {
      var h = location.hash ? location.hash.substring(1) : null,
        a;
      if (!h) return null;
      if (h.match(/\?/)) {
        a = h.split('?');
        h = a[0];
        history.replaceState(undefined, undefined, '#' + h);
        window.location.search = a[1];
      }
      if (h.length > 0 && !h.match(/^[a-zA-Z]/)) h = 'x' + h;
      if (typeof h == 'string') h = h.toLowerCase();
      return h;
    },
    scrollToElement = function (e, style, duration) {
      var y, cy, dy, start, easing, offset, f;
      if (!e) y = 0;
      else {
        offset =
          (e.dataset.scrollOffset ? parseInt(e.dataset.scrollOffset) : 0) *
          parseFloat(getComputedStyle(document.documentElement).fontSize);

        switch (
          e.dataset.scrollBehavior ? e.dataset.scrollBehavior : 'default'
        ) {
          case 'default':
          default:
            y = e.offsetTop + offset;
            break;

          case 'center':
            if (e.offsetHeight < window.innerHeight)
              y = e.offsetTop - (window.innerHeight - e.offsetHeight) / 2 + offset;
            else y = e.offsetTop - offset;
            break;

          case 'previous':
            if (e.previousElementSibling)
              y = e.previousElementSibling.offsetTop + e.previousElementSibling.offsetHeight + offset;
            else y = e.offsetTop + offset;
            break;
        }
      }

      if (style == 'instant') start = Date.now();
      else start = performance.now();

      cy = window.scrollY;
      dy = y - cy;

      if (!duration) {
        if (dy > 0) dy = Math.min(dy, 3);
        else dy = Math.max(dy, -3);
      }

      easing = function (t) {
        return t;
      };

      f = function () {
        var t = performance.now() - start;

        if (t < duration) {
          scrollTo(0, cy + dy * easing(t / duration));
          requestAnimationFrame(f);
        } else {
          scrollTo(0, y);
          if (e) e.focus();
        }
      };

      requestAnimationFrame(f);
    };

  // Expose scrollToElement
  window.scrollToElement = scrollToElement;

  // Browser-specific classes
  if (client.browser == 'ie' || client.browser == 'edge')
    $body.classList.add('is-ie');

  // Scrolly links
  $$('.scrolly').forEach(function (e) {
    var targetId = e.getAttribute('href').substring(1),
      target = $(targetId);

    // Ignore scrolly links to non-existent targets
    if (!target) return;

    // Add scrolly link
    e.addEventListener('click', function (event) {
      if (event) {
        event.preventDefault();
        e.blur();
      }

      // Scroll to target
      scrollToElement(target);

      // Set focus to target
      if (null !== target.getAttribute('tabindex'))
        target.focus();
    });
  });

  // Scroll events
  on('scroll', function () {
    var i, h, e, p;

    // Detect visible sections
    for (i = 0; i < $sections.length; i++) {
      h = $sections[i];

      e = h;
      p = 0;

      while (e && !isNaN(e.offsetTop)) {
        p += e.offsetTop - (e.scrollTop || 0);
        e = e.offsetParent;
      }

      h.progress = p / (parseInt(getComputedStyle(h).height) - window.innerHeight);
    }

    // Header
    if ($header && $header.style && $header.style.backgroundPosition) {
      $header.style.backgroundPosition =
        'center ' + -1 * $top.progress * 0.5 * 200 + 'vh';
    }

    // Footer
    if ($footer && $footer.style && $footer.style.opacity) {
      $footer.style.opacity = 1 - $bottom.progress;
    }

    // Debug
    if (0) {
      $debug.style.display = 'block';
      $debug.innerText =
        'Top: ' +
        $top.progress +
        ', Bottom: ' +
        $bottom.progress +
        ',\nSections: ' +
        $sections.length;
    }

    // Parallax
    if (!client.browser == 'ie' || client.browser == 'edge') {
      if ($top && $top.style && $top.style.backgroundPosition) {
        $top.style.backgroundPosition =
          'center ' + -1 * $top.progress * 0.5 * 200 + 'vh';
      }

      if ($bottom && $bottom.style && $bottom.style.opacity) {
        $bottom.style.opacity = 1 - $bottom.progress;
      }

      $$('[data-parallax="center"]').forEach(function (e) {
        var t = window.scrollY,
          p = parseInt(e.dataset.factor),
          o = parseInt(e.dataset.orientation);

        if (o == 0) o = 10;

        e.style.transform = 'translateX(' + ((t / o) * p).toFixed(2) + 'px)';
      });
    }
  });

  // Load events
  on('load', function () {
    var h, e, i;

    // Pages specific adjustments
    $$('section').forEach(function (e) {
      // Get sections
      $sections.push(e);

      // Wrapper?
      if (e.dataset.wrapper == 'true') {
        // Reset scroll
        e.scrollTop = 0;
      }
    });

    // Initialize scroll positions
    on('resize', function () {
      var h, e;

      // Heights
      $top.style.height = $top.dataset.height + 'vh';
      $bottom.style.height = $bottom.dataset.height + 'vh';

      // Client
      for (var key in client)
        $body.classList[
          client[key] ? 'add' : 'remove'
        ]('client-' + key);

      // Sections
      for (i = 0; i < $sections.length; i++) {
        h = $sections[i];
        e = h;

        // Set sections
        if (e.dataset.wrapper !== 'true') {
          // Not a wrapper? Scroll it up by half the screen height
          h.style.paddingBottom = window.innerHeight / 2 + 'px';
        }
      }

      // Initialize
      trigger('resize');
    });

    // Hashchange event
    on('hashchange', function () {
      var h, e, i, pos;

      // Scroll instantly to prevent focus from scrolling
      scrollTo(0, Math.floor(window.scrollY));

      // Delay
      setTimeout(function () {
        // Instantly scroll to the proper position
        scrollTo(0, Math.floor(window.scrollY));

        // Initialize
        trigger('resize');
      }, 0);
    });

    // Initialize
    trigger('resize');

    // Unlock
    setTimeout(function () {
      $body.classList.remove('is-loading');
    }, 100);

    // Header
    $header.style.backgroundImage = 'url("' + $header.dataset.image + '")';

    if (
      'onscroll' in window &&
      !/android|avantgo|bada\/|blackberry|iemobile|ip(hone|od)|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
        navigator.userAgent
      )
    ) {
      on('scroll', function () {
        clearTimeout($idleTimeout);
        $idleTimeout = setTimeout(function () {
          if ($body.classList.contains('is-active'))
            $body.classList.remove('is-active');
        }, 1000);
        if (!$body.classList.contains('is-active'))
          $body.classList.add('is-active');
      });

      $$('a[href^="#"]').forEach(function (e, i) {
        var n;

               e.addEventListener('click', function (event) {
          var t = e.getAttribute('href'),
            n;

          if (t.length > 1 && '#' == t[0]) {
            event.preventDefault();
            n = $(t);

            if (n) {
              scrollToElement(n);

              if (
                n.id &&
                window.history &&
                window.history.pushState
              ) {
                history.pushState(null, null, '#' + n.id);
              }
            }
          }
        });
      });
    }

    // Handle menu links
    $$('nav a').forEach(function (e) {
      var t = e.getAttribute('href');

      // Check for section
      if (t.length > 1 && '#' == t[0]) {
        var n = $(t);

        if (n) {
          e.addEventListener('click', function (event) {
            event.preventDefault();
            scrollToElement(n);
          });
        }
      }
    });

    // Scroll to initial element on page load
    var initialHash = thisHash();

    if (initialHash) {
      var target = $(initialHash);

      if (target) {
        // Scroll to the element after a short delay to ensure correct positioning
        setTimeout(function () {
          scrollToElement(target, 'instant');
        }, 10);
      }
    }
  });
})();
