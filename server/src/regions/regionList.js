/**
 * 📌 Lista de Regiões Produtoras de Cacau
 * Dados completos com coordenadas, país e fontes de dados
 */

export const regions = {
  // ============================================
  // 🇧🇷 BRASIL
  // ============================================
  ilheus: {
    id: 'ilheus',
    name: 'Ilhéus',
    state: 'Bahia',
    country: 'Brasil',
    countryCode: 'BR',
    type: 'BR',
    latitude: -14.7889,
    longitude: -39.0494,
    timezone: 'America/Bahia',
    description: 'Principal polo cacaueiro do sul da Bahia',
    production: 'Alta',
    sources: ['mercadodocacau', 'noticiasagricolas'],
    priceUnit: 'R$/arroba'
  },
  
  itabuna: {
    id: 'itabuna',
    name: 'Itabuna',
    state: 'Bahia',
    country: 'Brasil',
    countryCode: 'BR',
    type: 'BR',
    latitude: -14.7876,
    longitude: -39.2803,
    timezone: 'America/Bahia',
    description: 'Centro comercial do cacau baiano',
    production: 'Alta',
    sources: ['mercadodocacau', 'noticiasagricolas'],
    priceUnit: 'R$/arroba'
  },
  
  bahia: {
    id: 'bahia',
    name: 'Bahia (Estado)',
    state: 'Bahia',
    country: 'Brasil',
    countryCode: 'BR',
    type: 'BR',
    latitude: -13.0000,
    longitude: -41.0000,
    timezone: 'America/Bahia',
    description: 'Média estadual da produção baiana',
    production: 'Muito Alta',
    sources: ['mercadodocacau', 'noticiasagricolas', 'ceplac'],
    priceUnit: 'R$/arroba'
  },
  
  para: {
    id: 'para',
    name: 'Pará',
    state: 'Pará',
    country: 'Brasil',
    countryCode: 'BR',
    type: 'BR',
    latitude: -3.4168,
    longitude: -52.2167,
    timezone: 'America/Belem',
    description: 'Segundo maior produtor brasileiro',
    production: 'Alta',
    sources: ['mercadodocacau', 'noticiasagricolas'],
    priceUnit: 'R$/arroba'
  },
  
  espirito_santo: {
    id: 'espirito_santo',
    name: 'Espírito Santo',
    state: 'Espírito Santo',
    country: 'Brasil',
    countryCode: 'BR',
    type: 'BR',
    latitude: -19.1834,
    longitude: -40.3089,
    timezone: 'America/Sao_Paulo',
    description: 'Produção emergente de cacau fino',
    production: 'Média',
    sources: ['mercadodocacau', 'noticiasagricolas'],
    priceUnit: 'R$/arroba'
  },

  // ============================================
  // 🌍 MUNDO - ÁFRICA
  // ============================================
  costa_do_marfim: {
    id: 'costa_do_marfim',
    name: 'Costa do Marfim',
    state: null,
    country: 'Costa do Marfim',
    countryCode: 'CI',
    type: 'GLOBAL',
    latitude: 6.8276,
    longitude: -5.2893,
    timezone: 'Africa/Abidjan',
    description: 'Maior produtor mundial de cacau (~45% global)',
    production: 'Muito Alta',
    sources: ['icco', 'investing', 'bloomberg'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'moderado',
    notes: 'Instabilidade política histórica, risco de conflitos'
  },
  
  gana: {
    id: 'gana',
    name: 'Gana',
    state: null,
    country: 'Gana',
    countryCode: 'GH',
    type: 'GLOBAL',
    latitude: 6.6111,
    longitude: -1.5647,
    timezone: 'Africa/Accra',
    description: 'Segundo maior produtor mundial (~15% global)',
    production: 'Muito Alta',
    sources: ['icco', 'investing', 'cocobod'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'baixo',
    notes: 'Economia estável, COCOBOD regula mercado'
  },
  
  nigeria: {
    id: 'nigeria',
    name: 'Nigéria',
    state: null,
    country: 'Nigéria',
    countryCode: 'NG',
    type: 'GLOBAL',
    latitude: 7.4951,
    longitude: 4.5418,
    timezone: 'Africa/Lagos',
    description: 'Quarto maior produtor mundial',
    production: 'Alta',
    sources: ['icco', 'investing'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'alto',
    notes: 'Conflitos internos, infraestrutura precária'
  },
  
  camaroes: {
    id: 'camaroes',
    name: 'Camarões',
    state: null,
    country: 'Camarões',
    countryCode: 'CM',
    type: 'GLOBAL',
    latitude: 4.1537,
    longitude: 9.2449,
    timezone: 'Africa/Douala',
    description: 'Quinto maior produtor mundial',
    production: 'Média-Alta',
    sources: ['icco', 'investing'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'moderado',
    notes: 'Conflitos na região anglófona'
  },

  // ============================================
  // 🌍 MUNDO - ÁSIA E AMÉRICAS
  // ============================================
  indonesia: {
    id: 'indonesia',
    name: 'Indonésia',
    state: 'Sulawesi',
    country: 'Indonésia',
    countryCode: 'ID',
    type: 'GLOBAL',
    latitude: -2.5489,
    longitude: 118.0149,
    timezone: 'Asia/Makassar',
    description: 'Terceiro maior produtor mundial',
    production: 'Alta',
    sources: ['icco', 'investing'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'baixo',
    notes: 'Produção concentrada em Sulawesi'
  },
  
  equador: {
    id: 'equador',
    name: 'Equador',
    state: null,
    country: 'Equador',
    countryCode: 'EC',
    type: 'GLOBAL',
    latitude: -1.8312,
    longitude: -79.1836,
    timezone: 'America/Guayaquil',
    description: 'Maior produtor de cacau fino de aroma',
    production: 'Média-Alta',
    sources: ['icco', 'investing', 'anecacao'],
    priceUnit: 'USD/ton',
    geopoliticalRisk: 'moderado',
    notes: 'Famoso pelo cacau Nacional (fino de aroma)'
  }
};

/**
 * Obter região por ID
 */
export function getRegion(id) {
  const normalizedId = id.toLowerCase().replace(/-/g, '_');
  return regions[normalizedId] || null;
}

/**
 * Listar todas as regiões
 */
export function getAllRegions() {
  return Object.values(regions);
}

/**
 * Listar regiões brasileiras
 */
export function getBrazilianRegions() {
  return Object.values(regions).filter(r => r.type === 'BR');
}

/**
 * Listar regiões globais
 */
export function getGlobalRegions() {
  return Object.values(regions).filter(r => r.type === 'GLOBAL');
}

/**
 * Obter região por nome (busca parcial)
 */
export function findRegionByName(name) {
  const search = name.toLowerCase();
  return Object.values(regions).find(r => 
    r.name.toLowerCase().includes(search) ||
    r.id.includes(search)
  );
}

/**
 * Listar IDs de todas as regiões
 */
export function getRegionIds() {
  return Object.keys(regions);
}

export default regions;
