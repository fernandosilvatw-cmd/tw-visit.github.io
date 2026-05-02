# CLAUDE.md — Tecwise Visit Camp

Este arquivo orienta o Claude Code ao trabalhar neste repositório.

---

## Projeto

Aplicação web de página única (HTML/CSS/JS puro) para a equipe comercial da **Tecwise** registrar visitas técnicas e gerar relatórios em PDF. Sem servidor, sem build, sem dependências — tudo em `index.html`.

**Repositório GitHub:** https://github.com/fernandosilvatw-cmd/tw-visit.github.io  
**URL publicada (GitHub Pages):** https://fernandosilvatw-cmd.github.io/tw-visit.github.io/

---

## Como rodar

Abrir `index.html` diretamente no navegador. Sem servidor necessário.

---

## Publicação automática no GitHub Pages

**A cada alteração nos arquivos do projeto, o Claude DEVE automaticamente:**

```
git add -A
git commit -m "descrição curta do que foi alterado"
git push
```

O GitHub Pages faz o deploy automaticamente em até 1 minuto após o push.

O hook `Stop` em `.claude/settings.local.json` também executa `_sincronizar.ps1`
automaticamente ao final de cada resposta do Claude — mas o Claude não deve depender
somente do hook: deve rodar o push manualmente sempre que fizer alterações nos arquivos.

Para sincronização manual pelo usuário: executar `_sincronizar.ps1` no PowerShell ou
abrir o arquivo com duplo clique (clique com botão direito → "Executar com PowerShell").

---

## Arquitetura

Todo o código vive em `index.html` (~1750 linhas), dividido em três blocos:

| Bloco | Linhas aprox. | Conteúdo |
|---|---|---|
| `<style>` | 11–620 | CSS: sidebar, cards, formulário, modal, impressão, responsivo |
| `<body>` (HTML) | 621–1130 | Sidebar + 5 seções de página + modal relatório + toast |
| `<script>` | 1135–1751 | Toda a lógica JS — sem frameworks |

### Modelo de navegação

Cinco páginas compartilham o mesmo `<main>`. Apenas uma fica visível por vez. `navegar(id, el)` esconde todas e exibe a alvo. Os botões da sidebar acionam isso.

### Camada de dados (localStorage)

| Chave | Valor |
|---|---|
| `tw-visitas` | `JSON.stringify(Visit[])` |
| `tw-config` | `JSON.stringify({ nome: string })` |

IDs de visita são timestamps (`Date.now().toString()`). A variável global `visitaEmEdicao` distingue criação vs. edição no submit do formulário.

### Funções JavaScript principais

| Função | Propósito |
|---|---|
| `coletarForm()` | Lê todos os campos do formulário em um objeto visita |
| `salvarVisita()` | Cria ou atualiza uma visita no localStorage |
| `renderHistorico(filtro)` | Renderiza a lista de visitas com busca |
| `editarVisita(id)` | Carrega uma visita de volta no formulário |
| `montarRelatorio(v)` | Gera o HTML do relatório para impressão |
| `atualizarCards()` | Recalcula os 4 cards de resumo do dashboard |
| `toast(msg, tipo)` | Notificação temporária (ok / err) |

### Convenções de IDs

- Campos do formulário: prefixo `f-` (ex: `f-empresa`, `f-data`)
- Cards de resumo: prefixo `c-` (ex: `c-total`, `c-mes`)
- `C(label, val)` / `CF(label, val)` — helpers dentro de `montarRelatorio()` para linhas em duas colunas ou largura total

### Adicionando um novo campo ao formulário

1. Adicionar o `<input>`/`<select>`/`<textarea>` na seção HTML correspondente com ID `f-novocamp`
2. Capturar em `coletarForm()`: `novoCamp: document.getElementById('f-novocamp').value`
3. Restaurar em `editarVisita()`: `document.getElementById('f-novocamp').value = v.novoCamp || ''`
4. Opcionalmente exibir em `montarRelatorio()` usando `C(...)` ou `CF(...)`
5. Limpar em `limparForm()` se precisar de reset especial

---

## CSS — Convenções

- Azul principal: `#2563eb` · Sidebar escura: `#1a2333` · Fundo geral: `#f1f5f9`
- Badges de interesse: azul (Frio) · amarelo/âmbar (Morno) · vermelho (Quente)
- Grids: `.g2` `.g3` `.g4` para 2/3/4 colunas
- Breakpoints: 1024 px (tablet) · 768 px (mobile com hamburger) · 480 px (coluna única)

---

## Idioma

UI, labels, comentários e dados em Português Brasileiro (pt-BR).
