import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (process.env.REACT_APP_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.REACT_APP_SUPABASE_ANON_KEY || '').trim();

let supabaseClient = null;

export const isSupabaseConfigured = () => {
  return Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      supabaseUrl !== 'https://demo.supabase.co'
  );
};

export const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

const requireSupabaseClient = () => {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error(
      'Supabase não configurado. Defina REACT_APP_SUPABASE_URL e REACT_APP_SUPABASE_ANON_KEY no .env/.env.local.'
    );
  }
  return client;
};

export default getSupabaseClient;

// Funções para Preços
export const getPrices = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
};

export const getPriceByDate = async (startDate, endDate) => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('prices')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Funções para Produção
export const getProduction = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('production')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
};

// Funções para Exportação
export const getExports = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('exports')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
};

// Funções para Clima
export const getWeather = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('weather')
    .select('*')
    .order('date', { ascending: false })
    .limit(100);
  
  if (error) throw error;
  return data;
};

// Funções para Câmbio
export const getExchangeRates = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .order('date', { ascending: false })
    .limit(10);
  
  if (error) throw error;
  return data;
};

// Funções para Previsões
export const getForecasts = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('forecasts')
    .select('*')
    .order('date', { ascending: true })
    .limit(30);
  
  if (error) throw error;
  return data;
};

// Funções para Alertas
export const getAlerts = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createAlert = async (alert) => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('alerts')
    .insert([alert])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateAlert = async (id, alert) => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('alerts')
    .update(alert)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteAlert = async (id) => {
  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from('alerts')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Funções para Relatórios
export const getReports = async () => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const createReport = async (report) => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('reports')
    .insert([report])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateReport = async (id, report) => {
  const supabase = requireSupabaseClient();
  const { data, error } = await supabase
    .from('reports')
    .update(report)
    .eq('id', id)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteReport = async (id) => {
  const supabase = requireSupabaseClient();
  const { error } = await supabase
    .from('reports')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
