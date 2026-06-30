import { t } from '../i18n.js';

export function showSceneLoader(scene, accent = 0x748ffc) {
  const depth = 1000;
  const backdrop = scene.add.rectangle(430, 340, 860, 680, 0x090b15).setDepth(depth);
  const title = scene.add.text(430, 304, t('loader.loading', { percent: 0 }), {
    fontFamily: 'Arial Black, Arial',
    fontSize: '20px',
    color: '#f1f3ff',
  }).setOrigin(0.5).setDepth(depth + 1);
  const track = scene.add.rectangle(430, 350, 300, 8, 0x252b46)
    .setOrigin(0.5)
    .setDepth(depth + 1);
  const bar = scene.add.rectangle(280, 350, 300, 8, accent)
    .setOrigin(0, 0.5)
    .setScale(0, 1)
    .setDepth(depth + 2);
  let failed = false;

  const update = (progress) => {
    const percent = Math.round(progress * 100);
    title.setText(t('loader.loading', { percent }));
    bar.setScale(progress, 1);
  };
  const showError = () => {
    failed = true;
    title.setText(t('loader.error')).setAlign('center').setColor('#ff8787');
    backdrop.setInteractive().once('pointerdown', () => globalThis.location?.reload());
  };
  const cleanup = () => {
    scene.load.off('progress', update);
    scene.load.off('loaderror', showError);
    scene.events.off('shutdown', cleanup);
    if (failed) return;
    [backdrop, title, track, bar].forEach((object) => object.destroy());
  };

  scene.load.on('progress', update);
  scene.load.on('loaderror', showError);
  scene.load.once('complete', cleanup);
  scene.events.once('shutdown', cleanup);
}
