(() => {
  'use strict';

  const body = document.body;
  const header = document.querySelector('[data-header]');
  const backToTop = document.querySelector('[data-back-top]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  const navTrigger = document.querySelector('[data-nav-trigger]');
  const navItem = navTrigger?.closest('.nav-item');

  const setHeaderState = () => {
    const scrolled = window.scrollY > 18;
    header?.classList.toggle('is-scrolled', scrolled);
    backToTop?.classList.toggle('is-visible', window.scrollY > 720);
  };

  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });

  backToTop?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  const closeMobileMenu = () => {
    menuToggle?.setAttribute('aria-expanded', 'false');
    nav?.classList.remove('is-open');
    body.classList.remove('menu-open');
  };

  const closeMegaPanel = () => {
    navTrigger?.setAttribute('aria-expanded', 'false');
    navItem?.classList.remove('is-open');
  };

  menuToggle?.addEventListener('click', () => {
    const willOpen = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(willOpen));
    nav?.classList.toggle('is-open', willOpen);
    body.classList.toggle('menu-open', willOpen);
  });

  navTrigger?.addEventListener('click', () => {
    const willOpen = navTrigger.getAttribute('aria-expanded') !== 'true';
    navTrigger.setAttribute('aria-expanded', String(willOpen));
    navItem?.classList.toggle('is-open', willOpen);
  });

  document.addEventListener('click', (event) => {
    if (navItem && !navItem.contains(event.target)) closeMegaPanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMegaPanel();
      closeMobileMenu();
    }
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      closeMobileMenu();
      closeMegaPanel();
    });
  });

  const hero = document.querySelector('[data-hero]');
  const slides = Array.from(document.querySelectorAll('[data-slide]'));
  const heroVideos = slides.map((slide) => slide.querySelector('.hero-video'));
  const heroDots = Array.from(document.querySelectorAll('[data-hero-dot]'));
  const heroProgress = document.querySelector('[data-hero-progress]');
  const heroPrev = document.querySelector('[data-hero-prev]');
  const heroNext = document.querySelector('[data-hero-next]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeSlide = 0;
  let heroTimer;
  let heroPaused = false;

  const restartProgress = () => {
    if (!heroProgress || reducedMotion) return;
    heroProgress.classList.remove('is-running');
    void heroProgress.offsetWidth;
    heroProgress.classList.add('is-running');
  };

  const showSlide = (index, userInitiated = false) => {
    if (!slides.length) return;
    activeSlide = (index + slides.length) % slides.length;

    slides.forEach((slide, slideIndex) => {
      const selected = slideIndex === activeSlide;
      slide.classList.toggle('is-active', selected);
      slide.setAttribute('aria-hidden', String(!selected));

      const video = heroVideos[slideIndex];
      if (!video) return;
      if (selected && !reducedMotion && !document.hidden) {
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
      } else {
        video.pause();
      }
    });

    heroDots.forEach((dot, dotIndex) => {
      const selected = dotIndex === activeSlide;
      dot.classList.toggle('is-active', selected);
      dot.setAttribute('aria-selected', String(selected));
    });

    restartProgress();
    if (userInitiated) scheduleHero();
  };

  const scheduleHero = () => {
    window.clearInterval(heroTimer);
    if (reducedMotion || heroPaused || slides.length < 2) return;
    heroTimer = window.setInterval(() => showSlide(activeSlide + 1), 7000);
  };

  heroPrev?.addEventListener('click', () => showSlide(activeSlide - 1, true));
  heroNext?.addEventListener('click', () => showSlide(activeSlide + 1, true));
  heroDots.forEach((dot) => {
    dot.addEventListener('click', () => showSlide(Number(dot.dataset.heroDot), true));
  });

  hero?.addEventListener('mouseenter', () => {
    heroPaused = true;
    window.clearInterval(heroTimer);
    heroProgress?.classList.remove('is-running');
  });

  hero?.addEventListener('mouseleave', () => {
    heroPaused = false;
    restartProgress();
    scheduleHero();
  });

  hero?.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') showSlide(activeSlide - 1, true);
    if (event.key === 'ArrowRight') showSlide(activeSlide + 1, true);
  });

  showSlide(0);
  scheduleHero();

  document.addEventListener('visibilitychange', () => {
    heroVideos.forEach((video, index) => {
      if (!video) return;
      if (!document.hidden && index === activeSlide && !reducedMotion) {
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.catch === 'function') playAttempt.catch(() => {});
      } else {
        video.pause();
      }
    });
  });

  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('is-visible'));
  }

  const filterButtons = Array.from(document.querySelectorAll('[data-product-filter]'));
  const productCards = Array.from(document.querySelectorAll('[data-category]'));
  const productSearch = document.querySelector('[data-product-search]');
  const emptyProducts = document.querySelector('[data-empty-products]');
  const clearProducts = document.querySelector('[data-clear-products]');
  let activeFilter = 'todos';

  const normalize = (value) => value
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const applyProductFilters = () => {
    const query = normalize(productSearch?.value.trim() || '');
    let visibleCount = 0;

    productCards.forEach((card) => {
      const categoryMatch = activeFilter === 'todos' || card.dataset.category === activeFilter;
      const queryMatch = !query || normalize(card.dataset.name || '').includes(query);
      const visible = categoryMatch && queryMatch;
      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyProducts) emptyProducts.hidden = visibleCount !== 0;
  };

  const selectProductFilter = (filter) => {
    activeFilter = filter;
    filterButtons.forEach((button) => {
      const selected = button.dataset.productFilter === filter;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    applyProductFilters();
  };

  filterButtons.forEach((button) => {
    button.addEventListener('click', () => selectProductFilter(button.dataset.productFilter));
  });

  productSearch?.addEventListener('input', applyProductFilters);

  clearProducts?.addEventListener('click', () => {
    if (productSearch) productSearch.value = '';
    selectProductFilter('todos');
    productSearch?.focus();
  });

  document.querySelectorAll('[data-filter-link]').forEach((link) => {
    link.addEventListener('click', () => {
      selectProductFilter(link.dataset.filterLink);
      if (productSearch) productSearch.value = '';
      applyProductFilters();
    });
  });

  const capabilityTabs = Array.from(document.querySelectorAll('[data-capability]'));
  const capabilityPanels = Array.from(document.querySelectorAll('[data-capability-panel]'));

  capabilityTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.capability;

      capabilityTabs.forEach((item) => {
        const selected = item === tab;
        item.classList.toggle('is-active', selected);
        item.setAttribute('aria-selected', String(selected));
      });

      capabilityPanels.forEach((panel) => {
        const selected = panel.dataset.capabilityPanel === target;
        panel.hidden = !selected;
        panel.classList.toggle('is-active', selected);
      });
    });
  });

  const interestSelect = document.querySelector('[data-interest-select]');
  document.querySelectorAll('[data-quote-product]').forEach((control) => {
    control.addEventListener('click', () => {
      const product = control.dataset.quoteProduct;
      if (interestSelect && product) interestSelect.value = product;
    });
  });

  const videoDialog = document.querySelector('[data-video-dialog]');
  const openVideoButtons = document.querySelectorAll('[data-video-open]');
  const closeVideoButton = document.querySelector('[data-video-close]');

  const openVideo = () => {
    if (!videoDialog) return;
    if (typeof videoDialog.showModal === 'function') videoDialog.showModal();
    else videoDialog.setAttribute('open', '');
    body.classList.add('dialog-open');
  };

  const closeVideo = () => {
    if (!videoDialog) return;
    if (typeof videoDialog.close === 'function') videoDialog.close();
    else videoDialog.removeAttribute('open');
    body.classList.remove('dialog-open');
  };

  openVideoButtons.forEach((button) => button.addEventListener('click', openVideo));
  closeVideoButton?.addEventListener('click', closeVideo);
  videoDialog?.addEventListener('close', () => body.classList.remove('dialog-open'));
  videoDialog?.addEventListener('click', (event) => {
    if (event.target === videoDialog) closeVideo();
  });

  const quoteForm = document.querySelector('[data-quote-form]');
  const formStatus = document.querySelector('[data-form-status]');

  quoteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const requiredFields = Array.from(quoteForm.querySelectorAll('[required]'));
    let firstInvalid;

    requiredFields.forEach((field) => {
      const valid = field.checkValidity();
      field.classList.toggle('is-invalid', !valid);
      if (!valid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      if (formStatus) {
        formStatus.hidden = false;
        formStatus.textContent = 'Revise los campos obligatorios antes de continuar.';
      }
      firstInvalid.focus();
      return;
    }

    if (formStatus) {
      formStatus.hidden = false;
      formStatus.textContent = 'Solicitud preparada correctamente. La versión final enviará estos datos al CRM de IDM.';
    }
    quoteForm.reset();
    formStatus?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  quoteForm?.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => field.classList.remove('is-invalid'));
    field.addEventListener('change', () => field.classList.remove('is-invalid'));
  });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
