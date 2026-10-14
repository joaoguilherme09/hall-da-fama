// ─── CHARTS.JS ─────────────────────────────────────────────────────────────
// Depende de: data/data.js (DATA) + Chart.js (CDN) + chartjs-plugin-datalabels (CDN)
// No index.html, antes de </body>:
//   <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
//   <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2"></script>
//   <script src="data/data.js"></script>
//   <script src="js/charts.js"></script>
//
// Seção HTML esperada (abaixo de #ranking) — 5 cartões, cada um com um
// <div class="chart-canvas-wrap" style="height:XXXpx"> em volta do <canvas>,
// porque Chart.js precisa de um contêiner com altura fixa para saber até
// onde desenhar (ver css/style.css: .chart-canvas-wrap):
//
// <section id="graficos">
//   ...
//   <div class="charts-grid">
//     <div class="chart-card"><div class="chart-canvas-wrap" style="height:420px"><canvas id="chartJogadores"></canvas></div></div>
//     <div class="chart-card"><div class="chart-canvas-wrap" style="height:420px"><canvas id="chartCampeonatos"></canvas></div></div>
//     <div class="chart-card"><div class="chart-canvas-wrap" style="height:360px"><canvas id="chartTimes"></canvas></div></div>
//     <div class="chart-card"><div class="chart-canvas-wrap" style="height:360px"><canvas id="chartEvolucao"></canvas></div></div>
//     <div class="chart-card chart-wide"><div class="chart-canvas-wrap" style="height:360px"><canvas id="chartNovosCampeoes"></canvas></div></div>
//   </div>
// </section>
// ───────────────────────────────────────────────────────────────────────────

(function () {

  Chart.register(ChartDataLabels);

  // ── Cores ─────────────────────────────────────────────
  // ACCENT é só para texto de chrome (títulos dos cartões) — mantém o fio
  // condutor com o resto do site. As barras/linhas usam cores "normais",
  // uma por gráfico, para cada estatística ter identidade própria.
  const ACCENT  = '#FF2EC4';
  const TEXT    = '#EDE9FA';
  const MUTED   = '#808A9D';   // cinza neutro — barras "fora do pódio"
  const SURFACE = '#141827';
  const BORDER  = 'rgba(255,46,196,0.14)';

  const GOLD    = '#BF8A05';   // 1º lugar
  const SILVER  = '#A7AEBD';   // 2º lugar
  const BRONZE  = '#8B5A2B';   // 3º lugar
  const BLUE    = '#2E6FEE';   // campeonatos
  const TEAL    = '#11A693';   // times
  const ORANGE  = '#CE7D12';   // evolução / títulos no mês
  const VIOLET  = '#8558F2';   // novos campeões no mês

  // ── Defaults globais ────────────────────────────────
  Chart.defaults.color = TEXT;
  Chart.defaults.font.family = "'Barlow Condensed', sans-serif";
  Chart.defaults.font.size = 13;
  Chart.defaults.plugins.datalabels = { display: false }; // opt-in por gráfico

  const gridStyle = { color: BORDER, lineWidth: 1 };

  const tooltipStyle = {
    backgroundColor: SURFACE,
    borderColor: BORDER,
    borderWidth: 1,
    titleColor: ACCENT,
    bodyColor: TEXT,
    padding: 10,
    cornerRadius: 4,
    titleFont: { family: "'Bebas Neue', cursive", size: 15 }
  };

  const cardTitle = (text) => ({
    display: true,
    text,
    color: ACCENT,
    font: { family: "'Bebas Neue', cursive", size: 18 },
    padding: { bottom: 16 }
  });

  // Rótulo de valor na ponta da barra — texto neutro, nunca na cor da série
  // (a cor é só da marca; o texto é sempre um "text token").
  const tipLabel = {
    display: true,
    color: TEXT,
    anchor: 'end',
    align: 'end',
    offset: 4,
    font: { family: "'Barlow Condensed', sans-serif", weight: '700', size: 12 }
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

  function monthKey(dateStr) { return dateStr.slice(0, 7); } // "AAAA-MM"

  function monthLabel(key) {
    const [y, m] = key.split('-');
    return new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
  }

  // Primeiro título de cada jogador — define em que mês ele "estreou"
  function firstTitleMonthByPlayer() {
    const first = {};
    DATA.titulos.forEach(t => {
      if (!first[t.jogador_id] || t.data < first[t.jogador_id]) first[t.jogador_id] = t.data;
    });
    const map = {};
    Object.values(first).forEach(dateStr => {
      const key = monthKey(dateStr);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  // Fade de opacidade por posição — reforça visualmente o ranking além do
  // comprimento da barra (rampa ordinal de um único tom, ver dataviz skill)
  function fadeByRank(hexRgb, count, minAlpha = 0.35) {
    return Array.from({ length: count }, (_, i) =>
      `rgba(${hexRgb},${Math.max(minAlpha, 1 - i * ((1 - minAlpha) / Math.max(1, count - 1)))})`
    );
  }

  // ── 1. Títulos por Jogador (barras horizontais) ──────
  function renderChartJogadores() {
    const entries = sortedEntries(countBy('jogador_id'));
    const labels  = entries.map(([id]) => getPlayer(parseInt(id))?.nome || '?');
    const values  = entries.map(([, v]) => v);
    const colors  = entries.map((_, i) => {
      if (i === 0) return GOLD;
      if (i === 1) return SILVER;
      if (i === 2) return BRONZE;
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
          borderRadius: 4,
          maxBarThickness: 22,
          datalabels: tipLabel
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: cardTitle('TÍTULOS POR JOGADOR')
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED, precision: 0 },
            border: { color: BORDER },
            grace: '12%'
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

  // ── 2. Títulos por Campeonato (barras horizontais) ───
  // Doze campeonatos num donut viravam fatias ilegíveis — um ranking em
  // barra mostra a mesma informação muito mais claro.
  function renderChartCampeonatos() {
    const entries = sortedEntries(countBy('campeonato_id'));
    const labels  = entries.map(([id]) => getCamp(parseInt(id))?.nome || '?');
    const values  = entries.map(([, v]) => v);
    const colors  = fadeByRank('46,111,238', labels.length);

    new Chart(document.getElementById('chartCampeonatos'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Títulos',
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
          maxBarThickness: 22,
          datalabels: tipLabel
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: cardTitle('TÍTULOS POR CAMPEONATO')
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED, precision: 0 },
            border: { color: BORDER },
            grace: '12%'
          },
          y: {
            grid: { display: false },
            ticks: { color: TEXT, font: { size: 11.5 } },
            border: { color: BORDER }
          }
        }
      }
    });
  }

  // ── 3. Títulos por Time (barras horizontais) ─────────
  // Muitos times têm 1 título só — mostrar os 38 um a um virava uma parede
  // de barrinhas idênticas. Top 10 + "Outros" conta a mesma história melhor.
  function renderChartTimes() {
    const entries = sortedEntries(countBy('time_id'));
    const TOP_N   = 10;
    const top     = entries.slice(0, TOP_N);
    const rest    = entries.slice(TOP_N);
    const restSum = rest.reduce((sum, [, v]) => sum + v, 0);

    const labels = top.map(([id]) => getTime(parseInt(id))?.nome || '?');
    const values = top.map(([, v]) => v);
    const colors = fadeByRank('17,166,147', top.length);

    if (rest.length > 0) {
      labels.push(`Outros times (${rest.length})`);
      values.push(restSum);
      colors.push(MUTED);
    }

    new Chart(document.getElementById('chartTimes'), {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Títulos',
          data: values,
          backgroundColor: colors,
          borderRadius: 4,
          maxBarThickness: 22,
          datalabels: tipLabel
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 18 } },
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: cardTitle('TÍTULOS POR TIME (TOP 10)')
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED, precision: 0 },
            border: { color: BORDER },
            grace: '12%'
          },
          y: {
            grid: { display: false },
            ticks: { color: TEXT, font: { size: 11.5 } },
            border: { color: BORDER }
          }
        }
      }
    });
  }

  // ── 4. Evolução acumulada de títulos (linha, 1 eixo) ─
  // Antes dividia acumulado e "por mês" em dois eixos Y na mesma linha —
  // escalas diferentes numa mesma régua inventam uma correlação que não
  // existe. Agora é só o acumulado, de verdade comparável ponto a ponto;
  // o "por mês" virou o gráfico de barras ao lado (nº 5).
  function renderChartEvolucao() {
    const monthMap = countByMonth();
    const months   = Object.keys(monthMap).sort();
    const labels   = months.map(monthLabel);

    let acc = 0;
    const accumulated = months.map(k => { acc += monthMap[k]; return acc; });

    new Chart(document.getElementById('chartEvolucao'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Total de títulos',
          data: accumulated,
          borderColor: ORANGE,
          backgroundColor: 'rgba(206,125,18,0.1)',
          borderWidth: 2,
          pointBackgroundColor: ORANGE,
          pointBorderColor: SURFACE,
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.35,
          datalabels: {
            display: (ctx) => ctx.dataIndex === ctx.dataset.data.length - 1,
            color: ORANGE,
            align: 'top',
            offset: 6,
            font: { family: "'Bebas Neue', cursive", size: 15 }
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 10, right: 14 } },
        plugins: {
          legend: { display: false },
          tooltip: { ...tooltipStyle },
          title: cardTitle('EVOLUÇÃO DO TOTAL DE TÍTULOS')
        },
        scales: {
          x: {
            grid: gridStyle,
            ticks: { color: MUTED },
            border: { color: BORDER }
          },
          y: {
            grid: gridStyle,
            ticks: { color: MUTED, precision: 0 },
            border: { color: BORDER },
            grace: '10%'
          }
        }
      }
    });
  }

  // ── 5. Títulos x Campeões novos, por mês (barras) ────
  // A pergunta por trás do pedido: dos títulos do mês, quantos são de gente
  // que nunca tinha vencido antes? As duas métricas são "contagem por mês"
  // — mesma unidade, mesmo eixo, nada de dual-axis.
  function renderChartNovosCampeoes() {
    const totalMap = countByMonth();
    const newMap   = firstTitleMonthByPlayer();
    const months   = Array.from(new Set([...Object.keys(totalMap), ...Object.keys(newMap)])).sort();
    const labels   = months.map(monthLabel);

    new Chart(document.getElementById('chartNovosCampeoes'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Títulos no mês',
            data: months.map(k => totalMap[k] || 0),
            backgroundColor: ORANGE,
            borderRadius: 4,
            maxBarThickness: 26
          },
          {
            label: 'Campeões novos no mês',
            data: months.map(k => newMap[k] || 0),
            backgroundColor: VIOLET,
            borderRadius: 4,
            maxBarThickness: 26
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 6 } },
        plugins: {
          legend: {
            position: 'top',
            align: 'end',
            labels: { color: TEXT, usePointStyle: true, pointStyleWidth: 10, boxHeight: 8 }
          },
          tooltip: { ...tooltipStyle },
          title: cardTitle('TÍTULOS E CAMPEÕES NOVOS POR MÊS')
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: MUTED },
            border: { color: BORDER }
          },
          y: {
            grid: gridStyle,
            ticks: { stepSize: 1, color: MUTED, precision: 0 },
            border: { color: BORDER },
            grace: '12%'
          }
        }
      }
    });
  }

  // Títulos agrupados por mês (todas as edições, independente do jogador)
  function countByMonth() {
    const map = {};
    DATA.titulos.forEach(t => {
      const key = monthKey(t.data);
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }

  // ── Init ─────────────────────────────────────────────
  function initCharts() {
    renderChartJogadores();
    renderChartCampeonatos();
    renderChartTimes();
    renderChartEvolucao();
    renderChartNovosCampeoes();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCharts);
  } else {
    initCharts();
  }

})();
