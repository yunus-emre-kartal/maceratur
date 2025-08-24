// Yıl
document.getElementById("y").textContent = new Date().getFullYear();

// Header scroll efekti
const header = document.querySelector(".site-header");
const onScroll = () => {
  const top = window.scrollY || document.documentElement.scrollTop;
  if (top > 10) header.classList.add("scrolled");
  else header.classList.remove("scrolled");
};
window.addEventListener("scroll", onScroll);
onScroll();

// Mobil menü
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
toggle.addEventListener("click", () => nav.classList.toggle("open"));

/* ================= HERO SLIDER ================= */
(() => {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dots = Array.from(document.querySelectorAll(".dot"));
  const prevBtn = document.querySelector(".prev");
  const nextBtn = document.querySelector(".next");
  if (!slides.length) return;

  let current = 0;
  let timer;

  function show(i) {
    slides[current].classList.remove("active");
    dots[current]?.classList.remove("active");
    current = (i + slides.length) % slides.length;
    slides[current].classList.add("active");
    dots[current]?.classList.add("active");
  }
  function next() {
    show(current + 1);
  }
  function prev() {
    show(current - 1);
  }

  function autoplay() {
    clearInterval(timer);
    timer = setInterval(next, 5000);
  }

  dots.forEach((d, i) =>
    d.addEventListener("click", () => {
      show(i);
      autoplay();
    })
  );
  prevBtn?.addEventListener("click", () => {
    prev();
    autoplay();
  });
  nextBtn?.addEventListener("click", () => {
    next();
    autoplay();
  });

  autoplay();
})();

/* ========== STATS COUNTER (IntersectionObserver) ========== */
(() => {
  const counters = document.querySelectorAll(".num");
  const statsSection = document.querySelector(".stats");
  if (!counters.length || !statsSection) return;

  let started = false;
  function run() {
    counters.forEach((el) => {
      const target = +el.dataset.target;
      const step = Math.max(1, Math.floor(target / 120));
      let n = 0;
      const int = setInterval(() => {
        n += step;
        if (n >= target) {
          n = target;
          clearInterval(int);
        }
        el.textContent = n.toLocaleString("tr-TR");
      }, 16);
    });
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true;
          run();
        }
      });
    },
    { threshold: 0.25 }
  );
  io.observe(statsSection);
})();

/* ========== INFINITE TOUR STRIP (flex) ========== */
(() => {
  const strip = document.getElementById("tourStrip");
  const prevBtn = document.querySelector(".strip-prev");
  const nextBtn = document.querySelector(".strip-next");
  if (!strip || !prevBtn || !nextBtn) return;

  const ITEM = ".tour";
  let real = [];
  let step = 0;
  let cols = 4;

  const getCols = () => {
    const v = getComputedStyle(strip).getPropertyValue("--cols").trim();
    const n = parseInt(v || "4", 10);
    return isNaN(n) ? 4 : n;
  };

  const measureStep = () => {
    const firstReal = Array.from(strip.querySelectorAll(ITEM)).find(
      (el) => !el.classList.contains("clone")
    );
    if (!firstReal) return 300;
    const gap = parseFloat(getComputedStyle(strip).gap) || 18;
    const w = Math.round(firstReal.getBoundingClientRect().width);
    return w + gap; // bir kart + gap
  };

  const instantJump = (index) => {
    strip.style.scrollBehavior = "auto";
    strip.scrollLeft = Math.round(index * step);
    void strip.offsetWidth; // reflow
    strip.style.scrollBehavior = "smooth";
  };

  const build = () => {
    // Eski klonları sil
    strip.querySelectorAll(`${ITEM}.clone`).forEach((n) => n.remove());

    // Gerçek kartları al
    real = Array.from(strip.querySelectorAll(ITEM)).filter(
      (n) => !n.classList.contains("clone")
    );

    cols = getCols();
    if (real.length === 0) return;

    // Kenarlara klon ekle (sola son N, sağa ilk N)
    const head = real.slice(0, cols).map((n) => {
      const c = n.cloneNode(true);
      c.classList.add("clone");
      c.setAttribute("aria-hidden", "true");
      c.tabIndex = -1;
      return c;
    });
    const tail = real.slice(-cols).map((n) => {
      const c = n.cloneNode(true);
      c.classList.add("clone");
      c.setAttribute("aria-hidden", "true");
      c.tabIndex = -1;
      return c;
    });
    tail.forEach((c) => strip.insertBefore(c, strip.firstChild));
    head.forEach((c) => strip.appendChild(c));

    step = measureStep();
    instantJump(cols); // başlangıç pozisyonu
  };

  // Scroll’da sınırı kontrol et → görünmez wrap
  const onScroll = () => {
    if (strip._ticking) return;
    strip._ticking = true;
    requestAnimationFrame(() => {
      const total = real.length;
      const i = Math.round(strip.scrollLeft / step);
      if (i < cols) instantJump(i + total);
      else if (i >= cols + total) instantJump(i - total);
      strip._ticking = false;
    });
  };

  // Butonlar tam bir kart ilerletsin
  const move = (dir) =>
    strip.scrollBy({ left: dir * step, behavior: "smooth" });
  prevBtn.addEventListener("click", () => move(-1));
  nextBtn.addEventListener("click", () => move(1));

  // Resimler yüklenince ölç → güvenilir adım
  const imgs = strip.querySelectorAll("img");
  let left = imgs.length;
  const done = () => {
    if (--left <= 0) {
      build();
    }
  };
  if (left)
    imgs.forEach((img) =>
      img.complete
        ? done()
        : (img.addEventListener("load", done),
          img.addEventListener("error", done))
    );
  else build();

  // Scroll & responsive
  strip.addEventListener("scroll", onScroll);
  let rsz;
  window.addEventListener("resize", () => {
    clearTimeout(rsz);
    rsz = setTimeout(build, 120);
  });

  // Autoplay (dur/kalk)
  let auto = setInterval(() => nextBtn.click(), 3500);
  ["mouseenter", "touchstart", "focusin"].forEach((ev) =>
    strip.addEventListener(ev, () => clearInterval(auto))
  );
  ["mouseleave", "touchend", "focusout"].forEach((ev) =>
    strip.addEventListener(
      ev,
      () => (auto = setInterval(() => nextBtn.click(), 3500))
    )
  );
})();

/* ========== TESTIMONIALS (piksel bazlı) ========== */
(() => {
  const viewport = document.querySelector(".testi-viewport");
  const track = document.querySelector(".testi-track");
  const prev = document.querySelector(".t-prev");
  const next = document.querySelector(".t-next");
  if (!viewport || !track || !prev || !next) return;

  let index = 0;
  const total = track.children.length;

  const slideW = () => Math.round(viewport.getBoundingClientRect().width);

  function go(i) {
    index = (i + total) % total;
    track.style.transform = `translateX(-${index * slideW()}px)`;
  }

  prev.addEventListener("click", () => go(index - 1));
  next.addEventListener("click", () => go(index + 1));

  // Resize olunca bulunduğun slaytı koru
  let rsz;
  window.addEventListener("resize", () => {
    clearTimeout(rsz);
    rsz = setTimeout(() => go(index), 100);
  });

  // İlk hizalama
  go(0);
})();

/* ========== Yumuşak kaydırma (anchor) ========== */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const el = document.querySelector(id);
    if (!el) return;
    e.preventDefault();
    const headerOffset = header.classList.contains("scrolled") ? 68 : 108;
    const y =
      el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
    nav.classList.remove("open");
  });
});
