import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  RefreshCw, 
  ExternalLink, 
  TrendingUp,
  TrendingDown,
  Globe,
  Brain,
  Newspaper,
  AlertCircle,
  Minus,
  BarChart3
} from "lucide-react";
import httpClient, { ApiError, ErrorTypes } from "../api/httpClient";

// Cores por score de relevancia
const RELEVANCE_COLORS = {
  0: "bg-gray-600",
  1: "bg-blue-600", 
  2: "bg-yellow-600",
  3: "bg-green-600"
};

const RELEVANCE_LABELS = {
  0: "Nao Relevante",
  1: "Pouco Relevante",
  2: "Relevante",
  3: "Muito Relevante"
};

// Cores por impacto global
const IMPACT_COLORS = {
  baixo: "bg-blue-700",
  moderado: "bg-yellow-600",
  alto: "bg-red-600"
};

// Funcao para analisar tendencia de uma noticia
function analyzeNewsTrend(title, description = "") {
  const text = (title + " " + description).toLowerCase();
  
  const positiveKeywords = [
    "alta", "sobe", "subiu", "valorizacao", "demanda", "crescimento", 
    "exportacao", "recorde", "aumento", "positivo", "otimismo", "safra boa",
    "producao alta", "preco sobe", "mercado aquecido"
  ];
  
  const negativeKeywords = [
    "queda", "cai", "caiu", "crise", "seca", "pragas", "reducao", 
    "problema", "prejuizo", "baixa", "desvalorizacao", "escassez",
    "safra ruim", "preco cai", "mercado fraco", "perda"
  ];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  positiveKeywords.forEach(kw => {
    if (text.includes(kw)) positiveScore++;
  });
  
  negativeKeywords.forEach(kw => {
    if (text.includes(kw)) negativeScore++;
  });
  
  if (positiveScore > negativeScore) {
    return { 
      trend: "alta", 
      icon: TrendingUp, 
      color: "text-green-400", 
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30",
      label: "MERCADO SOBE"
    };
  } else if (negativeScore > positiveScore) {
    return { 
      trend: "queda", 
      icon: TrendingDown, 
      color: "text-red-400",
      bgColor: "bg-red-500/20",
      borderColor: "border-red-500/30",
      label: "MERCADO CAI"
    };
  }
  
  return { 
    trend: "estavel", 
    icon: Minus, 
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/20",
    borderColor: "border-yellow-500/30",
    label: "MERCADO ESTAVEL"
  };
}

// Componente de Resumo Geral do Mercado
function MarketSummary({ news }) {
  const analysis = React.useMemo(() => {
    if (news.length === 0) return null;
    
    let alta = 0, queda = 0, estavel = 0;
    
    news.forEach(item => {
      const trend = analyzeNewsTrend(item.title, item.description);
      if (trend.trend === "alta") alta++;
      else if (trend.trend === "queda") queda++;
      else estavel++;
    });
    
    const total = news.length;
    const mainTrend = alta > queda ? "alta" : queda > alta ? "queda" : "estavel";
    const confidence = Math.round(Math.max(alta, queda, estavel) / total * 100);
    
    return { alta, queda, estavel, total, mainTrend, confidence };
  }, [news]);

  if (!analysis) return null;

  const getTrendStyle = () => {
    if (analysis.mainTrend === "alta") return {
      bg: "from-green-600/20 to-green-900/10",
      border: "border-green-500/30",
      text: "text-green-400",
      icon: TrendingUp,
      label: "TENDENCIA DE ALTA"
    };
    if (analysis.mainTrend === "queda") return {
      bg: "from-red-600/20 to-red-900/10",
      border: "border-red-500/30",
      text: "text-red-400",
      icon: TrendingDown,
      label: "TENDENCIA DE QUEDA"
    };
    return {
      bg: "from-yellow-600/20 to-yellow-900/10",
      border: "border-yellow-500/30",
      text: "text-yellow-400",
      icon: Minus,
      label: "MERCADO ESTAVEL"
    };
  };

  const style = getTrendStyle();
  const Icon = style.icon;

  return (
    <div className={`bg-gradient-to-r ${style.bg} rounded-xl p-6 border ${style.border} mb-6`}>
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
        <h3 className="text-lg font-bold text-[#D4AF37]">Analise Geral do Mercado</h3>
      </div>
      
      <div className="grid md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-[#1A1512] flex items-center justify-center">
            <Icon className={`w-7 h-7 ${style.text}`} />
          </div>
          <div>
            <p className={`text-xl font-bold ${style.text}`}>{style.label}</p>
            <p className="text-sm text-[#8B7355]">Confianca: {analysis.confidence}%</p>
          </div>
        </div>
        
        <div className="bg-[#1A1512]/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-green-400">{analysis.alta}</p>
          <p className="text-xs text-[#8B7355]">Noticias de Alta</p>
        </div>
        
        <div className="bg-[#1A1512]/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-red-400">{analysis.queda}</p>
          <p className="text-xs text-[#8B7355]">Noticias de Queda</p>
        </div>
        
        <div className="bg-[#1A1512]/50 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-yellow-400">{analysis.estavel}</p>
          <p className="text-xs text-[#8B7355]">Noticias Neutras</p>
        </div>
      </div>
      
      <div className="mt-4 bg-[#1A1512]/50 rounded-lg p-4 border-l-4 border-[#D4AF37]">
        <p className="text-xs text-[#D4AF37] mb-1">RECOMENDACAO DA IA</p>
        <p className="text-sm text-[#F5F5F0]">
          {analysis.mainTrend === "alta" 
            ? `Baseado em ${analysis.alta} noticias positivas, o mercado indica valorizacao. Momento favoravel para posicoes de compra.`
            : analysis.mainTrend === "queda"
            ? `Baseado em ${analysis.queda} noticias negativas, o mercado indica pressao de venda. Cautela recomendada.`
            : `Mercado sem direcao clara. Aguarde sinais mais definidos antes de novas posicoes.`
          }
        </p>
      </div>
    </div>
  );
}

export default function NoticiasImportantes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [news, setNews] = useState([]);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const fetchNews = async () => {
    try {
      setError(null);
      const data = await httpClient.get('/api/news/classified?minScore=1&limit=50');
      
      if (data.success) {
        setNews(data.data || []);
      } else {
        setNews(data.data || data || []);
      }
    } catch (err) {
      // Tratamento específico por tipo de erro
      if (err instanceof ApiError) {
        switch (err.type) {
          case ErrorTypes.NETWORK:
            setError("🔌 Servidor offline. Verifique se o backend está rodando na porta 4000.");
            break;
          case ErrorTypes.TIMEOUT:
            setError("⏱️ A requisição demorou muito. Tente novamente.");
            break;
          case ErrorTypes.SERVER:
            setError(`🚨 Erro no servidor: ${err.message}`);
            break;
          default:
            setError(`❌ Erro: ${err.message}`);
        }
      } else {
        setError("❌ Não foi possível carregar as notícias.");
      }
      console.error("Erro ao buscar noticias:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await httpClient.get('/api/news/stats');
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      // Stats é opcional, apenas loga o erro
      console.warn("Stats indisponível:", err.message);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchNews(), fetchStats()]);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchNews(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1A1512] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#D4AF37] animate-spin mx-auto mb-4" />
          <p className="text-[#8B7355]">Carregando noticias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1512] text-[#F5F5F0]">
      <header className="bg-[#1A1512] border-b border-[#3E352F] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="p-2 hover:bg-[#2A2018] rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[#D4AF37]" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-[#D4AF37] flex items-center gap-2">
                  <Newspaper className="w-6 h-6" />
                  Noticias do Cacau
                </h1>
                <p className="text-sm text-[#8B7355]">
                  Analise de relevancia e impacto por IA - O mercado vai subir ou descer?
                </p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-[#1A1512] rounded-lg font-medium hover:bg-[#B8962E] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <MarketSummary news={news} />

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#2A2018] rounded-xl p-4 border border-[#3E352F]">
              <div className="text-2xl font-bold text-[#D4AF37]">{stats.total || 0}</div>
              <div className="text-sm text-[#8B7355]">Total de Noticias</div>
            </div>
            <div className="bg-[#2A2018] rounded-xl p-4 border border-[#3E352F]">
              <div className="text-2xl font-bold text-green-500">{stats.distribution?.["muito relevante"] || 0}</div>
              <div className="text-sm text-[#8B7355]">Muito Relevantes</div>
            </div>
            <div className="bg-[#2A2018] rounded-xl p-4 border border-[#3E352F]">
              <div className="text-2xl font-bold text-yellow-500">{stats.distribution?.["relevante"] || 0}</div>
              <div className="text-sm text-[#8B7355]">Relevantes</div>
            </div>
            <div className="bg-[#2A2018] rounded-xl p-4 border border-[#3E352F]">
              <div className="text-2xl font-bold text-[#8B7355]">{stats.pending || 0}</div>
              <div className="text-sm text-[#8B7355]">Pendentes</div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-[#2A2018] border border-[#3E352F] rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-[#F5F5F0]">Erro de conexão</h3>
              <p className="text-[#8B7355] text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {news.length === 0 && !error ? (
          <div className="text-center py-20">
            <Newspaper className="w-16 h-16 text-[#3E352F] mx-auto mb-4" />
            <h3 className="text-xl text-[#8B7355]">Nenhuma noticia encontrada</h3>
            <p className="text-[#6B5B45] mt-2">Execute o scraping para coletar noticias</p>
          </div>
        ) : (
          <div className="space-y-4">
            {news.map((item) => {
              const trendAnalysis = analyzeNewsTrend(item.title, item.description);
              const TrendIcon = trendAnalysis.icon;
              
              return (
                <article
                  key={item._id}
                  className={`bg-[#2A2018] rounded-xl p-5 border ${trendAnalysis.borderColor} hover:border-[#D4AF37]/50 transition-colors`}
                >
                  <div className={`${trendAnalysis.bgColor} rounded-lg px-4 py-2 mb-4 flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <TrendIcon className={`w-5 h-5 ${trendAnalysis.color}`} />
                      <span className={`font-bold ${trendAnalysis.color}`}>
                        {trendAnalysis.label}
                      </span>
                    </div>
                    <span className="text-xs text-[#8B7355]">Analise IA</span>
                  </div>

                  <h2 className="text-lg font-semibold text-[#F5F5F0] mb-3 leading-tight">
                    {item.title}
                  </h2>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={`${RELEVANCE_COLORS[item.classification?.score] || "bg-gray-600"} px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1`}>
                      <TrendingUp className="w-3 h-3" />
                      {RELEVANCE_LABELS[item.classification?.score] || "Pendente"}
                    </span>

                    {item.opinion?.score !== undefined && item.opinion?.score !== null && (
                      <span className="bg-purple-700 px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1">
                        <Brain className="w-3 h-3" />
                        Opiniao IA: {item.opinion.score}/3
                      </span>
                    )}

                    {item.opinion?.globalImpact && (
                      <span className={`${IMPACT_COLORS[item.opinion.globalImpact] || "bg-gray-600"} px-3 py-1 rounded-full text-xs font-medium text-white flex items-center gap-1`}>
                        <Globe className="w-3 h-3" />
                        Impacto: {item.opinion.globalImpact}
                      </span>
                    )}
                  </div>

                  {item.opinion?.text && (
                    <div className="bg-[#1A1512] rounded-lg p-4 mb-4 border border-[#3E352F]">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-medium text-purple-400">Analise da IA</span>
                      </div>
                      <p className="text-[#A89080] text-sm leading-relaxed">
                        {item.opinion.text}
                      </p>
                    </div>
                  )}

                  {item.description && !item.opinion?.text && (
                    <p className="text-[#8B7355] text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[#3E352F]">
                    <span className="text-xs text-[#6B5B45]">
                      Fonte: {item.source?.name || "Desconhecida"}
                    </span>

                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[#D4AF37] hover:text-[#B8962E] text-sm font-medium transition-colors"
                      >
                        Ler noticia
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
