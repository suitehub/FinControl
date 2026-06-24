import React from 'react';
import { Transaction, PatrimonioAccount, Subscription, FixedCost, PlanningGoal, CurrencyRates } from '../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  Church, 
  AlertCircle, 
  CheckCircle, 
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
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
  Legend
} from 'recharts';

interface DashboardTabProps {
  transactions: Transaction[];
  patrimonioAccounts: PatrimonioAccount[];
  subscriptions: Subscription[];
  fixedCosts: FixedCost[];
  planningGoal: PlanningGoal;
  rates: CurrencyRates;
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
  setTab: (tab: string) => void;
  onOpenAddModal: (type: 'income' | 'expense') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  transactions,
  patrimonioAccounts,
  subscriptions,
  fixedCosts,
  planningGoal,
  rates,
  mainCurrency,
  setTab,
  onOpenAddModal
}) => {

  const formatCurrency = (val: number, cur: string = mainCurrency) => {
    const symbol = cur === 'BRL' ? 'R$' : cur === 'USD' ? 'US$' : cur === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Calculations in main currency
  // Converting any amount to Main Currency
  const convertToMain = (value: number, from: string): number => {
    if (from === mainCurrency) return value;
    // convert from "from" currency to BRL
    const rateToBRL = rates[from as keyof CurrencyRates] || 1;
    const valueInBRL = value * rateToBRL;
    // convert from BRL to "mainCurrency"
    const rateToMain = rates[mainCurrency as keyof CurrencyRates] || 1;
    return valueInBRL / rateToMain;
  };

  // Convert BRL value to other currencies if needed
  const convertBRLToCur = (valBRL: number, to: string) => {
    const rateToMain = rates[to as keyof CurrencyRates] || 1;
    return valBRL / rateToMain;
  };

  // Current month (June 2026) and previous month (May 2026) filter
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith('2026-06'));
  const prevMonthTransactions = transactions.filter(t => t.date.startsWith('2026-05'));

  // Receipts and Expenses
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const currentExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const prevIncome = prevMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const prevExpense = prevMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  const currentBalance = currentIncome - currentExpense;
  const prevBalance = prevIncome - prevExpense;

  const percentSaved = currentIncome > 0 ? (currentBalance / currentIncome) * 100 : 0;
  const prevPercentSaved = prevIncome > 0 ? (prevBalance / prevIncome) * 100 : 0;

  // Dízimo calculations: 
  // Dízimo = 10% of each income.
  // "Dízimo já separado?" Checkbox: if true -> Separated, if false -> Pending.
  const currentIncomeList = currentMonthTransactions.filter(t => t.type === 'income');
  const totalDizimoCalculated = currentIncomeList.reduce((acc, t) => acc + (t.value * 0.10), 0);
  const totalDizimoSeparated = currentIncomeList
    .filter(t => t.dizimoSeparado)
    .reduce((acc, t) => acc + (t.value * 0.10), 0);
  const totalDizimoPending = totalDizimoCalculated - totalDizimoSeparated;

  // Patrimonio total consolidado
  const totalPatrimonioConsolidated = patrimonioAccounts.reduce((acc, account) => {
    return acc + convertToMain(account.balance, account.currency);
  }, 0);

  // Indicators Logic
  const indicators: string[] = [];
  
  // Indicator 1: Expense month-over-month
  if (prevExpense > 0) {
    const change = ((currentExpense - prevExpense) / prevExpense) * 100;
    if (change > 0) {
      indicators.push(`Você gastou ${change.toFixed(0)}% a mais do que no mês passado.`);
    } else if (change < 0) {
      indicators.push(`Você reduziu seus gastos em ${Math.abs(change).toFixed(0)}% comparando com o mês anterior.`);
    }
  }

  // Indicator 2: Savings month-over-month
  if (currentBalance > prevBalance) {
    const diff = currentBalance - prevBalance;
    indicators.push(`Você economizou ${formatCurrency(diff)} a mais que no mês anterior!`);
  } else if (currentBalance < prevBalance && prevBalance > 0) {
    const diff = prevBalance - currentBalance;
    indicators.push(`Você economizou ${formatCurrency(diff)} a menos que no mês anterior.`);
  }

  // Indicator 3: Expense to Income Ratio
  if (currentIncome > 0) {
    const ratio = (currentExpense / currentIncome) * 100;
    indicators.push(`Suas despesas representam ${ratio.toFixed(0)}% da sua renda mensal.`);
    if (ratio < 50) {
      indicators.push("Excelente! Você está gastando menos da metade da sua renda. Ótimo progresso!");
    } else if (ratio > 80 && ratio <= 100) {
      indicators.push("Atenção: Suas despesas estão consumindo a maior parte da sua renda (" + ratio.toFixed(0) + "%).");
    } else if (ratio > 100) {
      indicators.push("Alerta crítico: Suas despesas ultrapassaram sua renda este mês!");
    }
  }

  // Indicator 4: Budget status
  const budgetRatio = currentIncome > 0 ? (currentExpense / currentIncome) * 100 : 0;
  if (budgetRatio <= 70 && currentIncome > 0) {
    indicators.push("Você está dentro da meta financeira (alocações controladas) deste mês.");
  } else if (budgetRatio > 90) {
    indicators.push("Você ultrapassou o teto de gastos sugerido para o orçamento saudável.");
  }

  // Default indicators if data is small
  if (indicators.length === 0) {
    indicators.push("Sua saúde financeira está estável. Cadastre mais receitas e despesas para gerar insights detalhados.");
    indicators.push("Dica de hoje: Verifique suas assinaturas recorrentes para identificar gastos fantasmas.");
  }

  // Chart data preparing
  // 1. Gastos por Categoria (Expenses by category)
  const categoryExpensesMap: { [cat: string]: number } = {};
  currentMonthTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpensesMap[t.category] = (categoryExpensesMap[t.category] || 0) + t.value;
    });

  const categoryExpensesData = Object.keys(categoryExpensesMap).map((cat, idx) => ({
    name: cat,
    value: categoryExpensesMap[cat],
    color: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'][idx % 8]
  })).sort((a, b) => b.value - a.value);

  // 2. Entradas x Saídas (Last 2 months)
  const compareData = [
    {
      name: 'Maio/26',
      Receitas: prevIncome,
      Despesas: prevExpense,
    },
    {
      name: 'Junho/26',
      Receitas: currentIncome,
      Despesas: currentExpense,
    },
  ];

  // 3. Distribuição financeira para comparação com as metas sugeridas do usuário
  // Sugestão: 50% Necessidades, 20% Lazer, 10% Reserva, 10% Investimentos, 10% Objetivos
  const totalNeedsSpent = currentMonthTransactions
    .filter(t => t.type === 'expense' && ['Moradia', 'Alimentação', 'Saúde', 'Transporte'].includes(t.category))
    .reduce((acc, t) => acc + t.value, 0);

  const totalLeisureSpent = currentMonthTransactions
    .filter(t => t.type === 'expense' && ['Lazer', 'Viagem'].includes(t.category))
    .reduce((acc, t) => acc + t.value, 0);

  // Let's assume other expenses go into targets
  const totalOtherSpent = currentExpense - totalNeedsSpent - totalLeisureSpent;

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl text-white shadow-md">
        <div>
          <span className="text-emerald-100 text-xs font-semibold tracking-wider uppercase font-mono">Controle Inteligente</span>
          <h1 className="text-3xl font-sans font-semibold tracking-tight mt-1">Olá! Bem-vindo ao FinControl</h1>
          <p className="text-emerald-100/90 mt-1.5 max-w-xl text-sm leading-relaxed">
            Sua planilha, painel de investimentos, controle de dízimos e assistente de IA trabalham juntos para cuidar do seu patrimônio.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            id="fab-income-dash"
            onClick={() => onOpenAddModal('income')}
            className="px-4 py-2.5 bg-white text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all text-sm font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingUp size={16} /> + Entrada
          </button>
          <button 
            id="fab-expense-dash"
            onClick={() => onOpenAddModal('expense')}
            className="px-4 py-2.5 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-950/40 active:scale-95 transition-all text-sm font-medium rounded-xl flex items-center gap-1.5 cursor-pointer"
          >
            <TrendingDown size={16} /> + Saída
          </button>
        </div>
      </div>

      {/* Main Month Summary Cards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Layers size={18} className="text-slate-600" />
          Resumo de Junho 2026
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Recebido</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(currentIncome)}</h3>
              <p className="text-[10px] text-emerald-600 font-medium mt-1 flex items-center gap-0.5">
                {prevIncome > 0 ? (
                  <>
                    <TrendingUp size={10} />
                    {(((currentIncome - prevIncome)/prevIncome)*100).toFixed(0)}% vs maio
                  </>
                ) : 'Este mês'}
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Total Gasto</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(currentExpense)}</h3>
              <p className="text-[10px] text-rose-500 font-medium mt-1">
                Representa {currentIncome > 0 ? ((currentExpense / currentIncome) * 100).toFixed(0) : 0}% da renda
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Saldo / Sobra</p>
              <h3 className={`text-xl font-bold mt-0.5 ${currentBalance >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                {formatCurrency(currentBalance)}
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">
                Economia de {percentSaved.toFixed(0)}% este mês
              </p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4 hover:shadow-md transition-all">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Percent size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Patrimônio Total</p>
              <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(totalPatrimonioConsolidated)}</h3>
              <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                Exibir Detalhamento <ArrowRight size={10} className="cursor-pointer" onClick={() => setTab('patrimonio')} />
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Dízimo Dashboard Snippet */}
      <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        <div className="md:col-span-2 flex items-center gap-3">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
            <Church size={24} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Cálculo de Dízimo do Mês</h3>
            <p className="text-xs text-slate-500">10% automático sobre todas as entradas de Junho.</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <p className="text-[10px] uppercase tracking-wider font-mono text-slate-400">Total Devido</p>
          <p className="text-sm font-bold text-slate-800 mt-1">{formatCurrency(totalDizimoCalculated)}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
          <p className="text-[10px] uppercase tracking-wider font-mono text-emerald-600 font-semibold">Separado / Pago</p>
          <p className="text-sm font-bold text-emerald-700 mt-1 flex items-center justify-center gap-1">
            <CheckCircle size={14} /> {formatCurrency(totalDizimoSeparated)}
          </p>
        </div>
        <div className="bg-amber-100/50 p-3.5 rounded-xl border border-amber-200 text-center">
          <p className="text-[10px] uppercase tracking-wider font-mono text-amber-800 font-semibold">Pendente</p>
          <p className="text-sm font-bold text-amber-800 mt-1 flex items-center justify-center gap-1">
            <AlertCircle size={14} /> {formatCurrency(totalDizimoPending)}
          </p>
        </div>
      </div>

      {/* Dynamic Indicators / Insights Box */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Indicators col */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-5 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-base">
            <Info size={18} className="text-indigo-600" />
            Indicadores Rápidos (Insights)
          </h3>
          
          <div className="space-y-3">
            {indicators.map((indicator, idx) => (
              <div key={idx} className="flex gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600 leading-relaxed font-sans">
                <span className="text-indigo-600 font-semibold mt-0.5">•</span>
                <p>{indicator}</p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <button 
              onClick={() => setTab('ia-chat')}
              className="w-full py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:scale-98 transition-all rounded-xl text-xs font-semibold text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              Consultar Assistente de IA FinControl <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Short Charts col */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-7 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center justify-between">
            <span>Visão de Receitas x Despesas</span>
            <span className="text-xs text-slate-400 font-normal">Comparativo mensal</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={compareData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Category Expenses & Allocation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Category breakdown (saídas) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Gastos por Categoria (Junho)</h3>
            <span className="text-xs text-indigo-600 font-semibold cursor-pointer" onClick={() => setTab('relatorios')}>
              Ver tudo
            </span>
          </div>

          {categoryExpensesData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-1/2 h-44 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpensesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryExpensesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-2">
                {categoryExpensesData.slice(0, 4).map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="font-medium truncate max-w-[100px]">{entry.name}</span>
                    </div>
                    <span className="font-semibold">{formatCurrency(entry.value)}</span>
                  </div>
                ))}
                {categoryExpensesData.length > 4 && (
                  <p className="text-[10px] text-slate-400 italic">E mais {categoryExpensesData.length - 4} categorias...</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic">
              Nenhuma despesa cadastrada em Junho ainda. Use o botão + Saída no topo!
            </div>
          )}
        </div>

        {/* Planning / Goals Preview Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Planejamento Sugerido (50/20)*</h3>
            <span className="text-xs text-indigo-600 font-semibold cursor-pointer" onClick={() => setTab('planejamento')}>
              Configurar Metas
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            Sua distribuição atual baseada nos lançamentos categorizados e metas estipuladas.
          </p>

          <div className="space-y-3.5">
            {/* Needs */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Necessidades (Aluguel, Alimento, Saúde...)</span>
                <span>{currentIncome > 0 ? ((totalNeedsSpent / currentIncome) * 100).toFixed(0) : 0}% / {planningGoal.needs}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full" 
                  style={{ width: `${Math.min(100, currentIncome > 0 ? (totalNeedsSpent / currentIncome) * 100 : 0)}%` }}
                />
              </div>
            </div>

            {/* Leisure */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Lazer e Desejos (Saídas, Viagem...)</span>
                <span>{currentIncome > 0 ? ((totalLeisureSpent / currentIncome) * 100).toFixed(0) : 0}% / {planningGoal.leisure}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-teal-500 rounded-full" 
                  style={{ width: `${Math.min(100, currentIncome > 0 ? (totalLeisureSpent / currentIncome) * 100 : 0)}%` }}
                />
              </div>
            </div>

            {/* Others */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Reserva e Investimentos</span>
                <span>{currentIncome > 0 ? ((totalOtherSpent / currentIncome) * 100).toFixed(0) : 0}% / {(planningGoal.emergency + planningGoal.investments + planningGoal.goals)}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full" 
                  style={{ width: `${Math.min(100, currentIncome > 0 ? (totalOtherSpent / currentIncome) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
