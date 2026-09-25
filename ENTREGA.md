# Entrega · SisAgenda

Documento de entrega do produto: o que foi feito, como demonstrar, o que já funciona e o que ficou para depois.

---

## 1. Identificação da versão apresentada

| Item | Valor |
|---|---|
| Produto | SisAgenda — agenda do Instituto Mentes em Desenvolvimento |
| Versão | v1.0.0 |
| Commit | `adeec66` (tag `v1.0.0`) |
| Data da apresentação | 25/09/2026 |
| Endereço em produção | https://sisagenda.vercel.app |
| Repositório | https://github.com/secundariamiquelin/SisAgenda (branch `master`) |
| Acesso de demonstração | Usuário criado pelo instituto; a senha não é publicada aqui |

Como executar o projeto em outra máquina: ver [`README.md`](README.md), seção **Como executar**.

---

## 2. Recursos entregues

### Entrar no sistema
- Login por e-mail e senha, com senha guardada em bcrypt.
- Sessão de 7 dias em cookie `HttpOnly` assinado; fechar o navegador não desconecta.
- Botão **Sair**, que encerra a sessão.
- Bloqueio do e-mail depois de 10 senhas erradas em 15 minutos.
- Não há cadastro público: os usuários são criados por comando, pela equipe técnica.

### Painel
- Saudação com o nome de quem entrou e a contagem de sessões do dia.
- Quatro números: sessões de hoje, crianças em acompanhamento, terapias ativas e sessões concluídas no mês.
- Lista **Quem vem por aí**, com as quatro próximas sessões, hora, criança, terapia, recado e situação, marcando "Hoje" e "Amanhã".
- Atalhos para as telas de cadastro e botões para marcar um atendimento ou abrir a agenda inteira.
- O dia de referência é a data real do computador de quem usa, e vira sozinho à meia-noite.

### Agenda
- Tabela com todas as sessões, ordenadas por dia e hora, com paginação de cinco em cinco.
- Filtro por situação (Todas, Agendado, Confirmado, Concluído, Cancelado).
- Busca por criança, terapia, recado, dia ou horário.
- Situação alterável direto na linha, sem abrir a sessão.
- Marcar, editar e excluir sessões, com confirmação antes de excluir.
- Bloqueio de dois atendimentos ativos no mesmo dia e horário; sessões canceladas liberam o horário.

### Crianças
- Lista com nome, telefone do responsável e observações, com paginação.
- Cadastrar, editar e excluir. Excluir a criança remove também as sessões dela.

### Terapias
- Lista com nome, duração e contribuição, mostrando "Gratuito" quando o valor é zero.
- Cadastrar, editar e excluir. Excluir a terapia remove também as sessões ligadas a ela.

### Em todas as telas
- Aviso no topo a cada ação, com texto em linguagem comum ("Sessão salva na agenda.").
- Estados vazios que explicam o que fazer quando ainda não há nada cadastrado.
- Funciona em celular: o índice vira um menu lateral e as tabelas rolam na horizontal.
- Fechar qualquer janela com **Esc**, com o foco voltando para o botão que a abriu.

---

## 3. Evidências

Imagens em [`docs/evidencias/`](docs/evidencias/), capturadas na versão desta entrega, em ambiente de teste com **dados fictícios** — nenhuma informação real de criança aparece nas evidências.

| # | Arquivo | O que comprova |
|---|---|---|
| 1 | `01-login.png` | Tela de entrada do sistema |
| 2 | `02-login-erro.png` | **Situação inválida:** senha errada devolve "E-mail ou senha incorretos." e não deixa entrar |
| 3 | `03-painel.png` | **Fluxo principal:** painel do dia, com contagens e próximas sessões |
| 4 | `04-agenda.png` | Agenda completa, com filtros, busca, situação por linha e paginação |
| 5 | `05-nova-sessao-modal.png` | **Operação importante:** formulário de marcação preenchido |
| 6 | `06-sessao-salva.png` | A mesma operação concluída: aviso "Sessão salva na agenda." e a sessão das 16:00 na tabela |
| 7 | `07-erro-conflito.png` | **Situação inválida:** tentativa de marcar em horário já ocupado, recusada com a explicação |
| 8 | `08-erro-campos-obrigatorios.png` | **Situação inválida:** salvar sem escolher a criança devolve "Escolha a criança e a terapia da sessão." |
| 9 | `09-criancas.png` | Cadastro das crianças |
| 10 | `10-terapias.png` | Cadastro das terapias |
| 11 | `11-confirmar-exclusao.png` | Confirmação antes de excluir, nomeando o que será apagado |
| 12 | `12-painel-celular.png` | O mesmo painel em tela de celular |
| 13 | `13-testes-api.txt` | Saída das 34 verificações automatizadas da API |

### Verificações automatizadas

O arquivo `docs/evidencias/13-testes-api.txt` traz a execução completa. As 34 verificações cobrem, entre outros casos:

- acesso aos dados sem sessão devolve 401;
- senha errada e e-mail inexistente devolvem a mesma mensagem, sem revelar quais e-mails existem;
- cookie de sessão adulterado é recusado;
- escrita sem o cabeçalho `x-sisagenda` é recusada (proteção contra CSRF);
- conflito de horário recusado, inclusive ao mover uma sessão para um horário ocupado;
- sessão cancelada não bloqueia o horário, e editar a própria sessão não gera conflito falso;
- validações de situação inválida, hora inválida, duração zero e contribuição negativa;
- exclusão em cascata: apagar a criança apaga as sessões dela;
- bloqueio na 11ª tentativa de login em 15 minutos.

Resultado da última execução: **34 de 34 aprovadas**.

### Verificação em produção

Consulta feita ao ambiente publicado, sem sessão:

```
GET  https://sisagenda.vercel.app/api/auth      → 200 {"usuario":null}
GET  https://sisagenda.vercel.app/api/clientes  → 401 {"erro":"Sua sessão expirou. Entre de novo."}
```

O login com um e-mail inexistente respondeu `401 E-mail ou senha incorretos.`, confirmando que o ambiente publicado está ligado ao banco.

---

## 4. Roteiro da demonstração para o cliente

1. Abrir https://sisagenda.vercel.app e entrar com o usuário do instituto.
2. **Painel:** mostrar quantas sessões o dia tem e quem chega primeiro.
3. **Marcar um atendimento:** escolher criança, terapia, dia, hora e deixar um recado; mostrar o aviso de confirmação e a sessão aparecendo na agenda.
4. **Conflito:** tentar marcar outra criança no mesmo horário e mostrar a recusa.
5. **Durante o expediente:** mudar a situação de uma sessão para Confirmado e depois Concluído, direto na linha da tabela.
6. **Cadastros:** incluir uma criança nova e uma terapia nova.
7. **Exclusão:** excluir uma sessão de teste, mostrando a tela de confirmação.
8. **Celular:** abrir o mesmo endereço no telefone e mostrar o menu e a agenda.
9. **Sair** e mostrar que, sem entrar, nada aparece.

---

## 5. Problemas conhecidos e limitações

### Limitações de escopo (decisões conscientes)
| Limitação | Situação |
|---|---|
| Sem cadastro público de usuários | Proposital: é o que impede qualquer pessoa de criar conta e ver dados das crianças. Novos usuários são criados por comando |
| Sem recuperação de senha por e-mail | A troca é feita pelo comando `npm run usuario` com o mesmo e-mail |
| Sem níveis de permissão | Todo usuário que entra vê e altera tudo |
| Sem histórico de alterações | Não é possível saber quem mudou ou excluiu uma sessão |
| Sem relatórios ou exportação | Não há exportar para Excel nem relatório por período |
| Sem lembrete para as famílias | O sistema não envia WhatsApp nem e-mail |
| Sessões avulsas, sem repetição | Não existe "toda terça às 9h"; cada sessão é marcada uma a uma |
| Duração da terapia é informativa | O sistema não bloqueia o encaixe de outra sessão dentro da duração da anterior; ele bloqueia apenas o mesmo horário de início |

### Problemas conhecidos
| Problema | Impacto | Contorno |
|---|---|---|
| `npm run dev` sobe só a interface, sem as funções de `api/` | Atrapalha quem for desenvolver | Usar `npx vercel dev`, que exige login na conta do projeto |
| Não há testes rodando automaticamente a cada alteração | Uma regressão pode chegar à produção | As 34 verificações existem, mas são executadas manualmente |
| Publicação sem etapa de homologação | Todo push na `master` vai direto para o cliente | Conferir antes de publicar; a Vercel permite voltar ao deploy anterior em um clique |
| Backup limitado ao plano gratuito do Neon | Uma exclusão errada pode não ter volta | Exportação manual do banco; está previsto no plano de melhorias |
| Excluir criança ou terapia apaga as sessões ligadas | Perda de histórico sem aviso explícito de quantas sessões serão apagadas | A tela pede confirmação antes; evitar excluir quem já teve atendimento |
| Sem monitoramento | Uma queda só é percebida quando alguém tenta usar | Verificação manual |

---

## 6. O que foi atendido e o que ficou para depois

**Atendido nesta versão:** login seguro, painel do dia, agenda completa com filtro e busca, marcação com bloqueio de conflito, mudança de situação, cadastros de crianças e terapias, uso em celular, publicação em endereço público e banco de dados gerenciado.

**Ficou para depois, por ordem de utilidade para o instituto:**
1. exportar a agenda e o cadastro (Excel ou PDF) para imprimir e prestar contas;
2. sessões que se repetem toda semana;
3. lembrete automático para as famílias;
4. histórico de alterações, mostrando quem mudou o quê;
5. perfis de acesso diferentes para terapeutas e para a coordenação;
6. testes rodando sozinhos a cada alteração e ambiente de homologação antes da publicação.
