(() => {
  "use strict";

  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector("[data-header]");
  const progress = document.querySelector(".page-progress span");
  const glow = document.querySelector(".cursor-glow");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  root.classList.add("js-ready");

  document.querySelector("[data-year]").textContent = new Date().getFullYear();

  const revealItems = [...document.querySelectorAll(".reveal, .reveal-media")];

  if ("IntersectionObserver" in window && !prefersReducedMotion.matches) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -5%" },
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  window.setTimeout(() => {
    document
      .querySelectorAll(".hero .reveal, .hero .reveal-media")
      .forEach((item) => item.classList.add("is-visible"));
  }, 100);

  // A failed observer must never leave editorial text hidden.
  window.setTimeout(() => {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }, 900);

  const parallaxItems = [...document.querySelectorAll("[data-parallax]")];
  const storyPath = document.querySelector("[data-story-path]");
  let scrollTicking = false;

  const updateOnScroll = () => {
    const scrollY = window.scrollY;
    const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);

    progress.style.transform = `scaleX(${Math.min(scrollY / maxScroll, 1)})`;
    header.classList.toggle("is-scrolled", scrollY > 24);

    if (!prefersReducedMotion.matches) {
      parallaxItems.forEach((item) => {
        const rect = item.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) return;
        const speed = Number(item.dataset.parallax || 0);
        const centerDelta = rect.top + rect.height / 2 - window.innerHeight / 2;
        item.style.setProperty("--parallax-y", `${centerDelta * speed}px`);
      });

      if (storyPath) {
        const rect = storyPath.getBoundingClientRect();
        const start = window.innerHeight * 0.78;
        const finish = window.innerHeight * 0.23;
        const storyProgress = Math.min(Math.max((start - rect.top) / (start - finish), 0), 1);
        storyPath.style.setProperty("--story-progress", storyProgress.toFixed(3));
      }
    }

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) return;
    scrollTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  updateOnScroll();
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let glowX = pointerX;
    let glowY = pointerY;

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      glow.classList.add("is-visible");
    });

    document.documentElement.addEventListener("mouseleave", () => glow.classList.remove("is-visible"));

    const animateGlow = () => {
      glowX += (pointerX - glowX) * 0.12;
      glowY += (pointerY - glowY) * 0.12;
      glow.style.transform = `translate3d(${glowX - 130}px, ${glowY - 130}px, 0)`;
      window.requestAnimationFrame(animateGlow);
    };

    if (!prefersReducedMotion.matches) animateGlow();

    document.querySelectorAll(".magnetic").forEach((button) => {
      button.addEventListener("pointermove", (event) => {
        if (prefersReducedMotion.matches) return;
        const rect = button.getBoundingClientRect();
        const x = (event.clientX - rect.left - rect.width / 2) * 0.12;
        const y = (event.clientY - rect.top - rect.height / 2) * 0.18;
        button.style.setProperty("--mag-x", `${x}px`);
        button.style.setProperty("--mag-y", `${y}px`);
      });

      button.addEventListener("pointerleave", () => {
        button.style.setProperty("--mag-x", "0px");
        button.style.setProperty("--mag-y", "0px");
      });
    });
  }

  const menuToggle = document.querySelector("[data-menu-toggle]");
  const nav = document.querySelector("[data-nav]");

  const closeMenu = () => {
    menuToggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("is-open");
    body.classList.remove("menu-open");
  };

  menuToggle.addEventListener("click", () => {
    const nextState = menuToggle.getAttribute("aria-expanded") !== "true";
    menuToggle.setAttribute("aria-expanded", String(nextState));
    nav.classList.toggle("is-open", nextState);
    body.classList.toggle("menu-open", nextState);
    if (nextState) window.setTimeout(() => nav.querySelector("a")?.focus(), 120);
  });

  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

  const scrollToHash = (hash, updateHistory = true) => {
    if (!hash || hash === "#") return false;

    let targetId;
    try {
      targetId = decodeURIComponent(hash.slice(1));
    } catch {
      return false;
    }

    const target = document.getElementById(targetId);
    if (!target) return false;

    const anchorPoint = target.classList.contains("section")
      ? target.querySelector(".section-kicker") || target
      : target;
    const headerHeight = header?.getBoundingClientRect().height || 0;
    const breathingRoom = window.innerWidth <= 650 ? 18 : 28;
    const top = Math.max(
      0,
      window.scrollY + anchorPoint.getBoundingClientRect().top - headerHeight - breathingRoom,
    );

    if (updateHistory && window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }

    window.scrollTo({
      top,
      behavior: prefersReducedMotion.matches ? "auto" : "smooth",
    });
    return true;
  };

  document.querySelectorAll('a[href^="#"]:not(.skip-link)').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!scrollToHash(hash)) return;
      event.preventDefault();
    });
  });

  const alignHashAfterNativeNavigation = () => {
    if (!window.location.hash) return;
    window.requestAnimationFrame(() => scrollToHash(window.location.hash, false));
  };

  window.addEventListener("load", alignHashAfterNativeNavigation);
  window.addEventListener("hashchange", alignHashAfterNativeNavigation);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("is-open")) {
      closeMenu();
      menuToggle.focus();
    }

    if (event.key === "Tab" && nav.classList.contains("is-open")) {
      const focusable = [menuToggle, ...nav.querySelectorAll("a")];
      const currentIndex = focusable.indexOf(document.activeElement);
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex < 0 || nextIndex >= focusable.length) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    }
  });

  const sections = [...document.querySelectorAll("main section[id]")];
  const navLinks = [...nav.querySelectorAll('a[href^="#"]')];

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navLinks.forEach((link) => {
            link.classList.toggle("is-current", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-35% 0px -55%", threshold: 0 },
    );

    sections.forEach((section) => sectionObserver.observe(section));
  }

  const worldTabs = [...document.querySelectorAll("[data-world]")];
  const worldPanels = [...document.querySelectorAll("[data-panel]")];
  const worldsContainer = document.querySelector(".worlds");

  worldsContainer.dataset.active = "strategy";

  const selectWorld = (world, shouldFocus = false) => {
    worldsContainer.dataset.active = world;
    worldTabs.forEach((tab) => {
      const selected = tab.dataset.world === world;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected && shouldFocus) tab.focus();
    });

    worldPanels.forEach((panel) => {
      const selected = panel.dataset.panel === world;
      panel.classList.toggle("is-active", selected);
      panel.hidden = !selected;
    });
  };

  worldTabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectWorld(tab.dataset.world));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % worldTabs.length;
      if (event.key === "ArrowLeft") nextIndex = (index - 1 + worldTabs.length) % worldTabs.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = worldTabs.length - 1;

      selectWorld(worldTabs[nextIndex].dataset.world, true);
    });
  });

  const form = document.querySelector("[data-form]");
  const success = document.querySelector("[data-form-success]");
  const successName = document.querySelector("[data-success-name]");
  const resetButton = document.querySelector("[data-form-reset]");
  const formFields = [...form.querySelectorAll("input[required], textarea[required]")];

  const validateField = (field) => {
    const wrapper = field.closest(".field");
    if (!wrapper) return field.checkValidity();
    const isValid = field.checkValidity();
    wrapper.classList.toggle("has-error", !isValid);
    field.setAttribute("aria-invalid", String(!isValid));
    return isValid;
  };

  formFields.forEach((field) => {
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".field")?.classList.contains("has-error")) validateField(field);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const allValid = formFields.map(validateField).every(Boolean);

    if (!allValid) {
      const firstInvalid = formFields.find((field) => !field.checkValidity());
      firstInvalid?.focus();
      return;
    }

    const name = form.elements.name.value.trim().split(/\s+/)[0];
    successName.textContent = name || "друг";
    form.hidden = true;
    success.hidden = false;
    success.querySelector("button").focus();
  });

  resetButton.addEventListener("click", () => {
    form.reset();
    formFields.forEach((field) => {
      field.removeAttribute("aria-invalid");
      field.closest(".field")?.classList.remove("has-error");
    });
    success.hidden = true;
    form.hidden = false;
    form.elements.name.focus();
  });

  prefersReducedMotion.addEventListener?.("change", () => {
    root.classList.toggle("reduced-motion", prefersReducedMotion.matches);
  });
})();
