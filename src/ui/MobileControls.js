import { t } from '../i18n.js';

const PROFILES = {
  menu: {
    controls: [],
  },
  tetris: {
    controls: ['left', 'right', 'down', 'primary', 'secondary', 'pause', 'restart', 'home'],
    labels: { primary: ['↻', 'touch.rotate'], secondary: ['⇣', 'touch.drop'] },
  },
  snake: {
    controls: ['up', 'left', 'down', 'right', 'pause', 'restart', 'home', 'speed-slow', 'speed-normal', 'speed-fast'],
    selected: 'speed-normal',
  },
  maryJump: {
    controls: ['left', 'right', 'primary', 'tertiary', 'secondary', 'pause', 'restart', 'home'],
    joystick: true,
    labels: { primary: ['▲', 'touch.jump'], tertiary: ['⇈', 'touch.bigJump'], secondary: ['1', 'touch.first'] },
  },
  tank: {
    controls: ['up', 'left', 'down', 'right', 'primary', 'secondary', 'pause', 'restart', 'home'],
    joystick: true,
    labels: { primary: ['●', 'touch.fire'], secondary: ['1', 'touch.first'] },
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
    this.movementMode = 'joystick';
    this.preventMobileBrowserMenus();
    this.bindButtons();
    this.bindMovementModes();
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
        this.pressed.delete(control);
        button.classList.remove('is-pressed');
      };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.pressed.add(control);
        button.classList.add('is-pressed');
        globalThis.navigator?.vibrate?.(8);
        this.emit(control);
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
    });
    globalThis.addEventListener('blur', () => this.releaseAll());
  }

  bindMovementModes() {
    this.root.querySelectorAll('[data-movement-mode]').forEach((button) => {
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        this.setMovementMode(button.dataset.movementMode);
      });
    });
  }

  bindJoystick() {
    const update = (event) => {
      if (this.joystickPointerId !== event.pointerId) return;
      event.preventDefault();
      const bounds = this.joystick.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
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
    this.releaseAll();
    this.root.dataset.profile = name;
    this.root.classList.toggle('supports-joystick', Boolean(profile.joystick));
    document.body.dataset.gameProfile = name;
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
    if (profile.joystick) this.setMovementMode(this.movementMode);
  }

  setMovementMode(mode) {
    this.movementMode = mode === 'buttons' ? 'buttons' : 'joystick';
    this.root.dataset.movementMode = this.movementMode;
    this.root.querySelectorAll('[data-movement-mode]').forEach((button) => {
      button.classList.toggle('is-selected', button.dataset.movementMode === this.movementMode);
    });
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
