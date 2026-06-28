export function showSceneLoader(scene, accent = 0x748ffc) {
  const depth = 1000;
  const backdrop = scene.add.rectangle(430, 340, 860, 680, 0x090b15).setDepth(depth);
  const title = scene.add.text(430, 304, '正在加载 / LOADING  0%', {
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
    title.setText(`正在加载 / LOADING  ${percent}%`);
    bar.setScale(progress, 1);
  };
  const showError = () => {
    failed = true;
    title.setText('资源加载失败\n轻触重试 / TAP TO RETRY').setAlign('center').setColor('#ff8787');
    backdrop.setInteractive().once('pointerdown', () => globalThis.location?.reload());
  };
  const cleanup = () => {
    scene.load.off('progress', update);
    scene.load.off('loaderror', showError);
    if (failed) return;
    [backdrop, title, track, bar].forEach((object) => object.destroy());
  };

  scene.load.on('progress', update);
  scene.load.on('loaderror', showError);
  scene.load.once('complete', cleanup);
}
