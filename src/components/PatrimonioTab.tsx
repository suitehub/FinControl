import React, { useState, useMemo } from 'react';
import { PatrimonioAccount, CurrencyType, CurrencyRates, AccountType } from '../types';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Globe, 
  Settings, 
  Banknote, 
  Wallet, 
  CreditCard,
  Edit2,
  Check,
  X,
  Coins,
  ArrowRight
} from 'lucide-react';

interface PatrimonioTabProps {
  accounts: PatrimonioAccount[];
  onAddAccount: (a: Omit<PatrimonioAccount, 'id'>) => void;
  onDeleteAccount: (id: string) => void;
  onUpdateAccountBalance: (id: string, balance: number) => void;
  rates: CurrencyRates;
  onUpdateRates: (rates: CurrencyRates) => void;
  mainCurrency: CurrencyType;
  onChangeMainCurrency: (cur: CurrencyType) => void;
}

export const PatrimonioTab: React.FC<PatrimonioTabProps> = ({
  accounts,
  onAddAccount,
  onDeleteAccount,
  onUpdateAccountBalance,
  rates,
  onUpdateRates,
  mainCurrency,
  onChangeMainCurrency
}) => {
  // Mode selection
  const [editingRates, setEditingRates] = useState(false);
  const [ratesForm, setRatesForm] = useState<CurrencyRates>({ ...rates });

  // Add Account form states
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<AccountType>('corrente');
  const [formBalance, setFormBalance] = useState('');
  const [formCurrency, setFormCurrency] = useState<CurrencyType>('BRL');

  // Edit inline states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const formatCurrencyOnly = (val: number, cur: CurrencyType) => {
    const symbol = cur === 'BRL' ? 'R$' : cur === 'USD' ? 'US$' : cur === 'EUR' ? '€' : 'EGP';
    return `${symbol} ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const convertToMainValue = (value: number, from: CurrencyType): number => {
    if (from === mainCurrency) return value;
    // convert from "from" to BRL
    const rateToBRL = rates[from] || 1;
    const valBRL = value * rateToBRL;
    // convert from BRL to main currency
    const rateToMain = rates[mainCurrency] || 1;
    return valBRL / rateToMain;
  };

  // Conversions for rates display (how much of from to get 1 BRL)
  const totalWealthMain = useMemo(() => {
    return accounts.reduce((acc, accnt) => acc + convertToMainValue(accnt.balance, accnt.currency), 0);
  }, [accounts, mainCurrency, rates]);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const bal = parseFloat(formBalance);
    if (!formName || isNaN(bal)) return;

    onAddAccount({
      name: formName,
      type: formType,
      balance: bal,
      currency: formCurrency
    });

    setFormName('');
    setFormBalance('');
  };

  const handleSaveRates = () => {
    onUpdateRates(ratesForm);
    setEditingRates(false);
  };

  const handleEditBalance = (acc: PatrimonioAccount) => {
    setEditingId(acc.id);
    setEditingValue(acc.balance.toString());
  };

  const handleSaveBalance = (id: string) => {
    const val = parseFloat(editingValue);
    if (!isNaN(val)) {
      onUpdateAccountBalance(id, val);
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Portfolio header display with currency selection */}
      <div className="p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-emerald-950 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        
        {/* Subtle grid decor */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="space-y-1 z-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400 font-mono">Consolidado Multimoeda</p>
          <h2 className="text-sm font-medium text-slate-400">Patrimônio Líquido Equivalente</h2>
          <h1 className="text-4xl font-extrabold tracking-tight mt-1 text-emerald-400">
            {formatCurrencyOnly(totalWealthMain, mainCurrency)}
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-1">Soma unificada ponderada pela taxa cambial</p>
        </div>

        {/* Currency Switcher */}
        <div className="z-10 bg-slate-800/60 p-1.5 rounded-2xl border border-slate-700 max-w-sm">
          <p className="text-[10px] text-indigo-300 font-semibold mb-1 px-2.5 uppercase font-mono">Moeda Principal do App</p>
          <div className="flex gap-1">
            {(['BRL', 'USD', 'EUR', 'EGP'] as CurrencyType[]).map((cur, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onChangeMainCurrency(cur)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${mainCurrency === cur ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {cur}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Grid layouts for accounts and currencies controls */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        
        {/* Creation account form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs md:col-span-4 space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="text-indigo-600" size={18} />
            <h3 className="font-semibold text-slate-800">Adicionar Conta / Ativo</h3>
          </div>

          <form onSubmit={handleCreateAccount} className="space-y-4">
            
            {/* Nome */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nome da Conta / Corretora</label>
              <input
                type="text"
                required
                placeholder="Ex: Banco Itaú, Crypto Wallet, Cash..."
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-indigo-500"
              />
            </div>

            {/* Tipo */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tipo de Conta</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as AccountType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500"
              >
                <option value="corrente">Conta Corrente</option>
                <option value="poupança">Conta Poupança / Investimento</option>
                <option value="físico">Dinheiro Físico (Carteira)</option>
                <option value="internacional">Carteira Internacional</option>
              </select>
            </div>

            {/* Saldo Inicial e Moeda */}
            <div className="grid grid-cols-12 gap-2">
              <div className="col-span-8">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Saldo Inicial</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={formBalance}
                  onChange={(e) => setFormBalance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-indigo-500"
                />
              </div>
              
              <div className="col-span-4">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">Moeda</label>
                <select
                  value={formCurrency}
                  onChange={(e) => setFormCurrency(e.target.value as CurrencyType)}
                  className="w-full px-2 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-indigo-500 font-mono font-bold"
                >
                  <option value="BRL">BRL (R$)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="EGP">EGP</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus size={16} /> Cadastrar Nova Conta
            </button>

          </form>

          {/* Quick currencies exchange rate settings card */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1"><Globe size={14} /> Taxas Cambiais (Base BRL)</span>
              <button 
                onClick={() => { setEditingRates(!editingRates); setRatesForm({ ...rates }); }}
                className="text-indigo-600 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <Settings size={12} /> {editingRates ? 'Cancelar' : 'Ajustar'}
              </button>
            </div>

            {editingRates ? (
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400">1 USD em BRL:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white mt-1"
                    value={ratesForm.USD}
                    onChange={(e) => setRatesForm({ ...ratesForm, USD: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400">1 EUR em BRL:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white mt-1"
                    value={ratesForm.EUR}
                    onChange={(e) => setRatesForm({ ...ratesForm, EUR: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400">1 EGP em BRL:</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded bg-white mt-1"
                    value={ratesForm.EGP}
                    onChange={(e) => setRatesForm({ ...ratesForm, EGP: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <button
                  onClick={handleSaveRates}
                  className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  Salvar Novas Taxas
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div>
                  <p className="text-slate-400">USD</p>
                  <p className="font-mono mt-0.5">R$ {rates.USD.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400">EUR</p>
                  <p className="font-mono mt-0.5">R$ {rates.EUR.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-medium">EGP</p>
                  <p className="font-mono mt-0.5">R$ {rates.EGP.toFixed(2)}</p>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Accounts dashboard list */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Contas Cadastradas ({accounts.length})</h3>
            <span className="text-xs text-slate-400 font-mono font-medium">Equivalente convertido</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {accounts.map((acc, index) => {
              const inMainCur = convertToMainValue(acc.balance, acc.currency);
              const isEditing = editingId === acc.id;

              return (
                <div key={index} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-slate-50 rounded-xl text-slate-600 border border-slate-100">
                        {acc.type === 'corrente' ? <CreditCard size={18} /> :
                         acc.type === 'poupança' ? <Coins size={18} /> :
                         acc.type === 'físico' ? <Banknote size={18} /> :
                         <Globe size={18} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm leading-tight">{acc.name}</h4>
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                          {acc.type}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditBalance(acc)}
                        className="p-1 px-1.5 bg-slate-50 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 border border-slate-200 cursor-pointer"
                      >
                        <Edit2 size={11} />
                      </button>
                      <button
                        onClick={() => onDeleteAccount(acc.id)}
                        className="p-1 px-1.5 bg-slate-50 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 border border-slate-200 cursor-pointer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {/* Balance Display/Edit Box */}
                  <div className="mt-5 border-t border-slate-50 pt-3">
                    <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Saldo Líquido</span>
                    
                    {isEditing ? (
                      <div className="flex items-center gap-2 mt-1 bg-slate-50 p-1.5 rounded-xl border border-indigo-200">
                        <span className="text-xs font-mono font-bold text-slate-500">{acc.currency}</span>
                        <input
                          type="number"
                          step="0.01"
                          focus-mode="true"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          className="flex-1 text-sm bg-transparent border-none outline-hidden font-bold pr-1"
                        />
                        <button
                          onClick={() => handleSaveBalance(acc.id)}
                          className="p-1 bg-emerald-500 text-white rounded cursor-pointer"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1 bg-slate-200 text-slate-600 rounded cursor-pointer"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between mt-0.5">
                        <h3 className="text-lg font-black text-slate-800 font-mono">
                          {formatCurrencyOnly(acc.balance, acc.currency)}
                        </h3>
                        {acc.currency !== mainCurrency && (
                          <span className="text-xs font-semibold text-emerald-600 font-mono flex items-center gap-1">
                            <ArrowRight size={10} />
                            {formatCurrencyOnly(inMainCur, mainCurrency)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}

          </div>
        </div>

      </div>

    </div>
  );
};
