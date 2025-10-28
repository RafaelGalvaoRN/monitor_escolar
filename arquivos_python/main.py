import os

from utils import fragmenta_csv_por_faixas, \
    save_csv, ensure_csv_local, normalize_timestamp_column, transformar_coluna, limpar_coluna, corrigir_nao_se_aplica
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

    df = corrigir_nao_se_aplica(df)

    df = transformar_coluna(df, "1.1. Nome da Escola", "upper")
    df = transformar_coluna(df, "1.2. Endereço", "title")
    df = transformar_coluna(df, "1.4. E-mail de Contato", "lower")
    df = transformar_coluna(df, '1.5. Caso a Escola possua perfil em redes sociais (Instagram, Facebook etc), indicar o nome e a rede social (Caso não possua perfil, responder "Não se aplica")', "lower")
    df = transformar_coluna(df, "1.6. Nome da Direção", "title")
    df = transformar_coluna(df, '1.7. Nome da Vice-Direção (se não houver, responder "Não se aplica")', "title")
    df = limpar_coluna(df, "1.13. A Escola possui quantos alunos matriculados no momento?", [".", "alunos", " "])
    df = limpar_coluna(df, "1.14. Qual é a quantidade de turmas existentes na Escola?", ["turmas"])
    df = transformar_coluna(df, '2.11.1. Caso a resposta anterior seja "Sim", quais esportes são oferecidos? Caso a resposta anterior seja "Não", responder "Não se aplica".', "capitalize")
    df = transformar_coluna(df, '2.12.1. Caso a resposta anterior seja "Sim", em qual local se realizam as aulas práticas de Educação Física? Caso a resposta anterior seja "Não", responder "Não se aplica".', "capitalize")
    df = transformar_coluna(df, '2.21.1. Caso a resposta anterior seja "Não", quais equipamentos se encontram em falta ou necessitando de manutenção/substituição? (Pode marcar mais de uma opção)', "lower")
    df = transformar_coluna(df, '2.26.1. Caso a resposta anterior seja "Sim", de que forma é realizado o controle de estoque?', "capitalize")

    df = transformar_coluna(df,
                            '2.27.1. Caso a resposta anterior seja "Não", quais equipamentos estão em falta? (Pode marcar mais de uma opção)',
                            "capitalize")


    df = transformar_coluna(df, '3.2. Caso a resposta anterior seja "Sim", quais as medidas adotadas pela Escola para combater o problema?', "capitalize")

    df = limpar_coluna(df, "3.10.3. Qual a quantidade de alunos que necessitam de transporte escolar regular? Caso a Escola não utilize e não necessite de transporte escolar, indicar o número 0 (zero)", ["aluno", "alunos"])

    df = transformar_coluna(df, '3.11.1. Caso a resposta anterior seja "Sim", quantos alunos necessitam de transporte especial?', "capitalize")
    df = transformar_coluna(df, '3.11.3. Caso seja atendida apenas parte dos alunos que necessitam de transporte escolar especial, qual a quantidade de estudantes que não está sendo atendida por esse serviço? Caso não se aplique, indicar o número 0 (zero)', "capitalize")

    df = transformar_coluna(df, '5.5.1. Caso a resposta anterior seja "Sim", em que consiste a classificação? Caso a resposta anterior seja "Não", responder "Não se aplica".', "capitalize")

    df = transformar_coluna(df, '6.3.1. Caso a resposta anterior seja "Sim", quais atividades são desenvolvidas? Caso a resposta anterior seja "Não", responder "Não se aplica".', "capitalize")

    df = transformar_coluna(df, '7.1. Qual(is) foi(ram) a(s) nota(s) obtida(s) pela Escola na última avaliação do IDEB? Caso a Escola não possua nota, responder "Não se aplica".', "capitalize")

    df = transformar_coluna(df, '7.2. Qual(is) foi(ram) a(s) nota(s) obtida(s) pela Escola na última avaliação do SIMAIS? Caso a Escola não possua nota, responder "Não se aplica".', "capitalize")

    df = transformar_coluna(df, '7.4. A Escola disponibiliza algum tipo de atividade de ensino a distância ou remota?', "capitalize")

    df = limpar_coluna(df, "7.4. A Escola disponibiliza algum tipo de atividade de ensino a distância ou remota?", ["."])


    coluna = '12.4.1. Caso a resposta anterior seja "Sim", em que consistem as dificuldades? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    df = transformar_coluna(df, coluna, "capitalize")
    df = limpar_coluna(df, coluna, ["."])

    coluna = '12.5.1. Caso a resposta anterior seja "Sim", qual o ano da prestação de contas pendente e a qual recurso financeiro essa se refere? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    df = transformar_coluna(df, coluna, "capitalize")
    df = limpar_coluna(df, coluna, ["."])

    coluna = '12.5.1. Caso a resposta anterior seja "Sim", qual o ano da prestação de contas pendente e a qual recurso financeiro essa se refere? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    df = transformar_coluna(df, coluna, "capitalize")
    df = limpar_coluna(df, coluna, ["."])

    coluna = '14.1. Qual é o seu objetivo como Diretor(a) da Escola?'
    df = transformar_coluna(df, coluna, "capitalize")

    coluna = '14.2.1. De forma resumida, o que é preciso para o desenvolvimento do projeto desejado? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    df = transformar_coluna(df, coluna, "capitalize")






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
    file_gestao = r"C:\Users\User\Downloads\Projeto Monitor Escolar.csv (17).zip"
    etl_csv_gestao(file_gestao)


    file_comunidade = r"C:\Users\User\Downloads\Projeto Monitor Escolar - Resposta da comunidade (5).csv"
    etl_csv_comunidade(file_comunidade)


    # #abrir no navegador
    #
    # caminho = Path("../index.html")
    #
    # webbrowser.open(caminho.resolve().as_uri())


