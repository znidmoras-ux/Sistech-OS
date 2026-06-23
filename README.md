# Sistech OS

Ambiente compartilhado do projeto Sistech OS.

## Estrutura

- `docs/`: documentacao do projeto e combinados da equipe.
- `shared/`: arquivos compartilhados que podem ser versionados.
- `local/`: arquivos locais da maquina, ignorados pelo Git.

## Primeiros passos

1. Copie `.env.example` para `.env`.
2. Ajuste as variaveis locais no `.env`.
3. Leia `docs/COLABORACAO.md` antes de iniciar uma mudanca.

## Fluxo sugerido

```bash
git status
git pull
git checkout -b minha-mudanca
git add .
git commit -m "Descreve a mudanca"
```

