// Sessões da agenda. GET lista (com criança e terapia) · POST cria ou atualiza (com id) · DELETE ?id=
import { consulta } from './_lib/db.js';
import { comSessao, ErroHttp, idDaUrl, json, lerCorpo } from './_lib/http.js';
import * as validar from './_lib/validar.js';

// Data e hora saem como texto (AAAA-MM-DD e HH:MM), no formato que o front usa.
const COLUNAS = `id, cliente_id, servico_id,
  to_char(data_agendamento, 'YYYY-MM-DD') AS data_agendamento,
  to_char(hora_agendamento, 'HH24:MI') AS hora_agendamento,
  observacao, status, created_at`;

const MENSAGEM_CONFLITO = 'Já existe outro agendamento ativo cadastrado para este dia e horário.';

export const GET = comSessao(async () =>
  json(
    await consulta(`
      SELECT a.*,
        CASE WHEN c.id IS NULL THEN NULL ELSE json_build_object(
          'id', c.id, 'nome', c.nome, 'telefone', c.telefone, 'observacoes', c.observacoes) END AS cliente,
        CASE WHEN s.id IS NULL THEN NULL ELSE json_build_object(
          'id', s.id, 'nome', s.nome, 'duracao_minutos', s.duracao_minutos, 'preco', s.preco::float8) END AS servico
      FROM (SELECT ${COLUNAS} FROM agendamentos) a
      LEFT JOIN clientes c ON c.id = a.cliente_id
      LEFT JOIN servicos s ON s.id = a.servico_id
      ORDER BY a.data_agendamento, a.hora_agendamento`)
  )
);

export const POST = comSessao(async (request) => {
  const corpo = await lerCorpo(request);
  const id = validar.idOpcional(corpo.id);
  const dataAgendamento = validar.data(corpo.data_agendamento);
  const horaAgendamento = validar.hora(corpo.hora_agendamento);
  const status = validar.situacao(corpo.status);

  // Regra: dois atendimentos ativos não dividem o mesmo dia e horário; cancelados não bloqueiam.
  // O índice único parcial no banco garante o mesmo se duas pessoas salvarem ao mesmo tempo.
  if (status !== 'Cancelado') {
    const conflitos = await consulta(
      `SELECT 1 FROM agendamentos
        WHERE data_agendamento = $1 AND hora_agendamento = $2 AND status <> 'Cancelado'
          AND ($3::uuid IS NULL OR id <> $3::uuid)
        LIMIT 1`,
      [dataAgendamento, horaAgendamento, id]
    );
    if (conflitos.length) throw new ErroHttp(409, MENSAGEM_CONFLITO);
  }

  const valores = [
    validar.id(corpo.cliente_id, 'a criança'),
    validar.id(corpo.servico_id, 'a terapia'),
    dataAgendamento,
    horaAgendamento,
    validar.texto(corpo.observacao, 'recados', { maximo: 2000 }),
    status
  ];

  const [agendamento] = id
    ? await consulta(
        `UPDATE agendamentos SET cliente_id = $1, servico_id = $2, data_agendamento = $3,
           hora_agendamento = $4, observacao = $5, status = $6
         WHERE id = $7 RETURNING ${COLUNAS}`,
        [...valores, id]
      )
    : await consulta(
        `INSERT INTO agendamentos (cliente_id, servico_id, data_agendamento, hora_agendamento, observacao, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${COLUNAS}`,
        valores
      );
  if (!agendamento) throw new ErroHttp(404, 'Agendamento não encontrado.');
  return json(agendamento);
});

export const DELETE = comSessao(async (request) => {
  await consulta('DELETE FROM agendamentos WHERE id = $1', [idDaUrl(request)]);
  return json({ ok: true });
});
