# Colaboracao

Este ambiente foi organizado para uso compartilhado.

## Regras basicas

- Nao versionar senhas, chaves, tokens ou arquivos pessoais.
- Manter configuracoes locais em `.env`, que fica fora do Git.
- Registrar configuracoes necessarias em `.env.example`.
- Usar commits pequenos e mensagens claras.
- Antes de alterar arquivos compartilhados, executar `git status`.

## Pastas

- `shared/`: coloque aqui arquivos que devem ser vistos por todos.
- `local/`: use para rascunhos, saidas temporarias e configuracoes da maquina.
- `docs/`: mantenha instrucoes, decisoes e processos do projeto.

## Boas praticas de branch

Crie uma branch para cada mudanca:

```bash
git checkout -b nome-da-mudanca
```

Depois de concluir:

```bash
git add .
git commit -m "Mensagem curta e objetiva"
```

