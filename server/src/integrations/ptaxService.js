// Serviço para buscar cotações do dólar (PTAX) do Banco Central
import axios from 'axios';

const BASE_URL = 'https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata';

/**
 * Busca cotação do dólar para uma data específica (formato 'MM-DD-YYYY')
 * @param {string} dataCotacao - Data no formato 'MM-DD-YYYY'
 * @returns {Promise<Object>} Cotação do dólar
 */
export async function fetchCotacaoDolarDia(dataCotacao) {
  const url = `${BASE_URL}/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataCotacao}'&$format=json`;
  try {
    const { data } = await axios.get(url);
    return data.value && data.value.length > 0 ? data.value[0] : null;
  } catch (err) {
    throw new Error('Erro ao buscar cotação PTAX: ' + err.message);
  }
}
