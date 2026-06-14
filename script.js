const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

document.body.classList.add("motion-ready");

let scrollTimer;
window.addEventListener("scroll", () => {
  document.body.classList.add("is-scrolling");
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => document.body.classList.remove("is-scrolling"), 220);
}, { passive: true });

if (!reducedMotion) {
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
    background.targetX = x * 44;
    background.targetY = y * 30;
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

const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

function smoothScrollTo(targetY, duration = 620) {
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

const revealTargets = [
  ".project-card",
  ".split-section",
  ".recent-work",
  ".service-card",
  ".review-card",
  ".stats > div",
  ".faq-item",
  ".final-cta > .eyebrow",
  ".final-cta h3",
  ".final-cta .glass-button",
  ".socials",
  ".footer-line",
].flatMap((selector) => Array.from(document.querySelectorAll(selector)));

revealTargets.forEach((element, index) => {
  element.classList.add("reveal");
  if (element.matches(".project-card, .recent-card")) element.classList.add("scale-in");
  element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 35}ms`);
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
const prev = document.querySelector(".carousel-prev");
const next = document.querySelector(".carousel-next");

if (track && prev && next) {
  const moveBy = () => Math.min(track.clientWidth * 0.9, 548);
  prev.addEventListener("click", () => track.scrollBy({ left: -moveBy(), behavior: reducedMotion ? "auto" : "smooth" }));
  next.addEventListener("click", () => track.scrollBy({ left: moveBy(), behavior: reducedMotion ? "auto" : "smooth" }));
}
