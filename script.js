```javascript
/*!
 * UNLOCKED ARC — Advanced Site Script
 * ------------------------------------
 * Plain JavaScript — no dependencies.
 *
 * Features:
 *  1. Story form validation
 *  2. Photo validation
 *  3. Spam protection
 *  4. Submission cooldown
 *  5. Anchor/header offset
 *  6. Active navigation
 *  7. Cinematic reveal animations
 *  8. Scroll progress indicator
 *  9. Back-to-top button
 * 10. Story Book interactions
 * 11. Story search/filter support
 * 12. Story counter animation
 * 13. Card hover effects
 * 14. Mobile navigation support
 * 15. Page entrance animation
 * 16. Accessibility improvements
 * 17. Reduced-motion support
 *
 * NOTE:
 * The story form currently retains your existing Formspree
 * fallback. We will connect it to Supabase separately.
 */

(() => {
  'use strict';

  /* ================================================================
     CONFIG
  ================================================================ */

  const CONFIG = {

    // Keep this as-is until your current form endpoint is configured.
    formEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',

    maxPhotoMB: 5,

    minStoryChars: 30,

    cooldownMs: 30000,

    timeoutMs: 30000,

    scrollProgress: true,

    backToTop: true,

    pageTransitions: true,

    storyAnimations: true,

  };


  /* ================================================================
     HELPERS
  ================================================================ */

  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const reduceMotion =
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  const safeStorage = {

    get(key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (_) {
        return null;
      }
    },

    set(key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (_) {
        // Storage may be disabled.
      }
    },

  };


  const isEndpointConfigured = () =>
    typeof CONFIG.formEndpoint === 'string' &&
    /^https:\/\//.test(CONFIG.formEndpoint) &&
    !CONFIG.formEndpoint.includes('YOUR_FORM_ID');


  /* ================================================================
     GLOBAL STYLES
  ================================================================ */

  function injectStyles() {

    const css = `

      /* ------------------------------------------------------------
         ACTIVE NAV
      ------------------------------------------------------------ */

      nav a[aria-current="true"] {
        color: var(--text, #f5f5f0);
      }


      /* ------------------------------------------------------------
         PAGE ENTRANCE
      ------------------------------------------------------------ */

      html.ua-ready body {
        opacity: 0;
        animation: uaPageIn .75s ease forwards;
      }

      @keyframes uaPageIn {
        from {
          opacity: 0;
        }

        to {
          opacity: 1;
        }
      }


      /* ------------------------------------------------------------
         REVEAL
      ------------------------------------------------------------ */

      html.js .reveal {
        opacity: 0;
        transform: translateY(28px);

        transition:
          opacity .8s ease,
          transform .8s ease;
      }

      html.js .reveal.is-visible {
        opacity: 1;
        transform: none;
      }


      /* ------------------------------------------------------------
         SCROLL PROGRESS
      ------------------------------------------------------------ */

      .ua-scroll-progress {
        position: fixed;
        top: 0;
        left: 0;

        width: 0%;
        height: 2px;

        background: var(--accent, #d8c9a3);

        z-index: 99999;

        pointer-events: none;

        transition: width .08s linear;
      }


      /* ------------------------------------------------------------
         BACK TO TOP
      ------------------------------------------------------------ */

      .ua-back-top {
        position: fixed;

        right: 24px;
        bottom: 24px;

        width: 44px;
        height: 44px;

        border: 1px solid rgba(255,255,255,.15);

        background: rgba(10,10,10,.82);

        color: #fff;

        display: flex;
        align-items: center;
        justify-content: center;

        cursor: pointer;

        opacity: 0;
        visibility: hidden;

        transform: translateY(12px);

        transition:
          opacity .3s ease,
          visibility .3s ease,
          transform .3s ease,
          background .3s ease;

        backdrop-filter: blur(10px);

        z-index: 9998;
      }

      .ua-back-top.is-visible {
        opacity: 1;
        visibility: visible;
        transform: none;
      }

      .ua-back-top:hover {
        background: var(--accent, #d8c9a3);
        color: #080808;
      }


      /* ------------------------------------------------------------
         STORY CARDS
      ------------------------------------------------------------ */

      .story-card,
      .cards article {

        transition:
          transform .45s cubic-bezier(.2,.7,.2,1),
          border-color .35s ease,
          background .35s ease,
          box-shadow .45s ease;

      }


      .story-card:hover,
      .cards article:hover {

        transform: translateY(-7px);

        box-shadow:
          0 20px 60px rgba(0,0,0,.22);

      }


      .story-card img,
      .cards article img {

        transition:
          transform .7s cubic-bezier(.2,.7,.2,1),
          filter .7s ease;

      }


      .story-card:hover img,
      .cards article:hover img {

        transform: scale(1.035);

      }


      /* ------------------------------------------------------------
         STORY BOOK SEARCH
      ------------------------------------------------------------ */

      .story-search {

        width: 100%;
        max-width: 520px;

        margin: 0 auto 35px;

        position: relative;

      }


      .story-search input {

        width: 100%;

        padding: 15px 18px;

        border: 1px solid rgba(255,255,255,.14);

        background: rgba(255,255,255,.035);

        color: inherit;

        outline: none;

        font: inherit;

        transition:
          border-color .25s ease,
          background .25s ease;

      }


      .story-search input:focus {

        border-color:
          var(--accent, #d8c9a3);

        background:
          rgba(255,255,255,.055);

      }


      .story-filter-hidden {

        display: none !important;

      }


      .story-search-count {

        margin-top: 10px;

        color: rgba(255,255,255,.48);

        font-size: 11px;

        letter-spacing: .12em;

        text-transform: uppercase;

      }


      /* ------------------------------------------------------------
         STORY COUNTER
      ------------------------------------------------------------ */

      .ua-story-counter {

        font-variant-numeric: tabular-nums;

      }


      /* ------------------------------------------------------------
         FORM STATUS
      ------------------------------------------------------------ */

      .btn[disabled] {

        opacity: .6;

        cursor: not-allowed;

      }


      .form-status {

        margin: 18px 0 0;

        padding: 14px 16px;

        border-radius: 10px;

        font-size: 14px;

        line-height: 1.5;

        border: 1px solid transparent;

      }


      .form-status:empty {

        display: none;

      }


      .form-status.is-success {

        background: #10210f;

        border-color: #2f6b2c;

        color: #b9f0b4;

      }


      .form-status.is-error {

        background: #2a1111;

        border-color: #7a2d2d;

        color: #ffc4c4;

      }


      .form-status.is-info {

        background: #1a1a12;

        border-color: #5c5320;

        color: #f0e2a0;

      }


      /* ------------------------------------------------------------
         FOCUS
      ------------------------------------------------------------ */

      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible,
      button:focus-visible,
      a:focus-visible {

        outline:
          2px solid var(--accent, #d8c9a3);

        outline-offset: 3px;

      }


      input[aria-invalid="true"],
      textarea[aria-invalid="true"] {

        border-color: #c0504d;

      }


      /* ------------------------------------------------------------
         MOBILE MENU
      ------------------------------------------------------------ */

      .ua-mobile-toggle {

        display: none;

        border: 1px solid rgba(255,255,255,.14);

        background: transparent;

        color: inherit;

        padding: 8px 10px;

        cursor: pointer;

        font-size: 18px;

      }


      @media (max-width: 760px) {

        .ua-mobile-toggle {

          display: inline-flex;

          align-items: center;

          justify-content: center;

        }


        nav.ua-mobile-open {

          background:
            rgba(8,8,8,.97);

        }


        nav.ua-mobile-open .nav-links {

          display: flex;

        }

      }


      /* ------------------------------------------------------------
         REDUCED MOTION
      ------------------------------------------------------------ */

      @media (prefers-reduced-motion: reduce) {

        html.ua-ready body {

          animation: none;

          opacity: 1;

        }


        html.js .reveal {

          opacity: 1;

          transform: none;

          transition: none;

        }


        .story-card,
        .cards article,
        .story-card img,
        .cards article img {

          transition: none;

        }

      }

    `;


    const style = document.createElement('style');

    style.id = 'unlocked-arc-js-styles';

    style.textContent = css;

    document.head.appendChild(style);

  }


  /* ================================================================
     PAGE ENTRANCE
  ================================================================ */

  function initPageEntrance() {

    document.documentElement.classList.add('ua-ready');

  }


  /* ================================================================
     HEADER / ANCHOR OFFSET
  ================================================================ */

  function initAnchorOffset() {

    const header =
      $('.nav') ||
      $('nav');

    const apply = () => {

      const offset =
        (header ? header.offsetHeight : 0) + 18;

      $$('section[id], main[id]').forEach((section) => {

        section.style.scrollMarginTop =
          `${offset}px`;

      });

    };


    apply();

    window.addEventListener(
      'resize',
      apply,
      { passive: true }
    );

    window.addEventListener(
      'load',
      apply
    );

  }


  /* ================================================================
     ACTIVE NAVIGATION
  ================================================================ */

  function initActiveNav() {

    if (!('IntersectionObserver' in window))
      return;


    const links =
      $$('nav a[href^="#"]');


    const map = new Map();


    links.forEach((link) => {

      const id =
        link.getAttribute('href');

      if (!id || id === '#')
        return;


      const target =
        $(id);

      if (target)
        map.set(target, link);

    });


    if (!map.size)
      return;


    const observer =
      new IntersectionObserver(

        (entries) => {

          entries.forEach((entry) => {

            const link =
              map.get(entry.target);

            if (!link)
              return;


            if (entry.isIntersecting) {

              links.forEach((item) => {

                item.removeAttribute(
                  'aria-current'
                );

              });


              link.setAttribute(
                'aria-current',
                'true'
              );

            }

          });

        },

        {
          rootMargin:
            '-40% 0px -55% 0px',

          threshold: 0

        }

      );


    map.forEach(
      (_, section) =>
        observer.observe(section)
    );

  }


  /* ================================================================
     REVEAL ON SCROLL
  ================================================================ */

  function initReveal() {

    const targets = $$(
      [
        '.cards article',
        '.manifesto p',
        '.contact > div',
        '.section > .lead',
        '.story-card',
        '.chapter',
        '.chapter-content',
        '.reflection-inner',
        '.timeline-section',
        '.facts',
        '.sources',
        '.coming-box',
        '.cta',
        '.story-book-card'
      ].join(',')
    );


    if (!targets.length)
      return;


    document.documentElement
      .classList.add('js');


    targets.forEach((el, i) => {

      if (el.classList.contains('reveal'))
        return;


      el.classList.add('reveal');


      if (!reduceMotion) {

        el.style.transitionDelay =
          `${(i % 4) * 80}ms`;

      }

    });


    if (
      reduceMotion ||
      !('IntersectionObserver' in window)
    ) {

      targets.forEach((el) =>
        el.classList.add('is-visible')
      );

      return;

    }


    const observer =
      new IntersectionObserver(

        (entries, obs) => {

          entries.forEach((entry) => {

            if (entry.isIntersecting) {

              entry.target
                .classList
                .add('is-visible');


              obs.unobserve(
                entry.target
              );

            }

          });

        },

        {
          threshold: 0.10

        }

      );


    targets.forEach((el) =>
      observer.observe(el)
    );

  }


  /* ================================================================
     SCROLL PROGRESS
  ================================================================ */

  function initScrollProgress() {

    if (!CONFIG.scrollProgress)
      return;


    const bar =
      document.createElement('div');

    bar.className =
      'ua-scroll-progress';

    bar.setAttribute(
      'aria-hidden',
      'true'
    );


    document.body.prepend(bar);


    let ticking = false;


    const update = () => {

      const scrollTop =
        window.scrollY || window.pageYOffset;


      const documentHeight =
        document.documentElement.scrollHeight -
        window.innerHeight;


      const progress =
        documentHeight > 0
          ? (scrollTop / documentHeight) * 100
          : 0;


      bar.style.width =
        `${Math.min(100, Math.max(0, progress))}%`;


      ticking = false;

    };


    window.addEventListener(
      'scroll',
      () => {

        if (!ticking) {

          window.requestAnimationFrame(
            update
          );

          ticking = true;

        }

      },
      { passive: true }
    );


    update();

  }


  /* ================================================================
     BACK TO TOP
  ================================================================ */

  function initBackToTop() {

    if (!CONFIG.backToTop)
      return;


    const button =
      document.createElement('button');


    button.type = 'button';

    button.className =
      'ua-back-top';

    button.setAttribute(
      'aria-label',
      'Back to top'
    );

    button.innerHTML = '↑';


    document.body.appendChild(button);


    const toggle = () => {

      if (window.scrollY > 500) {

        button.classList
          .add('is-visible');

      } else {

        button.classList
          .remove('is-visible');

      }

    };


    window.addEventListener(
      'scroll',
      toggle,
      { passive: true }
    );


    button.addEventListener(
      'click',
      () => {

        window.scrollTo({

          top: 0,

          behavior:
            reduceMotion
              ? 'auto'
              : 'smooth'

        });

      }
    );


    toggle();

  }


  /* ================================================================
     STORY BOOK SEARCH
  ================================================================ */

  function initStorySearch() {

    const cards = $$(
      '.story-card, .story-book-card, .cards article'
    );


    if (!cards.length)
      return;


    const existingSearch =
      $('.story-search');


    if (!existingSearch)
      return;


    const input =
      $('input', existingSearch);


    if (!input)
      return;


    let count =
      $('.story-search-count', existingSearch);


    if (!count) {

      count =
        document.createElement('div');

      count.className =
        'story-search-count';

      existingSearch.appendChild(count);

    }


    const update = () => {

      const query =
        input.value
          .trim()
          .toLowerCase();


      let visible = 0;


      cards.forEach((card) => {

        const text =
          card.textContent
            .toLowerCase();


        const matches =
          !query ||
          text.includes(query);


        card.classList.toggle(
          'story-filter-hidden',
          !matches
        );


        if (matches)
          visible++;

      });


      count.textContent =
        `${visible} ${
          visible === 1
            ? 'story'
            : 'stories'
        }`;

    };


    input.addEventListener(
      'input',
      update
    );


    update();

  }


  /* ================================================================
     STORY CARD INTERACTIONS
  ================================================================ */

  function initStoryCards() {

    if (!CONFIG.storyAnimations)
      return;


    const cards = $$(
      '.story-card, .story-book-card, .cards article'
    );


    cards.forEach((card) => {

      card.addEventListener(
        'pointermove',
        (event) => {

          if (
            reduceMotion ||
            window.innerWidth < 800
          )
            return;


          const rect =
            card.getBoundingClientRect();


          const x =
            event.clientX - rect.left;


          const y =
            event.clientY - rect.top;


          const rotateY =
            ((x / rect.width) - 0.5) * 2;


          const rotateX =
            ((y / rect.height) - 0.5) * -2;


          card.style.transform =
            `translateY(-7px) perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

        }
      );


      card.addEventListener(
        'pointerleave',
        () => {

          card.style.transform = '';

        }
      );

    });

  }


  /* ================================================================
     STORY COUNTERS
  ================================================================ */

  function initStoryCounters() {

    const counters =
      $$('.ua-story-counter');


    if (!counters.length)
      return;


    counters.forEach((counter) => {

      const target =
        Number(
          counter.dataset.count ||
          counter.textContent ||
          0
        );


      if (!Number.isFinite(target))
        return;


      if (reduceMotion) {

        counter.textContent =
          String(target);

        return;

      }


      let current = 0;

      const duration = 900;

      const start =
        performance.now();


      const animate = (time) => {

        const progress =
          Math.min(
            (time - start) / duration,
            1
          );


        const eased =
          1 -
          Math.pow(
            1 - progress,
            3
          );


        current =
          Math.round(
            target * eased
          );


        counter.textContent =
          String(current);


        if (progress < 1) {

          requestAnimationFrame(
            animate
          );

        }

      };


      requestAnimationFrame(
        animate
      );

    });

  }


  /* ================================================================
     MOBILE NAVIGATION
  ================================================================ */

  function initMobileNavigation() {

    const nav =
      $('nav');


    if (!nav)
      return;


    const links =
      $('.nav-links', nav);


    if (!links)
      return;


    /*
     * If your HTML already has a mobile menu button,
     * this script can use it.
     */


    let toggle =
      $('.ua-mobile-toggle', nav);


    if (!toggle) {

      /*
       * Only create a toggle when the navigation
       * has enough structure to safely support it.
       */

      if (
        links.classList.contains(
          'nav-links'
        )
      ) {

        toggle =
          document.createElement('button');

        toggle.type = 'button';

        toggle.className =
          'ua-mobile-toggle';

        toggle.setAttribute(
          'aria-label',
          'Open navigation'
        );

        toggle.setAttribute(
          'aria-expanded',
          'false'
        );

        toggle.innerHTML = '☰';

        nav.appendChild(toggle);

      }

    }


    if (!toggle)
      return;


    toggle.addEventListener(
      'click',
      () => {

        const open =
          nav.classList.toggle(
            'ua-mobile-open'
          );


        toggle.setAttribute(
          'aria-expanded',
          String(open)
        );


        toggle.setAttribute(
          'aria-label',
          open
            ? 'Close navigation'
            : 'Open navigation'
        );


        toggle.innerHTML =
          open ? '×' : '☰';

      }
    );


    links.addEventListener(
      'click',
      (event) => {

        if (
          event.target.closest('a')
        ) {

          nav.classList.remove(
            'ua-mobile-open'
          );


          toggle.setAttribute(
            'aria-expanded',
            'false'
          );


          toggle.innerHTML = '☰';

        }

      }
    );

  }


  /* ================================================================
     PAGE TRANSITIONS
  ================================================================ */

  function initPageTransitions() {

    if (
      !CONFIG.pageTransitions ||
      reduceMotion
    )
      return;


    document.addEventListener(
      'click',
      (event) => {

        const link =
          event.target.closest('a');


        if (!link)
          return;


        if (
          link.target === '_blank' ||
          link.hasAttribute('download') ||
          link.href.startsWith('mailto:') ||
          link.href.startsWith('tel:')
        )
          return;


        let url;

        try {

          url =
            new URL(
              link.href,
              window.location.href
            );

        } catch (_) {

          return;

        }


        if (
          url.origin !==
          window.location.origin
        )
          return;


        if (
          url.pathname ===
            window.location.pathname &&
          url.hash
        )
          return;


        event.preventDefault();


        document.body.style.transition =
          'opacity .28s ease';

        document.body.style.opacity =
          '0';


        setTimeout(() => {

          window.location.href =
            url.href;

        }, 280);

      }
    );

  }


  /* ================================================================
     STORY FORM
  ================================================================ */

  function initStoryForm() {

    const form =
      $('#share form');


    if (!form)
      return;


    const submitButton =
      $('button[type="submit"]', form);


    const submitLabel =
      submitButton
        ? submitButton.textContent
        : 'Submit story';


    const photoInput =
      form.elements.photo;


    let busy = false;


    /* ------------------------------------------------------------
       Autofill
    ------------------------------------------------------------ */

    const hints = {

      name: 'name',

      email: 'email',

      country: 'country-name',

      phone: 'tel'

    };


    Object.keys(hints).forEach(
      (field) => {

        if (form.elements[field]) {

          form.elements[field]
            .setAttribute(
              'autocomplete',
              hints[field]
            );

        }

      }
    );


    if (form.elements.story) {

      form.elements.story
        .setAttribute(
          'maxlength',
          '8000'
        );

    }


    /* ------------------------------------------------------------
       Form endpoint
    ------------------------------------------------------------ */

    if (isEndpointConfigured()) {

      form.setAttribute(
        'action',
        CONFIG.formEndpoint
      );


      form.setAttribute(
        'method',
        'POST'
      );

    }


    /* ------------------------------------------------------------
       Spam trap
    ------------------------------------------------------------ */

    const trap =
      document.createElement('input');


    trap.type = 'text';

    trap.name = '_gotcha';

    trap.tabIndex = -1;

    trap.autocomplete = 'off';

    trap.setAttribute(
      'aria-hidden',
      'true'
    );


    trap.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';


    form.appendChild(trap);


    /* ------------------------------------------------------------
       Status
    ------------------------------------------------------------ */

    const status =
      document.createElement('p');


    status.className =
      'form-status';


    status.setAttribute(
      'role',
      'status'
    );


    status.setAttribute(
      'aria-live',
      'polite'
    );


    status.tabIndex = -1;


    form.appendChild(status);


    const setStatus =
      (type, message) => {

        status.className =
          `form-status is-${type}`;


        status.textContent =
          message;


        status.scrollIntoView({

          behavior:
            reduceMotion
              ? 'auto'
              : 'smooth',

          block: 'nearest'

        });

      };


    const clearStatus = () => {

      status.className =
        'form-status';

      status.textContent =
        '';

    };


    const setBusy =
      (state) => {

        busy = state;


        if (!submitButton)
          return;


        submitButton.disabled =
          state;


        submitButton.textContent =
          state
            ? 'Sending…'
            : submitLabel;


        form.setAttribute(
          'aria-busy',
          String(state)
        );

      };


    const markInvalid =
      (field, invalid) => {

        if (field) {

          field.setAttribute(
            'aria-invalid',
            String(invalid)
          );

        }

      };


    /* ------------------------------------------------------------
       Photo validation
    ------------------------------------------------------------ */

    function photoError(file) {

      if (!file)
        return '';


      if (
        !file.type ||
        !file.type.startsWith('image/')
      ) {

        return 'Please choose an image file.';

      }


      if (
        file.size >
        CONFIG.maxPhotoMB *
        1024 *
        1024
      ) {

        return (
          `That photo is too large. ` +
          `Please choose one under ` +
          `${CONFIG.maxPhotoMB} MB.`
        );

      }


      return '';

    }


    if (photoInput) {

      photoInput.addEventListener(
        'change',
        () => {

          const message =
            photoError(
              photoInput.files[0]
            );


          markInvalid(
            photoInput,
            Boolean(message)
          );


          if (message) {

            photoInput.value = '';

            setStatus(
              'error',
              message
            );

          } else {

            clearStatus();

          }

        }
      );

    }


    /* ------------------------------------------------------------
       Clear validation errors
    ------------------------------------------------------------ */

    $$(
      'input, textarea, select',
      form
    ).forEach((field) => {

      field.addEventListener(
        'input',
        () =>
          markInvalid(
            field,
            false
          )
      );


      field.addEventListener(
        'change',
        () =>
          markInvalid(
            field,
            false
          )
      );

    });


    /* ------------------------------------------------------------
       Submit
    ------------------------------------------------------------ */

    form.addEventListener(
      'submit',
      async (event) => {

        event.preventDefault();


        if (busy)
          return;


        clearStatus();


        /* Native validation */

        if (!form.checkValidity()) {

          const invalid =
            $$(':invalid', form);


          invalid.forEach(
            (field) =>
              markInvalid(
                field,
                true
              )
          );


          form.reportValidity();


          if (invalid[0])
            invalid[0].focus();


          return;

        }


        /* Story length */

        const storyField =
          form.elements.story;


        const story =
          storyField
            ? storyField.value.trim()
            : '';


        if (
          story.length <
          CONFIG.minStoryChars
        ) {

          markInvalid(
            storyField,
            true
          );


          setStatus(
            'error',
            'Please tell us a little more about your story.'
          );


          storyField.focus();


          return;

        }


        /* Photo */

        const photo =
          photoInput &&
          photoInput.files[0];


        const photoMessage =
          photoError(photo);


        if (photoMessage) {

          markInvalid(
            photoInput,
            true
          );


          setStatus(
            'error',
            photoMessage
          );


          return;

        }


        /* Spam trap */

        if (trap.value) {

          form.reset();


          setStatus(
            'success',
            'Thank you. Your story has been received.'
          );


          return;

        }


        /* Cooldown */

        const last =
          Number(
            safeStorage.get(
              'ua_last_submit'
            ) || 0
          );


        const wait =
          CONFIG.cooldownMs -
          (Date.now() - last);


        if (wait > 0) {

          setStatus(
            'info',
            `Please wait ${
              Math.ceil(wait / 1000)
            } seconds before sending another story.`
          );


          return;

        }


        /* No endpoint */

        if (!isEndpointConfigured()) {

          setStatus(
            'error',
            'The story form is not connected yet. Please email your story to unlockedarc.media@gmail.com for now.'
          );


          return;

        }


        setBusy(true);


        const controller =
          new AbortController();


        const timer =
          setTimeout(
            () =>
              controller.abort(),
            CONFIG.timeoutMs
          );


        try {

          const data =
            new FormData(form);


          data.set(
            'story',
            story
          );


          if (!photo)
            data.delete('photo');


          data.append(
            '_subject',
            'New UNLOCKED ARC story submission'
          );


          const response =
            await fetch(
              CONFIG.formEndpoint,
              {

                method: 'POST',

                body: data,

                headers: {
                  Accept:
                    'application/json'
                },

                signal:
                  controller.signal

              }
            );


          if (response.ok) {

            safeStorage.set(
              'ua_last_submit',
              String(Date.now())
            );


            form.reset();


            setStatus(
              'success',
              'Thank you. Your story has been received. If it is selected, we will contact you using the email you provided.'
            );


          } else {

            let detail = '';


            try {

              const json =
                await response.json();


              if (
                Array.isArray(
                  json.errors
                )
              ) {

                detail =
                  json.errors
                    .map(
                      (error) =>
                        error.message
                    )
                    .join(' ');

              } else if (
                json.error
              ) {

                detail =
                  json.error;

              }

            } catch (_) {
              // Not JSON.
            }


            setStatus(
              'error',
              detail ||
              'Something went wrong while sending. Please try again, or email unlockedarc.media@gmail.com.'
            );

          }

        } catch (error) {

          setStatus(
            'error',
            error &&
            error.name ===
              'AbortError'
              ? 'The connection timed out. Please check your internet and try again.'
              : 'Could not reach the server. Please check your internet and try again.'
          );

        } finally {

          clearTimeout(timer);

          setBusy(false);

        }

      }
    );

  }


  /* ================================================================
     INIT
  ================================================================ */

  function init() {

    injectStyles();

    initPageEntrance();

    initAnchorOffset();

    initActiveNav();

    initReveal();

    initScrollProgress();

    initBackToTop();

    initStorySearch();

    initStoryCards();

    initStoryCounters();

    initMobileNavigation();

    initPageTransitions();

    initStoryForm();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init
    );

  } else {

    init();

  }

})();
```
