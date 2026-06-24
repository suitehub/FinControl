import React, { useState, useEffect } from 'react';
import { 
  DEFAULT_RATES, 
  INITIAL_TRANSACTIONS, 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_FIXED_COSTS, 
  INITIAL_ACCOUNTS, 
  INITIAL_GOAL 
} from './initialData';
import { 
  Transaction, 
  Subscription, 
  FixedCost, 
  PatrimonioAccount, 
  PlanningGoal, 
  CurrencyRates, 
  CurrencyType 
} from './types';
import { DashboardTab } from './components/DashboardTab';
import { TransactionsTab } from './components/TransactionsTab';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { FixedCostsTab } from './components/FixedCostsTab';
import { PatrimonioTab } from './components/PatrimonioTab';
import { PlanningTab } from './components/PlanningTab';
import { ReportsTab } from './components/ReportsTab';
import { AIChatTab } from './components/AIChatTab';

import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

import { 
  Grid, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  CreditCard, 
  ClipboardList, 
  Wallet, 
  TrendingUp, 
  Sliders, 
  Bot, 
  Menu, 
  X, 
  Plus, 
  User, 
  Calendar,
  AlertCircle,
  LogIn,
  LogOut,
  RefreshCw,
  Loader2
} from 'lucide-react';

export default function App() {
  // --- Firebase Auth & Loading State ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- State variables ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [patrimonioAccounts, setPatrimonioAccounts] = useState<PatrimonioAccount[]>([]);
  const [planningGoal, setPlanningGoal] = useState<PlanningGoal>(INITIAL_GOAL);

  const [rates, setRates] = useState<CurrencyRates>(() => {
    const s = localStorage.getItem('fin_rates');
    return s ? JSON.parse(s) : DEFAULT_RATES;
  });

  const [mainCurrency, setMainCurrency] = useState<CurrencyType>(() => {
    const s = localStorage.getItem('fin_main_currency');
    return (s as CurrencyType) || 'BRL';
  });

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Quick transaction modal trigger
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<'income' | 'expense'>('income');
  
  // Quick Add form fields
  const [modalValue, setModalValue] = useState('');
  const [modalDesc, setModalDesc] = useState('');
  const [modalCat, setModalCat] = useState('Salário');
  const [modalDate, setModalDate] = useState('2026-06-21');
  const [modalDizimo, setModalDizimo] = useState(false);

  // --- Auth state monitor & Silent Shared Login ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setAuthLoading(false);
      } else {
        const email = 'usuario.fincontrol@gmail.com';
        const password = 'fincontrol_secure_pass_2026';
        try {
          const credentials = await signInWithEmailAndPassword(auth, email, password);
          setUser(credentials.user);
        } catch (signInError: any) {
          if (
            signInError.code === 'auth/user-not-found' || 
            signInError.code === 'auth/invalid-credential' ||
            signInError.code === 'auth/user-disabled'
          ) {
            try {
              const credentials = await createUserWithEmailAndPassword(auth, email, password);
              setUser(credentials.user);
            } catch (createError) {
              console.warn('Firebase Auth: Provedor de E-mail/Senha pode estar desativado no console. Usando fallback de usuário local:', createError);
              // Fallback to shared single_user if auth is not allowed or fails
              setUser({ uid: 'single_user', email: 'usuario.fincontrol@gmail.com' } as any);
            }
          } else {
            console.warn('Firebase Auth: Erro de autenticação silenciosa (provedor E-mail/Senha desativado no console?). Usando fallback local:', signInError);
            // Fallback to shared single_user if auth is not allowed or fails
            setUser({ uid: 'single_user', email: 'usuario.fincontrol@gmail.com' } as any);
          }
        } finally {
          setAuthLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Real-time Firestore synchronizer ---
  useEffect(() => {
    if (!user) {
      setTransactions([]);
      setSubscriptions([]);
      setFixedCosts([]);
      setPatrimonioAccounts([]);
      setPlanningGoal(INITIAL_GOAL);
      return;
    }

    // Transactions Subscription
    const qTransactions = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    );
    const unsubTransactions = onSnapshot(qTransactions, (snapshot) => {
      const items: Transaction[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Transaction);
      });
      items.sort((a, b) => b.date.localeCompare(a.date));
      setTransactions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'transactions');
    });

    // Subscriptions Subscription
    const qSubscriptions = query(
      collection(db, 'subscriptions'),
      where('userId', '==', user.uid)
    );
    const unsubSubscriptions = onSnapshot(qSubscriptions, (snapshot) => {
      const items: Subscription[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as Subscription);
      });
      setSubscriptions(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subscriptions');
    });

    // Fixed Costs Subscription
    const qFixedCosts = query(
      collection(db, 'fixedCosts'),
      where('userId', '==', user.uid)
    );
    const unsubFixedCosts = onSnapshot(qFixedCosts, (snapshot) => {
      const items: FixedCost[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as FixedCost);
      });
      setFixedCosts(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fixedCosts');
    });

    // Patrimonio Accounts Subscription
    const qAccounts = query(
      collection(db, 'patrimonioAccounts'),
      where('userId', '==', user.uid)
    );
    const unsubAccounts = onSnapshot(qAccounts, (snapshot) => {
      const items: PatrimonioAccount[] = [];
      snapshot.forEach((doc) => {
        items.push(doc.data() as PatrimonioAccount);
      });
      setPatrimonioAccounts(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patrimonioAccounts');
    });

    // Planning Goals Doc Subscription (document ID = user.uid)
    const unsubPlanningGoal = onSnapshot(doc(db, 'planningGoals', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setPlanningGoal(snapshot.data() as PlanningGoal);
      } else {
        setDoc(doc(db, 'planningGoals', user.uid), {
          ...INITIAL_GOAL,
          userId: user.uid,
        }).catch((err) => {
          handleFirestoreError(err, OperationType.CREATE, `planningGoals/${user.uid}`);
        });
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `planningGoals/${user.uid}`);
    });

    return () => {
      unsubTransactions();
      unsubSubscriptions();
      unsubFixedCosts();
      unsubAccounts();
      unsubPlanningGoal();
    };
  }, [user]);

  // Save localized persistent settings
  useEffect(() => {
    localStorage.setItem('fin_rates', JSON.stringify(rates));
  }, [rates]);

  useEffect(() => {
    localStorage.setItem('fin_main_currency', mainCurrency);
  }, [mainCurrency]);

  // Adjust modal category automatically on type change
  useEffect(() => {
    setModalCat(addModalType === 'income' ? 'Salário' : 'Alimentação');
  }, [addModalType]);

  // --- Firestore Sync Actions ---
  const handleAddTransaction = async (t: Omit<Transaction, 'id'>) => {
    if (!user) return;
    const newId = `t-${Date.now()}`;
    const path = `transactions/${newId}`;
    try {
      await setDoc(doc(db, 'transactions', newId), {
        ...t,
        id: newId,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    const path = `transactions/${id}`;
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleToggleDizimo = async (id: string) => {
    if (!user) return;
    const path = `transactions/${id}`;
    const t = transactions.find(item => item.id === id);
    if (!t) return;
    try {
      await updateDoc(doc(db, 'transactions', id), {
        dizimoSeparado: !t.dizimoSeparado
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleAddSubscription = async (s: Omit<Subscription, 'id'>) => {
    if (!user) return;
    const newId = `sub-${Date.now()}`;
    const path = `subscriptions/${newId}`;
    try {
      await setDoc(doc(db, 'subscriptions', newId), {
        ...s,
        id: newId,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!user) return;
    const path = `subscriptions/${id}`;
    try {
      await deleteDoc(doc(db, 'subscriptions', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddFixedCost = async (f: Omit<FixedCost, 'id'>) => {
    if (!user) return;
    const newId = `fc-${Date.now()}`;
    const path = `fixedCosts/${newId}`;
    try {
      await setDoc(doc(db, 'fixedCosts', newId), {
        ...f,
        id: newId,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteFixedCost = async (id: string) => {
    if (!user) return;
    const path = `fixedCosts/${id}`;
    try {
      await deleteDoc(doc(db, 'fixedCosts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleAddAccount = async (a: Omit<PatrimonioAccount, 'id'>) => {
    if (!user) return;
    const newId = `acc-${Date.now()}`;
    const path = `patrimonioAccounts/${newId}`;
    try {
      await setDoc(doc(db, 'patrimonioAccounts', newId), {
        ...a,
        id: newId,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!user) return;
    const path = `patrimonioAccounts/${id}`;
    try {
      await deleteDoc(doc(db, 'patrimonioAccounts', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleUpdateAccountBalance = async (id: string, balance: number) => {
    if (!user) return;
    const path = `patrimonioAccounts/${id}`;
    try {
      await updateDoc(doc(db, 'patrimonioAccounts', id), {
        balance
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateGoal = async (newGoal: PlanningGoal) => {
    if (!user) return;
    const path = `planningGoals/${user.uid}`;
    try {
      await setDoc(doc(db, 'planningGoals', user.uid), {
        needs: newGoal.needs,
        leisure: newGoal.leisure,
        emergency: newGoal.emergency,
        investments: newGoal.investments,
        goals: newGoal.goals,
        userId: user.uid
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateRates = (newRates: CurrencyRates) => {
    setRates(newRates);
  };

  // FAB Modal submit handler
  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(modalValue);
    if (isNaN(val) || val <= 0) return;

    handleAddTransaction({
      date: modalDate,
      value: val,
      description: modalDesc || `${modalCat} de Lançamento`,
      category: modalCat,
      type: addModalType,
      dizimoSeparado: addModalType === 'income' ? modalDizimo : undefined
    });

    setModalValue('');
    setModalDesc('');
    setModalDizimo(false);
    setIsAddModalOpen(false);
  };

  const openAddModal = (type: 'income' | 'expense') => {
    setAddModalType(type);
    setIsAddModalOpen(true);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-200">
        <Loader2 className="animate-spin text-emerald-400 mb-4" size={40} />
        <p className="text-sm font-semibold tracking-wide font-mono uppercase text-emerald-400/80 animate-pulse">
          Sincronizando Banco de Dados...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans flex flex-col md:flex-row antialiased">
      
      {/* --- DESKTOP SIDEBAR MENU --- */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 select-none p-6 justify-between">
        
        <div className="space-y-6">
          {/* Logo Brand Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500 text-slate-900 rounded-xl shadow-md">
              <TrendingUp size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">FinControl</h1>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Gestor de Ativos</p>
            </div>
          </div>

          {/* Nav Items List */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <Grid size={17} /> Dashboard Principal
            </button>
            
            <button
              onClick={() => setActiveTab('movimentacoes')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'movimentacoes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <ArrowUpCircle size={17} /> Fluxo Financeiro
            </button>

            <button
              onClick={() => setActiveTab('assinaturas')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'assinaturas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <CreditCard size={17} /> Assinaturas Recorrentes
            </button>

            <button
              onClick={() => setActiveTab('gastos-fixos')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'gastos-fixos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <ClipboardList size={17} /> Gastos Fixos
            </button>

            <button
              onClick={() => setActiveTab('patrimonio')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'patrimonio' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <Wallet size={17} /> Patrimônio Líquido
            </button>

            <button
              onClick={() => setActiveTab('relatorios')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'relatorios' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <TrendingUp size={17} /> Relatórios Financeiros
            </button>

            <button
              onClick={() => setActiveTab('planejamento')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'planejamento' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <Sliders size={17} /> Planejamento (50/20)
            </button>

            <button
              onClick={() => setActiveTab('ia-chat')}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold flex items-center gap-3 transition-all cursor-pointer ${activeTab === 'ia-chat' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
            >
              <Bot size={17} /> FinControl AI Assistant
            </button>
          </nav>
        </div>

        {/* Footer Credit */}
        <div className="text-[10px] text-slate-500 font-mono text-center pt-6 border-t border-slate-800/60 leading-normal">
          FinControl Multi-Device v2.4 <br />
          Data Local: 21 de Junho de 2026
        </div>

      </aside>

      {/* --- MOBILE HEADER & HERO NAVIGATION BAR --- */}
      <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between shadow-md shrink-0 sticky top-0 z-40 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500 text-slate-950 rounded-lg">
            <TrendingUp size={16} />
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">FinControl</span>
        </div>
        
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-750 cursor-pointer"
          >
            <Menu size={18} />
          </button>
        </div>
      </header>

      {/* --- MOBILE DRAWER SLIDE-OVER OVERLAY --- */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex justify-end z-50 animate-fade-in select-none">
          {/* Black click-away overlay zone */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className="w-76 max-w-full bg-slate-900 h-full p-6 text-slate-300 flex flex-col justify-between shadow-2xl relative z-10 animate-fade-in border-l border-slate-800/80">
            
            <div className="space-y-6">
              
              {/* Drawer Top Header section */}
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-500 text-slate-900 rounded-lg shadow-sm">
                    <TrendingUp size={16} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-white tracking-tight">FinControl</h2>
                    <p className="text-[8px] text-emerald-400 font-bold uppercase tracking-wider font-mono">Gestor de Ativos</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 bg-slate-850 hover:bg-slate-800 rounded-xl text-slate-450 hover:text-white border border-slate-800 transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Drawer navigation list links */}
              <nav className="space-y-1">
                <button
                  onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Grid size={15} /> Dashboard Principal
                </button>
                
                <button
                  onClick={() => { setActiveTab('movimentacoes'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'movimentacoes' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <ArrowUpCircle size={15} /> Fluxo Financeiro (Tabela)
                </button>

                <button
                  onClick={() => { setActiveTab('assinaturas'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'assinaturas' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <CreditCard size={15} /> Assinaturas Recorrentes
                </button>

                <button
                  onClick={() => { setActiveTab('gastos-fixos'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'gastos-fixos' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <ClipboardList size={15} /> Gastos Fixos
                </button>

                <button
                  onClick={() => { setActiveTab('patrimonio'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'patrimonio' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Wallet size={15} /> Patrimônio Líquido
                </button>

                <button
                  onClick={() => { setActiveTab('relatorios'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'relatorios' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <TrendingUp size={15} /> Relatórios Financeiros
                </button>

                <button
                  onClick={() => { setActiveTab('planejamento'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'planejamento' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Sliders size={15} /> Orçamento e Metas (50/20)
                </button>

                <button
                  onClick={() => { setActiveTab('ia-chat'); setIsMobileMenuOpen(false); }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${activeTab === 'ia-chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'}`}
                >
                  <Bot size={15} /> FinControl AI Assistant
                </button>
              </nav>

            </div>

            <div className="text-[9px] text-slate-500 font-mono text-center pt-4 border-t border-slate-800/60 leading-normal">
              FinControl Mobile v2.4 <br />
              Data: 21 de Junho de 2026
            </div>

          </div>
        </div>
      )}

      {/* --- MAIN PAGE VIEW CONTENT WORKSPACE --- */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pb-28 md:pb-8">
        
        {/* Active view component trigger */}
        {activeTab === 'dashboard' && (
          <DashboardTab
            transactions={transactions}
            patrimonioAccounts={patrimonioAccounts}
            subscriptions={subscriptions}
            fixedCosts={fixedCosts}
            planningGoal={planningGoal}
            rates={rates}
            mainCurrency={mainCurrency}
            setTab={setActiveTab}
            onOpenAddModal={openAddModal}
          />
        )}

        {activeTab === 'movimentacoes' && (
          <TransactionsTab
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onToggleDizimo={handleToggleDizimo}
            rates={rates}
            mainCurrency={mainCurrency}
          />
        )}

        {activeTab === 'assinaturas' && (
          <SubscriptionsTab
            subscriptions={subscriptions}
            onAddSubscription={handleAddSubscription}
            onDeleteSubscription={handleDeleteSubscription}
            rates={rates}
            mainCurrency={mainCurrency}
          />
        )}

        {activeTab === 'gastos-fixos' && (
          <FixedCostsTab
            fixedCosts={fixedCosts}
            onAddFixedCost={handleAddFixedCost}
            onDeleteFixedCost={handleDeleteFixedCost}
            mainCurrency={mainCurrency}
          />
        )}

        {activeTab === 'patrimonio' && (
          <PatrimonioTab
            accounts={patrimonioAccounts}
            onAddAccount={handleAddAccount}
            onDeleteAccount={handleDeleteAccount}
            onUpdateAccountBalance={handleUpdateAccountBalance}
            rates={rates}
            onUpdateRates={handleUpdateRates}
            mainCurrency={mainCurrency}
            onChangeMainCurrency={setMainCurrency}
          />
        )}

        {activeTab === 'relatorios' && (
          <ReportsTab
            transactions={transactions}
            subscriptions={subscriptions}
            fixedCosts={fixedCosts}
            patrimonioAccounts={patrimonioAccounts}
            rates={rates}
            mainCurrency={mainCurrency}
          />
        )}

        {activeTab === 'planejamento' && (
          <PlanningTab
            goal={planningGoal}
            onUpdateGoal={setPlanningGoal}
            transactions={transactions}
            mainCurrency={mainCurrency}
          />
        )}

        {activeTab === 'ia-chat' && (
          <AIChatTab
            transactions={transactions}
            subscriptions={subscriptions}
            fixedCosts={fixedCosts}
            patrimonioAccounts={patrimonioAccounts}
            planningGoal={planningGoal}
            rates={rates}
            mainCurrency={mainCurrency}
          />
        )}

      </main>

      {/* --- MOBILE BANKING STICKY BOTTOM NAVIGATION BAR --- */}
      <footer className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 p-2 py-3 flex justify-around items-center text-slate-400 z-45 select-none shadow-[0_-4px_10px_rgba(0,0,0,0.1)]">
        
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'dashboard' ? 'text-emerald-500 font-extrabold scale-110' : 'text-slate-400'}`}
        >
          <Grid size={18} />
          <span className="text-[8px]">Início</span>
        </button>

        <button
          onClick={() => setActiveTab('movimentacoes')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'movimentacoes' ? 'text-emerald-500 font-extrabold scale-110' : 'text-slate-400'}`}
        >
          <ArrowUpCircle size={18} />
          <span className="text-[8px]">Fluxo</span>
        </button>

        {/* Center floating action button `+` */}
        <div className="relative -mt-6">
          <button
            onClick={() => openAddModal('expense')}
            className="w-13 h-13 bg-emerald-500 text-slate-950 font-bold rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all border-4 border-slate-900 hover:bg-emerald-400 cursor-pointer animate-pulse"
          >
            <Plus size={22} className="stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('ia-chat')}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'ia-chat' ? 'text-indigo-400 font-extrabold scale-110' : 'text-slate-400'}`}
        >
          <Bot size={18} />
          <span className="text-[8px]">IA Chat</span>
        </button>

        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${isMobileMenuOpen ? 'text-emerald-500 font-extrabold scale-110' : 'text-slate-400'}`}
        >
          <Menu size={18} />
          <span className="text-[8px]">Mais</span>
        </button>

      </footer>

      {/* --- GLOBAL QUICK ADD TRANSACTION POPUP DIALOG MODAL --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in select-none">
          
          <div className="bg-white rounded-3xl border border-slate-150 p-6 w-full max-w-md shadow-2xl relative space-y-4">
            
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="space-y-1.5 text-center">
              <h2 className="text-lg font-black text-slate-800">Novo Lançamento Rápido</h2>
              <p className="text-xs text-slate-450">Registre facilmente sua movimentação no fluxo financeiro.</p>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              
              {/* Income vs Expense toggler */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setAddModalType('income')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${addModalType === 'income' ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setAddModalType('expense')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${addModalType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-500'}`}
                >
                  Saída (Despesa)
                </button>
              </div>

              {/* Value Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Valor (Moeda Principal: {mainCurrency})</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">{mainCurrency === 'BRL' ? 'R$' : '$'}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    focus-mode="true"
                    placeholder="0.00"
                    value={modalValue}
                    onChange={(e) => setModalValue(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-base font-black focus:outline-indigo-500"
                  />
                </div>
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Almoço, Uber, Pix..."
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500"
                />
              </div>

              {/* Date & Category side by side */}
              <div className="grid grid-cols-2 gap-3">
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={modalDate}
                    onChange={(e) => setModalDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium focus:outline-indigo-500 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria</label>
                  <select
                    value={modalCat}
                    onChange={(e) => setModalCat(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white"
                  >
                    {addModalType === 'income' ? (
                      ['Salário', 'Freelance', 'Comissão', 'PIX Recebido', 'Outros'].map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))
                    ) : (
                      ['Alimentação', 'Transporte', 'Saúde', 'Lazer', 'Moradia', 'Educação', 'Viagem', 'Outros'].map((c, i) => (
                        <option key={i} value={c}>{c}</option>
                      ))
                    )}
                  </select>
                </div>

              </div>

              {/* Special checkbox for Dízimo (if Income) */}
              {addModalType === 'income' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-amber-800 font-semibold select-none">
                    <input
                      type="checkbox"
                      checked={modalDizimo}
                      onChange={(e) => setModalDizimo(e.target.checked)}
                      className="rounded border-slate-300 antialiased text-amber-600 focus:ring-amber-500"
                    />
                    Dízimo já separado (10%)
                  </label>
                  <span className="text-[10px] text-amber-600 font-mono font-bold">
                    {modalValue ? (parseFloat(modalValue)*0.1).toFixed(2) : '0.00'}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer text-center"
              >
                Confirmar Lançamento
              </button>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}
