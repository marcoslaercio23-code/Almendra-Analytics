import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar
} from 'recharts';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip, Grid,
  CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import TimelineIcon from '@mui/icons-material/Timeline';
import tradingViewService from '../api/tradingviewData';

const RealtimeTradingViewChart = ({ autoRefresh = true }) => {
  const [currentData, setCurrentData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [technicalAnalysis, setTechnicalAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('area'); // 'area', 'line', 'composed'
  const [analysisDialog, setAnalysisDialog] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Carrega dados iniciais
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        console.log('🚀 Carregando dados iniciais...');
        
        // Busca dados em tempo real
        const realtimeData = await tradingViewService.fetchCocoaRealTimeData();
        console.log('📊 Dados em tempo real:', realtimeData);
        if (!realtimeData) {
          throw new Error('Nenhum dado em tempo real recebido');
        }
        setCurrentData(realtimeData);
        
        // Busca histórico com 90 dias
        const history = await tradingViewService.fetchHistoricalData(tradingViewService.FINNHUB_SYMBOL, 90);
        console.log('📈 Histórico carregado:', history.data?.length || 0, 'candles');
        if (!history.data || history.data.length === 0) {
          throw new Error('Histórico vazio');
        }
        setHistoricalData(history.data);
        
        // Calcula análise técnica
        if (history.data) {
          const analysis = tradingViewService.calculateTechnicalAnalysis(history.data);
          console.log('📉 Análise técnica calculada:', analysis);
          setTechnicalAnalysis(analysis);
        }
        
        setLastUpdate(new Date());
        setError(null);
      } catch (err) {
        console.error('❌ Erro ao carregar dados:', err);
        setError(`❌ ERRO: ${err.message} - Verifique a chave Finnhub e a conexão`);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Subscrição a atualizações em tempo real
  useEffect(() => {
    if (!autoRefresh || !historicalData || historicalData.length === 0) return;

    const unsubscribe = tradingViewService.subscribeToRealtimeUpdates('', (data) => {
      if (!data || !data.price) return;
      
      setCurrentData(data);
      setLastUpdate(new Date());
      
      // Atualiza apenas o preço no histórico, sem duplicar dados
      setHistoricalData(prev => {
        if (!prev || prev.length === 0) return prev;
        
        const newData = [...prev];
        const lastIndex = newData.length - 1;
        
        // Atualiza o último candle com o novo preço
        newData[lastIndex] = {
          ...newData[lastIndex],
          close: data.price,
          high: Math.max(newData[lastIndex].high || 0, data.price),
          low: Math.min(newData[lastIndex].low || data.price, data.price),
        };
        
        return newData; // Mantém os dados, apenas atualiza o último
      });
    }, 10000);

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [autoRefresh, historicalData.length]);

  // Atualiza análise técnica quando histórico muda
  useEffect(() => {
    if (historicalData.length > 20) {
      const analysis = tradingViewService.calculateTechnicalAnalysis(historicalData);
      setTechnicalAnalysis(analysis);
    }
  }, [historicalData]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const data = await tradingViewService.fetchCocoaRealTimeData();
      setCurrentData(data);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError('Erro ao atualizar dados');
    } finally {
      setLoading(false);
    }
  };

  if (!currentData && loading) {
    return (
      <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (error && !currentData) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <br />
        <strong>Debug:</strong> Verifique o console (F12) para mais detalhes. Certifique-se de que:
        <ul>
          <li>REACT_APP_FINNHUB_KEY está correto em .env.local</li>
          <li>A conexão de rede está ativa</li>
          <li>Finnhub não está bloqueando a requisição (CORS)</li>
        </ul>
      </Alert>
    );
  }

  const isPriceUp = currentData?.percentChange >= 0;
  const priceChangeColor = isPriceUp ? '#4caf50' : '#f44336';
  const PriceChangeIcon = isPriceUp ? TrendingUpIcon : TrendingDownIcon;

  const transformedData = historicalData.map(d => ({
    date: d.date ? d.date.slice(-5) : 'N/A', // Apenas hora
    price: d.close,
    high: d.high,
    low: d.low,
    volume: d.volume,
  }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Card de Preço Atual */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%)',
          border: '2px solid #8B4513',
          boxShadow: '0 8px 32px rgba(139, 69, 19, 0.15)',
        }}
      >
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TimelineIcon sx={{ fontSize: 28, color: '#8B4513' }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                  COMMODITIES - Dados em Tempo Real (Finnhub)
                </Typography>
                <Typography variant="caption" sx={{ color: '#666', display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Chip size="small" label={`Fonte: ${currentData?.source || 'N/A'}`} />
                  <Chip size="small" label={`Moeda: ${currentData?.currency || 'USD'}`} />
                  <Chip size="small" label={`Símbolo: ${currentData?.symbol || 'N/A'}`} />
                  • Atualizado: {lastUpdate?.toLocaleTimeString('pt-BR')}
                </Typography>
              </Box>
            </Box>
          }
          action={
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Atualizar
            </Button>
          }
        />
        <CardContent>
          <Grid container spacing={2}>
            {/* Preço Atual */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Preço Atual
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                  ${currentData?.price?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Variação */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Variação
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                  <PriceChangeIcon sx={{ color: priceChangeColor, fontSize: 28 }} />
                  <Box>
                    <Typography
                      variant="h6"
                      sx={{ fontWeight: 'bold', color: priceChangeColor }}
                    >
                      {currentData?.percentChange?.toFixed(2)}%
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#666' }}>
                      USD {((currentData?.price - currentData?.previousClose) || 0).toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            {/* Máxima do Dia */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Máxima do Dia
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                  ${currentData?.high?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Mínima do Dia */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Mínima do Dia
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                  ${currentData?.low?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Volume */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Abertura
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                  ${currentData?.open?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>

            {/* Fechamento Anterior */}
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  Fechamento Anterior
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#8B4513' }}>
                  ${currentData?.previousClose?.toFixed(2)}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Gráfico de Preço */}
      <Card
        sx={{
          background: 'linear-gradient(135deg, #fff9f0 0%, #fff5e6 100%)',
          border: '2px solid #8B4513',
          boxShadow: '0 8px 32px rgba(139, 69, 19, 0.15)',
        }}
      >
        <CardHeader
          title="Gráfico de Preço - Últimos 90 dias"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip
                label="Área"
                onClick={() => setChartType('area')}
                variant={chartType === 'area' ? 'filled' : 'outlined'}
                color={chartType === 'area' ? 'primary' : 'default'}
              />
              <Chip
                label="Linha"
                onClick={() => setChartType('line')}
                variant={chartType === 'line' ? 'filled' : 'outlined'}
                color={chartType === 'line' ? 'primary' : 'default'}
              />
              <Chip
                label="Análise"
                onClick={() => setAnalysisDialog(true)}
                variant="outlined"
              />
            </Box>
          }
        />
        <CardContent>
          {transformedData.length > 0 ? (
            <ResponsiveContainer width="100%" height={450}>
              {chartType === 'area' ? (
                <AreaChart data={transformedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B4513" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8B4513" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }} 
                    interval={Math.floor(transformedData.length / 8)}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']} 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Preço', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    labelStyle={{ color: '#000' }}
                    contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #8B4513' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#8B4513"
                    fillOpacity={1}
                    fill="url(#colorPrice)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={transformedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(transformedData.length / 8)}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={['dataMin - 100', 'dataMax + 100']} 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Preço', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                    labelStyle={{ color: '#000' }}
                    contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #8B4513' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#8B4513"
                    dot={false}
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    name="Preço"
                  />
                </LineChart>
              ) : (
                <ComposedChart data={transformedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 11 }}
                    interval={Math.floor(transformedData.length / 8)}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    yAxisId="left" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Preço', angle: -90, position: 'insideLeft' }}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Volume', angle: 90, position: 'insideRight' }}
                  />
                  <Tooltip
                    formatter={(value) => `${Number(value).toFixed(2)}`}
                    labelStyle={{ color: '#000' }}
                    contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #8B4513' }}
                  />
                  <Legend />
                  <Bar yAxisId="right" dataKey="volume" fill="#FFD700" opacity={0.6} isAnimationActive={false} name="Volume" />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="price"
                    stroke="#8B4513"
                    dot={false}
                    strokeWidth={2.5}
                    isAnimationActive={false}
                    name="Preço"
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          ) : (
            <Typography>Carregando gráfico...</Typography>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Análise Técnica */}
      <Dialog
        open={analysisDialog}
        onClose={() => setAnalysisDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Análise Técnica - COCOA</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {technicalAnalysis ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* RSI */}
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  RSI (Relative Strength Index)
                </Typography>
                <Typography variant="body1">
                  {technicalAnalysis.rsi?.toFixed(2)}
                </Typography>
                <Typography variant="caption" sx={{ color: '#666' }}>
                  {technicalAnalysis.rsi > 70
                    ? '⚠️ Sobrecomprado'
                    : technicalAnalysis.rsi < 30
                    ? '⚠️ Sobrevendido'
                    : '✅ Neutro'}
                </Typography>
              </Box>

              {/* MACD */}
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  MACD (Moving Average Convergence Divergence)
                </Typography>
                <Typography variant="body2">
                  Linha: {technicalAnalysis.macd?.macdLine?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Sinal: {technicalAnalysis.macd?.signalLine?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Histograma: {technicalAnalysis.macd?.histogram?.toFixed(2)}
                </Typography>
              </Box>

              {/* Bollinger Bands */}
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Bollinger Bands
                </Typography>
                <Typography variant="body2">
                  Superior: ${technicalAnalysis.bollingerBands?.upper?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Média: ${technicalAnalysis.bollingerBands?.middle?.toFixed(2)}
                </Typography>
                <Typography variant="body2">
                  Inferior: ${technicalAnalysis.bollingerBands?.lower?.toFixed(2)}
                </Typography>
              </Box>

              {/* Sinal de Negociação */}
              <Box sx={{ p: 2, background: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Sinal de Negociação
                </Typography>
                <Chip
                  label={technicalAnalysis.signal?.signal || 'NEUTRAL'}
                  color={
                    technicalAnalysis.signal?.signal === 'BUY'
                      ? 'success'
                      : technicalAnalysis.signal?.signal === 'SELL'
                      ? 'error'
                      : 'default'
                  }
                  sx={{ mt: 1 }}
                />
                <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#666' }}>
                  Força: {technicalAnalysis.signal?.strength}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography>Carregando análise técnica...</Typography>
          )}
        </DialogContent>
      </Dialog>

      {error && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default RealtimeTradingViewChart;
