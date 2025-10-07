from utils_processamento import carregar_csv_forms_v7
from pathlib import Path
import webbrowser
import html

from pathlib import Path
import webbrowser
import html


import pandas as pd


pd.set_option("display.max_columns", None)  # não cortar colunas
pd.set_option("display.width", None)  # usar largura total do terminal
pd.set_option("display.max_rows", None)  # se quiser todas as linhas também

def escolas_unicas(df: pd.DataFrame) -> list[str]:

    return sorted(df.iloc[:, 1].dropna().unique().tolist())


def adicionar_colunas(df: pd.DataFrame, nomes_colunas: list[str]) -> pd.DataFrame:
    """
    Adiciona ou substitui os nomes das colunas de um DataFrame.

    Args:
        df: DataFrame existente (sem cabeçalho ou com cabeçalho errado).
        nomes_colunas: lista de nomes para as colunas.

    Returns:
        DataFrame com as colunas renomeadas.
    """
    if len(nomes_colunas) != df.shape[1]:
        raise ValueError(
            f"Número de colunas não bate: esperado {df.shape[1]}, "
            f"recebi {len(nomes_colunas)} nomes"
        )
    df.columns = nomes_colunas
    return df

def contar_avaliacoes_por_escola(df: pd.DataFrame) -> dict[str, int]:

    serie = df.iloc[:, 1]
    serie = serie.astype(str).str.strip()  # remove espaços antes/depois

    return serie.value_counts(dropna=True).to_dict()  # {'Escola X': 3, ...}



def gerar_pagina_html_escolas_unicas(df: pd.DataFrame, escolas: list[str], saida: str = "../escolas_participantes_censo.html",
                                     abrir_no_navegador: bool = True) -> str:
    """Gera uma página HTML com a lista de escolas e salva em 'saida'.
    Retorna o HTML gerado como string.
    """

    contagem = contar_avaliacoes_por_escola(df)  # df já carregado

    # monta os cards das escolas
    lista_html = "\n".join(
        f"""        <article class="card escola-card">
            <h3 class="escola-nome">{html.escape(nome)}</h3>
            <div class="escola-status">
                <span class="badge s-participando">Participando</span>
            </div>
            <h4 class="escola-nome">Qtd de Avaliações: {contagem.get(nome,0)}</h4>
        </article>"""
        for nome in escolas
    )

    HTML_BASE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Escolas Participantes – Monitor Escolar</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />

  <!-- Seus estilos existentes -->
  <link rel="stylesheet" href="style/style.css" />
  <link rel="stylesheet" href="style/footer.css" />
  <link rel="stylesheet" href="style/tabela.css" />
  <link rel="stylesheet" href="style/headers.css" />
  <link rel="stylesheet" href="style/navbar.css" />
  <link rel="stylesheet" href="style/imagem-logo.css"/>
  <link rel="stylesheet" href="style/projeto.css" />
  <link rel="stylesheet" href="style/escolas_participantes.css" />

  <!-- Font Awesome (ícones) -->
  <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css"/>

  <!-- jQuery (para carregar header/footer) -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
</head>

<body>
  <div id="header-placeholder"></div>

  <!-- CONTEÚDO PRINCIPAL -->
  <main class="proj-container">
    <header class="proj-hero">
      <h1>Escolas Avaliadas pela Comunidade</h1>
      <p>Lista completa das escolas que já foram avaliadas pela Comunidade no Projeto Monitor Escolar.</p>
    </header>

    <!-- Seção com a lista de escolas -->
    <section id="escolas" class="proj-section">
      <div class="escolas-grid">
LISTA_ESCOLAS_PLACEHOLDER
      </div>
    </section>
  </main>

  <div id="footer-placeholder"></div>

  <!-- Carrega header e footer -->
  <script>
    $(function () {
      $("#footer-placeholder").load("footer.html");
      $("#header-placeholder").load("header.html #novo_background", function () {
        console.log("Header carregado");
      });
    });
  </script>

  <!-- Seu JS do menu -->
  <script src="menu.js"></script>
</body>
</html>"""

    # injeta a lista no HTML base
    html_final = HTML_BASE.replace("LISTA_ESCOLAS_PLACEHOLDER", lista_html)

    # salva
    caminho = Path(saida)
    caminho.write_text(html_final, encoding="utf-8")

    # abre no navegador (file://)
    if abrir_no_navegador:
        webbrowser.open(caminho.resolve().as_uri())

    return html_final




def gerar_pagina_html_ranking(df_com_colunas: pd.DataFrame, saida: str = "../ranking.html"):
    """Gera uma página HTML com o ranking de avaliação das escolas dado pela comunidade e salva em 'saida'."""

    # Colunas de avaliação (excluindo data e nome_escola)
    colunas_avaliacao = ['estrutura_fisica', 'acessibilidade', 'equipamentos',
                         'merenda_mobiliario', 'professores', 'seguranca',
                         'material_didatico', 'transporte', 'violencia', 'gestao']

    # Calcular a média das notas para cada escola
    df_ranking = df_com_colunas.copy()
    df_ranking['media_geral'] = df_ranking[colunas_avaliacao].mean(axis=1).round(2)

    # Ordenar por média (decrescente)
    df_ranking = df_ranking.sort_values('media_geral', ascending=False).reset_index(drop=True)

    # Adicionar posição no ranking
    df_ranking['posicao'] = range(1, len(df_ranking) + 1)

    # Gerar linhas da tabela HTML
    tabela_html = "\n".join(
        f"""
        <tr>
            <td class="posicao">{row['posicao']}º</td>
            <td class="nome-escola">{row['nome_escola']}</td>
            <td class="media">{row['media_geral']}</td>
            <td class="detalhe">{row['estrutura_fisica']}</td>
            <td class="detalhe">{row['acessibilidade']}</td>
            <td class="detalhe">{row['equipamentos']}</td>
            <td class="detalhe">{row['merenda_mobiliario']}</td>
            <td class="detalhe">{row['professores']}</td>
            <td class="detalhe">{row['seguranca']}</td>
            <td class="detalhe">{row['material_didatico']}</td>
            <td class="detalhe">{row['transporte']}</td>
            <td class="detalhe">{row['violencia']}</td>
            <td class="detalhe">{row['gestao']}</td>
        </tr>
        """
        for _, row in df_ranking.iterrows()
    )

    # Template HTML completo
    html_completo = f"""
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=0.8">
        <title>Ranking de Escolas - Avaliação da Comunidade</title>
        
        <!-- Seus estilos existentes -->
  <link rel="stylesheet" href="style/style.css" />
  <link rel="stylesheet" href="style/footer.css" />
  <link rel="stylesheet" href="style/tabela.css" />
  <link rel="stylesheet" href="style/headers.css" />
  <link rel="stylesheet" href="style/navbar.css" />
  <link rel="stylesheet" href="style/projeto.css" />
  <link rel="stylesheet" href="style/imagem-logo.css"/>
  <link rel="stylesheet" href="style/escolas_participantes.css" />        
  <link rel="stylesheet" href="style/ranking_comunidade.css" />
       <!-- Font Awesome (ícones) -->
  
  <link rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css"/>

  <!-- jQuery (para carregar header/footer) -->
  <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
        
    </head>
    <body>
    
      <div id="header-placeholder"></div>
      
      <div id="h1">       
                <h1>🏆 Ranking da Comunidade</h1>
      </div>

        <div class="container">
           

            <div class="conteudo">
                <div class="estatisticas">
                    <div class="stat-card">
                        <h3>{len(df_ranking)}</h3>
                        <p>Escolas Avaliadas</p>
                    </div>
                    <div class="stat-card">
                        <h3>{df_ranking['media_geral'].mean():.2f}</h3>
                        <p>Média Geral</p>
                    </div>
                    <div class="stat-card">
                        <h3>{df_ranking['media_geral'].max():.2f}</h3>
                        <p>Melhor Nota</p>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Posição</th>
                            <th>Nome da Escola</th>
                            <th>Média</th>
                            <th>Estrutura</th>
                            <th>Acessib.</th>
                            <th>Equipam.</th>
                            <th>Merenda</th>
                            <th>Profess.</th>
                            <th>Segurança</th>
                            <th>Material</th>
                            <th>Transp.</th>
                            <th>Violência</th>
                            <th>Gestão</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tabela_html}
                    </tbody>
                </table>

                <div class="legenda">
                    <h3>📊 Sobre as Avaliações</h3>
                    <p>
                        <strong>Média Geral:</strong> Calculada a partir de todas as categorias avaliadas (escala de 1 a 5).<br>
                        <strong>Categorias:</strong> Estrutura Física, Acessibilidade, Equipamentos, Merenda/Mobiliário, 
                        Professores, Segurança, Material Didático, Transporte, Violência e Gestão.
                    </p>
                </div>
            </div>
        </div>
        
          <div id="footer-placeholder"></div>

 <!-- Carrega header e footer -->
  <!-- Carrega header e footer (com cache-buster) -->
      <script>
  $(function () {{
    // Carrega o footer normalmente
    $("#footer-placeholder").load("footer.html");

    // Carrega apenas o header com id #novo_background
    $("#header-placeholder").load("header.html #novo_background", function () {{
      console.log("Header carregado");
      // Aqui o header já está no DOM, pode rodar menu.js ou outros scripts
    }});

    // Se ainda quiser aplicar fadeOut no footer:
    setTimeout(function () {{
      $("#footer-placeholder").fadeOut("slow");
    }}, 1000);
  }});
</script>
        
    <script src="menu.js"></script>

    </body>
    

    </html>
    """

    # Salvar arquivo HTML
    with open(saida, 'w', encoding='utf-8') as f:
        f.write(html_completo)

    print(f"✅ Ranking gerado com sucesso em: {saida}")
    print(f"📊 Total de escolas: {len(df_ranking)}")
    print(f"🏆 Melhor escola: {df_ranking.iloc[0]['nome_escola']} (Média: {df_ranking.iloc[0]['media_geral']})")


