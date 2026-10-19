// mode.js — Map URL params to <html> attributes before first paint.
//   ?theme=light       -> data-theme="light"      (default: dark)
//   ?bg=transparent    -> data-bg="transparent"   (no page bg, no card chrome)
//   ?capture=1         -> data-capture            (frame shrinks to content; see capture.py)
(function () {
  var params = new URLSearchParams(location.search);
  var root = document.documentElement;
  if (params.get('theme') === 'light') root.setAttribute('data-theme', 'light');
  if (params.get('bg') === 'transparent') root.setAttribute('data-bg', 'transparent');
  if (params.has('capture')) root.setAttribute('data-capture', '');

  if (root.getAttribute('data-bg') !== 'transparent') return;

  // Knockouts. A label that sits on its container's border hides the line
  // behind it with a surface-colored background. With no background to match, cut
  // a hole in the border instead: the label goes transparent, and the
  // container's border is redrawn by an overlay masked around each label.
  var SIDES = ['Top', 'Right', 'Bottom', 'Left'];

  // Knockout backgrounds are the page's own surface colors, resolved per theme.
  function surfaceColors() {
    var probe = document.createElement('div');
    document.body.appendChild(probe);
    var colors = ['--bg-base', '--bg-surface', '--bg-elevated', '--bg-card'].map(function (t) {
      probe.style.backgroundColor = 'var(' + t + ')';
      return getComputedStyle(probe).backgroundColor;
    });
    probe.remove();
    return colors;
  }

  function straddlesBorder(r, h, hs) {
    var bt = parseFloat(hs.borderTopWidth), bb = parseFloat(hs.borderBottomWidth);
    var bl = parseFloat(hs.borderLeftWidth), br = parseFloat(hs.borderRightWidth);
    var inX = r.right > h.left && r.left < h.right;
    var inY = r.bottom > h.top && r.top < h.bottom;
    return (bt && inX && r.top < h.top + bt && r.bottom > h.top) ||
           (bb && inX && r.top < h.bottom && r.bottom > h.bottom - bb) ||
           (bl && inY && r.left < h.left + bl && r.right > h.left) ||
           (br && inY && r.left < h.right && r.right > h.right - br);
  }

  function findKnockouts() {
    var hosts = new Map();
    var surfaces = surfaceColors();
    document.querySelectorAll('body *').forEach(function (el) {
      var cs = getComputedStyle(el);
      if (cs.position !== 'absolute' || surfaces.indexOf(cs.backgroundColor) < 0) return;
      var host = el.offsetParent;
      if (!host || host === document.body) return;
      if (!straddlesBorder(el.getBoundingClientRect(), host.getBoundingClientRect(), getComputedStyle(host))) return;
      if (!hosts.has(host)) hosts.set(host, []);
      hosts.get(host).push(el);
    });
    return hosts;
  }

  function cutHoles(hosts) {
    hosts.forEach(function (labels, host) {
      var hs = getComputedStyle(host);
      var ov = host.querySelector(':scope > .ko-border');
      if (!ov) {
        ov = document.createElement('div');
        ov.className = 'ko-border';
        ov.style.cssText = 'position:absolute;box-sizing:border-box;pointer-events:none;' +
          'mask-repeat:no-repeat;mask-composite:exclude;';
        SIDES.forEach(function (s) {
          ov.style['border' + s + 'Width'] = hs['border' + s + 'Width'];
          ov.style['border' + s + 'Style'] = hs['border' + s + 'Style'];
          ov.style['border' + s + 'Color'] = hs['border' + s + 'Color'];
        });
        ov.style.borderRadius = hs.borderRadius;
        ov.style.left = '-' + hs.borderLeftWidth;
        ov.style.top = '-' + hs.borderTopWidth;
        host.style.setProperty('border-color', 'transparent', 'important');
        labels.forEach(function (el) { el.style.setProperty('background', 'transparent', 'important'); });
        host.appendChild(ov);
      }
      ov.style.width = host.offsetWidth + 'px';
      ov.style.height = host.offsetHeight + 'px';
      var h = host.getBoundingClientRect();
      var layers = labels.map(function (el) {
        var r = el.getBoundingClientRect();
        return { size: r.width + 'px ' + r.height + 'px', pos: (r.left - h.left) + 'px ' + (r.top - h.top) + 'px' };
      });
      layers.push({ size: '100% 100%', pos: '0 0' });
      ov.style.maskImage = layers.map(function () { return 'linear-gradient(#000 0 0)'; }).join(', ');
      ov.style.maskSize = layers.map(function (l) { return l.size; }).join(', ');
      ov.style.maskPosition = layers.map(function (l) { return l.pos; }).join(', ');
    });
  }

  window.addEventListener('load', function () {
    document.fonts.ready.then(function () {
      var hosts = findKnockouts();
      cutHoles(hosts);
      window.addEventListener('resize', function () { cutHoles(hosts); });
    });
  });
})();
