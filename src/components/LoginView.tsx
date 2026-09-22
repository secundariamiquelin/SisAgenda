import React, { useState } from 'react';
import { Eye, WarningCircle } from '@phosphor-icons/react';
import { DbService } from '../services/db';
import Campo from './ui/Campo';

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha) {
      setErro('Preencha o e-mail e a senha para continuar.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');
      const loggedUser = await DbService.login(email, senha);
      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setErro(err.message || 'Não deu para entrar. Confira o e-mail e a senha.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div id="login-view-root" className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
      {/* Coluna da marca */}
      <div className="flex min-w-0 flex-col justify-between gap-10 px-5 py-10 md:px-[50px] lg:py-15">
        <div className="flex flex-wrap justify-between gap-3 text-[12px] tracking-[0.09em] text-neutral-700 uppercase">
          <span>Instituto Mentes em Desenvolvimento</span>
          <span>Sarandi · Paraná</span>
        </div>

        <div className="max-w-[620px]">
          <div className="mb-3.5 text-[12px] tracking-[0.14em] text-neutral-700 uppercase">A agenda do instituto</div>
          <h1 className="m-0 text-[58px] leading-[0.94] tracking-[-0.035em] lg:text-[92px]">SisAgenda</h1>
          <p className="mt-[26px] mb-0 max-w-[30ch] text-[21px] leading-[1.45] text-neutral-800">
            Cada horário aqui dentro é uma criança esperada pelo nome. A gente cuida da agenda para que vocês cuidem delas.
          </p>
        </div>

        <p className="m-0 max-w-[52ch] text-[13px] text-neutral-700">
          Atendimento psicopedagógico, psicológico e fonoaudiológico para crianças autistas, mantido por Mileide e
          Adenilson com apoio da comunidade de Sarandi.
        </p>
      </div>

      {/* Coluna do acesso */}
      <div className="flex min-w-0 flex-col justify-center border-t border-divider px-5 py-10 md:px-[50px] lg:border-t-0 lg:border-l lg:py-15">
        <div className="w-full max-w-[380px]">
          <h2 className="mb-1.5 text-[30px]">Bom te ver de novo</h2>
          <p className="mb-[26px] text-[14px] text-neutral-700">
            Entre com o e-mail do instituto para abrir a agenda de hoje.
          </p>

          {erro && (
            <div role="alert" className="mb-[18px] flex items-start gap-2.5 text-[13px] text-accent-2-700">
              <WarningCircle className="mt-px shrink-0" aria-hidden="true" />
              <span>{erro}</span>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="flex flex-col gap-[18px]">
            <Campo rotulo="E-mail">
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@mentes.org.br"
                className="input"
              />
            </Campo>

            <Campo rotulo="Senha">
              <div className="relative flex">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Sua senha"
                  className="input pr-11"
                />
                <button
                  id="login-toggle-password-visibility"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-neutral-700 hover:text-accent-700"
                >
                  <Eye aria-hidden="true" />
                </button>
              </div>
            </Campo>

            <button id="login-submit-btn" type="submit" disabled={carregando} className="btn btn-primary w-full">
              {carregando ? 'Abrindo a agenda…' : 'Abrir a agenda'}
            </button>
          </form>

          <div className="mt-[34px] flex items-center gap-2 border-t border-divider pt-4 text-[12px] text-neutral-700">
            <span aria-hidden="true" className="inline-block size-[7px] bg-accent" />
            Sessão protegida · dados guardados no Supabase
          </div>
        </div>
      </div>
    </div>
  );
}
