const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
const isSmallViewport = window.matchMedia("(max-width: 760px)").matches;
const shouldReduceAmbientMotion = reducedMotion || isCoarsePointer || isSmallViewport;
const root = document.documentElement;

document.body.classList.add("motion-ready");

document.querySelectorAll(".tool-icon img").forEach((icon) => {
  icon.addEventListener("error", () => {
    icon.closest(".tool-icon")?.classList.add("icon-fallback");
  }, { once: true });
});

const toolsPanel = document.querySelector(".tools-panel");
const primaryToolsRow = document.querySelector(".tools-grid");

if (toolsPanel && primaryToolsRow && !toolsPanel.dataset.tickerReady) {
  toolsPanel.dataset.tickerReady = "true";
  primaryToolsRow.classList.add("tools-track", "tools-track-one");

  const originalTools = Array.from(primaryToolsRow.querySelectorAll(".tool-pill"));
  const secondToolsRow = document.createElement("ul");
  secondToolsRow.className = "tools-grid tools-track tools-track-two";
  secondToolsRow.setAttribute("aria-hidden", "true");
  toolsPanel.appendChild(secondToolsRow);

  originalTools.slice(Math.ceil(originalTools.length / 2)).forEach((tool) => {
    secondToolsRow.appendChild(tool);
  });

  if (!reducedMotion) {
    [primaryToolsRow, secondToolsRow].forEach((row) => {
      Array.from(row.children).forEach((tool) => {
        const clone = tool.cloneNode(true);
        clone.classList.add("tool-clone");
        clone.setAttribute("aria-hidden", "true");
        row.appendChild(clone);
      });
    });
  }

  document.querySelectorAll(".tool-icon img").forEach((icon) => {
    if (icon.dataset.fallbackReady === "true") return;
    icon.dataset.fallbackReady = "true";
    icon.addEventListener("error", () => {
      icon.closest(".tool-icon")?.classList.add("icon-fallback");
    }, { once: true });
  });
}

const reviewTrack = document.querySelector(".review-track");

if (reviewTrack && !reviewTrack.dataset.tickerReady) {
  reviewTrack.dataset.tickerReady = "true";

  if (!reducedMotion) {
    Array.from(reviewTrack.children).forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("review-clone");
      clone.setAttribute("aria-hidden", "true");
      reviewTrack.appendChild(clone);
    });
  }
}

if (reducedMotion) {
  document.querySelectorAll(".hero-video").forEach((video) => {
    video.pause();
  });
}

let scrollTimer;
window.addEventListener("scroll", () => {
  document.body.classList.add("is-scrolling");
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => document.body.classList.remove("is-scrolling"), 220);
}, { passive: true });

const scrollProgress = document.querySelector(".scroll-progress span");

function updateScrollProgress() {
  if (!scrollProgress) return;

  const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
  const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1);
  root.style.setProperty("--scroll-progress", progress.toFixed(4));
}

updateScrollProgress();
window.addEventListener("scroll", updateScrollProgress, { passive: true });
window.addEventListener("resize", updateScrollProgress, { passive: true });

if (!shouldReduceAmbientMotion) {
  const background = {
    frame: 0,
    x: 0,
    y: 0,
    scroll: 0,
    targetX: 0,
    targetY: 0,
    targetScroll: 0,
  };

  function paintBackground() {
    background.frame = 0;
    background.x += (background.targetX - background.x) * 0.09;
    background.y += (background.targetY - background.y) * 0.09;
    background.scroll += (background.targetScroll - background.scroll) * 0.08;

    root.style.setProperty("--bg-glow-x", `${background.x.toFixed(2)}px`);
    root.style.setProperty("--bg-glow-y", `${background.y.toFixed(2)}px`);
    root.style.setProperty("--bg-scroll-y", `${background.scroll.toFixed(2)}px`);
    root.style.setProperty("--bg-texture-x", `${(-background.x * 0.32).toFixed(2)}px`);
    root.style.setProperty("--bg-texture-y", `${(-background.y * 0.2).toFixed(2)}px`);

    const remaining =
      Math.abs(background.targetX - background.x) +
      Math.abs(background.targetY - background.y) +
      Math.abs(background.targetScroll - background.scroll);

    if (remaining > 0.2) background.frame = requestAnimationFrame(paintBackground);
  }

  function requestBackgroundPaint() {
    if (!background.frame) background.frame = requestAnimationFrame(paintBackground);
  }

  function moveBackground(clientX, clientY) {
    const x = clientX / window.innerWidth - 0.5;
    const y = clientY / window.innerHeight - 0.5;
    background.targetX = x * 28;
    background.targetY = y * 18;
    document.body.classList.add("background-active");
    requestBackgroundPaint();
  }

  window.addEventListener("pointermove", (event) => {
    moveBackground(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) moveBackground(touch.clientX, touch.clientY);
  }, { passive: true });

  function resetBackgroundPointer() {
    background.targetX = 0;
    background.targetY = 0;
    document.body.classList.remove("background-active");
    requestBackgroundPaint();
  }

  window.addEventListener("pointerleave", resetBackgroundPointer, { passive: true });
  window.addEventListener("touchend", resetBackgroundPointer, { passive: true });

  window.addEventListener("scroll", () => {
    background.targetScroll = -Math.min(window.scrollY * 0.04, 82);
    requestBackgroundPaint();
  }, { passive: true });

  background.targetScroll = -Math.min(window.scrollY * 0.04, 82);
  requestBackgroundPaint();
}

const galaxyCanvas = document.querySelector(".galaxy-background");

if (galaxyCanvas && !shouldReduceAmbientMotion) {
  initGalaxyBackground(galaxyCanvas);
}

function initHeroParticleNetwork(canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  const hero = canvas.closest(".hero");
  if (!context || !hero) return;

  const state = {
    frame: 0,
    height: 0,
    pointerX: 0.72,
    pointerY: 0.42,
    scroll: 0,
    targetX: 0.72,
    targetY: 0.42,
    targetScroll: 0,
    width: 0,
  };

  let dots = [];

  function resizeNetwork() {
    const rect = hero.getBoundingClientRect();
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    state.width = Math.max(rect.width, 1);
    state.height = Math.max(rect.height, 1);
    canvas.width = Math.floor(state.width * pixelRatio);
    canvas.height = Math.floor(state.height * pixelRatio);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = state.width < 760 ? 34 : 58;
    dots = Array.from({ length: count }, () => ({
      x: 0.5 + Math.random() * 0.52,
      y: 0.08 + Math.random() * 0.84,
      radius: 1.2 + Math.random() * 1.8,
      vx: (Math.random() - 0.5) * 0.00032,
      vy: (Math.random() - 0.5) * 0.00028,
      glow: 0.36 + Math.random() * 0.56,
    }));
  }

  function updatePointer(clientX, clientY) {
    const rect = hero.getBoundingClientRect();
    state.targetX = Math.min(Math.max((clientX - rect.left) / Math.max(rect.width, 1), 0), 1);
    state.targetY = Math.min(Math.max((clientY - rect.top) / Math.max(rect.height, 1), 0), 1);
  }

  function drawNetwork(now) {
    const elapsed = now * 0.001;
    state.pointerX += (state.targetX - state.pointerX) * 0.055;
    state.pointerY += (state.targetY - state.pointerY) * 0.055;
    state.scroll += (state.targetScroll - state.scroll) * 0.04;

    context.clearRect(0, 0, state.width, state.height);
    context.save();
    context.globalCompositeOperation = "screen";

    const focusX = state.width * (0.68 + (state.pointerX - 0.5) * 0.1);
    const focusY = state.height * (0.48 + (state.pointerY - 0.5) * 0.12 - state.scroll * 0.06);
    const glow = context.createRadialGradient(focusX, focusY, 0, focusX, focusY, Math.min(state.width, state.height) * 0.48);
    glow.addColorStop(0, "rgba(255, 96, 32, 0.18)");
    glow.addColorStop(0.36, "rgba(255, 151, 81, 0.055)");
    glow.addColorStop(1, "rgba(255, 96, 32, 0)");
    context.fillStyle = glow;
    context.fillRect(0, 0, state.width, state.height);

    const points = dots.map((dot) => {
      dot.x += dot.vx + Math.sin(elapsed * 0.45 + dot.glow * 4) * 0.00008;
      dot.y += dot.vy + Math.cos(elapsed * 0.42 + dot.glow * 5) * 0.00008;
      if (dot.x < 0.46 || dot.x > 1.08) dot.vx *= -1;
      if (dot.y < 0.04 || dot.y > 0.94) dot.vy *= -1;

      return {
        x: dot.x * state.width + (state.pointerX - 0.5) * 36,
        y: dot.y * state.height + (state.pointerY - 0.5) * 24 - state.scroll * 44,
        radius: dot.radius,
        glow: dot.glow,
      };
    });

    const linkDistance = state.width < 760 ? 88 : 124;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.hypot(dx, dy);
        if (distance > linkDistance) continue;

        const alpha = (1 - distance / linkDistance) * 0.42;
        context.beginPath();
        context.strokeStyle = `rgba(255, 101, 34, ${alpha})`;
        context.lineWidth = 0.7;
        context.moveTo(a.x, a.y);
        context.lineTo(b.x, b.y);
        context.stroke();
      }
    }

    points.forEach((point) => {
      context.beginPath();
      context.fillStyle = `rgba(255, 130, 66, ${0.3 + point.glow * 0.42})`;
      context.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
    state.frame = requestAnimationFrame(drawNetwork);
  }

  window.addEventListener("pointermove", (event) => updatePointer(event.clientX, event.clientY), { passive: true });
  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) updatePointer(touch.clientX, touch.clientY);
  }, { passive: true });
  window.addEventListener("scroll", () => {
    const rect = hero.getBoundingClientRect();
    state.targetScroll = Math.min(Math.max(-rect.top / Math.max(rect.height, 1), 0), 1.4);
  }, { passive: true });
  window.addEventListener("resize", resizeNetwork, { passive: true });

  resizeNetwork();
  state.frame = requestAnimationFrame(drawNetwork);
}

function initGalaxyBackground(canvas) {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return;

  const state = {
    frame: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
    scroll: 0,
    targetX: 0,
    targetY: 0,
    targetScroll: 0,
    width: 0,
  };

  let stars = [];
  const shapes = [
    { x: 2.08, y: -1.08, z: 4.35, scale: 1.12, speed: 0.12, alpha: 0.3 },
    { x: -2.72, y: 1.38, z: 5.15, scale: 0.8, speed: -0.1, alpha: 0.2 },
  ];

  const vertices = [
    [-1, -1, -1],
    [1, -1, -1],
    [1, 1, -1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, 1],
    [1, 1, 1],
    [-1, 1, 1],
    [0, -1.42, 0],
    [1.42, 0, 0],
    [0, 1.42, 0],
    [-1.42, 0, 0],
  ];

  const edges = [
    [0, 1], [1, 2], [2, 3], [3, 0],
    [4, 5], [5, 6], [6, 7], [7, 4],
    [0, 4], [1, 5], [2, 6], [3, 7],
    [8, 0], [8, 1], [8, 4], [8, 5],
    [9, 1], [9, 2], [9, 5], [9, 6],
    [10, 2], [10, 3], [10, 6], [10, 7],
    [11, 0], [11, 3], [11, 4], [11, 7],
  ];

  function resizeGalaxy() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.4);
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    canvas.width = Math.floor(state.width * pixelRatio);
    canvas.height = Math.floor(state.height * pixelRatio);
    canvas.style.width = `${state.width}px`;
    canvas.style.height = `${state.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const count = state.width < 640 ? 86 : 156;
    stars = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * 8.8,
      y: (Math.random() - 0.5) * 5.2,
      z: 2 + Math.random() * 6.4,
      size: 0.55 + Math.random() * 1.55,
      tone: Math.random() > 0.68 ? "orange" : "white",
      twinkle: Math.random() * Math.PI * 2,
      speed: 0.18 + Math.random() * 0.32,
    }));
  }

  function updateGalaxyPointer(clientX, clientY) {
    state.targetX = clientX / window.innerWidth - 0.5;
    state.targetY = clientY / window.innerHeight - 0.5;
  }

  function rotatePoint(point, angleX, angleY, angleZ, scale) {
    let [x, y, z] = point;
    x *= scale;
    y *= scale;
    z *= scale;

    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    const yOne = y * cosX - z * sinX;
    const zOne = y * sinX + z * cosX;
    y = yOne;
    z = zOne;

    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    const xTwo = x * cosY + z * sinY;
    const zTwo = -x * sinY + z * cosY;
    x = xTwo;
    z = zTwo;

    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);
    return [
      x * cosZ - y * sinZ,
      x * sinZ + y * cosZ,
      z,
    ];
  }

  function projectPoint(point, originX, originY, depthOffset, unit) {
    const camera = 7.2;
    const depth = camera / (camera + point[2] + depthOffset);
    return {
      x: originX + point[0] * unit * depth,
      y: originY + point[1] * unit * depth,
      depth,
    };
  }

  function drawStars(elapsed, unit) {
    context.save();
    context.globalCompositeOperation = "screen";

    const mistX = state.width * 0.7 + state.pointerX * unit * 0.24;
    const mistY = state.height * 0.28 + state.pointerY * unit * 0.18 - state.scroll * unit * 0.18;
    const mist = context.createRadialGradient(mistX, mistY, 0, mistX, mistY, unit * 1.36);
    mist.addColorStop(0, "rgba(255, 74, 18, 0.12)");
    mist.addColorStop(0.34, "rgba(255, 255, 255, 0.035)");
    mist.addColorStop(1, "rgba(255, 74, 18, 0)");
    context.fillStyle = mist;
    context.fillRect(0, 0, state.width, state.height);

    stars.forEach((star) => {
      const driftX = state.pointerX * 0.5;
      const driftY = state.pointerY * 0.32 - state.scroll * 0.8;
      const depth = 7 / (7 + star.z);
      const x = state.width / 2 + (star.x + driftX) * unit * depth;
      const y = state.height / 2 + (star.y + driftY) * unit * depth;
      const pulse = 0.62 + Math.sin(elapsed * star.speed + star.twinkle) * 0.3;
      const opacity = Math.max(0.13, pulse * depth * 0.88);

      context.beginPath();
      context.fillStyle = star.tone === "orange"
        ? `rgba(255, 96, 42, ${opacity})`
        : `rgba(255, 255, 255, ${opacity})`;
      context.arc(x, y, star.size * depth, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }

  function drawShape(shape, elapsed, unit) {
    const originX = state.width / 2 + shape.x * unit * 0.42 + state.pointerX * unit * 0.34;
    const originY = state.height / 2 + shape.y * unit * 0.42 + state.pointerY * unit * 0.24 - state.scroll * unit * 0.28;
    const angle = elapsed * shape.speed;
    const projected = vertices.map((vertex) => {
      const rotated = rotatePoint(
        vertex,
        angle * 0.72 + state.pointerY * 0.42,
        angle + state.pointerX * 0.62,
        angle * 0.38,
        shape.scale
      );
      return projectPoint(rotated, originX, originY, shape.z, unit);
    });

    context.save();
    context.globalCompositeOperation = "screen";
    context.lineWidth = state.width < 640 ? 0.75 : 1;
    context.strokeStyle = `rgba(255, 82, 22, ${shape.alpha})`;

    edges.forEach(([start, end]) => {
      const a = projected[start];
      const b = projected[end];
      context.beginPath();
      context.moveTo(a.x, a.y);
      context.lineTo(b.x, b.y);
      context.stroke();
    });

    [projected[0], projected[6], projected[8], projected[10]].forEach((point, index) => {
      context.beginPath();
      context.fillStyle = index % 2
        ? `rgba(255, 255, 255, ${shape.alpha * 0.58})`
        : `rgba(255, 78, 22, ${shape.alpha * 0.9})`;
      context.arc(point.x, point.y, (state.width < 640 ? 2.2 : 3.2) * point.depth, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }

  function renderGalaxy(now) {
    const elapsed = now * 0.001;
    state.pointerX += (state.targetX - state.pointerX) * 0.035;
    state.pointerY += (state.targetY - state.pointerY) * 0.035;
    state.scroll += (state.targetScroll - state.scroll) * 0.035;

    context.clearRect(0, 0, state.width, state.height);

    const unit = Math.min(state.width, state.height) * (state.width < 640 ? 0.36 : 0.3);
    drawStars(elapsed, unit);
    shapes.forEach((shape) => drawShape(shape, elapsed, unit));

    state.frame = requestAnimationFrame(renderGalaxy);
  }

  window.addEventListener("pointermove", (event) => {
    updateGalaxyPointer(event.clientX, event.clientY);
  }, { passive: true });

  window.addEventListener("touchmove", (event) => {
    const touch = event.touches[0];
    if (touch) updateGalaxyPointer(touch.clientX, touch.clientY);
  }, { passive: true });

  window.addEventListener("pointerleave", () => {
    state.targetX = 0;
    state.targetY = 0;
  }, { passive: true });

  window.addEventListener("scroll", () => {
    state.targetScroll = Math.min(window.scrollY * 0.0005, 1.15);
  }, { passive: true });

  window.addEventListener("resize", resizeGalaxy, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state.frame) {
      cancelAnimationFrame(state.frame);
      state.frame = 0;
    } else if (!document.hidden && !state.frame) {
      state.frame = requestAnimationFrame(renderGalaxy);
    }
  });

  resizeGalaxy();
  document.body.classList.add("galaxy-ready");
  state.targetScroll = Math.min(window.scrollY * 0.0005, 1.15);
  state.frame = requestAnimationFrame(renderGalaxy);
}

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

function smoothScrollTo(targetY, duration = 560) {
  if (reducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const startY = window.scrollY;
  const distance = targetY - startY;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeOutCubic(progress));
    if (progress < 1) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const id = link.getAttribute("href");
    if (!id || id === "#") return;

    const target = document.querySelector(id);
    if (!target) return;

    event.preventDefault();
    const offset = id === "#home" ? 0 : 72;
    smoothScrollTo(target.getBoundingClientRect().top + window.scrollY - offset);
    history.pushState(null, "", id);
  });
});

const typewriterTargets = Array.from(document.querySelectorAll("[data-typewriter]"));

function runTypewriter(element) {
  const text = element.dataset.typewriter || element.textContent.trim();
  if (!text || element.dataset.typed === "true") return;

  element.dataset.typed = "true";
  if (reducedMotion) {
    element.textContent = text;
    element.classList.add("is-typed");
    return;
  }

  element.textContent = "";
  let index = 0;
  const type = () => {
    index += 1;
    element.textContent = text.slice(0, index);
    if (index < text.length) {
      window.setTimeout(type, 72);
    } else {
      element.classList.add("is-typed");
    }
  };
  window.setTimeout(type, 180);
}

typewriterTargets.forEach((element) => {
  if (reducedMotion) {
    runTypewriter(element);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      runTypewriter(entry.target);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.45 });

  observer.observe(element);
});

const scrambleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&<>/[]{}";
const scrambleLabels = Array.from(document.querySelectorAll(".skill-track span")).map((item) => {
  const textNode = Array.from(item.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
  if (!textNode) return null;

  const label = document.createElement("em");
  label.className = "scramble-text";
  label.dataset.scrambleText = textNode.textContent.trim();
  label.textContent = label.dataset.scrambleText;
  item.replaceChild(label, textNode);
  return label;
}).filter(Boolean);

function scrambleText(element) {
  const finalText = element.dataset.scrambleText || element.textContent;
  if (!finalText || reducedMotion || element.dataset.scrambling === "true") return;

  element.dataset.scrambling = "true";
  element.classList.add("is-scrambling");
  let frame = 0;
  const totalFrames = Math.max(18, finalText.length * 3);

  const draw = () => {
    frame += 1;
    const locked = Math.floor((frame / totalFrames) * finalText.length);
    element.textContent = finalText
      .split("")
      .map((char, index) => {
        if (char === " " || index < locked) return char;
        return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
      })
      .join("");

    if (frame < totalFrames) {
      requestAnimationFrame(draw);
    } else {
      element.textContent = finalText;
      element.classList.remove("is-scrambling");
      element.dataset.scrambling = "false";
    }
  };

  requestAnimationFrame(draw);
}

if (scrambleLabels.length) {
  if (reducedMotion) {
    scrambleLabels.forEach((label) => {
      label.textContent = label.dataset.scrambleText;
    });
  } else {
    const scrambleObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        scrambleLabels.forEach((label, index) => {
          window.setTimeout(() => scrambleText(label), index * 38);
        });
        scrambleObserver.disconnect();
      });
    }, { threshold: 0.2 });

    const marquee = document.querySelector(".skill-marquee");
    if (marquee) scrambleObserver.observe(marquee);
    scrambleLabels.forEach((label) => {
      label.parentElement?.addEventListener("pointerenter", () => scrambleText(label), { passive: true });
      label.parentElement?.addEventListener("focus", () => scrambleText(label), { passive: true });
    });
  }
}

const parallaxPortraits = Array.from(document.querySelectorAll(".hero-portrait"));

if (parallaxPortraits.length && !shouldReduceAmbientMotion) {
  parallaxPortraits.forEach((heroPortrait) => {
    heroPortrait.addEventListener("pointermove", (event) => {
      const rect = heroPortrait.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    heroPortrait.style.setProperty("--portrait-rotate-x", `${(-y * 12).toFixed(2)}deg`);
    heroPortrait.style.setProperty("--portrait-rotate-y", `${(x * 14).toFixed(2)}deg`);
    heroPortrait.style.setProperty("--portrait-shift-x", `${(x * 10).toFixed(2)}px`);
    heroPortrait.style.setProperty("--portrait-shift-y", `${(y * 8).toFixed(2)}px`);
    heroPortrait.style.setProperty("--portrait-glow-x", `${((x + 0.5) * 100).toFixed(1)}%`);
    heroPortrait.style.setProperty("--portrait-glow-y", `${((y + 0.5) * 100).toFixed(1)}%`);
    }, { passive: true });

    heroPortrait.addEventListener("pointerleave", () => {
      heroPortrait.style.removeProperty("--portrait-rotate-x");
      heroPortrait.style.removeProperty("--portrait-rotate-y");
      heroPortrait.style.removeProperty("--portrait-shift-x");
      heroPortrait.style.removeProperty("--portrait-shift-y");
      heroPortrait.style.removeProperty("--portrait-glow-x");
      heroPortrait.style.removeProperty("--portrait-glow-y");
    }, { passive: true });
  });
}

if (!shouldReduceAmbientMotion) {
  document.querySelectorAll(".tag-cloud span, .hero-editorial span, .tool-pill").forEach((pill) => {
    pill.classList.add("magnetic-pill");

    pill.addEventListener("pointermove", (event) => {
      const rect = pill.getBoundingClientRect();
      const x = (event.clientX - (rect.left + rect.width / 2)) / Math.max(rect.width, 1);
      const y = (event.clientY - (rect.top + rect.height / 2)) / Math.max(rect.height, 1);
      const maxPull = pill.matches(".tool-pill") ? 7 : 6;
      const magnetX = Math.max(-maxPull, Math.min(maxPull, x * maxPull * 2));
      const magnetY = Math.max(-maxPull, Math.min(maxPull, y * maxPull * 2));
      pill.style.setProperty("--magnet-x", `${magnetX.toFixed(2)}px`);
      pill.style.setProperty("--magnet-y", `${magnetY.toFixed(2)}px`);
      pill.style.setProperty("--ring-origin-x", `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      pill.style.setProperty("--ring-origin-y", `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    }, { passive: true });

    pill.addEventListener("pointerleave", () => {
      pill.style.setProperty("--magnet-x", "0px");
      pill.style.setProperty("--magnet-y", "0px");
    }, { passive: true });
  });
}

const projectTicker = document.querySelector(".project-masonry");

if (projectTicker && !reducedMotion && !projectTicker.dataset.tickerReady) {
  projectTicker.dataset.tickerReady = "true";
  projectTicker.querySelectorAll(".masonry-column").forEach((row) => {
    if (row.querySelector(".ticker-clone")) return;

    Array.from(row.querySelectorAll(".project-card")).forEach((card) => {
      const clone = card.cloneNode(true);
      clone.classList.add("ticker-clone");
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("tabindex", "-1");
      row.appendChild(clone);
    });
  });
}

const tickerDepthCards = Array.from(document.querySelectorAll(".project-card"));
const parallaxTargets = Array.from(document.querySelectorAll(".project-card:not(.ticker-clone), .recent-card, .image-block"));

if (!shouldReduceAmbientMotion) {
  let parallaxFrame = 0;

  function updateScrollMotion() {
    parallaxFrame = 0;
    const viewportHeight = window.innerHeight || 1;
    const scrollY = window.scrollY || 0;
    const heroProgress = Math.min(Math.max(scrollY / Math.max(viewportHeight, 1), 0), 1);

    root.style.setProperty("--hero-zoom", (1.08 + heroProgress * 0.085).toFixed(3));
    root.style.setProperty("--hero-parallax-y", `${(heroProgress * 42).toFixed(2)}px`);
    root.style.setProperty("--cta-zoom", (1.12 + Math.min(scrollY / 4200, 0.055)).toFixed(3));
    root.style.setProperty("--cta-parallax-y", `${(-Math.min(scrollY / 80, 22)).toFixed(2)}px`);

    const viewportWidth = window.innerWidth || 1;
    tickerDepthCards.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.right < -180 || rect.left > viewportWidth + 180) return;

      const center = rect.left + rect.width / 2;
      const distance = Math.max(-1, Math.min(1, (center - viewportWidth / 2) / viewportWidth));
      const closeness = 1 - Math.min(Math.abs(distance) * 1.8, 1);

      element.style.setProperty("--ticker-tilt", `${(-distance * 22).toFixed(2)}deg`);
      element.style.setProperty("--ticker-z", `${(-12 + closeness * 38).toFixed(2)}px`);
      element.style.setProperty("--ticker-scale", (0.965 + closeness * 0.045).toFixed(3));
    });

    parallaxTargets.forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.bottom < -120 || rect.top > viewportHeight + 120) return;

      const center = rect.top + rect.height / 2;
      const distance = (center - viewportHeight / 2) / viewportHeight;
      const strength = element.matches(".project-card, .recent-card") ? 18 : 10;
      const zoom = Math.max(0, 0.018 - Math.abs(distance) * 0.01);

      element.style.setProperty("--image-parallax-y", `${(-distance * strength).toFixed(2)}px`);
      element.style.setProperty("--image-parallax-zoom", zoom.toFixed(3));
    });
  }

  function requestScrollMotion() {
    if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateScrollMotion);
  }

  window.addEventListener("scroll", requestScrollMotion, { passive: true });
  window.addEventListener("resize", requestScrollMotion, { passive: true });
  requestScrollMotion();
}

const textMotionTargets = [
  ".hero-issue",
  ".hero .eyebrow",
  ".hero h1",
  ".hero-copy",
  ".hero-editorial",
  ".copy-block h2",
  ".copy-block > p:not(.eyebrow)",
  ".recent-header p",
  ".stats h3",
  ".stats p",
  ".tools-heading",
  ".final-cta h3",
].flatMap((selector) => Array.from(document.querySelectorAll(selector)));

const revealTargets = [
  ".project-card:not(.ticker-clone)",
  ".split-section",
  ".recent-work",
  ".service-card",
  ".review-card",
  ".stats > div",
  ".tools-panel",
  ".tool-pill",
  ".faq-item",
  ".final-cta > .eyebrow",
  ".final-cta h3",
  ".final-cta .glass-button",
  ".socials",
  ".footer-line",
].flatMap((selector) => Array.from(document.querySelectorAll(selector)));

textMotionTargets.forEach((element) => {
  if (!revealTargets.includes(element)) revealTargets.push(element);
});

if (!shouldReduceAmbientMotion) {
  document.querySelectorAll(".project-card:not(.ticker-clone), .recent-card").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--reveal-x", `${x.toFixed(1)}%`);
      card.style.setProperty("--reveal-y", `${y.toFixed(1)}%`);
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      card.style.removeProperty("--reveal-x");
      card.style.removeProperty("--reveal-y");
    }, { passive: true });
  });
}

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  if (textMotionTargets.includes(element)) element.classList.add("text-motion");
  if (element.matches(".project-card, .recent-card")) element.classList.add("scale-in");
  element.style.setProperty("--reveal-delay", `${Math.min(index % 5, 4) * 32}ms`);
});

if (reducedMotion) {
  revealTargets.forEach((element) => element.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });

  revealTargets.forEach((element) => observer.observe(element));
}

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach((item) => {
  item.addEventListener("click", () => {
    faqItems.forEach((other) => {
      if (other !== item) other.classList.remove("active");
    });
    item.classList.toggle("active");
  });
});

const track = document.querySelector(".recent-track");

if (track) {
  let isDragging = false;
  let startX = 0;
  let startScrollLeft = 0;
  let moved = false;
  let suppressClick = false;

  track.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    isDragging = true;
    moved = false;
    startX = event.clientX;
    startScrollLeft = track.scrollLeft;
    track.classList.add("is-dragging");
    track.setPointerCapture?.(event.pointerId);
  });

  track.addEventListener("pointermove", (event) => {
    if (!isDragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 4) moved = true;
    track.scrollLeft = startScrollLeft - delta;
    event.preventDefault();
  });

  const stopDragging = (event) => {
    if (!isDragging) return;
    isDragging = false;
    suppressClick = moved;
    track.classList.remove("is-dragging");
    track.releasePointerCapture?.(event.pointerId);
  };

  track.addEventListener("pointerup", stopDragging);
  track.addEventListener("pointercancel", stopDragging);
  track.addEventListener("pointerleave", stopDragging);

  track.addEventListener(
    "click",
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    },
    true
  );
}
