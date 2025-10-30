import time

from typing import Dict, Iterable, Tuple, Optional
import shutil
import zipfile
import os
import zipfile
import tempfile
import shutil
from typing import List, Tuple, Optional
import pandas as pd
import re
from icecream import ic




def ajustar_coluna_data(df: pd.DataFrame) -> pd.DataFrame:
    """Renomeia a coluna de data e converte para formato brasileiro - (dd/mm/aaaa HH:MM:SS)"""

    print("ajustar_coluna_data")
    coluna_original = "Carimbo de data/hora"

    if coluna_original not in df.columns:
        raise KeyError(f"F Coluna {coluna_original} não encontrada no Dataframe")

    # Converter para datetime (pandas reconhece automaticamente o AM/PM + GMT-3)
    df[coluna_original] = pd.to_datetime(df[coluna_original], errors="coerce")

    #formatar no padrão brasileiro
    df[coluna_original] = df[coluna_original].dt.strftime('%d/%m/%Y %H:%M:%S')

    novo_nome = "Data"
    df.rename(columns={coluna_original: novo_nome}, inplace=True)

    return df






def fragmenta_csv_por_faixas(
        dataframe: pd.DataFrame,
        faixas: Dict[str, Tuple[int, int]],
        id_cols: Optional[Iterable[str]] = None,
        salvar: bool = False,
        prefixo_arquivo: str = "eixo_",
        pasta_destino: str = "./",

) -> Dict[str, pd.DataFrame]:
    """
    Lê o CSV e retorna um dict {nome_eixo: DataFrame} contendo apenas as colunas daquele eixo.
    Salva os CSVs em pasta especifica.

    Parâmetros
    ----------
    csv_path : caminho do CSV de entrada.
    faixas   : mapeia nome do eixo -> (inicio, fim_inclusivo) por índice de coluna.
               Ex.: {"eixo_1": (0, 10), "eixo_2": (11, 20)}
    id_cols  : colunas (por nome) que você quer manter em todos os eixos (ex.: ["Escola","Município"]).
    salvar   : se True, salva cada eixo em CSV.
    prefixo_arquivo : prefixo para os arquivos salvos, ex.: "eixo_" -> "eixo_eixo_1.csv".
    pasta_destino: pasta onde os arquivos serão salvos
    """
    df = dataframe
    out: Dict[str, pd.DataFrame] = {}


    # Colunas de identificação opcionais (mantidas em todos os CSVs)
    id_cols = list(id_cols) if id_cols else []

    for nome_eixo, (ini, fim_inclusivo) in faixas.items():
        # validação básica
        ncols = df.shape[1]
        if not (0 <= ini <= fim_inclusivo < ncols):
            raise IndexError(
                f"Faixa inválida para {nome_eixo}: ({ini}, {fim_inclusivo}) com {ncols} colunas no arquivo."
            )

        # fatia por posição: fim é exclusivo no iloc, então somamos 1
        cols_eixo = df.columns[ini:fim_inclusivo + 1]

        # monta o DataFrame do eixo (id_cols primeiro, se existirem, incluindo o nome da escola)
        cols_final = ["1.1. Nome da Escola"] + [c for c in id_cols if c in df.columns] + list(cols_eixo)
        cols_final = list(dict.fromkeys(cols_final))  # remove duplicatas mantendo a ordem
        eixo_df = df.loc[:, cols_final].copy()

        if salvar:
            os.makedirs(pasta_destino, exist_ok=True)

            caminho_arquivo = os.path.join(pasta_destino, f"{prefixo_arquivo}{nome_eixo}.csv")
            eixo_df.to_csv(caminho_arquivo, index=False, encoding="utf-8")

        out[nome_eixo] = eixo_df

    return out



def rename_move(origem, novo_nome, destino_dir):
    # Garante que a pasta de destino existe
    os.makedirs(destino_dir, exist_ok=True)

    # Se for um ZIP, extrai antes de renomear
    if origem.lower().endswith(".zip") and zipfile.is_zipfile(origem):
        with zipfile.ZipFile(origem, 'r') as zip_ref:
            # Extrai todos os arquivos para a pasta destino
            zip_ref.extractall(destino_dir)

            # Pega o primeiro arquivo extraído (ou poderia iterar todos)
            extraidos = zip_ref.namelist()
            if extraidos:
                caminho_extraido = os.path.join(destino_dir, extraidos[0])
                destino_final = os.path.join(destino_dir, novo_nome)

                # Renomeia o arquivo extraído
                os.replace(caminho_extraido, destino_final)

                return destino_final
            else:
                raise FileNotFoundError("O arquivo zip está vazio.")

    else:
        # Caso não seja zip → apenas move e renomeia
        destino_final = os.path.join(destino_dir, novo_nome)
        shutil.move(origem, destino_final)
        return destino_final



def ensure_csv_local(src_path: str, temp_dir: Optional[str] = None) -> Tuple[str, List[str]] |bool:
    """
    Garante um CSV local a partir de:
      - um arquivo .csv (retorna o próprio caminho), ou
      - um arquivo .zip (extrai o PRIMEIRO .csv e retorna o caminho extraído).

    Retorna: (csv_path_local, paths_para_cleanup)
    """
    paths_to_cleanup: List[str] = []

    # Se já for CSV, só retorna o próprio caminho
    if src_path.lower().endswith(".csv"):
        return src_path, paths_to_cleanup

    # Se for ZIP, extrai o primeiro CSV
    if src_path.lower().endswith(".zip"):
        # diretório temporário para extração
        if temp_dir is None:
            temp_dir = tempfile.mkdtemp(prefix="csv_tmp_")
            paths_to_cleanup.append(temp_dir)

        with zipfile.ZipFile(src_path, "r") as zf:
            csv_members = [n for n in zf.namelist() if n.lower().endswith(".csv")]
            if not csv_members:
                raise FileNotFoundError("Nenhum arquivo CSV encontrado dentro do ZIP.")
            # pega o primeiro CSV
            member = csv_members[0]
            extracted_path = zf.extract(member, path=temp_dir)

            # Em alguns casos o ZIP mantém subpastas; garanta um caminho “achatado” opcionalmente
            # Aqui vamos apenas retornar o caminho extraído
            return extracted_path, paths_to_cleanup

    raise "Arquivo deve terminar em .CSV ou .ZIP"


def normalize_timestamp_column(
    df: pd.DataFrame,
    src_col: str = "Carimbo de data/hora",
    dst_col: str = "Data do Envio",
    tz: str = "America/Fortaleza",
) -> pd.DataFrame:
    """
    Converte a coluna de data/hora para o formato brasileiro e renomeia a coluna.

    - Aceita strings tipo: '2025/09/08 12:41:09 PM GMT-3'
    - Faz parsing com fuso (se houver), converte para o timezone indicado e formata 'dd/mm/yyyy HH:MM:SS'.
    """
    if src_col not in df.columns:
        raise KeyError(f"Coluna '{src_col}' não encontrada. Colunas: {list(df.columns)}")

    # Parsing robusto: interpreta offsets (ex.: GMT-3), normaliza para UTC e converte para tz local
    s = pd.to_datetime(df[src_col], utc=True, errors="coerce")
    # Alguns valores podem falhar no parse; você pode tratar aqui se quiser
    s = s.dt.tz_convert(tz)

    # Formato brasileiro
    df[src_col] = s.dt.strftime("%d/%m/%Y %H:%M:%S")

    # Renomeia a coluna
    if dst_col != src_col:
        df = df.rename(columns={src_col: dst_col})

    return df


def save_csv(df: pd.DataFrame, dest_path: str) -> str:
    """
    Salva o DataFrame com encoding 'utf-8-sig' (bom para abrir no Excel) e retorna o caminho salvo.
    """
    os.makedirs(os.path.dirname(os.path.abspath(dest_path)), exist_ok=True)
    df.to_csv(dest_path, index=False, encoding="utf-8-sig")
    return dest_path


def cleanup_paths(paths: List[str]) -> None:
    """
    Remove arquivos/pastas temporárias criadas no processo.
    """
    for p in paths:
        try:
            if os.path.isdir(p):
                shutil.rmtree(p, ignore_errors=True)
            elif os.path.isfile(p):
                os.remove(p)
        except Exception:
            pass


def corrigir_nao_se_aplica(df: pd.DataFrame) -> pd.DataFrame:
    """
    Corrige variações de 'Não se aplica' em todas as colunas de texto do DataFrame,
    normalizando grafias como 'Nao se aplica', 'não se aplica.', 'NAO SE APLICA', etc.

    Args:
        df (pd.DataFrame): DataFrame de entrada

    Returns:
        pd.DataFrame: DataFrame com as variações corrigidas
    """
    def normalizar_texto(valor):
        if isinstance(valor, str):

            # Converte para minúsculo para comparar
            texto_lower_strip = valor.lower().strip()

            # Corrige apenas variações de "não se aplica"
            if texto_lower_strip in ["nao se aplica", "não se aplica", "não de aplica",
                                     "nâo se aplica", "não se aplica.", "nao se aplica.",
                                     "não se aplida", "não se aplida.", "nâo se aplida", "não se aplida.",]:
                return "Não se aplica"
        return valor

    # Aplica em todas as colunas de tipo texto
    for col in df.columns:
        df[col] = df[col].apply(normalizar_texto)

    return df


def transformar_coluna(df: pd.DataFrame, coluna: str, modo: str = "lower") -> pd.DataFrame:
    """
    Transforma o texto de uma coluna de um DataFrame em 'lower' ou 'capitalize'.

    Args:
        df (pd.DataFrame): DataFrame de entrada
        coluna (str): Nome da coluna a ser transformada
        modo (str): 'lower' para minúsculas ou 'capitalize' para apenas a primeira letra maiúscula

    Returns:
        pd.DataFrame: DataFrame com a coluna transformada
    """
    if coluna not in df.columns:
        raise ValueError(f"A coluna '{coluna}' não existe no DataFrame.")

    # Garante que tudo é string (evita erro com números ou NaN)
    df[coluna] = df[coluna].astype(str)

    print(coluna)
    print(modo)

    if modo == "lower":
        df[coluna] = df[coluna].str.lower()

    elif modo == "capitalize":
        df[coluna] = df[coluna].str.capitalize()

    elif modo == "title":
        df[coluna] = df[coluna].astype(str).str.title()

    elif modo == "upper":
        df[coluna] = df[coluna].str.upper()



    else:
        raise ValueError("Modo inválido. Use 'lower', 'title', 'upper' ou 'capitalize'.")

    print(df[coluna])

    return df


def limpar_coluna(df: pd.DataFrame, coluna: str, remover: list = None, remover_palavras: list = None) -> pd.DataFrame:
    """
    Remove caracteres e/ou palavras indesejadas de uma coluna de texto em um DataFrame.

    Args:
        df (pd.DataFrame): DataFrame de entrada
        coluna (str): Nome da coluna a ser limpa
        remover (list): Lista de caracteres a remover (ex: [",", ".", "-", ";"])
        remover_palavras (list): Lista de palavras a remover (ex: ["computadores", "unidades"])

    Returns:
        pd.DataFrame: DataFrame com a coluna limpa
    """
    if coluna not in df.columns:
        raise ValueError(f"A coluna '{coluna}' não existe no DataFrame.")

    # Remove caracteres individuais
    if remover is None:
        remover = [",", ".", "-", ";", ":", "!", "?", "(", ")", "[", "]", "{", "}", '"', "'"]

    if remover:
        padrao = "[" + re.escape("".join(remover)) + "]"
        df[coluna] = df[coluna].astype(str).str.replace(padrao, "", regex=True)

    # Remove palavras completas (com word boundaries)
    if remover_palavras:
        for palavra in remover_palavras:
            # \b garante que é uma palavra completa, não parte de outra
            # Faz case-insensitive com (?i)
            padrao_palavra = r'\b' + re.escape(palavra) + r'\b'
            df[coluna] = df[coluna].str.replace(padrao_palavra, "", regex=True, flags=re.IGNORECASE)

    # Remove espaços extras que podem ter sobrado
    df[coluna] = df[coluna].str.strip().str.replace(r'\s+', ' ', regex=True)

    return df



import re
import unicodedata
import pandas as pd
from typing import Dict, List, Union

import unicodedata
import pandas as pd
import pandas as pd
import unicodedata
import string


import unicodedata
import pandas as pd

import pandas as pd
import unicodedata
from typing import Dict, List, Union

import pandas as pd
import unicodedata
from typing import Dict, List


def normalizar_texto(texto: str) -> str:
    """Normaliza texto para comparação."""
    if not isinstance(texto, str) or pd.isna(texto):
        return ""

    texto = texto.strip().lower()

    # Remove acentos
    texto = unicodedata.normalize("NFKD", texto)
    texto = texto.encode("ascii", errors="ignore").decode("utf-8")

    # Remove pontuação
    for char in ".;:!?()[]{}-_/\\\"'`":
        texto = texto.replace(char, " ")

    # Remove espaços múltiplos
    texto = " ".join(texto.split())

    return texto


def padronizar_respostas(
        df: pd.DataFrame,
        coluna: str,
        mapa_equivalencias: Dict[str, List[str]]
) -> pd.DataFrame:
    """
    Padroniza respostas baseando-se em um mapa de equivalências.

    Parâmetros:
    -----------
    df : pd.DataFrame
        DataFrame contendo os dados
    coluna : str
        Nome da coluna a ser padronizada
    mapa_equivalencias : Dict[str, List[str]]
        Dicionário: {resposta_padrao: [lista_de_variacoes]}

    Retorna:
    --------
    pd.DataFrame (modificado in-place)
    """
    if coluna not in df.columns:
        raise ValueError(f"Coluna '{coluna}' não existe no DataFrame.")

    # Cria mapa reverso: variacao_normalizada -> resposta_padrao
    mapa_reverso = {}
    for resposta_padrao, variacoes in mapa_equivalencias.items():

        for variacao in variacoes:
            variacao_norm = normalizar_texto(variacao)
            if variacao_norm:
                mapa_reverso[variacao_norm] = resposta_padrao

    # Substitui valores
    def substituir(valor):
        if pd.isna(valor):
            return valor

        valor_norm = normalizar_texto(str(valor))

        return mapa_reverso.get(valor_norm, valor)

    df[coluna] = df[coluna].apply(substituir)

    return df




