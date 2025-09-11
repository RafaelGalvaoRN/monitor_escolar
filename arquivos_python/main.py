from utils import fragmenta_csv_por_faixas, rename_move
import pandas as pd

if __name__ == '__main__':

    file_path = r"C:\Users\User\Downloads\Projeto Monitor Escolar (teste).csv (1).zip"
    novo_arquivo = rename_move(file_path, "projeto_monitor.csv", "../data")
    print("Arquivo movido para:", novo_arquivo)

    #
    # df = pd.read_csv("data/projeto_monitor.csv")
    # num_cols = df.shape[1]
    # print(f"CSV tem {num_cols} colunas (índices 0 a {num_cols - 1})")

    # Faixas corrigidas baseadas na estrutura real do CSV
    result = fragmenta_csv_por_faixas(
        "../data/projeto_monitor.csv",
        {
            "Identificacao_Escola": (0, 13),  # Eixo 1
            "Estrutura_Fisica_Funcionamento": (14, 61),  # Eixo 2
            "Alunos": (62, 82),  # Eixo 3
            "Professores": (83, 88),  # Eixo 4
            "Gestao_Equipe": (89, 96),  # Eixo 5
            "Pais_Comunidade": (97, 102),  # Eixo 6
            "Questoes_Pedagogicas": (103, 106),  # Eixo 7
            "Gestao_Democratica": (107, 114),  # Eixo 8
            "Documentos": (115, 117),  # Eixo 9
            "Seguranca_Escola": (118, 120),  # Eixo 10
            "Violencia_Indisciplina": (121, 123),  # Eixo 11
            "Prestacao_Contas": (124, 133),  # Eixo 12
            "Experiencia_Inovadora": (134, 135),  # Eixo 13
            "Objetivo_Gestao": (136, 138),  # Eixo 14
        },
        salvar=True,
        prefixo_arquivo="eixo_",
        pasta_destino="../data/",
    )

    print("Fragmentação concluída com sucesso!")
    print(f"Foram criados {len(result)} arquivos CSV na pasta 'data/'")

    # # Opcionalmente, mostrar info sobre cada fragmento
    # for nome_eixo, df in result.items():
    #     print(f"{nome_eixo}: {df.shape[1]} colunas, {df.shape[0]} linhas")

    # import pandas as pd
    #
    # # Vamos ver todas as 23 colunas do seu CSV
    # df = pd.read_csv("dados_escolares.csv")
    #
    # print(f"CSV tem {df.shape[1]} colunas:")
    # print("=" * 60)
    #
    # for i, col in enumerate(df.columns):
    #     print(f"[{i:2d}] {col}")
    #
    # print("=" * 60)
    # print(f"Dados disponíveis: {df.shape[0]} linha(s)")
    #
    # # Vamos também ver um exemplo dos dados
    # print("\nPrimeira linha de dados (primeiros 5 valores):")
    # print(df.iloc[0, :5].tolist())