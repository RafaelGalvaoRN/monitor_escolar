// Variáveis globais
let dadosEscolares = [];
let dadosFiltrados = [];
let ordemAtual = { coluna: null, ascendente: true };

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    carregarCSV();
});

function carregarCSV() {
    // Mostrar loading
    document.getElementById('status').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando dados do CSV...';

    // Nome do arquivo CSV na raiz do projeto
    const arquivoCSV = 'dados_escolares.csv';

    // Usar fetch para carregar o arquivo CSV
    fetch(arquivoCSV)
        .then(response => {
            if (!response.ok) {
                throw new Error('Arquivo CSV não encontrado');
            }
            return response.text();
        })
        .then(csvText => {
            // Processar o CSV manualmente
            const linhas = csvText.trim().split('\n');
            if (linhas.length < 2) {
                throw new Error('CSV deve ter pelo menos 2 linhas (cabeçalho + dados)');
            }

            // Primeira linha são os cabeçalhos
            const cabecalhos = linhas[0].split(',').map(h => h.trim().replace(/"/g, ''));

            // Processar as linhas de dados
            dadosEscolares = [];
            for (let i = 1; i < linhas.length; i++) {
                const valores = linhas[i].split(',').map(v => v.trim().replace(/"/g, ''));

                if (valores.length === cabecalhos.length) {
                    const registro = {};
                    cabecalhos.forEach((cabecalho, index) => {
                        let valor = valores[index];

                        // Tentar converter para número se possível
                        if (valor && !isNaN(valor) && valor !== '') {
                            valor = parseFloat(valor);
                        }

                        registro[cabecalho] = valor;
                    });
                    dadosEscolares.push(registro);
                }
            }

            if (dadosEscolares.length === 0) {
                throw new Error('Nenhum dado válido encontrado no CSV');
            }

            dadosFiltrados = [...dadosEscolares];

            // Inicializar a interface
            inicializarFiltros();
            criarCabecalhoTabela();
            atualizarTabela();
            configurarEventos();

        })
        .catch(error => {
            console.error('Erro ao carregar CSV:', error);
            document.getElementById('status').innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Erro: ${error.message}.
                Verifique se o arquivo "dados_escolares.csv" está na raiz do projeto.
            `;

            // Usar dados de exemplo se não conseguir carregar o CSV
            usarDadosExemplo();
        });
}

function usarDadosExemplo() {
    console.log('Usando dados de exemplo...');

    // Dados de fallback
    dadosEscolares = [
        { escola: "E.E. João Silva", municipio: "São Paulo", nota: 8.2, alunos: 450, professores: 25, aprovacao: 92.5 },
        { escola: "E.M. Maria Santos", municipio: "Rio de Janeiro", nota: 7.8, alunos: 320, professores: 18, aprovacao: 89.3 },
        { escola: "Colégio Esperança", municipio: "Belo Horizonte", nota: 9.1, alunos: 280, professores: 22, aprovacao: 96.7 },
        { escola: "E.E. Pedro Álvares", municipio: "São Paulo", nota: 6.9, alunos: 520, professores: 28, aprovacao: 85.2 },
        { escola: "E.M. Ana Costa", municipio: "Salvador", nota: 7.5, alunos: 380, professores: 20, aprovacao: 88.1 },
        { escola: "Instituto Educacional", municipio: "Brasília", nota: 8.7, alunos: 240, professores: 16, aprovacao: 94.3 },
        { escola: "E.E. Carlos Drummond", municipio: "Rio de Janeiro", nota: 8.0, alunos: 410, professores: 24, aprovacao: 90.8 },
        { escola: "Escola Nova Geração", municipio: "Fortaleza", nota: 7.2, alunos: 360, professores: 19, aprovacao: 86.5 },
        { escola: "E.M. Clarice Lispector", municipio: "Recife", nota: 8.4, alunos: 300, professores: 17, aprovacao: 93.2 },
        { escola: "Colégio Futuro", municipio: "Porto Alegre", nota: 9.0, alunos: 220, professores: 15, aprovacao: 95.8 }
    ];

    dadosFiltrados = [...dadosEscolares];

    // Inicializar a interface
    inicializarFiltros();
    criarCabecalhoTabela();
    atualizarTabela();
    configurarEventos();

    // Atualizar status para mostrar que está usando dados de exemplo
    setTimeout(() => {
        document.getElementById('status').innerHTML =
            '<i class="fas fa-info-circle"></i> Usando dados de exemplo (arquivo CSV não encontrado)';
    }, 1000);
}

function inicializarFiltros() {
    if (dadosEscolares.length === 0) return;

    const colunas = Object.keys(dadosEscolares[0]);

    // Popular select de escolas (primeira coluna ou coluna que contenha "escola")
    const colunaEscola = colunas.find(col => col.toLowerCase().includes('escola')) || colunas[0];
    const escolas = [...new Set(dadosEscolares.map(d => d[colunaEscola]))].filter(e => e).sort();
    const selectEscola = document.getElementById('f-escola');
    selectEscola.innerHTML = '<option value="">Todas</option>';
    escolas.forEach(escola => {
        const option = document.createElement('option');
        option.value = escola;
        option.textContent = escola;
        selectEscola.appendChild(option);
    });

    // Popular select de municípios
    const colunaMunicipio = colunas.find(col => col.toLowerCase().includes('municipio')) ||
                           colunas.find(col => col.toLowerCase().includes('cidade')) ||
                           colunas[1];

    if (colunaMunicipio) {
        const municipios = [...new Set(dadosEscolares.map(d => d[colunaMunicipio]))].filter(m => m).sort();
        const selectMunicipio = document.getElementById('f-municipio');
        selectMunicipio.innerHTML = '<option value="">Todos</option>';
        municipios.forEach(municipio => {
            const option = document.createElement('option');
            option.value = municipio;
            option.textContent = municipio;
            selectMunicipio.appendChild(option);
        });
    }

    // Atualizar labels dos filtros baseado nas colunas do CSV
    if (colunaEscola) {
        const labelEscola = document.querySelector('label[for="f-escola"]');
        if (labelEscola) labelEscola.textContent = formatarNomeColuna(colunaEscola);
    }
    if (colunaMunicipio) {
        const labelMunicipio = document.querySelector('label[for="f-municipio"]');
        if (labelMunicipio) labelMunicipio.textContent = formatarNomeColuna(colunaMunicipio);
    }
}

function formatarNomeColuna(nomeColuna) {
  const minusculas = new Set([
    'de','da','do','das','dos','e','em','para','por',
    'a','o','as','os','no','na','nos','nas'
  ]);

  return nomeColuna
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('pt-BR')
    .split(' ')
    .map((w, i) => (minusculas.has(w) && i > 0)
      ? w
      : w.charAt(0).toLocaleUpperCase('pt-BR') + w.slice(1))
    .join(' ');
}

function criarCabecalhoTabela() {
    if (dadosEscolares.length === 0) return;

    const thead = document.getElementById('thead');
    thead.innerHTML = ''; // Limpar cabeçalho anterior

    // Obter colunas do primeiro registro
    const colunas = Object.keys(dadosEscolares[0]);

    const tr = document.createElement('tr');
    colunas.forEach(coluna => {
        const th = document.createElement('th');
        const label = formatarNomeColuna(coluna);
        th.innerHTML = `${label} <i class="fas fa-sort"></i>`;
        th.dataset.coluna = coluna;
        th.addEventListener('click', () => ordenarTabela(coluna));
        tr.appendChild(th);
    });
    thead.appendChild(tr);
}

function atualizarTabela() {
    const tbody = document.getElementById('tbody');
    tbody.innerHTML = '';

    if (dadosFiltrados.length === 0) {
        const numColunas = dadosEscolares.length > 0 ? Object.keys(dadosEscolares[0]).length : 6;
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="${numColunas}" style="text-align: center; padding: 40px; color: #6c757d;"><i class="fas fa-search"></i> Nenhum resultado encontrado</td>`;
        tbody.appendChild(tr);
        atualizarStatus(0);
        return;
    }

    dadosFiltrados.forEach(registro => {
        const tr = document.createElement('tr');

        Object.entries(registro).forEach(([coluna, valor]) => {
            const td = document.createElement('td');

            // Formatação especial para colunas específicas
            if (coluna.toLowerCase().includes('nota') && typeof valor === 'number') {
                td.innerHTML = formatarNota(valor);
            } else if (coluna.toLowerCase().includes('escola') && valor) {
                // Destacar nome da escola
                td.innerHTML = `<strong>${valor}</strong>`;
            } else if (typeof valor === 'number' && valor > 100) {
                // Para números grandes (como quantidade de alunos)
                td.textContent = valor.toLocaleString('pt-BR');
            } else if (typeof valor === 'number' && coluna.toLowerCase().includes('aprovacao')) {
                // Para percentuais
                td.textContent = valor.toFixed(1) + '%';
            } else {
                td.textContent = valor || '';
            }

            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    atualizarStatus(dadosFiltrados.length);
}

function formatarNota(nota) {
    let classe = 'baixa';
    if (nota >= 8) classe = 'alta';
    else if (nota >= 7) classe = 'media';

    return `<span class="nota ${classe}">${nota.toFixed(1)}</span>`;
}

function atualizarStatus(total) {
    const status = document.getElementById('status');
    status.textContent = `Exibindo ${total} de ${dadosEscolares.length} registros`;
}

function aplicarFiltros() {
    if (dadosEscolares.length === 0) return;

    const colunas = Object.keys(dadosEscolares[0]);
    const colunaEscola = colunas.find(col => col.toLowerCase().includes('escola')) || colunas[0];
    const colunaMunicipio = colunas.find(col => col.toLowerCase().includes('municipio')) ||
                           colunas.find(col => col.toLowerCase().includes('cidade')) ||
                           colunas[1];
    const colunaNota = colunas.find(col => col.toLowerCase().includes('nota'));

    const escolaSelecionada = document.getElementById('f-escola').value;
    const municipioSelecionado = document.getElementById('f-municipio').value;
    const notaMinima = parseFloat(document.getElementById('f-nota-min').value) || 0;
    const buscaLivre = document.getElementById('f-busca').value.toLowerCase().trim();

    dadosFiltrados = dadosEscolares.filter(registro => {
        // Filtro por escola
        if (escolaSelecionada && registro[colunaEscola] !== escolaSelecionada) {
            return false;
        }

        // Filtro por município
        if (municipioSelecionado && colunaMunicipio && registro[colunaMunicipio] !== municipioSelecionado) {
            return false;
        }

        // Filtro por nota mínima
        if (colunaNota && notaMinima > 0 && registro[colunaNota] < notaMinima) {
            return false;
        }

        // Busca livre (procura em todos os campos de texto)
        if (buscaLivre) {
            const textoCompleto = Object.values(registro)
                .filter(valor => typeof valor === 'string')
                .join(' ')
                .toLowerCase();

            if (!textoCompleto.includes(buscaLivre)) {
                return false;
            }
        }

        return true;
    });

    atualizarTabela();
}

function ordenarTabela(coluna) {
    // Alternar ordem se clicar na mesma coluna
    if (ordemAtual.coluna === coluna) {
        ordemAtual.ascendente = !ordemAtual.ascendente;
    } else {
        ordemAtual.coluna = coluna;
        ordemAtual.ascendente = true;
    }

    dadosFiltrados.sort((a, b) => {
        let valorA = a[coluna];
        let valorB = b[coluna];

        // Tratar valores nulos ou undefined
        if (valorA == null) valorA = '';
        if (valorB == null) valorB = '';

        // Comparação numérica
        if (typeof valorA === 'number' && typeof valorB === 'number') {
            return ordemAtual.ascendente ? valorA - valorB : valorB - valorA;
        }

        // Comparação de strings
        valorA = valorA.toString().toLowerCase();
        valorB = valorB.toString().toLowerCase();

        if (valorA < valorB) {
            return ordemAtual.ascendente ? -1 : 1;
        }
        if (valorA > valorB) {
            return ordemAtual.ascendente ? 1 : -1;
        }
        return 0;
    });

    // Atualizar ícones de ordenação
    document.querySelectorAll('th i').forEach(icone => {
        icone.className = 'fas fa-sort';
    });

    const thAtual = document.querySelector(`th[data-coluna="${coluna}"] i`);
    if (thAtual) {
        thAtual.className = ordemAtual.ascendente ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }

    atualizarTabela();
}

function limparFiltros() {
    document.getElementById('f-escola').value = '';
    document.getElementById('f-municipio').value = '';
    document.getElementById('f-nota-min').value = '';
    document.getElementById('f-busca').value = '';

    dadosFiltrados = [...dadosEscolares];
    atualizarTabela();
}

function configurarEventos() {
    // Event listeners para os filtros
    document.getElementById('f-escola').addEventListener('change', aplicarFiltros);
    document.getElementById('f-municipio').addEventListener('change', aplicarFiltros);
    document.getElementById('f-nota-min').addEventListener('input', aplicarFiltros);
    document.getElementById('f-busca').addEventListener('input', aplicarFiltros);

    // Botão limpar filtros
    document.getElementById('btn-limpar').addEventListener('click', limparFiltros);
}