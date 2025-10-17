// Configurações
const CSV_PATH = "./data/projeto_monitor.csv";

// Variáveis globais
let dadosEscolares = [];
let escolasComStatus = [];

let escolasPendentes = [
  { nome: "Escola Estadual Guiomar Vasconcelos", rede: "Estadual", municipio: "Canguaretama", status: "Pendente" },

  { nome: "Escola Municipal José de Carvalho e Silva", rede: "Municipal", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Municipal Juarez Rabelo", rede: "Municipal", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Municipal Juvêncio dos Santos", rede: "Municipal", municipio: "Vila Flor", status: "Pendente" },

  { nome: "Centro Educacional Maria da Conceição Freire", rede: "Municipal", municipio: "Baía Formosa", status: "Pendente" },

{ nome: "Escola Municipal Professor Bartolomeu Fagundes", rede: "Municipal", municipio: "Baía Formosa", status: "Pendente" },

{ nome: "Escola Municipal Dr. Manoel Francisco de Melo", rede: "Municipal", municipio: "Baía Formosa", status: "Pendente" },

{ nome: "Escola Municipal Jarbas Passarinho", rede: "Municipal", municipio: "Baía Formosa", status: "Pendente" },


  { nome: "Creche Municipal Dona Dal", rede: "Municipal", municipio: "Vila Flor", status: "Pendente" },

  { nome: "Escola Municipal Padre Leôncio", rede: "Municipal", municipio: "Pedro Velho", status: "Pendente" },

  { nome: "Escola Estadual Matias Maciel", rede: "Estadual", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Estadual Felipe Ferreira", rede: "Estadual", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Estadual 4 de março", rede: "Estadual", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Estadual Fabrício Maranhão - Município de Canguaretama", rede: "Estadual", municipio: "Canguaretama", status: "Pendente" },
  { nome: "Escola Estadual Águida Sucupira", rede: "Estadual", municipio: "Baía Formosa", status: "Pendente" },
  { nome: "Escola Estadual Fabrício Maranhão - Município de Pedro Velho", rede: "Estadual", municipio: "Pedro Velho", status: "Pendente" },
];

  




// Função auxiliar para dividir CSV respeitando aspas
function splitCSV(linha, separador) {
    const resultado = [];
    let campo = '';
    let dentroDeAspas = false;
    
    for (let i = 0; i < linha.length; i++) {
        const char = linha[i];
        
        if (char === '"') {
            dentroDeAspas = !dentroDeAspas;
        } else if (char === separador && !dentroDeAspas) {
            resultado.push(campo);
            campo = '';
        } else {
            campo += char;
        }
    }
    
    resultado.push(campo);
    return resultado;
}

// Função auxiliar para converter valores numéricos
function toNumberIfPossible(valor) {
    if (valor === '' || valor == null) return valor;
    const numero = Number(valor);
    return !isNaN(numero) ? numero : valor;
}

// Função para determinar a classe do badge baseada no status
function getBadgeClass(status) {
    if (/enviad/i.test(status)) return "s-enviado";
    if (/pendente/i.test(status)) return "s-pendente";
    return "s-participando";
}

// Função para carregar e processar o CSV
function carregarCSV() {
    console.log(`Tentando carregar: ${CSV_PATH}`);
    
    const urlComCache = `${CSV_PATH}?t=${Date.now()}`;
    
    fetch(urlComCache)
        .then(response => {
            console.log(`Status da resposta: ${response.status}`);
            
            if (!response.ok) {
                throw new Error(`Arquivo não encontrado: ${CSV_PATH} (Status: ${response.status})`);
            }
            return response.text();
        })
        .then(csvText => {
            console.log(`CSV carregado, tamanho: ${csvText.length} caracteres`);
            
            // Remove BOM e normaliza quebras de linha
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
            const headers = splitCSV(linhas[0], sep).map(h => h.trim().replace(/^"|"$/g, ''));
            console.log(`Headers encontrados:`, headers);
            
            // Processa dados
            const rows = [];
            for (let i = 1; i < linhas.length; i++) {
                const parts = splitCSV(linhas[i], sep).map(v => v.trim().replace(/^"|"$/g, ''));
                if (!parts.length) continue;
                
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = toNumberIfPossible(parts[idx] || '');
                });
                rows.push(row);
            }
            
            if (!rows.length) {
                throw new Error('Nenhum dado válido encontrado no CSV');
            }
            
            console.log(`Dados processados: ${rows.length} registros`);
            console.log('Primeiros registros:', rows.slice(0, 3));
            
            // Armazena dados globalmente
            dadosEscolares = rows;
            
            // Processa dados para os cards
            processarDadosParaCards();
            
        })
        .catch(error => {
            console.error('ERRO ao carregar CSV:', error);
            
            // Em caso de erro, usa dados estáticos como fallback
            console.log('Usando dados estáticos como fallback...');
            usarDadosEstaticos();
        });
}

// Função para processar dados do CSV para formato dos cards
function processarDadosParaCards() {
    escolasComStatus = [];
    
    // Mapeia possíveis nomes de colunas para nome da escola
    const possiveisNomesEscola = ['nome_escola', 'escola', 'nome', 'unidade_escolar', 'escola_nome'];
    const possiveisRede = ['rede', 'rede_ensino', 'tipo_rede', 'rede_escola'];
    const possiveisMunicipio = ['municipio', 'cidade', 'local', 'municipio_escola'];
    
    // Encontra as colunas corretas
    const headers = Object.keys(dadosEscolares[0] || {});
    
    const colunaNome = possiveisNomesEscola.find(nome => 
        headers.some(h => h.toLowerCase().includes(nome.toLowerCase()))
    );
    
    const colunaRede = possiveisRede.find(rede => 
        headers.some(h => h.toLowerCase().includes(rede.toLowerCase()))
    );
    
    const colunaMunicipio = possiveisMunicipio.find(mun => 
        headers.some(h => h.toLowerCase().includes(mun.toLowerCase()))
    );
    
    console.log('Colunas identificadas:', { colunaNome, colunaRede, colunaMunicipio });
    
    // Processa cada registro do CSV
    dadosEscolares.forEach(registro => {
        const nomeEscola = encontrarValorColuna(registro, possiveisNomesEscola);
        const rede = encontrarValorColuna(registro, possiveisRede);
        const municipio = encontrarValorColuna(registro, possiveisMunicipio);
        
        if (nomeEscola) {
            escolasComStatus.push({
                nome: nomeEscola,
                rede: rede || 'Não informado',
                municipio: municipio || 'Não informado',
                status: 'Dados enviados' // Como estão no CSV, considera que enviaram dados
            });
        }
    });
    
    console.log('Escolas processadas:', escolasComStatus.length);
    
    // Renderiza os cards
    renderizarCards();
    renderizarCardsPendentes();     // ✅ agora renderiza as pendentes também

}

// Função auxiliar para encontrar valor em colunas com nomes similares
function encontrarValorColuna(registro, possiveisNomes) {
    for (const nome of possiveisNomes) {
        for (const chave in registro) {
            if (chave.toLowerCase().includes(nome.toLowerCase())) {
                return registro[chave];
            }
        }
    }
    return null;
}

// Função para renderizar os cards
function renderizarCards() {
    const lista = document.getElementById("lista-escolas");
    
    if (!lista) {
        console.error('Elemento #lista-escolas não encontrado!');
        return;
    }
    
    if (escolasComStatus.length === 0) {
        lista.innerHTML = '<p>Nenhuma escola encontrada nos dados.</p>';
        return;
    }
    
    // Gera HTML dos cards
    const cardsHTML = escolasComStatus.map(escola => `
        <article class="card escola-card">
            <h3 class="escola-nome">${escola.nome}</h3>
            <p class="escola-meta">
                <strong>Rede:</strong> ${escola.rede} · 
                <strong>Município:</strong> ${escola.municipio}
            </p>
            <div class="escola-status">
                <span class="badge ${getBadgeClass(escola.status)}">${escola.status}</span>
            </div>
        </article>
    `).join('');
    
    lista.innerHTML = cardsHTML;
    
    console.log(`${escolasComStatus.length} cards renderizados com sucesso!`);
}

// Dados estáticos como fallback (do código original)
function usarDadosEstaticos() {
    escolasComStatus = [
        { nome:"Escola Estadual Matias Maciel", rede:"Estadual", municipio:"Canguaretama", status:"Participando" },
        { nome:"Escola Estadual Felipe Ferreira", rede:"Estadual", municipio:"Canguaretama", status:"Pendente de envio" },
        { nome:"Escola Estadual 4 de março", rede:"Estadual", municipio:"Canguaretama", status:"Pendente de envio" },
        { nome:"Escola Estadual Fabrício Maranhão", rede:"Estadual", municipio:"Canguaretama", status:"Pendente de envio" },
        { nome:"Escola Estadual Guiomar Vasconcelos", rede:"Estadual", municipio:"Canguaretama", status:"Pendente de envio" },

        { nome:"Escola Municipal José de Carvalho e Silva", rede:"Municipal", municipio:"Canguaretama", status:"Dados enviados" },



        { nome:"Escola Estadual Águida Sucupira", rede:"Estadual", municipio:"Baía Formosa", status:"Pendente de envio" },

        { nome:"Creche Municipal Dona Dal", rede:"Municipal", municipio:"Vila Flor", status:"Pendente de envio" },




    ];
    
    renderizarCards();
    renderizarCardsPendentes();
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, iniciando carregamento do CSV...');
    carregarCSV();
});

// Também tenta carregar quando a página estiver totalmente carregada (fallback)
window.addEventListener('load', function() {
    // Só executa se ainda não carregou
    if (escolasComStatus.length === 0) {
        console.log('Tentativa adicional de carregamento...');
        carregarCSV();
    }
});



function renderizarCardsPendentes() {
    const lista = document.getElementById("lista-escolas-pendentes");
    
    if (!lista) {
        console.error('Elemento #lista-escolas não encontrado!');
        return;
    }
    
    
    
    
    
    
    // Gera HTML dos cards
    const cardsHTML = escolasPendentes.map(escola => `
        <article class="card escola-card">
            <h3 class="escola-nome">${escola.nome}</h3>
            <p class="escola-meta">
                <strong>Rede:</strong> ${escola.rede} · 
                <strong>Município:</strong> ${escola.municipio}
            </p>
            <div class="escola-status">
                <span class="badge ${getBadgeClass(escola.status)}">${escola.status}</span>
            </div>
        </article>
    `).join('');
    
    lista.innerHTML = cardsHTML;
    
    console.log(`${escolasComStatus.length} cards renderizados com sucesso!`);
}