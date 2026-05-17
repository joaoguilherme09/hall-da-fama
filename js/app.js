// ─── APP.JS ────────────────────────────────────────────────────────────────
// Depende de: data/data.js (DATA)
// No index.html, antes de </body>, adicione nesta ordem:
//   <script src="data/data.js"></script>
//   <script src="js/app.js"></script>
// ───────────────────────────────────────────────────────────────────────────

// ─── HELPERS ───────────────────────────────────────────
function getPlayer(id) { return DATA.jogadores.find(j => j.id === id); }
function getCamp(id)   { return DATA.campeonatos.find(c => c.id === id); }
function getTime(id)   { return DATA.times.find(t => t.id === id); }
function fmt(dateStr)  {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

// ─── STATS BAR ─────────────────────────────────────────
function renderStats() {
  const totalCamps     = DATA.campeonatos.length;
  const totalJogadores = DATA.jogadores.length;
  const totalTitulos   = DATA.titulos.length;
  const ranking        = getRanking();
  const top            = ranking[0];

  document.getElementById('statsBar').innerHTML = `
    <div class="stat-item"><span class="stat-num">${totalTitulos}</span><span class="stat-label">Títulos</span></div>
    <div class="stat-item"><span class="stat-num">${totalJogadores}</span><span class="stat-label">Campeões </span></div>
    <div class="stat-item"><span class="stat-num">${totalCamps}</span><span class="stat-label">Campeonatos</span></div>
    <div class="stat-item"><span class="stat-num" style="font-size:1.1rem;padding-top:4px">${top.nome}</span><span class="stat-label">Maior Campeão</span></div>
  `;
}

// ─── RANKING ───────────────────────────────────────────
function getRanking() {
  const map = {};
  DATA.titulos.forEach(t => {
    if (!map[t.jogador_id]) map[t.jogador_id] = 0;
    map[t.jogador_id]++;
  });
  return DATA.jogadores
    .map(j => ({ ...j, titles: map[j.id] || 0 }))
    .filter(j => j.titles > 0)
    .sort((a, b) => b.titles - a.titles);
}

// ─── PODIUM ────────────────────────────────────────────
function renderPodium() {
  const ranking = getRanking();
  const top3    = ranking.slice(0, 3);
  const order   = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3;
  const classes = top3.length >= 3 ? ['second', 'first', 'third'] : ['first', 'second', 'third'];
  const crowns  = top3.length >= 3 ? ['🥈', '🥇', '🥉'] : ['🥇', '🥈', '🥉'];
  const ranks   = top3.length >= 3 ? ['2°', '1°', '3°'] : ['1°', '2°', '3°'];

  document.getElementById('podiumStage').innerHTML = order.map((p, i) => `
    <div class="podium-slot ${classes[i]}" onclick="openModal(${p.id})">
      <div class="podium-card">
        <span class="podium-crown">${crowns[i]}</span>
        <span class="podium-name">${p.nome}</span>
        <span class="podium-titles">${p.titles} ${p.titles === 1 ? 'título' : 'títulos'}</span>
      </div>
      <div class="podium-block"><span class="podium-rank">${ranks[i]}</span></div>
    </div>
  `).join('');
}

// ─── CHAMPIONS TABLE ───────────────────────────────────
let currentPage  = 1;
const perPage    = 10;
let sortKey      = 'date';
let sortDir      = -1;
let filteredData = [];

function getTitlesCount(jogadorId) {
  return DATA.titulos.filter(t => t.jogador_id === jogadorId).length;
}

function buildRow(t) {
  const player = getPlayer(t.jogador_id);
  const camp   = getCamp(t.campeonato_id);
  const time   = getTime(t.time_id);
  const titles = getTitlesCount(t.jogador_id);
  return `
    <tr onclick="openModal(${t.jogador_id})">
      <td class="td-date">${t.id}º</td>
      <td class="td-player">${player?.nome || '—'}</td>
      <td class="td-camp">${camp?.nome || '—'}</td>
      <td class="td-team">${time?.nome || '—'}</td>
      <td class="td-date">${fmt(t.data)}</td>
      <td class="td-titles"><span class="titles-badge">${titles}</span></td>
    </tr>
  `;
}

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase();
  const campId = parseInt(document.getElementById('campFilter').value) || null;
  const playId = parseInt(document.getElementById('playerFilter').value) || null;

  filteredData = DATA.titulos.filter(t => {
    const p  = getPlayer(t.jogador_id);
    const c  = getCamp(t.campeonato_id);
    const tm = getTime(t.time_id);
    const matchSearch = !search ||
      p?.nome.toLowerCase().includes(search) ||
      c?.nome.toLowerCase().includes(search) ||
      tm?.nome.toLowerCase().includes(search);
    const matchCamp   = !campId || t.campeonato_id === campId;
    const matchPlayer = !playId || t.jogador_id === playId;
    return matchSearch && matchCamp && matchPlayer;
  });

  filteredData.sort((a, b) => {
    let va, vb;
    if      (sortKey === 'date')   { va = a.data; vb = b.data; }
    else if (sortKey === 'player') { va = getPlayer(a.jogador_id)?.nome; vb = getPlayer(b.jogador_id)?.nome; }
    else if (sortKey === 'camp')   { va = getCamp(a.campeonato_id)?.nome; vb = getCamp(b.campeonato_id)?.nome; }
    else if (sortKey === 'team')   { va = getTime(a.time_id)?.nome; vb = getTime(b.time_id)?.nome; }
    else if (sortKey === 'edicao') { va = a.id; vb = b.id; }
    else if (sortKey === 'titles') { va = getTitlesCount(a.jogador_id); vb = getTitlesCount(b.jogador_id); }
    if (va < vb) return -1 * sortDir;
    if (va > vb) return  1 * sortDir;
    return 0;
  });

  currentPage = 1;
  renderTable();
}

function renderTable() {
  const start = (currentPage - 1) * perPage;
  const slice = filteredData.slice(start, start + perPage);
  document.getElementById('championsBody').innerHTML = slice.map(buildRow).join('');
  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filteredData.length / perPage);
  let html = '';
  if (total <= 1) { document.getElementById('pagination').innerHTML = ''; return; }
  if (currentPage > 1) html += `<button class="page-btn" onclick="goPage(${currentPage - 1})">‹</button>`;
  for (let i = 1; i <= total; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }
  if (currentPage < total) html += `<button class="page-btn" onclick="goPage(${currentPage + 1})">›</button>`;
  document.getElementById('pagination').innerHTML = html;
}

function goPage(n) {
  currentPage = n;
  renderTable();
  window.scrollTo({ top: document.getElementById('champions').offsetTop - 80, behavior: 'smooth' });
}

function populateFilters() {
  const campSel = document.getElementById('campFilter');
  const playSel = document.getElementById('playerFilter');
  DATA.campeonatos.forEach(c => {
    campSel.innerHTML += `<option value="${c.id}">${c.nome}</option>`;
  });
  DATA.jogadores.forEach(j => {
    if (getTitlesCount(j.id) > 0)
      playSel.innerHTML += `<option value="${j.id}">${j.nome}</option>`;
  });
}

// ─── RANKING GRID ──────────────────────────────────────
function renderRanking() {
  const ranking = getRanking();
  document.getElementById('rankingGrid').innerHTML = ranking.map((p, i) => `
    <div class="rank-row" onclick="openModal(${p.id})">
      <span class="rank-pos">${i + 1}</span>
      <div class="rank-info">
        <div class="rank-name">${p.nome}</div>
        <div class="rank-sub">${p.titles} ${p.titles === 1 ? 'título' : 'títulos'} conquistados</div>
      </div>
      <span class="rank-titles">${p.titles}</span>
    </div>
  `).join('');
}

// ─── MODAL ─────────────────────────────────────────────
function openModal(playerId) {
  const player  = getPlayer(playerId);
  const ranking = getRanking();
  const pos     = ranking.findIndex(r => r.id === playerId) + 1;
  const titles  = DATA.titulos.filter(t => t.jogador_id === playerId).sort((a, b) => a.data > b.data ? -1 : 1);
  const campsWon  = [...new Set(titles.map(t => t.campeonato_id))].length;
  const teamsUsed = [...new Set(titles.map(t => t.time_id))];

  document.getElementById('modalName').textContent = player.nome;
  document.getElementById('modalRank').textContent = `#${pos} no ranking geral`;

  document.getElementById('modalStats').innerHTML = `
    <div class="modal-stat"><span class="modal-stat-num">${titles.length}</span><span class="modal-stat-label">Títulos</span></div>
    <div class="modal-stat"><span class="modal-stat-num">${campsWon}</span><span class="modal-stat-label">Campeonatos</span></div>
    <div class="modal-stat"><span class="modal-stat-num">${teamsUsed.length}</span><span class="modal-stat-label">Times usados</span></div>
  `;

  const timelineHTML = titles.map(t => `
    <div class="timeline-item">
      <span class="tl-date">${fmt(t.data)}</span>
      <span class="tl-camp">${getCamp(t.campeonato_id)?.nome}</span>
      <span class="tl-team">${getTime(t.time_id)?.nome}</span>
    </div>
  `).join('');

  const teamsHTML = teamsUsed.map(tid => `
    <span class="team-pill">${getTime(tid)?.nome}</span>
  `).join('');

  document.getElementById('modalBody').innerHTML = `
    <div class="modal-section-title" style="margin-bottom:0.8rem">Linha do Tempo</div>
    <div class="timeline">${timelineHTML}</div>
    <div class="modal-section-title" style="margin-bottom:0.8rem">Times utilizados</div>
    <div class="teams-used">${teamsHTML}</div>
  `;

  document.getElementById('modalOverlay').classList.add('open');
}

document.getElementById('modalClose').addEventListener('click', () => {
  document.getElementById('modalOverlay').classList.remove('open');
});

document.getElementById('modalOverlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modalOverlay'))
    document.getElementById('modalOverlay').classList.remove('open');
});

// ─── EVENTOS DE FILTRO ─────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      if (sortKey === key) sortDir *= -1;
      else { sortKey = key; sortDir = 1; }
      document.querySelectorAll('th').forEach(t => t.classList.remove('sorted'));
      th.classList.add('sorted');
      applyFilters();
    });
  });

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('campFilter').addEventListener('change', applyFilters);
  document.getElementById('playerFilter').addEventListener('change', applyFilters);
  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('campFilter').value  = '';
    document.getElementById('playerFilter').value = '';
    applyFilters();
  });
});

// ─── INIT ──────────────────────────────────────────────
renderStats();
renderPodium();
populateFilters();
filteredData = [...DATA.titulos];
filteredData.sort((a, b) => a.data > b.data ? -1 : 1);
renderTable();
renderRanking();
