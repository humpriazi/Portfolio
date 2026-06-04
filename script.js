const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.body.classList.add("motion-ready");

let scrollTimer;
window.addEventListener("scroll", () => {
  document.body.classList.add("is-scrolling");
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => document.body.classList.remove("is-scrolling"), 220);
}, { passive: true });

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
