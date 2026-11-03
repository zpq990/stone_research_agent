(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header ---------- */

  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const mobileNav = document.querySelector("[data-mobile-nav]");

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const setMenu = (open) => {
    if (!navToggle || !mobileNav) return;
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
    mobileNav.setAttribute("aria-hidden", String(!open));
  };

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", () => {
      setMenu(navToggle.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });

    document.addEventListener("click", (event) => {
      if (navToggle.getAttribute("aria-expanded") === "true" && !header.contains(event.target)) {
        setMenu(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && navToggle.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        navToggle.focus();
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 960) setMenu(false);
    });
  }

  /* ---------- Scroll reveal ---------- */

  const revealItems = Array.from(document.querySelectorAll(".reveal"));

  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -7% 0px" }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  /* ---------- Fold sections ---------- */

  const foldGroup = document.querySelector("[data-fold-group]");
  const folds = foldGroup
    ? Array.from(foldGroup.querySelectorAll(":scope > details.fold"))
    : [];

  folds.forEach((fold) => {
    fold.addEventListener("toggle", () => {
      if (!fold.open) return;
      folds.forEach((other) => {
        if (other !== fold) other.open = false;
      });
    });
  });

  const openFold = (fold) => {
    if (!fold) return;
    folds.forEach((other) => {
      if (other !== fold) other.open = false;
    });
    fold.open = true;
  };

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      const target = hash && hash !== "#" ? document.querySelector(hash) : null;
      if (!target || !target.matches("details.fold")) return;
      event.preventDefault();
      openFold(target);
      try {
        history.replaceState(null, "", hash);
      } catch {
        /* file:// pages can refuse a history update; the section still opens. */
      }
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  });

  const openFoldFromHash = () => {
    if (!window.location.hash) return;
    const target = document.querySelector(window.location.hash);
    if (target && target.matches("details.fold")) openFold(target);
  };

  window.addEventListener("hashchange", openFoldFromHash);
  openFoldFromHash();

  /* ---------- Research forms ---------- */

  const forms = Array.from(document.querySelectorAll("[data-research-form]"));
  const primaryInput = document.querySelector("#research-topic");
  const primaryForm = primaryInput ? primaryInput.closest("[data-research-form]") : null;

  const clearFormError = (form) => {
    if (!form) return;
    const field = form.querySelector(".topic-field");
    const input = form.querySelector("input[name='topic']");
    const error = form.querySelector(".field-error");
    if (field) field.classList.remove("is-invalid");
    if (input) input.removeAttribute("aria-invalid");
    if (error) error.hidden = true;
  };

  const showFormError = (form) => {
    if (!form) return;
    const field = form.querySelector(".topic-field");
    const input = form.querySelector("input[name='topic']");
    const error = form.querySelector(".field-error");
    if (field) field.classList.add("is-invalid");
    if (input) input.setAttribute("aria-invalid", "true");
    if (error) error.hidden = false;
  };

  const clearAllErrors = () => forms.forEach(clearFormError);

  forms.forEach((form) => {
    const input = form.querySelector("input[name='topic']");
    if (input) {
      input.addEventListener("input", () => clearFormError(form));
    }
  });

  const fillTopic = (topic) => {
    if (!primaryInput) return;
    primaryInput.value = topic;
    clearAllErrors();
    setMenu(false);
    primaryInput.focus({ preventScroll: true });
    const length = primaryInput.value.length;
    try {
      primaryInput.setSelectionRange(length, length);
    } catch {
      /* Some browsers do not support selection on this input type. */
    }
    primaryForm?.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "center",
    });
  };

  document.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => fillTopic(button.dataset.topic || ""));
  });

  /* ---------- Dialog ---------- */

  const dialog = document.querySelector("#research-dialog");
  const runView = document.querySelector("[data-run-view]");
  const resultView = document.querySelector("[data-result-view]");
  const dialogBody = dialog?.querySelector(".dialog-body");
  const runTopicEls = Array.from(document.querySelectorAll("[data-run-topic]"));
  const docTopicEls = Array.from(document.querySelectorAll("[data-doc-topic]"));
  const runPhase = document.querySelector("[data-run-phase]");
  const runPercent = document.querySelector("[data-run-percent]");
  const progressBar = document.querySelector("[data-progressbar]");
  const progressFill = document.querySelector("[data-progress-fill]");
  const runSteps = Array.from(document.querySelectorAll("[data-run-step]"));
  const docDate = document.querySelector("[data-doc-date]");
  const printButton = document.querySelector("[data-print]");
  const resetButton = document.querySelector("[data-reset]");
  const skipButton = document.querySelector("[data-skip-run]");
  const closeDialogButton = document.querySelector("[data-close-dialog]");

  let timerIds = [];
  let dialogOpen = false;

  const clearTimers = () => {
    timerIds.forEach((id) => window.clearTimeout(id));
    timerIds = [];
  };

  const setProgress = (percent, phaseLabel) => {
    const safePercent = Math.max(0, Math.min(100, percent));
    if (progressFill) progressFill.style.width = `${safePercent}%`;
    if (progressBar) progressBar.setAttribute("aria-valuenow", String(safePercent));
    if (runPercent) runPercent.textContent = String(safePercent);
    if (phaseLabel && runPhase) runPhase.textContent = phaseLabel;
  };

  const setStepState = (activeIndex) => {
    runSteps.forEach((step, index) => {
      const status = step.querySelector(".run-step-status");
      step.classList.toggle("is-active", index === activeIndex);
      step.classList.toggle("is-done", index < activeIndex);
      if (status) {
        status.textContent = index < activeIndex ? "完成" : index === activeIndex ? "进行中" : "等待";
      }
    });
  };

  const revealResult = () => {
    clearTimers();
    if (!runView || !resultView) return;
    runView.hidden = true;
    resultView.hidden = false;
    resultView.setAttribute("tabindex", "-1");
    if (dialogBody) dialogBody.scrollTop = 0;
    window.setTimeout(() => resultView.focus({ preventScroll: true }), 30);
  };

  const startRun = (topic) => {
    clearTimers();
    const currentTopic = topic || "这个领域";
    if (!runView || !resultView) return;

    runView.hidden = false;
    resultView.hidden = true;
    resultView.removeAttribute("tabindex");
    if (dialogBody) dialogBody.scrollTop = 0;

    runTopicEls.forEach((el) => {
      el.textContent = currentTopic;
    });
    docTopicEls.forEach((el) => {
      el.textContent = currentTopic;
    });

    if (docDate) {
      const now = new Date();
      docDate.textContent = `${now.getFullYear()} / ${String(now.getMonth() + 1).padStart(2, "0")}`;
    }

    setProgress(6, "界定边界");
    setStepState(0);

    const stages = [
      { delay: 320, percent: 28, phase: "检索与阅读", active: 1 },
      { delay: 640, percent: 54, phase: "交叉验证", active: 2 },
      { delay: 960, percent: 79, phase: "交叉验证", active: 2 },
      { delay: 1280, percent: 100, phase: "组织文档", active: 3 },
    ];

    stages.forEach((stage) => {
      const id = window.setTimeout(() => {
        setProgress(stage.percent, stage.phase);
        setStepState(stage.active);
        if (stage.percent === 100) {
          setStepState(runSteps.length);
          runSteps.forEach((step) => {
            const status = step.querySelector(".run-step-status");
            if (status) status.textContent = "完成";
          });
          const resultTimer = window.setTimeout(revealResult, prefersReducedMotion ? 60 : 340);
          timerIds.push(resultTimer);
        }
      }, prefersReducedMotion ? Math.min(stage.delay, 120) : stage.delay);
      timerIds.push(id);
    });
  };

  const showModal = () => {
    if (!dialog) return;
    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
    dialogOpen = true;
    document.body.classList.add("is-locked");
  };

  const closeModal = () => {
    if (!dialog || !dialogOpen) return;
    clearTimers();
    if (typeof dialog.close === "function" && dialog.open) {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
      dialogOpen = false;
      document.body.classList.remove("is-locked");
    }
  };

  const openResearch = (form) => {
    const sourceForm = form || primaryForm;
    const input = sourceForm ? sourceForm.querySelector("input[name='topic']") : null;
    const topic = input ? input.value.trim() : "";

    if (!topic) {
      showFormError(sourceForm);
      setMenu(false);
      if (input) input.focus({ preventScroll: true });
      sourceForm?.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
      return;
    }

    clearAllErrors();
    setMenu(false);
    showModal();
    startRun(topic);
  };

  forms.forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      openResearch(form);
    });
  });

  if (closeDialogButton) {
    closeDialogButton.addEventListener("click", closeModal);
  }

  if (dialog) {
    dialog.addEventListener("cancel", () => {
      clearTimers();
    });

    dialog.addEventListener("close", () => {
      clearTimers();
      dialogOpen = false;
      document.body.classList.remove("is-locked");
    });

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeModal();
    });
  }

  if (skipButton) {
    skipButton.addEventListener("click", revealResult);
  }

  if (printButton) {
    printButton.addEventListener("click", () => {
      const cleanupPrint = () => document.body.classList.remove("is-printing");
      const supportsAfterPrint = "onafterprint" in window;
      document.body.classList.add("is-printing");
      if (supportsAfterPrint) {
        window.addEventListener("afterprint", cleanupPrint, { once: true });
      } else {
        window.setTimeout(cleanupPrint, 500);
      }
      window.print();
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      closeModal();
      forms.forEach((form) => {
        const input = form.querySelector("input[name='topic']");
        if (input) input.value = "";
      });
      clearAllErrors();
      if (primaryInput) {
        primaryInput.focus({ preventScroll: true });
        primaryForm?.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center",
        });
      }
    });
  }

  /* ---------- FAQ ---------- */

  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
