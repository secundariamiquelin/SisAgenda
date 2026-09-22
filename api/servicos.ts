// Terapias oferecidas. GET lista · POST cria ou atualiza (com id) · DELETE ?id=
import { consulta } from './_lib/db.js';
import { comSessao, ErroHttp, idDaUrl, json, lerCorpo } from './_lib/http.js';
import * as validar from './_lib/validar.js';

// NUMERIC chega do driver como texto; float8 devolve número para o front.
const COLUNAS = 'id, nome, duracao_minutos, preco::float8 AS preco, created_at';

export const GET = comSessao(async () => json(await consulta(`SELECT ${COLUNAS} FROM servicos ORDER BY nome`)));

export const POST = comSessao(async (request) => {
  const corpo = await lerCorpo(request);
  const id = validar.idOpcional(corpo.id);
  const valores = [
    validar.texto(corpo.nome, 'nome', { obrigatorio: true, maximo: 200 }),
    validar.numero(corpo.duracao_minutos, 'duração', { minimo: 1, inteiro: true }),
    validar.numero(corpo.preco, 'contribuição')
  ];

  const [servico] = id
    ? await consulta(
        `UPDATE servicos SET nome = $1, duracao_minutos = $2, preco = $3 WHERE id = $4 RETURNING ${COLUNAS}`,
        [...valores, id]
      )
    : await consulta(
        `INSERT INTO servicos (nome, duracao_minutos, preco) VALUES ($1, $2, $3) RETURNING ${COLUNAS}`,
        valores
      );
  if (!servico) throw new ErroHttp(404, 'Serviço não encontrado.');
  return json(servico);
});

// As sessões desta terapia saem junto (ON DELETE CASCADE).
export const DELETE = comSessao(async (request) => {
  await consulta('DELETE FROM servicos WHERE id = $1', [idDaUrl(request)]);
  return json({ ok: true });
});
