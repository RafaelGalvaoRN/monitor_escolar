// estatisticas-main.js - Arquivo principal para inicializar os gráficos

// Caminho do seu CSV (ajuste conforme necessário)
const CSV_URL = `./data/projeto_monitor.csv?v=${Date.now()}`; // evita cache

// CONFIGURAÇÃO: Nome da coluna que contém os nomes das escolas
// Mude isso para o nome exato da coluna no seu CSV que tem os nomes das escolas
const NOME_COLUNA_ESCOLA = "Nome da Escola"; // <<< AJUSTE AQUI!

// Colunas que você quer oferecer no seletor (fallback caso o CSV não carregue)
const COLUNAS_INICIAIS = [
  "Água potável disponível e regular",
  "Banheiros em quantidade/condição adequada ",
  "Acessibilidade (rampas, banheiros PCD, sinalização) ",
  "Salas em condições (iluminação, ventilação, mobiliário) ",
  "Manutenção preventiva/corretiva realizada ",
  "Saídas de emergência/rotas/PPCI/brigada ",
  "Docentes habilitados nas disciplinas/etapas",
  "Quadro de professores suficiente"
];

function mostrarMensagem(mensagem, tipo = "info") {
  console.log(`[${tipo.toUpperCase()}] ${mensagem}`);
}

function preencherSeletor(colunas) {
  const select = document.getElementById("colunaSelect");
  if (!select) {
    console.error("Elemento colunaSelect não encontrado");
    return;
  }
  select.innerHTML = '<option value="">Selecione uma coluna...</option>';
  colunas.forEach((coluna) => {
    const option = document.createElement("option");
    option.value = coluna;
    option.textContent = coluna;
    select.appendChild(option);
  });
  if (colunas.length > 0) select.value = colunas[0];
}

function plotarColuna() {
    const select = document.getElementById("colunaSelect");
    if (!select || !select.value) {
      mostrarMensagem("Selecione uma coluna para plotar", "warning");
      return;
    }
  
    const colunaSelecionada = select.value;
    console.log(`Plotando coluna: "${colunaSelecionada}"`); // Debug
    
    mostrarMensagem(`Gerando gráficos para: ${colunaSelecionada}`, "info");
  
    try {
      // Verifica se os elementos canvas existem
      const pieCanvas = document.getElementById("graficoPizza1");
      const barCanvas = document.getElementById("graficoBarra1");
      
      if (!pieCanvas) {
        throw new Error("Canvas 'graficoPizza1' não encontrado");
      }
      if (!barCanvas) {
        throw new Error("Canvas 'graficoBarra1' não encontrado");
      }
      
      console.log('Canvas encontrados, plotando...'); // Debug
  
      // VERSÃO SIMPLES: Sobrescreve a função original para incluir escolas
      plotColumnComEscolas(colunaSelecionada);
  
      const stats = Estatisticas.gerarEstatisticas(colunaSelecionada);
      console.log("Estatísticas geradas:", stats);
      
      mostrarMensagem("Gráficos gerados com sucesso!", "success");
      
    } catch (error) {
      mostrarMensagem(`Erro ao gerar gráficos: ${error.message}`, "error");
      console.error("Erro detalhado:", error);
    }
}

/**
 * Versão modificada que inclui escolas nos tooltips
 * Funciona com o estatisticas.js original
 */
function plotColumnComEscolas(column) {
  if (!Estatisticas.dados) {
    console.error('CSV não foi carregado ainda');
    return;
  }

  if (!Estatisticas.headers || !Estatisticas.headers.includes(column)) {
    console.error(`Coluna "${column}" não encontrada no CSV`);
    console.log('Colunas disponíveis:', Estatisticas.headers);
    return;
  }

  try {
    // Detecta coluna de escola
    const colunaEscola = detectarColunaEscola();
    console.log('Coluna de escola detectada:', colunaEscola);

    // Conta valores E coleta escolas
    const dadosCompletos = contarValoresComEscolas(column, colunaEscola);
    const entries = Object.entries(dadosCompletos);

    if (entries.length === 0) {
      console.warn(`Nenhum dado encontrado para a coluna "${column}"`);
      return;
    }

    // Ordena por quantidade desc
    entries.sort((a, b) => b[1].count - a[1].count);

    const labels = entries.map(e => e[0]);
    const valores = entries.map(e => e[1].count);
    const escolasPorValor = entries.map(e => e[1].escolas);
    const total = valores.reduce((sum, val) => sum + val, 0);

    // Atualiza títulos
    const titleEl1 = document.getElementById("tituloGrafico1");
    if (titleEl1) titleEl1.textContent = `${column} - Distribuição (Total: ${total})`;
    
    const titleEl2 = document.getElementById("tituloGrafico2");
    if (titleEl2) {
      const top = Math.min(10, labels.length);
      titleEl2.textContent = `${column} - Top ${top} valores`;
    }

    // Cria gráficos com escolas
    criarGraficoPizzaComEscolas("graficoPizza1", labels, valores, escolasPorValor, total);
    
    // Barras (Top 10)
    const top10Labels = labels.slice(0, 10);
    const top10Valores = valores.slice(0, 10);
    const top10Escolas = escolasPorValor.slice(0, 10);
    criarGraficoBarrasComEscolas("graficoBarra1", top10Labels, top10Valores, top10Escolas);

  } catch (error) {
    console.error('Erro ao plotar coluna:', error);
  }
}

/**
 * Detecta qual coluna tem os nomes das escolas
 */
function detectarColunaEscola() {
  const headers = Estatisticas.getHeaders();
  if (!headers) return null;

  // 1. Tenta usar o nome configurado
  if (NOME_COLUNA_ESCOLA && headers.includes(NOME_COLUNA_ESCOLA)) {
    return NOME_COLUNA_ESCOLA;
  }

  // 2. Busca parcial
  if (NOME_COLUNA_ESCOLA) {
    const parcial = headers.find(h => 
      h.toLowerCase().includes(NOME_COLUNA_ESCOLA.toLowerCase())
    );
    if (parcial) return parcial;
  }

  // 3. Detecção automática
  const palavrasEscola = [
    'escola', 'colégio', 'colegio', 'instituição', 'instituicao', 
    'unidade', 'estabelecimento', 'nome da escola', 'nome escola'
  ];
  
  const encontrada = headers.find(header => {
    const headerLower = header.toLowerCase();
    return palavrasEscola.some(palavra => headerLower.includes(palavra));
  });

  // 4. Se não achou, usa primeira coluna
  return encontrada || headers[0];
}

/**
 * Conta valores e coleta escolas (versão compatível)
 */
function contarValoresComEscolas(nomeColuna, colunaEscola) {
  const dados = Estatisticas.getDados();
  if (!dados || dados.length === 0) return {};

  const chaves = Object.keys(dados[0] || {});
  const alvo = chaves.find(k => k.trim() === String(nomeColuna).trim());
  if (!alvo) return {};

  const resultado = {};

  dados.forEach((registro, index) => {
    let valor = registro[alvo];
    const nomeEscola = colunaEscola ? 
      (registro[colunaEscola] || `Escola ${index + 1}`) : 
      `Registro ${index + 1}`;

    // Trata vazios
    if (valor === null || valor === undefined || valor === '' || valor === 'null') {
      valor = Estatisticas.rotuloVazio;
    } else {
      valor = String(valor).trim();
    }

    // Múltiplas escolhas
    if (valor.includes(Estatisticas.separadorMultiplas)) {
      valor.split(Estatisticas.separadorMultiplas).forEach(part => {
        const p = String(part).trim() || Estatisticas.rotuloVazio;
        if (!resultado[p]) resultado[p] = { count: 0, escolas: [] };
        resultado[p].count++;
        resultado[p].escolas.push(nomeEscola);
      });
    } else {
      const unico = valor || Estatisticas.rotuloVazio;
      if (!resultado[unico]) resultado[unico] = { count: 0, escolas: [] };
      resultado[unico].count++;
      resultado[unico].escolas.push(nomeEscola);
    }
  });

  return resultado;
}

/**
 * Cria gráfico pizza com escolas (versão compatível)
 */
function criarGraficoPizzaComEscolas(canvasId, labels, valores, escolasPorValor, total) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (Estatisticas.graficosAtivos[canvasId]) {
    Estatisticas.graficosAtivos[canvasId].destroy();
  }

  Estatisticas.graficosAtivos[canvasId] = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data: valores,
        backgroundColor: Estatisticas.cores.slice(0, labels.length),
        borderColor: '#fff',
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
            label: (context) => {
              const v = context.parsed;
              const pct = total ? ((v / total) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${v} (${pct}%)`;
            },
            afterLabel: (context) => {
              const escolas = escolasPorValor[context.dataIndex] || [];
              if (escolas.length === 0) return '';
              
              const escolasUnicas = [...new Set(escolas)];
              const maxEscolas = 8;
              
              let resultado = ['', 'Escolas:'];
              
              if (escolasUnicas.length <= maxEscolas) {
                resultado.push(...escolasUnicas.map(escola => `• ${escola}`));
              } else {
                resultado.push(...escolasUnicas.slice(0, maxEscolas).map(escola => `• ${escola}`));
                resultado.push(`• ... e mais ${escolasUnicas.length - maxEscolas} escola(s)`);
              }
              
              return resultado;
            }
          }
        }
      }
    }
  });
}

/**
 * Cria gráfico barras com escolas (versão compatível)
 */
function criarGraficoBarrasComEscolas(canvasId, labels, valores, escolasPorValor) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  if (Estatisticas.graficosAtivos[canvasId]) {
    Estatisticas.graficosAtivos[canvasId].destroy();
  }

  Estatisticas.graficosAtivos[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Quantidade',
        data: valores,
        backgroundColor: Estatisticas.cores[0],
        borderColor: Estatisticas.cores[0],
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
            label: (context) => {
              return `${context.label}: ${context.parsed.y}`;
            },
            afterLabel: (context) => {
              const escolas = escolasPorValor[context.dataIndex] || [];
              if (escolas.length === 0) return '';
              
              const escolasUnicas = [...new Set(escolas)];
              const maxEscolas = 8;
              
              let resultado = ['', 'Escolas:'];
              
              if (escolasUnicas.length <= maxEscolas) {
                resultado.push(...escolasUnicas.map(escola => `• ${escola}`));
              } else {
                resultado.push(...escolasUnicas.slice(0, maxEscolas).map(escola => `• ${escola}`));
                resultado.push(`• ... e mais ${escolasUnicas.length - maxEscolas} escola(s)`);
              }
              
              return resultado;
            }
          }
        }
      }
    }
  });
}

// Resto do código original
document.addEventListener("DOMContentLoaded", async () => {
    try {
      mostrarMensagem("Carregando dados...", "info");
  
      // 1) Carrega CSV
      await Estatisticas.initCSV(CSV_URL);
  
      // 2) Pega APENAS os headers/colunas (não os valores)
      let headers = Estatisticas.getHeaders() || [];
      
      console.log('Headers originais:', headers); // Debug
      console.log('Coluna de escola será:', detectarColunaEscola()); // Debug
      
      // 3) Limpa e filtra headers
      let colunas = headers
        .map(h => (h == null ? "" : String(h).trim()))
        .filter(h => {
          // Remove strings vazias
          if (h.length === 0) return false;
          
          // Remove "Carimbo de data/hora" 
          if (/^carimbo de data\/hora$/i.test(h)) return false;
          
          // Remove números puros (como "5", "6", etc.)
          if (/^\d+$/.test(h)) return false;
          
          // Remove respostas simples típicas
          if (/^(sim|não|nao)$/i.test(h)) return false;
          
          // Remove anos
          if (/^20\d{2}$/.test(h)) return false;
          
          // Mantém apenas o que parece ser pergunta/coluna
          return true;
        });
      
      // 4) Remove duplicados
      colunas = [...new Set(colunas)];
      
      console.log('Colunas filtradas:', colunas); // Debug
  
      // 5) Se não sobrou nada, usa fallback
      if (colunas.length === 0) {
        colunas = COLUNAS_INICIAIS;
        mostrarMensagem("Usando colunas padrão - problema na detecção", "warning");
      }
  
      // 6) Preenche seletor
      preencherSeletor(colunas);
      mostrarMensagem(`CSV carregado! ${colunas.length} colunas encontradas.`, "success");
  
      // 7) Plota o primeiro gráfico
      const selectEl = document.getElementById("colunaSelect");
      if (selectEl && selectEl.value) {
        setTimeout(() => {
          console.log('Tentando plotar:', selectEl.value); // Debug
          plotarColuna();
        }, 500);
      }
      
    } catch (error) {
      console.error("Erro ao carregar CSV:", error);
      mostrarMensagem(`ERRO: ${error.message}`, "error");
      
      // Fallback
      preencherSeletor(COLUNAS_INICIAIS);
      mostrarMensagem("Usando modo fallback", "warning");
    }
  
    // Configura eventos
    const btnPlotar = document.getElementById("btnPlotar");
    if (btnPlotar) {
      btnPlotar.addEventListener("click", () => {
        console.log('Botão plotar clicado'); // Debug
        plotarColuna();
      });
    }
  
    const selectEl = document.getElementById("colunaSelect");
    if (selectEl) {
      selectEl.addEventListener("change", () => {
        console.log('Select mudou para:', selectEl.value); // Debug
        if (selectEl.value) plotarColuna();
      });
    }
});

// Expor utilidades, se quiser chamar pelo console
window.plotarColuna = plotarColuna;
window.preencherSeletor = preencherSeletor;