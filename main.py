from utils import fragmenta_csv_por_faixas










if __name__ == '__main__':

    result = fragmenta_csv_por_faixas("dados_escolares.csv",
                                      {"eixo_1": (0, 1),
                                       "eixo_2": (2, 10),
                                       "eixo_3": (11, 11),
                                       },
                                      salvar=True,
                                      prefixo_arquivo="eixo_",
                                      pasta_destino="data"
                                     )

