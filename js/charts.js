// ─── CHARTS.JS ─────────────────────────────────────────────────────────────
// Depende de: data/data.js (DATA) + Chart.js (CDN)
// Adicione no index.html, antes de </body>:
//   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//   <script src="data/data.js"></script>
//   <script src="js/charts.js"></script>
//
// E adicione a seção HTML abaixo de #ranking:
//
// <section id="graficos">
//   <div class="section-header">
//     <span class="section-label">Estatísticas visuais</span>
//     <h2 class="section-title">Gráficos</h2>
//   </div>
//   <div class="divider"></div>
//   <div class="charts-grid">
//     <div class="chart-card"><canvas id="chartJogadores"></canvas></div>
//     <div class="chart-card"><canvas id="chartCampeonatos"></canvas></div>
//     <div class="chart-card chart-wide"><canvas id="chartTimes"></canvas></div>
//     <div class="chart-card chart-wide"><canvas id="chartEvolucao"></canvas></div>
//   </div>
// </section>
//
// E adicione este CSS:
//
// #graficos { padding: 6rem 2rem; max-width: 1100px; margin: 0 auto; }
// .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
// .chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 1.5rem; }
// .chart-wide { grid-column: 1 / -1; }
// @media (max-width: 768px) { .charts-grid { grid-template-columns: 1fr; } .chart-wide { grid-column: 1; } }
// ───────────────────────────────────────────────────────────────────────────

(function () {

  // ── Paleta neon (consistente com css/style.css) ──────
  // Acentos vivos: usados em títulos, textos e linhas (contraste já validado)
  const PINK     = '#FF2EC4';   // rosa-choque neon
  const CYAN     = '#00E5FF';   // ciano/turquesa neon
  const VIOLET   = '#8B5CF6';   // roxo/violeta (transição)
  const MUTED    = '#8782A8';   // lavanda apagado — tudo fora do pódio
  const TEXT     = '#EDE9FA';
  const SURFACE  = '#141827';
  const BORDER   = 'rgba(255,46,196,0.18)';

  // Tons "seguros para dados": versões ajustadas das mesmas cores para
  // ficarem distinguíveis lado a lado (barras, pizza) — ver dataviz skill.
  const MARK_PINK    = '#E619B0';
  const MARK_CYAN    = '#009ED8';
  const MARK_VIOLET  = '#8B5CF6';
  const MARK_PURPLE  = '#A855F7';
  const MARK_PINK2   = '#E8539F';
  const MARK_TEAL    = '#0598B5';
  const MARK_INDIGO  = '#6D5ED6';
  const MARK_FUCHSIA = '#C13584';

  const PALETTE = [
    MARK_PINK, MARK_VIOLET, MARK_CYAN, MARK_PURPLE,
    MARK_PINK2, MARK_TEAL, MARK_INDIGO, MARK_FUCHSIA
  ];

  // ── Defaults globais ────────────────────────────────
  Chart.defaults.color = TEXT;
  Chart.defaults.font.family = "'Barlow Condensed', sans-serif";
  Chart.defaults.font.size = 13;

  const gridStyle = {
    color: BORDER,
    lineWidth: 1
  };

  const tooltipStyle = {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderWidth: 1,
    titleColor: PINK,
    bodyColor: TEXT,
    padding: 10,
    cornerRadius: 4,
    titleFont: { family: "'Bebas Neue', cursive", size: 15 }
  };

  // ── Helpers ─────────────────────────────────────────
  function getPlayer(id)  { return DATA.jogadores.find(j => j.id === id); }
  function getCamp(id)    { return DATA.campeonatos.find(c => c.id === id); }
  function getTime(id)    { return DATA.times.find(t => t.id === id); }

  function countBy(field) {
    const map = {};
    DATA.titulos.forEach(t => {
      const key = t[field];
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  function sortedEntries(map) {
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }

  // ── 1. Títulos por Jogador (barras horizontais) ──────
  function renderChartJogadores() {
    const map     = countBy('jogador_id');
    const entries = sortedEntries(map);
    const labels  = entries.map(([id]) => getPlayer(parseInt(id))?.nome || '?');
    const values  = entries.map(([, v]) => v);
    const colors  = entries.map((_, i) => {
      if (i === 0) return MARK_PINK;
      if (i === 1) return MARK_CYAN;
      if (i === 2) return MARK_VIOLET;
      return MUTED;
    });

    new Chart(document.getElementById('chartJogadores'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Títulos',
          data: values,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: {
            display: true,
            text: 'TÍTULOS POR JOGADOR',
            color: PINK,
            font: { family: "'Bebas Neue', cursive", size: 18 },
            padding: { bottom: 16 }
          }
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED },
            border: { color: BORDER }
          },
          y: {
            grid: { display: false },
            ticks: { color: TEXT, font: { weight: '700' } },
            border: { color: BORDER }
          }
        }
      }
    });
  }

  // ── 2. Títulos por Campeonato (pizza / doughnut) ─────
  function renderChartCampeonatos() {
    const map     = countBy('campeonato_id');
    const entries = sortedEntries(map);
    const labels  = entries.map(([id]) => getCamp(parseInt(id))?.nome || '?');
    const values  = entries.map(([, v]) => v);

    new Chart(document.getElementById('chartCampeonatos'), {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: PALETTE.slice(0, labels.length),
          borderColor: SURFACE,
          borderWidth: 3,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: TEXT,
              padding: 12,
              usePointStyle: true,
              pointStyleWidth: 10,
              font: { size: 12 }
            }
          },
          tooltip: { ...tooltipStyle },
          title: {
            display: true,
            text: 'TÍTULOS POR CAMPEONATO',
            color: PINK,
            font: { family: "'Bebas Neue', cursive", size: 18 },
            padding: { bottom: 16 }
          }
        }
      }
    });
  }

  // ── 3. Títulos por Time (barras verticais) ───────────
  function renderChartTimes() {
    const map     = countBy('time_id');
    const entries = sortedEntries(map);
    const labels  = entries.map(([id]) => getTime(parseInt(id))?.nome || '?');
    const values  = entries.map(([, v]) => v);

    new Chart(document.getElementById('chartTimes'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Títulos',
          data: values,
          backgroundColor: labels.map((_, i) =>
            `rgba(0,158,216,${Math.max(0.25, 1 - i * 0.07)})`
          ),
          borderColor: MARK_CYAN,
          borderWidth: 1,
          borderRadius: 4,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: {
            display: true,
            text: 'TÍTULOS POR TIME',
            color: PINK,
            font: { family: "'Bebas Neue', cursive", size: 18 },
            padding: { bottom: 16 }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: TEXT, maxRotation: 35 },
            border: { color: BORDER }
          },
          y: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED },
            border: { color: BORDER }
          }
        }
      }
    });
  }

  // ── 4. Evolução histórica por mês (linha) ────────────
  function renderChartEvolucao() {
    // Agrupa títulos acumulados por mês
    const sorted = [...DATA.titulos].sort((a, b) => a.data > b.data ? 1 : -1);

    const monthMap = {};
    sorted.forEach(t => {
      const [y, m] = t.data.split('-');
      const key = `${y}-${m}`;
      monthMap[key] = (monthMap[key] || 0) + 1;
    });

    const months  = Object.keys(monthMap).sort();
    const labels  = months.map(k => {
      const [y, m] = k.split('-');
      const date = new Date(parseInt(y), parseInt(m) - 1);
      return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    });

    // Acumulado total
    let acc = 0;
    const accumulated = months.map(k => { acc += monthMap[k]; return acc; });
    // Por mês
    const perMonth = months.map(k => monthMap[k]);

    new Chart(document.getElementById('chartEvolucao'), {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total acumulado',
            data: accumulated,
            borderColor: PINK,
            backgroundColor: 'rgba(255,46,196,0.08)',
            borderWidth: 2,
            pointBackgroundColor: PINK,
            pointRadius: 5,
            pointHoverRadius: 7,
            fill: true,
            tension: 0.35,
            yAxisID: 'yAcc'
          },
          {
            label: 'Títulos no mês',
            data: perMonth,
            borderColor: CYAN,
            backgroundColor: 'rgba(0,229,255,0.06)',
            borderWidth: 2,
            borderDash: [5, 4],
            pointBackgroundColor: CYAN,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: false,
            tension: 0.35,
            yAxisID: 'yMonth'
          }
        ]
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: {
              color: TEXT,
              usePointStyle: true,
              pointStyleWidth: 10
            }
          },
          tooltip: { ...tooltipStyle },
          title: {
            display: true,
            text: 'EVOLUÇÃO HISTÓRICA DE TÍTULOS',
            color: PINK,
            font: { family: "'Bebas Neue', cursive", size: 18 },
            padding: { bottom: 16 }
          }
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { color: TEXT },
            border: { color: BORDER }
          },
          yAcc: {
            position: 'left',
            grid: gridStyle,
            ticks: { stepSize: 2, color: PINK },
            border: { color: BORDER },
            title: { display: true, text: 'Acumulado', color: PINK }
          },
          yMonth: {
            position: 'right',
            grid: { display: false },
            ticks: { stepSize: 1, color: CYAN },
            border: { color: BORDER },
            title: { display: true, text: 'Por mês', color: CYAN }
          }
        }
      }
    });
  }

  // ── Init ─────────────────────────────────────────────
  function initCharts() {
    renderChartJogadores();
    renderChartCampeonatos();
    renderChartTimes();
    renderChartEvolucao();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }

})();