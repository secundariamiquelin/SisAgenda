import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Remove as aspas caso o usuário tenha colado com aspas
let cleanUrl = supabaseUrl.replace(/^['"]|['"]$/g, '').trim();
if (cleanUrl.endsWith('/rest/v1/')) {
  cleanUrl = cleanUrl.slice(0, -9);
} else if (cleanUrl.endsWith('/rest/v1')) {
  cleanUrl = cleanUrl.slice(0, -8);
}
const cleanAnonKey = supabaseAnonKey.replace(/^['"]|['"]$/g, '').trim();

// Verifica se as credenciais estão preenchidas e parecem válidas
export const isSupabaseConfigured =
  !!cleanUrl &&
  cleanUrl !== 'YOUR_SUPABASE_URL' &&
  cleanUrl !== 'MY_SUPABASE_URL' &&
  (cleanUrl.startsWith('https://') || cleanUrl.startsWith('http://')) &&
  !!cleanAnonKey &&
  cleanAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  cleanAnonKey !== 'MY_SUPABASE_ANON_KEY';

// Inicializa o cliente do Supabase apenas se configurado
export const supabase = isSupabaseConfigured
  ? createClient(cleanUrl, cleanAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;
