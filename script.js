/*!
 * UNLOCKED ARC — site script
 * Plain JavaScript, no dependencies. Works on GitHub Pages as-is.
 *
 * Features
 *  1. Story form: validation, photo checks, spam trap, cooldown, real submission
 *  2. Accurate anchor scrolling under the fixed header
 *  3. Active nav link highlighting
 *  4. Gentle reveal-on-scroll (respects "reduce motion")
 *
 * SETUP: replace YOUR_FORM_ID below (see instructions in chat).
 */
(() => {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  CONFIG — the only part you need to edit                            */
  /* ------------------------------------------------------------------ */
  const CONFIG = {
    // Create a free form at https://formspree.io and paste its endpoint here.
    formEndpoint: 'https://formspree.io/f/YOUR_FORM_ID',
    maxPhotoMB: 5,          // largest photo accepted
    minStoryChars: 30,      // shortest story accepted
    cooldownMs: 30000,      // wait time between submissions from one browser
    timeoutMs: 30000,       // give up on a slow network after this long
  };

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isEndpointConfigured = () =>
    typeof CONFIG.formEndpoint === 'string' &&
    /^https:\/\//.test(CONFIG.formEndpoint) &&
    !CONFIG.formEndpoint.includes('YOUR_FORM_ID');

  const safeStorage = {
    get(key) {
      try { return window.sessionStorage.getItem(key); } catch (_) { return null; }
    },
    set(key, value) {
      try { window.sessionStorage.setItem(key, value); } catch (_) { /* ignore */ }
    },
  };

  /* ------------------------------------------------------------------ */
  /*  Injected styles (so you do not have to touch style.css)            */
  /* ------------------------------------------------------------------ */
  function injectStyles() {
    const css = `
      nav a[aria-current="true"]{color:var(--text,#f5f5f0)}
      .btn[disabled]{opacity:.6;cursor:not-allowed}
      .form-status{margin:18px 0 0;padding:14px 16px;border-radius:10px;font-size:14px;line-height:1.5;border:1px solid transparent}
      .form-status:empty{display:none}
      .form-status.is-success{background:#10210f;border-color:#2f6b2c;color:#b9f0b4}
      .form-status.is-error{background:#2a1111;border-color:#7a2d2d;color:#ffc4c4}
      .form-status.is-info{background:#1a1a12;border-color:#5c5320;color:#f0e2a0}
      input:focus-visible,textarea:focus-visible,.btn:focus-visible,nav a:focus-visible,a:focus-visible{outline:2px solid var(--accent,#e9c46a);outline-offset:2px}
      input[aria-invalid="true"],textarea[aria-invalid="true"]{border-color:#c0504d}
      html.js .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s ease,transform .7s ease}
      html.js .reveal.is-visible{opacity:1;transform:none}
      @media (prefers-reduced-motion:reduce){html.js .reveal{opacity:1;transform:none;transition:none}}
    `;
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* ------------------------------------------------------------------ */
  /*  1. Anchor offset for the fixed header                              */
  /* ------------------------------------------------------------------ */
  function initAnchorOffset() {
    const header = $('.nav');
    const apply = () => {
      const offset = (header ? header.offsetHeight : 0) + 16;
      $$('section[id]').forEach((section) => {
        section.style.scrollMarginTop = `${offset}px`;
      });
    };
    apply();
    window.addEventListener('resize', apply, { passive: true });
    window.addEventListener('load', apply);
  }

  /* ------------------------------------------------------------------ */
  /*  2. Active nav link                                                 */
  /* ------------------------------------------------------------------ */
  function initActiveNav() {
    if (!('IntersectionObserver' in window)) return;

    const links = $$('nav a[href^="#"]');
    const map = new Map();
    links.forEach((link) => {
      const target = $(link.getAttribute('href'));
      if (target) map.set(target, link);
    });
    if (!map.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = map.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => l.removeAttribute('aria-current'));
            link.setAttribute('aria-current', 'true');
          }
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    map.forEach((_, section) => observer.observe(section));
  }

  /* ------------------------------------------------------------------ */
  /*  3. Reveal on scroll                                                */
  /* ------------------------------------------------------------------ */
  function initReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const targets = $$('.cards article, .manifesto p, .contact > div, .section > .lead');
    if (!targets.length) return;

    document.documentElement.classList.add('js');
    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(i % 3) * 90}ms`;
    });

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    targets.forEach((el) => observer.observe(el));
  }

  /* ------------------------------------------------------------------ */
  /*  4. Story form                                                      */
  /* ------------------------------------------------------------------ */
  function initStoryForm() {
    const form = $('#share form');
    if (!form) return;

    const submitButton = $('button[type="submit"]', form);
    const submitLabel = submitButton ? submitButton.textContent : 'Submit story';
    const photoInput = form.elements.photo;
    let busy = false;

    // Autofill hints
    const hints = { name: 'name', email: 'email', country: 'country-name', phone: 'tel' };
    Object.keys(hints).forEach((field) => {
      if (form.elements[field]) form.elements[field].setAttribute('autocomplete', hints[field]);
    });
    if (form.elements.story) form.elements.story.setAttribute('maxlength', '8000');

    // Real endpoint also works if JavaScript fails to load
    if (isEndpointConfigured()) {
      form.setAttribute('action', CONFIG.formEndpoint);
      form.setAttribute('method', 'POST');
    }

    // Hidden spam trap: humans never see it, bots fill it in
    const trap = document.createElement('input');
    trap.type = 'text';
    trap.name = '_gotcha';
    trap.tabIndex = -1;
    trap.autocomplete = 'off';
    trap.setAttribute('aria-hidden', 'true');
    trap.style.cssText =
      'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none';
    form.appendChild(trap);

    // Status message area (screen-reader friendly)
    const status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    status.tabIndex = -1;
    form.appendChild(status);

    const setStatus = (type, message) => {
      status.className = `form-status is-${type}`;
      status.textContent = message;
      status.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
    };
    const clearStatus = () => {
      status.className = 'form-status';
      status.textContent = '';
    };
    const setBusy = (state) => {
      busy = state;
      if (!submitButton) return;
      submitButton.disabled = state;
      submitButton.textContent = state ? 'Sending…' : submitLabel;
      form.setAttribute('aria-busy', String(state));
    };
    const markInvalid = (field, invalid) => {
      if (field) field.setAttribute('aria-invalid', String(invalid));
    };

    function photoError(file) {
      if (!file) return '';
      if (!file.type || !file.type.startsWith('image/')) {
        return 'Please choose an image file (JPG, PNG, WebP, etc.).';
      }
      if (file.size > CONFIG.maxPhotoMB * 1024 * 1024) {
        return `That photo is too large. Please choose one under ${CONFIG.maxPhotoMB} MB.`;
      }
      return '';
    }

    // Check the photo as soon as it is chosen
    if (photoInput) {
      photoInput.addEventListener('change', () => {
        const message = photoError(photoInput.files[0]);
        markInvalid(photoInput, Boolean(message));
        if (message) {
          photoInput.value = '';
          setStatus('error', message);
        } else {
          clearStatus();
        }
      });
    }

    // Clear red borders as the person fixes things
    $$('input, textarea', form).forEach((field) => {
      field.addEventListener('input', () => markInvalid(field, false));
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (busy) return;
      clearStatus();

      // Native validation (required fields, email format)
      if (!form.checkValidity()) {
        const firstBad = $(':invalid', form);
        $$(':invalid', form).forEach((f) => markInvalid(f, true));
        form.reportValidity();
        if (firstBad) firstBad.focus();
        return;
      }

      // Story length
      const storyField = form.elements.story;
      const story = storyField.value.trim();
      if (story.length < CONFIG.minStoryChars) {
        markInvalid(storyField, true);
        setStatus('error', 'Please tell us a little more about what happened.');
        storyField.focus();
        return;
      }

      // Photo
      const photo = photoInput && photoInput.files[0];
      const photoMessage = photoError(photo);
      if (photoMessage) {
        markInvalid(photoInput, true);
        setStatus('error', photoMessage);
        return;
      }

      // Spam trap: pretend success so bots learn nothing
      if (trap.value) {
        form.reset();
        setStatus('success', 'Thank you. Your story has been received.');
        return;
      }

      // Cooldown against accidental double submits
      const last = Number(safeStorage.get('ua_last_submit') || 0);
      const wait = CONFIG.cooldownMs - (Date.now() - last);
      if (wait > 0) {
        setStatus('info', `Please wait ${Math.ceil(wait / 1000)} seconds before sending another story.`);
        return;
      }

      // Never claim success when nothing can actually be sent
      if (!isEndpointConfigured()) {
        setStatus(
          'error',
          'The story form is not connected yet. Please email your story to unlockedarc.media@gmail.com for now.'
        );
        return;
      }

      setBusy(true);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);

      try {
        const data = new FormData(form);
        data.set('story', story);
        if (!photo) data.delete('photo');
        data.append('_subject', 'New UNLOCKED ARC story submission');

        const response = await fetch(CONFIG.formEndpoint, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (response.ok) {
          safeStorage.set('ua_last_submit', String(Date.now()));
          form.reset();
          setStatus(
            'success',
            'Thank you. Your story has been received. If it is selected, we will contact you using the email you provided.'
          );
        } else {
          let detail = '';
          try {
            const json = await response.json();
            if (Array.isArray(json.errors)) {
              detail = json.errors.map((e) => e.message).join(' ');
            } else if (json.error) {
              detail = json.error;
            }
          } catch (_) { /* response was not JSON */ }
          setStatus(
            'error',
            detail || 'Something went wrong while sending. Please try again, or email us at unlockedarc.media@gmail.com.'
          );
        }
      } catch (error) {
        setStatus(
          'error',
          error && error.name === 'AbortError'
            ? 'The connection timed out. Please check your internet and try again.'
            : 'Could not reach the server. Please check your internet and try again.'
        );
      } finally {
        clearTimeout(timer);
        setBusy(false);
      }
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Start                                                              */
  /* ------------------------------------------------------------------ */
  function init() {
    injectStyles();
    initAnchorOffset();
    initActiveNav();
    initReveal();
    initStoryForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
