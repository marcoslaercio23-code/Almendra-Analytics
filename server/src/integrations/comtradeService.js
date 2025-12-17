// Serviço para buscar dados da UN Comtrade API
import axios from 'axios';

const BASE_URL = 'https://comtradeapi.un.org/public/v1/preview';
const API_KEY = process.env.UN_COMTRADE_API_KEY || '1c203de08904445e9aeeb744f067fcb3';

/**
 * Busca dados globais de importação/exportação por país, produto, período
 * @param {Object} params - { flowtype, period, reportercode, partnercode, hs }
 * @returns {Promise<Object>} Dados da UN Comtrade
 */
export async function fetchComtrade(params = {}) {
  // Exemplo: /flowtype/1/period/2024/reportercode/76/partnercode/999/hs/1801
  const { flowtype = 1, period = 2024, reportercode = 76, partnercode = 999, hs = '1801' } = params;
  const endpoint = `/flowtype/${flowtype}/period/${period}/reportercode/${reportercode}/partnercode/${partnercode}/hs/${hs}`;
  const url = `${BASE_URL}${endpoint}`;
  try {
    const { data } = await axios.get(url, {
      headers: { 'Ocp-Apim-Subscription-Key': API_KEY }
    });
    return data;
  } catch (err) {
    throw new Error('Erro ao buscar dados do Comtrade: ' + err.message);
  }
}
