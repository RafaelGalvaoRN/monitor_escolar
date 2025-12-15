import pandas as pd
import zipfile

# Coloque aqui o caminho do seu arquivo da comunidade
arquivo = r"C:\Users\User\Downloads\Projeto Monitor Escolar - Resposta da comunidade.csv (7).zip"

print("="*80)
print("DIAGNÓSTICO DO ARQUIVO DA COMUNIDADE")
print("="*80)

# Descompactar se for ZIP
if arquivo.endswith('.zip'):
    with zipfile.ZipFile(arquivo, 'r') as zip_ref:
        csv_name = zip_ref.namelist()[0]
        zip_ref.extractall("temp_diagnostic")
        csv_path = f"temp_diagnostic/{csv_name}"
else:
    csv_path = arquivo

# Ler como o seu código atual faz (SEM HEADER)
print("\n1. Como seu código LÊ atualmente (header=None):")
df = pd.read_csv(csv_path, header=None, encoding="utf-8")
print(f"   Shape: {df.shape}")
print(f"   Número de linhas: {df.shape[0]}")
print(f"   Número de colunas: {df.shape[1]}")

# Mostrar primeira linha
print("\n2. PRIMEIRA LINHA (índice 0):")
print(f"   Coluna 0: {df.iloc[0, 0][:100]}...")
print(f"   Coluna 1: {df.iloc[0, 1][:100]}...")
print(f"   Coluna 2: {df.iloc[0, 2]}")

# Mostrar segunda linha
print("\n3. SEGUNDA LINHA (índice 1):")
print(f"   Coluna 0: {df.iloc[1, 0]}")
print(f"   Coluna 1: {df.iloc[1, 1]}")
print(f"   Coluna 2: {df.iloc[1, 2]}")

# Verificar o problema
print("\n4. ANÁLISE:")
primeira_celula = str(df.iloc[0, 0])
if "Como você avalia" in primeira_celula or len(primeira_celula) > 50:
    print("   ❌ PROBLEMA ENCONTRADO!")
    print("   A linha 0 contém as PERGUNTAS do questionário, não os dados!")
    print("\n   SOLUÇÃO:")
    print("   Você precisa PULAR a linha 0 ao ler o CSV")
    print("   Use: pd.read_csv(..., header=None, skiprows=[0])")
else:
    print("   ✓ OK - A linha 0 contém dados válidos")

# Testar a leitura CORRETA (pulando linha 0)
print("\n" + "="*80)
print("5. TESTE: Lendo PULANDO a linha 0")
print("="*80)
df_correto = pd.read_csv(csv_path, header=None, skiprows=[0], encoding="utf-8")
print(f"   Shape: {df_correto.shape}")
print(f"   Número de linhas: {df_correto.shape[0]}")

print("\n   PRIMEIRA LINHA (agora é a antiga segunda linha):")
print(f"   Coluna 0: {df_correto.iloc[0, 0]}")
print(f"   Coluna 1: {df_correto.iloc[0, 1]}")
print(f"   Coluna 2: {df_correto.iloc[0, 2]}")

print("\n   Colunas 2-12 (devem ser números de 1 a 5):")
print(f"   {df_correto.iloc[0, 2:13].tolist()}")

# Verificar se são numéricos
print("\n6. VERIFICAÇÃO FINAL:")
colunas_numericas = df_correto.iloc[:, 2:13]
todos_numericos = True
for col in colunas_numericas.columns:
    try:
        pd.to_numeric(colunas_numericas[col], errors='raise')
    except:
        todos_numericos = False
        print(f"   ❌ Coluna {col} NÃO é numérica")

if todos_numericos:
    print("   ✓ SUCESSO! Todas as colunas de avaliação (2-12) são numéricas")
    print("\n" + "="*80)
    print("CONCLUSÃO: Use skiprows=[0] na leitura do CSV da comunidade")
    print("="*80)