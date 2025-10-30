import os
import time

from utils import fragmenta_csv_por_faixas, \
    save_csv, ensure_csv_local, normalize_timestamp_column, transformar_coluna, limpar_coluna, corrigir_nao_se_aplica, \
    padronizar_respostas
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

    mapa_uniformizacao = {
        "8": [
            "8 salas",
            ],
        "10": [
            "10 salas de aulas",
        ],
        "05": [
            "05 salas",
        ],
        "04": [
            "04 por turno",
        ]
    }
    df = padronizar_respostas(df, "1.15. Qual é a quantidade de salas de aula existentes na Escola?", mapa_uniformizacao)

    mapa_uniformizacao = {




        "Futsal": [
            "FUTSAL",
        ],
        "Não se aplica": [
            "Não se aplica",
            "NAO SE APLICA",
            "NÃO SE APLICA",
            "não se aplica",
            "Nao se aplica",
        ],

    }
    coluna = '2.11.1. Caso a resposta anterior seja "Sim", quais esportes são oferecidos? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    df = padronizar_respostas(df, coluna , mapa_uniformizacao)
    df = transformar_coluna(df, coluna, "capitalize")

    df = limpar_coluna(df, "2.14.1. Caso a Escola possua laboratório de informática, quantos computadores estão funcionando?", remover_palavras = ["computadores"])




    coluna = '2.12.1. Caso a resposta anterior seja "Sim", em qual local se realizam as aulas práticas de Educação Física? Caso a resposta anterior seja "Não", responder "Não se aplica".'
    mapa_uniformizacao = {
        "Quadra/Pátio da escola": [
            "Na quadra de esportes",
            "As atividades de Educação Física são realizadas no pátio da escola.",
            "Na área externa",
            "A ESCOLA USA O ESPAÇO EXTERNO DA ESCOLA",
            "NA QUADRA DA ESCOLA",
            "NO PATIO DA PROPRIA ESCOLA",
            "Quadra Poliesportiva da Instituição"
        ],
        "Locais emprestados": [
            "EM LOCAIS EMPRESTADOS"
        ],
        "Ginásio/Quadra municipal": [
            "No ginásio do município de Vila Flor",
            "Ginásio de esporte municipal",
            "No ginásio de esporte de município",
            "QUADRA DE ESPORTE DO MUNICIPIO VIZINHO A ESCOLA"
        ],
        "Espaços cedidos (campo de areia, campo de futebol, entre outros)":
            ["No Campo de futebol da comunidade (Municipal)."]
    }

    df = transformar_coluna(df,coluna , "capitalize")
    df = padronizar_respostas(df, coluna, mapa_uniformizacao)




    coluna = '2.21.1. Caso a resposta anterior seja "Não", quais equipamentos se encontram em falta ou necessitando de manutenção/substituição? (Pode marcar mais de uma opção)'
    df = transformar_coluna(df, coluna, "lower")

    mapa_uniformizacao = {
        "Todos estão em perfeito estado/Não está faltando nada": [
            "Todos estão em perfeito estado",
            "não",
            "não está faltando nada na cozinha",
            "Tem tudo que necessita para preparar e servir a merenda."
        ],
        "Processador/Multiprocessador": [
            "MULTIPROCESSADOR",
            "PROCESSADOR"
        ],
        "Liquidificador": [
            "LIQUIDIFICADOR INDUSTRIAL"
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)



    coluna = '2.26.1. Caso a resposta anterior seja "Sim", de que forma é realizado o controle de estoque?'

    df = transformar_coluna(df, coluna, "capitalize")

    mapa_uniformizacao = {
        "Controle feito manualmente em caderno ou ficha de controle": [
            "É FEITO ATRAVÉS DOE UM CONTROLE DIÁRIO DE ALIMENTOS"
        ],
        "Controle realizado por cardápio e valores de insumos utilizados": [
            "O CONTROLE É REALIZADO VIA CARDÁPIO CONFORME OS VALORES RECEBIDOS."
        ],
        "Sistema da SEDUC / plataforma digital": [
            "SISTEMA DA SEEC"
        ],
        "Controle feito pelas merendeiras": [
            "pelas merendeiras"
        ],
        "Por orientação do órgão responsável (DRAE ou Secretaria de Educação)": [
            "Por orientação do órgão responsável - DRAE"
        ],
        "Controle feito diariamente durante a preparação da merenda": [
            "Sim. O registro é realizado diariamente no diário de alimentação escolar."
        ],
        "Controle supervisionado pela Secretaria Municipal de Educação": [
            "Através de supervisão da gestão",
            "O controle é realizado pelo serviço de nutrição da Secretaria Municipal de Educação semanalmente."
        ],
        "Verificação da qualidade e quantidade no momento do recebimento": [
            "verificando a qualidade e quantidade de alimentos no momento do recebimento"
        ],
        "Controle realizado em planilhas (entrada e saída de produtos)": [
            "PLANILHAS",
            "ATRAVES DE PLANILHA DE ENTRADA E SAIDA DE PRODUTOS"
        ],
        "Controle semanal realizado pelo gestor escolar": [
            "O gestor escolar fica responsável por esse controle."
        ],
        "Existe local de armazenamento e registro das entradas e saídas": [
            "Existi um local de armazenamento, no qual é repassado todos os dias para a escola.",
            "Recebi-se semanalmente e é armazenado na escola"
        ],
        "Não se aplica": [
            "Não se aplica.",
            "NAO SE APLICA"
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)



    mapa_uniformizacao = {
        "Todos estão em perfeito estado/Não está faltando nada": [
            "tem tudo que necessita para preparar e servir a merenda.",
            "Todos estão em perfeito estado",
            "não",
            "não está faltando nada na cozinha"
        ],
        "Processador/Multiprocessador": [
            "MULTIPROCESSADOR",
            "PROCESSADOR",

        ],
        "Liquidificador": [
            "LIQUIDIFICADOR INDUSTRIAL"
        ]
    }
    coluna = '2.21.1. Caso a resposta anterior seja "Não", quais equipamentos se encontram em falta ou necessitando de manutenção/substituição? (Pode marcar mais de uma opção)'

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)

    df = transformar_coluna(df, coluna, "title")

    coluna = '2.27.1. Caso a resposta anterior seja "Não", quais equipamentos estão em falta? (Pode marcar mais de uma opção)'

    df = transformar_coluna(df,coluna, "title")
    mapa_uniformizacao = {
        "Estantes para livros / Armários de armazenamento para material pedagógico": [
            "Estantes para livros"
        ],
        "Produtos tecnológicos (como lousa digital ou projetor)": [
            "produtos tecnológicos como lousa inteligente"
        ],
        "Não se aplica": [
            "não se aplica",
            "Não se aplica"
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)


    coluna = '3.2. Caso a resposta anterior seja "Sim", quais as medidas adotadas pela Escola para combater o problema?'

    mapa_uniformizacao = {
        "Busca ativa escolar": [
            "Busca ativa",
            "A escola realiza a Busca Ativa.",
            "Busca Ativa",
            "Busca ativa escolar."
        ],
        "Contato com pais ou responsáveis": [
            "Entrar em contato com os pais ou responsáveis."
        ],
        "Não se aplica": [
            "NÃO TEMOS EVASÃO",
            "NÃO SE APLICA",
            "NAO SE APLICA",
            "não se aplica",
            "NENHUMA"
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)
    df = transformar_coluna(df, coluna, "title")


    df = limpar_coluna(df, '3.9.1. Caso a resposta anterior seja "Sim", a Escola possui quantos alunos com NEE, incluindo aqueles estudantes sem laudo médico?', remover_palavras=["alunos", "NEE", "apenas um com laudo médico", ","])


    df = limpar_coluna(df, "3.10.3. Qual a quantidade de alunos que necessitam de transporte escolar regular? Caso a Escola não utilize e não necessite de transporte escolar, indicar o número 0 (zero)", ["aluno", "alunos"])

    df = transformar_coluna(df, '3.11.1. Caso a resposta anterior seja "Sim", quantos alunos necessitam de transporte especial?', "capitalize")
    df = transformar_coluna(df, '3.11.3. Caso seja atendida apenas parte dos alunos que necessitam de transporte escolar especial, qual a quantidade de estudantes que não está sendo atendida por esse serviço? Caso não se aplique, indicar o número 0 (zero)', "capitalize")

    coluna =  '5.5.1. Caso a resposta anterior seja "Sim", em que consiste a classificação? Caso a resposta anterior seja "Não", responder "Não se aplica".'

    df = transformar_coluna(df, coluna, "capitalize")

    mapa_uniformizacao = {
        "Quantidade de alunos": [
            "Quantitativo de aluno",
            "quantidade alunos indica o porte e define a gratificação de acordo com a lei 561/2010 que versa sobre a carreira docente do município",
            "Na quantidade de alunos.",
            "QUANTIDADE DE MATRÍCULAS",
            "A classificação se dá por meio da quantidade de alunos."
        ],
        "Porte da escola (pequeno, médio, grande porte)": [
            "Porte da escola",
            "PORTE DA ESCOLAR",
            "A concessão de gratificação pelo exercício de funções de diretor se dar devido ao porte da escola classificando em suporte A, B e C, de acordo com o plano de carreira, cargos e remuneração dos profissionais da Educação pública municipal. Sendo assim, esta escola encontra-se na posição de suporte B",
            "porte IV",
            "PELO PORTE DA ESCOLA. SOMOS ESCOLA DE MEDIO PORTE"
        ],
        "Não se aplica": [
            "NÃO SE APLICA",
            "Não se Aplica",
            "Não se aplica.",
            "NAO SE APLICA"
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)


    coluna = '6.3.1. Caso a resposta anterior seja "Sim", quais atividades são desenvolvidas? Caso a resposta anterior seja "Não", responder "Não se aplica".'

    mapa_uniformizacao = {
        "Feiras culturais": [
            "Agosto Cultural. Dia da Consciência Negra, com exposição e apresentações."
        ],
        "Não se aplica": [
            "Não se aplica."
        ]
    }

    df = padronizar_respostas(df, coluna, mapa_uniformizacao)
    df = transformar_coluna(df, coluna, "capitalize")



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
    file_gestao = r"C:\Users\User\Downloads\Projeto Monitor Escolar.csv (19).zip"
    etl_csv_gestao(file_gestao)


    file_comunidade = r"C:\Users\User\Downloads\Projeto Monitor Escolar - Resposta da comunidade (5).csv"
    etl_csv_comunidade(file_comunidade)


    # #abrir no navegador
    #
    # caminho = Path("../index.html")
    #
    # webbrowser.open(caminho.resolve().as_uri())


