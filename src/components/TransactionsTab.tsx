import React, { useState, useMemo } from 'react';
import { Transaction, CurrencyRates } from '../types';
import { 
  Calendar, 
  Tag, 
  Plus, 
  Trash2, 
  Filter, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Database,
  Grid,
  ChevronDown,
  ChevronUp,
  Church,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleDizimo: (id: string) => void;
  rates: CurrencyRates;
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onToggleDizimo,
  rates,
  mainCurrency
}) => {
  // Sub-tabs: 'fluxo' | 'entradas' | 'saidas'
  const [subTab, setSubTab] = useState<'fluxo' | 'entradas' | 'saidas'>('fluxo');
  
  // Spreadsheet filters: 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'
  const [dateFilter, setDateFilter] = useState<'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado'>('mes');
  const [customStartDate, setCustomStartDate] = useState('2026-06-01');
  const [customEndDate, setCustomEndDate] = useState('2026-06-30');

  // Search and Category Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  // Form states for new quick manual transactional entries
  const [formType, setFormType] = useState<'income' | 'expense'>('income');
  const [formDate, setFormDate] = useState('2026-06-21'); // Default to metadata date
  const [formValue, setFormValue] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCat, setFormCat] = useState('Salário');
  const [formDizimo, setFormDizimo] = useState(false);

  const formatCurrency = (val: number) => {
    const symbol = mainCurrency === 'BRL' ? 'R$' : mainCurrency === 'USD' ? 'US$' : mainCurrency === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const categories = useMemo(() => {
    if (formType === 'income') {
      return ['Salário', 'Freelance', 'Comissão', 'PIX Recebido', 'Outros'];
    } else {
      return ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia', 'Educação', 'Viagem', 'Outros'];
    }
  }, [formType]);

  // Adjust default category on form type change
  React.useEffect(() => {
    setFormCat(formType === 'income' ? 'Salário' : 'Alimentação');
  }, [formType]);

  // Filter transactions based on active filters
  const filteredTransactions = useMemo(() => {
    // Sort chronologically to compute standard "Saldo Acumulado" correctly
    const chronological = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate running balance in BRL (or user's display currency)
    let runningBalance = 0;
    const withRunningBalance = chronological.map(t => {
      if (t.type === 'income') {
        runningBalance += t.value;
      } else {
        runningBalance -= t.value;
      }
      return { ...t, runningBalance };
    });

    // Now apply filters on this list
    return withRunningBalance.filter(t => {
      // 1. Tab sub-routing
      if (subTab === 'entradas' && t.type !== 'income') return false;
      if (subTab === 'saidas' && t.type !== 'expense') return false;

      // 2. Search query filter
      if (searchQuery && !t.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;

      // 3. Category filter
      if (selectedCategory !== 'Todas' && t.category !== selectedCategory) return false;

      // 4. Time range filters
      const itemDate = new Date(t.date);
      const referenceDate = new Date('2026-06-21'); // Current local metadata time is June 21 2026

      if (dateFilter === 'hoje') {
        return t.date === '2026-06-21';
      } else if (dateFilter === 'semana') {
        const diffTime = Math.abs(referenceDate.getTime() - itemDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      } else if (dateFilter === 'mes') {
        // Just the month of June 2026
        return t.date.startsWith('2026-06');
      } else if (dateFilter === 'ano') {
        return t.date.startsWith('2026');
      } else if (dateFilter === 'personalizado') {
        return t.date >= customStartDate && t.date <= customEndDate;
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Show newest first in table
  }, [transactions, subTab, dateFilter, customStartDate, customEndDate, searchQuery, selectedCategory]);

  const uniqueCategoriesInPeriod = useMemo(() => {
    const list = transactions.filter(t => {
      if (subTab === 'entradas' && t.type !== 'income') return false;
      if (subTab === 'saidas' && t.type !== 'expense') return false;
      return t.date.startsWith('2026-06');
    });
    const set = new Set(list.map(t => t.category));
    return ['Todas', ...Array.from(set)];
  }, [transactions, subTab]);

  // Calculation summaries
  const totalValueInPeriod = useMemo(() => {
    return filteredTransactions.reduce((acc, t) => acc + t.value, 0);
  }, [filteredTransactions]);

  const averageValueInPeriod = useMemo(() => {
    if (filteredTransactions.length === 0) return 0;
    return totalValueInPeriod / filteredTransactions.length;
  }, [filteredTransactions, totalValueInPeriod]);

  // Inflows Monthly Evolution
  const evolutionChartData = useMemo(() => {
    // Group transactions by month
    const monthlyData: { [m: string]: { income: number; expense: number } } = {
      '01': { income: 0, expense: 0 },
      '02': { income: 0, expense: 0 },
      '03': { income: 0, expense: 0 },
      '04': { income: 0, expense: 0 },
      '05': { income: 3900, expense: 2125 }, // Safe placeholder to ensure clean charts
      '06': { income: 0, expense: 0 },
    };

    transactions.forEach(t => {
      const match = t.date.match(/2026-(\d+)-/);
      if (match) {
        const m = match[1];
        if (monthlyData[m]) {
          if (t.type === 'income') monthlyData[m].income += t.value;
          else monthlyData[m].expense += t.value;
        }
      }
    });

    return Object.keys(monthlyData).map(m => ({
      name: m === '01' ? 'Jan' : m === '02' ? 'Fev' : m === '03' ? 'Mar' : m === '04' ? 'Abr' : m === '05' ? 'Mai' : 'Jun',
      Entradas: monthlyData[m].income,
      Saídas: monthlyData[m].expense,
    }));
  }, [transactions]);

  // Expenses categories with most consuming
  const topSpentCategories = useMemo(() => {
    const map: { [c: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith('2026-06'))
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.value;
      });
    return Object.keys(map).map(c => ({
      category: c,
      value: map[c]
    })).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValue);
    if (isNaN(val) || val <= 0) return;

    onAddTransaction({
      date: formDate,
      description: formDesc || `${formCat} de Rotina`,
      value: val,
      category: formCat,
      type: formType,
      dizimoSeparado: formType === 'income' ? formDizimo : undefined
    });

    setFormValue('');
    setFormDesc('');
    setFormDizimo(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Sub tabs navigation */}
      <div className="flex border-b border-slate-100 bg-slate-50 p-1 rounded-2xl gap-1">
        <button
          onClick={() => { setSubTab('fluxo'); setSelectedCategory('Todas'); }}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${subTab === 'fluxo' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Grid size={15} /> Fluxo Financeiro (Planilha)
        </button>
        <button
          onClick={() => { setSubTab('entradas'); setSelectedCategory('Todas'); }}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${subTab === 'entradas' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowUpCircle size={15} /> Entradas / Receitas
        </button>
        <button
          onClick={() => { setSubTab('saidas'); setSelectedCategory('Todas'); }}
          className={`flex-1 py-3 text-sm font-medium rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${subTab === 'saidas' ? 'bg-white text-rose-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <ArrowDownCircle size={15} /> Saídas / Despesas
        </button>
      </div>

      {subTab === 'fluxo' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* Quick manual log form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="text-indigo-600" size={18} />
              <h3 className="font-semibold text-slate-800">Novo Lançamento Rápido</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type toggle */}
              <div className="flex bg-slate-50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFormType('income')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${formType === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setFormType('expense')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${formType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Saída
                </button>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Data</label>
                <div className="relative">
                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Valor</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0,00"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Trabalho PJ, Almoço..."
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Categoria</label>
                <div className="relative">
                  <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <select
                    value={formCat}
                    onChange={(e) => setFormCat(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500"
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 10% Dízimo selection (if Entrada) */}
              {formType === 'income' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium text-amber-800">
                    <span className="flex items-center gap-1"><Church size={14} /> Dízimo Sugerido:</span>
                    <span className="font-bold">
                      {formValue ? formatCurrency(parseFloat(formValue) * 0.10) : 'R$ 0,00'}
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 mt-1">
                    <input
                      type="checkbox"
                      checked={formDizimo}
                      onChange={(e) => setFormDizimo(e.target.checked)}
                      className="rounded border-slate-300 antialiased text-amber-600 focus:ring-amber-500"
                    />
                    Dízimo já separado da entrada?
                  </label>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus size={16} /> Adicionar no Fluxo
              </button>

            </form>
          </div>

          {/* Spreadsheet list table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-8 space-y-4">
            
            {/* Spreadsheet Filters toolbar */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setDateFilter('hoje')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${dateFilter === 'hoje' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Hoje
                  </button>
                  <button
                    onClick={() => setDateFilter('semana')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${dateFilter === 'semana' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Semana
                  </button>
                  <button
                    onClick={() => setDateFilter('mes')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${dateFilter === 'mes' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Mês
                  </button>
                  <button
                    onClick={() => setDateFilter('ano')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${dateFilter === 'ano' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Ano
                  </button>
                  <button
                    onClick={() => setDateFilter('personalizado')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${dateFilter === 'personalizado' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Personalizado
                  </button>
                </div>

                <div className="text-xs text-slate-400 font-medium font-mono">
                  Lançamentos encontrados: {filteredTransactions.length}
                </div>
              </div>

              {/* Personalised Range and Search query */}
              <div className="flex flex-col sm:flex-row gap-3">
                {dateFilter === 'personalizado' && (
                  <div className="flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent focus:outline-hidden"
                    />
                    <span className="text-slate-400">até</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent focus:outline-hidden"
                    />
                  </div>
                )}

                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Pesquisar descrição..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
                  />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-indigo-500"
                  >
                    <option value="Todas">Categorias (Todas)</option>
                    {uniqueCategoriesInPeriod.filter(c => c !== 'Todas').map((cat, idx) => (
                      <option key={idx} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* The core spreadsheet Grid-Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 text-[11px] font-semibold font-mono uppercase tracking-wider">
                    <th className="p-3">Data</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3">Descrição</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Dízimo Separado</th>
                    <th className="p-3 text-right">Saldo Acumulado</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredTransactions.map((item, index) => (
                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-medium whitespace-nowrap">{item.date}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1.5 font-semibold rounded-lg uppercase text-[9px] ${item.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                          {item.type === 'income' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="p-3 font-medium text-slate-600">{item.category}</td>
                      <td className="p-3 font-medium text-slate-900 truncate max-w-xs">{item.description}</td>
                      <td className={`p-3 text-right font-bold ${item.type === 'income' ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.value)}
                      </td>
                      <td className="p-3 text-center">
                        {item.type === 'income' ? (
                          <div className="flex flex-col items-center justify-center gap-1">
                            <input
                              type="checkbox"
                              checked={!!item.dizimoSeparado}
                              onChange={() => onToggleDizimo(item.id)}
                              className="rounded border-slate-300 antialiased text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="text-[9px] text-amber-700 font-medium">10%: {formatCurrency(item.value * 0.1)}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold font-mono text-slate-500 bg-slate-50/50">
                        {formatCurrency(item.runningBalance || 0)}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => onDeleteTransaction(item.id)}
                          className="p-1 px-2 bg-slate-50 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 transition-all cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-10 text-center text-slate-400 italic font-medium">
                        Nenhum lançamento corresponde aos filtros ativos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Overall bottom summary info */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap justify-between gap-4">
              <div className="text-xs text-slate-500">
                Moeda de visualização: <strong className="text-slate-800 font-bold">{mainCurrency}</strong>
              </div>
              <div className="text-right text-xs">
                Soma Filtrada: <strong className="text-indigo-800 font-bold text-sm ml-1">{formatCurrency(totalValueInPeriod)}</strong>
              </div>
            </div>

          </div>

        </div>
      )}

      {subTab === 'entradas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col justify-center py-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Total de Entradas em Junho/26</p>
              <h2 className="text-3xl font-bold text-emerald-700 mt-2">{formatCurrency(totalValueInPeriod)}</h2>
              <p className="text-xs text-slate-500 mt-1">Soma de todas as receitas no período filtrado</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col justify-center py-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Média Mensal Estimada</p>
              <h2 className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(averageValueInPeriod)}</h2>
              <p className="text-xs text-slate-500 mt-1">Calculado por entrada cadastrado</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-widest font-mono mb-3">Entradas por Categoria</h4>
              <div className="space-y-2">
                {uniqueCategoriesInPeriod.filter(c => c !== 'Todas').map((cat, idx) => {
                  const val = filteredTransactions.filter(t => t.category === cat).reduce((sum, t) => sum + t.value, 0);
                  const pct = totalValueInPeriod > 0 ? (val / totalValueInPeriod) * 100 : 0;
                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                        <span>{cat}</span>
                        <span>{pct.toFixed(0)}% ({formatCurrency(val)})</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Evolution Chart */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-semibold text-slate-800 mb-4">Evolução Mensal das Entradas × Saídas</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolutionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                  <Area type="monotone" dataKey="Entradas" stroke="#10b981" fillOpacity={0.1} fill="#10b981" strokeWidth={2} />
                  <Area type="monotone" dataKey="Saídas" stroke="#ef4444" fillOpacity={0.03} fill="#ef4444" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {subTab === 'saidas' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col justify-center py-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Total de Despesas em Junho/26</p>
              <h2 className="text-3xl font-bold text-rose-600 mt-2">{formatCurrency(totalValueInPeriod)}</h2>
              <p className="text-xs text-slate-500 mt-1">Soma de todos os gastos no período filtrado</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs text-center flex flex-col justify-center py-8">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Média Mensal Estimada</p>
              <h2 className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(averageValueInPeriod)}</h2>
              <p className="text-xs text-slate-500 mt-1">Calculado por despesa cadastrada</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
              <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-widest font-mono mb-3">Despesas que mais Consomem</h4>
              <div className="space-y-2.5">
                {topSpentCategories.slice(0, 4).map((item, idx) => {
                  const pct = totalValueInPeriod > 0 ? (item.value / totalValueInPeriod) * 100 : 0;
                  return (
                    <div key={idx} className="text-xs">
                      <div className="flex justify-between font-medium text-slate-600 mb-0.5">
                        <span className="font-semibold text-slate-800">{item.category}</span>
                        <span>{pct.toFixed(0)}% ({formatCurrency(item.value)})</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Bar Chart Categories */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-semibold text-slate-800 mb-4">Despesas por Categoria</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSpentCategories} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {topSpentCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#8b5cf6', '#4f46e5', '#ecc94b', '#ec4899', '#06b6d4', '#64748b'][index % 8]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
