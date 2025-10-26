// estatisticas-eixos.js - Gerenciador de Estatísticas por Eixo com Tooltips

// Definição dos Eixos e suas faixas de colunas
const EIXOS = {
    "eixo1": {
        nome: "Eixo 1 - Identificação da Escola",
        inicio: 0,
        fim: 16
    },
    "eixo2": {
        nome: "Eixo 2 - Estrutura Física e Funcionamento",
        inicio: 17,
        fim: 64
    },
    "eixo3": {
        nome: "Eixo 3 - Alunos",
        inicio: 65,
        fim: 85
    },
    "eixo4": {
        nome: "Eixo 4 - Professores",
        inicio: 86,
        fim: 90
    },
    "eixo5": {
        nome: "Eixo 5 - Gestão de Equipe",
        inicio: 91,
        fim: 98
    },
    "eixo6": {
        nome: "Eixo 6 - Pais e Comunidade",
        inicio: 99,
        fim: 104
    },
    "eixo7": {
        nome: "Eixo 7 - Questões Pedagógicas",
        inicio: 105,
        fim: 108
    },
    "eixo8": {
        nome: "Eixo 8 - Gestão Democrática",
        inicio: 109,
        fim: 116
    },
    "eixo9": {
        nome: "Eixo 9 - Documentos",
        inicio: 117,
        fim: 119
    },
    "eixo10": {
        nome: "Eixo 10 - Segurança da Escola",
        inicio: 120,
        fim: 122
    },
    "eixo11": {
        nome: "Eixo 11 - Violência e Indisciplina",
        inicio: 123,
        fim: 125
    },
    "eixo12": {
        nome: "Eixo 12 - Prestação de Contas",
        inicio: 126,
        fim: 135
    },
    "eixo13": {
        nome: "Eixo 13 - Experiência Inovadora",
        inicio: 136,
        fim: 137
    },
    "eixo14": {
        nome: "Eixo 14 - Objetivo da Gestão",
        inicio: 138,
        fim: 140
    }
};

// Gerenciador principal
const GerenciadorEixos = {
    csvCarregado: false,
    graficosAtivos: [],
    colunaEscola: null, // Guarda qual coluna tem o nome da escola

    /**
     * Inicializa o sistema
     */
    async init() {
        try {
            console.log('Iniciando sistema de estatísticas por eixo...');

            // Carrega o CSV usando o módulo Estatisticas
            await Estatisticas.initCSV('data/projeto_monitor.csv');
            this.csvCarregado = true;

            // Detecta qual coluna tem o nome da escola
            this.detectarColunaEscola();

            // Popula o seletor de eixos
            this.popularSeletorEixos();

            // Configura eventos
            this.configurarEventos();

            console.log('Sistema inicializado com sucesso!');

        } catch (error) {
            console.error('Erro ao inicializar:', error);
            this.mostrarErro('Erro ao carregar os dados. Verifique o console para mais detalhes.');
        }
    },

    /**
     * Detecta qual coluna contém o nome da escola
     */
    detectarColunaEscola() {
        const headers = Estatisticas.getHeaders();

        // Busca por palavras-chave comuns para identificar a coluna da escola
        const palavrasChave = ['escola', 'nome', 'unidade', 'instituicao', 'instituição'];

        for (let i = 0; i < headers.length; i++) {
            const header = headers[i].toLowerCase();
            if (palavrasChave.some(palavra => header.includes(palavra))) {
                this.colunaEscola = headers[i];
                console.log('Coluna da escola detectada:', this.colunaEscola);
                return;
            }
        }

        // Se não encontrou, usa a primeira coluna
        this.colunaEscola = headers[0];
        console.log('Usando primeira coluna como nome da escola:', this.colunaEscola);
    },

    /**
     * Obtém o mapeamento de respostas para escolas
     */
    obterEscolasPorResposta(nomeColuna) {
        const dados = Estatisticas.getDados();

        if (!dados || dados.length === 0) {
            console.error('Dados não disponíveis');
            return new Map();
        }

        const respostaParaEscolas = new Map();
        const separadorMultiplas = Estatisticas.separadorMultiplas || ';';
        const rotuloVazio = Estatisticas.rotuloVazio || '(Não informado)';

        dados.forEach((registro, index) => {
            let valor = registro[nomeColuna];
            const escola = registro[this.colunaEscola] || `Registro ${index + 1}`;

            // Trata valores vazios
            if (valor === null || valor === undefined || valor === '' || valor === 'null') {
                valor = rotuloVazio;
                if (!respostaParaEscolas.has(valor)) {
                    respostaParaEscolas.set(valor, []);
                }
                respostaParaEscolas.get(valor).push(escola);
                return;
            }

            const texto = String(valor).trim();

            // Múltiplas escolhas
            if (texto.includes(separadorMultiplas)) {
                texto.split(separadorMultiplas).forEach(part => {
                    const p = String(part).trim() || rotuloVazio;
                    if (!respostaParaEscolas.has(p)) {
                        respostaParaEscolas.set(p, []);
                    }
                    respostaParaEscolas.get(p).push(escola);
                });
            } else {
                const unico = texto || rotuloVazio;
                if (!respostaParaEscolas.has(unico)) {
                    respostaParaEscolas.set(unico, []);
                }
                respostaParaEscolas.get(unico).push(escola);
            }
        });

        return respostaParaEscolas;
    },

    /**
     * Popula o seletor de eixos
     */
    popularSeletorEixos() {
        const select = document.getElementById('eixoSelect');
        select.innerHTML = '<option value="">-- Selecione um Eixo --</option>';

        Object.keys(EIXOS).forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = EIXOS[key].nome;
            select.appendChild(option);
        });

        // Habilita o botão
        document.getElementById('btnGerarGraficos').disabled = false;
    },

    /**
     * Configura os event listeners
     */
    configurarEventos() {
        const btnGerar = document.getElementById('btnGerarGraficos');
        const selectEixo = document.getElementById('eixoSelect');

        btnGerar.addEventListener('click', () => {
            const eixoSelecionado = selectEixo.value;
            if (eixoSelecionado) {
                this.gerarGraficosEixo(eixoSelecionado);
            } else {
                alert('Por favor, selecione um eixo!');
            }
        });

        // Também permite gerar ao mudar a seleção (opcional)
        selectEixo.addEventListener('change', (e) => {
            if (e.target.value) {
                btnGerar.textContent = `Gerar Gráficos - ${EIXOS[e.target.value].nome}`;
            } else {
                btnGerar.textContent = 'Gerar Gráficos';
            }
        });
    },

    /**
     * Gera todos os gráficos de um eixo específico
     */
    async gerarGraficosEixo(eixoKey) {
        if (!this.csvCarregado) {
            alert('Dados ainda não foram carregados!');
            return;
        }

        const eixo = EIXOS[eixoKey];
        if (!eixo) {
            console.error('Eixo não encontrado:', eixoKey);
            return;
        }

        // Mostra loading
        this.mostrarLoading(true);

        // Limpa gráficos anteriores
        this.limparGraficos();

        // Pega os headers
        const headers = Estatisticas.getHeaders();

        // Filtra as colunas do eixo selecionado
        const colunasEixo = headers.slice(eixo.inicio, eixo.fim + 1);

        console.log(`Gerando gráficos para ${eixo.nome}`);
        console.log(`Colunas: ${colunasEixo.length} (índices ${eixo.inicio} a ${eixo.fim})`);

        const container = document.getElementById('graficosContainer');
        container.innerHTML = '';
        container.classList.remove('empty');

        // Adiciona título do eixo
        const tituloEixo = document.createElement('div');
        tituloEixo.className = 'card';
        tituloEixo.style.marginBottom = '20px';
        tituloEixo.innerHTML = `
            <h2><i class="fas fa-layer-group"></i> ${eixo.nome}</h2>
            <p><strong>Total de perguntas:</strong> ${colunasEixo.length}</p>
        `;
        container.appendChild(tituloEixo);

        // Aguarda um pouco para o DOM atualizar
        await new Promise(resolve => setTimeout(resolve, 100));

        // Gera os gráficos
        colunasEixo.forEach((coluna, index) => {
            this.criarGraficoParaColuna(coluna, index, container);
        });

        // Esconde loading
        this.mostrarLoading(false);

        // Scroll suave para os gráficos
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    /**
     * Cria os gráficos (pizza e barra) para uma coluna
     */
    criarGraficoParaColuna(coluna, index, container) {
        try {
            // Cria o container para este item
            const graficoItem = document.createElement('div');
            graficoItem.className = 'grafico-item';

            const idPizza = `grafico-pizza-${index}`;
            const idBarra = `grafico-barra-${index}`;

            graficoItem.innerHTML = `
                <h3>${coluna}</h3>
                <div class="grafico-container">
                    <div class="grafico-box">
                        <h4>Distribuição</h4>
                        <canvas id="${idPizza}"></canvas>
                    </div>
                    <div class="grafico-box">
                        <h4>Top 10 Valores</h4>
                        <canvas id="${idBarra}"></canvas>
                    </div>
                </div>
            `;

            container.appendChild(graficoItem);

            // Aguarda o DOM atualizar antes de plotar
            setTimeout(() => {
                this.plotarComTooltipCustomizado(coluna, idPizza, idBarra);
            }, 50);

        } catch (error) {
            console.error(`Erro ao criar gráfico para ${coluna}:`, error);
        }
    },

    /**
     * Plota os gráficos com tooltips customizados mostrando as escolas
     */
    plotarComTooltipCustomizado(column, pieCanvasId, barCanvasId) {
        if (!Estatisticas.dados) {
            console.error('CSV não foi carregado ainda');
            return;
        }

        if (!Estatisticas.headers || !Estatisticas.headers.includes(column)) {
            console.error(`Coluna "${column}" não encontrada no CSV`);
            return;
        }

        try {
            // Obtém o mapeamento de respostas para escolas
            const respostaParaEscolas = this.obterEscolasPorResposta(column);

            // Obtém os contadores normalmente
            const contadores = Estatisticas.contarValores(column);
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

            // Configuração de tooltip personalizado
            const tooltipConfig = {
                callbacks: {
                    title: function(context) {
                        return context[0].label;
                    },
                    label: function(context) {
                        const valor = context.parsed || context.parsed.y || context.raw;
                        return `Total: ${valor} escola${valor > 1 ? 's' : ''}`;
                    },
                    afterLabel: function(context) {
                        const label = context.label;
                        const escolas = respostaParaEscolas.get(label) || [];

                        if (escolas.length === 0) return '';

                        const linhas = ['\nEscolas:'];
                        const maxExibir = 10;
                        const escolasExibir = escolas.slice(0, maxExibir);

                        escolasExibir.forEach((escola, i) => {
                            linhas.push(`${i + 1}. ${escola}`);
                        });

                        if (escolas.length > maxExibir) {
                            linhas.push(`... e mais ${escolas.length - maxExibir}`);
                        }

                        return linhas;
                    }
                },
                displayColors: true,
                padding: 12,
                bodySpacing: 4,
                titleFont: { size: 14, weight: 'bold' },
                bodyFont: { size: 11 }
            };

            // Cria gráfico de pizza com tooltip customizado
            if (pieCanvasId) {
                const canvas = document.getElementById(pieCanvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');

                    if (Estatisticas.graficosAtivos[pieCanvasId]) {
                        Estatisticas.graficosAtivos[pieCanvasId].destroy();
                    }

                    Estatisticas.graficosAtivos[pieCanvasId] = new Chart(ctx, {
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
                                tooltip: tooltipConfig
                            }
                        }
                    });
                }
            }

            // Cria gráfico de barras (Top 10) com tooltip customizado
            if (barCanvasId) {
                const top10Labels = labels.slice(0, 10);
                const top10Valores = valores.slice(0, 10);

                const canvas = document.getElementById(barCanvasId);
                if (canvas) {
                    const ctx = canvas.getContext('2d');

                    if (Estatisticas.graficosAtivos[barCanvasId]) {
                        Estatisticas.graficosAtivos[barCanvasId].destroy();
                    }

                    Estatisticas.graficosAtivos[barCanvasId] = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: top10Labels,
                            datasets: [{
                                label: 'Quantidade',
                                data: top10Valores,
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
                                tooltip: tooltipConfig
                            }
                        }
                    });
                }
            }

            console.log(`Gráficos com tooltips gerados para "${column}"`);

        } catch (error) {
            console.error('Erro ao plotar coluna com tooltips:', error);
        }
    },

    /**
     * Limpa todos os gráficos anteriores
     */
    limparGraficos() {
        // Destroi os gráficos do Chart.js
        Object.values(Estatisticas.graficosAtivos).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });

        // Limpa o objeto de gráficos ativos
        Estatisticas.graficosAtivos = {};

        // Limpa o container
        const container = document.getElementById('graficosContainer');
        container.innerHTML = '';
    },

    /**
     * Mostra/esconde o overlay de loading
     */
    mostrarLoading(mostrar) {
        const overlay = document.getElementById('loadingOverlay');
        if (mostrar) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    },

    /**
     * Mostra mensagem de erro
     */
    mostrarErro(mensagem) {
        const container = document.getElementById('graficosContainer');
        container.innerHTML = `
            <div class="card" style="background: #f8d7da; color: #721c24; padding: 20px; text-align: center;">
                <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 10px;"></i>
                <p><strong>Erro:</strong> ${mensagem}</p>
            </div>
        `;
    }
};

// Inicializa quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado, inicializando gerenciador de eixos...');
    GerenciadorEixos.init();
});

// Também tenta inicializar se o DOM já estiver pronto
if (document.readyState === 'loading') {
    // Ainda carregando, o listener acima vai cuidar
} else {
    // DOM já está pronto
    console.log('DOM já estava pronto, inicializando gerenciador de eixos...');
    GerenciadorEixos.init();
}