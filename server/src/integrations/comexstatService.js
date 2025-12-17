// Serviço para buscar dados da API ComexStat
import axios from 'axios';

const BASE_URL = 'https://api-comexstat.mdic.gov.br';

/**
 * Busca dados de exportação/importação por NCM, ano, país, etc.
 * @param {Object} params - { ano, ncm, tipo, ... }
 * @returns {Promise<Object>} Dados da API ComexStat
 */
export async function fetchComexStat(params = {}) {
  // Exemplo: /pt/comexstat/municipio/exportacao?ano=2024&ncm=18010000
  const { ano = 2024, ncm = '', tipo = 'exportacao', ...rest } = params;
  const endpoint = `/pt/comexstat/municipio/${tipo}`;
  const url = `${BASE_URL}${endpoint}`;
  const query = new URLSearchParams({ ano, ncm, ...rest }).toString();
  try {
    const { data } = await axios.get(`${url}?${query}`);
    return data;
  } catch (err) {
    throw new Error('Erro ao buscar dados do ComexStat: ' + err.message);
  }
}
