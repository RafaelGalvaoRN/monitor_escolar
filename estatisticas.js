/* Cores dos gráficos seguem o tema do site (style/tema.css), inclusive no modo escuro */
function corDoTema(nome, reserva) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
  return v || reserva;
}
function corBordaGrafico() { return corDoTema('--surface', '#ffffff'); }
function aplicarTemaGraficos() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.font.family = 'Inter, "Segoe UI", system-ui, sans-serif';
  Chart.defaults.color = corDoTema('--muted', '#566776');
  Chart.defaults.borderColor = corDoTema('--line', '#d8e2e9');
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(8,44,72,.95)';
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.padding = 10;
  Chart.defaults.elements.bar.borderRadius = 6;
  const ativos = (window.Estatisticas && window.Estatisticas.graficosAtivos) || {};
  Object.values(ativos).forEach(g => {
    if (!g || !g.config) return;
    if (g.config.type === 'pie' || g.config.type === 'doughnut') g.data.datasets.forEach(d => { d.borderColor = corBordaGrafico(); });
    g.update();
  });
}

// estatisticas.js - Sistema de Análise de CSV (Ajustado)
function splitCSV(linha, separador = ',') {
    const resultado = [];
    let valor = '';
    let dentroDeAspas = false;
  
    for (let i = 0; i < linha.length; i++) {
      const char = linha[i];
      const prox = linha[i + 1];
  
      if (char === '"' && dentroDeAspas && prox === '"') {
        valor += '"'; // aspas duplas escapadas
        i++; // pula a próxima
      } else if (char === '"') {
        dentroDeAspas = !dentroDeAspas;
      } else if (char === separador && !dentroDeAspas) {
        resultado.push(valor);
        valor = '';
      } else {
        valor += char;
      }
    }
  
    resultado.push(valor); // último campo
    return resultado;
  }

  function toNumberIfPossible(valor) {
    const n = Number(valor);
    return isNaN(n) ? valor : n;
  }
  



// Objeto principal para encapsular todas as funcionalidades
const Estatisticas = {
    // Cache dos dados CSV
    dados: null,
    headers: null,
    graficosAtivos: {},
  
    // Configurações
    cores: [
      // paleta do tema (azul-petróleo e verde do projeto + cores de apoio)
      '#0d6fb0', '#12936b', '#e3a72f', '#5aa9e6', '#d9644a',
      '#7b5ea7', '#3cc996', '#0b4a6e', '#c98a2e', '#2bb3a3',
      '#b8505d', '#8bc34a', '#9fb1bf', '#566776', '#f0bd52'
    ],
    separadorMultiplas: ';',                // separador para respostas múltiplas
    rotuloVazio: '(Não informado)',         // rótulo para vazio/nulo
  
    /**
     * Inicializa e carrega o arquivo CSV
     * @param {string} csvUrl - URL do arquivo CSV
     */
    async initCSV(csvUrl) {
        try {
          console.log('Carregando CSV (sem PapaParse):', csvUrl);
          const resp = await fetch(csvUrl);
          if (!resp.ok) throw new Error(`Erro ao carregar CSV: ${resp.status}`);
      
          const csvText = await resp.text();
          const txt = csvText.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
          const linhas = txt.split('\n').filter(l => l.trim() !== '');
      
          if (linhas.length < 2) {
            throw new Error('CSV deve ter cabeçalho e ao menos uma linha de dados');
          }
      
          // Detecta separador
          const head = linhas[0];
          const sep = (head.split(';').length > head.split(',').length) ? ';' : ',';
          console.log(`Separador detectado: "${sep}"`);
      
          // Processa headers
          const headers = splitCSV(head, sep).map(h => h.trim().replace(/^"|"$/g, ''));
          console.log(`Headers encontrados: ${headers.length}`, headers);
      
          // Processa dados
          const rows = [];
          for (let i = 1; i < linhas.length; i++) {
            const parts = splitCSV(linhas[i], sep).map(v => v.trim().replace(/^"|"$/g, ''));
            if (!parts.length) continue;
      
            const row = {};
            headers.forEach((h, idx) => {
              row[h] = toNumberIfPossible(parts[idx]);
            });
            rows.push(row);
          }
      
          if (!rows.length) throw new Error('Nenhum dado válido encontrado');
      
          // Alimenta objeto Estatisticas
          this.dados = rows;
          this.headers = headers;
      
          console.log('Dados prontos para plotar:', rows.length, 'registros');
          console.log('Exemplo:', rows[0]);
      
        } catch (err) {
          console.error('Erro ao inicializar CSV:', err);
          throw err;
        }
      },
      
      
      
      
    /** Retorna os headers/colunas do CSV */
    getHeaders() {
      return this.headers;
    },
  
    /** Retorna os dados do CSV */
    getDados() {
      return this.dados;
    },
  
    /**
     * Conta os valores únicos de uma coluna (com suporte a múltiplas escolhas separadas por ;) 
     * @param {string} nomeColuna - Nome da coluna
     * @returns {Object} Objeto com contadores
     */
    contarValores(nomeColuna) {
        console.log(`Contando valores para: "${nomeColuna}"`);
        console.log('Dados disponíveis:', this.dados ? this.dados.length : 'NÃO');
      
        // dados carregados?
        if (!this.dados || this.dados.length === 0) {
          console.error('Dados CSV não carregados ou vazio');
          return {};
        }
      
        // resolver a chave real por trim (evita diferenças de espaços/aspas)
        const chaves = Object.keys(this.dados[0] || {});
        const alvo = chaves.find(k => k.trim() === String(nomeColuna).trim());
        if (!alvo) {
          console.error(`Coluna "${nomeColuna}" não existe nos dados`);
          console.log('Colunas disponíveis:', chaves);
          return {};
        }
      
        const contadores = {};
        let processados = 0;
      
        this.dados.forEach((registro, index) => {
          let valor = registro[alvo];               // <<< use a chave real
      
          if (index < 3) {
            console.log(`Registro ${index}, valor original:`, valor, typeof valor);
          }
      
          // trata vazios
          if (valor === null || valor === undefined || valor === '' || valor === 'null') {
            valor = this.rotuloVazio;
            contadores[valor] = (contadores[valor] || 0) + 1;
            processados++;
            return;
          }
      
          // normaliza texto
          const texto = String(valor).trim();
      
          // múltiplas escolhas
          if (texto.includes(this.separadorMultiplas)) {
            texto.split(this.separadorMultiplas).forEach(part => {
              const p = String(part).trim() || this.rotuloVazio;
              contadores[p] = (contadores[p] || 0) + 1;
              processados++;
            });
          } else {
            const unico = texto || this.rotuloVazio;
            contadores[unico] = (contadores[unico] || 0) + 1;
            processados++;
          }
        });
      
        console.log(`Contagem finalizada: ${processados} valores processados`);
        console.log('Resultado:', contadores);
      
        return contadores;
      },
      
  
    /**
     * Função principal para plotar gráficos de uma coluna
     * @param {Object} config - Configuração dos gráficos
     */
    plotColumn(config) {
      const {
        column,
        pieCanvasId,
        barCanvasId,
        titleElIds = {}
      } = config;
  
      if (!this.dados) {
        console.error('CSV não foi carregado ainda');
        return;
      }
  
      if (!this.headers || !this.headers.includes(column)) {
        console.error(`Coluna "${column}" não encontrada no CSV`);
        console.log('Colunas disponíveis:', this.headers);
        return;
      }
  
      try {
        const contadores = this.contarValores(column);
        const entries = Object.entries(contadores);
  
        if (entries.length === 0) {
          console.warn(`Nenhum dado encontrado para a coluna "${column}"`);
          return;
        }
  
        // Ordena por quantidade desc
        entries.sort((a, b) => b[1] - a[1]);
  
        const labels = entries.map(e => e[0]);
        const valores = entries.map(e => e[1]);
        const total = valores.reduce((sum, val) => sum + val, 0);
  
        // Atualiza títulos
        if (titleElIds.pie) {
          const titleEl = document.getElementById(titleElIds.pie);
          if (titleEl) titleEl.textContent = `${column} - Distribuição (Total: ${total})`;
        }
        if (titleElIds.bar) {
          const titleEl = document.getElementById(titleElIds.bar);
          if (titleEl) {
            const top = Math.min(10, labels.length);
            titleEl.textContent = `${column} - Top ${top} valores`;
          }
        }
  
        // Pie
        if (pieCanvasId) this.criarGraficoPizza(pieCanvasId, labels, valores, total);
  
        // Barras (Top 10)
        if (barCanvasId) {
          const top10Labels = labels.slice(0, 10);
          const top10Valores = valores.slice(0, 10);
          this.criarGraficoBarras(barCanvasId, top10Labels, top10Valores);
        }
  
        console.log(`Gráficos gerados para "${column}":`, {
          total,
          valoresUnicos: labels.length,
          valorMaisComum: labels[0],
          quantidadeMaisComum: valores[0]
        });
  
      } catch (error) {
        console.error('Erro ao plotar coluna:', error);
      }
    },
  
    /** Cria gráfico de pizza */
    criarGraficoPizza(canvasId, labels, valores, total) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`Canvas "${canvasId}" não encontrado`);
        return;
      }
      const ctx = canvas.getContext('2d');
  
      if (this.graficosAtivos[canvasId]) this.graficosAtivos[canvasId].destroy();
  
      this.graficosAtivos[canvasId] = new Chart(ctx, {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: valores,
            backgroundColor: this.cores.slice(0, labels.length),
            borderColor: corBordaGrafico(),
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 10, usePointStyle: true, font: { size: 12 } }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const v = context.parsed;
                  const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
                  return `${context.label}: ${v} (${pct}%)`;
                }
              }
            }
          }
        }
      });
    },
  
    /** Cria gráfico de barras */
    criarGraficoBarras(canvasId, labels, valores) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) {
        console.error(`Canvas "${canvasId}" não encontrado`);
        return;
      }
      const ctx = canvas.getContext('2d');
  
      if (this.graficosAtivos[canvasId]) this.graficosAtivos[canvasId].destroy();
  
      this.graficosAtivos[canvasId] = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Quantidade',
            data: valores,
            backgroundColor: this.cores[0],
            borderColor: this.cores[0],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1 } },
            x: { ticks: { maxRotation: 45, font: { size: 11 } } }
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `${context.label}: ${context.parsed.y}`;
                }
              }
            }
          }
        }
      });
    },
  
    /**
     * Gera estatísticas resumidas de uma coluna
     * @param {string} nomeColuna
     * @returns {Object}
     */
    gerarEstatisticas(nomeColuna) {
      const contadores = this.contarValores(nomeColuna);
      const entries = Object.entries(contadores).sort((a, b) => b[1] - a[1]);
      const total = Object.values(contadores).reduce((sum, val) => sum + val, 0);
  
      return {
        total,
        valoresUnicos: entries.length,
        valorMaisComum: entries[0] ? entries[0][0] : null,
        quantidadeMaisComum: entries[0] ? entries[0][1] : 0,
        distribuicao: contadores
      };
    }
  };
  
  // Disponibiliza globalmente
  window.Estatisticas = Estatisticas;
  aplicarTemaGraficos();
  document.addEventListener('tema:alterado', aplicarTemaGraficos);
  