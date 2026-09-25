# Estudo do produto · O SisAgenda consegue continuar vivo?

Diagnóstico do sistema realmente entregue, escrito depois da entrega da versão `v1.0.0`. As evidências citadas estão em [`ENTREGA.md`](ENTREGA.md) e em [`docs/evidencias/`](docs/evidencias/).

**Equipe:** Gabriel Ferreira Miquelin · Afonso Cavichioli Alves · Rodrigo Piques
**Data:** 25/09/2026

---

## 1. Diagnóstico

### 1.1 Qual é o produto e qual problema ele resolve

O SisAgenda é a agenda de atendimentos do Instituto Mentes em Desenvolvimento, em Sarandi (PR), que atende crianças autistas. Ele substitui o controle em papel e planilha: guarda o cadastro das crianças, as terapias oferecidas e as sessões marcadas, com situação (Agendado, Confirmado, Concluído, Cancelado).

O problema concreto que ele resolve é a colisão de horários e a perda de recados. A regra central é que dois atendimentos ativos não podem dividir o mesmo dia e horário, e que uma sessão cancelada libera aquele horário para outra criança — o que importa num instituto com fila de espera. O painel responde a pergunta do começo do dia: quem chega, a que horas e com qual recado (evidência `03-painel.png`).

### 1.2 Quem usa, quem mantém e quem recebe as versões

| Papel | Quem é hoje | Observação |
|---|---|---|
| Quem usa | A equipe do instituto, por um único login | Não há perfis diferentes: quem entra vê e altera tudo |
| Quem mantém | Nós três, sem divisão formal de responsabilidade | Na prática, quem publicou as últimas versões foi um só integrante |
| Quem recebe a versão | O próprio instituto, direto em produção | Não existe etapa de aceite: a versão publicada já é a que a cliente usa |

Esse é o primeiro achado do diagnóstico: **quem recebe a nova versão é o cliente, sem intermediário**. Não há ninguém entre o nosso push e o expediente do instituto.

### 1.3 Como o produto é executado hoje

- **Em produção:** publicado na Vercel, em https://sisagenda.vercel.app. A interface é um site estático gerado pelo Vite; a API são funções serverless na pasta `api/`; os dados ficam num PostgreSQL no Neon.
- **A publicação é automática:** o projeto está ligado ao repositório pelo GitHub App, e **todo push na branch `master` vira um deploy de produção** em cerca de um minuto. Não existe comando de deploy nem aprovação.
- **Configuração:** duas variáveis, `DATABASE_URL` e `SESSION_SECRET`, cadastradas no painel da Vercel. Elas são lidas quando a função roda, então mudança só vale em deploy novo.
- **Na máquina do desenvolvedor:** `npm run dev` sobe **apenas a interface**. As funções de `api/` são executadas pela plataforma, então login e listas não funcionam nesse modo. Rodar tudo junto exige `npx vercel dev`, com login na conta do projeto.

### 1.4 Quais passos ainda dependem de ação manual

| Passo | Como é feito hoje | Consequência de esquecer |
|---|---|---|
| Criar as tabelas em um banco novo | `npm run db:tabelas` | O sistema sobe e quebra na primeira consulta |
| Criar ou trocar a senha de um usuário | `npm run usuario -- email` | Ninguém consegue entrar |
| Cadastrar as variáveis de ambiente | Manualmente, no painel da Vercel | Erro 500 no login, sem mensagem explicando |
| Publicar de novo depois de mudar variável | Clicar em Redeploy ou dar um push | A variável nova simplesmente não vale |
| Conferir se o deploy deu certo | Abrir o site e fazer login | Quebra descoberta pela cliente |
| Rodar as verificações da API | Executadas manualmente, fora do repositório | Regressão chega à produção |
| Backup dos dados | Não é feito por nós; depende do plano do Neon | Perda de dados sem volta |
| Voltar uma versão ruim | Botão de rollback no painel da Vercel | Depende de alguém perceber e saber onde clicar |

### 1.5 O que pode dar errado em uma nova entrega

1. **Mudança de banco sem caminho de atualização.** O arquivo `db/schema.sql` só cria o que não existe (`CREATE TABLE IF NOT EXISTS`). Se a próxima versão precisar de uma coluna nova, não há nada no projeto que aplique essa alteração num banco que já tem dados. Hoje isso seria feito na mão, direto no banco de produção.
2. **Configuração fora de sincronia com o código.** Já aconteceu: ao ligar o banco Neon, o prefixo sugerido pela plataforma criaria a variável como `STORAGE_URL`, enquanto o código lê `DATABASE_URL`. Corrigimos antes de conectar, mas o erro teria derrubado o login sem nenhuma pista na tela.
3. **Regressão silenciosa nas regras.** A regra de conflito de horário e o login não têm teste rodando automaticamente. Um refatoramento pode afrouxar a regra sem ninguém ver.
4. **Sessões derrubadas sem querer.** Trocar o `SESSION_SECRET` desconecta todo mundo na hora. É um efeito colateral pouco óbvio de "arrumar uma variável".
5. **Exclusão em cascata.** Apagar uma criança ou uma terapia apaga junto as sessões ligadas a ela (`ON DELETE CASCADE`). A tela pede confirmação (evidência `11-confirmar-exclusao.png`), mas não diz quantas sessões vão junto.
6. **Publicação durante o expediente.** Como o deploy é imediato, subir uma versão às 9h da manhã é subir no meio dos atendimentos.
7. **Dependência de planos gratuitos.** Vercel e Neon no plano gratuito: limites, hibernação do banco e as regras de uso do plano Hobby são coisas que não controlamos.

### 1.6 Que evidência mostra que o produto está pronto hoje

| Evidência | O que ela mostra |
|---|---|
| https://sisagenda.vercel.app | O produto está publicado e acessível |
| Tag `v1.0.0` no repositório | Existe uma versão identificada, e dá para saber exatamente qual código foi entregue |
| `docs/evidencias/03-painel.png`, `04-agenda.png`, `09-criancas.png`, `10-terapias.png` | As quatro telas do produto funcionando com dados |
| `docs/evidencias/05-nova-sessao-modal.png` e `06-sessao-salva.png` | Uma operação importante do começo ao fim: marcar um atendimento e vê-lo na agenda |
| `docs/evidencias/02-login-erro.png`, `07-erro-conflito.png`, `08-erro-campos-obrigatorios.png` | Três situações inválidas tratadas com mensagem clara, em vez de erro técnico |
| `docs/evidencias/13-testes-api.txt` | 34 verificações da API aprovadas, incluindo conflito de horário, sessão inválida e bloqueio por tentativas de login |
| `docs/evidencias/12-painel-celular.png` | O sistema utilizável no celular |
| Resposta de produção: `GET /api/clientes` → `401` sem sessão | O acesso aos dados exige login também no ambiente publicado |

Essas evidências mostram que o produto **funciona**. Elas não mostram que ele **é usado** — não temos nenhum dado de uso, e essa é a lacuna principal para planejar a próxima versão.

### 1.7 O que precisaria ser documentado para outra pessoa manter o sistema

Parte já está no [`README.md`](README.md) (execução, variáveis, scripts, publicação e segurança) e em [`ENTREGA.md`](ENTREGA.md) (recursos, limitações). Falta documentar:

1. **Procedimento de recuperação:** como voltar para o deploy anterior no painel da Vercel, e em quanto tempo isso vale.
2. **Procedimento de restauração de dados:** como gerar e como restaurar um backup do banco, com um teste já feito ao menos uma vez.
3. **Mapa de configuração:** quais variáveis existem, o que cada uma faz e o que acontece ao trocar cada uma — em especial o efeito de trocar o `SESSION_SECRET`.
4. **Como criar e remover usuários**, e o que fazer quando alguém esquece a senha.
5. **Regras de negócio escritas:** conflito de horário, efeito do cancelamento, exclusão em cascata. Hoje isso só existe no código e na cabeça de quem escreveu.
6. **Contatos e contas:** quem tem acesso à Vercel, ao Neon e ao repositório.
7. **Como alterar o banco numa versão futura**, já que não há ferramenta de migração no projeto.

---

## 2. Leitura do futuro do produto

### Ponto 1 · Ambiente de homologação antes da produção

- **Problema que resolve:** hoje não existe lugar para ver a mudança rodando de verdade antes de a cliente ver. A falha que já tivemos — variável de ambiente criada depois do deploy, login respondendo erro 500 — é exatamente do tipo que só aparece com a aplicação publicada, e não em teste de código.
- **Benefício:** o instituto para de ser o primeiro a encontrar o erro. Para a equipe, dá um lugar seguro para testar mudança de banco, que é a alteração mais arriscada que temos pela frente.
- **Custo, risco ou dificuldade:** exige um segundo banco e uma segunda configuração, que passam a ter de ser mantidos. O risco sério é usar uma cópia dos dados de produção no ambiente de teste: o banco guarda dados de saúde de crianças, e um endereço de teste costuma ser menos protegido que o de produção.
- **O que falta investigar:** se dá para criar o banco de teste apenas com a estrutura, sem dados reais; quanto disso cabe no plano gratuito; e quem pode acessar o endereço de homologação.

### Ponto 2 · Verificação automática a cada alteração (pipeline)

- **Problema que resolve:** as 34 verificações da API existem e passam, mas rodam quando alguém lembra, na máquina de quem lembrou. Entre lembrar e esquecer, quem paga é a produção.
- **Benefício:** as regras que sustentam o produto — conflito de horário, login, validações — passam a ser conferidas em toda alteração, numa máquina limpa. Para o cliente, significa menos chance de perder o dia de trabalho por causa de uma correção nossa.
- **Custo, risco ou dificuldade:** é preciso mover os testes para dentro do repositório e escrever a configuração do pipeline. O risco é o teste frágil, que falha por motivo bobo e ensina a equipe a ignorar o alerta vermelho; e o pipeline lento, que a gente acaba contornando.
- **O que falta investigar:** se o banco em memória usado nos testes roda no ambiente do serviço de automação, quanto tempo a execução leva e como corrigir uma urgência quando a regra de bloqueio estiver ligada.

### Ponto 3 · Documentação operacional e recuperação

- **Problema que resolve:** hoje o conhecimento de como publicar, configurar, criar usuário e voltar uma versão está com uma pessoa. Se ela não estiver disponível, o instituto fica sem suporte, mesmo com o código todo aberto no GitHub.
- **Benefício:** qualquer integrante da equipe consegue atender a cliente. E, com backup próprio, uma exclusão errada deixa de ser perda definitiva — o que importa num sistema cujo dado é histórico de atendimento de criança.
- **Custo, risco ou dificuldade:** documentação envelhece e passa a mentir, o que é pior do que não existir. O backup também cria um problema novo: um arquivo com dados sensíveis fora da plataforma, que precisa ficar cifrado e em lugar controlado.
- **O que falta investigar:** quanto tempo o plano atual do Neon permite voltar no tempo; com que frequência o backup precisa rodar para o instituto considerar aceitável o que seria perdido; e onde guardá-lo.

---

## 3. Conclusão do diagnóstico

O produto está pronto no sentido que a cliente percebe: publicado, com login, com as telas funcionando e com os erros tratados em linguagem clara. Ele **não** está pronto no sentido de sobreviver bem a uma segunda versão: não há lugar para testar antes, não há verificação automática, não há caminho definido para alterar o banco e não há backup nosso.

A pergunta da cliente — quem publica, como saber se quebrou, onde testar e como recuperar — tem hoje estas respostas honestas: publica quem der um push; saberemos que quebrou quando ela avisar; testamos na própria produção; e recuperamos com o botão de rollback da Vercel, se alguém perceber a tempo. Melhorar essas quatro respostas é o trabalho da próxima etapa, e não exige nenhuma ferramenta que a equipe ainda não saiba usar.
