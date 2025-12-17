import { useState } from 'react';
import httpClient from '../api/httpClient';

export function useImportDashboardData() {
  const [importKpi, setImportKpi] = useState({
    totalImport: 0,
    totalExport: 0,
    paises: 0,
    variacao: 0,
    paisesPie: [],
    barData: [],
    loading: false,
    error: null,
  });

  async function fetchImportData(params = { ano: 2024, ncm: '18010000', tipo: 'importacao' }) {
    setImportKpi(k => ({ ...k, loading: true, error: null }));
    try {
      const res = await httpClient.get('/api/import/comexstat', params);
      const data = res.data?.data || {};
      setImportKpi({
        totalImport: data.total ?? 0,
        totalExport: data.totalExport ?? 0,
        paises: data.paises?.length ?? 0,
        variacao: data.variacao ?? 0,
        paisesPie: data.paises ?? [],
        barData: data.meses?.map(m => ({ name: m.mes, Importação: m.importacao, Exportação: m.exportacao })) ?? [],
        loading: false,
        error: null,
      });
    } catch (e) {
      setImportKpi(k => ({ ...k, loading: false, error: e.message }));
    }
  }

  return { ...importKpi, fetchImportData };
}
