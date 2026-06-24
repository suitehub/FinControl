import React, { useState, useMemo } from 'react';
import { FixedCost } from '../types';
import { 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert,
  ClipboardList,
  Sparkles,
  DollarSign
} from 'lucide-react';

interface FixedCostsTabProps {
  fixedCosts: FixedCost[];
  onAddFixedCost: (f: Omit<FixedCost, 'id'>) => void;
  onDeleteFixedCost: (id: string) => void;
  mainCurrency: 'BRL' | 'USD' | 'EUR' | 'EGP';
}

export const FixedCostsTab: React.FC<FixedCostsTabProps> = ({
  fixedCosts,
  onAddFixedCost,
  onDeleteFixedCost,
  mainCurrency
}) => {
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formDueDate, setFormDueDate] = useState('10');
  const [formRequired, setFormRequired] = useState(true);

  const formatCurrency = (val: number) => {
    const symbol = mainCurrency === 'BRL' ? 'R$' : mainCurrency === 'USD' ? 'US$' : mainCurrency === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 1. Calculate Monthly total fixed Costs
  const totalFixedCosts = useMemo(() => {
    return fixedCosts.reduce((acc, f) => acc + f.value, 0);
  }, [fixedCosts]);

  // 2. Count Obligatory vs Optional
  const obligatoryCosts = useMemo(() => {
    return fixedCosts.filter(f => f.required).reduce((acc, f) => acc + f.value, 0);
  }, [fixedCosts]);

  const optionalCosts = totalFixedCosts - obligatoryCosts;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(formValue);
    const date = parseInt(formDueDate);

    if (!formName || isNaN(val) || val <= 0 || isNaN(date) || date < 1 || date > 31) return;

    onAddFixedCost({
      name: formName,
      value: val,
      dueDate: date,
      required: formRequired
    });

    setFormName('');
    setFormValue('');
    setFormDueDate('10');
  };

  return (
    <div className="space-y-6">
      
      {/* Short Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Gastos Fixos Totais</span>
            <h2 className="text-2xl font-black text-slate-800 mt-1">{formatCurrency(totalFixedCosts)}</h2>
            <p className="text-[10px] text-slate-500 mt-1">Soma de todos os compromissos recorrentes</p>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
            <ClipboardList size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Gastos Obrigatórios</span>
            <h2 className="text-2xl font-black text-rose-600 mt-1">{formatCurrency(obligatoryCosts)}</h2>
            <p className="text-[10px] text-slate-500 mt-1">Aluguel, contas essenciais de sobrevivência</p>
          </div>
          <div className="p-4 bg-rose-50 text-rose-500 rounded-2xl">
            <ShieldAlert size={28} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Gastos Opcionais</span>
            <h2 className="text-2xl font-black text-amber-600 mt-1">{formatCurrency(optionalCosts)}</h2>
            <p className="text-[10px] text-slate-500 mt-1">Academia, assinaturas flexíveis, etc</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <Sparkles size={28} />
          </div>
        </div>

      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Creation Box */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-4 space-y-4">
          <div className="flex items-center gap-1.5">
            <Plus className="text-indigo-600" size={18} />
            <h3 className="font-semibold text-slate-800">Cadastrar Gasto Fixo</h3>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome / Serviço</label>
              <input
                type="text"
                required
                placeholder="Ex: Aluguel, IPTU, Escola..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
              />
            </div>

            {/* Valor */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Valor Mensal</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-indigo-500"
                />
              </div>
            </div>

            {/* Vencimento */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Dia de Vencimento</label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
              />
            </div>

            {/* Obrigatório check */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 font-medium">
                <input
                  type="checkbox"
                  checked={formRequired}
                  onChange={(e) => setFormRequired(e.target.checked)}
                  className="rounded border-slate-300 antialiased text-indigo-600 focus:ring-indigo-500"
                />
                Este custo é OBRIGATÓRIO (Essencial)
              </label>
              <p className="text-[10px] text-slate-400 ml-6 leading-normal">
                Custos obrigatórios são essenciais e não podem ser eliminados facilmente em crises financeiras.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Adicionar Custo
            </button>

          </form>
        </div>

        {/* Ledger Table List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-8 space-y-4">
          <h3 className="font-semibold text-slate-800 text-sm">Meus Compromissos Fixos</h3>
          
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] font-semibold font-mono uppercase tracking-wider">
                  <th className="p-3.5">Nome</th>
                  <th className="p-3.5">Tipo</th>
                  <th className="p-3.5 text-center">Dia Vencimento</th>
                  <th className="p-3.5 text-right">Valor</th>
                  <th className="p-3.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {fixedCosts.map((cost, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3.5 font-bold text-slate-800">{cost.name}</td>
                    <td className="p-3.5">
                      {cost.required ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold rounded-lg bg-rose-50 text-rose-600">
                          <ShieldAlert size={12} /> Obrigatório
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
                          Opcional
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-center font-semibold font-mono text-slate-600">Todo dia {cost.dueDate}</td>
                    <td className="p-3.5 text-right font-black text-slate-900">{formatCurrency(cost.value)}</td>
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => onDeleteFixedCost(cost.id)}
                        className="p-1 px-2 bg-slate-50 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
                {fixedCosts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 italic">
                      Nenhum custo fixo cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-500 leading-normal flex items-start gap-2 border border-slate-100">
            <CheckCircle size={15} className="text-emerald-500 shrink-0 mt-0.5" />
            <p>
              O sistema calcula o dízimo e outras alocações sobre suas entradas e automaticamente deduz estes gastos fixos quando computado no menu de relatórios de liquidez financeira do mês.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};
