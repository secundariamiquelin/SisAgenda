// Crianças atendidas. GET lista · POST cria ou atualiza (com id) · DELETE ?id=
import { consulta } from './_lib/db.js';
import { comSessao, ErroHttp, idDaUrl, json, lerCorpo } from './_lib/http.js';
import * as validar from './_lib/validar.js';

const COLUNAS = 'id, nome, telefone, observacoes, created_at';

export const GET = comSessao(async () => json(await consulta(`SELECT ${COLUNAS} FROM clientes ORDER BY nome`)));

export const POST = comSessao(async (request) => {
  const corpo = await lerCorpo(request);
  const id = validar.idOpcional(corpo.id);
  const valores = [
    validar.texto(corpo.nome, 'nome', { obrigatorio: true, maximo: 200 }),
    validar.texto(corpo.telefone, 'telefone', { maximo: 40 }),
    validar.texto(corpo.observacoes, 'observações', { maximo: 5000 })
  ];

  const [cliente] = id
    ? await consulta(
        `UPDATE clientes SET nome = $1, telefone = $2, observacoes = $3 WHERE id = $4 RETURNING ${COLUNAS}`,
        [...valores, id]
      )
    : await consulta(
        `INSERT INTO clientes (nome, telefone, observacoes) VALUES ($1, $2, $3) RETURNING ${COLUNAS}`,
        valores
      );
  if (!cliente) throw new ErroHttp(404, 'Cliente não encontrado.');
  return json(cliente);
});

// As sessões da criança saem junto (ON DELETE CASCADE).
export const DELETE = comSessao(async (request) => {
  await consulta('DELETE FROM clientes WHERE id = $1', [idDaUrl(request)]);
  return json({ ok: true });
});
