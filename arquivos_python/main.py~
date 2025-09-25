import os
import time

from utils import fragmenta_csv_por_faixas, rename_move, \
    save_csv, cleanup_paths, ensure_csv_local, normalize_timestamp_column
import pandas as pd
from utils import transformar_coluna
import csv

from utils_processamento import carregar_csv_forms_v7, limpar_dataframe_completo

if __name__ == '__main__':

    src_path = r"C:\Users\User\Downloads\Projeto Monitor Escolar.csv 2.zip"

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

    print("Fragmentação concluída com sucesso!")
    print(f"Foram criados {len(result)} arquivos CSV na pasta 'data/'")


