import os

from utils import fragmenta_csv_por_faixas, \
    save_csv, ensure_csv_local, normalize_timestamp_column, transformar_coluna
import pandas as pd

from utils_censo import escolas_unicas, gerar_pagina_html_escolas_unicas, \
    adicionar_colunas, gerar_pagina_html_ranking

from utils_processamento import  limpar_dataframe_completo
import webbrowser
from pathlib import Path



def etl_csv_gestao(src_path: str):
    extensao = src_path.split(".")[-1]

    if src_path.lower().endswith(".csv") or src_path.lower().endswith(".zip"):
        csv_local, to_clean = ensure_csv_local(src_path)
        df = pd.read_csv(csv_local, dtype=str)

    elif src_path.lower().endswith(".xlsx"):
        df = pd.read_excel(src_path, dtype=str)

    else:
        raise ValueError(f"Extensão '{extensao}' desconhecida.")

    df = limpar_dataframe_completo(df)
    df = normalize_timestamp_column(df, src_col="Carimbo de data/hora", dst_col="Data do Envio")

    df = transformar_coluna(df, "1.1. Nome da Escola", "upper")
    df = transformar_coluna(df, "1.4. E-mail de Contato", "lower")

    # 3) Salvar no destino com novo nome
    dest_path = os.path.join("../data", "projeto_monitor.csv")
    save_csv(df, dest_path)
    print("CSV corrigido e salvo em:", dest_path)

    result = fragmenta_csv_por_faixas(
        df,
        {
            "Identificacao_Escola": (0, 16),  # Eixo 1
            "Estrutura_Fisica_Funcionamento": (17, 64),  # Eixo 2
            "Alunos": (65, 85),  # Eixo 3
            "Professores": (86, 90),  # Eixo 4
            "Gestao_Equipe": (91, 98),  # Eixo 5
            "Pais_Comunidade": (99, 104),  # Eixo 6
            "Questoes_Pedagogicas": (105, 108),  # Eixo 7
            "Gestao_Democratica": (109, 116),  # Eixo 8
            "Documentos": (117, 119),  # Eixo 9
            "Seguranca_Escola": (120, 122),  # Eixo 10
            "Violencia_Indisciplina": (123, 125),  # Eixo 11
            "Prestacao_Contas": (126, 135),  # Eixo 12
            "Experiencia_Inovadora": (136, 137),  # Eixo 13
            "Objetivo_Gestao": (138, 140),  # Eixo 14
        },
        salvar=True,
        prefixo_arquivo="eixo_",
        pasta_destino="../data/",
    )

def etl_csv_comunidade(path_file: str):
    df = pd.read_csv(path_file, header=None, encoding="utf-8")

    escolas = escolas_unicas(df)

    gerar_pagina_html_escolas_unicas(df, escolas,
                                     saida="../escolas_participantes_censo.html",
                                     abrir_no_navegador=False)

    nomes_colunas = ["data", "nome_escola", "estrutura_fisica", "acessibilidade", "equipamentos",
                     "merenda_mobiliario", "professores", "seguranca", "material_didatico",
                     "transporte", "violencia", "gestao", ]

    df_com_colunas = adicionar_colunas(df, nomes_colunas)

    gerar_pagina_html_ranking(df_com_colunas, "../ranking.html")

if __name__ == '__main__':
    file_gestao = r"C:\Users\User\Downloads\Projeto Monitor Escolar.csv (14).zip"
    etl_csv_gestao(file_gestao)


    file_comunidade = r"C:\Users\User\Downloads\Projeto Monitor Escolar - Resposta da comunidade (5).csv"
    etl_csv_comunidade(file_comunidade)


    # #abrir no navegador
    #
    # caminho = Path("../index.html")
    #
    # webbrowser.open(caminho.resolve().as_uri())


