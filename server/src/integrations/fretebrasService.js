// Serviço para buscar cotações de frete rodoviário usando API_FRETEBRASIL (repositório maximinocastro/API_FRETEBRASIL)
// Este é um stub: adapte conforme autenticação e endpoints reais do repositório
import axios from 'axios';

const BASE_URL = process.env.FRETEBRAS_API_URL || 'http://localhost:5001'; // ajuste conforme deploy do serviço

/**
 * Busca cotação de frete entre cidades
 * @param {Object} params - { origem, destino, tipoCarga, peso }
 * @returns {Promise<Object>} Cotação de frete
 */
export async function fetchFrete(params = {}) {
  // Exemplo: /cotacao?origem=Ilheus&destino=Vitoria&peso=1000
  const { origem, destino, tipoCarga = 'cacau', peso = 1000 } = params;
  const url = `${BASE_URL}/cotacao?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(destino)}&tipoCarga=${encodeURIComponent(tipoCarga)}&peso=${peso}`;
  try {
    const { data } = await axios.get(url);
    return data;
  } catch (err) {
    throw new Error('Erro ao buscar cotação de frete: ' + err.message);
  }
}
