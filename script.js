let quality = 24; // 24/200 = 12% exato
let points = 0;
let day = 1;
const QUALITY_TARGET = 200;
let pendingActions = [];
let appliedActions = new Set(); // ações cujo efeito já foi aplicado (proteção/bônus permanentes)
let soundEnabled = true;
let librasEnabled = true;
let activeEvents = [];
let audioCtx = null;
let psaActive = false; // Proteção de Nascentes ativa (reduz degradação diária)
let currentAct = 1;
let shownMilestones = new Set();
let dayTransitionInProgress = false;

// ==================== CANVAS RENDERING ====================
let canvasStartTime = Date.now();
const CYCLE_DURATION = 180000;

let plantedTrees = [];
let visualEffects = [];
let screenFlash = null;

// ==================== SPRITES REAIS DO RIO (lixo / peixes / plantas / efeitos) ====================
// Extraídos da folha de referência do rio e recortados em sprite sheets com fundo transparente.
// Cada sheet vem acompanhado de um array de "frames" (retângulos reais de cada ícone dentro da
// imagem), então o desenho usa drawImage com coordenadas de origem (sx, sy, sw, sh).
const riverSprites = {};
function loadRiverSheet(name, src) {
  const img = new Image();
  riverSprites[name] = { img, loaded: false };
  img.onload = () => { riverSprites[name].loaded = true; };
  img.src = src;
}
loadRiverSheet('trash', 'assets/river/trash_sheet.png');
loadRiverSheet('fish', 'assets/river/fish_sheet.png');
loadRiverSheet('plants', 'assets/river/plants_sheet.png');
loadRiverSheet('effects', 'assets/river/effects_sheet.png');
// Árvores reais (usadas tanto no fundo quanto nas árvores plantadas pelo jogador) — recortadas
// em ícones individuais de assets/river/bg_trees_sparse.png (ver FRAMES_TREES mais abaixo).
loadRiverSheet('bgTreesIcons', 'assets/river/bg_trees_sparse.png');
// Camadas de fundo reais (fornecidas pelo usuário), tileadas horizontalmente com paralaxe:
loadRiverSheet('bgClouds', 'assets/river/clouds_sheet.png');
loadRiverSheet('bgForest', 'assets/river/bg_forest_silhouette.png');
loadRiverSheet('bgTreesDense', 'assets/river/bg_trees_dense.png');
loadRiverSheet('bgTreesMedium', 'assets/river/bg_trees_medium.png');
loadRiverSheet('bgTreesSparse', 'assets/river/bg_trees_sparse.png');
loadRiverSheet('bgGround', 'assets/river/bg_ground.png');
loadRiverSheet('bgRocks', 'assets/river/bg_rocks_bushes.png');
loadRiverSheet('bgWater', 'assets/river/bg_water.png');
loadRiverSheet('bgWateranimation', 'assets/river/water_anim_sheet.png');
// Fábrica real — anexada na margem direita do rio.
loadRiverSheet('bgFactory', 'assets/river/bg_factory.png');

const FRAMES_TRASH = [{"x": 0, "y": 15, "w": 83, "h": 21}, {"x": 106, "y": 7, "w": 36, "h": 29}, {"x": 188, "y": 5, "w": 38, "h": 31}, {"x": 280, "y": 2, "w": 21, "h": 34}, {"x": 353, "y": 5, "w": 40, "h": 31}, {"x": 30, "y": 42, "w": 22, "h": 30}, {"x": 105, "y": 41, "w": 38, "h": 31}, {"x": 194, "y": 39, "w": 27, "h": 33}, {"x": 276, "y": 44, "w": 28, "h": 28}, {"x": 353, "y": 49, "w": 41, "h": 23}, {"x": 21, "y": 87, "w": 40, "h": 21}, {"x": 110, "y": 77, "w": 28, "h": 31}, {"x": 189, "y": 74, "w": 36, "h": 34}, {"x": 270, "y": 72, "w": 40, "h": 36}, {"x": 354, "y": 79, "w": 39, "h": 29}, {"x": 25, "y": 114, "w": 32, "h": 30}, {"x": 104, "y": 117, "w": 41, "h": 27}, {"x": 187, "y": 115, "w": 40, "h": 29}, {"x": 271, "y": 116, "w": 39, "h": 28}, {"x": 352, "y": 115, "w": 43, "h": 29}];
const FRAMES_FISH = [{"x": 6, "y": 4, "w": 48, "h": 27}, {"x": 64, "y": 3, "w": 52, "h": 28}, {"x": 124, "y": 2, "w": 51, "h": 29}, {"x": 183, "y": 2, "w": 53, "h": 29}, {"x": 240, "y": 1, "w": 60, "h": 30}, {"x": 7, "y": 36, "w": 45, "h": 26}, {"x": 62, "y": 33, "w": 55, "h": 29}, {"x": 124, "y": 33, "w": 52, "h": 29}, {"x": 185, "y": 32, "w": 49, "h": 30}, {"x": 247, "y": 31, "w": 46, "h": 31}, {"x": 8, "y": 65, "w": 44, "h": 28}, {"x": 69, "y": 66, "w": 41, "h": 27}, {"x": 127, "y": 66, "w": 45, "h": 27}];
const FRAMES_PLANTS = [{"x": 9, "y": 0, "w": 36, "h": 54}, {"x": 62, "y": 2, "w": 41, "h": 52}, {"x": 115, "y": 4, "w": 45, "h": 50}, {"x": 170, "y": 0, "w": 44, "h": 54}, {"x": 0, "y": 61, "w": 55, "h": 47}, {"x": 58, "y": 62, "w": 49, "h": 46}, {"x": 122, "y": 60, "w": 30, "h": 48}];
const FRAMES_EFFECTS = [{"x": 19, "y": 31, "w": 16, "h": 18}, {"x": 76, "y": 34, "w": 10, "h": 15}, {"x": 128, "y": 34, "w": 14, "h": 15}, {"x": 183, "y": 34, "w": 12, "h": 15}, {"x": 227, "y": 0, "w": 31, "h": 49}, {"x": 20, "y": 86, "w": 13, "h": 12}, {"x": 75, "y": 84, "w": 12, "h": 14}, {"x": 126, "y": 81, "w": 17, "h": 17}, {"x": 181, "y": 81, "w": 16, "h": 17}, {"x": 216, "y": 69, "w": 54, "h": 29}, {"x": 3, "y": 114, "w": 48, "h": 33}, {"x": 73, "y": 131, "w": 16, "h": 16}, {"x": 127, "y": 127, "w": 16, "h": 20}, {"x": 177, "y": 122, "w": 23, "h": 25}, {"x": 233, "y": 128, "w": 19, "h": 19}, {"x": 20, "y": 183, "w": 13, "h": 13}, {"x": 75, "y": 184, "w": 12, "h": 12}, {"x": 128, "y": 183, "w": 13, "h": 13}, {"x": 182, "y": 184, "w": 13, "h": 12}];
// Os 4 primeiros índices de FRAMES_EFFECTS são bolhas pequenas (ideais pra efeito ambiente contínuo)
const BUBBLE_FRAME_INDICES = [0, 1, 2, 3, 5, 6, 15, 16, 17, 18];
// Árvores individuais reais, recortadas de assets/river/bg_trees_sparse.png (retângulos reais de
// cada pé/grupo de árvore na imagem) — usadas tanto no fundo quanto nas árvores plantadas pelo jogador.
const FRAMES_TREES = [{"x": 1, "y": 0, "w": 43, "h": 47}, {"x": 46, "y": 0, "w": 43, "h": 47}, {"x": 87, "y": 0, "w": 210, "h": 47}, {"x": 301, "y": 0, "w": 43, "h": 47}, {"x": 346, "y": 0, "w": 38, "h": 47}];

// Índice 2 é um grupo largo de várias árvores juntas — bom pro fundo, largo demais pra uma
// única "árvore plantada" pelo jogador, então essa fica de fora do sorteio de variante única.
const SINGLE_TREE_INDICES = [0, 1, 3, 4];
function randomTreeVariant() {
  return SINGLE_TREE_INDICES[Math.floor(Math.random() * SINGLE_TREE_INDICES.length)];
}

// Desenha um ícone real (lixo/peixe/planta/bolha) a partir de uma sheet, ancorado pelo centro-base (x,y)
function drawRiverSprite(ctx, sheetName, frames, index, x, y, targetH, opacity, flip, rotationDeg) {
  const sheet = riverSprites[sheetName];
  if (!sheet || !sheet.loaded || !frames.length) return;
  const f = frames[((index % frames.length) + frames.length) % frames.length];
  const scale = targetH / f.h;
  const w = f.w * scale, h = f.h * scale;
  ctx.save();
  ctx.globalAlpha = opacity !== undefined ? opacity : 1;
  ctx.imageSmoothingEnabled = true;
  ctx.translate(x, y);
  if (rotationDeg) ctx.rotate(rotationDeg * Math.PI / 180);
  if (flip) ctx.scale(-1, 1);
  ctx.drawImage(sheet.img, f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
  ctx.restore();
}

// Desenha uma camada de fundo real (floresta/árvores/chão/rochas/nuvens) repetida horizontalmente
// até cobrir toda a largura, ancorada pela borda de baixo (baselineY) — com deriva horizontal
// contínua opcional (scrollSpeed) pra dar sensação de paralaxe/vida sem repetir estático.
function drawTiledStrip(ctx, sheetName, canvasWidth, baselineY, displayH, opacity, scrollSpeed, timeInCycle) {
  const sheet = riverSprites[sheetName];
  if (!sheet || !sheet.loaded) return;
  const scale = displayH / sheet.img.height;
  const tileW = sheet.img.width * scale;
  const scroll = scrollSpeed ? ((timeInCycle * scrollSpeed) % tileW + tileW) % tileW : 0;
  const y = baselineY - displayH;
  ctx.save();
  ctx.globalAlpha = opacity !== undefined ? opacity : 1;
  for (let x = -tileW + scroll; x < canvasWidth + tileW; x += tileW) {
    ctx.drawImage(sheet.img, x, y, tileW, displayH);
  }
  ctx.restore();
}

const actionMessages = {
  tree: [
    "🌱 As árvores protegem o rio!",
    "🌲 Mais vida para o ecossistema!",
    "🍃 A natureza está agradecendo!",
    "🌳 Árvores = Ar puro e rio limpo!",
    "🌿 Cada árvore salva vidas aquáticas!"
  ],
  clean: [
    "🧹 O rio fica mais limpo a cada ação!",
    "✨ Lixo removido com sucesso!",
    "🌊 Água cristalina voltando!",
    "🗑️ Comunidade unida pela limpeza!",
    "💧 Rio respira alívio!"
  ],
  recycle: [
    "♻️ Reciclagem = Respeito à natureza!",
    "🔄 Menos lixo, mais esperança!",
    "📦 Consumo consciente salva rios!",
    "🌍 Cada reciclagem importa!",
    "💚 Reutilizar é amar o planeta!"
  ],
  factory: [
    "🚨 Fiscalização em ação!",
    "⚖️ Responsabilidade industrial!",
    "🔍 Poluição sob controle!",
    "✅ Fábrica regulamentada!",
    "🛡️ Rio protegido da industria!"
  ],
  sanitation: [
    "🚰 Nova rede de esgoto conectada!",
    "🏗️ Estação de tratamento em obras!",
    "🔧 Menos esgoto cru chegando ao rio!",
    "🚿 Saneamento transformando a cidade!"
  ]
};

// Sistema de desbloqueio progressivo de ações (define também os atos)
const actionUnlock = {
  clean: 1,
  tree: 3,
  recycle: 5,
  factory: 7,
  sanitation: 10,
  psa: 13
};

const unlockInfo = {
  clean: {
    icon: '🗑️', title: 'Limpar o Rio',
    description: 'Essa é sua ação mais direta: remover o lixo visível da água. Faz efeito rápido (1 dia) ' +
      'e está sempre disponível — use-a sempre que puder como sua base de trabalho diário.'
  },
  tree: {
    icon: '🌳', title: 'Plantar Árvores',
    description: 'As raízes da mata ciliar seguram o solo das margens e filtram nutrientes e produtos ' +
      'químicos antes que cheguem à água. O efeito demora 3 dias para amadurecer, mas é duradouro.'
  },
  recycle: {
    icon: '♻️', title: 'Campanha de Reciclagem',
    description: 'Educar a comunidade reduz a quantidade de lixo que chega ao rio no futuro. ' +
      'O efeito leva 2 dias e fica ainda mais forte quando a população se engaja em conjunto.'
  },
  factory: {
    icon: '🏭', title: 'Fiscalizar Fábrica',
    description: 'Fiscalizar a indústria local não limpa o rio na hora, mas reduz o estrago de futuros ' +
      'vazamentos químicos. Pense nela como um seguro contra os piores eventos aleatórios.'
  },
  sanitation: {
    icon: '🚰', title: 'Rede de Esgoto e Estação de Tratamento',
    description: 'A maior causa da poluição em rios urbanos é o esgoto que chega sem tratamento. ' +
      'Construir e conectar redes de esgoto a uma estação de tratamento é caro e demorado (4 dias), ' +
      'mas é a intervenção mais estrutural que existe — bem-vindo ao Ato 2.'
  },
  psa: {
    icon: '💧', title: 'Proteção de Nascentes (PSA)',
    description: 'Você firma um programa de Pagamento por Serviços Ambientais: proprietários rurais ' +
      'são remunerados para conservar as nascentes e a mata ciliar no início do rio. É uma ação única ' +
      'e definitiva — a partir de agora, o rio perde qualidade bem mais devagar entre um dia e outro.'
  }
};

let unlockQueue = [];
let unlockCountdownInterval = null;
let hasSeenIntro = false;

// Marcos narrativos por qualidade (mostrados na caixa de diálogo)
const milestones = [
  { threshold: 25, message: "🐛 Alguns insetos aquáticos resistentes voltaram a aparecer nas margens.", color: "#88ff44" },
  { threshold: 50, message: "🐟 Peixes pequenos foram avistados! O rio começa a respirar de novo.", color: "#00ff88" },
  { threshold: 75, message: "🚶 Moradores voltaram a caminhar e sentar nas margens do rio.", color: "#4fc3f7" },
  { threshold: 95, message: "🌅 A água está quase cristalina. Falta muito pouco!", color: "#ffd23f" }
];

// Atos da história (definidos pelos dias em que novas ações aparecem)
function getActForDay(d) {
  if (d < actionUnlock.sanitation) return { n: 1, name: "Ato 1: Mobilização" };
  if (d < 17) return { n: 2, name: "Ato 2: Intervenção Estrutural" };
  return { n: 3, name: "Ato 3: Consolidação Ecológica" };
}

function checkActChange() {
  const act = getActForDay(day);
  document.getElementById('act-label').textContent = act.name;
  if (act.n !== currentAct) {
    currentAct = act.n;
    if (act.n === 2) showMessage("📖 Ato 2 começa: agora dá pra atacar a causa estrutural da poluição.", "#5aa9e6");
    if (act.n === 3) showMessage("📖 Ato 3 começa: hora de proteger o que foi conquistado.", "#34d1c6");
  }
}

function checkMilestones() {
  const percent = (quality / QUALITY_TARGET) * 100;
  milestones.forEach(m => {
    if (percent >= m.threshold && !shownMilestones.has(m.threshold)) {
      shownMilestones.add(m.threshold);
      showMessage(m.message, m.color);
    }
  });
}

function dailyDecay() {
  return psaActive ? 1 : 3;
}

// ==================== SOM (Web Audio API) ====================
function playSound(type) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;
    const presets = {
      action:  { freq: 520,  dur: 0.12, type: 'sine',   vol: 0.08 },
      good:    { freq: 660,  dur: 0.18, type: 'sine',   vol: 0.1  },
      bad:     { freq: 180,  dur: 0.28, type: 'sawtooth', vol: 0.07 },
      victory: { freq: 880,  dur: 0.35, type: 'triangle', vol: 0.12 },
      day:     { freq: 440,  dur: 0.08, type: 'sine',   vol: 0.06 },
    };
    const p = presets[type] || presets.action;
    osc.type = p.type;
    osc.frequency.setValueAtTime(p.freq, now);
    if (type === 'victory') osc.frequency.exponentialRampToValueAtTime(1320, now + p.dur);
    gain.gain.setValueAtTime(p.vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + p.dur);
    osc.start(now);
    osc.stop(now + p.dur);
  } catch (_) { /* áudio indisponível */ }
}

// ==================== LIBRAS (VLibras) ====================
function updateLibrasWidget() {
  const widget = document.getElementById('vlibras-widget');
  if (widget) widget.style.display = librasEnabled ? '' : 'none';
}

function hasActionProtection(type) {
  return appliedActions.has(type) || pendingActions.some(a => a.type === type);
}

function hasActionBonus(type) {
  if (type === 'tree') {
    return appliedActions.has('tree') || plantedTrees.length > 0 ||
      pendingActions.some(a => a.type === 'tree');
  }
  return appliedActions.has(type) || pendingActions.some(a => a.type === type);
}

function applyQualityChange(delta) {
  quality = Math.max(0, Math.min(QUALITY_TARGET, quality + delta));
}

function resetGameState() {
  quality = 24;
  points = 0;
  day = 1;
  pendingActions = [];
  appliedActions = new Set();
  plantedTrees = [];
  visualEffects = [];
  screenFlash = null;
  psaActive = false;
  currentAct = 1;
  shownMilestones = new Set();
  activeEvents = [];
  unlockQueue = [];
  hasSeenIntro = false;
  dayTransitionInProgress = false;
  clearInterval(unlockCountdownInterval);
  unlockCountdownInterval = null;
  Object.values(actionCooldowns).forEach(c => { c.lastUsed = 0; });
  document.getElementById('action-unlock-modal').classList.remove('active');
  document.getElementById('day-transition-overlay').classList.remove('active');
  document.getElementById('btn-end-turn').disabled = false;
  document.querySelectorAll('.action-btn').forEach(btn => btn.classList.remove('psa-done'));
  canvasStartTime = Date.now();
  updateUI();
  updateActionButtons();
  checkActChange();
}

function getTimeInCycle() {
  const elapsed = Date.now() - canvasStartTime;
  return (elapsed % CYCLE_DURATION) / 1000;
}

// ==================== CENA DO RIO ====================
function drawRiverScene() {
  const canvas = document.getElementById('river-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const timeInCycle = getTimeInCycle();
  const qualityPercent = Math.max(0, Math.min(1, quality / QUALITY_TARGET)); // 0 a 1, progresso real do rio

  let phase = (timeInCycle % 180) / 180;

  let skyColor1, skyColor2;
  if (phase < 0.25) {
    const t = phase / 0.25;
    skyColor1 = lerpColor('#1a1a2e', '#87ceeb', t);
    skyColor2 = lerpColor('#0f0f1e', '#ffa500', t);
  } else if (phase < 0.5) {
    skyColor1 = '#87ceeb';
    skyColor2 = '#e0f6ff';
  } else if (phase < 0.75) {
    const t = (phase - 0.5) / 0.25;
    skyColor1 = lerpColor('#87ceeb', '#ff6b35', t);
    skyColor2 = lerpColor('#e0f6ff', '#ff9500', t);
  } else {
    const t = (phase - 0.75) / 0.25;
    skyColor1 = lerpColor('#ff6b35', '#1a1a2e', t);
    skyColor2 = lerpColor('#ff9500', '#0f0f1e', t);
  }

  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, skyColor1);
  skyGradient.addColorStop(1, skyColor2);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);

  drawClouds(ctx, width, height, timeInCycle, phase);
  drawBackgroundForest(ctx, width, height, timeInCycle);
  drawBackgroundGround(ctx, width, height);
  drawPlantedTrees(ctx, width, height);
  drawForegroundRocks(ctx, width, height);
  drawAquaticPlants(ctx, width, height, timeInCycle, qualityPercent);
  drawRiver(ctx, width, height, timeInCycle, qualityPercent);
  drawRiverFish(ctx, width, height, timeInCycle, qualityPercent);
  drawAmbientBubbles(ctx, width, height, timeInCycle, qualityPercent);
  drawFactory(ctx, width, height, timeInCycle, phase);
  drawVisualEffects(ctx, width, height, timeInCycle);

  const dayBlend = Math.sin(phase * Math.PI);
  const overlayAlpha = (1 - Math.max(0.12, dayBlend)) * 0.42;
  ctx.fillStyle = `rgba(10, 20, 40, ${overlayAlpha})`;
  ctx.fillRect(0, 0, width, height);

  drawScreenFlash(ctx, width, height);
  updateDayNightBadge(phase);

  requestAnimationFrame(drawRiverScene);
}

function updateDayNightBadge(phase) {
  const badge = document.getElementById('day-night-badge');
  if (!badge) return;
  let icon = '☀️';
  if (phase < 0.25) icon = '🌅';
  else if (phase < 0.5) icon = '☀️';
  else if (phase < 0.75) icon = '🌇';
  else icon = '🌙';
  if (badge.textContent !== icon) badge.textContent = icon;
}

// Nuvens reais (formato completo, reconstruído simetricamente), tileadas com deriva horizontal
// lenta e contínua — sem cortar nenhuma nuvem pela metade.
function drawClouds(ctx, width, height, timeInCycle, phase) {
  const sheet = riverSprites.bgClouds;
  const alpha = phase > 0.8 ? Math.max(0, (1 - phase) / 0.2) : (phase < 0.02 ? phase / 0.02 : 1);
  if (alpha <= 0) return;

  if (!sheet || !sheet.loaded) {
    // Fallback vetorial simples enquanto a sheet ainda carrega
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
    for (let i = 0; i < 4; i++) {
      const cx = ((timeInCycle * 3.5 + i * 220) % (width + 200)) - 100;
      const cy = 26 + i * 20;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.arc(cx + 16, cy - 7, 18, 0, Math.PI * 2);
      ctx.arc(cx + 34, cy, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  drawTiledStrip(ctx, 'bgClouds', width, 58, 40, alpha * 0.9, 3.2, timeInCycle);
}

// ===== Floresta de fundo real (silhueta + 3 densidades de árvores) — estática, sem deriva =====
function drawBackgroundForest(ctx, width, height, timeInCycle) {
  const sheet = riverSprites.bgForest;
  if (!sheet || !sheet.loaded) {
    // Fallback: floresta procedural simples enquanto as sheets carregam
    drawTreeLayer(ctx, width, height - 150, 26, 0.4, 101);
    drawTreeLayer(ctx, width, height - 122, 34, 0.62, 47);
    drawTreeLayer(ctx, width, height - 96, 44, 0.85, 19);
    return;
  }
  drawTiledStrip(ctx, 'bgForest', width, height - 122, 78, 0.85, 0, timeInCycle);
  drawTiledStrip(ctx, 'bgTreesDense', width, height - 118, 46, 0.9, 0, timeInCycle);
  drawTiledStrip(ctx, 'bgTreesMedium', width, height - 108, 44, 0.95, 0, timeInCycle);
  drawTiledStrip(ctx, 'bgTreesSparse', width, height - 98, 42, 1, 0, timeInCycle);
}

// ===== Chão/margem real — substitui o retângulo de grama e a faixa de barranco antigos =====
function drawBackgroundGround(ctx, width, height) {
  const sheet = riverSprites.bgGround;
  if (!sheet || !sheet.loaded) {
    // Fallback: grama plana simples enquanto a sheet carrega
    const grassY = height - 80;
    const grassGradient = ctx.createLinearGradient(0, grassY - 15, 0, grassY);
    grassGradient.addColorStop(0, '#3aa86d');
    grassGradient.addColorStop(1, '#276b45');
    ctx.fillStyle = grassGradient;
    ctx.fillRect(0, grassY - 15, width, 15);
    return;
  }
  drawTiledStrip(ctx, 'bgGround', width, height - 78, 34, 1, 0, 0);
}

// ===== Rochas e arbustos em primeiro plano, bem na beira da água =====
function drawForegroundRocks(ctx, width, height) {
  const sheet = riverSprites.bgRocks;
  if (!sheet || !sheet.loaded) return;
  drawTiledStrip(ctx, 'bgRocks', width, height - 78, 28, 1, 0, 0);
}

function drawPlantedTrees(ctx, width, height) {
  plantedTrees.forEach((tree) => {
    drawSpriteTree(ctx, tree.x, height - 78, 46, 1, tree.variant);
  });
}

// Desenha uma árvore real (ícone recortado de bg_trees_sparse.png), com fallback vetorial
// enquanto a imagem ainda não carregou.
function drawSpriteTree(ctx, x, groundY, size, opacity, variantIndex) {
  const sheet = riverSprites.bgTreesIcons;
  if (!sheet || !sheet.loaded) { drawCanopyTreeFallback(ctx, x, groundY, size / 2.6, opacity); return; }
  drawRiverSprite(ctx, 'bgTreesIcons', FRAMES_TREES, variantIndex, x, groundY, size, opacity, false, 0);
}

// Fallback vetorial simples (usado só até o sprite carregar)
function drawCanopyTreeFallback(ctx, x, groundY, radius, opacity) {
  const trunkH = radius * 1.6;
  ctx.fillStyle = `rgba(105, 74, 45, ${opacity})`;
  ctx.fillRect(x - radius * 0.18, groundY - trunkH, radius * 0.36, trunkH);
  ctx.fillStyle = `rgba(52, 130, 70, ${opacity})`;
  ctx.beginPath();
  ctx.arc(x, groundY - trunkH - radius * 0.35, radius, 0, Math.PI * 2);
  ctx.fill();
}

// Camada de floresta procedural (fallback, só usada enquanto as sheets reais não carregam)
function drawTreeLayer(ctx, width, groundY, size, opacity, seed) {
  const spacing = size * 1.05;
  const numTrees = Math.ceil(width / spacing) + 2;
  for (let i = -1; i < numTrees; i++) {
    const treeX = i * spacing + (Math.sin(i * 0.6 + seed) * spacing * 0.25);
    const s = size * (0.85 + Math.sin(i * 0.5 + seed) * 0.15);
    const variantIndex = Math.abs((i * 5 + seed) % FRAMES_TREES.length);
    drawSpriteTree(ctx, treeX, groundY, s, opacity, variantIndex);
  }
}

// ===== Plantas aquáticas reais (junco/lírios), surgem na margem conforme a qualidade sobe =====
function drawAquaticPlants(ctx, width, height, timeInCycle, qualityPercent) {
  const sheet = riverSprites.plants;
  if (!sheet || !sheet.loaded) return;

  const riverY = height - 80;
  // Quantidade de plantas cresce com a qualidade (começa a aparecer a partir de ~15%)
  const maxSlots = 14;
  const count = Math.round(Math.max(0, qualityPercent - 0.15) / 0.85 * maxSlots);
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    // Posição determinística (não pula de lugar a cada frame), espalhada pela margem
    const seed = i * 97 + 13;
    const spacing = width / maxSlots;
    const x = spacing * i + (Math.sin(seed) * spacing * 0.35) + spacing / 2;
    const sway = Math.sin(timeInCycle * 0.8 + seed) * 2; // balanço suave, dá vida à cena
    const variant = (i * 3 + 1) % FRAMES_PLANTS.length;
    const targetH = 26 + (seed % 10);
    ctx.save();
    ctx.translate(sway, 0);
    drawRiverSprite(ctx, 'plants', FRAMES_PLANTS, variant, x, riverY + 4, targetH, 0.95, i % 2 === 0);
    ctx.restore();
  }
}

// ===== Peixes reais nadando no rio, quantidade cresce com a qualidade =====
function drawRiverFish(ctx, width, height, timeInCycle, qualityPercent) {
  const sheet = riverSprites.fish;
  if (!sheet || !sheet.loaded) return;

  const riverY = height - 80;
  const riverHeight = 80;
  // Só aparecem peixes a partir de ~25% de qualidade (água já respirável)
  const maxFish = 7;
  const count = Math.round(Math.max(0, qualityPercent - 0.25) / 0.75 * maxFish);
  if (count <= 0) return;

  for (let i = 0; i < count; i++) {
    const seed = i * 53 + 7;
    const laneY = riverY + 18 + (i % 4) * 14 + Math.sin(seed) * 4;
    const speed = 28 + (seed % 20); // px/s, cada peixe com velocidade levemente diferente
    const goingRight = i % 2 === 0;
    const travel = (width + 120);
    const t = (timeInCycle * speed + (seed % travel)) % travel;
    const x = goingRight ? (t - 60) : (width - t + 60);
    const bob = Math.sin(timeInCycle * 3 + seed) * 3;
    const variant = (i * 2) % FRAMES_FISH.length;
    // Os sprites de peixe já vêm virados pra direita por padrão, então só espelhamos
    // quando o peixe está nadando pra ESQUERDA.
    drawRiverSprite(ctx, 'fish', FRAMES_FISH, variant, x, laneY + bob, 18, 0.9, !goingRight);
  }
}

// ===== Rio: base real (bg_water tileado com correnteza + leve ondulação) + tingimento pela
// qualidade + brilho animado por cima =====
function drawRiver(ctx, width, height, timeInCycle, qualityPercent) {
  const riverY = height - 80;
  const riverHeight = 80;

  const riverCleanness = quality / QUALITY_TARGET;

  let tintColor;
  if (riverCleanness > 0.70) {
    tintColor = "rgba(41,128,185,0.20)";
  } else if (riverCleanness > 0.40) {
    tintColor = "rgba(80,150,90,0.28)";
  } else {
    tintColor = "rgba(95,70,55,0.45)";
  }

  const sheet = riverSprites.bgWater;

  if (sheet && sheet.loaded) {
    const scale = riverHeight / sheet.img.height;
    const tileWidth = sheet.img.width * scale;

    // Correnteza
    const scroll = ((timeInCycle * 18) % tileWidth + tileWidth) % tileWidth;

    ctx.save();

    // Recorta somente a área do rio
    ctx.beginPath();
    ctx.rect(0, riverY, width, riverHeight);
    ctx.clip();

    // Água com pequena ondulação
    for (let x = -tileWidth + scroll; x < width + tileWidth; x += tileWidth) {
      const wave = Math.sin((x * 0.01) + (timeInCycle * 2.5)) * 2;
      ctx.drawImage(sheet.img, x, riverY + wave, tileWidth, riverHeight);
    }

    // Cor da água conforme qualidade
    ctx.fillStyle = tintColor;
    ctx.fillRect(0, riverY, width, riverHeight);

    // Brilho se movendo
    ctx.globalAlpha = 0.12;
    const shineX = ((timeInCycle * 70) % (width + 250)) - 250;
    const gradient = ctx.createLinearGradient(shineX, 0, shineX + 180, 0);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.5, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, riverY, width, riverHeight);

    // Camada animada de água (water_anim_sheet)
    const animSheet = riverSprites.bgWateranimation;
    if (animSheet && animSheet.loaded) {
      const frameCount = 4;
      const frameW = animSheet.img.width / frameCount;
      const frameH = animSheet.img.height;
      const frameIdx = Math.floor((timeInCycle * 8) % frameCount);
      const animTileW = frameW * scale;
      const animScroll = ((timeInCycle * 22) % animTileW + animTileW) % animTileW;
      ctx.globalAlpha = 0.32;
      for (let x = -animTileW + animScroll; x < width + animTileW; x += animTileW) {
        const wave = Math.sin((x * 0.01) + (timeInCycle * 2.5)) * 2;
        ctx.drawImage(animSheet.img, frameIdx * frameW, 0, frameW, frameH, x, riverY + wave, animTileW, riverHeight);
      }
      ctx.globalAlpha = 1;
    }

    ctx.restore();

  } else {
    ctx.fillStyle = "#4b6d8c";
    ctx.fillRect(0, riverY, width, riverHeight);
  }

  drawRiverPollution(ctx, width, riverY, riverHeight, riverCleanness);
}

// Bolhas ambientais no rio — quantidade e opacidade crescem com a qualidade
function drawAmbientBubbles(ctx, width, height, timeInCycle, qualityPercent) {
  const sheet = riverSprites.effects;
  if (!sheet || !sheet.loaded || qualityPercent < 0.15) return;

  const riverY = height - 80;
  const maxBubbles = Math.round(qualityPercent * 14);
  for (let i = 0; i < maxBubbles; i++) {
    const seed = i * 41 + 17;
    const x = (seed * 73) % (width - 40) + 20;
    const cycle = 4 + (seed % 3);
    const t = ((timeInCycle + seed * 0.1) % cycle) / cycle;
    const y = riverY + 68 - t * 52;
    const frameIdx = BUBBLE_FRAME_INDICES[i % BUBBLE_FRAME_INDICES.length];
    const alpha = (1 - t) * 0.5 * Math.min(1, qualityPercent * 1.2);
    drawRiverSprite(ctx, 'effects', FRAMES_EFFECTS, frameIdx, x, y, 10 + (seed % 6), alpha, false, 0);
  }
}

// Lixo real (sprites recortados da referência) boiando no rio — quantidade cai conforme o rio melhora
function drawRiverPollution(ctx, width, riverY, riverHeight, cleanness) {
  const pollutionAmount = Math.floor((1 - cleanness) * 18);
  const seed = Math.floor(quality / 10) * 10;
  const sheetReady = riverSprites.trash && riverSprites.trash.loaded;

  for (let i = 0; i < pollutionAmount; i++) {
    const rng = ((seed + i) * 73856093) ^ (((seed + i) * 19349663) << 13);
    const x = (rng % (width - 30)) + 15;
    const y = riverY + 15 + ((rng >> 16) % (riverHeight - 40));
    const rotation = (rng % 40) - 20;

    if (sheetReady) {
      const trashIndex = Math.abs(rng >> 8) % FRAMES_TRASH.length;
      const bobble = Math.sin(getTimeInCycle() * 1.6 + rng % 100) * 2; // boiando suavemente
      drawRiverSprite(ctx, 'trash', FRAMES_TRASH, trashIndex, x, y + bobble, 24, 1, (rng >> 4) % 2 === 0, rotation * 0.4);
    } else {
      // Fallback vetorial simples enquanto a sheet ainda carrega
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation * Math.PI / 180);
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
    }
  }
}

// ===== Fábrica real, na margem direita — com fumaça animada saindo das chaminés =====
function drawFactory(ctx, width, height, timeInCycle, phase) {
  const sheet = riverSprites.bgFactory;
  if (!sheet || !sheet.loaded) return;
  const targetH = 120;
  const scale = targetH / sheet.img.height;
  const w = sheet.img.width * scale;
  const baseX = width * 0.74;
  const baseY = height - 78; // mesma linha de base da margem/rio
  ctx.drawImage(sheet.img, baseX - w / 2, baseY - targetH, w, targetH);
  drawFactorySmoke(ctx, baseX, baseY - targetH, w, timeInCycle);
}

// Duas chaminés de fumaça saindo do topo da fábrica — a arte da fábrica é estática, então essa
// é a "vida" que ela ganha: bolhas de fumaça subindo e se dissipando continuamente.
function drawFactorySmoke(ctx, factoryCenterX, factoryTopY, factoryW, timeInCycle) {
  const chimneys = [
    { dx: -factoryW * 0.16, seedOffset: 0 },
    { dx: factoryW * 0.10, seedOffset: 3.1 },
  ];
  chimneys.forEach((chimney) => {
    const cx = factoryCenterX + chimney.dx;
    const cy = factoryTopY + factoryW * 0.06;
    for (let i = 0; i < 3; i++) {
      const cycle = 3.2;
      const t = ((timeInCycle + chimney.seedOffset + i * (cycle / 3)) % cycle) / cycle; // 0..1
      const riseY = cy - t * 34;
      const driftX = cx + Math.sin(t * Math.PI * 2 + chimney.seedOffset) * 6 + t * 10;
      const radius = 4 + t * 7;
      const alpha = (1 - t) * 0.35;
      ctx.fillStyle = `rgba(210, 210, 214, ${alpha})`;
      ctx.beginPath();
      ctx.arc(driftX, riseY, radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawVisualEffects(ctx, width, height, timeInCycle) {
  visualEffects = visualEffects.filter(eff => Date.now() - eff.startTime < eff.duration);

  visualEffects.forEach(eff => {
    const elapsed = Date.now() - eff.startTime;
    const progress = elapsed / eff.duration;

    if (eff.type === 'tree_planted') {
      const scale = progress * 0.8 + 0.2;
      ctx.save();
      ctx.translate(eff.x, eff.y);
      ctx.scale(scale, scale);
      ctx.translate(-eff.x, -eff.y);
      drawSpriteTree(ctx, eff.x, eff.y + 20, 40, 1 - (progress * 0.3), eff.variant || 0);
      ctx.restore();

    } else if (eff.type === 'clean_action') {
      ctx.globalAlpha = 1 - progress;
      for (let i = 0; i < 6; i++) {
        const bx = eff.x + Math.sin(i * 2 + progress * 6) * 22;
        const by = eff.y - progress * 45 - i * 6;
        ctx.fillStyle = i % 2 === 0 ? '#bdeaff' : '#4fc3f7';
        ctx.beginPath(); ctx.arc(bx, by, 4 - progress * 2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

    } else if (eff.type === 'recycle_action') {
      ctx.globalAlpha = 1 - progress;
      ctx.save();
      ctx.translate(eff.x, eff.y);
      ctx.rotate(progress * Math.PI * 2);
      ctx.font = `${18 + progress * 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('♻️', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

    } else if (eff.type === 'factory_action') {
      ctx.globalAlpha = 1 - progress;
      ctx.save();
      ctx.translate(eff.x, eff.y - progress * 20);
      ctx.font = `${20 + Math.sin(progress * Math.PI) * 8}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🛡️', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

    } else if (eff.type === 'sanitation_action') {
      ctx.globalAlpha = 1 - progress;
      ctx.save();
      ctx.translate(eff.x, eff.y - progress * 15);
      ctx.font = `${18 + progress * 6}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('🚰', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;

    } else if (eff.type === 'psa_action') {
      ctx.globalAlpha = 1 - progress;
      ctx.save();
      ctx.translate(eff.x, eff.y - progress * 30);
      ctx.font = `${22 + Math.sin(progress * Math.PI) * 10}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('💧', 0, 0);
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  });
}

function drawScreenFlash(ctx, width, height) {
  if (!screenFlash) return;
  const elapsed = Date.now() - screenFlash.startTime;
  if (elapsed >= screenFlash.duration) { screenFlash = null; return; }
  const progress = elapsed / screenFlash.duration;
  const alpha = (1 - progress) * 0.28;
  ctx.fillStyle = screenFlash.color;
  ctx.globalAlpha = alpha;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

function addVisualEffect(type, x, y, duration = 1000, extra = {}) {
  visualEffects.push({ type, x, y, startTime: Date.now(), duration, ...extra });
}

function triggerScreenFlash(color, duration = 900) {
  screenFlash = { color, startTime: Date.now(), duration };
}

function lerpColor(color1, color2, t) {
  const c1 = hexToRgb(color1), c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : { r: 0, g: 0, b: 0 };
}

function updateBackgroundByTime() {
  const canvas = document.getElementById('river-canvas');
  if (canvas) canvasStartTime = Date.now();
}

const actionCooldowns = {
  tree: { lastUsed: 0, cooldown: 4 },
  clean: { lastUsed: 0, cooldown: 2 },
  recycle: { lastUsed: 0, cooldown: 3 },
  factory: { lastUsed: 0, cooldown: 4 },
  sanitation: { lastUsed: 0, cooldown: 6 },
  psa: { lastUsed: 0, cooldown: 9999 }
};

const qualityBar = document.getElementById('quality-bar');
const qualityText = document.getElementById('quality-text');
const pointsEl = document.getElementById('points');
const dayEl = document.getElementById('day');
const messageEl = document.getElementById('speech-bubble');
const dialogueBoxEl = document.getElementById('dialogue-box');
const settingsModal = document.getElementById('settings-modal');

function updateUI() {
  const qualityPercent = (quality / QUALITY_TARGET) * 100;
  const clamped = Math.max(0, Math.min(100, qualityPercent));
  qualityBar.style.width = clamped + '%';
  qualityText.textContent = Math.round(clamped) + '%';
  pointsEl.textContent = points;
  dayEl.textContent = day;

  if (clamped <= 20) qualityBar.classList.add('critical');
  else qualityBar.classList.remove('critical');
}

function showMessage(text, color = "#eaf6ff") {
  if (!text) return;
  messageEl.textContent = text;
  messageEl.style.color = color;
  dialogueBoxEl.classList.remove('flash');
  void dialogueBoxEl.offsetWidth;
  dialogueBoxEl.classList.add('flash');
}

function isActionUnlocked(type) {
  return day >= actionUnlock[type];
}

function addPendingAction(type, value, days) {
  pendingActions.push({ type, value, daysLeft: days });

  const messages = actionMessages[type] || [];
  const message = messages[Math.floor(Math.random() * messages.length)];

  if (type === 'tree') {
    const treeX = 100 + Math.random() * 400;
    const variant = randomTreeVariant();
    plantedTrees.push({ x: treeX, variant });
    addVisualEffect('tree_planted', treeX, 180, 1500, { variant });
  } else if (type === 'clean') {
    addVisualEffect('clean_action', 200 + Math.random() * 250, 210, 1200);
  } else if (type === 'recycle') {
    addVisualEffect('recycle_action', 150 + Math.random() * 300, 150, 1300);
  } else if (type === 'factory') {
    addVisualEffect('factory_action', 600, 100, 1400);
  } else if (type === 'sanitation') {
    addVisualEffect('sanitation_action', 350, 190, 1400);
  }

  showMessage(`${message}\n⏳ Efeito em ${days} dia(s)`, "#22ff88");
}

function processPendingActions() {
  for (let i = pendingActions.length - 1; i >= 0; i--) {
    const action = pendingActions[i];
    action.daysLeft--;
    if (action.daysLeft <= 0) {
      quality = Math.min(QUALITY_TARGET, quality + action.value);
      appliedActions.add(action.type);
      pendingActions.splice(i, 1);
    }
  }
}

function triggerRandomEvent() {
  processActiveEvents();

  const eventChance = 0.35;
  if (Math.random() < eventChance) {
    const rng = Math.random();
    let event = null;

    if (rng < 0.25) {
      event = { name: "🌧️ Chuva Torrencial", message: "O rio transborda! Natureza se renovando...", effect: 18 + Math.random() * 12, color: "#44ccff", duration: 1 };
    } else if (rng < 0.40) {
      event = { name: "🏭 Vazamento Industrial", message: "ALERTA! Fábrica despejou químicos no rio!", effect: -(20 + Math.random() * 15), color: "#ff6644", duration: 2, blocked_by: "factory" };
    } else if (rng < 0.55) {
      event = { name: "⚠️ Contaminação Grave", message: "Vazamento tóxico detectado! Qualidade caindo!", effect: -(30 + Math.random() * 20), color: "#ff0000", duration: 3, blocked_by: "factory" };
    } else if (rng < 0.70) {
      event = { name: "🐟 Retorno da Vida", message: "Peixes voltaram! O rio está melhorando!", effect: 15 + Math.random() * 10, color: "#00ff88", duration: 1 };
    } else if (rng < 0.85) {
      event = { name: "🌱 Crescimento Natural", message: "Árvores e plantas florescendo na margem!", effect: 12 + Math.random() * 8, color: "#88ff44", duration: 1, bonus_if: "tree" };
    } else {
      event = { name: "♻️ Comunidade Engajada", message: "Cidadãos limparam o rio juntos!", effect: 16 + Math.random() * 10, color: "#ffaa00", duration: 1, bonus_if: "recycle" };
    }

    triggerEvent(event);
  }
}

function triggerEvent(event) {
  let finalEffect = event.effect;
  let finalMsg = event.message;

  if (event.bonus_if && hasActionBonus(event.bonus_if)) {
    finalEffect *= 1.3;
    finalMsg += " (Ação complementar!)";
  }
  if (event.blocked_by && hasActionProtection(event.blocked_by)) {
    finalEffect *= 0.5;
    finalMsg += " (Parcialmente evitado!)";
  }

  const dailyEffect = finalEffect / event.duration;
  applyQualityChange(dailyEffect);
  showMessage(finalMsg, event.color);
  triggerScreenFlash(finalEffect < 0 ? '#ff2d2d' : event.color);
  playSound(finalEffect < 0 ? 'bad' : 'good');

  if (event.duration > 1) {
    activeEvents.push({
      dailyEffect,
      daysLeft: event.duration - 1,
      message: event.name,
      color: event.color
    });
  }
}

function processActiveEvents() {
  for (let i = activeEvents.length - 1; i >= 0; i--) {
    const evt = activeEvents[i];
    if (evt.daysLeft > 0) {
      applyQualityChange(evt.dailyEffect);
      showMessage(`${evt.message} (continua...)`, evt.color);
      playSound(evt.dailyEffect < 0 ? 'bad' : 'good');
      evt.daysLeft--;
    }
    if (evt.daysLeft <= 0) activeEvents.splice(i, 1);
  }
}

function showVictoryScreen() {
  playSound('victory');
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-victory').classList.add('active');
  document.getElementById('final-quality').textContent = Math.round((quality / QUALITY_TARGET) * 100) + "%";
  document.getElementById('final-points').textContent = points;
  document.getElementById('final-days').textContent = day;
}

function showGameOverScreen() {
  playSound('bad');
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-gameover').classList.add('active');
  document.getElementById('go-final-days').textContent = day;
  document.getElementById('go-final-points').textContent = points;
}

// ==================== MODAL DE AÇÃO DESBLOQUEADA ====================
function queueUnlockModal(type) {
  unlockQueue.push(type);
  const modal = document.getElementById('action-unlock-modal');
  if (!modal.classList.contains('active')) showNextUnlockModal();
}

function showNextUnlockModal() {
  if (unlockQueue.length === 0) return;
  const type = unlockQueue.shift();
  const info = unlockInfo[type];
  if (!info) { showNextUnlockModal(); return; }

  document.getElementById('unlock-icon').textContent = info.icon;
  document.getElementById('unlock-title').textContent = `Nova ação: ${info.title}`;
  document.getElementById('unlock-description').textContent = info.description;

  const modal = document.getElementById('action-unlock-modal');
  const btn = document.getElementById('btn-unlock-ok');
  modal.classList.add('active');

  let secondsLeft = 5;
  btn.disabled = true;
  btn.textContent = `Aguarde... (${secondsLeft})`;

  clearInterval(unlockCountdownInterval);
  unlockCountdownInterval = setInterval(() => {
    secondsLeft--;
    if (secondsLeft <= 0) {
      clearInterval(unlockCountdownInterval);
      btn.disabled = false;
      btn.textContent = 'OK, entendi!';
    } else {
      btn.textContent = `Aguarde... (${secondsLeft})`;
    }
  }, 1000);
}

document.getElementById('btn-unlock-ok').addEventListener('click', () => {
  document.getElementById('action-unlock-modal').classList.remove('active');
  showNextUnlockModal();
});

// ==================== TRANSIÇÃO DE DIA ====================
function startDayTransition() {
  if (dayTransitionInProgress) return;
  dayTransitionInProgress = true;
  playSound('day');
  document.getElementById('btn-end-turn').disabled = true;
  document.getElementById('day-transition-overlay').classList.add('active');

  setTimeout(resolveDayTransition, 2400);
}

function resolveDayTransition() {
  day++;
  processPendingActions();
  quality = Math.max(0, quality - dailyDecay());
  triggerRandomEvent();
  updateUI();
  updateBackgroundByTime();
  updateActionButtons();
  checkActChange();
  checkMilestones();

  document.getElementById('day-transition-overlay').classList.remove('active');
  document.getElementById('btn-end-turn').disabled = false;
  dayTransitionInProgress = false;

  Object.keys(actionUnlock).forEach(type => {
    if (type !== 'clean' && day === actionUnlock[type]) queueUnlockModal(type);
  });

  if (quality <= 0) { setTimeout(showGameOverScreen, 400); return; }
  if (quality >= QUALITY_TARGET) setTimeout(showVictoryScreen, 500);
}

// ==================== EVENT LISTENERS ====================
document.getElementById('btn-end-turn').addEventListener('click', startDayTransition);

document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);

    if (!isActionUnlocked(type)) {
      showMessage(`🔒 Ação desbloqueada no dia ${actionUnlock[type]}!`, "#ff9900");
      return;
    }

    // Proteção de Nascentes: ação única e permanente
    if (type === 'psa') {
      if (psaActive) return;
      psaActive = true;
      appliedActions.add('psa');
      quality = Math.min(QUALITY_TARGET, quality + value);
      points += value * 2;
      addVisualEffect('psa_action', 200, 150, 1600);
      showMessage('💧 Nascentes protegidas! A partir de agora o rio degrada bem mais devagar.', '#34d1c6');
      playSound('good');
      updateUI();
      updateActionButtons();
      return;
    }

    const cooldownInfo = actionCooldowns[type];
    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;

    if (daysUntilAvailable > 0) {
      showMessage(`⏳ Espere ${daysUntilAvailable} dia(s)\npara usar essa ação!`, "#ff9900");
      return;
    }

    if (type === 'tree') addPendingAction('tree', value, 3);
    else if (type === 'clean') addPendingAction('clean', value, 1);
    else if (type === 'recycle') addPendingAction('recycle', value, 2);
    else if (type === 'factory') addPendingAction('factory', value, 2);
    else if (type === 'sanitation') addPendingAction('sanitation', value, 4);

    cooldownInfo.lastUsed = day;
    points += Math.abs(value) * 2;
    playSound('action');
    updateUI();
    updateActionButtons();
  });
});

function openSettings() { settingsModal.classList.add('active'); }
function closeSettings() { settingsModal.classList.remove('active'); }

document.getElementById('btn-settings-start').addEventListener('click', openSettings);
document.getElementById('btn-settings-game').addEventListener('click', openSettings);
document.getElementById('btn-close-settings').addEventListener('click', closeSettings);

document.getElementById('btn-sound').addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  document.getElementById('btn-sound').textContent = soundEnabled ? "🔊 Ligado" : "🔇 Desligado";
  if (soundEnabled) playSound('action');
});

document.getElementById('btn-libras').addEventListener('click', () => {
  librasEnabled = !librasEnabled;
  document.getElementById('btn-libras').textContent = librasEnabled ? "✅ Ativado" : "❌ Desativado";
  updateLibrasWidget();
});

document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  checkActChange();

  if (!hasSeenIntro) {
    hasSeenIntro = true;
    queueUnlockModal('clean');
  }
});

document.getElementById('btn-howto').addEventListener('click', () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-howto').classList.add('active');
});

document.getElementById('btn-start-from-howto').addEventListener('click', () => {
  document.getElementById('screen-howto').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
  checkActChange();
  if (!hasSeenIntro) {
    hasSeenIntro = true;
    queueUnlockModal('clean');
  }
});

document.getElementById('btn-back').addEventListener('click', () => {
  document.getElementById('screen-howto').classList.remove('active');
  document.getElementById('screen-start').classList.add('active');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
  if (confirm("Voltar ao menu? Progresso será perdido.")) {
    resetGameState();
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-victory').classList.remove('active');
    document.getElementById('screen-gameover').classList.remove('active');
    document.getElementById('screen-start').classList.add('active');
  }
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());
document.getElementById('btn-retry').addEventListener('click', () => location.reload());

window.addEventListener('load', () => {
  drawRiverScene();
  updateUI();
  updateActionButtons();
  updateLibrasWidget();

  const cleanBtn = document.querySelector('.action-btn[data-type="clean"]');
  if (cleanBtn) {
    cleanBtn.disabled = false;
    cleanBtn.style.opacity = '1';
    cleanBtn.style.cursor = 'pointer';
    cleanBtn.style.filter = 'none';
  }
});

function updateActionButtons() {
  document.querySelectorAll('.action-btn').forEach(btn => {
    const type = btn.dataset.type;
    const small = btn.querySelector('small');

    if (type === 'psa' && psaActive) {
      btn.disabled = true;
      btn.classList.add('psa-done');
      btn.style.opacity = '1';
      btn.style.filter = 'none';
      if (small) small.textContent = 'Nascentes protegidas';
      return;
    }

    const cooldownInfo = actionCooldowns[type];
    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;

    if (!isActionUnlocked(type)) {
      btn.disabled = true;
      btn.style.opacity = '0.55';
      btn.style.cursor = 'not-allowed';
      btn.style.filter = 'grayscale(0.6)';
      if (small) small.textContent = `Desbloqueada no dia ${actionUnlock[type]}`;

    } else if (type !== 'psa' && daysUntilAvailable > 0) {
      btn.disabled = true;
      btn.style.opacity = '0.6';
      btn.style.cursor = 'not-allowed';
      btn.style.filter = 'grayscale(0.25)';
      if (small) small.textContent = `Recarregando: ${daysUntilAvailable} dia(s)`;

    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.filter = 'none';

      const pointsVal = btn.dataset.points;
      if (small) {
        if (type === 'psa') {
          small.textContent = 'Ação única';
        } else {
          let daysText = '';
          switch (type) {
            case 'clean':      daysText = '1 dia'; break;
            case 'tree':       daysText = '3 dias'; break;
            case 'recycle':    daysText = '2 dias'; break;
            case 'factory':    daysText = '2 dias'; break;
            case 'sanitation': daysText = '4 dias'; break;
          }
          small.textContent = `+${pointsVal} (${daysText})`;
        }
      }
    }
  });
}
