let quality = 25; // Começar mais baixo
let points = 0;
let day = 1;
const QUALITY_TARGET = 200; // Aumentado para tornar o jogo mais longo
let pendingActions = [];
let soundEnabled = true;
let librasEnabled = true;
let activeEvents = [];
let eventSequence = [];
let dayStreak = 0;

// ==================== CANVAS RENDERING ====================
let canvasStartTime = Date.now();
const CYCLE_DURATION = 180000; // 3 minutos = 180 segundos

let plantedTrees = [];
let visualEffects = [];
let screenFlash = null;

// Mensagens contextualizadas por ação
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
  ]
};

// Sistema de desbloqueio progressivo de ações
const actionUnlock = {
  clean: 1,
  tree: 3,
  recycle: 5,
  factory: 7
};

// Explicações mostradas quando uma ação é desbloqueada
const unlockInfo = {
  clean: {
    icon: '🗑️',
    title: 'Limpar o Rio',
    description: 'Essa é sua ação mais direta: remover o lixo visível da água. Faz efeito rápido (1 dia) ' +
      'e está sempre disponível — use-a sempre que puder como sua base de trabalho diário.'
  },
  tree: {
    icon: '🌳',
    title: 'Plantar Árvores',
    description: 'As raízes das árvores seguram o solo das margens e evitam que sedimento e lama caiam no rio. ' +
      'O efeito demora 3 dias para amadurecer, mas é duradouro e ajuda o rio a se recuperar sozinho com o tempo.'
  },
  recycle: {
    icon: '♻️',
    title: 'Campanha de Reciclagem',
    description: 'Educar a comunidade reduz a quantidade de lixo que chega ao rio no futuro. ' +
      'O efeito leva 2 dias e fica ainda mais forte quando a população se engaja em conjunto.'
  },
  factory: {
    icon: '🏭',
    title: 'Fiscalizar Fábrica',
    description: 'Fiscalizar a indústria local não limpa o rio na hora, mas reduz o estrago de futuros ' +
      'vazamentos químicos. Pense nela como um seguro contra os piores eventos aleatórios.'
  }
};

let unlockQueue = [];
let unlockCountdownInterval = null;
let hasSeenIntro = false;

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

  let phase = (timeInCycle % 180) / 180; // 0 a 1

  // ===== CÉU =====
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
  drawHills(ctx, width, height, phase);
  drawForest(ctx, width, height, phase);
  drawGrass(ctx, width, height);
  drawRiverBank(ctx, width, height);
  drawPlantedTrees(ctx, width, height);
  drawRiver(ctx, width, height, timeInCycle);
  drawFactory(ctx, width, height, timeInCycle, phase);
  drawVisualEffects(ctx, width, height, timeInCycle);

  // Tingimento noturno suave (preserva cor em vez de escurecer tudo pra preto)
  const dayBlend = Math.sin(phase * Math.PI); // 0 nas bordas, 1 ao meio-dia
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

function drawClouds(ctx, width, height, timeInCycle, phase) {
  if (phase > 0.8 || phase < 0.02) return; // sem nuvens visíveis à noite fechada
  const alpha = phase > 0.7 ? Math.max(0, (0.8 - phase) / 0.1) * 0.5 : 0.5;
  if (alpha <= 0) return;
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let i = 0; i < 4; i++) {
    const cx = ((timeInCycle * 3.5 + i * 220) % (width + 200)) - 100;
    const cy = 26 + i * 20;
    drawCloudShape(ctx, cx, cy);
  }
}

function drawCloudShape(ctx, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, Math.PI * 2);
  ctx.arc(x + 16, y - 7, 18, 0, Math.PI * 2);
  ctx.arc(x + 34, y, 14, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, width, height, phase) {
  const hillY = height - 172;
  const isNight = phase > 0.78 || phase < 0.03;
  ctx.fillStyle = isNight ? 'rgba(26,40,58,0.6)' : 'rgba(68,108,88,0.55)';
  ctx.beginPath();
  ctx.moveTo(0, height - 158);
  for (let x = 0; x <= width; x += 30) {
    const hy = hillY + Math.sin(x * 0.01) * 16;
    ctx.lineTo(x, hy);
  }
  ctx.lineTo(width, height - 158);
  ctx.closePath();
  ctx.fill();
}

function drawGrass(ctx, width, height) {
  const grassY = height - 80;
  const grassGradient = ctx.createLinearGradient(0, grassY - 15, 0, grassY);
  grassGradient.addColorStop(0, '#3aa86d');
  grassGradient.addColorStop(1, '#276b45');
  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, grassY - 15, width, 15);

  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < width; i += 8) {
    ctx.fillRect(i, grassY - 12, 2, 6);
  }
}

function drawRiverBank(ctx, width, height) {
  const riverY = height - 80;
  ctx.fillStyle = '#7a6a4f';
  ctx.fillRect(0, riverY - 5, width, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, riverY, width, 3);
}

// Árvores plantadas pelo jogador (canopy redonda)
function drawPlantedTrees(ctx, width, height) {
  plantedTrees.forEach((tree) => {
    drawCanopyTree(ctx, tree.x, height - 92, 16, 1);
  });
}

// Estilo único de árvore (copa redonda em camadas) usado tanto na floresta
// de fundo quanto nas árvores plantadas, pra manter tudo visualmente coeso.
function drawCanopyTree(ctx, x, groundY, radius, opacity) {
  const trunkH = radius * 1.6;
  ctx.fillStyle = `rgba(105, 74, 45, ${opacity})`;
  ctx.fillRect(x - radius * 0.18, groundY - trunkH, radius * 0.36, trunkH);

  const canopyY = groundY - trunkH - radius * 0.35;

  ctx.fillStyle = `rgba(30, 92, 48, ${opacity})`;
  ctx.beginPath();
  ctx.arc(x, canopyY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(52, 130, 70, ${opacity})`;
  ctx.beginPath();
  ctx.arc(x - radius * 0.45, canopyY + radius * 0.25, radius * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + radius * 0.45, canopyY + radius * 0.25, radius * 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(74, 156, 92, ${opacity * 0.9})`;
  ctx.beginPath();
  ctx.arc(x - radius * 0.2, canopyY - radius * 0.25, radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
}

function drawForest(ctx, width, height, phase) {
  drawTreeLayer(ctx, width, height - 148, 11, 0.35);
  drawTreeLayer(ctx, width, height - 118, 14, 0.55);
  drawTreeLayer(ctx, width, height - 96, 17, 0.78);
  drawUndergrowth(ctx, width, height);
}

function drawTreeLayer(ctx, width, groundY, radius, opacity) {
  const spacing = radius * 2.6;
  const numTrees = Math.ceil(width / spacing) + 2;
  for (let i = -1; i < numTrees; i++) {
    const treeX = i * spacing + (Math.sin(i * 0.6) * spacing * 0.2);
    const r = radius * (0.85 + Math.sin(i * 0.5) * 0.15);
    drawCanopyTree(ctx, treeX, groundY, r, opacity);
  }
}

function drawUndergrowth(ctx, width, height) {
  const grassY = height - 95;

  ctx.fillStyle = 'rgba(45, 90, 55, 0.7)';
  for (let i = 0; i < width; i += 60) {
    ctx.beginPath();
    ctx.arc(i + 20, grassY - 6, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(i + 40, grassY - 8, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(210, 70, 120, 0.55)';
  for (let i = 0; i < width; i += 80) {
    ctx.beginPath();
    ctx.arc(i + 30, grassY - 4, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(i + 50, grassY - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRiver(ctx, width, height, timeInCycle) {
  const riverY = height - 80;
  const riverHeight = 80;

  ctx.beginPath();
  ctx.moveTo(0, riverY);

  const waveAmplitude = 8;
  const waveFrequency = 0.02;
  const waveSpeed = timeInCycle * 2;

  for (let x = 0; x <= width; x += 5) {
    const waveY = Math.sin((x * waveFrequency) + waveSpeed) * waveAmplitude;
    ctx.lineTo(x, riverY + waveY);
  }

  ctx.lineTo(width, riverY + riverHeight);
  ctx.lineTo(0, riverY + riverHeight);
  ctx.closePath();

  const riverCleanness = quality / 100;
  let riverColor1, riverColor2;

  if (riverCleanness > 0.7) {
    riverColor1 = '#2980b9';
    riverColor2 = '#1a5276';
  } else if (riverCleanness > 0.4) {
    riverColor1 = '#4a7c3f';
    riverColor2 = '#2d5a2d';
  } else {
    riverColor1 = '#5d4037';
    riverColor2 = '#3e2723';
  }

  const riverGradient = ctx.createLinearGradient(0, riverY, 0, riverY + riverHeight);
  riverGradient.addColorStop(0, riverColor1);
  riverGradient.addColorStop(1, riverColor2);
  ctx.fillStyle = riverGradient;
  ctx.fill();

  drawRiverPollution(ctx, width, riverY, riverHeight, riverCleanness);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRiverPollution(ctx, width, riverY, riverHeight, cleanness) {
  const pollutionAmount = Math.floor((1 - cleanness) * 18);
  const seed = Math.floor(quality / 10) * 10;

  for (let i = 0; i < pollutionAmount; i++) {
    const rng = ((seed + i) * 73856093) ^ (((seed + i) * 19349663) << 13);
    const x = (rng % (width - 30)) + 15;
    const y = riverY + 15 + ((rng >> 16) % (riverHeight - 40));

    const trashType = (rng >> 8) % 5;
    const rotation = (rng % 40) - 20;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);

    ctx.fillStyle = '#2c2c2c';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;

    if (trashType === 0) {
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.roundRect(-6, -18, 12, 36, 4);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#81d4fa';
      ctx.fillRect(-3, -22, 6, 8);
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-4, -25, 8, 4);

    } else if (trashType === 1) {
      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.quadraticCurveTo(-18, 8, -10, 18);
      ctx.quadraticCurveTo(0, 12, 14, 16);
      ctx.quadraticCurveTo(18, 0, 10, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(6, 8);
      ctx.stroke();

    } else if (trashType === 2) {
      ctx.fillStyle = '#8d5524';
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-4, -18, 8, 6);

    } else if (trashType === 3) {
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-14, -8, 28, 16);

      ctx.fillStyle = '#607d8b';
      ctx.fillRect(-10, -12, 12, 8);
      ctx.fillRect(4, -6, 10, 10);

      ctx.fillStyle = '#ff5722';
      ctx.fillRect(-8, -4, 6, 4);

    } else {
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 14, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e1f5fe';
      ctx.fillRect(-6, -10, 12, 4);
    }

    ctx.restore();
  }
}

function drawFactory(ctx, width, height, timeInCycle, phase) {
  const factoryX = width * 0.75;
  const factoryY = height - 140;
  const factoryWidth = 80;
  const factoryHeight = 60;

  // Sombra no chão pra "grudar" a fábrica no cenário
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(factoryX + factoryWidth / 2, factoryY + factoryHeight + 3, factoryWidth / 2, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#8b7355';
  ctx.fillRect(factoryX, factoryY, factoryWidth, factoryHeight);

  ctx.fillStyle = '#3e2723';
  ctx.fillRect(factoryX + factoryWidth / 2 - 8, factoryY + factoryHeight - 18, 16, 18);

  ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillRect(factoryX + 10 + i * 20, factoryY + 10 + j * 15, 10, 8);
    }
  }

  drawChimney(ctx, factoryX + 15, factoryY - 5, timeInCycle, phase);
  drawChimney(ctx, factoryX + 40, factoryY - 8, timeInCycle, phase);
  drawChimney(ctx, factoryX + 65, factoryY - 3, timeInCycle, phase);
}

function drawChimney(ctx, x, y, timeInCycle, phase) {
  const chimneyWidth = 12;
  const chimneyHeight = 40;

  ctx.fillStyle = '#654321';
  ctx.fillRect(x - chimneyWidth / 2, y - chimneyHeight, chimneyWidth, chimneyHeight);

  const smokeIntensity = 0.6 + Math.sin(timeInCycle * 0.05) * 0.2;
  ctx.fillStyle = `rgba(150, 150, 150, ${smokeIntensity * 0.5})`;

  for (let i = 0; i < 3; i++) {
    const offsetY = (timeInCycle * 0.5 + i * 0.3) % 40;
    const offsetX = Math.sin((timeInCycle * 0.02) + i) * 8;
    ctx.beginPath();
    ctx.arc(x + offsetX, y - chimneyHeight - offsetY, 6 + i * 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ===== EFEITOS VISUAIS DE AÇÕES (todas as 4 ações) =====
function drawVisualEffects(ctx, width, height, timeInCycle) {
  visualEffects = visualEffects.filter(eff => Date.now() - eff.startTime < eff.duration);

  visualEffects.forEach(eff => {
    const elapsed = Date.now() - eff.startTime;
    const progress = elapsed / eff.duration;

    if (eff.type === 'tree_planted') {
      const scale = progress * 0.8 + 0.2;
      ctx.globalAlpha = 1 - (progress * 0.3);
      ctx.save();
      ctx.translate(eff.x, eff.y);
      ctx.scale(scale, scale);
      ctx.translate(-eff.x, -eff.y);
      drawCanopyTree(ctx, eff.x, eff.y + 10, 14, 1);
      ctx.restore();
      ctx.globalAlpha = 1;

    } else if (eff.type === 'clean_action') {
      ctx.globalAlpha = 1 - progress;
      for (let i = 0; i < 6; i++) {
        const bx = eff.x + Math.sin(i * 2 + progress * 6) * 22;
        const by = eff.y - progress * 45 - i * 6;
        ctx.fillStyle = i % 2 === 0 ? '#bdeaff' : '#4fc3f7';
        ctx.beginPath();
        ctx.arc(bx, by, 4 - progress * 2, 0, Math.PI * 2);
        ctx.fill();
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

function addVisualEffect(type, x, y, duration = 1000) {
  visualEffects.push({ type, x, y, startTime: Date.now(), duration });
}

function triggerScreenFlash(color, duration = 900) {
  screenFlash = { color, startTime: Date.now(), duration };
}

function lerpColor(color1, color2, t) {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 0, g: 0, b: 0 };
}

function updateBackgroundByTime() {
  const canvas = document.getElementById('river-canvas');
  if (canvas) canvasStartTime = Date.now();
}

const actionCooldowns = {
  tree: { lastUsed: 0, cooldown: 3, name: '🌳 Plantar Árvores' },
  clean: { lastUsed: 0, cooldown: 2, name: '🗑️ Limpar o Rio' },
  recycle: { lastUsed: 0, cooldown: 2, name: '♻️ Campanha de Reciclagem' },
  factory: { lastUsed: 0, cooldown: 4, name: '🏭 Fiscalizar Fábrica' }
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

// ===== Caixa de diálogo do Guardião (fixa, sempre visível) =====
function showMessage(text, color = "#eaf6ff") {
  if (!text) return;
  messageEl.textContent = text;
  messageEl.style.color = color;

  dialogueBoxEl.classList.remove('flash');
  void dialogueBoxEl.offsetWidth; // força reinício da animação
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
    plantedTrees.push({ x: treeX });
    addVisualEffect('tree_planted', treeX, 180, 1500);
  } else if (type === 'clean') {
    addVisualEffect('clean_action', 200 + Math.random() * 250, 210, 1200);
  } else if (type === 'recycle') {
    addVisualEffect('recycle_action', 150 + Math.random() * 300, 150, 1300);
  } else if (type === 'factory') {
    addVisualEffect('factory_action', 600, 100, 1400);
  }

  showMessage(`${message}\n⏳ Efeito em ${days} dia(s)`, "#22ff88");
}

function processPendingActions() {
  for (let i = pendingActions.length - 1; i >= 0; i--) {
    const action = pendingActions[i];
    action.daysLeft--;
    if (action.daysLeft <= 0) {
      quality = Math.min(QUALITY_TARGET, quality + action.value);
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
  activeEvents.push({ ...event, daysLeft: event.duration, id: Date.now() });

  let finalEffect = event.effect;
  let finalMsg = event.message;

  if (event.bonus_if && pendingActions.some(a => a.type === event.bonus_if)) {
    finalEffect = Math.abs(finalEffect) * 1.3;
    finalMsg += " (Ação complementar!)";
  }

  if (event.blocked_by && pendingActions.some(a => a.type === event.blocked_by)) {
    finalEffect = Math.abs(finalEffect) * 0.5;
    finalMsg += " (Parcialmente evitado!)";
  }

  quality = Math.max(0, Math.min(QUALITY_TARGET, quality + finalEffect));
  showMessage(finalMsg, event.color);
  triggerScreenFlash(finalEffect < 0 ? '#ff2d2d' : event.color);
}

function processActiveEvents() {
  for (let i = activeEvents.length - 1; i >= 0; i--) {
    const evt = activeEvents[i];
    evt.daysLeft--;
    if (evt.daysLeft <= 0) activeEvents.splice(i, 1);
  }
}

function showVictoryScreen() {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-victory').classList.add('active');
  document.getElementById('final-quality').textContent = Math.round((quality / QUALITY_TARGET) * 100) + "%";
  document.getElementById('final-points').textContent = points;
  document.getElementById('final-days').textContent = day;
}

function showGameOverScreen() {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-gameover').classList.add('active');
  document.getElementById('go-final-days').textContent = day;
  document.getElementById('go-final-points').textContent = points;
}

// ==================== MODAL DE AÇÃO DESBLOQUEADA ====================
function queueUnlockModal(type) {
  unlockQueue.push(type);
  const modal = document.getElementById('action-unlock-modal');
  if (!modal.classList.contains('active')) {
    showNextUnlockModal();
  }
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
  const modal = document.getElementById('action-unlock-modal');
  modal.classList.remove('active');
  showNextUnlockModal();
});

// ==================== EVENT LISTENERS ====================

document.getElementById('btn-end-turn').addEventListener('click', () => {
  day++;
  processPendingActions();
  quality = Math.max(0, quality - 3);
  triggerRandomEvent();
  updateUI();
  updateBackgroundByTime();
  updateActionButtons();

  Object.keys(actionUnlock).forEach(type => {
    if (type !== 'clean' && day === actionUnlock[type]) {
      queueUnlockModal(type);
    }
  });

  if (quality <= 0) {
    setTimeout(showGameOverScreen, 400);
    return;
  }
  if (quality >= QUALITY_TARGET) {
    setTimeout(showVictoryScreen, 500);
  }
});

document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);
    const cooldownInfo = actionCooldowns[type];

    if (!isActionUnlocked(type)) {
      showMessage(`🔒 Ação desbloqueada no dia ${actionUnlock[type]}!`, "#ff9900");
      return;
    }

    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;

    if (daysUntilAvailable > 0) {
      showMessage(`⏳ Espere ${daysUntilAvailable} dia(s)\npara usar essa ação!`, "#ff9900");
      return;
    }

    if (type === 'tree') addPendingAction('tree', value, 3);
    else if (type === 'clean') addPendingAction('clean', value, 1);
    else if (type === 'recycle') addPendingAction('recycle', value, 2);
    else if (type === 'factory') addPendingAction('factory', value, 2);

    cooldownInfo.lastUsed = day;
    points += Math.abs(value) * 2;
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
});

document.getElementById('btn-libras').addEventListener('click', () => {
  librasEnabled = !librasEnabled;
  document.getElementById('btn-libras').textContent = librasEnabled ? "✅ Ativado" : "❌ Desativado";
});

document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');

  if (!hasSeenIntro) {
    hasSeenIntro = true;
    queueUnlockModal('clean');
  }
});

document.getElementById('btn-howto').addEventListener('click', () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-howto').classList.add('active');
});

document.getElementById('btn-back').addEventListener('click', () => {
  document.getElementById('screen-howto').classList.remove('active');
  document.getElementById('screen-start').classList.add('active');
});

document.getElementById('btn-back-menu').addEventListener('click', () => {
  if (confirm("Voltar ao menu? Progresso será perdido.")) {
    quality = 25; points = 0; day = 1; pendingActions = []; plantedTrees = [];
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-start').classList.add('active');
    updateUI();
  }
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());
document.getElementById('btn-retry').addEventListener('click', () => location.reload());

window.addEventListener('load', () => {
  drawRiverScene();
  updateUI();
  updateActionButtons();

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
    const cooldownInfo = actionCooldowns[type];
    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;
    const small = btn.querySelector('small');

    if (!isActionUnlocked(type)) {
      btn.disabled = true;
      btn.style.opacity = '0.55';
      btn.style.cursor = 'not-allowed';
      btn.style.filter = 'grayscale(0.6)';
      if (small) small.textContent = `Desbloqueada no dia ${actionUnlock[type]}`;

    } else if (daysUntilAvailable > 0) {
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

      const points = btn.dataset.points;
      if (small) {
        let daysText = '';
        switch (type) {
          case 'clean':   daysText = '1 dia'; break;
          case 'tree':    daysText = '3 dias'; break;
          case 'recycle': daysText = '2 dias'; break;
          case 'factory': daysText = '2 dias'; break;
        }
        small.textContent = `+${points} (${daysText})`;
      }
    }
  });
}
