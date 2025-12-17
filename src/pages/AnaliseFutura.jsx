/**
 * AnaliseFutura - Página de Análise Futura do Mercado de Cacau
 * Integra: Investing.com, Yahoo Finance, PricePro, IA Groq
 */
import React, { useState, useEffect, useCallback } from 'react';
import httpClient, { ApiError, ErrorTypes } from '../api/httpClient';
import MovementBadge from '../components/MovementBadge';

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object' && value && 'value' in value) {
    return toNumber(value.value);
  }
  return null;
};

const formatFixed = (value, decimals = 2) => {
  const n = toNumber(value);
  return n === null ? 'N/A' : n.toFixed(decimals);
};

const formatPercentFromFraction = (fraction, decimals = 1) => {
  const n = toNumber(fraction);
  return n === null ? 'N/A' : (n * 100).toFixed(decimals);
};

// Componente de Loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#D4AF37] border-t-transparent"></div>
    <span className="ml-4 text-[#D4AF37] text-lg">Carregando análise...</span>
  </div>
);

// Componente de Card
// Define uma cor de texto padrão para evitar trechos “invisíveis” em tema escuro
const AnalysisCard = ({ title, icon, children, className = '', gradient = 'from-[#2A2018] to-[#231A14]' }) => (
  <div className={`bg-gradient-to-br ${gradient} text-[#F5F5F0] rounded-2xl p-6 border border-[#3E352F] shadow-xl ${className}`}>
    <div className="flex items-center gap-3 mb-4">
      <span className="text-2xl">{icon}</span>
      <h3 className="text-lg font-bold text-[#F5F5F0]">{title}</h3>
    </div>
    {children}
  </div>
);

// Componente de Badge de Sinal
const SignalBadge = ({ signal, strength }) => {
  const getSignalStyle = () => {
    if (signal?.includes('LONG') || signal?.includes('COMPRA') || signal === 'ALTA') {
      return 'bg-green-500/20 text-green-400 border-green-500/50';
    } else if (signal?.includes('SHORT') || signal?.includes('VENDA') || signal === 'BAIXA') {
      return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  };

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getSignalStyle()}`}>
      <span className="text-xl">
        {signal?.includes('LONG') || signal?.includes('COMPRA') || signal === 'ALTA' ? '📈' : 
         signal?.includes('SHORT') || signal?.includes('VENDA') || signal === 'BAIXA' ? '📉' : '➡️'}
      </span>
      <span className="font-bold">{signal}</span>
      {strength !== undefined && (
        <span className="text-sm opacity-75">({strength}%)</span>
      )}
    </div>
  );
};

// Componente de Projeção
const ForecastCard = ({ period, forecast, icon }) => (
  <div className="bg-[#231A14]/60 rounded-xl p-4 border border-[#3E352F]">
    <div className="flex items-center gap-2 mb-2">
      <span className="text-xl">{icon}</span>
      <span className="text-[#8B7355] text-sm font-medium">{period}</span>
    </div>
    <p className="text-[#F5F5F0] text-sm leading-relaxed">{forecast || 'Aguardando análise...'}</p>
  </div>
);

// Componente de Nível de Preço
const PriceLevel = ({ label, value, type }) => {
  const getBgColor = () => {
    if (type === 'support') return 'bg-green-500/20 border-green-500/50';
    if (type === 'resistance') return 'bg-red-500/20 border-red-500/50';
    return 'bg-blue-500/20 border-blue-500/50';
  };

  return (
    <div className={`flex justify-between items-center px-4 py-3 rounded-lg border ${getBgColor()}`}>
      <span className="text-[#8B7355] text-sm">{label}</span>
      <span className="font-mono font-bold text-[#F5F5F0]">${value || 'N/A'}</span>
    </div>
  );
};

// Componente de Indicador Técnico
const TechnicalIndicator = ({ name, value, interpretation }) => (
  <div className="bg-[#231A14]/60 rounded-lg p-3 border border-[#3E352F]">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[#8B7355] text-sm">{name}</span>
      <span className="font-mono text-[#D4AF37]">{value || 'N/A'}</span>
    </div>
    {interpretation && (
      <p className="text-xs text-[#8B7355]">{interpretation}</p>
    )}
  </div>
);

// Componente de Notícia
const NewsItem = ({ title, date, link }) => (
  <div className="border-l-2 border-[#D4AF37] pl-4 py-2">
    <a 
      href={link} 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-[#F5F5F0] hover:text-[#D4AF37] transition-colors text-sm font-medium block"
    >
      {title}
    </a>
    {date && <span className="text-[#8B7355] text-xs">{date}</span>}
  </div>
);

const AnaliseFutura = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await httpClient.get('/api/analysis/future', { timeout: 30000 });
      
      if (result.success) {
        setData(result.data);
        setLastUpdate(new Date().toLocaleTimeString('pt-BR'));
      } else {
        throw new Error(result.error || 'Erro ao carregar análise');
      }
    } catch (err) {
      console.error('Erro ao buscar análise:', err);
      if (err instanceof ApiError) {
        switch (err.type) {
          case ErrorTypes.NETWORK:
            setError('🔌 Servidor offline. Verifique se o backend está rodando.');
            break;
          case ErrorTypes.TIMEOUT:
            setError('⏱️ A análise demorou muito. Tente novamente.');
            break;
          case ErrorTypes.SERVER:
            setError(`🚨 Erro no servidor: ${err.message}`);
            break;
          default:
            setError(err.message);
        }
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []); // httpClient.get é estável, não precisa de dependências

  useEffect(() => {
    fetchAnalysis();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAnalysis]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-6">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-6 flex items-center justify-center">
        <div className="w-full max-w-md bg-[#2A2018] border border-[#3E352F] rounded-2xl p-6 text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <h2 className="text-xl font-bold text-[#F5F5F0] mb-2">Erro ao carregar análise</h2>
          <p className="text-[#8B7355] mb-6">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { signal, technical, levels, history, news, ai, currentPrice, sentiment, zigzag, movementCertificate } = data || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37] flex items-center gap-3">
            <span>🔮</span>
            Análise Futura do Cacau
          </h1>
          <p className="text-[#8B7355] mt-1">
            Projeções baseadas em IA e análise técnica avançada
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          {lastUpdate && (
            <span className="text-[#8B7355] text-sm">
              Atualizado: {lastUpdate}
            </span>
          )}
          <button
            onClick={fetchAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-[#D4AF37] hover:bg-[#B8962E] disabled:bg-[#3E352F] text-black rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <span>🔄</span>
            )}
            Atualizar
          </button>
        </div>
      </div>

      {/* Preço Atual e Sinal Principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Preço Atual */}
        <AnalysisCard title="Preço Atual" icon="💰">
          <div className="text-center">
            <span className="text-4xl font-bold text-[#F5F5F0] font-mono">
              ${formatFixed(currentPrice?.value ?? currentPrice, 2)}
            </span>
            {data?.priceChange && (
              <span className={`ml-3 text-lg ${parseFloat(data.priceChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {data.priceChange}
              </span>
            )}
          </div>
          <div className="mt-4 text-center">
            <span className="text-[#8B7355] text-sm">Sentimento: </span>
            <span className="text-[#D4AF37] font-medium capitalize">{sentiment || 'neutro'}</span>
          </div>
        </AnalysisCard>

        {/* Sinal PricePro */}
        <AnalysisCard title="Sinal PricePro" icon="🎯">
          <div className="text-center space-y-3">
            <SignalBadge signal={signal?.type} strength={signal?.strength} />

            <div className="flex justify-center">
              <MovementBadge certificate={movementCertificate} />
            </div>

            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {signal?.reasoning?.map((reason, idx) => (
                <span key={idx} className="text-xs bg-[#231A14]/60 text-[#F5F5F0] px-2 py-1 rounded border border-[#3E352F]">
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </AnalysisCard>

        {/* Stop Loss / Take Profit */}
        <AnalysisCard title="SL / TP" icon="🛡️">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-red-400">Stop Loss</span>
              <span className="font-mono font-bold text-red-400">${signal?.stopLoss || ai?.sl || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-400">Take Profit</span>
              <span className="font-mono font-bold text-green-400">${signal?.takeProfit || ai?.tp || 'N/A'}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-[#3E352F]">
              <span className="text-[#8B7355]">Risk/Reward</span>
              <span className="font-mono text-[#D4AF37]">{signal?.riskReward || 'N/A'}</span>
            </div>
          </div>
        </AnalysisCard>
      </div>

      {movementCertificate && (
        <AnalysisCard title="Certificado de Movimento do Cacau" icon="🏅" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <MovementBadge certificate={movementCertificate} />
            <div className="text-sm text-[#8B7355]">
              {movementCertificate.message || 'Sem variação relevante detectada na semana.'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
            <div className="bg-[#231A14]/60 rounded-lg p-3 border border-[#3E352F]">
              <p className="text-[#8B7355]">Variação 7d</p>
              <p className="text-[#F5F5F0] font-mono text-lg">{formatFixed(movementCertificate.metrics?.changePercent7d, 2)}%</p>
            </div>
            <div className="bg-[#231A14]/60 rounded-lg p-3 border border-[#3E352F]">
              <p className="text-[#8B7355]">Volatilidade 7d</p>
              <p className="text-[#F5F5F0] font-mono text-lg">{formatFixed(movementCertificate.metrics?.volatilityPercent7d, 2)}%</p>
            </div>
            <div className="bg-[#231A14]/60 rounded-lg p-3 border border-[#3E352F]">
              <p className="text-[#8B7355]">Tendência (ZigZag)</p>
              <p className="text-[#F5F5F0] font-semibold">{movementCertificate.metrics?.zigzagTrend || 'LATERAL'}</p>
            </div>
          </div>
        </AnalysisCard>
      )}

      {/* Projeções IA */}
      <AnalysisCard title="Projeções com IA" icon="🤖" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ForecastCard 
            period="Projeção 24 Horas" 
            forecast={ai?.forecast?.['24h']} 
            icon="⏰" 
          />
          <ForecastCard 
            period="Projeção 1 Semana" 
            forecast={ai?.forecast?.['1week']} 
            icon="📅" 
          />
          <ForecastCard 
            period="Projeção 1 Mês" 
            forecast={ai?.forecast?.['1month']} 
            icon="🗓️" 
          />
        </div>
      </AnalysisCard>

      {/* Grid de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Suporte e Resistência */}
        <AnalysisCard title="Suporte / Resistência" icon="📊">
          <div className="space-y-3">
            <PriceLevel label="Resistência Principal" value={levels?.resistance || ai?.levels?.resistance} type="resistance" />
            <PriceLevel label="Pivot" value={levels?.pivot} type="pivot" />
            <PriceLevel label="Suporte Principal" value={levels?.support || ai?.levels?.support} type="support" />
            
            {levels?.fibonacci && (
              <div className="mt-4 pt-4 border-t border-[#3E352F]">
                <h4 className="text-sm font-medium text-[#8B7355] mb-3">Níveis Fibonacci</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(levels.fibonacci).map(([level, value]) => (
                    <div key={level} className="flex justify-between text-sm bg-[#231A14]/60 px-3 py-2 rounded border border-[#3E352F]">
                      <span className="text-[#D4AF37]">{level}</span>
                      <span className="text-[#F5F5F0] font-mono">${value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </AnalysisCard>

        {/* Indicadores Técnicos */}
        <AnalysisCard title="Indicadores Técnicos" icon="📈">
          <div className="grid grid-cols-2 gap-3">
            <TechnicalIndicator 
              name="RSI" 
              value={technical?.rsi} 
              interpretation={ai?.technical?.rsi}
            />
            <TechnicalIndicator 
              name="CMO" 
              value={technical?.cmo}
              interpretation={ai?.technical?.cmo}
            />
            <TechnicalIndicator name="SMA 20" value={technical?.sma20} />
            <TechnicalIndicator name="SMA 50" value={technical?.sma50} />
            <TechnicalIndicator name="EMA 9" value={technical?.ema9} />
            <TechnicalIndicator name="EMA 21" value={technical?.ema21} />
          </div>
          
          {technical?.bollinger && (
            <div className="mt-4 pt-4 border-t border-[#3E352F]">
              <h4 className="text-sm font-medium text-[#8B7355] mb-2">Bollinger Bands</h4>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">Lower: ${technical.bollinger.lower}</span>
                <span className="text-[#8B7355]">Middle: ${technical.bollinger.middle}</span>
                <span className="text-red-400">Upper: ${technical.bollinger.upper}</span>
              </div>
            </div>
          )}
        </AnalysisCard>
      </div>

      {/* Histórico e ZigZag */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Histórico de Preços */}
        <AnalysisCard title="Histórico Recente" icon="📉">
          <div className="space-y-4">
            {['24h', '7d', '30d'].map(period => {
              const stats = history?.[period];
              return stats ? (
                <div key={period} className="bg-[#231A14]/60 rounded-lg p-4 border border-[#3E352F]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[#D4AF37] font-medium">
                      {period === '24h' ? '24 Horas' : period === '7d' ? '7 Dias' : '30 Dias'}
                    </span>
                    <span className={`font-bold ${parseFloat(stats.changePercent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {stats.changePercent}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-[#8B7355]">Alta</span>
                      <span className="block text-[#F5F5F0] font-mono">${formatFixed(stats.high, 2)}</span>
                    </div>
                    <div>
                      <span className="text-[#8B7355]">Baixa</span>
                      <span className="block text-[#F5F5F0] font-mono">${formatFixed(stats.low, 2)}</span>
                    </div>
                    <div>
                      <span className="text-[#8B7355]">Vol.</span>
                      <span className="block text-[#F5F5F0] font-mono">{formatPercentFromFraction(stats.volatility, 1)}%</span>
                    </div>
                  </div>
                </div>
              ) : null;
            })}
          </div>
        </AnalysisCard>

        {/* Tendência Semanal (ZigZag) */}
        <AnalysisCard title="Tendência Semanal" icon="⚡">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[#8B7355]">Tendência Detectada</span>
              <SignalBadge signal={zigzag?.trend?.toUpperCase() || 'LATERAL'} />
            </div>
            
            {zigzag?.pivots?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-[#8B7355]">Últimos Pivots</h4>
                {zigzag.pivots.map((pivot, idx) => (
                  <div 
                    key={idx}
                    className={`flex justify-between items-center px-3 py-2 rounded text-sm ${
                      pivot.type === 'high' 
                        ? 'bg-red-500/10 border border-red-500/30' 
                        : 'bg-green-500/10 border border-green-500/30'
                    }`}
                  >
                    <span className={pivot.type === 'high' ? 'text-red-400' : 'text-green-400'}>
                      {pivot.type === 'high' ? '▲ Topo' : '▼ Fundo'}
                    </span>
                    <span className="font-mono text-[#F5F5F0]">${formatFixed(pivot.price, 2)}</span>
                    <span className="text-[#8B7355]">{pivot.change}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnalysisCard>
      </div>

      {/* Notícias e Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notícias Investing */}
        <AnalysisCard title="Notícias Investing" icon="📰">
          {news?.length > 0 ? (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {news.map((item, idx) => (
                <NewsItem 
                  key={idx}
                  title={item.title}
                  date={item.date}
                  link={item.link}
                />
              ))}
            </div>
          ) : (
            <p className="text-[#8B7355] text-center py-4">Nenhuma notícia disponível</p>
          )}
          
          {ai?.newsImpact && (
            <div className="mt-4 pt-4 border-t border-[#3E352F]">
              <h4 className="text-sm font-medium text-[#8B7355] mb-2">Impacto das Notícias</h4>
              <p className="text-sm text-[#F5F5F0]">{ai.newsImpact}</p>
            </div>
          )}
        </AnalysisCard>

        {/* Resumo Operacional */}
        <AnalysisCard title="Resumo Operacional" icon="📋">
          <div className="space-y-4">
            {/* Tendência e Força */}
            <div className="flex items-center justify-between">
              <span className="text-[#8B7355]">Tendência</span>
              <SignalBadge signal={ai?.trendNow || 'INDEFINIDO'} />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-[#8B7355]">Força do Sinal</span>
              <span className={`font-bold ${
                ai?.strength === 'FORTE' ? 'text-green-400' : 
                ai?.strength === 'MODERADO' ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {ai?.strength || 'N/A'}
              </span>
            </div>
            
            {/* Resumo IA */}
            <div className="pt-4 border-t border-[#3E352F]">
              <h4 className="text-sm font-medium text-[#8B7355] mb-2">Análise IA</h4>
              <p className="text-[#F5F5F0] text-sm leading-relaxed">
                {ai?.summary || 'Análise em processamento...'}
              </p>
            </div>

            {/* Osciladores e Médias */}
            {(ai?.technical?.oscillatorsSummary || ai?.technical?.movingAveragesSummary) && (
              <div className="pt-4 border-t border-[#3E352F] space-y-2">
                {ai?.technical?.oscillatorsSummary && (
                  <div>
                    <span className="text-[#8B7355] text-xs">Osciladores: </span>
                    <span className="text-[#F5F5F0] text-sm">{ai.technical.oscillatorsSummary}</span>
                  </div>
                )}
                {ai?.technical?.movingAveragesSummary && (
                  <div>
                    <span className="text-[#8B7355] text-xs">Médias Móveis: </span>
                    <span className="text-[#F5F5F0] text-sm">{ai.technical.movingAveragesSummary}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </AnalysisCard>
      </div>

      {/* Footer com Fontes */}
      <div className="mt-6 text-center text-[#8B7355] text-sm">
        <p>
          Fontes: 
          {data?.sources?.investing && <span className="mx-2">✓ Investing.com</span>}
          {data?.sources?.yahoo && <span className="mx-2">✓ Yahoo Finance</span>}
          {data?.sources?.pricePro && <span className="mx-2">✓ PricePro</span>}
        </p>
        <p className="mt-1 text-xs text-[#6E5A44]">
          ⚠️ Esta análise é apenas informativa e não constitui recomendação de investimento.
        </p>
      </div>
    </div>
  );
};

export default AnaliseFutura;
