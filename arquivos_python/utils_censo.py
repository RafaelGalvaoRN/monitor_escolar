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



# Cabeçalho comum das páginas geradas (mesmo tema visual do restante do site)
HEAD_COMUM = """  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="theme-color" content="#082c48" />
  <link rel="icon" href="img/favicon.svg" type="image/svg+xml" />
  <script>try{var t=localStorage.getItem('me-tema');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Sora:wght@600;700;800&display=swap" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.1/css/all.min.css" />
  <link rel="stylesheet" href="style/tema.css" />"""


def gerar_pagina_html_escolas_unicas(df: pd.DataFrame, escolas: list[str], saida: str = "../escolas_participantes_censo.html",
                                     abrir_no_navegador: bool = True) -> str:
    """Gera a página 'Escolas avaliadas pela comunidade' e salva em 'saida'.
    Retorna o HTML gerado como string.
    """

    contagem = contar_avaliacoes_por_escola(df)  # df já carregado
    total_avaliacoes = sum(contagem.get(nome, 0) for nome in escolas)

    # monta os cards das escolas
    lista_html = "\n".join(
        f"""        <article class="card escola-card">
          <h3 class="escola-nome">{html.escape(nome)}</h3>
          <div class="escola-status">
            <span class="badge s-participando">Participando</span>
            <span class="qtd"><b class="num">{contagem.get(nome, 0)}</b> {"avaliação" if contagem.get(nome, 0) == 1 else "avaliações"}</span>
          </div>
        </article>"""
        for nome in escolas
    )

    HTML_BASE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
HEAD_COMUM_PLACEHOLDER
  <title>Escolas avaliadas pela comunidade · Monitor Escolar</title>
</head>

<body>
  <div id="header-placeholder"></div>
  <script src="layout.js"></script>

  <!-- Arquivo gerado por arquivos_python/utils_censo.py: edite o modelo lá, não aqui. -->
  <main>
    <section class="page-head">
      <div class="wrap">
        <div class="crumbs"><a href="index.html">Início</a><span>›</span><span>Participantes</span><span>›</span><span>Comunidade</span></div>
        <h1>Escolas avaliadas pela comunidade</h1>
        <p class="lead">Escolas que já receberam avaliações de pais, alunos e professores no Projeto Monitor Escolar.</p>
        <div class="chips">
          <div class="chip-stat"><b class="num">TOTAL_ESCOLAS_PLACEHOLDER</b><span>escolas</span></div>
          <div class="chip-stat"><b class="num">TOTAL_AVALIACOES_PLACEHOLDER</b><span>avaliações recebidas</span></div>
        </div>
        <div class="hero-actions"><a class="btn primary" href="https://forms.gle/7YwVNC8vuRiRnSa36" target="_blank" rel="noopener"><i class="fab fa-google"></i> Avaliar uma escola</a><a class="btn ghost" href="ranking.html"><i class="fas fa-trophy"></i> Ver ranking</a></div>
      </div>
    </section>

    <section id="escolas" class="wrap page-body">
      <div class="cards three">
LISTA_ESCOLAS_PLACEHOLDER
      </div>
    </section>
  </main>

  <div id="footer-placeholder"></div>
</body>
</html>
"""

    # injeta os dados no HTML base
    html_final = (HTML_BASE
                  .replace("HEAD_COMUM_PLACEHOLDER", HEAD_COMUM)
                  .replace("TOTAL_ESCOLAS_PLACEHOLDER", str(len(escolas)))
                  .replace("TOTAL_AVALIACOES_PLACEHOLDER", str(total_avaliacoes))
                  .replace("LISTA_ESCOLAS_PLACEHOLDER", lista_html))

    # salva
    caminho = Path(saida)
    caminho.write_text(html_final, encoding="utf-8")

    # abre no navegador (file://)
    if abrir_no_navegador:
        webbrowser.open(caminho.resolve().as_uri())

    return html_final


def gerar_pagina_html_ranking(df_com_colunas: pd.DataFrame, saida: str = "../ranking.html"):
    """Gera os dados do ranking da comunidade.

    A página ranking.html agora é fixa e lê os dados de 'data/ranking_comunidade.json'
    (a página inicial também usa esse arquivo). Esta função grava o JSON na pasta
    'data' ao lado de 'saida' e não sobrescreve mais o ranking.html.
    """
    import json
    from datetime import date

    # Colunas de avaliação (excluindo data e nome_escola) e seus rótulos na página
    colunas_avaliacao = {
        'estrutura_fisica': 'Estrutura física',
        'acessibilidade': 'Acessibilidade',
        'equipamentos': 'Equipamentos',
        'merenda_mobiliario': 'Merenda e mobiliário',
        'professores': 'Professores',
        'seguranca': 'Segurança',
        'material_didatico': 'Material didático',
        'transporte': 'Transporte',
        'violencia': 'Violência',
        'gestao': 'Gestão',
    }
    colunas = list(colunas_avaliacao)

    # Calcular a média das notas de cada avaliação
    df_ranking = df_com_colunas.copy()
    df_ranking[colunas] = df_ranking[colunas].apply(pd.to_numeric, errors='coerce')
    df_ranking['media_geral'] = df_ranking[colunas].mean(axis=1).round(2)

    # Ordenar por média (decrescente)
    df_ranking = df_ranking.sort_values('media_geral', ascending=False).reset_index(drop=True)

    def _num(v):
        return None if pd.isna(v) else (int(v) if float(v).is_integer() else float(v))

    dados = {
        "atualizado_em": date.today().isoformat(),
        "dimensoes": list(colunas_avaliacao.values()),
        "avaliacoes": [
            {
                "escola": str(row['nome_escola']).strip(),
                "media": _num(row['media_geral']),
                "notas": [_num(row[c]) for c in colunas],
            }
            for _, row in df_ranking.iterrows()
        ],
    }

    destino = Path(saida).resolve().parent / "data" / "ranking_comunidade.json"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(dados, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"✅ Dados do ranking gravados em: {destino}")
    print(f"📊 Total de avaliações: {len(df_ranking)}")
    if len(df_ranking):
        print(f"🏆 Melhor avaliação: {df_ranking.iloc[0]['nome_escola']} (Média: {df_ranking.iloc[0]['media_geral']})")
    return dados
