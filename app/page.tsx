'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { createClient } from '../utils/supabase/client'
import { updateSettings, revertConsumption, restoreSpool, hideSpool, hardDeleteSpool } from './actions'
import { Search, Plus, AlertTriangle, History, Calendar, Loader2, TrendingUp, Wallet, RotateCcw, Archive, X, Trash2, Database } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useFormStatus } from 'react-dom'
import FilamentCharts from '../components/FilamentCharts'
import Header from '../components/Header'
import SpoolModal from '../components/SpoolModal'
import GroupDetailsModal from '../components/GroupDetailsModal'
import ConfirmModal from '../components/ui/ConfirmModal'
import { BrandLogo } from '../components/ui/BrandLogo'

const BAMBU_COLORS = [
    { name: 'Blanc ivoire', ref: '11100', hex: '#F5F5DC' }, { name: 'Noir Basic', ref: '10101', hex: '#1A1A1A' },
    { name: 'Blanc os', ref: '11103', hex: '#E3DAC9' }, { name: 'Jaune citron', ref: '11400', hex: '#FFEA00' },
    { name: 'Mandarine', ref: '11300', hex: '#FF8C00' }, { name: 'Rose sakura', ref: '11201', hex: '#FFB7C5' },
    { name: 'Violet lilas', ref: '11700', hex: '#C8A2C8' }, { name: 'Prune', ref: '11204', hex: '#8E4585' },
    { name: 'Rouge écarlate', ref: '11200', hex: '#FF2400' }, { name: 'Rouge foncé', ref: '11202', hex: '#8B0000' },
    { name: 'Vert pomme', ref: '11502', hex: '#8DB600' }, { name: 'Vert herbacé', ref: '11500', hex: '#5CBA35' },
    { name: 'Vert foncé', ref: '11501', hex: '#006400' }, { name: 'Bleu glacier', ref: '11601', hex: '#A5F2F3' },
    { name: 'Bleu ciel', ref: '11603', hex: '#87CEEB' }, { name: 'Bleu marine', ref: '11600', hex: '#000080' },
    { name: 'Bleu foncé', ref: '11602', hex: '#00008B' }, { name: 'Brun clair du désert', ref: '11401', hex: '#D4B895' },
    { name: 'Marron latte', ref: '11800', hex: '#C5A059' }, { name: 'Caramel', ref: '11803', hex: '#C68E17' },
    { name: 'Terre cuite', ref: '11203', hex: '#E2725B' }, { name: 'Marron foncé', ref: '11801', hex: '#5C4033' },
    { name: 'Chocolat noir', ref: '11802', hex: '#3D1C04' }, { name: 'Gris cendré', ref: '11102', hex: '#B2BEB5' },
    { name: 'Gris nardo', ref: '11104', hex: '#808487' }, { name: 'Anthracite', ref: '11101', hex: '#383E42' }
];

function RevertButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="flex items-center gap-1.5 px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-[10px] font-bold uppercase tracking-wide cursor-pointer border border-red-100 dark:border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed" title="Annuler (Rembourser)">
      {pending ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
      {pending ? 'Annulation...' : 'Annuler'}
    </button>
  )
}

function RestoreButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-xs font-bold cursor-pointer border border-blue-100 dark:border-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed" title="Remettre dans le stock">
            {pending ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Restaurer
        </button>
    )
}

function HideButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="w-full flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors text-xs font-bold cursor-pointer border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed" title="Cacher de la liste">
            {pending ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
        </button>
    )
}

function HardDeleteButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors shadow-sm border border-red-100 dark:border-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer" title="Supprimer définitivement de la BDD">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
    )
}

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [archivedSpools, setArchivedSpools] = useState<any[]>([]) 
  const [allArchivedSpools, setAllArchivedSpools] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [groupSettings, setGroupSettings] = useState<any[]>([])
  
  // NOUVEAUX ÉTATS POUR LES PRÉRÉGLAGES
  const [customBrands, setCustomBrands] = useState<string[]>([])
  const [customMaterials, setCustomMaterials] = useState<string[]>([])
  const [customColors, setCustomColors] = useState<{name: string, hex: string}[]>([])

  // ETATS DES INPUTS DE CONFIGURATION
  const [newBrand, setNewBrand] = useState('')
  const [newMaterial, setNewMaterial] = useState('')
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#FF0000')

  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'history' | 'alerte'>('stock')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);
  
  const [historyRange, setHistoryRange] = useState<'30' | '90' | '180' | '365' | 'all'>('30')
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFullHistoryModalOpen, setIsFullHistoryModalOpen] = useState(false)
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

        const { data: allSpools } = await supabase.from('spools').select('*').order('spool_number', { ascending: true })
        if (allSpools) {
            setBobines(allSpools.filter(s => !s.archived))
            setArchivedSpools(allSpools.filter(s => s.archived && !s.is_hidden).sort((a, b) => new Date(b.finished_at || 0).getTime() - new Date(a.finished_at || 0).getTime()))
            setAllArchivedSpools(allSpools.filter(s => s.archived).sort((a, b) => new Date(b.finished_at || 0).getTime() - new Date(a.finished_at || 0).getTime()))
        }

        const { data: logs } = await supabase.from('consumption_logs').select(`*, spools (price, weight_initial)`).order('created_at', { ascending: false }).limit(500)
        setHistory(logs || [])

        // RÉCUPÉRATION DES PARAMÈTRES ET PRÉRÉGLAGES
        const { data: settings } = await supabase.from('user_settings').select('*').single()
        if (settings) {
            setLowStockThreshold(settings.low_stock_threshold || 200)
            setCustomBrands(settings.custom_brands || [])
            setCustomMaterials(settings.custom_materials || [])
            setCustomColors(settings.custom_colors || [])
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

  // FONCTIONS D'AJOUT DES PRÉRÉGLAGES (UI UNIQUEMENT)
  const addBrand = () => { if (newBrand && !customBrands.includes(newBrand)) { setCustomBrands([...customBrands, newBrand]); setNewBrand(''); } }
  const removeBrand = (b: string) => setCustomBrands(customBrands.filter(x => x !== b))
  const addMaterial = () => { if (newMaterial && !customMaterials.includes(newMaterial)) { setCustomMaterials([...customMaterials, newMaterial]); setNewMaterial(''); } }
  const removeMaterial = (m: string) => setCustomMaterials(customMaterials.filter(x => x !== m))
  const addColor = () => { if (newColorName && !customColors.some(c => c.name === newColorName)) { setCustomColors([...customColors, {name: newColorName, hex: newColorHex}]); setNewColorName(''); } }
  const removeColor = (cName: string) => setCustomColors(customColors.filter(x => x.name !== cName))

  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase())) ||
                        (b.spool_number && b.spool_number.toString().includes(search))
    return matchSearch && (filterMaterial === 'Tous' || b.material === filterMaterial)
  })

  const groupedSpools = useMemo(() => {
    const groups: Record<string, any> = {};

    filteredBobines.forEach(b => {
        const key = `${b.brand}|${b.material}|${b.color_name}`;
        if (!groups[key]) {
            const setting = groupSettings.find(s => s.brand === b.brand && s.material === b.material && s.color_name === b.color_name);
            groups[key] = {
                key: key, brand: b.brand, material: b.material, color_name: b.color_name, color_hex: b.color_hex,
                spools: [], totalWeight: 0, totalRemaining: 0, fullSpoolsCount: 0,
                minSpools: setting ? setting.min_spools : 1
            };
        }
        groups[key].spools.push(b);
        groups[key].totalWeight += (b.weight_initial || 1000);
        groups[key].totalRemaining += (b.weight_initial || 1000) - (b.weight_used || 0);
        if ((b.weight_used || 0) === 0) groups[key].fullSpoolsCount += 1;
    });

    return groups;
  }, [filteredBobines, groupSettings]);

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
        isOpen: true, title: 'Sauvegarder les réglages ?', message: 'Ces préréglages et seuils seront appliqués immédiatement.', isDanger: false,
        action: async () => { await updateSettings(formData); fetchData(); setConfirmModal(prev => ({ ...prev, isOpen: false })); }
    });
  };

  const openAddModal = (groupData: any = null) => { setEditingBobine(null); setPrefillData(groupData); setIsModalOpen(true); }

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
                        {groupAlerts.map((a: any, i) => {
                            const isBambu = a.brand?.toLowerCase().includes('bambu');
                            const bambuColor = isBambu ? BAMBU_COLORS.find(c => c.name === a.color_name) : null;
                            const displayColor = bambuColor ? `${a.color_name} #${bambuColor.ref}` : a.color_name;
                            return (
                              <span onClick={() => setSelectedGroupKey(a.key)} key={i} className="bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm cursor-pointer hover:bg-orange-50 transition-colors">
                                  {a.fullSpoolsCount}/{a.minSpools} complètes • {a.brand} {a.material} <span className="text-orange-800 dark:text-orange-100 opacity-80 font-bold ml-1">{displayColor}</span>
                              </span>
                            )
                        })}
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
                          const isAlert = group.fullSpoolsCount < group.minSpools;
                          const isBambu = group.brand?.toLowerCase().includes('bambu');
                          const bambuColor = isBambu ? BAMBU_COLORS.find(c => c.name === group.color_name) : null;
                          const displayColor = bambuColor ? `${group.color_name} #${bambuColor.ref}` : group.color_name;

                          return (
                            <div key={group.key} onClick={() => setSelectedGroupKey(group.key)} className={`bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border transition-all duration-300 flex flex-col group/card hover:-translate-y-1 cursor-pointer ${isAlert ? 'border-orange-200 shadow-orange-50 hover:shadow-orange-100' : 'border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl'}`}>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-800 shadow-sm shrink-0" style={{backgroundColor: group.color_hex}} />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg dark:text-white leading-tight truncate">{group.material}</h3>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">{displayColor}</p>
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
             
             {archivedSpools.length > 0 && (
                <div className="bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Archive className="text-orange-500" /> Bobines terminées
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-500 px-3 py-1.5 rounded-full" title="Valeur totale des bobines terminées affichées">
                                {archivedSpools.reduce((acc, s) => acc + (s.price || 0), 0).toFixed(2)} €
                            </span>
                            <span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1.5 rounded-full">
                                {archivedSpools.length}
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {archivedSpools.map(spool => {
                            const isBambu = spool.brand?.toLowerCase().includes('bambu');
                            const bambuColor = isBambu ? BAMBU_COLORS.find(c => c.name === spool.color_name) : null;
                            const displayColor = bambuColor ? `${spool.color_name} #${bambuColor.ref}` : spool.color_name;

                            return (
                                <div key={spool.id} className="flex flex-col gap-4 p-5 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm shrink-0" style={{backgroundColor: spool.color_hex}} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-sm dark:text-white leading-tight truncate">{spool.brand} {spool.material}</h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate mb-1">{displayColor} <span className="text-gray-400">#{spool.spool_number}</span></p>
                                            
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-[10px] font-medium bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{spool.weight_initial}g</span>
                                                {spool.price > 0 && <span className="text-[10px] font-bold text-blue-500">{spool.price.toFixed(2)} €</span>}
                                                {spool.finished_at && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">Terminée le {new Date(spool.finished_at).toLocaleDateString('fr-FR')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <form action={async (f) => { await restoreSpool(f); fetchData(); }} className="flex-1 flex">
                                            <input type="hidden" name="id" value={spool.id} />
                                            <RestoreButton />
                                        </form>
                                        <form action={async (f) => { await hideSpool(f); fetchData(); }} className="flex">
                                            <input type="hidden" name="id" value={spool.id} />
                                            <HideButton />
                                        </form>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
             )}

             <div className="flex justify-between items-center mb-6 pt-4">
                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white"><History className="text-blue-500"/> Vue d'ensemble des consos</h2>
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
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="font-bold text-sm text-gray-900 dark:text-white">{log.spool_name}</p>
                                    <form action={async (f) => { 
                                        if (window.confirm('Annuler cette consommation ? Le poids sera rajouté au stock.')) {
                                            await revertConsumption(f); fetchData(); 
                                        }
                                    }}>
                                        <input type="hidden" name="log_id" value={log.id} />
                                        <RevertButton />
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

             <div className="flex justify-center pt-8 pb-4">
                <button onClick={() => setIsFullHistoryModalOpen(true)} className="flex items-center gap-2 px-6 py-3.5 bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl font-bold text-sm transition-all border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md hover:-translate-y-0.5">
                    <Database size={18} />
                    Accéder aux archives complètes (Toutes les bobines)
                </button>
             </div>

          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C1C1E] p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade">
            <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Réglages & Préréglages</h2>
            <form action={handleSettingsSubmit} className="space-y-10">
              
              {/* SEUIL */}
              <div>
                <label className="flex justify-between text-sm font-medium mb-4 text-gray-700 dark:text-gray-300">
                    <span>Poids Faible (Alerte globale)</span>
                    <span className="font-bold text-blue-500">{lowStockThreshold}g</span>
                </label>
                <input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" />
              </div>

              <hr className="border-gray-100 dark:border-gray-800" />

              {/* MARQUES */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Marques personnalisées</h3>
                 <div className="flex gap-2 mb-4">
                    <input type="text" value={newBrand} onChange={e=>setNewBrand(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addBrand(); }}} placeholder="Ajouter une marque..." className="flex-1 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                    <button type="button" onClick={addBrand} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"><Plus size={16}/></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {customBrands.map(b => (
                        <span key={b} className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium">
                            {b} <button type="button" onClick={()=>removeBrand(b)} className="text-gray-400 hover:text-red-500 cursor-pointer"><X size={14}/></button>
                        </span>
                    ))}
                 </div>
              </div>

              {/* MATIERES */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Matériaux personnalisés</h3>
                 <div className="flex gap-2 mb-4">
                    <input type="text" value={newMaterial} onChange={e=>setNewMaterial(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addMaterial(); }}} placeholder="Ajouter un matériau..." className="flex-1 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                    <button type="button" onClick={addMaterial} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"><Plus size={16}/></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {customMaterials.map(m => (
                        <span key={m} className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium">
                            {m} <button type="button" onClick={()=>removeMaterial(m)} className="text-gray-400 hover:text-red-500 cursor-pointer"><X size={14}/></button>
                        </span>
                    ))}
                 </div>
              </div>

              {/* COULEURS */}
              <div>
                 <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider">Couleurs personnalisées</h3>
                 <div className="flex gap-2 mb-4 items-center">
                    <div className="flex items-center justify-center w-12 h-[42px] rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden shrink-0" style={{backgroundColor: newColorHex}}>
                        <input type="color" value={newColorHex} onChange={e=>setNewColorHex(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" />
                    </div>
                    <input type="text" value={newColorName} onChange={e=>setNewColorName(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addColor(); }}} placeholder="Nom de la couleur..." className="flex-1 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500/20 dark:text-white" />
                    <button type="button" onClick={addColor} className="bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer"><Plus size={16}/></button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {customColors.map(c => (
                        <span key={c.name} className="bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm px-3 py-1.5 rounded-xl flex items-center gap-2 font-medium">
                            <div className="w-3 h-3 rounded-full shadow-sm border border-gray-200/50" style={{backgroundColor: c.hex}}></div>
                            {c.name} <button type="button" onClick={()=>removeColor(c.name)} className="text-gray-400 hover:text-red-500 cursor-pointer"><X size={14}/></button>
                        </span>
                    ))}
                 </div>
              </div>

              {/* HIDDENS */}
              <input type="hidden" name="custom_brands" value={JSON.stringify(customBrands)} />
              <input type="hidden" name="custom_materials" value={JSON.stringify(customMaterials)} />
              <input type="hidden" name="custom_colors" value={JSON.stringify(customColors)} />

              <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all hover:bg-gray-900 hover:shadow-xl mt-4">
                  Sauvegarder tous les réglages
              </button>
            </form>
          </div>
        )}
      </main>

      <SpoolModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refreshData={fetchData} initialData={editingBobine} prefillData={prefillData} customBrands={customBrands} customMaterials={customMaterials} customColors={customColors} />
      
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

      {/* MODALE SUPER-ADMIN : ARCHIVES COMPLETES */}
      {isFullHistoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#F5F5F7] dark:bg-black w-full max-w-4xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border dark:border-gray-800 animate-modal">
                <div className="bg-white dark:bg-[#1C1C1E] p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                            <Database className="text-blue-500" /> Archives Complètes
                        </h2>
                        <p className="text-xs text-gray-500 mt-1 font-medium">Toutes les bobines terminées ou cachées depuis la création de votre compte.</p>
                    </div>
                    <button onClick={() => setIsFullHistoryModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600 dark:text-gray-400"/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4">
                    {allArchivedSpools.length === 0 ? (
                        <div className="text-center py-12 text-gray-400 font-medium">Aucune archive dans la base de données.</div>
                    ) : (
                        allArchivedSpools.map(spool => {
                            const isBambu = spool.brand?.toLowerCase().includes('bambu');
                            const bambuColor = isBambu ? BAMBU_COLORS.find(c => c.name === spool.color_name) : null;
                            const displayColor = bambuColor ? `${spool.color_name} #${bambuColor.ref}` : spool.color_name;

                            return (
                                <div key={spool.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm shrink-0" style={{backgroundColor: spool.color_hex}} />
                                        <div>
                                            <h3 className="font-bold text-sm dark:text-white leading-tight">
                                                {spool.brand} {spool.material} <span className="text-gray-400 font-normal ml-1">#{spool.spool_number}</span>
                                            </h3>
                                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{displayColor}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-6">
                                        <div className="text-right">
                                            {spool.finished_at ? (
                                                <p className="text-xs text-gray-500">Terminée le {new Date(spool.finished_at).toLocaleDateString('fr-FR')}</p>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic">Ancienne archive</p>
                                            )}
                                            {spool.is_hidden && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-1.5 py-0.5 rounded uppercase tracking-widest mt-1 inline-block">Cachée</span>}
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <form action={async (f) => { await restoreSpool(f); fetchData(); }}>
                                                <input type="hidden" name="id" value={spool.id} />
                                                <button type="submit" className="p-2.5 bg-gray-50 dark:bg-gray-800 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer" title="Restaurer dans le stock">
                                                    <RotateCcw size={16} />
                                                </button>
                                            </form>
                                            <form action={async (f) => { 
                                                if(window.confirm('ATTENTION ! Supprimer définitivement cette bobine effacera aussi son historique de coût financier. Voulez-vous vraiment continuer ?')) {
                                                    await hardDeleteSpool(f); fetchData();
                                                }
                                            }}>
                                                <input type="hidden" name="id" value={spool.id} />
                                                <HardDeleteButton />
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
      )}

    </div>
  )
}