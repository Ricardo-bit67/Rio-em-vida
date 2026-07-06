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

// Estado das ações visuais no canvas
let plantedTrees = []; // Árvores plantadas
let visualEffects = []; // Efeitos visuais temporários

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
  clean: 1,     // Disponível desde o dia 1
  tree: 3,      // Desbloqueada no dia 3
  recycle: 5,   // Desbloqueada no dia 5
  factory: 7    // Desbloqueada no dia 7
};

function getTimeInCycle() {
  const elapsed = Date.now() - canvasStartTime;
  return (elapsed % CYCLE_DURATION) / 1000; // Retorna segundos (0-180)
}

function drawRiverScene() {
  const canvas = document.getElementById('river-canvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const timeInCycle = getTimeInCycle();
  
  // Calcular fase do dia/noite
  let phase = (timeInCycle % 180) / 180; // 0 a 1
  
  // ===== CÉUS =====
  let skyColor1, skyColor2;
  if (phase < 0.25) { // Amanhecer (0-45s)
    const t = phase / 0.25;
    skyColor1 = lerpColor('#1a1a2e', '#87ceeb', t);
    skyColor2 = lerpColor('#0f0f1e', '#ffa500', t);
  } else if (phase < 0.5) { // Dia (45-90s)
    skyColor1 = '#87ceeb';
    skyColor2 = '#e0f6ff';
  } else if (phase < 0.75) { // Entardecer (90-135s)
    const t = (phase - 0.5) / 0.25;
    skyColor1 = lerpColor('#87ceeb', '#ff6b35', t);
    skyColor2 = lerpColor('#e0f6ff', '#ff9500', t);
  } else { // Noite (135-180s)
    const t = (phase - 0.75) / 0.25;
    skyColor1 = lerpColor('#ff6b35', '#1a1a2e', t);
    skyColor2 = lerpColor('#ff9500', '#0f0f1e', t);
  }
  
  const skyGradient = ctx.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, skyColor1);
  skyGradient.addColorStop(1, skyColor2);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, width, height);
  
  // ===== FLORESTA AO FUNDO =====
  drawForest(ctx, width, height, phase);
  
  // ===== GRAMADO VERDE =====
  drawGrass(ctx, width, height);
  
  // ===== ÁRVORES PLANTADAS =====
  drawPlantedTrees(ctx, width, height);
  
  // ===== RIO COM ONDAS E POLUIÇÃO =====
  drawRiver(ctx, width, height, timeInCycle);
  
  // ===== FÁBRICA/INDÚSTRIA =====
  drawFactory(ctx, width, height, timeInCycle, phase);
  
  // ===== EFEITOS VISUAIS (animações de ações) =====
  drawVisualEffects(ctx, width, height, timeInCycle);
  
  // ===== OVERLAY DE LUZ (Efeito noite/dia) =====
  const lightIntensity = Math.sin(phase * Math.PI) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - lightIntensity})`;
  ctx.fillRect(0, 0, width, height);
  
  // Próximo frame
  requestAnimationFrame(drawRiverScene);
}

function drawGrass(ctx, width, height) {
  const grassY = height - 80;
  ctx.fillStyle = '#2d8659';
  ctx.fillRect(0, grassY - 15, width, 15);
  
  // Detalhes de grama
  ctx.fillStyle = '#3aa86d';
  for (let i = 0; i < width; i += 8) {
    ctx.fillRect(i, grassY - 12, 3, 8);
    ctx.fillRect(i + 4, grassY - 10, 3, 6);
  }
}

function drawPlantedTrees(ctx, width, height) {
  plantedTrees.forEach((tree, idx) => {
    const x = tree.x;
    const y = height - 95; // Acima do rio, no gramado
    
    // Tronco
    ctx.fillStyle = '#8b6f47';
    ctx.fillRect(x - 5, y, 10, 25);
    
    // Folhas (círculos verdes)
    ctx.fillStyle = '#2d7a3a';
    ctx.beginPath();
    ctx.arc(x, y - 5, 15, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#3aa86d';
    ctx.beginPath();
    ctx.arc(x - 10, y + 5, 12, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x + 10, y + 5, 12, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawForest(ctx, width, height, phase) {
  // Camadas de floresta para profundidade
  
  // Camada 1: Árvores bem ao fundo (mais escuras)
  drawTreeLayer(ctx, 0, height - 160, width, 50, phase, 0.3);
  
  // Camada 2: Árvores do meio
  drawTreeLayer(ctx, 0, height - 140, width, 60, phase, 0.5);
  
  // Camada 3: Árvores da frente
  drawTreeLayer(ctx, 0, height - 100, width, 40, phase, 0.7);
  
  // Arbustos e vegetação
  drawUndergrowth(ctx, width, height);
}

function drawTreeLayer(ctx, x, y, width, height, phase, opacity) {
  const treeWidth = 35;
  const numTrees = Math.ceil(width / treeWidth) + 2;
  
  for (let i = -1; i < numTrees; i++) {
    const treeX = x + i * treeWidth + (Math.sin(i * 0.5) * 10);
    const treeHeight = height * (0.8 + Math.sin(i * 0.3) * 0.2);
    
    // Tronco
    ctx.fillStyle = `rgba(101, 67, 33, ${opacity})`;
    ctx.fillRect(treeX + 12, y, 11, treeHeight * 0.4);
    
    // === COPA DA ÁRVORE (CORRIGIDO - agora aponta para cima) ===
    const apexY = y - treeHeight * 0.85;     // Ponta superior
    const baseY1 = y - treeHeight * 0.35;    // Base da primeira camada
    
    // Primeira camada de folhas (mais alta)
    ctx.fillStyle = `rgba(34, 92, 45, ${opacity})`;
    ctx.beginPath();
    ctx.moveTo(treeX + 17.5, apexY);           // Ponta superior
    ctx.lineTo(treeX, baseY1);                 // Base esquerda
    ctx.lineTo(treeX + 35, baseY1);            // Base direita
    ctx.closePath();
    ctx.fill();

    // Segunda camada de folhas (mais larga e abaixo)
    const baseY2 = y - treeHeight * 0.1;       // Base da segunda camada
    ctx.fillStyle = `rgba(58, 120, 52, ${opacity})`;
    ctx.beginPath();
    ctx.moveTo(treeX + 17.5, apexY + 18);      // Ponta um pouco mais baixa
    ctx.lineTo(treeX + 2, baseY2);             // Base esquerda
    ctx.lineTo(treeX + 33, baseY2);            // Base direita
    ctx.closePath();
    ctx.fill();
  }
}

function drawUndergrowth(ctx, width, height) {
  const grassY = height - 95;
  
  // Arbustos
  ctx.fillStyle = 'rgba(60, 100, 50, 0.8)';
  for (let i = 0; i < width; i += 60) {
    // Arbusto 1
    ctx.beginPath();
    ctx.arc(i + 20, grassY - 8, 22, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(i + 40, grassY - 10, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Flores/plantas silvestres
  ctx.fillStyle = 'rgba(200, 50, 100, 0.6)';
  for (let i = 0; i < width; i += 80) {
    ctx.beginPath();
    ctx.arc(i + 30, grassY - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(i + 50, grassY - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRiver(ctx, width, height, timeInCycle) {
  const riverY = height - 80; // Posição Y do rio
  const riverHeight = 80;
  
  // Desenhar rio com ondas
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
  
  // Cor do rio baseada na qualidade
  const riverCleanness = quality / 100;
  let riverColor1, riverColor2;
  
  if (riverCleanness > 0.7) {
    // Rio limpo - azul claro
    riverColor1 = '#2980b9';
    riverColor2 = '#1a5276';
  } else if (riverCleanness > 0.4) {
    // Rio moderado - verde azulado
    riverColor1 = '#4a7c3f';
    riverColor2 = '#2d5a2d';
  } else {
    // Rio sujo - marrom escuro
    riverColor1 = '#5d4037';
    riverColor2 = '#3e2723';
  }
  
  const riverGradient = ctx.createLinearGradient(0, riverY, 0, riverY + riverHeight);
  riverGradient.addColorStop(0, riverColor1);
  riverGradient.addColorStop(1, riverColor2);
  ctx.fillStyle = riverGradient;
  ctx.fill();
  
  // Desenhar lixo no rio baseado na qualidade
  drawRiverPollution(ctx, width, riverY, riverHeight, riverCleanness);
  
  // Reflexo de luz no rio
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawRiverPollution(ctx, width, riverY, riverHeight, cleanness) {
  const pollutionAmount = Math.floor((1 - cleanness) * 18); // mais lixo quando sujo
  
  const seed = Math.floor(quality / 10) * 10;

  for (let i = 0; i < pollutionAmount; i++) {
    const rng = ((seed + i) * 73856093) ^ (((seed + i) * 19349663) << 13);
    const x = (rng % (width - 30)) + 15;
    const y = riverY + 15 + ((rng >> 16) % (riverHeight - 40));
    
    const trashType = (rng >> 8) % 5; // 5 tipos agora
    const rotation = (rng % 40) - 20; // leve rotação

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    
    ctx.fillStyle = '#2c2c2c';
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1.5;

    if (trashType === 0) {
      // === GARRAFA PET ===
      ctx.fillStyle = '#4fc3f7';
      ctx.beginPath();
      ctx.roundRect(-6, -18, 12, 36, 4);
      ctx.fill();
      ctx.stroke();
      
      // Gargalo
      ctx.fillStyle = '#81d4fa';
      ctx.fillRect(-3, -22, 6, 8);
      // Tampa
      ctx.fillStyle = '#ff9800';
      ctx.fillRect(-4, -25, 8, 4);
      
    } else if (trashType === 1) {
      // === SACO PLÁSTICO ===
      ctx.fillStyle = '#ff80ab';
      ctx.beginPath();
      ctx.moveTo(-12, -10);
      ctx.quadraticCurveTo(-18, 8, -10, 18);
      ctx.quadraticCurveTo(0, 12, 14, 16);
      ctx.quadraticCurveTo(18, 0, 10, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Dobras do saco
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(-8, -5);
      ctx.lineTo(6, 8);
      ctx.stroke();
      
    } else if (trashType === 2) {
      // === GARRAFA DE VIDRO MARROM ===
      ctx.fillStyle = '#8d5524';
      ctx.beginPath();
      ctx.ellipse(0, 2, 7, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-4, -18, 8, 6); // gargalo
      
    } else if (trashType === 3) {
      // === MONTE DE LIXO / EMBALAGENS ===
      ctx.fillStyle = '#455a64';
      ctx.fillRect(-14, -8, 28, 16);
      
      ctx.fillStyle = '#607d8b';
      ctx.fillRect(-10, -12, 12, 8);
      ctx.fillRect(4, -6, 10, 10);
      
      // Detalhes de lixo
      ctx.fillStyle = '#ff5722';
      ctx.fillRect(-8, -4, 6, 4);
      
    } else {
      // === LATINHA AMASSADA ===
      ctx.fillStyle = '#90a4ae';
      ctx.beginPath();
      ctx.ellipse(0, 0, 9, 14, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.fillStyle = '#e1f5fe';
      ctx.fillRect(-6, -10, 12, 4); // abertura
    }
    
    ctx.restore();
  }
}

function drawFactory(ctx, width, height, timeInCycle, phase) {
  const factoryX = width * 0.75;
  const factoryY = height - 140;
  const factoryWidth = 80;
  const factoryHeight = 60;
  
  // Prédio da fábrica
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(factoryX, factoryY, factoryWidth, factoryHeight);
  
  // Porta
  ctx.fillStyle = '#3e2723';
  ctx.fillRect(factoryX + factoryWidth / 2 - 8, factoryY + factoryHeight - 18, 16, 18);
  
  // Janelas
  ctx.fillStyle = 'rgba(255, 200, 0, 0.6)';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      ctx.fillRect(factoryX + 10 + i * 20, factoryY + 10 + j * 15, 10, 8);
    }
  }
  
  // Chaminés (3 chaminés)
  drawChimney(ctx, factoryX + 15, factoryY - 5, timeInCycle, phase);
  drawChimney(ctx, factoryX + 40, factoryY - 8, timeInCycle, phase);
  drawChimney(ctx, factoryX + 65, factoryY - 3, timeInCycle, phase);
}

function drawChimney(ctx, x, y, timeInCycle, phase) {
  const chimneyWidth = 12;
  const chimneyHeight = 40;
  
  // Tubo da chaminé
  ctx.fillStyle = '#654321';
  ctx.fillRect(x - chimneyWidth / 2, y - chimneyHeight, chimneyWidth, chimneyHeight);
  
  // Fumaça saindo (partículas)
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

function drawVisualEffects(ctx, width, height, timeInCycle) {
  // Remover efeitos expirados
  visualEffects = visualEffects.filter(eff => Date.now() - eff.startTime < eff.duration);
  
  visualEffects.forEach(eff => {
    const elapsed = Date.now() - eff.startTime;
    const progress = elapsed / eff.duration;
    
    if (eff.type === 'tree_planted') {
      // Animação de árvore sendo plantada
      const scale = progress * 0.8 + 0.2; // Cresce de 0.2 a 1
      ctx.globalAlpha = 1 - (progress * 0.3); // Fade out
      
      ctx.save();
      ctx.translate(eff.x, eff.y);
      ctx.scale(scale, scale);
      ctx.translate(-eff.x, -eff.y);
      
      // Desenhar árvore pequena
      ctx.fillStyle = '#8b6f47';
      ctx.fillRect(eff.x - 3, eff.y - 10, 6, 12);
      ctx.fillStyle = '#2d7a3a';
      ctx.beginPath();
      ctx.arc(eff.x, eff.y - 15, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
      ctx.globalAlpha = 1;
    }
  });
}

function addVisualEffect(type, x, y, duration = 1000) {
  visualEffects.push({
    type,
    x,
    y,
    startTime: Date.now(),
    duration
  });
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

// Atualizar canvas quando tela ativa
function updateBackgroundByTime() {
  const canvas = document.getElementById('river-canvas');
  if (canvas) {
    canvasStartTime = Date.now();
  }
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
const settingsModal = document.getElementById('settings-modal');

// Atualiza Interface
function updateUI() {
  const qualityPercent = (quality / QUALITY_TARGET) * 100;
  qualityBar.style.width = Math.max(0, Math.min(100, qualityPercent)) + '%';
  qualityText.textContent = Math.round(qualityPercent) + '%';
  pointsEl.textContent = points;
  dayEl.textContent = day;
}

function showMessage(text, color = "#000") {
  messageEl.textContent = text;
  messageEl.style.color = color;
  showGuardian();
}

function showGuardian() {
  const guardian = document.getElementById('leo-game');
  const speechBubble = document.getElementById('speech-bubble');
  
  if (guardian) {
    guardian.style.display = 'block';
    guardian.style.animation = 'none';
    setTimeout(() => {
      guardian.style.animation = 'slideIn 0.5s ease-out forwards';
    }, 10);
    
    setTimeout(hideGuardian, 10000);
  }
  
  if (speechBubble) {
    speechBubble.style.opacity = '1';
  }
}

function hideGuardian() {
  const guardian = document.getElementById('leo-game');
  const speechBubble = document.getElementById('speech-bubble');
  
  if (guardian) {
    guardian.style.animation = 'slideOut 0.5s ease-in forwards';
  }
  
  if (speechBubble) {
    speechBubble.style.opacity = '0';
  }
  
  setTimeout(() => {
    if (guardian) {
      guardian.style.display = 'none';
    }
    if (speechBubble) {
      speechBubble.style.textContent = '';
    }
  }, 500);
}

// Verifica se uma ação está desbloqueada
function isActionUnlocked(type) {
  return day >= actionUnlock[type];
}

// Ações Pendentes
function addPendingAction(type, value, days) {
  pendingActions.push({ type, value, daysLeft: days });
  
  // Selecionar mensagem aleatória da ação
  const messages = actionMessages[type] || [];
  const message = messages[Math.floor(Math.random() * messages.length)];
  
  // Efeitos visuais específicos da ação
  if (type === 'tree') {
    // Adicionar árvore ao canvas
    const treeX = 100 + Math.random() * 400;
    plantedTrees.push({ x: treeX });
    
    // Efeito visual de plantio
    addVisualEffect('tree_planted', treeX, 180, 1500);
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
      event = {
        name: "🌧️ Chuva Torrencial",
        message: "O rio transborda! Natureza se renovando...",
        effect: 18 + Math.random() * 12,
        color: "#44ccff",
        duration: 1
      };
    } else if (rng < 0.40) {
      event = {
        name: "🏭 Vazamento Industrial",
        message: "ALERTA! Fábrica despejou químicos no rio!",
        effect: -(20 + Math.random() * 15),
        color: "#ff6644",
        duration: 2,
        blocked_by: "factory"
      };
    } else if (rng < 0.55) {
      event = {
        name: "⚠️ Contaminação Grave",
        message: "Vazamento tóxico detectado! Qualidade caindo!",
        effect: -(30 + Math.random() * 20),
        color: "#ff0000",
        duration: 3,
        blocked_by: "factory"
      };
    } else if (rng < 0.70) {
      event = {
        name: "🐟 Retorno da Vida",
        message: "Peixes voltaram! O rio está melhorando!",
        effect: 15 + Math.random() * 10,
        color: "#00ff88",
        duration: 1
      };
    } else if (rng < 0.85) {
      event = {
        name: "🌱 Crescimento Natural",
        message: "Árvores e plantas florescendo na margem!",
        effect: 12 + Math.random() * 8,
        color: "#88ff44",
        duration: 1,
        bonus_if: "tree"
      };
    } else {
      event = {
        name: "♻️ Comunidade Engajada",
        message: "Cidadãos limparam o rio juntos!",
        effect: 16 + Math.random() * 10,
        color: "#ffaa00",
        duration: 1,
        bonus_if: "recycle"
      };
    }
    
    triggerEvent(event);
  }
}

function triggerEvent(event) {
  activeEvents.push({
    ...event,
    daysLeft: event.duration,
    id: Date.now()
  });
  
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
}

function processActiveEvents() {
  for (let i = activeEvents.length - 1; i >= 0; i--) {
    const evt = activeEvents[i];
    evt.daysLeft--;
    if (evt.daysLeft <= 0) {
      activeEvents.splice(i, 1);
    }
  }
}

// Tela de Vitória
function showVictoryScreen() {
  document.getElementById('screen-game').classList.remove('active');
  document.getElementById('screen-victory').classList.add('active');
  
  document.getElementById('final-quality').textContent = Math.round(quality) + "%";
  document.getElementById('final-points').textContent = points;
  document.getElementById('final-days').textContent = day;
}

// ==================== EVENT LISTENERS ====================

// Finalizar Dia
document.getElementById('btn-end-turn').addEventListener('click', () => {
  day++;
  processPendingActions();
  quality = Math.max(0, quality - 3);
  triggerRandomEvent();
  updateUI();
  updateBackgroundByTime();   // Atualiza background
  updateActionButtons();

  if (quality <= 0) {
    alert(`💀 GAME OVER\nO rio morreu no dia ${day}...`);
    location.reload();
  }
  if (quality >= QUALITY_TARGET) {
    setTimeout(showVictoryScreen, 500);
  }
});

// Ações
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);
    const cooldownInfo = actionCooldowns[type];
    
    // Verificar se a ação está desbloqueada
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

// Configurações
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

// Navegação
document.getElementById('btn-play').addEventListener('click', () => {
  document.getElementById('screen-start').classList.remove('active');
  document.getElementById('screen-game').classList.add('active');
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
    showMessage('');
    updateUI();
  }
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());

window.addEventListener('load', () => {
  drawRiverScene();
  updateUI();
  updateActionButtons();     // ← Já deve estar, mas garanta
  
  // Força atualização inicial da ação "clean"
  const cleanBtn = document.querySelector('.action-btn[data-type="clean"]');
  if (cleanBtn) {
    cleanBtn.disabled = false;
    cleanBtn.style.opacity = '1';
    cleanBtn.style.cursor = 'pointer';
    cleanBtn.style.filter = 'none';
  }
  
  hideGuardian();
});

function updateActionButtons() {
  document.querySelectorAll('.action-btn').forEach(btn => {
    const type = btn.dataset.type;
    const cooldownInfo = actionCooldowns[type];
    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;
    
    // Verifica se está desbloqueada
    if (!isActionUnlocked(type)) {
      btn.disabled = true;
      btn.style.opacity = '0.3';
      btn.style.cursor = 'not-allowed';
      btn.style.filter = 'grayscale(1)';
      
      const small = btn.querySelector('small');
      if (small) {
        small.textContent = `🔒 Desbloqueada no dia ${actionUnlock[type]}`;
      }
    } 
    // Ação em cooldown
    else if (daysUntilAvailable > 0) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      btn.style.filter = 'none';
      
      const small = btn.querySelector('small');
      if (small) {
        small.textContent = `Em cooldown: ${daysUntilAvailable} dia(s)`;
      }
    } 
    // Ação disponível
    else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.style.filter = 'none';
      
      const points = btn.dataset.points;
      const small = btn.querySelector('small');
      
      if (small) {
        let daysText = '';
        switch(type) {
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
