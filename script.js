let quality = 65;
let points = 230;
let day = 1;
let pendingActions = [];
let soundEnabled = true;
let librasEnabled = true;
let activeEvents = [];
let eventSequence = [];
let dayStreak = 0;

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

// ==================== BACKGROUND POR HORÁRIO REAL ====================
const backgrounds = [];
for (let i = 1; i <= 32; i++) {
  backgrounds.push(`assets/P${i}.png`);
}

function updateBackgroundByTime() {
  const riverBg = document.getElementById('river-bg');
  if (!riverBg) return;

  const now = new Date();
  const hour = now.getHours();
  
  let index = Math.floor((hour * 32) / 24);
  riverBg.src = backgrounds[index];
}

// Atualiza Interface
function updateUI() {
  qualityBar.style.width = Math.max(0, quality) + '%';
  qualityText.textContent = Math.round(quality) + '%';
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

// Ações Pendentes
function addPendingAction(type, value, days) {
  pendingActions.push({ type, value, daysLeft: days });
  
  let name = "";
  if (type === 'tree') name = '🌳 Árvores';
  else if (type === 'clean') name = '🗑️ Limpeza';
  else if (type === 'recycle') name = '♻️ Reciclagem';
  else if (type === 'factory') name = '🏭 Fiscalização';
  
  showMessage(`${name} agendada!\nEfeito em ${days} dia(s)`, "#22ff88");
}

function processPendingActions() {
  for (let i = pendingActions.length - 1; i >= 0; i--) {
    const action = pendingActions[i];
    action.daysLeft--;
    if (action.daysLeft <= 0) {
      quality = Math.min(100, quality + action.value);
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
  
  quality = Math.max(0, Math.min(100, quality + finalEffect));
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
  if (quality >= 100) {
    setTimeout(showVictoryScreen, 500);
  }
});

// Ações
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);
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
    quality = 65; points = 230; day = 1; pendingActions = [];
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-start').classList.add('active');
    showMessage('');
    updateUI();
  }
});

document.getElementById('btn-restart').addEventListener('click', () => location.reload());

// Inicialização
window.addEventListener('load', () => {
  updateBackgroundByTime();
  setInterval(updateBackgroundByTime, 60000); // Atualiza a cada minuto
  updateUI();
  updateActionButtons();
  hideGuardian();
});

function updateActionButtons() {
  document.querySelectorAll('.action-btn').forEach(btn => {
    const type = btn.dataset.type;
    const cooldownInfo = actionCooldowns[type];
    const daysUntilAvailable = cooldownInfo.lastUsed + cooldownInfo.cooldown - day;
    
    if (daysUntilAvailable > 0) {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
      const small = btn.querySelector('small');
      if (small) {
        small.textContent = `Em cooldown: ${daysUntilAvailable} dia(s)`;
      }
    } else {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      const type = btn.dataset.type;
      const points = btn.dataset.points;
      const daysText = 
        type === 'tree' ? '3 dias' :
        type === 'clean' ? '1 dia' :
        type === 'recycle' ? '2 dias' :
        '2 dias';
      const small = btn.querySelector('small');
      if (small) {
        small.textContent = `+${points} (${daysText})`;
      }
    }
  });
}
