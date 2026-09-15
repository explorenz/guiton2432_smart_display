// Guition JC2432W328 openHASP Desk Display - Interactive Script

document.addEventListener('DOMContentLoaded', () => {
  // Live Look Showcase - scroll-driven page switching over the real photo
  const showcaseTrack = document.querySelector('.showcase-track');

  if (showcaseTrack) {
    const showcaseStage = document.querySelector('.showcase-stage');
    const showcaseOverlay = document.querySelector('.showcase-screen-overlay');
    const showcasePages = document.querySelectorAll('.showcase-page');
    const showcaseDots = document.querySelectorAll('.showcase-dot');
    const totalPages = showcasePages.length;

    // Corners of the physical LCD within .showcase-screen-overlay, as measured
    // from the photo (percent of the overlay box, in TL, TR, BR, BL order).
    // The photo was shot at a slight angle, so these form a trapezoid rather
    // than a perfect rectangle.
    const showcaseCorners = [
      { x: 0, y: 0.63 },
      { x: 100, y: 0 },
      { x: 95.58, y: 100 },
      { x: 2.56, y: 100 },
    ];

    // Computes a CSS matrix3d that perspective-warps a WxH rectangle onto the
    // quad p0..p3 (TL, TR, BR, BL), so screen content - not just its outline -
    // matches the camera angle the reference photo was taken at.
    const quadWarpMatrix3d = (W, H, [p0, p1, p2, p3]) => {
      const dx1 = p1.x - p2.x, dy1 = p1.y - p2.y;
      const dx2 = p3.x - p2.x, dy2 = p3.y - p2.y;
      const sx = p0.x - p1.x + p2.x - p3.x;
      const sy = p0.y - p1.y + p2.y - p3.y;
      const denom = dx1 * dy2 - dy1 * dx2;
      const g = (sx * dy2 - sy * dx2) / denom;
      const h = (dx1 * sy - dy1 * sx) / denom;

      const a = p1.x - p0.x + g * p1.x;
      const b = p3.x - p0.x + h * p3.x;
      const c = p0.x;
      const d = p1.y - p0.y + g * p1.y;
      const e = p3.y - p0.y + h * p3.y;
      const f = p0.y;

      return `matrix3d(${a / W},${d / W},0,${g / W},${b / H},${e / H},0,${h / H},0,0,1,0,${c},${f},0,1)`;
    };

    const applyShowcaseWarp = () => {
      if (!showcaseOverlay) return;
      const W = showcaseOverlay.clientWidth;
      const H = showcaseOverlay.clientHeight;
      if (!W || !H) return;
      const pxCorners = showcaseCorners.map(p => ({ x: (p.x / 100) * W, y: (p.y / 100) * H }));
      const matrix = quadWarpMatrix3d(W, H, pxCorners);
      showcasePages.forEach(p => { p.style.transform = matrix; });
    };

    applyShowcaseWarp();
    window.addEventListener('resize', applyShowcaseWarp);
    if (window.ResizeObserver) {
      new ResizeObserver(applyShowcaseWarp).observe(showcaseOverlay);
    }

    const setActiveShowcasePage = (pageNum) => {
      showcasePages.forEach(p => p.classList.toggle('active', p.getAttribute('data-page') === String(pageNum)));
      showcaseDots.forEach(d => d.classList.toggle('active', d.getAttribute('data-page') === String(pageNum)));
    };

    const getTrackHeight = () => showcaseTrack.offsetHeight - showcaseStage.offsetHeight;

    const onShowcaseScroll = () => {
      const rect = showcaseTrack.getBoundingClientRect();
      const trackHeight = getTrackHeight();
      if (trackHeight <= 0) return;
      const scrolled = Math.min(Math.max(-rect.top, 0), trackHeight);
      const progress = scrolled / trackHeight;
      const pageIndex = Math.min(totalPages - 1, Math.floor(progress * totalPages));
      setActiveShowcasePage(pageIndex + 1);
    };

    window.addEventListener('scroll', onShowcaseScroll, { passive: true });
    onShowcaseScroll();

    showcaseDots.forEach(dot => {
      dot.addEventListener('click', () => {
        const pageNum = parseInt(dot.getAttribute('data-page'), 10);
        const trackHeight = getTrackHeight();
        const targetProgress = (pageNum - 1) / totalPages + (1 / totalPages) / 2;
        const targetScroll = showcaseTrack.offsetTop + targetProgress * trackHeight;
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      });
    });
  }

  // Load real config file contents into the Setup & Configuration panels,
  // so the site always shows the actual files instead of a hand-copied
  // snippet that can drift out of sync with them.
  document.querySelectorAll('.code-panel pre code[data-source]').forEach(codeEl => {
    const src = codeEl.getAttribute('data-source');
    fetch(src)
      .then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.text();
      })
      .then(text => { codeEl.textContent = text; })
      .catch(() => { codeEl.textContent = `// Could not load ${src}`; });
  });

  // Code Tab Switching
  const codeTabs = document.querySelectorAll('.code-tab');
  const codePanels = document.querySelectorAll('.code-panel');

  codeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-code');

      codeTabs.forEach(t => t.classList.remove('active'));
      codePanels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(`code-${targetId}`);
      if (targetPanel) targetPanel.classList.active ? null : targetPanel.classList.add('active');
    });
  });

  // Copy to Clipboard
  const copyBtns = document.querySelectorAll('.copy-btn');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetPanelId = btn.getAttribute('data-copy');
      const codeElement = document.querySelector(`#code-${targetPanelId} pre code`);
      if (codeElement) {
        navigator.clipboard.writeText(codeElement.innerText).then(() => {
          const originalText = btn.innerText;
          btn.innerText = 'Copied!';
          btn.style.backgroundColor = '#16a34a';
          setTimeout(() => {
            btn.innerText = originalText;
            btn.style.backgroundColor = '';
          }, 2000);
        });
      }
    });
  });
});
