import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { ChatMessage, Transaction, Subscription, FixedCost, PatrimonioAccount, PlanningGoal, CurrencyRates, CurrencyType } from '../types';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RefreshCw, 
  Cpu, 
  HelpCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  FlameKindling
} from 'lucide-react';

interface AIChatTabProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  fixedCosts: FixedCost[];
  patrimonioAccounts: PatrimonioAccount[];
  planningGoal: PlanningGoal;
  rates: CurrencyRates;
  mainCurrency: CurrencyType;
}

export const AIChatTab: React.FC<AIChatTabProps> = ({
  transactions,
  subscriptions,
  fixedCosts,
  patrimonioAccounts,
  planningGoal,
  rates,
  mainCurrency
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      role: 'assistant',
      content: 'Olá! Sou o seu **FinControl AI**, seu assistente financeiro inteligente portátil. 🔮 \n\nPosso analisar profundamente suas metas, assinaturas, patrimônio acumulado e dar conselhos específicos baseados nas suas transações de **Junho/2026**. \n\nComo posso ajudar você hoje? Clique em um dos atalhos rápidos abaixo ou faça uma pergunta livre!',
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to chat end
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  // Compile active data payload for backend context feeding
  const compileFinancialPayload = () => {
    const curMonthTrans = transactions.filter(t => t.date.startsWith('2026-06'));
    const totalIncome = curMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + t.value, 0);
    const totalExpenses = curMonthTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.value, 0);
    const totalSaved = totalIncome - totalExpenses;
    const percentSaved = totalIncome > 0 ? (totalSaved / totalIncome) * 100 : 0;

    const totalDizimoCalculated = curMonthTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + (t.value * 0.10), 0);
    const totalDizimoSeparated = curMonthTrans.filter(t => t.type === 'income' && t.dizimoSeparado).reduce((acc, t) => acc + (t.value * 0.10), 0);
    const totalDizimoPending = totalDizimoCalculated - totalDizimoSeparated;

    const totalPatri = patrimonioAccounts.reduce((acc, a) => acc + convertToMain(a.balance, a.currency), 0);

    // Calculate actual budget spending categories percentages
    const totalNeedsSpent = curMonthTrans
      .filter(t => t.type === 'expense' && ['Moradia', 'Alimentação', 'Saúde', 'Transporte'].includes(t.category))
      .reduce((acc, t) => acc + t.value, 0);

    const totalLeisureSpent = curMonthTrans
      .filter(t => t.type === 'expense' && ['Lazer', 'Viagem'].includes(t.category))
      .reduce((acc, t) => acc + t.value, 0);

    const otherSpent = totalExpenses - totalNeedsSpent - totalLeisureSpent;

    return {
      currency: mainCurrency,
      totalIncome,
      totalExpenses,
      totalSaved,
      percentSaved,
      totalPatrimonio: totalPatri,
      dizimoPendente: totalDizimoPending,
      dizimoSeparado: totalDizimoSeparated,
      totalSubscriptionsMonthly: subscriptions.reduce((acc, sub) => acc + convertToMain(sub.value, sub.currency), 0),
      totalFixedCosts: fixedCosts.reduce((acc, f) => acc + f.value, 0),
      budgetGoals: {
        needs: planningGoal.needs,
        leisure: planningGoal.leisure,
        emergency: planningGoal.emergency,
        investments: planningGoal.investments,
        goals: planningGoal.goals,
      },
      budgetActuals: {
        needs: totalIncome > 0 ? (totalNeedsSpent / totalIncome) * 100 : 0,
        leisure: totalIncome > 0 ? (totalLeisureSpent / totalIncome) * 100 : 0,
        emergency: totalIncome > 0 ? (otherSpent * 0.3 / totalIncome) * 100 : 0,
        investments: totalIncome > 0 ? (otherSpent * 0.4 / totalIncome) * 100 : 0,
        goals: totalIncome > 0 ? (otherSpent * 0.3 / totalIncome) * 100 : 0,
      },
      patrimonioAccounts,
      subscriptionsList: subscriptions,
      recentTransactions: transactions.slice(0, 10),
      gastosFixosList: fixedCosts
    };
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMsg('');
    setLoading(true);

    try {
      // API call to custom proxy Express (with optional dynamic backend URL for static environments like GitHub Pages)
      const backendUrl = (import.meta as any).env.VITE_BACKEND_URL || '';
      const apiEndpoint = backendUrl ? `${backendUrl.replace(/\/$/, '')}/api/chat` : '/api/chat';

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          financialData: compileFinancialPayload(),
          history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: data.reply || "Desculpe, ocorreu um desvio de comunicação com a IA. Tente enviar novamente.",
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error) {
      console.error('AI chat failed:', error);
      const errResponse: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "Oops! Não consegui conectar ao servidor do Gemini no momento. Verifique se o seu servidor do container está rodando ou se a chave secreta foi configurada nos Secrets do AI Studio.",
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errResponse]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([
      {
        id: 'init-1',
        role: 'assistant',
        content: 'Histórico limpo! Posso realizar novas análises de patrimônio multimoedas e dízimo para você. Faça uma pergunta livre ou pesquise insights!',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Pre-configured suggestive prompts chips
  const suggestivePrompts = [
    { text: "Me dê um diagnóstico geral das minhas finanças", icon: <BrainCircuit size={13} /> },
    { text: "Dicas específicas para cortar gastos com assinaturas", icon: <TrendingUp size={13} /> },
    { text: "Como está minha saúde de dízimo e depósitos?", icon: <FlameKindling size={13} /> },
    { text: "Ajuda para planejar a regra 50/30/20 com minha renda", icon: <Cpu size={13} /> }
  ];

  return (
    <div className="bg-slate-50 border border-slate-100 p-1 md:p-4 rounded-3xl grid grid-cols-1 md:grid-cols-12 gap-5 md:h-[calc(100vh-170px)] h-[580px]">
      
      {/* Sidebar explanation panel context */}
      <div className="hidden md:flex bg-white p-5 rounded-2xl border border-slate-200 shadow-xs md:col-span-4 flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">FinControl AI</h3>
              <p className="text-[10px] text-emerald-600 font-bold font-mono">GEMINI-3.5-FLASH • ONLINE</p>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 text-xs text-slate-600 leading-normal">
            <p className="font-bold text-indigo-900 flex items-center gap-1">
              <MessageSquare size={13} /> O que a IA analisa?
            </p>
            <p>
              Ela lê todo o seu estado local atual: saldos de moedas convertible (Real, Dólar, Euro, Libra), total de receitas, dízimos separados ou pendentes, gastos fixos mensais e o fluxo da planilha de transações de {`Junho de 2026`}.
            </p>
            <p className="text-[10px] text-slate-400 font-mono italic">
              Seus dados financeiros permanecem totalmente locais e privados, sendo transitados criptografados e apenas usados temporariamente para a inferência inteligente.
            </p>
          </div>
        </div>

        <button
          onClick={clearHistory}
          className="w-full py-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1"
        >
          <RefreshCw size={12} /> Limpar Conversa
        </button>
      </div>

      {/* Primary chat workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs col-span-full md:col-span-8 flex flex-col h-full overflow-hidden">
        
        {/* Chat message logs */}
        <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 scrollbar-thin">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`p-2.5 h-9 w-9 rounded-full flex items-center justify-center text-xs shrink-0 ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
              </div>
              
              <div className={`space-y-1`}>
                <div className={`p-3.5 rounded-2xl text-xs leading-relaxed font-sans ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none whitespace-pre-wrap' : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {m.role === 'user' ? (
                    m.content
                  ) : (
                    <div className="markdown-body space-y-2">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  )}
                </div>
                <p className={`text-[9px] text-slate-400 font-mono ${m.role === 'user' ? 'text-right' : ''}`}>{m.timestamp}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="p-2.5 h-9 w-9 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center text-xs animate-spin">
                <Cpu size={14} />
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-500 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                FinControl AI está analisando o seu balanço financeiro...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggestive prompts toolbar */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-1.5 justify-start">
          {suggestivePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p.text)}
              disabled={loading}
              className="px-3 py-1.5 bg-white border border-slate-250 text-slate-600 rounded-xl text-[10px] font-semibold hover:border-indigo-400 hover:text-indigo-700 active:scale-95 transition-all text-left flex items-center gap-1 shadow-2xs cursor-pointer"
            >
              {p.icon} {p.text}
            </button>
          ))}
        </div>

        {/* Input Text Box */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMsg);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              required
              disabled={loading}
              placeholder="Pergunte ao FinControl AI sobre dízimos, economia, alocações..."
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-indigo-500"
            />
            <button
              type="submit"
              disabled={loading || !inputMsg.trim()}
              className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
