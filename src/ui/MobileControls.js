import { t } from '../i18n.js';

const PROFILES = {
  menu: {
    controls: [],
  },
  tetris: {
    controls: ['left', 'right', 'down', 'primary', 'secondary', 'pause', 'restart', 'home'],
    joystick: true,
    defaultMovementMode: 'buttons',
    labels: { primary: ['↻', 'touch.rotate'], secondary: ['⇣', 'touch.drop'] },
  },
  snake: {
    controls: ['up', 'left', 'down', 'right', 'pause', 'restart', 'home', 'speed-slow', 'speed-normal', 'speed-fast'],
    joystick: true,
    defaultMovementMode: 'joystick',
    selected: 'speed-normal',
    landscape: true,
  },
  maryJump: {
    controls: ['left', 'right', 'primary', 'fire', 'secondary', 'pause', 'restart', 'home'],
    joystick: true,
    defaultMovementMode: 'joystick',
    labels: { primary: ['▲', 'touch.jump'], fire: ['●', 'touch.fire'], secondary: ['1', 'touch.first'] },
    landscape: true,
  },
  tank: {
    controls: ['up', 'left', 'down', 'right', 'primary', 'secondary', 'pause', 'restart', 'home'],
    joystick: true,
    defaultMovementMode: 'joystick',
    labels: { primary: ['●', 'touch.fire'], secondary: ['1', 'touch.first'] },
    landscape: true,
  },
  carrotDefense: {
    controls: ['pause', 'restart', 'home'],
  },
  linkMatch: {
    controls: ['primary', 'pause', 'restart', 'home'],
    labels: { primary: ['↻', 'touch.shuffle'] },
  },
};

class MobileControls {
  constructor() {
    this.root = document.querySelector('#touch-controls');
    this.buttons = new Map();
    this.pressed = new Set();
    this.listeners = new Map();
    this.joystick = this.root.querySelector('.touch-joystick');
    this.joystickKnob = this.root.querySelector('.touch-joystick__knob');
    this.joystickVector = { x: 0, y: 0 };
    this.joystickPointerId = null;
    this.movementMode = 'buttons';
    this.movementModes = new Map();
    this.movementToggle = this.root.querySelector('[data-movement-toggle]');
    this.currentProfile = 'menu';
    this.landscapeButton = this.root.querySelector('.touch-landscape-toggle');
    this.landscapeActive = false;
    this.preventMobileBrowserMenus();
    this.bindButtons();
    this.bindMovementModes();
    this.bindLandscapeMode();
    this.bindJoystick();
    this.setProfile('menu');
  }

  preventMobileBrowserMenus() {
    const usesTouchLayout = globalThis.matchMedia?.('(pointer: coarse), (max-width: 800px)').matches;
    if (!usesTouchLayout) return;
    ['contextmenu', 'selectstart', 'dragstart'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => event.preventDefault());
    });
  }

  bindButtons() {
    this.root.addEventListener('selectstart', (event) => event.preventDefault());
    this.root.addEventListener('dragstart', (event) => event.preventDefault());
    this.root.addEventListener('contextmenu', (event) => event.preventDefault());
    this.root.addEventListener('touchstart', (event) => event.preventDefault(), { passive: false });
    ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
      document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
    });
    document.addEventListener('touchmove', (event) => {
      if (event.touches.length > 1) event.preventDefault();
    }, { passive: false });
    this.root.querySelectorAll('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      this.buttons.set(control, button);
      const release = (event) => {
        event?.preventDefault();
        const wasPressed = this.pressed.delete(control);
        button.classList.remove('is-pressed');
        if (event?.type === 'pointerup' && wasPressed && this.shouldEmitOnRelease(control)) {
          this.emit(control);
        }
      };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.pressed.add(control);
        button.classList.add('is-pressed');
        globalThis.navigator?.vibrate?.(8);
        if (!this.shouldEmitOnRelease(control)) this.emit(control);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    globalThis.addEventListener('blur', () => this.releaseAll());
  }

  shouldEmitOnRelease(control) {
    return control === 'pause' || control === 'home';
  }

  bindMovementModes() {
    this.movementToggle?.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.setMovementMode(this.movementMode === 'joystick' ? 'buttons' : 'joystick');
    });
  }

  bindLandscapeMode() {
    // Mobile fullscreen requests are accepted from pointerup more reliably
    // than pointerdown (notably in Chromium and embedded WebViews).
    this.landscapeButton?.addEventListener('pointerup', (event) => {
      event.preventDefault();
      void this.setLandscapeMode(!this.landscapeActive);
    });
    const syncOrientation = () => this.syncLandscapePresentation();
    globalThis.addEventListener('orientationchange', syncOrientation);
    globalThis.addEventListener('resize', syncOrientation);
  }

  async setLandscapeMode(active) {
    this.landscapeActive = active;
    document.body.classList.toggle('is-landscape-mode', active);
    this.syncLandscapePresentation();

    if (active) {
      try {
        const root = document.documentElement;
        const requestFullscreen = root.requestFullscreen ?? root.webkitRequestFullscreen;
        if (requestFullscreen && !document.fullscreenElement && !document.webkitFullscreenElement) {
          await requestFullscreen.call(root);
        }
        await globalThis.screen?.orientation?.lock?.('landscape');
      } catch {
        // iOS Safari does not support locking page orientation; the button still
        // prepares the landscape layout and asks the player to rotate the phone.
      }
      this.syncLandscapePresentation();
      return;
    }

    globalThis.screen?.orientation?.unlock?.();
    try {
      const exitFullscreen = document.exitFullscreen ?? document.webkitExitFullscreen;
      if (exitFullscreen && (document.fullscreenElement || document.webkitFullscreenElement)) {
        await exitFullscreen.call(document);
      }
    } catch {
      // Leaving fullscreen can be rejected after the browser exits it itself.
    }
    this.syncLandscapePresentation();
  }

  syncLandscapePresentation() {
    const isLandscape = globalThis.matchMedia?.('(orientation: landscape)').matches;
    document.body.classList.toggle(
      'is-forced-landscape',
      Boolean(this.landscapeActive && !isLandscape),
    );
    this.updateLandscapeButton();
  }

  updateLandscapeButton() {
    if (!this.landscapeButton) return;
    const isLandscape = globalThis.matchMedia?.('(orientation: landscape)').matches;
    const hasLandscapeLayout = isLandscape || document.body.classList.contains('is-forced-landscape');
    const labelKey = !this.landscapeActive
      ? 'global.landscape'
      : (hasLandscapeLayout ? 'global.portrait' : 'global.rotateDevice');
    this.landscapeButton.querySelector('span').textContent = t(labelKey);
    this.landscapeButton.setAttribute('aria-pressed', String(this.landscapeActive));
  }

  bindJoystick() {
    const update = (event) => {
      if (this.joystickPointerId !== event.pointerId) return;
      event.preventDefault();
      const bounds = this.joystick.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const pointerDx = event.clientX - centerX;
      const pointerDy = event.clientY - centerY;
      // The iOS fallback rotates the whole control surface clockwise. Convert
      // the physical screen delta back into the joystick's local axes.
      const forcedLandscape = document.body.classList.contains('is-forced-landscape');
      const dx = forcedLandscape ? pointerDy : pointerDx;
      const dy = forcedLandscape ? -pointerDx : pointerDy;
      const distance = Math.hypot(dx, dy);
      const radius = bounds.width * 0.32;
      const scale = distance > radius ? radius / distance : 1;
      this.joystickVector.x = (dx * scale) / radius;
      this.joystickVector.y = (dy * scale) / radius;
      this.joystickKnob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`;
    };
    const release = (event) => {
      if (event?.pointerId !== undefined && this.joystickPointerId !== event.pointerId) return;
      event?.preventDefault();
      this.joystickPointerId = null;
      this.resetJoystick();
    };
    this.joystick.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      this.joystickPointerId = event.pointerId;
      this.joystick.setPointerCapture?.(event.pointerId);
      globalThis.navigator?.vibrate?.(8);
      update(event);
    });
    this.joystick.addEventListener('pointermove', update);
    this.joystick.addEventListener('pointerup', release);
    this.joystick.addEventListener('pointercancel', release);
    this.joystick.addEventListener('lostpointercapture', release);
  }

  setProfile(name) {
    const profile = PROFILES[name] ?? PROFILES.menu;
    this.currentProfile = name;
    this.releaseAll();
    this.root.dataset.profile = name;
    this.root.classList.toggle('supports-joystick', Boolean(profile.joystick));
    this.root.classList.toggle('supports-landscape', Boolean(profile.landscape));
    if (this.landscapeButton) this.landscapeButton.hidden = !profile.landscape;
    if (!profile.landscape && this.landscapeActive) void this.setLandscapeMode(false);
    document.body.dataset.gameProfile = name;
    document.body.dataset.landscapeProfile = profile.landscape ? name : '';
    const visible = new Set(profile.controls);
    this.buttons.forEach((button, control) => {
      button.classList.remove('is-selected');
      button.hidden = !visible.has(control);
      const label = profile.labels?.[control];
      if (label) {
        button.querySelector('strong').textContent = label[0];
        button.querySelector('span').textContent = t(label[1]);
      }
    });
    if (profile.selected) this.select(profile.selected);
    if (profile.joystick) {
      const mode = this.movementModes.get(name) ?? profile.defaultMovementMode;
      this.setMovementMode(mode);
    }
  }

  setMovementMode(mode) {
    this.movementMode = mode === 'buttons' ? 'buttons' : 'joystick';
    if (PROFILES[this.currentProfile]?.joystick) {
      this.movementModes.set(this.currentProfile, this.movementMode);
    }
    this.root.dataset.movementMode = this.movementMode;
    if (this.movementToggle) {
      const labelKey = this.movementMode === 'joystick' ? 'global.joystick' : 'global.buttons';
      this.movementToggle.dataset.i18n = labelKey;
      this.movementToggle.textContent = t(labelKey);
      this.movementToggle.setAttribute('aria-label', t(labelKey));
    }
    this.releaseAll();
  }

  on(control, handler) {
    if (!this.listeners.has(control)) this.listeners.set(control, new Set());
    this.listeners.get(control).add(handler);
    return () => this.listeners.get(control)?.delete(handler);
  }

  bindScene(scene, profile, bindings) {
    this.setProfile(profile);
    const unsubscribe = Object.entries(bindings).map(([control, handler]) => this.on(control, handler));
    scene.events.once('shutdown', () => {
      unsubscribe.forEach((off) => off());
      this.releaseAll();
    });
  }

  emit(control) {
    this.listeners.get(control)?.forEach((handler) => handler());
  }

  isDown(control) {
    return this.pressed.has(control);
  }

  axis() {
    if (this.movementMode === 'joystick' && this.root.classList.contains('supports-joystick')) {
      return { ...this.joystickVector };
    }
    return {
      x: (this.pressed.has('right') ? 1 : 0) - (this.pressed.has('left') ? 1 : 0),
      y: (this.pressed.has('down') ? 1 : 0) - (this.pressed.has('up') ? 1 : 0),
    };
  }

  isUsingJoystick() {
    return this.movementMode === 'joystick' && this.root.classList.contains('supports-joystick');
  }

  select(control) {
    this.buttons.forEach((button, key) => {
      if (key.startsWith('speed-')) button.classList.toggle('is-selected', key === control);
    });
  }

  releaseAll() {
    this.pressed.clear();
    this.buttons.forEach((button) => button.classList.remove('is-pressed'));
    this.resetJoystick();
  }

  resetJoystick() {
    this.joystickVector.x = 0;
    this.joystickVector.y = 0;
    if (this.joystickKnob) this.joystickKnob.style.transform = 'translate(0, 0)';
  }
}

export const mobileControls = new MobileControls();
