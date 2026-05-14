let quality = 65;
let points = 230;
let day = 1;
let pendingActions = [];
let soundEnabled = true;
let librasEnabled = true;

const qualityBar = document.getElementById('quality-bar');
const qualityText = document.getElementById('quality-text');
const pointsEl = document.getElementById('points');
const dayEl = document.getElementById('day');
const messageEl = document.getElementById('speech-bubble');

const settingsModal = document.getElementById('settings-modal');

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
  if (Math.random() < 0.15) {
    const eventType = Math.floor(Math.random() * 3);
    if (eventType === 0) {
      const gain = 12 + Math.random() * 10;
      quality = Math.min(100, quality + gain);
      showMessage("🌧️ Chuva forte! O rio se renovou!", "#44ccff");
    } else if (eventType === 1) {
      const loss = 15 + Math.random() * 10;
      quality = Math.max(0, quality - loss);
      showMessage("🏭 Fábrica despejou resíduos!", "#ff4444");
    } else {
      const loss = 22 + Math.random() * 13;
      quality = Math.max(0, quality - loss);
      showMessage("⚠️ Vazamento químico grave!", "#ff0000");
    }
  }
}

// Tela de Vitória
function showVictoryScreen() {
  document.getElementById('screen-game').classList.remove('active');
  const victory = document.getElementById('screen-victory');
  victory.classList.add('active');
  
  document.getElementById('final-quality').textContent = Math.round(quality) + "%";
  document.getElementById('final-points').textContent = points;
  document.getElementById('final-days').textContent = day;
}

// Finalizar Dia
document.getElementById('btn-end-turn').addEventListener('click', () => {
  day++;
  processPendingActions();
  quality = Math.max(0, quality - 3);
  triggerRandomEvent();
  updateUI();

  if (quality <= 0) {
    alert(`💀 GAME OVER\nO rio morreu no dia ${day}...`);
    location.reload();
  }
  if (quality >= 100) {
    setTimeout(showVictoryScreen, 500);
  }
});

// Ações (incluindo a nova Campanha de Reciclagem)
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);
    
    if (type === 'tree') addPendingAction('tree', value, 3);
    else if (type === 'clean') addPendingAction('clean', value, 1);
    else if (type === 'recycle') addPendingAction('recycle', value, 2);
    else if (type === 'factory') addPendingAction('factory', value, 2);
    
    points += Math.abs(value) * 2;
    updateUI();
  });
});

// Configurações
function openSettings() {
  settingsModal.classList.add('active');
}
function closeSettings() {
  settingsModal.classList.remove('active');
}

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

document.getElementById('btn-restart').addEventListener('click', () => {
  location.reload();
});

updateUI();
