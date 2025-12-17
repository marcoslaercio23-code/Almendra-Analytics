/**
 * ✅ Certificado de Movimento do Cacau
 *
 * Observação: como a especificação (fórmula/thresholds) não está versionada no repo,
 * este serviço usa um cálculo simples e seguro baseado em variação semanal e volatilidade.
 * Ajuste os pesos/limiares aqui quando você me passar a fórmula oficial.
 */

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const normalized = value.replace('%', '').replace(',', '.').trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * @typedef {Object} MovementCertificate
 * @property {'SEM_MOVIMENTO'|'MOVIMENTO_BAIXO'|'MOVIMENTO_MODERADO'|'MOVIMENTO_FORTE'} status
 * @property {'ALTA'|'QUEDA'|'LATERAL'} direction
 * @property {number} score 0-100
 * @property {string} label
 * @property {string} message
 * @property {Object} metrics
 * @property {number|null} metrics.changePercent7d
 * @property {number|null} metrics.volatilityPercent7d
 * @property {string|null} metrics.zigzagTrend
 * @property {string} generatedAt
 */

/**
 * Calcula o certificado de movimento.
 *
 * Inputs esperados:
 * - changePercent7d: variação percentual em 7 dias (ex: 3.2 significa +3.2%)
 * - volatility7d: volatilidade como fração (ex: 0.012 significa 1.2%)
 * - zigzagTrend: 'ALTA' | 'BAIXA' | 'LATERAL' (opcional)
 *
 * @param {{changePercent7d?: number|string|null, volatility7d?: number|string|null, zigzagTrend?: string|null}} input
 * @returns {MovementCertificate}
 */
export function calculateMovementCertificate(input = {}) {
  const changePercent7d = toNumber(input.changePercent7d);
  const volatility7d = toNumber(input.volatility7d);
  const volatilityPercent7d = volatility7d === null ? null : volatility7d * 100;

  const direction = (() => {
    if (changePercent7d === null) return 'LATERAL';
    if (changePercent7d > 0) return 'ALTA';
    if (changePercent7d < 0) return 'QUEDA';
    return 'LATERAL';
  })();

  const zigzagTrendRaw = typeof input.zigzagTrend === 'string' ? input.zigzagTrend.trim() : null;
  const zigzagTrend = zigzagTrendRaw ? zigzagTrendRaw.toUpperCase() : null;

  const absChange = changePercent7d === null ? 0 : Math.abs(changePercent7d);
  const volPct = volatilityPercent7d === null ? 0 : Math.max(0, volatilityPercent7d);

  // Índice simples (0-100): 80% peso variação semanal, 20% peso volatilidade
  const score = clamp(Math.round(absChange * 8 + volPct * 2), 0, 100);

  // Sem dados ou movimento desprezível
  const hasAnySignal = changePercent7d !== null || volatilityPercent7d !== null || zigzagTrend !== null;
  const isNegligible = absChange < 0.25 && volPct < 0.25;

  const status = (() => {
    if (!hasAnySignal || isNegligible) return 'SEM_MOVIMENTO';
    if (score >= 70) return 'MOVIMENTO_FORTE';
    if (score >= 35) return 'MOVIMENTO_MODERADO';
    return 'MOVIMENTO_BAIXO';
  })();

  const label = (() => {
    if (status === 'SEM_MOVIMENTO') return 'Certificado: Sem movimento';
    if (status === 'MOVIMENTO_FORTE') return 'Certificado: Movimento forte';
    if (status === 'MOVIMENTO_MODERADO') return 'Certificado: Movimento moderado';
    return 'Certificado: Movimento baixo';
  })();

  const message = (() => {
    if (status === 'SEM_MOVIMENTO') return 'Sem variação relevante detectada na semana.';
    if (status === 'MOVIMENTO_FORTE') return 'Movimento semanal forte — atenção a volatilidade e gestão de risco.';
    if (status === 'MOVIMENTO_MODERADO') return 'Movimento semanal moderado — cenário com oportunidade e risco equilibrados.';
    return 'Movimento semanal baixo — mercado com pouca aceleração no curto prazo.';
  })();

  return {
    status,
    direction,
    score,
    label,
    message,
    metrics: {
      changePercent7d,
      volatilityPercent7d,
      zigzagTrend
    },
    generatedAt: new Date().toISOString()
  };
}
