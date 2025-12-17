import React, { useMemo, useState } from 'react';

const KG_PER_ARROBA = 14.688; // fator de conversão comumente usado

const formatNumber = (v, decimals = 2) => {
  if (v === null || Number.isNaN(v)) return 'N/A';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
};

const parse = (v) => {
  const n = Number(String(v).replace(/,/g, '.'));
  return Number.isFinite(n) ? n : 0;
};

export default function CalculadoraCacau() {
  const [quantity, setQuantity] = useState(100); // em unidade selecionada
  const [unit, setUnit] = useState('kg'); // kg | arroba
  const [price, setPrice] = useState(15); // preço na moeda selecionada
  const [currency, setCurrency] = useState('BRL'); // BRL | USD
  const [fxRate, setFxRate] = useState(5.0); // USD -> BRL
  const [freightType, setFreightType] = useState('perKg'); // perKg | fixed
  const [freightValue, setFreightValue] = useState(0.5);
  const [taxPercent, setTaxPercent] = useState(2.5);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [spreadPercent, setSpreadPercent] = useState(0.5);
  const [salePrice, setSalePrice] = useState(0); // preço de venda na mesma moeda do preço de compra

  const results = useMemo(() => {
    const qtyKg = unit === 'kg' ? parse(quantity) : parse(quantity) * KG_PER_ARROBA;

    const priceInput = parse(price);
    const rate = currency === 'USD' ? Math.max(parse(fxRate), 0) || 1 : 1; // evita div por zero
    const priceBRL = currency === 'USD' ? priceInput * rate : priceInput;

    const freight = freightType === 'perKg' ? qtyKg * parse(freightValue) : parse(freightValue);
    const base = priceBRL * qtyKg;
    const preTax = base + freight;
    const taxValue = preTax * (parse(taxPercent) / 100 + parse(spreadPercent) / 100);
    const discountValue = preTax * (parse(discountPercent) / 100);
    const total = preTax + taxValue - discountValue;

    const pricePerKg = qtyKg > 0 ? total / qtyKg : 0;
    const pricePerArroba = pricePerKg * KG_PER_ARROBA;
    const breakevenSale = qtyKg > 0 ? total / qtyKg : 0;

    const salePriceInput = parse(salePrice);
    const salePriceBRL = currency === 'USD' ? salePriceInput * rate : salePriceInput;
    const revenue = salePriceInput > 0 ? salePriceBRL * qtyKg : null;
    const margin = revenue !== null ? revenue - total : null;
    const marginPct = revenue !== null && total > 0 ? (margin / total) * 100 : null;

    return {
      qtyKg,
      priceBRL,
      freight,
      base,
      taxValue,
      discountValue,
      total,
      pricePerKg,
      pricePerArroba,
      breakevenSale,
      revenue,
      margin,
      marginPct,
      rate,
    };
  }, [quantity, unit, price, currency, fxRate, freightType, freightValue, taxPercent, discountPercent, spreadPercent, salePrice]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] text-[#F5F5F0] p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#D4AF37]">Calculadora de Compra e Venda de Cacau</h1>
            <p className="text-[#8B7355]">Simule custos, frete, taxas e margem em BRL com conversão opcional USD→BRL.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna de entradas */}
          <div className="lg:col-span-2 bg-[#231A14]/70 border border-[#3E352F] rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold text-[#D4AF37]">Entradas</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[#8B7355]">Quantidade</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    min="0"
                  />
                  <select
                    className="bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="kg">kg</option>
                    <option value="arroba">arroba</option>
                  </select>
                </div>
                <p className="text-xs text-[#8B7355] mt-1">1 arroba ≈ {KG_PER_ARROBA} kg</p>
              </div>

              <div>
                <label className="text-sm text-[#8B7355]">Preço por unidade</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                  />
                  <select
                    className="bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              {currency === 'USD' && (
                <div>
                  <label className="text-sm text-[#8B7355]">FX USD→BRL</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] mt-1"
                    value={fxRate}
                    onChange={(e) => setFxRate(e.target.value)}
                    min="0"
                  />
                  <p className="text-xs text-[#8B7355] mt-1">Usado para converter preço e venda para BRL.</p>
                </div>
              )}

              <div>
                <label className="text-sm text-[#8B7355]">Frete</label>
                <div className="flex gap-2 mt-1">
                  <select
                    className="bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={freightType}
                    onChange={(e) => setFreightType(e.target.value)}
                  >
                    <option value="perKg">por kg</option>
                    <option value="fixed">valor fixo</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37]"
                    value={freightValue}
                    onChange={(e) => setFreightValue(e.target.value)}
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-[#8B7355]">Taxas (% sobre custo+frete)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] mt-1"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm text-[#8B7355]">Spread cambial (% extra)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] mt-1"
                  value={spreadPercent}
                  onChange={(e) => setSpreadPercent(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm text-[#8B7355]">Desconto (% opcional)</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] mt-1"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm text-[#8B7355]">Preço de venda (opcional, mesma moeda)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2 focus:outline-none focus:border-[#D4AF37] mt-1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Coluna de métricas principais */}
          <div className="bg-[#231A14]/70 border border-[#3E352F] rounded-2xl p-5 space-y-4">
            <h2 className="text-xl font-semibold text-[#D4AF37]">Resumo</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#8B7355]">Custo base</span>
                <span className="font-mono">R$ {formatNumber(results.base)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B7355]">Frete</span>
                <span className="font-mono">R$ {formatNumber(results.freight)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B7355]">Taxas + spread</span>
                <span className="font-mono">R$ {formatNumber(results.taxValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8B7355]">Descontos</span>
                <span className="font-mono">R$ {formatNumber(results.discountValue)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold text-[#D4AF37] pt-2 border-t border-[#3E352F]">
                <span>Total em BRL</span>
                <span>R$ {formatNumber(results.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm pt-3">
              <div className="bg-[#1A1512] rounded-lg p-3 border border-[#3E352F]">
                <p className="text-[#8B7355]">Preço médio / kg</p>
                <p className="text-lg font-mono">R$ {formatNumber(results.pricePerKg)}</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-3 border border-[#3E352F]">
                <p className="text-[#8B7355]">Preço médio / arroba</p>
                <p className="text-lg font-mono">R$ {formatNumber(results.pricePerArroba)}</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-3 border border-[#3E352F]">
                <p className="text-[#8B7355]">Breakeven (venda)</p>
                <p className="text-lg font-mono">R$ {formatNumber(results.breakevenSale)}</p>
              </div>
              <div className="bg-[#1A1512] rounded-lg p-3 border border-[#3E352F]">
                <p className="text-[#8B7355]">Qtd total (kg)</p>
                <p className="text-lg font-mono">{formatNumber(results.qtyKg, 3)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Margem e sensibilidade */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-[#231A14]/70 border border-[#3E352F] rounded-2xl p-5">
            <h2 className="text-xl font-semibold text-[#D4AF37] mb-3">Margem (se preço de venda informado)</h2>
            {results.revenue === null ? (
              <p className="text-[#8B7355] text-sm">Informe um preço de venda para ver margem.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                  <p className="text-[#8B7355]">Receita estimada</p>
                  <p className="text-lg font-mono">R$ {formatNumber(results.revenue)}</p>
                </div>
                <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                  <p className="text-[#8B7355]">Lucro</p>
                  <p className={`text-lg font-mono ${results.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    R$ {formatNumber(results.margin)}
                  </p>
                </div>
                <div className="bg-[#1A1512] rounded-lg p-4 border border-[#3E352F]">
                  <p className="text-[#8B7355]">Margem %</p>
                  <p className={`text-lg font-mono ${results.marginPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {results.marginPct === null ? 'N/A' : `${formatNumber(results.marginPct, 2)}%`}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#231A14]/70 border border-[#3E352F] rounded-2xl p-5 text-sm">
            <h2 className="text-lg font-semibold text-[#D4AF37] mb-3">Sensibilidade simples</h2>
            <div className="space-y-2">
              {[ -5, 0, 5 ].map((delta) => {
                const adjPrice = results.priceBRL * (1 + delta / 100);
                const adjTotal = results.qtyKg * adjPrice + results.freight + results.taxValue - results.discountValue; // aproximação simples
                const adjPricePerKg = results.qtyKg > 0 ? adjTotal / results.qtyKg : 0;
                return (
                  <div key={delta} className="flex items-center justify-between bg-[#1A1512] border border-[#3E352F] rounded-lg px-3 py-2">
                    <span className="text-[#8B7355]">Preço {delta > 0 ? `+${delta}%` : `${delta}%`}</span>
                    <span className="font-mono">R$ {formatNumber(adjPricePerKg)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
