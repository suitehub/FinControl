import React, { useState } from 'react';
import { PlanningGoal, Transaction } from '../types';
import { 
  Plus, 
  Sparkles, 
  Sliders, 
  HelpCircle,
  ThumbsUp,
  AlertTriangle,
  Bookmark,
  BadgePercent
} from 'lucide-react';

interface PlanningTabProps {
  goal: PlanningGoal;
  onUpdateGoal: (g: PlanningGoal) => void;
  transactions: Transaction[];
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
}

export const PlanningTab: React.FC<PlanningTabProps> = ({
  goal,
  onUpdateGoal,
  transactions,
  mainCurrency
}) => {
  const [needs, setNeeds] = useState(goal.needs);
  const [leisure, setLeisure] = useState(goal.leisure);
  const [emergency, setEmergency] = useState(goal.emergency);
  const [investments, setInvestments] = useState(goal.investments);
  const [goals, setGoals] = useState(goal.goals);

  const formatCurrency = (val: number) => {
    const symbol = mainCurrency === 'BRL' ? 'R$' : mainCurrency === 'USD' ? 'US$' : mainCurrency === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const totalAllocated = needs + leisure + emergency + investments + goals;

  // Actual calculations for current June 2026 month
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith('2026-06'));
  const currentIncome = currentMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.value, 0);

  const currentExpense = currentMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.value, 0);

  // Classify current expenditures based on category keywords
  const actualNeedsValue = currentMonthTransactions
    .filter(t => t.type === 'expense' && ['Moradia', 'Alimentação', 'Saúde', 'Transporte'].includes(t.category))
    .reduce((acc, t) => acc + t.value, 0);

  const actualLeisureValue = currentMonthTransactions
    .filter(t => t.type === 'expense' && ['Lazer', 'Viagem'].includes(t.category))
    .reduce((acc, t) => acc + t.value, 0);

  // Let's assume other specific expense groups (Educação, Outros) represents Objetivos / Investments
  const actualOtherValue = currentExpense - actualNeedsValue - actualLeisureValue;

  const needsPct = currentIncome > 0 ? (actualNeedsValue / currentIncome) * 100 : 0;
  const leisurePct = currentIncome > 0 ? (actualLeisureValue / currentIncome) * 100 : 0;
  const otherPct = currentIncome > 0 ? (actualOtherValue / currentIncome) * 100 : 0;

  // Comparison feedback warnings list
  const feedbacks = (() => {
    const output: { text: string; status: 'ok' | 'alert' | 'success' }[] = [];
    if (currentIncome === 0) {
      output.push({ text: "Escreva suas primeiras receitas deste mês para analisar as metas.", status: 'alert' });
      return output;
    }

    // Needs check
    if (needsPct > goal.needs) {
      output.push({
        text: `Você gastou ${needsPct.toFixed(0)}% com necessidades essenciais, ultrapassando sua meta sugerida de ${goal.needs}%. Avalie reduzir contas fixas.`,
        status: 'alert'
      });
    } else {
      output.push({
        text: `Parabéns! Seus gastos essenciais estão em ${needsPct.toFixed(0)}%, bem dentro do planejado de ${goal.needs}%.`,
        status: 'success'
      });
    }

    // Leisure check
    if (leisurePct > goal.leisure) {
      output.push({
        text: `Seu lazer ultrapassou a meta definida de ${goal.leisure}% em ${(leisurePct - goal.leisure).toFixed(0)}% este mês. Evite jantares extras no final de semana!`,
        status: 'alert'
      });
    } else {
      output.push({
        text: `Seu lazer está sob controle: representou ${leisurePct.toFixed(0)}% da sua renda (Meta: ${goal.leisure}%).`,
        status: 'success'
      });
    }

    // Savings indicators / Investimentos
    const savingsRatio = ((currentIncome - currentExpense) / currentIncome) * 100;
    const requiredSavingsGoal = goal.emergency + goal.investments + goal.goals;

    if (savingsRatio < requiredSavingsGoal) {
      output.push({
        text: `Atenção: Você investiu / economizou apenas ${savingsRatio > 0 ? savingsRatio.toFixed(0) : 0}% esta competência, que é menor que sua meta global de Reserva/Investimentos (${requiredSavingsGoal}%).`,
        status: 'alert'
      });
    } else {
      output.push({
        text: `SENSACIONAL! Você logrou uma taxa líquida de poupança/investimentos de ${savingsRatio.toFixed(0)}% (Meta acumulada: ${requiredSavingsGoal}%).`,
        status: 'success'
      });
    }

    return output;
  })();

  const handleApplyGoals = () => {
    if (totalAllocated !== 100) return;
    onUpdateGoal({
      needs,
      leisure,
      emergency,
      investments,
      goals
    });
  };

  const handleResetToDefault = () => {
    setNeeds(50);
    setLeisure(20);
    setEmergency(10);
    setInvestments(10);
    setGoals(10);
    onUpdateGoal({
      needs: 50,
      leisure: 20,
      emergency: 10,
      investments: 10,
      goals: 10
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner layout */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-1.5">
            <Sliders className="text-indigo-600" size={20} /> Orçamento Geral Inteligente
          </h2>
          <p className="text-xs text-slate-500 leading-normal max-w-xl">
            Configure suas regras alocativas ideais ou herde o clássico modelo financeiro <strong>50/20/10/10/10</strong> recomendo por especialistas para direcionar seus investimentos.
          </p>
        </div>
        <button
          onClick={handleResetToDefault}
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 cursor-pointer"
        >
          Resetar para o Padrão
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Goals Sliders Controls */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-5 space-y-5">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold text-slate-800 text-sm">Metas de Distribuição</h4>
            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${totalAllocated === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-500 animate-pulse'}`}>
              Soma: {totalAllocated}% {totalAllocated !== 100 && '(Deve ser 100%)'}
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Needs */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Necessidades Essenciais</span>
                <span className="font-mono">{needs}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={needs}
                onChange={(e) => setNeeds(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Aluguel, alimentação ordinária, luz, saúde</span>
            </div>

            {/* Leisure */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Lazer e Desejos Pessoais</span>
                <span className="font-mono">{leisure}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={leisure}
                onChange={(e) => setLeisure(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Jantares, streaming, saídas, viagens</span>
            </div>

            {/* Emergency */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Reserva de Emergência</span>
                <span className="font-mono">{emergency}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={emergency}
                onChange={(e) => setEmergency(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Liquidez imediata e de segurança</span>
            </div>

            {/* Investments */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Investimentos e Bolsa</span>
                <span className="font-mono">{investments}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={investments}
                onChange={(e) => setInvestments(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Fundos, ações, CDB longo prazo</span>
            </div>

            {/* Goals */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                <span>Objetivos Pessoais</span>
                <span className="font-mono">{goals}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={goals}
                onChange={(e) => setGoals(parseInt(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <span className="text-[10px] text-slate-400">Comprar carro, casamento, cursos</span>
            </div>

          </div>

          <button
            onClick={handleApplyGoals}
            disabled={totalAllocated !== 100}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all text-center ${totalAllocated === 100 ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
          >
            Aplicar Minhas Metas
          </button>

        </div>

        {/* Dynamic Comparison feedbacks */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 mb-2">
            <BadgePercent className="text-indigo-600" size={18} />
            <h3 className="font-semibold text-slate-800 text-sm">Feedback Automático e Auditoria</h3>
          </div>

          <p className="text-xs text-slate-500 leading-normal">
            Relatório de aferição em relação aos seus lançamentos registrados para Junho de 2026:
          </p>

          <div className="space-y-3">
            {feedbacks.map((f, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex gap-3 text-xs leading-relaxed ${
                f.status === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                f.status === 'alert' ? 'bg-amber-50 border-amber-150 text-amber-800' :
                'bg-slate-50 border-slate-200 text-slate-600'
              }`}>
                {f.status === 'success' ? <ThumbsUp size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <div>
                  <p className="font-bold mb-0.5">{f.status === 'success' ? 'Progresso Positivo' : 'Alerta de Ajuste'}</p>
                  <p>{f.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Theoretical allocation comparison table */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/50 space-y-2 mt-4 text-xs font-medium">
            <h4 className="font-bold text-slate-700 flex items-center gap-1 mb-1"><HelpCircle size={14} /> Como o sistema classifica estes gastos?</h4>
            <p className="text-slate-500 leading-relaxed font-normal">
              O dízimo e receitas guardadas em contas tipo 'poupança' são computadas como reserva de forma nativa. O Aluguel, Supermercado, Planos de Saúde e Luz vão direto para Necessidades de Sobrevivência. Custos de lazer e saídas no cinema são agregados no Lazer.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
