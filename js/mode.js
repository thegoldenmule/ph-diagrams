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
})();
