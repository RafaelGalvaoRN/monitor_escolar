// estatisticas-main.js - Arquivo principal para inicializar os gráficos

// Caminho do seu CSV (ajuste conforme necessário)
const CSV_URL = `./data/projeto_monitor.csv?v=${Date.now()}`; // evita cache

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
  
      Estatisticas.plotColumn({
        column: colunaSelecionada,
        pieCanvasId: "graficoPizza1",
        barCanvasId: "graficoBarra1",
        titleElIds: { pie: "tituloGrafico1", bar: "tituloGrafico2" }
      });
  
      const stats = Estatisticas.gerarEstatisticas(colunaSelecionada);
      console.log("Estatísticas geradas:", stats);
      
      mostrarMensagem("Gráficos gerados com sucesso!", "success");
      
    } catch (error) {
      mostrarMensagem(`Erro ao gerar gráficos: ${error.message}`, "error");
      console.error("Erro detalhado:", error);
    }
  }

// Substitua toda a seção DOMContentLoaded por esta versão corrigida:

document.addEventListener("DOMContentLoaded", async () => {
    try {
      mostrarMensagem("Carregando dados...", "info");
  
      // 1) Carrega CSV
      await Estatisticas.initCSV(CSV_URL);
  
      // 2) Pega APENAS os headers/colunas (não os valores)
      let headers = Estatisticas.getHeaders() || [];
      
      console.log('Headers originais:', headers); // Debug
      
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
