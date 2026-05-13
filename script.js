let quality = 65;
let points = 230;
let day = 1;
let pendingActions = [];

const qualityBar = document.getElementById('quality-bar');
const qualityText = document.getElementById('quality-text');
const pointsEl = document.getElementById('points');
const dayEl = document.getElementById('day');
const messageEl = document.getElementById('speech-bubble');

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

function addPendingAction(type, value, days) {
  pendingActions.push({ type, value, daysLeft: days });
  
  const name = type === 'tree' ? '🌳 Árvores' : 
               type === 'clean' ? '🗑️ Limpeza' : '🏭 Fiscalização';
  
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
    
    if (eventType === 0) { // Chuva
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

// Ações
document.querySelectorAll('.action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const value = parseInt(btn.dataset.points);
    
    if (type === 'tree') addPendingAction('tree', value, 3);
    else if (type === 'clean') addPendingAction('clean', value, 1);
    else if (type === 'factory') addPendingAction('factory', value, 2);
    
    points += Math.abs(value) * 2;
    updateUI();
  });
});

// Finalizar Dia
document.getElementById('btn-end-turn').addEventListener('click', () => {
  day++;
  processPendingActions();
  quality = Math.max(0, quality - 3); // poluição natural
  triggerRandomEvent();
  updateUI();

  if (quality <= 0) {
    setTimeout(() => alert(`💀 GAME OVER\nO rio morreu no dia ${day}`), 200);
  }
  if (quality >= 100 && day > 8) {
    setTimeout(() => alert("🎉 Você salvou o rio! Parabéns!"), 200);
  }
});

// Voltar ao Menu
document.getElementById('btn-back-menu').addEventListener('click', () => {
  if (confirm("Voltar ao menu? O progresso será perdido.")) {
    quality = 65; points = 230; day = 1; pendingActions = [];
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-start').classList.add('active');
    showMessage('');
    updateUI();
  }
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

updateUI();