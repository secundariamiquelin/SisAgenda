import React, { useState } from 'react';
import { DbService } from '../services/db';
import { isSupabaseConfigured } from '../supabaseClient';
import { Calendar, ShieldAlert, Sparkles, AlertCircle, RefreshCw, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

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
      setErro('Por favor, preencha todos os campos.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');
      const loggedUser = await DbService.login(email, senha);
      onLoginSuccess(loggedUser);
    } catch (err: any) {
      setErro(err.message || 'Falha na autenticação.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div id="login-view-root" className="min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-12 relative overflow-hidden font-sans">
      {/* Background Decorator */}
      <div className="absolute top-0 left-1/4 -ml-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 -mr-24 w-96 h-96 rounded-full bg-blue-800/10 blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, type: 'spring' }}
        className="relative w-full max-w-md bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-2xl z-10"
      >
        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-blue-600 p-3.5 text-white border border-blue-500/10 shadow-md shadow-blue-500/15">
            <Calendar className="h-8 w-8 stroke-[1.5]" />
          </div>

          <h1 className="mt-4 text-xl font-extrabold text-white tracking-tight uppercase">
            SISAGENDA
          </h1>
          <p className="mt-1.5 text-xs text-slate-300 font-semibold tracking-wide text-blue-400">
            Mentes em Desenvolvimento
          </p>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed max-w-sm">
            Gestão de atendimentos multidisciplinares para crianças autistas de Sarandi - PR. Apoio Psicológico, fonoaudiológico e psicopedagógico.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex items-start gap-2.5 rounded-lg bg-rose-500/10 border border-rose-500/25 p-3.5 text-xs font-semibold text-rose-300 leading-relaxed"
            >
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-400 mt-0.5" />
              <span>{erro}</span>
            </motion.div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Endereço de E-mail
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nome@negocio.com"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm rounded-lg bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 focus:outline-hidden transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Senha Administrativa
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg bg-slate-950/80 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-white placeholder-slate-600 focus:outline-hidden transition-all duration-200"
              />
              <button
                id="login-toggle-password-visibility"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/10 transition-all font-sans cursor-pointer disabled:opacity-50"
          >
            {carregando ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Autenticando dados...
              </>
            ) : (
              'Entrar no Painel'
            )}
          </button>
        </form>

        {/* Educational Info Footer */}
        <div className="mt-8 pt-5 border-t border-slate-800/60 text-center">
          <div className="text-emerald-500 text-[11px] font-medium flex items-center justify-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Autenticação ativa conectada ao Supabase Auth
          </div>
        </div>
      </motion.div>
    </div>
  );
}
