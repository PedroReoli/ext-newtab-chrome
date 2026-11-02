/* Local Lucide icon subset (ISC), avoiding remote scripts in the extension. */
(function exposeIcons(global) {
  const ICONS = {
    play: [['polygon', { points: '6 3 20 12 6 21 6 3' }]],
    pencil: [
      ['path', { d: 'M12 20h9' }],
      ['path', { d: 'M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z' }]
    ],
    copy: [
      ['rect', { width: '14', height: '14', x: '8', y: '8', rx: '2', ry: '2' }],
      ['path', { d: 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2' }]
    ],
    trash: [
      ['path', { d: 'M3 6h18' }],
      ['path', { d: 'M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' }],
      ['path', { d: 'M19 6 18 20c0 1-1 2-2 2H8c-1 0-2-1-2-2L5 6' }],
      ['path', { d: 'M10 11v6M14 11v6' }]
    ],
    eraser: [
      ['path', { d: 'm7 21-4-4a2 2 0 0 1 0-3L14 3a2 2 0 0 1 3 0l4 4a2 2 0 0 1 0 3L10 21a2 2 0 0 1-3 0Z' }],
      ['path', { d: 'm5 12 7 7M5 21h16' }]
    ],
    x: [['path', { d: 'M18 6 6 18M6 6l12 12' }]]
  };

  function create(name, size = 16) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    (ICONS[name] || []).forEach(([tag, attributes]) => {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
      svg.append(node);
    });
    return svg;
  }

  function mountAll(root = document) {
    root.querySelectorAll('[data-reoli-icon]').forEach(element => {
      element.replaceChildren(create(element.dataset.reoliIcon, Number(element.dataset.iconSize) || 16));
    });
  }

  global.ReoliIcons = { create, mountAll };
})(globalThis);
