# Script de sincronização automática — Tecwise Visit Camp
# Detecta alterações no projeto e publica no GitHub Pages automaticamente

$ErrorActionPreference = 'SilentlyContinue'
Set-Location "C:\Users\User\OneDrive\VS_CODE\TW_Visit_Camp"

# Adiciona todos os arquivos modificados
git add -A 2>$null

# Verifica se há algo para commitar
$alteracoes = git status --porcelain 2>$null

if ($alteracoes) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
    git commit -m "auto: atualização $timestamp" 2>$null
    git push 2>$null
    Write-Host "✓ Publicado no GitHub Pages em $timestamp"
}
# Se não há alterações, sai silenciosamente (sem erro)
exit 0
