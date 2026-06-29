const PROFILES = {
  menu: {
    controls: [],
    hint: '轻触任意游戏卡片即可开始',
  },
  tetris: {
    controls: ['left', 'right', 'down', 'primary', 'secondary', 'pause', 'restart', 'home'],
    hint: '按住方向键移动 · A 旋转 · B 直落',
    labels: { primary: ['↻', '旋转'], secondary: ['⇣', '直落'] },
  },
  snake: {
    controls: ['up', 'left', 'down', 'right', 'pause', 'restart', 'home', 'speed-slow', 'speed-normal', 'speed-fast'],
    hint: '轻触方向键控制蛇的前进方向',
    selected: 'speed-normal',
  },
  maryJump: {
    controls: ['left', 'right', 'primary', 'secondary', 'pause', 'restart', 'home'],
    hint: '按住左右移动 · A 跳跃 · B 从第1关开始',
    labels: { primary: ['▲', '跳跃'], secondary: ['1', '第1关'] },
  },
  tank: {
    controls: ['up', 'left', 'down', 'right', 'primary', 'secondary', 'pause', 'restart', 'home'],
    hint: '按住方向键驾驶 · A 开火 · B 从第1关开始',
    labels: { primary: ['●', '开火'], secondary: ['1', '第1关'] },
  },
};

class MobileControls {
  constructor() {
    this.root = document.querySelector('#touch-controls');
    this.hint = document.querySelector('#touch-hint');
    this.buttons = new Map();
    this.pressed = new Set();
    this.listeners = new Map();
    this.bindButtons();
    this.setProfile('menu');
  }

  bindButtons() {
    this.root.addEventListener('selectstart', (event) => event.preventDefault());
    this.root.addEventListener('dragstart', (event) => event.preventDefault());
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

  setProfile(name) {
    const profile = PROFILES[name] ?? PROFILES.menu;
    this.releaseAll();
    this.root.dataset.profile = name;
    document.body.dataset.gameProfile = name;
    this.hint.textContent = profile.hint;
    const visible = new Set(profile.controls);
    this.buttons.forEach((button, control) => {
      button.classList.remove('is-selected');
      button.hidden = !visible.has(control);
      const label = profile.labels?.[control];
      if (label) {
        button.querySelector('strong').textContent = label[0];
        button.querySelector('span').textContent = label[1];
      }
    });
    if (profile.selected) this.select(profile.selected);
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

  select(control) {
    this.buttons.forEach((button, key) => {
      if (key.startsWith('speed-')) button.classList.toggle('is-selected', key === control);
    });
  }

  releaseAll() {
    this.pressed.clear();
    this.buttons.forEach((button) => button.classList.remove('is-pressed'));
  }
}

export const mobileControls = new MobileControls();
