import { useEffect, useState, useCallback } from 'react';
import { TradingViewRealTimeService } from '../api/tradingviewData';

/**
 * Hook para dados em tempo real do Finnhub
 * Integra CCH25, CCC2 e outros contratos de futuros
 */
export const useRealTimeData = (symbol = 'CCH25', updateInterval = 5000) => {
  const [data, setData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const service = new TradingViewRealTimeService();
    let unsubscribe = null;
    let mounted = true;

    const initialize = async () => {
      if (updateInterval === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar dados reais iniciais
        console.log('📊 Buscando dados em tempo real do Finnhub...');
        const realtimeData = await service.fetchCocoaRealTimeData();
        
        if (mounted) {
          setData(realtimeData);
          setIsConnected(true);
          console.log('✅ Dados em tempo real carregados:', realtimeData);
        }

        // Buscar histórico (30 dias por padrão)
        try {
          const historicalDataResponse = await service.fetchHistoricalData(symbol, 30);
          if (mounted) {
            setHistoricalData(historicalDataResponse);
            console.log('📈 Histórico carregado:', historicalDataResponse.data.length, 'dias');
          }
        } catch (histErr) {
          console.warn('⚠️ Erro ao carregar histórico:', histErr.message);
          // Continua mesmo se histórico falhar
        }

        // Subscribe para atualizações periódicas em tempo real - DESATIVADO (Atualização Manual)
        /* 
        unsubscribe = service.subscribeToRealtimeUpdates(
          symbol,
          (updatedData) => {
            if (mounted) {
              setData(updatedData);
              console.log('🔄 Dados atualizados em tempo real:', updatedData);
            }
          },
          updateInterval
        );
        */

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        console.error('❌ Erro ao inicializar dados em tempo real:', err.message);
        if (mounted) {
          setError(err.message || 'Erro ao carregar dados em tempo real');
          setIsConnected(false);
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [symbol, updateInterval]);

  // Função para recarregar dados manualmente
  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const service = new TradingViewRealTimeService();
      const realtimeData = await service.fetchCocoaRealTimeData();
      setData(realtimeData);
      setIsConnected(true);
      setError(null);
      return realtimeData;
    } catch (err) {
      const message = err.message || 'Erro ao recarregar dados';
      setError(message);
      setIsConnected(false);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    data,
    historicalData,
    loading,
    error,
    isConnected,
    refresh,
    // Dados formatados para fácil uso
    price: data?.price || 0,
    percentChange: data?.percentChange || 0,
    high: data?.high || 0,
    low: data?.low || 0,
    open: data?.open || 0,
    symbol: data?.symbol || 'CCH25',
    currency: data?.currency || 'USD',
    lastUpdate: data?.timestamp || null,
  };
};

/**
 * Hook para dados de múltiplos contratos (CCH25, CCC2, etc)
 */
export const useMultipleRealTimeData = (symbols = ['CCH25', 'CCC2'], updateInterval = 5000) => {
  const [dataMap, setDataMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const service = new TradingViewRealTimeService();
    let unsubscribes = [];
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        // Buscar dados para cada símbolo
        const initialData = {};
        const errors = [];

        for (const symbol of symbols) {
          try {
            console.log(`📊 Buscando dados para ${symbol}...`);
            const data = await service.fetchCocoaRealTimeData();
            initialData[symbol] = data;
          } catch (err) {
            console.error(`❌ Erro para ${symbol}:`, err.message);
            errors.push({ symbol, error: err.message });
          }
        }

        if (mounted) {
          setDataMap(initialData);
          if (errors.length > 0) {
            setError(`Erros ao carregar alguns símbolos: ${errors.map(e => e.symbol).join(', ')}`);
          }
        }

        // Subscribe para cada símbolo - DESATIVADO (Atualização Manual)
        /*
        for (const symbol of symbols) {
          const unsubscribe = service.subscribeToRealtimeUpdates(
            symbol,
            (updatedData) => {
              if (mounted) {
                setDataMap((prev) => ({
                  ...prev,
                  [symbol]: updatedData,
                }));
              }
            },
            updateInterval
          );
          unsubscribes.push(unsubscribe);
        }
        */

        if (mounted) {
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Erro ao carregar dados');
          setLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      unsubscribes.forEach((unsubscribe) => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols.length, updateInterval]);

  return {
    dataMap,
    loading,
    error,
    getData: (symbol) => dataMap[symbol] || null,
  };
};

export default useRealTimeData;
