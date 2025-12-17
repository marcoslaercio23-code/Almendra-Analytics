import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { ImportPieChart } from '../ImportCharts';
import { useImportDashboardData } from '../../hooks/useImportDashboardData';
import useAuth from "../../hooks/useAuth";
import useCocoaData from "../../hooks/useCocoaData";
import useRealTimeData from "../../hooks/useRealTimeData";
import { Sidebar as SidebarLayout } from "./ModernSidebar";

/* ============================================
   TICKER TAPE - Barra de cotações animada
   ============================================ */
const TickerTape = () => (
  <div className="w-full bg-[#1A1512]/80 border border-[#D4AF37]/10 rounded-lg overflow-hidden py-2 px-4 shadow-sm">
    <style>
      {`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
      `}
    </style>
    <div className="animate-marquee whitespace-nowrap flex gap-12 text-xs font-mono text-[#D4AF37]/90 tracking-wide">
      <span>NY COCOA: $2,875.50 ▲</span>
      <span>LONDON COCOA: £2,240.00 ▼</span>
      <span>ICCO DAILY: $2,850.25 ▲</span>
      <span>GHANA SPOT: $2,900.00 ▲</span>
      <span>IVORY COAST: $2,880.00 ▲</span>
      {/* Duplicado para loop contínuo */}
      <span>NY COCOA: $2,875.50 ▲</span>
      <span>LONDON COCOA: £2,240.00 ▼</span>
      <span>ICCO DAILY: $2,850.25 ▲</span>
      <span>GHANA SPOT: $2,900.00 ▲</span>
      <span>IVORY COAST: $2,880.00 ▲</span>
    </div>
  </div>
);

/* ============================================
   STAT CARD - Card de estatística reutilizável
   ============================================ */
const StatCard = ({ title, value, suffix, indicator, indicatorColor, icon, hoverColor = "hover:border-[#D4AF37]/40" }) => (
  <div className={`
    group relative bg-[#1A1512]/70 border border-[#D4AF37]/15 ${hoverColor}
    rounded-xl p-5 transition-all duration-300 
    hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-sm
  `}>
    {/* Ícone decorativo */}
    {icon && (
      <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
        {icon}
      </div>
    )}
    
    {/* Label */}
    <p className="text-xs text-[#8B7355] font-medium uppercase tracking-wider mb-3">
      {title}
    </p>
    
    {/* Valor */}
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-bold text-[#F5F5F0] tracking-tight font-mono">
        {value}
      </span>
      {suffix && (
        <span className="text-sm text-[#8B7355]">{suffix}</span>
      )}
    </div>
    
    {/* Indicador */}
    {indicator && (
      <div className={`
        mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
        ${indicatorColor || 'bg-[#D4AF37]/10 text-[#D4AF37]'}
      `}>
        {indicator}
      </div>
    )}
  </div>
);

/* ============================================
   SECTION HEADER - Cabeçalho de seção
   ============================================ */
const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
    <div>
      <h2 className="text-2xl md:text-3xl font-bold text-[#D4AF37] tracking-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[#8B7355] text-sm mt-1 font-light">{subtitle}</p>
      )}
    </div>
    {action && <div>{action}</div>}
  </div>
);

/* ============================================
   DASHBOARD COMPONENT
   ============================================ */
const Dashboard = ({ priceData, loading, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Removido: useImportDashboardData (importação)
  const {
    prices, production, exports: cocoaExports, forecasts, getPriceHistory, loading: cocoaLoading, error: cocoaError, refresh: refreshCocoa
  } = useCocoaData();

  useEffect(() => {
    refreshCocoa();
    // eslint-disable-next-line
  }, []);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
        await refreshCocoa();
      } catch (error) {
        console.error("Erro ao atualizar:", error);
      } finally {
        setTimeout(() => setIsRefreshing(false), 1000);
      }
    }
  };

  if (loading || cocoaLoading) {
    return (
      <section className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#8B7355] font-medium animate-pulse">
            Sincronizando dados...
          </p>
        </div>
      </section>
    );
  }

  // KPIs e históricos de cacau
  const kpiProd = production[0] || {};
  const kpiExp = cocoaExports[0] || {};
  const kpiForecast = forecasts[0] || {};
  const priceHistory = getPriceHistory(12).map((p, i) => ({
    mes: p.date?.slice(0,7) || `M${i+1}`,
    Preço: p.price
  })).reverse();
  const prodHistory = production.slice(0, 12).map((p, i) => ({
    mes: p.date?.slice(0,7) || `M${i+1}`,
    Produção: p.value
  })).reverse();
  const expHistory = cocoaExports.slice(0, 12).map((e, i) => ({
    mes: e.date?.slice(0,7) || `M${i+1}`,
    Exportação: e.value
  })).reverse();

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <TickerTape />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#D4AF37] tracking-tight">
            Almendra Analytics
          </h1>
          <p className="text-[#8B7355] text-sm mt-1">
            Visão orgânica do mercado de cacau
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`
              p-2.5 rounded-lg bg-[#2A2018] hover:bg-[#3E352F] 
              text-[#D4AF37] transition-all border border-[#D4AF37]/20 
              hover:border-[#D4AF37]/40 disabled:opacity-50
            `}
            title="Atualizar dados"
          >
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border
            ${priceData.isRealtime 
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
              : 'bg-[#C04000]/10 text-[#C04000] border-[#C04000]/20'
            }
          `}>
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${priceData.isRealtime ? 'bg-[#D4AF37]' : 'bg-[#C04000]'}`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${priceData.isRealtime ? 'bg-[#D4AF37]' : 'bg-[#C04000]'}`} />
            </span>
            <span className="hidden sm:inline">
              {priceData.isRealtime ? 'Conectado' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
      <div className="bg-[#1A1512]/60 border border-[#D4AF37]/10 rounded-lg px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[#8B7355]">Contrato:</span>
          <span className="text-[#D4AF37] font-bold bg-[#D4AF37]/10 px-2.5 py-0.5 rounded font-mono">
            {priceData.symbol}
          </span>
          <span className="hidden sm:inline text-[#6B5B45] border-l border-[#D4AF37]/20 pl-3">
            {priceData.symbol === 'CCH25' ? 'Vencimento Março 2025' : 'Futuros Contínuos'}
          </span>
        </div>
      </div>
      {priceData.rtError && (
        <div className="bg-[#C04000]/10 border border-[#C04000]/20 rounded-lg p-4 flex items-center gap-3 text-[#C04000] text-sm">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Erro de conexão: {priceData.rtError}</span>
        </div>
      )}
      {/* KPIs Cacau */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="Produção (t)" value={kpiProd.value?.toLocaleString('pt-BR') || '-'} icon="🌱" />
        <StatCard title="Exportação (t)" value={kpiExp.value?.toLocaleString('pt-BR') || '-'} icon="🚚" />
        <StatCard title="Previsão (t)" value={kpiForecast.value?.toLocaleString('pt-BR') || '-'} icon="🔮" />
        <StatCard title="Último Preço" value={priceHistory[priceHistory.length-1]?.Preço?.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' }) || '-'} icon="💲" />
      </div>
      {/* Gráficos Cacau */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Histórico de Preço (12 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={priceHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3E352F" />
              <XAxis dataKey="mes" stroke="#D4AF37" />
              <YAxis stroke="#D4AF37" />
              <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
              <Line type="monotone" dataKey="Preço" stroke="#D4AF37" strokeWidth={3} dot={{ r: 4 }} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Produção Mensal (12 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={prodHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3E352F" />
              <XAxis dataKey="mes" stroke="#D4AF37" />
              <YAxis stroke="#D4AF37" />
              <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
              <Bar dataKey="Produção" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-[#231A14]/80 border border-[#3E352F] rounded-2xl p-4 shadow-lg">
          <h3 className="text-lg font-semibold text-[#D4AF37] mb-2">Exportação Mensal (12 meses)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={expHistory} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3E352F" />
              <XAxis dataKey="mes" stroke="#D4AF37" />
              <YAxis stroke="#D4AF37" />
              <Tooltip contentStyle={{ background: '#231A14', border: '1px solid #D4AF37', color: '#F5F5F0' }} />
              <Bar dataKey="Exportação" fill="#8B7355" radius={[6, 6, 0, 0]} />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Grid de Estatísticas Preço */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <StatCard
          title="Preço Atual"
          value={`$${priceData.price.toFixed(2)}`}
          indicator={`${priceData.change >= 0 ? '↑' : '↓'} ${Math.abs(priceData.change).toFixed(2)}%`}
          indicatorColor={priceData.change >= 0 
            ? 'bg-[#D4AF37]/10 text-[#D4AF37]'
            : 'bg-[#C04000]/10 text-[#C04000]'
          }
          icon={<svg className="w-16 h-16 text-[#D4AF37]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.15-1.46-3.27-3.4h1.96c.1 1.05 1.18 1.91 2.53 1.91 1.33 0 2.26-.87 2.26-1.94 0-1.51-1.26-2.32-3.08-2.81C9.31 11.21 8 10.38 8 8.33c0-1.73 1.15-3.3 3.74-3.65V3h2.67v1.93c1.38.35 2.48 1.31 2.63 2.95h-1.96c-.11-.76-.87-1.42-1.97-1.42-1.39 0-2.14.86-2.14 1.82 0 1.3 1.2 1.75 2.56 2.12 2.35.63 3.69 1.58 3.69 3.73 0 1.8-1.27 3.68-4.08 4.02z"/></svg>}
        />
        <StatCard
          title="Volume (24h)"
          value={priceData.volume}
          suffix="tons"
          hoverColor="hover:border-blue-500/30"
        />
        <StatCard
          title="Máxima (30d)"
          value={`$${priceData.high.toFixed(2)}`}
          indicator={<><span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" /> Pico do período</>}
          indicatorColor="bg-transparent text-[#8B7355] text-[10px]"
        />
        <StatCard
          title="Mínima (30d)"
          value={`$${priceData.low.toFixed(2)}`}
          indicator={<><span className="w-1.5 h-1.5 rounded-full bg-[#C04000]" /> Suporte do período</>}
          indicatorColor="bg-transparent text-[#8B7355] text-[10px]"
          hoverColor="hover:border-[#C04000]/30"
        />
      </div>
      {/* Gráfico de Tendência */}
      <div className="bg-[#1A1512]/70 border border-[#D4AF37]/15 rounded-xl p-6 backdrop-blur-sm mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[#F5F5F0] flex items-center gap-3">
            <span className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#8B7355] rounded-full" />
            Tendência Recente
          </h3>
          <button className="text-sm text-[#D4AF37] hover:text-[#F5F5F0] font-medium transition-colors flex items-center gap-1 group">
            Ver detalhes 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="colorCocoa" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.6}/>
                  <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1A1512', 
                  borderColor: '#D4AF37', 
                  borderRadius: '8px',
                  color: '#F5F5F0' 
                }}
                itemStyle={{ color: '#D4AF37' }}
                formatter={(value) => [`$${value?.toLocaleString('pt-BR', { style: 'currency', currency: 'USD' })}`, 'Preço']}
                labelStyle={{ display: 'none' }}
              />
              <Area 
                type="monotone" 
                dataKey="Preço" 
                stroke="#D4AF37" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorCocoa)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
};

/* ============================================
   CHART TAB - Análise Técnica
   ============================================ */
const ChartTab = () => (
  <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <SectionHeader 
      title="Análise Técnica"
      subtitle="Gráfico interativo avançado via TradingView"
      action={
        <div className="flex gap-1.5 bg-[#1A1512]/60 p-1 rounded-lg border border-[#D4AF37]/15">
          <button className="px-3 py-1.5 text-[#8B7355] hover:text-[#F5F5F0] text-sm rounded-md transition-all hover:bg-[#D4AF37]/10 font-mono">1D</button>
          <button className="px-3 py-1.5 text-[#8B7355] hover:text-[#F5F5F0] text-sm rounded-md transition-all hover:bg-[#D4AF37]/10 font-mono">1W</button>
          <button className="px-3 py-1.5 bg-[#D4AF37] text-[#1A1512] font-bold text-sm rounded-md font-mono">1M</button>
        </div>
      }
    />

    {/* Container do Gráfico */}
    <div className="bg-[#1A1512]/70 border border-[#D4AF37]/15 rounded-xl overflow-hidden shadow-lg h-[80vh] min-h-[600px]">
      <iframe
        title="TradingView Chart COCOA"
        src="https://br.tradingview.com/widgetembed/?frameElementId=tradingview_chart_widget&symbol=TICKMILL:COCOA&interval=D&theme=dark&style=1&locale=pt_BR&withdateranges=true&range=1Y&hide_side_toolbar=0&allow_symbol_change=1&save_image=1&details=1"
        className="w-full h-full"
        style={{ border: 'none', height: '100%', width: '100%', display: 'block' }}
        allowFullScreen
      />
    </div>
  </section>
);

/* ============================================
   NEWS TAB - Notícias do Cacau
   ============================================ */
const NewsTab = ({ news }) => (
  <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
    <SectionHeader 
      title="Notícias do Cacau"
      subtitle="Análise de relevância e impacto por IA"
      action={
        <button className="text-[#D4AF37] hover:text-[#F5F5F0] text-sm font-medium transition-colors flex items-center gap-1 group">
          Ver todas 
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      }
    />

    {/* Grid de Notícias */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {news.map((item) => (
        <article 
          key={item.id} 
          className="group bg-[#1A1512]/70 border border-[#D4AF37]/15 hover:border-[#D4AF37]/30 rounded-xl p-5 transition-all duration-300 hover:shadow-lg"
        >
          <div className="flex gap-4">
            {/* Ícone */}
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-[#D4AF37]/15 to-[#8B7355]/10 border border-[#D4AF37]/10 flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-105 transition-transform">
              📰
            </div>
            
            {/* Conteúdo */}
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-bold text-[#F5F5F0] line-clamp-2 group-hover:text-[#D4AF37] transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-[#8B7355] line-clamp-2 leading-relaxed">
                {item.description}
              </p>
              
              {/* Footer do Card */}
              <div className="flex items-center justify-between pt-3 border-t border-[#D4AF37]/10">
                <span className="text-xs text-[#6B5B45] flex items-center gap-1.5 font-mono">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.date}
                </span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#D4AF37] hover:text-[#F5F5F0] uppercase tracking-wider flex items-center gap-1 transition-colors"
                >
                  Ler mais →
                </a>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

/* ============================================
   ALERTS TAB - Alertas de Preço
   ============================================ */
const AlertsTab = ({ priceData }) => {
  const [alertPrice, setAlertPrice] = useState(priceData.price);
  const [alerts, setAlerts] = useState([]);

  const addAlert = () => {
    if (alertPrice > 0) {
      setAlerts([...alerts, { 
        id: Date.now(), 
        price: alertPrice, 
        created: new Date().toLocaleString("pt-BR") 
      }]);
      setAlertPrice(priceData.price);
    }
  };

  const removeAlert = (id) => {
    setAlerts(alerts.filter((a) => a.id !== id));
  };

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <SectionHeader 
        title="Alertas de Preço"
        subtitle="Seja notificado quando o preço atingir seu alvo"
      />

      {/* Form de Novo Alerta */}
      <div className="bg-[#1A1512]/70 border border-[#D4AF37]/15 rounded-xl p-6">
        <h3 className="font-bold text-[#F5F5F0] mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gradient-to-b from-[#D4AF37] to-[#8B7355] rounded-full" />
          Novo Alerta
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]">$</span>
            <input
              type="number"
              value={alertPrice}
              onChange={(e) => setAlertPrice(parseFloat(e.target.value) || 0)}
              placeholder="Preço alvo"
              className="w-full pl-8 pr-4 py-3 rounded-lg bg-[#2A2018] text-[#F5F5F0] border border-[#D4AF37]/15 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] outline-none transition-all placeholder-[#6B5B45] font-mono"
              step="0.01"
            />
          </div>
          <button
            onClick={addAlert}
            className="bg-gradient-to-r from-[#D4AF37] to-[#B8860B] hover:from-[#FFD700] hover:to-[#DAA520] text-[#1A1512] px-6 py-3 rounded-lg font-bold shadow-md hover:shadow-lg transition-all"
          >
            Criar Alerta
          </button>
        </div>
      </div>

      {/* Lista de Alertas */}
      {alerts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className="bg-[#1A1512]/70 border border-[#D4AF37]/15 hover:border-[#D4AF37]/30 rounded-xl p-4 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center text-lg border border-[#D4AF37]/20">
                  🔔
                </div>
                <div>
                  <p className="text-[#F5F5F0] font-bold font-mono">${alert.price.toFixed(2)}</p>
                  <p className="text-xs text-[#8B7355]">{alert.created}</p>
                </div>
              </div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="p-2 text-[#8B7355] hover:text-[#C04000] hover:bg-[#C04000]/10 rounded-lg transition-all"
                title="Remover alerta"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-[#D4AF37]/10 rounded-xl bg-[#1A1512]/30">
          <div className="w-16 h-16 bg-[#2A2018] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">
            🔕
          </div>
          <p className="text-[#8B7355] font-medium">Nenhum alerta configurado</p>
          <p className="text-[#6B5B45] text-sm mt-1">Crie um alerta acima para ser notificado</p>
        </div>
      )}
    </section>
  );
};

/* ============================================
   MAIN EXPORT COMPONENT
   ============================================ */
export default function SaasTemplate() {
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();
  const { getCurrentPrice, getPriceChange, loading: dataLoading, refresh: refreshCocoa } = useCocoaData();
  const { price: realtimePrice, percentChange, high, low, symbol, isConnected, error: rtError, refresh: refreshRealTime } = useRealTimeData('CCH25', 0);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Redirecionar se não autenticado
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const handleManualRefresh = async () => {
    const promises = [];
    if (refreshCocoa) promises.push(refreshCocoa());
    if (refreshRealTime) promises.push(refreshRealTime());
    await Promise.all(promises);
  };

  // Dados do mercado
  const currentPrice = getCurrentPrice();
  const priceChange = getPriceChange();
  
  const priceData = {
    price: realtimePrice || currentPrice?.price || 2875.50,
    change: percentChange || priceChange || 12.5,
    volume: "1,248K",
    high: high || 2950.00,
    low: low || 2750.00,
    symbol: symbol || 'CCH25',
    isRealtime: isConnected,
    rtError: rtError,
  };

  // Dados de notícias
  const news = [
    {
      id: 1,
      title: "Preços do Cacau atingem novo recorde",
      description: "O mercado global de cacau registra aumento significativo impulsionado pela demanda de chocolate premium.",
      date: "Há 2 horas",
      link: "https://br.tradingview.com/chart/s9EJHWCR/?symbol=TICKMILL%3ACOCOA",
    },
    {
      id: 2,
      title: "Brasil aumenta exportações de cacau em 15%",
      description: "Dados do MAPA mostram crescimento nas exportações brasileiras, beneficiando pequenos produtores.",
      date: "Há 4 horas",
      link: "https://br.tradingview.com/chart/s9EJHWCR/?symbol=TICKMILL%3ACOCOA",
    },
    {
      id: 3,
      title: "Análise técnica: suporte em $2.800",
      description: "Especialistas apontam nível de suporte importante para possível recuperação nos próximos dias.",
      date: "Há 6 horas",
      link: "https://br.tradingview.com/chart/s9EJHWCR/?symbol=TICKMILL%3ACOCOA",
    },
    {
      id: 4,
      title: "Clima favorável na Costa do Marfim",
      description: "Condições climáticas positivas prometem boa safra na região produtora mais importante do mundo.",
      date: "Há 8 horas",
      link: "https://br.tradingview.com/chart/s9EJHWCR/?symbol=TICKMILL%3ACOCOA",
    },
  ];

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1A1512] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[#D4AF37]">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      user={user}
      onLogout={handleLogout}
    >
      {/* Conteúdo Principal */}
      <div className="w-full min-h-full">
        {/* Overlay de Textura */}
        <div 
          className="fixed inset-0 pointer-events-none z-0 opacity-20 mix-blend-overlay"
          style={{ 
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")` 
          }}
        />
        
        {/* Tabs Content */}
        <div className="relative z-10">
          {activeTab === "dashboard" && <Dashboard priceData={priceData} loading={dataLoading} onRefresh={handleManualRefresh} />}
          {activeTab === "chart" && <ChartTab />}
          {activeTab === "news" && <NewsTab news={news} />}
          {activeTab === "alerts" && <AlertsTab priceData={priceData} />}

          {/* Footer */}
          <footer className="border-t border-[#D4AF37]/10 bg-[#1A1512]/50 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-6 text-center text-[#8B7355] text-sm">
              <p>© 2025 Almendra Analytics. Todos os direitos reservados.</p>
            </div>
          </footer>
        </div>
      </div>
    </SidebarLayout>
  );
}
