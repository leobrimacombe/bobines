'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '../utils/supabase/client'
import { updateThreshold, revertConsumption } from './actions'
import { Search, Plus, Minus, AlertTriangle, History, Calendar, Loader2, TrendingUp, Wallet, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import FilamentCharts from '../components/FilamentCharts'
import Header from '../components/Header'
import SpoolModal from '../components/SpoolModal'
import GroupDetailsModal from '../components/GroupDetailsModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { BrandLogo } from '../components/ui/BrandLogo'

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [groupSettings, setGroupSettings] = useState<any[]>([])
  
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'history' | 'alerte'>('stock')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  
  const [historyRange, setHistoryRange] = useState<'30' | '90' | '180' | '365' | 'all'>('30')
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBobine, setEditingBobine] = useState<any>(null)
  const [prefillData, setPrefillData] = useState<any>(null)
  const [selectedGroupKey, setSelectedGroupKey] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', action: () => {}, isDanger: false })

  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return; }
        setUser(user)

        const { data: spools } = await supabase.from('spools').select('*').eq('archived', false).order('spool_number', { ascending: true })
        setBobines(spools || [])

        const { data: logs } = await supabase.from('consumption_logs').select(`*, spools (price, weight_initial)`).order('created_at', { ascending: false }).limit(500)
        setHistory(logs || [])

        const { data: settings } = await supabase.from('user_settings').select('*').single()
        if (settings) {
            setLowStockThreshold(settings.low_stock_threshold || 200)
        }

        const { data: gSettings } = await supabase.from('group_settings').select('*')
        setGroupSettings(gSettings || [])

    } catch (e) { console.error(e) } finally { setIsLoading(false) }
  }, [router, supabase])

  useEffect(() => { 
    fetchData() 
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) { setTheme(savedTheme); if (savedTheme === 'dark') document.documentElement.classList.add('dark'); }
  }, [fetchData])

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme); localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark'); else document.documentElement.classList.remove('dark');
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); router.push('/login'); }

  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase())) ||
                        (b.spool_number && b.spool_number.toString().includes(search))
    return matchSearch && (filterMaterial === 'Tous' || b.material === filterMaterial)
  })

  // GROUPEMENT DES BOBINES (SKU) + COMPTAGE DES BOBINES COMPLETES
  const groupedSpools = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredBobines.forEach(b => {
        const key = `${b.brand}|${b.material}|${b.color_name}`;
        if (!groups[key]) {
            const setting = groupSettings.find(s => s.brand === b.brand && s.material === b.material && s.color_name === b.color_name);
            groups[key] = {
                key: key,
                brand: b.brand,
                material: b.material,
                color_name: b.color_name,
                color_hex: b.color_hex,
                spools: [],
                totalWeight: 0,
                totalRemaining: 0,
                fullSpoolsCount: 0, // Nouveau compteur !
                minSpools: setting ? setting.min_spools : 1
            };
        }
        groups[key].spools.push(b);
        const remaining = (b.weight_initial || 1000) - (b.weight_used || 0);
        groups[key].totalWeight += (b.weight_initial || 1000);
        groups[key].totalRemaining += remaining;
        
        // Si la bobine n'a jamais été utilisée, on la compte comme "Complète"
        if ((b.weight_used || 0) === 0) {
            groups[key].fullSpoolsCount += 1;
        }
    });

    return groups;
  }, [filteredBobines, groupSettings]);

  // ALERTE SI LE NOMBRE DE BOBINES COMPLETES EST SOUS LE SEUIL
  const groupAlerts = useMemo(() => {
    return Object.values(groupedSpools).filter((g: any) => g.fullSpoolsCount < g.minSpools);
  }, [groupedSpools]);

  const brands = useMemo(() => {
      const b = new Set<string>();
      Object.values(groupedSpools).forEach((g: any) => b.add(g.brand));
      return Array.from(b).sort();
  }, [groupedSpools]);

  const totalValue = bobines.reduce((acc, b) => acc + (b.price || 0), 0);
  const currentMonthCost = useMemo(() => {
    const now = new Date();
    return history.reduce((acc, log) => {
        const d = new Date(log.created_at);
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && log.spools?.price) {
            return acc + (log.spools.price / log.spools.weight_initial) * log.amount;
        }
        return acc;
    }, 0);
  }, [history]);

  const filteredHistory = useMemo(() => {
      if (historyRange === 'all') return history;
      const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - parseInt(historyRange));
      return history.filter(log => new Date(log.created_at) >= cutoff);
  }, [history, historyRange]);

  const handleSettingsSubmit = (formData: FormData) => {
    setConfirmModal({
        isOpen: true,
        title: 'Sauvegarder les réglages ?',
        message: 'Ce seuil global s\'appliquera immédiatement.',
        isDanger: false,
        action: async () => {
            await updateThreshold(formData);
            fetchData();
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    });
  };

  const openAddModal = (groupData: any = null) => {
      setEditingBobine(null);
      setPrefillData(groupData);
      setIsModalOpen(true);
  }

  if (isLoading) return (<div className="min-h-screen bg-[#F5F5F7] dark:bg-black flex items-center justify-center"><Loader2 className="w-10 h-10 text-blue-500 animate-spin" /></div>);
  if (!user) return <div className="bg-[#F5F5F7] dark:bg-black min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] font-sans pb-20 transition-colors duration-300">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} toggleTheme={toggleTheme} handleSignOut={handleSignOut} />

      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-fade">
        {activeTab === 'stock' ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start"><div><p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Valeur Stock</p><p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{totalValue.toFixed(2)} €</p></div><div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500"><Wallet size={20} /></div></div>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start"><div><p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Conso. {new Date().toLocaleString('fr-FR', { month: 'short' })}</p><p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{currentMonthCost.toFixed(2)} €</p></div><div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-500"><TrendingUp size={20} /></div></div>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start"><div><p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Alertes Poids</p><div className="flex items-baseline gap-2"><p className="text-3xl font-semibold text-orange-500 tracking-tight">{bobines.filter(b => (b.weight_initial - (b.weight_used || 0)) < lowStockThreshold).length}</p><span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">{'<'} {lowStockThreshold}g</span></div></div><div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500"><AlertTriangle size={20} /></div></div>
              </div>
              
              {groupAlerts.length > 0 ? (
                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100/50 dark:border-orange-900/30 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-orange-500" />
                        <p className="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wide">Réappro. Conseillé</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {groupAlerts.map((a: any, i) => (
                            <span onClick={() => setSelectedGroupKey(a.key)} key={i} className="bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                                {a.fullSpoolsCount}/{a.minSpools} complètes • {a.brand} {a.material} <span className="text-orange-800 dark:text-orange-100 opacity-80 font-bold ml-1">{a.color_name}</span>
                            </span>
                        ))}
                    </div>
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 text-sm font-medium">Stock Sain</div>
              )}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <button onClick={() => openAddModal(null)} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all w-full md:w-auto hover:bg-gray-900 dark:hover:bg-gray-200 hover:shadow-xl"><Plus size={18} /> Ajouter</button>
              <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} /><input type="text" placeholder="Rechercher (Couleur, Matière, Numéro)..." className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-12 pr-4 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 cursor-pointer focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm focus:shadow-md" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">{['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))].map(m => (<button key={m} onClick={() => setFilterMaterial(m)} className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${filterMaterial === m ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105' : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'}`}>{m}</button>))}</div>
            </div>

            <div className="space-y-12 pb-10">
              {brands.length === 0 && <div className="text-center text-gray-400 mt-10">Aucun résultat.</div>}
              {brands.map(brandName => {
                const brandGroups = Object.values(groupedSpools).filter((g: any) => g.brand === brandName);
                return (
                  <section key={brandName} className="animate-fade">
                    <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3 mb-6">
                        <BrandLogo brand={brandName} className="w-8 h-8" />
                        <h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white uppercase">{brandName}</h2>
                        <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full">{brandGroups.reduce((acc, g) => acc + g.spools.length, 0)} bobines</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {brandGroups.map((group: any) => {
                          const isAlert = group.fullSpoolsCount < group.minSpools; // ALERTE SI MOINS DE BOBINES COMPLETES QUE LE SEUIL
                          return (
                            <div key={group.key} onClick={() => setSelectedGroupKey(group.key)} className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border transition-all duration-300 flex flex-col group/card hover:-translate-y-1 cursor-pointer ${isAlert ? 'border-orange-200 shadow-orange-50 hover:shadow-orange-100' : 'border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm shrink-0" style={{backgroundColor: group.color_hex}} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg dark:text-white leading-tight truncate">{group.material}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">{group.color_name}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-end mt-auto">
                                    <div>
                                        <p className={`text-3xl font-black flex items-baseline gap-1 ${isAlert ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>
                                            {group.spools.length} 
                                            <span className="text-sm font-medium text-gray-400">({group.fullSpoolsCount}/{group.minSpools} neuves)</span>
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Bobines totales</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-blue-500">{group.totalRemaining}g</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Reste Total</p>
                                    </div>
                                </div>
                            </div>
                          )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        ) : activeTab === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-8 animate-fade">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><History className="text-blue-500"/> Vue d'ensemble</h2>
                <div className="relative">
                    <select value={historyRange} onChange={(e) => setHistoryRange(e.target.value as any)} className="appearance-none bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 py-2 pl-4 pr-10 rounded-xl text-sm font-bold cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/20"><option value="30">30 derniers jours</option><option value="90">3 derniers mois</option><option value="180">6 derniers mois</option><option value="365">1 an</option><option value="all">Tout l'historique</option></select>
                    <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                </div>
             </div>
             {filteredHistory.length > 0 && <FilamentCharts logs={filteredHistory} />}
             <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800">
                 <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Détail des consommations</h2>
                 <div className="space-y-3">
                    {filteredHistory.length === 0 ? <p className="text-gray-400 text-center py-10 italic">Aucune donnée sur cette période.</p> : filteredHistory.map(log => (
                        <div key={log.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors hover:shadow-sm">
                            <div className="flex-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{log.spool_name}</p>
                                    <form action={async (f) => { 
                                        if (window.confirm('Annuler cette consommation ? Le poids sera rajouté au stock.')) {
                                            await revertConsumption(f); 
                                            fetchData(); 
                                        }
                                    }}>
                                        <input type="hidden" name="log_id" value={log.id} />
                                        <button type="submit" className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-[10px] font-bold uppercase tracking-wide cursor-pointer border border-red-100 dark:border-red-900/30" title="Annuler (Rembourser)">
                                            <RotateCcw size={12} />
                                            Annuler
                                        </button>
                                    </form>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-lg font-black text-blue-500">-{log.amount}g</span>
                                {log.spools?.price && log.spools?.weight_initial && (
                                    <span className="text-[10px] text-gray-400 font-medium">≈ {((log.spools.price / log.spools.weight_initial) * log.amount).toFixed(2)}€</span>
                                )}
                            </div>
                        </div>
                    ))}
                 </div>
             </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#1C1C1E] p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Réglages</h2>
            <form action={handleSettingsSubmit} className="space-y-8">
              <div className="space-y-6">
                <div><label className="flex justify-between text-sm font-medium mb-4 text-gray-700 dark:text-gray-300"><span>Poids Faible (Global)</span><span className="font-bold text-blue-500">{lowStockThreshold}g</span></label><input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" /></div>
              </div>
              <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all hover:bg-gray-900 hover:shadow-xl">Sauvegarder</button>
            </form>
          </div>
        )}
      </main>

      <SpoolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshData={fetchData} initialData={editingBobine} prefillData={prefillData} />
      
      <GroupDetailsModal 
        isOpen={!!selectedGroupKey} 
        onClose={() => setSelectedGroupKey(null)} 
        group={selectedGroupKey ? groupedSpools[selectedGroupKey] : null} 
        refreshData={fetchData}
        lowStockThreshold={lowStockThreshold}
        onEditSpool={(b: any) => { setEditingBobine(b); setIsModalOpen(true); }}
        onAddSpool={openAddModal}
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
        onConfirm={confirmModal.action} onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} isDanger={confirmModal.isDanger}
      />
    </div>
  )
}