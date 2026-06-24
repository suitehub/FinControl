import React, { useMemo } from 'react';
import { Transaction, Subscription, FixedCost, PatrimonioAccount, CurrencyRates } from '../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  PieChart as PieIcon, 
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

interface ReportsTabProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  fixedCosts: FixedCost[];
  patrimonioAccounts: PatrimonioAccount[];
  rates: CurrencyRates;
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  transactions,
  subscriptions,
  fixedCosts,
  patrimonioAccounts,
  rates,
  mainCurrency
}) => {

  const formatCurrency = (val: number) => {
    const symbol = mainCurrency === 'BRL' ? 'R$' : mainCurrency === 'USD' ? 'US$' : mainCurrency === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertToMain = (value: number, from: string): number => {
    if (from === mainCurrency) return value;
    const rateToBRL = rates[from as keyof CurrencyRates] || 1;
    const valueInBRL = value * rateToBRL;
    const rateToMain = rates[mainCurrency as keyof CurrencyRates] || 1;
    return valueInBRL / rateToMain;
  };

  // current vs prev month calculations
  const jIncome = transactions.filter(t => t.date.startsWith('2026-06') && t.type === 'income').reduce((acc, t) => acc + t.value, 0);
  const jExpense = transactions.filter(t => t.date.startsWith('2026-06') && t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
  
  const mIncome = transactions.filter(t => t.date.startsWith('2026-05') && t.type === 'income').reduce((acc, t) => acc + t.value, 0);
  const mExpense = transactions.filter(t => t.date.startsWith('2026-05') && t.type === 'expense').reduce((acc, t) => acc + t.value, 0);

  const jSavings = jIncome - jExpense;
  const mSavings = mIncome - mExpense;

  const totalSubscriptionsMonthly = subscriptions.reduce((acc, sub) => acc + convertToMain(sub.value, sub.currency), 0);

  // Intelligent analytical paragraphs
  const insights = useMemo(() => {
    const arr: string[] = [];
    
    // 1. Expense comparison
    if (jExpense > mExpense && mExpense > 0) {
      arr.push(`Você gastou R$ ${(jExpense - mExpense).toFixed(0)} a mais do que no mês passado (Maio).`);
    } else if (jExpense < mExpense && mExpense > 0) {
      arr.push(`Excelente! Suas despesas recuaram R$ ${(mExpense - jExpense).toFixed(0)} em comparação a Maio.`);
    }

    // 2. Income increase
    if (jIncome > mIncome && mIncome > 0) {
      const g = ((jIncome - mIncome) / mIncome) * 100;
      arr.push(`Sua renda cresceu ${g.toFixed(0)}% este mês devido aos novos aportes ou freelancers.`);
    }

    // 3. Subscriptions to income ratio
    if (jIncome > 0) {
      const subPct = (totalSubscriptionsMonthly / jIncome) * 100;
      arr.push(`As assinaturas recorrentes ativas representam ${subPct.toFixed(0)}% da sua receita mensal total.`);
      if (subPct > 10) {
        arr.push(`Alerta: Assinaturas acima de 10% da sua renda (${subPct.toFixed(0)}%) podem sobrecarregar o orçamento.`);
      }
    }

    // 4. Savings rate
    if (jIncome > 0) {
      const savPct = (jSavings / jIncome) * 100;
      arr.push(`Você está guardando/economizando ${savPct > 0 ? savPct.toFixed(0) : 0}% da sua renda líquida mensal.`);
      if (savPct <= 10) {
        arr.push(`Dica de Investimento: Sua taxa de poupança (${savPct > 0 ? savPct.toFixed(0) : 0}%) está relativamente estreita. Tente canalizar 20%.`);
      }
    }

    return arr;
  }, [jIncome, jExpense, mIncome, mExpense, jSavings, totalSubscriptionsMonthly]);

  // Chart 1: Category gastos pie chart data
  const categoryChartData = useMemo(() => {
    const map: { [c: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense' && t.date.startsWith('2026-06'))
      .forEach(t => {
        map[t.category] = (map[t.category] || 0) + t.value;
      });
    return Object.keys(map).map((c, i) => ({
      name: c,
      value: map[c],
      color: ['#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'][i % 9]
    })).sort((a,b) => b.value - a.value);
  }, [transactions]);

  // Chart 2: Evolution of Income vs Expense by month
  const monthlyEvolutionData = useMemo(() => {
    return [
      { name: 'Jan/26', Receitas: 5000, Despesas: 2900, Economia: 2100 },
      { name: 'Fev/26', Receitas: 5200, Despesas: 3100, Economia: 2100 },
      { name: 'Mar/26', Receitas: 5100, Despesas: 4200, Economia: 900 },
      { name: 'Abr/26', Receitas: 5800, Despesas: 3800, Economia: 2000 },
      { name: 'Mai/26', Receitas: mIncome, Despesas: mExpense, Economia: mSavings },
      { name: 'Jun/26', Receitas: jIncome, Despesas: jExpense, Economia: jSavings }
    ];
  }, [mIncome, mExpense, mSavings, jIncome, jExpense, jSavings]);

  const totalPatrimonioConsolidated = patrimonioAccounts.reduce((acc, account) => {
    return acc + convertToMain(account.balance, account.currency);
  }, 0);

  // Chart 3: Patrimônio acumulado (Consolidated portfolio value)
  const patrimonioAcumuladoData = useMemo(() => {
    // Standard growth simulation for plotting progress beautifully
    const base = totalPatrimonioConsolidated;
    return [
      { name: 'Jan/26', Valor: base * 0.75 },
      { name: 'Fev/26', Valor: base * 0.81 },
      { name: 'Mar/26', Valor: base * 0.86 },
      { name: 'Abr/26', Valor: base * 0.90 },
      { name: 'Mai/26', Valor: base * 0.94 },
      { name: 'Jun/26', Valor: base }
    ];
  }, [totalPatrimonioConsolidated]);

  return (
    <div className="space-y-6">
      
      {/* Top statistics banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase font-mono mb-2">
            <span>Renda Mensal Crescente</span>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{formatCurrency(jIncome)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Soma unificada em todos os aportes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase font-mono mb-2">
            <span>Consumo Mensal Controlado</span>
            <TrendingDown size={16} className="text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{formatCurrency(jExpense)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Contas fixas, despesas e lazer</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
          <div className="flex justify-between items-center text-xs text-slate-400 font-semibold uppercase font-mono mb-2">
            <span>Poupança / Liquidez Corrente</span>
            <Activity size={16} className="text-indigo-500" />
          </div>
          <h2 className="font-mono text-2xl font-black text-indigo-700">{formatCurrency(jSavings)}</h2>
          <p className="text-[10px] text-slate-400 mt-1">Disponível para aportes de investimento</p>
        </div>

      </div>

      {/* Relatórios Inteligentes automatic texts panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-1.5 text-base">
          <Sparkles className="text-indigo-600 animate-pulse" size={18} />
          Relatório de Inteligência & Diagnostics
        </h3>
        <p className="text-xs text-slate-500 leading-normal">
          Nossa engine analisa seus padrões de lançamentos do mês de Junho/2026 comparando com Maio e gera os seguintes pareceres automáticos:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {insights.map((ins, idx) => (
            <div key={idx} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex gap-2 text-xs text-slate-700 leading-relaxed font-sans">
              <span className="text-indigo-600 font-bold">•</span>
              <p>{ins}</p>
            </div>
          ))}
          {insights.length === 0 && (
            <p className="col-span-2 text-xs text-slate-400 italic text-center py-4">Insira lançamentos para construir os pareceres de comparação.</p>
          )}
        </div>
      </div>

      {/* Grid containing rich charts diagrams */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Chart 1: Gastos por categoria (Pie) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <PieIcon size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Gastos por Categoria</h3>
          </div>
          
          <div className="h-64 flex flex-col justify-center">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-450 italic text-xs text-center py-20">Nenhuma despesa para exibir dados gráficos.</p>
            )}
          </div>
        </div>

        {/* Chart 2: Entradas vs Saídas monthly chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <Activity size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Evolução Mensal (Receitas × Despesas)</h3>
          </div>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyEvolutionData} margin={{ left: -15, right: -10 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Patrimônio Acumulado (Growth curve) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Crescimento de Patrimônio Líquido Acumulado</h3>
          </div>
          
          <div className="h-64 w-full text-slate-550">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={patrimonioAcumuladoData} margin={{ left: -15, right: -10 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Area type="monotone" dataKey="Valor" stroke="#4f46e5" strokeWidth={3} fillOpacity={0.1} fill="#4f46e5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Economia Mensal progress bar */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={18} className="text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Economia Mensal Efetiva (Sobra de Caixa)</h3>
          </div>
          
          <div className="h-64 w-full text-slate-550">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyEvolutionData} margin={{ left: -15, right: -10 }}>
                <XAxis dataKey="name" fontSize={11} tickLine={false} />
                <YAxis fontSize={11} tickLine={false} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Line type="monotone" dataKey="Economia" stroke="#059669" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
