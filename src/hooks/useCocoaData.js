import { useState, useEffect } from 'react';
import { getPrices, getProduction, getExports, getWeather, getForecasts } from '../api/supabase';

export const useCocoaData = () => {
  const [prices, setPrices] = useState([]);
  const [production, setProduction] = useState([]);
  const [exports, setExports] = useState([]);
  const [weather, setWeather] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar dados em paralelo
      const [pricesData, productionData, exportsData, weatherData, forecastsData] = await Promise.all([
        getPrices(),
        getProduction(),
        getExports(),
        getWeather(),
        getForecasts(),
      ]);

      setPrices(pricesData || []);
      setProduction(productionData || []);
      setExports(exportsData || []);
      setWeather(weatherData || []);
      setForecasts(forecastsData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err.message || 'Erro ao buscar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // fetchData(); // Removido carregamento automático
    // const interval = setInterval(fetchData, 30000); // Removido intervalo automático
    // return () => clearInterval(interval);
  }, []);

  // Função para obter o preço atual
  const getCurrentPrice = () => {
    if (prices.length === 0) return null;
    return prices[0]; // Primeiro é o mais recente (ORDER BY date DESC)
  };

  // Função para calcular variação percentual
  const getPriceChange = () => {
    if (prices.length < 2) return 0;
    const current = prices[0]?.price || 0;
    const previous = prices[1]?.price || 0;
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Função para obter últimos N preços (para gráfico)
  const getPriceHistory = (limit = 30) => {
    return prices.slice(0, limit).reverse();
  };

  return {
    prices,
    production,
    exports,
    weather,
    forecasts,
    loading,
    error,
    getCurrentPrice,
    getPriceChange,
    getPriceHistory,
    refresh: fetchData,
  };
};

export default useCocoaData;
