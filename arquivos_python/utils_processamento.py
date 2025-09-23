# utils_processamento.py
from io import StringIO
from pathlib import Path
import pandas as pd
import csv

def _normalize_records_quote_aware(text: str, quotechar: str = '"') -> str:
    # Junta linhas até fechar aspas; normaliza EOL e aspas curvas
    text = text.replace("“", '"').replace("”", '"')
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    out, buf, inside = [], [], False
    i, n = 0, len(text)
    while i < n:
        ch = text[i]
        if ch == quotechar:
            # "" (aspas literal)
            if i + 1 < n and text[i+1] == quotechar:
                buf.append(quotechar + quotechar); i += 2; continue
            inside = not inside; buf.append(ch); i += 1; continue
        if ch == "\n" and not inside:
            line = "".join(buf)
            if line.strip(): out.append(line)
            buf = []; i += 1; continue
        buf.append(ch); i += 1
    if buf:
        line = "".join(buf)
        if line.strip(): out.append(line)
    return "\n".join(out)

def _strip_trailing_semicolons_outside_quotes(line: str, quotechar: str = '"') -> str:
    # Remove ;/espaços APENAS no FINAL da linha e APENAS se estivermos fora de aspas
    inside = False
    j = 0
    while j < len(line):
        c = line[j]
        if c == quotechar:
            if j + 1 < len(line) and line[j+1] == quotechar:
                j += 2; continue
            inside = not inside
        j += 1
    if inside:
        return line
    while line and line[-1] in (";", " ", "\t"):
        line = line[:-1]
    return line

def _split_csv_line_outside_quotes(line: str, sep: str = ",", quotechar: str = '"') -> list[str]:
    """Divide uma linha CSV em campos, separando por vírgula apenas quando estiver fora de aspas.
       Também resolve aspas duplas '""' dentro do campo para '"'.
    """
    fields = []
    cur = []
    i, n = 0, len(line)
    inside = False
    while i < n:
        ch = line[i]
        if ch == quotechar:
            # aspas dupla -> literal "
            if i + 1 < n and line[i+1] == quotechar:
                cur.append('"'); i += 2; continue
            inside = not inside
            i += 1
            continue
        if ch == sep and not inside:
            fields.append("".join(cur))
            cur = []
            i += 1
            continue
        cur.append(ch)
        i += 1
    fields.append("".join(cur))
    # tira aspas externas se o campo inteiro estava entre aspas
    cleaned = []
    for f in fields:
        if len(f) >= 2 and f[0] == '"' and f[-1] == '"':
            cleaned.append(f[1:-1])
        else:
            cleaned.append(f)
    return cleaned

def carregar_csv_forms_v7(path: str, save_clean_as: str | None = None,
                          rename_timestamp: bool = False) -> pd.DataFrame:
    # 1) Lê bytes com BOM seguro
    raw = Path(path).read_bytes().decode("utf-8-sig", errors="replace")
    # 2) Junta registros quebrados
    normalized = _normalize_records_quote_aware(raw)
    # 3) Remove ';' finais fora de aspas (ex.: no cabeçalho)
    lines = [ln for ln in normalized.split("\n") if ln.strip()]
    lines = [_strip_trailing_semicolons_outside_quotes(ln) for ln in lines]

    # 4) Split manual de cada linha
    rows = [_split_csv_line_outside_quotes(ln, sep=",", quotechar='"') for ln in lines]
    if not rows:
        raise ValueError("CSV vazio após normalização.")

    header = rows[0]
    data = rows[1:]

    # Normaliza linhas que vieram com menos/mais colunas
    cols = len(header)
    fixed = []
    for r in data:
        if len(r) < cols:
            r = r + [""] * (cols - len(r))
        elif len(r) > cols:
            r = r[:cols]
        fixed.append(r)

    df = pd.DataFrame(fixed, columns=header)

    # 5) opcional: renomeia e formata a coluna de data
    if rename_timestamp and "Carimbo de data/hora" in df.columns:
        df = df.rename(columns={"Carimbo de data/hora": "Data do Envio"})
        try:
            df["Data do Envio"] = pd.to_datetime(df["Data do Envio"], errors="coerce").dt.strftime("%d/%m/%Y %H:%M:%S")
        except Exception:
            pass

    # 6) Salva limpo, se solicitado
    if save_clean_as:
        out = Path(save_clean_as)
        out.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out, index=False, encoding="utf-8-sig", sep=",", quoting=csv.QUOTE_ALL)

    return df


def limpar_dataframe_completo(df: pd.DataFrame) -> pd.DataFrame:
    """
    Limpa todo o DataFrame removendo problemas comuns em dados de texto.

    Parâmetros:
    -----------
    df : pd.DataFrame
        DataFrame a ser limpo

    Retorna:
    --------
    pd.DataFrame
        DataFrame limpo com os mesmos índices e colunas
    """

    # Criar cópia para não modificar o original
    df_limpo = df.copy()

    # Processar cada coluna
    for coluna in df_limpo.columns:
        # Aplicar limpeza apenas em colunas de texto (object)
        if df_limpo[coluna].dtype == 'object':
            df_limpo[coluna] = df_limpo[coluna].apply(_limpar_celula)

    # Remover linhas completamente vazias
    df_limpo = df_limpo.dropna(how='all')

    # Resetar índices se necessário (opcional)
    # df_limpo = df_limpo.reset_index(drop=True)

    return df_limpo


def _limpar_celula(valor):
    """
    Função auxiliar para limpar uma célula individual.
    """

    # Se for NaN ou None, retornar como está
    if pd.isna(valor):
        return valor

    # Converter para string
    texto = str(valor).strip()

    # Se estiver vazio após strip, retornar vazio
    if not texto:
        return ""

    # Limpezas específicas:

    # 1. Remover quebras de linha e caracteres de controle
    texto = texto.replace('\n', ' ')
    texto = texto.replace('\r', ' ')
    texto = texto.replace('\t', ' ')

    # 2. Remover espaços múltiplos (substitui por um único espaço)
    texto = ' '.join(texto.split())

    # 3. Corrigir pontuação mal formatada
    texto = texto.replace(' .', '.')
    texto = texto.replace(' ,', ',')
    texto = texto.replace(' ;', ';')
    texto = texto.replace(' :', ':')
    texto = texto.replace(' !', '!')
    texto = texto.replace(' ?', '?')

    # 4. Remover espaços antes e depois
    texto = texto.strip()

    # 5. Corrigir pontos duplos ou triplos
    import re
    texto = re.sub(r'\.{2,}', '.', texto)

    # 6. Remover caracteres especiais problemáticos (opcional)
    # texto = re.sub(r'[^\w\s\.,;:!?()\-\'\"áéíóúàèìòùâêîôûãõçÁÉÍÓÚÀÈÌÒÙÂÊÎÔÛÃÕÇ]', '', texto)

    return texto

