import React, { useState, useMemo } from 'react';
import { Subscription, CurrencyType, CurrencyRates } from '../types';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Bell, 
  Sparkles, 
  CreditCard, 
  RefreshCw,
  Coins,
  DollarSign
} from 'lucide-react';

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  onAddSubscription: (s: Omit<Subscription, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  rates: CurrencyRates;
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
}

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  subscriptions,
  onAddSubscription,
  onDeleteSubscription,
  rates,
  mainCurrency
}) => {
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Lazer');
  const [formValue, setFormValue] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyType>('BRL');
  const [formDate, setFormDate] = useState('15');
  const [formAutoRenew, setFormAutoRenew] = useState(true);

  const formatCurrency = (val: number, cur: string = mainCurrency) => {
    const symbol = cur === 'BRL' ? 'R$' : cur === 'USD' ? 'US$' : cur === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertToMain = (value: number, from: string): number => {
    if (from === mainCurrency) return value;
    const rateToBRL = rates[from as keyof CurrencyRates] || 1;
    const valueInBRL = value * rateToBRL;
    const rateToMain = rates[mainCurrency as keyof CurrencyRates] || 1;
    return valueInBRL / rateToMain;
  };

  // Calcs
  const subscriptionsCount = subscriptions.length;

  const totalMonthlyMain = useMemo(() => {
    return subscriptions.reduce((acc, sub) => {
      const convertedValue = convertToMain(sub.value, sub.currency);
      return acc + convertedValue;
    }, 0);
  }, [subscriptions, mainCurrency, rates]);

  const totalAnnualMain = totalMonthlyMain * 12;

  // Alerts logic base on local metadata date: 2026-06-21
  const alerts = useMemo(() => {
    const todayDay = 21; // June 21st, 2026
    const output: string[] = [];

    subscriptions.forEach(sub => {
      const diff = sub.billingDate - todayDay;
      if (diff === 0) {
        output.push(`Sua assinatura do ${sub.name} vence HOJE (${formatCurrency(sub.value, sub.currency)})!`);
      } else if (diff === 1) {
        output.push(`Amanhã será cobrada a assinatura do ${sub.name} (${formatCurrency(sub.value, sub.currency)}).`);
      } else if (diff > 0 && diff <= 5) {
        output.push(`${sub.name} vence em ${diff} dias (Dia ${sub.billingDate}).`);
      } else if (diff < 0) {
        // Next month billing calculation
        const daysToNextMonthBilling = (30 - todayDay) + sub.billingDate;
        if (daysToNextMonthBilling <= 7) {
          output.push(`${sub.name} será cobrado em ${daysToNextMonthBilling} dias (Dia ${sub.billingDate}).`);
        }
      }
    });

    if (output.length === 0) {
      output.push("Nenhuma assinatura tem vencimento nos próximos dias.");
    }

    return output;
  }, [subscriptions, mainCurrency, rates]);

  // Find next billing subscription
  const nextBillingText = useMemo(() => {
    if (subscriptions.length === 0) return 'Indisponível';
    const sorted = [...subscriptions].sort((a, b) => {
      const dayA = a.billingDate >= 21 ? a.billingDate - 21 : (30 - 21) + a.billingDate;
      const dayB = b.billingDate >= 21 ? b.billingDate - 21 : (30 - 21) + b.billingDate;
      return dayA - dayB;
    });
    const nearest = sorted[0];
    return `${nearest.name} (dia ${nearest.billingDate})`;
  }, [subscriptions]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValue);
    const day = parseInt(formDate);

    if (!formName || isNaN(val) || val <= 0 || isNaN(day) || day < 1 || day > 31) return;

    onAddSubscription({
      name: formName,
      category: formCategory,
      value: val,
      currency: formCurrency,
      billingDate: day,
      autoRenew: formAutoRenew
    });

    setFormName('');
    setFormValue('');
    setFormDate('15');
  };

  return (
    <div className="space-y-6">
      
      {/* Cards Panel stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Quantidade</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{subscriptionsCount} Ativas</h3>
            <p className="text-[10px] text-slate-500 mt-1">Serviços recorrentes</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Custo Mensal</p>
            <h3 className="text-xl font-bold text-emerald-700 mt-0.5">{formatCurrency(totalMonthlyMain)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Convertido na moeda principal</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <RefreshCw size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Custo Anual</p>
            <h3 className="text-xl font-bold text-slate-800 mt-0.5">{formatCurrency(totalAnnualMain)}</h3>
            <p className="text-[10px] text-slate-500 mt-1">Consolidação anual estimada</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-xl">
            <Calendar size={24} />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium">Próxima Cobrança</p>
            <h3 className="text-xl font-bold text-rose-600 mt-0.5 truncate max-w-[130px]" title={nextBillingText}>
              {nextBillingText}
            </h3>
            <p className="text-[10px] text-rose-500 mt-1">Mais próximo de vencer</p>
          </div>
        </div>

      </div>

      {/* Warnings & Countdown alerts banner */}
      <div className="bg-indigo-950 text-slate-100 p-5 rounded-2xl border border-indigo-900 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-300">
          <Bell size={16} /> Panel de Alertas de Assinaturas (Hoje é dia 21)
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alerts.map((alert, index) => (
            <div key={index} className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/60 flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <p>{alert}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Form to add */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600 animate-pulse" size={18} />
            <h3 className="font-semibold text-slate-800">Nova Assinatura</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome do Serviço</label>
              <input
                type="text"
                required
                placeholder="Ex: Netflix, Spotify, ChatGPT..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Categoria</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500"
              >
                <option value="Lazer">Lazer / Streaming</option>
                <option value="Trabalho">Trabalho / Produtividade</option>
                <option value="Ferramentas / IA">Ferramentas / IA</option>
                <option value="Design">Design</option>
                <option value="Nuvem">Armazenamento Nuvem</option>
                <option value="Outros">Outras categorias</option>
              </select>
            </div>

            {/* Valor & Moeda combo */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Valor Recorrente</label>
                <div className="relative">
                  <DollarSign size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="29.90"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-indigo-500"
                  />
                </div>
              </div>
              
              <div className="col-span-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Moeda</label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as CurrencyType)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500 font-mono font-semibold"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>
            </div>

            {/* Date billing choice */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dia de Cobrança (Todo mês)</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
              />
            </div>

            {/* Auto-renew switch */}
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 py-1">
              <input
                type="checkbox"
                checked={formAutoRenew}
                onChange={(e) => setFormAutoRenew(e.target.checked)}
                className="rounded border-slate-300 antialiased text-indigo-600 focus:ring-indigo-500"
              />
              Renovação Automática Habilitada
            </label>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Guardar Assinatura
            </button>

          </form>
        </div>

        {/* Dynamic Card List */}
        <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {subscriptions.map((sub, idx) => {
            const valInMainSelected = convertToMain(sub.value, sub.currency);
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden group">
                {/* Visual strip indicator based on category */}
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${
                  sub.category === 'Lazer' ? 'from-indigo-500 to-purple-500' :
                  sub.category === 'Ferramentas / IA' ? 'from-emerald-400 to-teal-500' :
                  'from-amber-400 to-orange-400'
                }`} />

                <div className="flex justify-between items-start pt-1.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider font-mono bg-slate-50 px-2 py-0.5 rounded-md">
                      {sub.category}
                    </span>
                    <h4 className="text-base font-bold text-slate-800 mt-1.5">{sub.name}</h4>
                  </div>
                  <button
                    onClick={() => onDeleteSubscription(sub.id)}
                    className="opacity-100 md:opacity-0 md:group-hover:opacity-100 p-1 px-1.5 bg-slate-50 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-100 transition-all cursor-pointer"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="mt-4 flex justify-between items-end border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Cobrança</p>
                    <p className="text-xs font-semibold text-slate-700 mt-0.5">Todo dia {sub.billingDate}</p>
                  </div>
                  <div className="text-right">
                    {/* Multi-cur label if not display currency */}
                    {sub.currency !== mainCurrency && (
                      <p className="text-[10px] text-slate-400 font-mono">{formatCurrency(sub.value, sub.currency)}</p>
                    )}
                    <p className="text-base font-extrabold text-slate-800">
                      {formatCurrency(valInMainSelected)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-slate-50 p-2 rounded-xl flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Renovação automática:</span>
                  <span className={sub.autoRenew ? "text-emerald-600 font-semibold" : "text-rose-500 font-semibold"}>
                    {sub.autoRenew ? "Ligada" : "Desligada"}
                  </span>
                </div>

              </div>
            );
          })}

          {subscriptions.length === 0 && (
            <div className="col-span-2 bg-slate-50 p-14 rounded-2xl border border-dashed border-slate-200 text-center text-slate-400 italic">
              Nenhuma assinatura pendente no painel de controle. Cadastre sua primeira cobrança mensal acima!
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
