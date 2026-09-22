import React from 'react';
import { Agendamento, Cliente, Servico, AppView } from '../types';
import { COR_SITUACAO, HOJE, plural, rotuloDia } from './ui/formatos';

interface DashboardViewProps {
  agendamentos: Agendamento[];
  clientes: Cliente[];
  servicos: Servico[];
  onNavigateTo: (view: AppView, action?: string) => void;
  userEmail: string;
}

const primeiroNome = (email: string) => {
  const emailLower = email.toLowerCase();
  if (emailLower.includes('mileide')) return 'Mileide';
  if (emailLower.includes('adenilson')) return 'Adenilson';
  return 'equipe';
};

export default function DashboardView({
  agendamentos,
  clientes,
  servicos,
  onNavigateTo,
  userEmail
}: DashboardViewProps) {
  // Sessões de hoje que ainda contam (canceladas não entram)
  const agendamentosHojeAtivos = agendamentos.filter(a => a.data_agendamento === HOJE && a.status !== 'Cancelado');

  // Próximas sessões: de hoje em diante, sem as canceladas, já ordenadas por data e hora
  const proximosAgendamentos = agendamentos
    .filter(a => {
      const dataHoraStr = `${a.data_agendamento}T${a.hora_agendamento}:00`;
      const dataHora = new Date(dataHoraStr);
      const referencia = new Date(`${HOJE}T00:00:00`);
      return dataHora >= referencia && a.status !== 'Cancelado';
    })
    .slice(0, 4);

  // Sessões concluídas no mês da data de referência
  const mesReferencia = HOJE.slice(0, 7);
  const concluidasNoMes = agendamentos.filter(
    a => a.status === 'Concluído' && a.data_agendamento.startsWith(mesReferencia)
  ).length;

  const sessoesHoje = agendamentosHojeAtivos.length;
  const saudacao = `Oi, ${primeiroNome(userEmail)}. ${
    sessoesHoje === 1 ? 'Hoje é 1 sessão.' : `Hoje são ${sessoesHoje} sessões.`
  }`;
  const resumoDoDia = sessoesHoje
    ? `A primeira criança chega às ${agendamentosHojeAtivos[0].hora_agendamento}. Confira os recados de cada sessão antes de começar o dia.`
    : 'Nenhuma sessão marcada para hoje — bom momento para chamar quem está na lista de espera.';

  const metricas = [
    { valor: sessoesHoje, rotulo: 'Sessões hoje', nota: 'Confirmadas e a confirmar' },
    { valor: clientes.length, rotulo: 'Crianças', nota: 'Em acompanhamento' },
    { valor: servicos.length, rotulo: 'Terapias', nota: 'Modalidades ativas' },
    { valor: concluidasNoMes, rotulo: 'Concluídas', nota: 'Sessões realizadas no mês' }
  ];

  const atalhos = [
    {
      id: 'dashboard-card-btn-clientes',
      titulo: 'Cadastro das crianças',
      descricao: 'Histórico, contato dos responsáveis e o que cada uma gosta',
      view: 'clientes' as AppView
    },
    {
      id: 'dashboard-card-btn-servicos',
      titulo: 'Terapias oferecidas',
      descricao: 'Duração das sessões e valor simbólico de cada modalidade',
      view: 'servicos' as AppView
    }
  ];

  return (
    <section id="dashboard-view-root" className="pt-11">
      {/* Abertura: saudação e resumo do dia */}
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,300px)] lg:gap-15">
        <div className="min-w-0">
          <h1 className="mb-4 max-w-[16ch] text-[52px] leading-[1.02]">{saudacao}</h1>
          <p className="m-0 max-w-[52ch] text-[19px] leading-[1.5] text-neutral-800">{resumoDoDia}</p>
          <div className="mt-7 flex flex-wrap gap-3.5">
            <button
              id="dashboard-btn-new-appointment"
              type="button"
              onClick={() => onNavigateTo('agendamentos', 'novo')}
              className="btn btn-primary"
            >
              Marcar um atendimento
            </button>
            <button
              id="dashboard-btn-view-all-appointments"
              type="button"
              onClick={() => onNavigateTo('agendamentos')}
              className="btn btn-secondary"
            >
              Ver a agenda inteira
            </button>
          </div>
        </div>

        <div className="min-w-0 text-[14px] leading-[1.6] text-neutral-800">
          <div className="mb-2.5 text-[11px] tracking-[0.12em] text-neutral-700 uppercase">Por que isso importa</div>
          Manter a agenda em dia é o que permite abrir vaga para mais uma família. Cada sessão remarcada com
          antecedência vira um horário livre para quem está na fila.
        </div>
      </div>

      {/* Números do dia */}
      <div className="mt-14 grid gap-10 lg:grid-cols-4">
        {metricas.map((metrica) => (
          <div key={metrica.rotulo} className="min-w-0">
            <div className="text-[58px] leading-none font-semibold tracking-[-0.02em]">{metrica.valor}</div>
            <div className="mt-3.5 text-[13px] tracking-[0.1em] uppercase">{metrica.rotulo}</div>
            <div className="mt-1 text-[13px] text-neutral-700">{metrica.nota}</div>
          </div>
        ))}
      </div>

      <div className="mt-[70px] grid items-start gap-15 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Próximas sessões */}
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-5">
            <h2 className="m-0 text-[30px]">Quem vem por aí</h2>
            <button
              type="button"
              onClick={() => onNavigateTo('agendamentos')}
              className="btn btn-ghost shrink-0 text-[13px] whitespace-nowrap"
            >
              Agenda completa
            </button>
          </div>
          <div className="mt-3.5 h-px bg-divider" />

          {proximosAgendamentos.length === 0 ? (
            <div className="max-w-[44ch] py-[46px]">
              <div className="text-[21px] font-semibold">A agenda está em branco</div>
              <p className="mt-2 mb-[18px] text-[15px] text-neutral-700">
                Nenhuma sessão marcada daqui para a frente. Que tal chamar a primeira família da lista de espera?
              </p>
              <button
                id="dashboard-btn-create-one"
                type="button"
                onClick={() => onNavigateTo('agendamentos', 'novo')}
                className="btn btn-secondary"
              >
                Marcar a primeira
              </button>
            </div>
          ) : (
            <ul>
              {proximosAgendamentos.map((ag) => {
                const cor = COR_SITUACAO[ag.status];
                return (
                  <li key={ag.id} className="flex flex-wrap items-start gap-x-[22px] gap-y-2 border-b border-divider py-5">
                    <div className="min-w-[86px]">
                      <div className="text-[24px] leading-none font-bold">{ag.hora_agendamento}</div>
                      <div
                        className={`mt-[5px] text-[12px] tracking-[0.08em] uppercase
                          ${ag.data_agendamento === HOJE ? 'text-accent-700' : 'text-neutral-700'}`}
                      >
                        {rotuloDia(ag.data_agendamento)}
                      </div>
                    </div>

                    <div className="min-w-[180px] flex-1">
                      <div className="text-[19px] font-semibold">{ag.cliente?.nome || 'Criança removida'}</div>
                      <div className="mt-0.5 text-[14px] text-neutral-700">{ag.servico?.nome || 'Terapia removida'}</div>
                      {ag.observacao && (
                        <div className="mt-1.5 text-[14px] text-neutral-700 italic">&ldquo;{ag.observacao}&rdquo;</div>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 text-[12px] tracking-[0.08em] uppercase ${cor.texto}`}>
                      <span aria-hidden="true" className={`inline-block size-2 ${cor.marca}`} />
                      {ag.status}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Atalhos */}
        <div className="min-w-0">
          <h2 className="m-0 text-[24px]">Atalhos</h2>
          <div className="mt-3.5 h-px bg-divider" />
          {atalhos.map((atalho) => (
            <button
              key={atalho.id}
              id={atalho.id}
              type="button"
              onClick={() => onNavigateTo(atalho.view)}
              className="block w-full cursor-pointer border-b border-divider py-[18px] text-left hover:bg-neutral-100"
            >
              <div className="text-[17px] font-semibold">{atalho.titulo}</div>
              <div className="mt-[3px] text-[13px] text-neutral-700">{atalho.descricao}</div>
            </button>
          ))}
          <figure className="py-[22px] text-[14px] leading-[1.6] text-neutral-800">
            <blockquote className="m-0 italic">
              &ldquo;Enquanto der, a gente atende. O que a agenda organizar, a gente devolve em tempo de brincadeira.&rdquo;
            </blockquote>
            <figcaption className="mt-2.5 text-[12px] tracking-[0.1em] text-neutral-700 uppercase">
              Mileide Martins, fundadora
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
