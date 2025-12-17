import React, { useState, useMemo } from 'react';
import httpClient from '../api/httpClient';
import { ImportBarChart, ImportPieChart, ImportLineChart } from '../components/ImportCharts';

export default function ImportAnalysis() {
  const [params, setParams] = useState({ ano: 2024, ncm: '18010000', tipo: 'importacao' });
  const [comexData, setComexData] = useState(null);
  const [ptaxDate, setPtaxDate] = useState('12-17-2025');
  const [ptax, setPtax] = useState(null);
  const [comtradeParams, setComtradeParams] = useState({ period: 2024, hs: '1801' });
  const [comtrade, setComtrade] = useState(null);
  const [freteParams, setFreteParams] = useState({ origem: 'Ilheus', destino: 'Vitoria', peso: 1000 });
  const [frete, setFrete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // KPIs e gráficos usando dados reais das APIs quando disponíveis
  // ComexStat: espera-se que retorne { data: { total, meses: [{mes, importacao, exportacao}], paises: [{name, value}] } }
  // PTAX: { data: { cotacao, historico: [{mes, valor}] } }
  // Frete: { data: { valor } }
  // Comtrade: { data: { paises: [{name, value}] } }

  // KPIs e gráficos reativos: sempre que comtrade, comexData ou ptax mudarem, os gráficos e KPIs mudam automaticamente
  const kpi = useMemo(() => ({
    totalImport: comexData?.data?.total ?? 0,
    totalExport: comexData?.data?.totalExport ?? 0,
    dolar: ptax?.data?.cotacao ?? 0,
    freteMedio: frete?.data?.valor ?? 0,
    paises: (comtrade?.data?.paises?.length || comexData?.data?.paises?.length || 0),
    variacao: comexData?.data?.variacao ?? 0,
  }), [comexData, ptax, frete, comtrade]);

  const barData = useMemo(() => (
    comexData?.data?.meses?.length
      ? comexData.data.meses.map(m => ({
          name: m.mes,
          Importação: m.importacao,
          Exportação: m.exportacao
        }))
      : [
          { name: 'Jan', Importação: 1200, Exportação: 900 },
          { name: 'Fev', Importação: 2100, Exportação: 1200 },
          { name: 'Mar', Importação: 800, Exportação: 700 },
          { name: 'Abr', Importação: 1600, Exportação: 1100 },
          { name: 'Mai', Importação: 2000, Exportação: 1500 },
          { name: 'Jun', Importação: 1700, Exportação: 1300 },
        ]
  ), [comexData]);

  const paisesPie = useMemo(() => (
    comtrade?.data?.paises?.length
      ? comtrade.data.paises
      : comexData?.data?.paises?.length
        ? comexData.data.paises
        : [
            { name: 'Costa do Marfim', value: 38 },
            { name: 'Gana', value: 22 },
            { name: 'Nigéria', value: 15 },
            { name: 'Equador', value: 10 },
            { name: 'Outros', value: 15 },
          ]
  ), [comtrade, comexData]);

  const lineData = useMemo(() => (
    ptax?.data?.historico?.length
      ? ptax.data.historico.map((h, idx) => ({ mes: h.mes || `M${idx+1}`, Dólar: h.valor }))
      : [
          { mes: 'Jan', Dólar: 5.10 },
          { mes: 'Fev', Dólar: 5.12 },
          { mes: 'Mar', Dólar: 5.18 },
          { mes: 'Abr', Dólar: 5.09 },
          { mes: 'Mai', Dólar: 5.15 },
          { mes: 'Jun', Dólar: 5.12 },
        ]
  ), [ptax]);

  async function fetchComex() {
    setLoading(true); setError(null);
    try {
      const res = await httpClient.get('/api/import/comexstat', params);
      setComexData(res.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  async function fetchPtax() {
    setLoading(true); setError(null);
    try {
      const res = await httpClient.get('/api/import/ptax', { data: ptaxDate });
      setPtax(res.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  async function fetchComtrade() {
    setLoading(true); setError(null);
    try {
      const res = await httpClient.get('/api/import/comtrade', comtradeParams);
      setComtrade(res.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }
  async function fetchFrete() {
    setLoading(true); setError(null);
    try {
      const res = await httpClient.get('/api/import/frete', freteParams);
      setFrete(res.data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] text-[#F5F5F0] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mb-4">
          <div>
            <h1 className="text-4xl font-bold text-[#D4AF37] drop-shadow">Análise Profunda de Importação</h1>
            <p className="text-[#8B7355] text-lg mt-1">Dashboard interativa com dados, gráficos e indicadores de importação, câmbio e frete.</p>
          </div>
        </header>
        {error && <div className="bg-red-900/40 border border-red-700 text-red-200 p-3 rounded mb-4">{error}</div>}

        {/* KPIs principais */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Total Importado</span>
            <span className="text-2xl font-bold text-[#D4AF37]">{kpi.totalImport.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Total Exportado</span>
            <span className="text-2xl font-bold text-[#D4AF37]">{kpi.totalExport.toLocaleString('pt-BR')}</span>
          </div>
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Cotação Dólar</span>
            <span className="text-2xl font-bold text-[#D4AF37]">R$ {kpi.dolar}</span>
          </div>
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Frete Médio</span>
            <span className="text-2xl font-bold text-[#D4AF37]">R$ {kpi.freteMedio}</span>
          </div>
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Países Origem</span>
            <span className="text-2xl font-bold text-[#D4AF37]">{kpi.paises}</span>
          </div>
          <div className="bg-[#231A14]/90 border border-[#3E352F] rounded-xl p-4 flex flex-col items-center shadow">
            <span className="text-xs text-[#8B7355]">Variação Anual</span>
            <span className={"text-2xl font-bold " + (kpi.variacao >= 0 ? 'text-green-400' : 'text-red-400')}>{kpi.variacao}%</span>
          </div>
        </div>

        {/* Gráficos principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Importação x Exportação (Mensal)</h3>
            <ImportBarChart data={barData} xKey="name" barKey="Importação" color="#D4AF37" />
          </div>
          <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Origem das Importações</h3>
            <ImportPieChart data={paisesPie} dataKey="value" nameKey="name" colors={["#D4AF37", "#8B7355", "#F5F5F0", "#bfa133", "#3E352F"]} />
          </div>
          <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
            <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Cotação do Dólar (6 meses)</h3>
            <ImportLineChart data={lineData} xKey="mes" lineKey="Dólar" color="#8B7355" />
          </div>
        </div>

        {/* Formulários e dados detalhados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Coluna 1 */}
          <div className="space-y-8">
            {/* ComexStat */}
            <section className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-3 flex items-center gap-2">🇧🇷 ComexStat <span className="text-xs text-[#8B7355]">(Brasil)</span></h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <input type="number" className="w-24 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={params.ano} onChange={e => setParams(p => ({ ...p, ano: e.target.value }))} placeholder="Ano" />
                <input className="w-32 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={params.ncm} onChange={e => setParams(p => ({ ...p, ncm: e.target.value }))} placeholder="NCM" />
                <select className="bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={params.tipo} onChange={e => setParams(p => ({ ...p, tipo: e.target.value }))}>
                  <option value="importacao">Importação</option>
                  <option value="exportacao">Exportação</option>
                </select>
                <button className="bg-[#D4AF37] text-black px-4 py-1.5 rounded font-semibold shadow hover:bg-[#bfa133] transition" onClick={fetchComex} disabled={loading}>Buscar</button>
              </div>
              {comexData && <pre className="text-xs bg-black/30 rounded p-2 overflow-x-auto max-h-60 border border-[#3E352F] mt-2">{JSON.stringify(comexData, null, 2)}</pre>}
            </section>
            {/* Comtrade */}
            <section className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-3 flex items-center gap-2">🌎 UN Comtrade <span className="text-xs text-[#8B7355]">(Global)</span></h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <input type="number" className="w-24 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={comtradeParams.period} onChange={e => setComtradeParams(p => ({ ...p, period: e.target.value }))} placeholder="Ano" />
                <input className="w-32 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={comtradeParams.hs} onChange={e => setComtradeParams(p => ({ ...p, hs: e.target.value }))} placeholder="HS Code" />
                <button className="bg-[#D4AF37] text-black px-4 py-1.5 rounded font-semibold shadow hover:bg-[#bfa133] transition" onClick={fetchComtrade} disabled={loading}>Buscar</button>
              </div>
              {comtrade && <pre className="text-xs bg-black/30 rounded p-2 overflow-x-auto max-h-60 border border-[#3E352F] mt-2">{JSON.stringify(comtrade, null, 2)}</pre>}
            </section>
          </div>
          {/* Coluna 2 */}
          <div className="space-y-8">
            {/* PTAX */}
            <section className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-3 flex items-center gap-2">💱 PTAX <span className="text-xs text-[#8B7355]">(BCB)</span></h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <input className="w-32 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={ptaxDate} onChange={e => setPtaxDate(e.target.value)} placeholder="MM-DD-YYYY" />
                <button className="bg-[#D4AF37] text-black px-4 py-1.5 rounded font-semibold shadow hover:bg-[#bfa133] transition" onClick={fetchPtax} disabled={loading}>Buscar</button>
              </div>
              {ptax && <pre className="text-xs bg-black/30 rounded p-2 overflow-x-auto max-h-60 border border-[#3E352F] mt-2">{JSON.stringify(ptax, null, 2)}</pre>}
            </section>
            {/* Fretebras */}
            <section className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-3 flex items-center gap-2">🚚 Frete Rodoviário <span className="text-xs text-[#8B7355]">(Fretebras)</span></h2>
              <div className="flex flex-wrap gap-2 mb-3">
                <input className="w-32 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={freteParams.origem} onChange={e => setFreteParams(p => ({ ...p, origem: e.target.value }))} placeholder="Origem" />
                <input className="w-32 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={freteParams.destino} onChange={e => setFreteParams(p => ({ ...p, destino: e.target.value }))} placeholder="Destino" />
                <input type="number" className="w-24 bg-[#1A1512] border border-[#3E352F] rounded px-2 py-1" value={freteParams.peso} onChange={e => setFreteParams(p => ({ ...p, peso: e.target.value }))} placeholder="Peso (kg)" />
                <button className="bg-[#D4AF37] text-black px-4 py-1.5 rounded font-semibold shadow hover:bg-[#bfa133] transition" onClick={fetchFrete} disabled={loading}>Buscar</button>
              </div>
              {frete && <pre className="text-xs bg-black/30 rounded p-2 overflow-x-auto max-h-60 border border-[#3E352F] mt-2">{JSON.stringify(frete, null, 2)}</pre>}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
