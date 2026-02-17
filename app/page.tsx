'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '../utils/supabase/client'
// J'ai ajouté 'revertConsumption' dans les imports ci-dessous
import { addSpool, deleteSpool, consumeSpool, updateSpool, updateThreshold, revertConsumption } from './actions'
import { 
  Search, Plus, Trash2, Disc3, LogOut, X, Edit2, 
  Minus, Settings, Package, Euro, AlertTriangle, 
  Check, History, Calendar, Loader2, TrendingUp, Wallet, RotateCcw
} from 'lucide-react' // J'ai ajouté 'RotateCcw' ici
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import FilamentCharts from '../components/FilamentCharts'
import Header from '../components/Header'
import SpoolCard from '../components/SpoolCard'
import SpoolModal from '../components/SpoolModal'
import { BrandLogo } from '../components/ui/BrandLogo'

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'history' | 'alerte'>('stock')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  
  const [historyRange, setHistoryRange] = useState<'30' | '90' | '180' | '365' | 'all'>('30')
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [similarStockThreshold, setSimilarStockThreshold] = useState(2)
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBobine, setEditingBobine] = useState<any>(null)

  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return; }
        setUser(user)

        const { data: spools } = await supabase.from('spools').select('*').order('spool_number', { ascending: true })
        setBobines(spools || [])

        const { data: logs } = await supabase.from('consumption_logs').select(`*, spools (price, weight_initial)`).order('created_at', { ascending: false }).limit(500)
        setHistory(logs || [])

        const { data: settings } = await supabase.from('user_settings').select('*').single()
        if (settings) {
            setLowStockThreshold(settings.low_stock_threshold || 200)
            setSimilarStockThreshold(settings.similar_stock_threshold || 2)
        }
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

  const groupedByBrand = filteredBobines.reduce((acc: any, spool) => {
    const brand = spool.brand || "Inconnu"; if (!acc[brand]) acc[brand] = []; acc[brand].push(spool); return acc;
  }, {});
  const sortedBrands = Object.keys(groupedByBrand).sort();

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

  const similarAlerts = (() => {
    const groups: {[key: string]: number} = {};
    bobines.forEach(b => { groups[`${b.brand}-${b.material}-${b.color_name}`] = (groups[`${b.brand}-${b.material}-${b.color_name}`] || 0) + 1; });
    return Object.entries(groups).filter(([_, count]) => count < similarStockThreshold).map(([key, count]) => {
      const [brand, material, color] = key.split('-'); return { brand, material, color, count };
    });
  })();

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
              {similarAlerts.length > 0 ? (
                <div className="bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100/50 dark:border-orange-900/30 flex flex-col justify-center"><div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-orange-500" /><p className="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wide">Réappro. Conseillé</p></div><div className="flex flex-wrap gap-2">{similarAlerts.map((a, i) => (<span key={i} className="bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">{a.count}x {a.brand} {a.material}</span>))}</div></div>
              ) : (<div className="bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-400 text-sm font-medium">Stock Sain</div>)}
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <button onClick={() => { setEditingBobine(null); setIsModalOpen(true); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all w-full md:w-auto hover:bg-gray-900 dark:hover:bg-gray-200 hover:shadow-xl"><Plus size={18} /> Ajouter</button>
              <div className="relative flex-1 w-full group"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} /><input type="text" placeholder="Rechercher une bobine..." className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-12 pr-4 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 cursor-pointer focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm focus:shadow-md" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">{['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))].map(m => (<button key={m} onClick={() => setFilterMaterial(m)} className={`px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all whitespace-nowrap ${filterMaterial === m ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg scale-105' : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'}`}>{m}</button>))}</div>
            </div>

            <div className="space-y-12 pb-10">
              {sortedBrands.map(brandName => (
                <section key={brandName} className="animate-fade">
                  <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3 mb-6"><BrandLogo brand={brandName} className="w-8 h-8" /><h2 className="text-xl font-bold tracking-tight text-gray-800 dark:text-white uppercase">{brandName}</h2><span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full">{groupedByBrand[brandName].length}</span></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedByBrand[brandName].map((bobine: any) => (
                      <SpoolCard key={bobine.id} bobine={bobine} lowStockThreshold={lowStockThreshold} refreshData={fetchData} onEdit={(b: any) => { setEditingBobine(b); setIsModalOpen(true); }} />
                    ))}
                  </div>
                </section>
              ))}
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
                                <div className="flex items-center gap-3">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{log.spool_name}</p>
                                    
                                    <form action={async (f) => { 
                                        if (window.confirm('Annuler cette consommation ? Le poids sera rajouté au stock.')) {
                                            await revertConsumption(f); 
                                            fetchData(); 
                                        }
                                    }}>
                                        <input type="hidden" name="log_id" value={log.id} />
                                        <button 
                                            type="submit" 
                                            className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-[10px] font-bold uppercase tracking-wide cursor-pointer border border-red-100 dark:border-red-900/30"
                                            title="Annuler et rembourser le poids"
                                        >
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
            <form action={async (f) => { await updateThreshold(f); fetchData(); alert('Sauvegardé !'); }} className="space-y-8">
              <div className="space-y-6">
                <div><label className="flex justify-between text-sm font-medium mb-4 text-gray-700 dark:text-gray-300"><span>Poids Faible</span><span className="font-bold text-blue-500">{lowStockThreshold}g</span></label><input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" /></div>
                <div className="pt-6 border-t dark:border-gray-800"><label className="block text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">Seuil Doublons</label><div className="flex items-center gap-4"><button type="button" onClick={()=>setSimilarStockThreshold(Math.max(1,similarStockThreshold-1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-110 transition-transform"><Minus size={14}/></button><span className="text-xl font-bold w-4 text-center text-gray-900 dark:text-white">{similarStockThreshold}</span><button type="button" onClick={()=>setSimilarStockThreshold(similarStockThreshold+1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-110 transition-transform"><Plus size={14}/></button><input type="hidden" name="similar_threshold" value={similarStockThreshold}/></div></div>
              </div>
              <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all hover:bg-gray-900 hover:shadow-xl">Sauvegarder</button>
            </form>
          </div>
        )}
      </main>

      <SpoolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshData={fetchData} initialData={editingBobine} />
    </div>
  )
}