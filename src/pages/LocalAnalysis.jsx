import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThermometerSun, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Globe,
  Newspaper,
  MapPin,
  Wind,
  Droplets,
  Cloud,
  RefreshCw,
  Loader2
} from 'lucide-react';
import httpClient, { ApiError, ErrorTypes } from '../api/httpClient';
import MovementBadge from '../components/MovementBadge';

const getFlagEmoji = (countryCode) => {
  if (!countryCode) {
    return '🌍';
  }

  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(char.charCodeAt(0) + 127397))
    .join('');
};

export default function LocalAnalysis() {
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(true);
  const [regionsError, setRegionsError] = useState(null);
  const [regionId, setRegionId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function loadData(id) {
    if (!id) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const json = await httpClient.get(`/api/regions/${id}/analysis`);
      
      if (json.success) {
        setData(json.data);
      } else {
        throw new Error(json.error || "Erro desconhecido");
      }
    } catch (e) {
      console.error("Erro ao carregar análise:", e);
      if (e instanceof ApiError) {
        switch (e.type) {
          case ErrorTypes.NETWORK:
            setError("🔌 Servidor offline. Verifique o backend.");
            break;
          case ErrorTypes.TIMEOUT:
            setError("⏱️ Timeout. Tente novamente.");
            break;
          default:
            setError(e.message);
        }
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchRegions() {
      try {
        setRegionsLoading(true);
        setRegionsError(null);

        const json = await httpClient.get('/api/regions');

        if (!json.success || !Array.isArray(json.data) || json.data.length === 0) {
          throw new Error('Nenhuma região disponível no backend.');
        }

        const sorted = json.data.sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );

        if (isMounted) {
          setRegions(sorted);
          setRegionId((current) => current || sorted[0].id);
        }
      } catch (e) {
        console.error('Erro ao listar regiões:', e);
        if (isMounted) {
          if (e instanceof ApiError && e.type === ErrorTypes.NETWORK) {
            setRegionsError('🔌 Servidor offline. Verifique se o backend está rodando.');
          } else {
            setRegionsError(e.message);
          }
        }
      } finally {
        if (isMounted) {
          setRegionsLoading(false);
        }
      }
    }

    fetchRegions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    loadData(regionId);
  }, [regionId]);

  const selectedRegion = regions.find(r => r.id === regionId);
  const brazilRegions = regions.filter(r => r.type === 'BR');
  const globalRegions = regions.filter(r => r.type !== 'BR');

  // Loading regiões
  if (regionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-[#F5F5F0] text-lg">Carregando lista de regiões...</p>
          <p className="text-gray-400 text-sm mt-2">Verificando backend e configurações</p>
        </div>
      </div>
    );
  }

  if (regionsError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F5F5F0] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
        
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F5F0] mb-2">Backend indisponível</h2>
          <p className="text-gray-400 mb-6">{regionsError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-[#F5F5F0] text-lg">Carregando análise de {selectedRegion?.name || 'região selecionada'}...</p>
          <p className="text-gray-400 text-sm mt-2">Buscando dados de clima, preço e geopolítica</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F5F5F0] mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Voltar ao Dashboard
        </button>
        
        <div className="max-w-md mx-auto mt-20 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-[#F5F5F0] mb-2">Erro ao carregar</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => loadData(regionId)}
            className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { region, price, climate, analysis, news, geopolitical, metadata, movementCertificate } = data;

  // Determinar cores baseado em tendência/risco
  const getTrendColor = (trend) => {
    if (trend === "alta") return "text-green-400";
    if (trend === "queda") return "text-red-400";
    return "text-yellow-400";
  };

  const getRiskColor = (level) => {
    if (level === "alto") return "text-red-400 bg-red-400/10 border-red-400/30";
    if (level === "moderado") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/30";
    return "text-green-400 bg-green-400/10 border-green-400/30";
  };

  const getRiskBadge = (level) => {
    if (level === "alto") return "🔴";
    if (level === "moderado") return "🟡";
    return "🟢";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] text-[#F5F5F0]">
      {/* Header */}
      <div className="bg-[#1A1512]/80 border-b border-[#D4AF37]/20 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-[#D4AF37] hover:text-[#F5F5F0] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            
            <div className="flex items-center gap-4">
              <select
                className="bg-[#2D2420] border border-[#D4AF37]/30 text-[#F5F5F0] px-4 py-2 rounded-lg focus:outline-none focus:border-[#D4AF37]"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
              >
                {brazilRegions.length > 0 && (
                  <optgroup label="🇧🇷 Brasil">
                    {brazilRegions.map((regionOption) => (
                      <option key={regionOption.id} value={regionOption.id}>
                        {`${getFlagEmoji(regionOption.countryCode)} ${regionOption.name}`}
                      </option>
                    ))}
                  </optgroup>
                )}

                {globalRegions.length > 0 && (
                  <optgroup label="🌍 Global">
                    {globalRegions.map((regionOption) => (
                      <option key={regionOption.id} value={regionOption.id}>
                        {`${getFlagEmoji(regionOption.countryCode)} ${regionOption.name}`}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
              
              <button 
                onClick={() => loadData(regionId)}
                className="p-2 bg-[#D4AF37]/20 rounded-lg hover:bg-[#D4AF37]/30 transition-colors"
                title="Atualizar dados"
              >
                <RefreshCw className="w-5 h-5 text-[#D4AF37]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Título da Região */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[#D4AF37]/20 rounded-xl flex items-center justify-center text-3xl">
            {getFlagEmoji(selectedRegion?.countryCode)}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">
              Análise Regional: {region?.name}
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {region?.state ? `${region.state}, ` : ''}{region?.country}
              <span className="mx-2">•</span>
              <span className="text-xs">
                Atualizado: {metadata?.processingTime} • Qualidade: {metadata?.dataQuality?.percentage}%
              </span>
            </p>

              <div className="mt-3">
                <MovementBadge certificate={data?.movementCertificate} />
              </div>
          </div>
        </div>

        {/* Cards Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card de Preço */}
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#D4AF37]" />
                Preço do Cacau
              </h2>
              {price?.trend === "alta" ? 
                <TrendingUp className="w-6 h-6 text-green-400" /> : 
                price?.trend === "queda" ?
                <TrendingDown className="w-6 h-6 text-red-400" /> :
                <span className="text-yellow-400">➡️</span>
              }
            </div>
            
            <p className="text-4xl font-bold text-[#D4AF37]">
              {price?.currency === 'BRL' ? 'R$ ' : '$ '}{price?.value?.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm">{price?.unit}</p>
            
            <div className={`mt-4 inline-block px-3 py-1 rounded-full text-sm font-semibold ${getTrendColor(price?.trend)} bg-current/10`}>
              Tendência: {price?.trend?.toUpperCase()}
            </div>
            
            {price?.variation && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Dia:</span>
                  <span className={`ml-2 font-semibold ${price.variation.day >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {price.variation.dayPercent}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Semana:</span>
                  <span className={`ml-2 font-semibold ${price.variation.week >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {price.variation.weekPercent}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card de Clima */}
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-colors">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <ThermometerSun className="w-5 h-5 text-[#D4AF37]" />
              Clima Atual
            </h2>
            
            <div className="flex items-center gap-4">
              <p className="text-5xl font-bold text-[#F5F5F0]">
                {climate?.current?.temperature}°C
              </p>
              <div className="text-4xl">
                {climate?.current?.weatherCode <= 3 ? '☀️' : 
                 climate?.current?.weatherCode <= 48 ? '🌤️' :
                 climate?.current?.weatherCode <= 67 ? '🌧️' : '⛈️'}
              </div>
            </div>
            
            <p className="text-gray-400 mt-2">{climate?.current?.weatherDescription}</p>
            
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-blue-400" />
                <span>{climate?.current?.windSpeed} km/h</span>
              </div>
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-gray-400" />
                <span>{climate?.current?.windDirection}°</span>
              </div>
            </div>
            
            {/* Últimas 48h */}
            {climate?.last48h && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 mb-2">Últimas 48h:</p>
                <div className="flex justify-between text-sm">
                  <span>Min: {climate.last48h.minTemperature}°C</span>
                  <span>Média: {climate.last48h.avgTemperature}°C</span>
                  <span>Max: {climate.last48h.maxTemperature}°C</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Droplets className="w-4 h-4 text-blue-400" />
                  <span className="text-sm">{climate.last48h.totalPrecipitation}mm de chuva</span>
                </div>
              </div>
            )}
          </div>

          {/* Card de Risco */}
          <div className={`rounded-xl p-6 border ${getRiskColor(climate?.risk?.level || analysis?.riskLevel)}`}>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5" />
              Nível de Risco
            </h2>
            
            <div className="flex items-center gap-3">
              <span className="text-4xl">{getRiskBadge(analysis?.riskLevel)}</span>
              <p className="text-3xl font-bold uppercase">
                {analysis?.riskLevel || climate?.risk?.level}
              </p>
            </div>
            
            {climate?.risk?.factors?.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Fatores de risco:</p>
                <ul className="space-y-1">
                  {climate.risk.factors.map((f, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-400">⚠️</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-current/20">
              <p className="text-xs text-gray-400">Confiança da análise:</p>
              <p className="font-semibold">{analysis?.confidenceLevel?.toUpperCase()}</p>
            </div>
          </div>
        </div>

        {movementCertificate && (
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <h2 className="text-xl font-bold text-[#D4AF37] flex items-center gap-2">
                🏅 Certificado de Movimento do Cacau
              </h2>
              <MovementBadge certificate={movementCertificate} />
            </div>

            <p className="text-sm text-gray-300 mt-3">
              {movementCertificate.message || 'Sem variação relevante detectada na semana.'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
              <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                <p className="text-[#8B7355]">Variação 7d</p>
                <p className="text-[#F5F5F0] font-mono text-lg">{movementCertificate.metrics?.changePercent7d?.toFixed ? movementCertificate.metrics.changePercent7d.toFixed(2) : 'N/A'}%</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                <p className="text-[#8B7355]">Volatilidade 7d</p>
                <p className="text-[#F5F5F0] font-mono text-lg">{movementCertificate.metrics?.volatilityPercent7d?.toFixed ? movementCertificate.metrics.volatilityPercent7d.toFixed(2) : 'N/A'}%</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                <p className="text-[#8B7355]">Tendência (ZigZag)</p>
                <p className="text-[#F5F5F0] font-semibold">{movementCertificate.metrics?.zigzagTrend || 'LATERAL'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Análise Detalhada */}
        <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20">
          <h2 className="text-2xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
            📊 Resumo da Análise
          </h2>
          
          <p className="text-lg text-[#F5F5F0] leading-relaxed mb-6">
            {analysis?.summary}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Impacto Climático */}
            <div className="bg-[#1A1512] rounded-lg p-4">
              <h3 className="font-semibold text-[#D4AF37] flex items-center gap-2 mb-2">
                <ThermometerSun className="w-5 h-5" />
                Impacto Climático
              </h3>
              <p className="text-gray-300">{analysis?.climateImpact}</p>
            </div>
            
            {/* Impacto Geopolítico */}
            <div className="bg-[#1A1512] rounded-lg p-4">
              <h3 className="font-semibold text-[#D4AF37] flex items-center gap-2 mb-2">
                <Globe className="w-5 h-5" />
                Impacto Geopolítico
              </h3>
              <p className="text-gray-300">{analysis?.geopoliticalImpact}</p>
            </div>
          </div>
          
          {/* Recomendação */}
          <div className="mt-6 bg-gradient-to-r from-[#D4AF37]/20 to-transparent rounded-lg p-4 border-l-4 border-[#D4AF37]">
            <h3 className="font-semibold text-[#D4AF37] mb-2">💡 Recomendação</h3>
            <p className="text-[#F5F5F0]">{analysis?.recommendation}</p>
          </div>
          
          {/* Perspectivas */}
          {analysis?.outlook && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A1512] rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Curto Prazo (1-2 semanas)</h4>
                <p className="text-[#F5F5F0]">{analysis.outlook.shortTerm}</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-4">
                <h4 className="text-sm text-gray-400 mb-1">Médio Prazo (1-3 meses)</h4>
                <p className="text-[#F5F5F0]">{analysis.outlook.mediumTerm}</p>
              </div>
            </div>
          )}
          
          {/* Fatores-chave */}
          {analysis?.keyFactors?.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm text-gray-400 mb-2">Fatores-chave:</h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keyFactors.map((factor, i) => (
                  <span key={i} className="px-3 py-1 bg-[#D4AF37]/20 text-[#D4AF37] rounded-full text-sm">
                    {factor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dados Geopolíticos */}
        {geopolitical && (
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Globe className="w-6 h-6" />
              Análise Geopolítica
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center p-3 bg-[#1A1512] rounded-lg">
                <p className="text-xs text-gray-400">Risco Geral</p>
                <p className="text-lg font-bold">{getRiskBadge(geopolitical.risk?.overall)} {geopolitical.risk?.overall}</p>
              </div>
              <div className="text-center p-3 bg-[#1A1512] rounded-lg">
                <p className="text-xs text-gray-400">Logística</p>
                <p className="text-lg font-bold">{geopolitical.risk?.logistics}</p>
              </div>
              <div className="text-center p-3 bg-[#1A1512] rounded-lg">
                <p className="text-xs text-gray-400">Conflito</p>
                <p className="text-lg font-bold">{geopolitical.risk?.conflict}</p>
              </div>
              <div className="text-center p-3 bg-[#1A1512] rounded-lg">
                <p className="text-xs text-gray-400">Comércio</p>
                <p className="text-lg font-bold">{geopolitical.risk?.trade}</p>
              </div>
            </div>
            
            {geopolitical.factors?.length > 0 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Fatores relevantes:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {geopolitical.factors.map((f, i) => (
                    <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                      <span>•</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Notícias Recentes */}
        {news?.recent?.length > 0 && (
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Newspaper className="w-6 h-6" />
              Notícias Recentes ({news.count})
            </h2>
            
            <div className="space-y-4">
              {news.recent.map((n, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-[#1A1512] rounded-lg hover:bg-[#1A1512]/80 transition-colors">
                  <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                    📰
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#F5F5F0] line-clamp-2">
                      {n.title}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                      {typeof n.source === 'object' ? n.source.name : n.source} • {new Date(n.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Previsão 72h */}
        {climate?.forecast72h && (
          <div className="bg-[#2D2420] rounded-xl p-6 border border-[#D4AF37]/20">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4">
              🌤️ Previsão para os próximos 3 dias
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-[#1A1512] rounded-lg">
                <p className="text-sm text-gray-400">Temp. Mínima</p>
                <p className="text-2xl font-bold text-blue-400">{climate.forecast72h.minTemperature}°C</p>
              </div>
              <div className="text-center p-4 bg-[#1A1512] rounded-lg">
                <p className="text-sm text-gray-400">Temp. Média</p>
                <p className="text-2xl font-bold text-[#F5F5F0]">{climate.forecast72h.avgTemperature}°C</p>
              </div>
              <div className="text-center p-4 bg-[#1A1512] rounded-lg">
                <p className="text-sm text-gray-400">Temp. Máxima</p>
                <p className="text-2xl font-bold text-orange-400">{climate.forecast72h.maxTemperature}°C</p>
              </div>
              <div className="text-center p-4 bg-[#1A1512] rounded-lg">
                <p className="text-sm text-gray-400">Precipitação</p>
                <p className="text-2xl font-bold text-blue-400">{climate.forecast72h.totalPrecipitation}mm</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm py-6">
          <p>Dados gerados por IA usando Groq LLaMA • Open-Meteo API • Scraping de preços</p>
          <p className="mt-1">Processamento: {metadata?.processingTime} • Atualizado em {new Date(metadata?.generatedAt || Date.now()).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  );
}
