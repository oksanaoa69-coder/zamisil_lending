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
      ? target.querySelector(".display-heading") || target.querySelector(".section-kicker") || target
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

  const clubGallery = document.querySelector("[data-club-gallery]");

  if (clubGallery) {
    const clubStage = clubGallery.querySelector("[data-club-stage]");
    const clubScenes = [...clubGallery.querySelectorAll("[data-club-scene]")];
    const clubTabs = [...clubGallery.querySelectorAll("[data-club-tab]")];
    const clubPrevious = clubGallery.querySelector("[data-club-prev]");
    const clubNext = clubGallery.querySelector("[data-club-next]");
    const clubCounter = clubGallery.querySelector("[data-club-counter]");
    const clubStatus = clubGallery.querySelector("[data-club-status]");
    const clubHint = clubGallery.querySelector(".club-panorama-hint span");
    const coarsePointer = window.matchMedia("(hover: none), (pointer: coarse)");
    const cycleDuration = 8000;

    let activeScene = Math.max(
      clubScenes.findIndex((scene) => scene.classList.contains("is-active")),
      0,
    );
    let targetPan = 50;
    let currentPan = 50;
    let panFrame = 0;
    let cycleTimer = 0;
    let transitionTimer = 0;
    let galleryVisible = !("IntersectionObserver" in window);
    let hoveringGallery = false;
    let focusWithinGallery = false;
    let draggingPanorama = false;
    let dragPointerId = null;

    if (clubHint) {
      clubHint.textContent = coarsePointer.matches
        ? "Проведите по фото — осмотритесь"
        : "Двигайте курсор — осмотритесь";
    }

    const pauseClubCycle = () => {
      window.clearTimeout(cycleTimer);
      cycleTimer = 0;
      clubGallery.classList.remove("is-playing");
    };

    const canCycleClubGallery = () =>
      !prefersReducedMotion.matches &&
      galleryVisible &&
      !hoveringGallery &&
      !focusWithinGallery &&
      !draggingPanorama &&
      !document.hidden;

    const scheduleClubCycle = () => {
      pauseClubCycle();
      if (!canCycleClubGallery()) return;

      // Re-adding the class restarts the slim progress line beneath the active scene.
      void clubGallery.offsetWidth;
      clubGallery.classList.add("is-playing");
      cycleTimer = window.setTimeout(() => {
        selectClubScene(activeScene + 1, { announce: false });
      }, cycleDuration);
    };

    const setPanTarget = (value) => {
      targetPan = Math.min(Math.max(value, 14), 86);
      if (prefersReducedMotion.matches || panFrame) return;

      const animatePan = () => {
        currentPan += (targetPan - currentPan) * 0.1;
        clubGallery.style.setProperty("--pan-position", `${currentPan.toFixed(2)}%`);

        if (Math.abs(targetPan - currentPan) > 0.025) {
          panFrame = window.requestAnimationFrame(animatePan);
        } else {
          currentPan = targetPan;
          clubGallery.style.setProperty("--pan-position", `${currentPan}%`);
          panFrame = 0;
        }
      };

      panFrame = window.requestAnimationFrame(animatePan);
    };

    const panFromPointer = (event) => {
      const rect = clubStage.getBoundingClientRect();
      const ratio = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      setPanTarget(18 + ratio * 64);
    };

    function selectClubScene(index, options = {}) {
      const { focusTab = false, announce = true } = options;
      activeScene = (index + clubScenes.length) % clubScenes.length;

      clubScenes.forEach((scene, sceneIndex) => {
        const selected = sceneIndex === activeScene;
        scene.classList.toggle("is-active", selected);
        scene.setAttribute("aria-hidden", String(!selected));
      });

      clubTabs.forEach((tab, tabIndex) => {
        const selected = tabIndex === activeScene;
        tab.classList.toggle("is-active", selected);
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        if (selected && focusTab) tab.focus();
        if (selected && coarsePointer.matches) {
          tab.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "nearest",
            inline: "center",
          });
        }
      });

      clubCounter.textContent = `${String(activeScene + 1).padStart(2, "0")} / ${String(
        clubScenes.length,
      ).padStart(2, "0")}`;

      if (announce) {
        clubStatus.textContent = `Показано: ${clubScenes[activeScene].dataset.sceneLabel}`;
      }

      targetPan = 50;
      setPanTarget(50);
      clubGallery.classList.remove("is-changing");
      void clubGallery.offsetWidth;
      clubGallery.classList.add("is-changing");
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(() => clubGallery.classList.remove("is-changing"), 1250);
      scheduleClubCycle();
    }

    clubTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectClubScene(index));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();

        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % clubTabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + clubTabs.length) % clubTabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = clubTabs.length - 1;
        selectClubScene(nextIndex, { focusTab: true });
      });
    });

    clubPrevious.addEventListener("click", () => selectClubScene(activeScene - 1));
    clubNext.addEventListener("click", () => selectClubScene(activeScene + 1));

    clubStage.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();

      if (event.key === "ArrowLeft") selectClubScene(activeScene - 1);
      if (event.key === "ArrowRight") selectClubScene(activeScene + 1);
      if (event.key === "Home") selectClubScene(0);
      if (event.key === "End") selectClubScene(clubScenes.length - 1);
    });

    clubStage.addEventListener("pointermove", (event) => {
      if (prefersReducedMotion.matches) return;
      if (event.pointerType === "mouse" || draggingPanorama) panFromPointer(event);
    });

    clubStage.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || prefersReducedMotion.matches) return;
      draggingPanorama = true;
      dragPointerId = event.pointerId;
      clubGallery.classList.add("is-dragging");
      clubStage.setPointerCapture?.(event.pointerId);
      pauseClubCycle();
      panFromPointer(event);
    });

    const endPanoramaDrag = (event) => {
      if (!draggingPanorama || (dragPointerId !== null && event.pointerId !== dragPointerId)) return;
      draggingPanorama = false;
      dragPointerId = null;
      clubGallery.classList.remove("is-dragging");
      scheduleClubCycle();
    };

    clubStage.addEventListener("pointerup", endPanoramaDrag);
    clubStage.addEventListener("pointercancel", endPanoramaDrag);

    clubGallery.addEventListener("mouseenter", () => {
      hoveringGallery = true;
      pauseClubCycle();
    });

    clubGallery.addEventListener("mouseleave", () => {
      hoveringGallery = false;
      setPanTarget(50);
      scheduleClubCycle();
    });

    clubGallery.addEventListener("focusin", () => {
      focusWithinGallery = true;
      pauseClubCycle();
    });

    clubGallery.addEventListener("focusout", () => {
      window.setTimeout(() => {
        focusWithinGallery = clubGallery.contains(document.activeElement);
        scheduleClubCycle();
      }, 0);
    });

    document.addEventListener("visibilitychange", scheduleClubCycle);
    prefersReducedMotion.addEventListener?.("change", () => {
      if (prefersReducedMotion.matches) {
        currentPan = 50;
        targetPan = 50;
        clubGallery.style.setProperty("--pan-position", "50%");
      }
      scheduleClubCycle();
    });

    if ("IntersectionObserver" in window) {
      const clubGalleryObserver = new IntersectionObserver(
        ([entry]) => {
          galleryVisible = entry.isIntersecting;
          scheduleClubCycle();
        },
        { threshold: 0.22 },
      );
      clubGalleryObserver.observe(clubGallery);
    } else {
      scheduleClubCycle();
    }
  }

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
