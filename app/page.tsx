'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { addSpool, deleteSpool, consumeSpool, updateSpool, updateThreshold } from './actions'
import { 
  Search, Plus, Trash2, Disc3, LogOut, X, Edit2, 
  Minus, Settings, Package, Euro, AlertTriangle, 
  Check, History, Calculator, Droplets, Sun, Moon, ChevronRight
} from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- DONNÉES DE RÉFÉRENCE ---
const SUGGESTED_BRANDS = ["Sunlu", "eSUN", "Prusament", "Creality", "Eryone", "PolyMaker", "Bambu Lab", "Amazon Basics", "Geeetech"];
const SUGGESTED_MATERIALS = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Nylon", "Wood", "Silk", "Carbon"];

const BAMBU_COLORS = [
  { name: 'Blanc ivoire', ref: '11100', hex: '#FFFFF0' }, { name: 'Blanc os', ref: '11103', hex: '#E3DAC9' },
  { name: 'Jaune citron', ref: '11400', hex: '#FFF44F' }, { name: 'Mandarine', ref: '11300', hex: '#FF8800' },
  { name: 'Rose sakura', ref: '11201', hex: '#FFB7C5' }, { name: 'Violet lilas', ref: '11700', hex: '#C8A2C8' },
  { name: 'Prune', ref: '11204', hex: '#8E4585' }, { name: 'Rouge écarlate', ref: '11200', hex: '#FF2400' },
  { name: 'Rouge foncé', ref: '11202', hex: '#8B0000' }, { name: 'Vert pomme', ref: '11502', hex: '#8DB600' },
  { name: 'Vert herbacé', ref: '11500', hex: '#355E3B' }, { name: 'Vert foncé', ref: '11501', hex: '#013220' },
  { name: 'Bleu glacier', ref: '11601', hex: '#AFDBF5' }, { name: 'Bleu ciel', ref: '11603', hex: '#87CEEB' },
  { name: 'Bleu marine', ref: '11600', hex: '#000080' }, { name: 'Bleu foncé', ref: '11602', hex: '#00008B' },
  { name: 'Brun clair', ref: '11401', hex: '#C4A484' }, { name: 'Marron latte', ref: '11800', hex: '#7B3F00' },
  { name: 'Caramel', ref: '11803', hex: '#AF6E4D' }, { name: 'Terre cuite', ref: '11203', hex: '#E2725B' },
  { name: 'Marron foncé', ref: '11801', hex: '#654321' }, { name: 'Chocolat noir', ref: '11802', hex: '#332421' },
  { name: 'Gris cendré', ref: '11102', hex: '#B2BEB5' }, { name: 'Gris nardo', ref: '11104', hex: '#686A6C' },
  { name: 'Anthracite', ref: '11101', hex: '#36454F' }, { name: 'Noir Basic', ref: '10101', hex: '#000000' },
  { name: 'Argent', ref: '10102', hex: '#C0C0C0' }, { name: 'Or', ref: '10103', hex: '#FFD700' }
];

// --- COMPOSANT INPUT ---
const CustomInput = ({ label, name, value, setValue, list, placeholder, onSelect, type = "text", step }: any) => {
  const [showList, setShowList] = useState(false);
  return (
    <div className="group">
      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative">
        <input 
          type={type} step={step} name={name} value={value} 
          onChange={(e) => { setValue(e.target.value); if(list) setShowList(true); }}
          onFocus={() => { if(list) setShowList(true); }}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
          placeholder={placeholder} autoComplete="off"
          className="w-full bg-gray-50/50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-400 cursor-pointer" 
          required 
        />
        {showList && list && list.length > 0 && (
          <ul className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto shadow-xl animate-fade">
            {list.filter((item: any) => 
               typeof item === 'string' 
               ? item.toLowerCase().includes(value.toLowerCase()) 
               : (item.name.toLowerCase().includes(value.toLowerCase()) || item.ref.includes(value))
            ).map((item: any, index: number) => {
               const isString = typeof item === 'string';
               const display = isString ? item : item.name;
               const subtext = isString ? null : `#${item.ref}`;
               const hex = isString ? null : item.hex;
               return (
                  <li key={index} onClick={() => { setValue(display); setShowList(false); if (onSelect) onSelect(item); }} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between text-gray-800 dark:text-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      {hex && <div className="w-5 h-5 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: hex }}></div>}
                      <span className="font-medium">{display}</span>
                    </div>
                    {subtext && <span className="text-gray-400 text-xs font-mono">{subtext}</span>}
                  </li>
               )
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [history, setHistory] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'history' | 'alerte'>('stock')
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [similarStockThreshold, setSimilarStockThreshold] = useState(2)
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  const [showCalculator, setShowCalculator] = useState(false)
  const [calcWeight, setCalcWeight] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBobine, setEditingBobine] = useState<any>(null)
  const [addQuantity, setAddQuantity] = useState(1)

  const [brandInput, setBrandInput] = useState('')
  const [materialInput, setMaterialInput] = useState('')
  const [colorInput, setColorInput] = useState('')
  const [colorHex, setColorHex] = useState('#000000')
  const [priceInput, setPriceInput] = useState('')
  const [weightInput, setWeightInput] = useState('1000')
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])

  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    setUser(user)

    // IMPORTANT : On trie ici par spool_number de façon croissante pour la stabilité
    const { data: spools } = await supabase
      .from('spools')
      .select('*')
      .order('spool_number', { ascending: true }) 

    setBobines(spools || [])

    const { data: logs } = await supabase.from('consumption_logs').select('*').order('created_at', { ascending: false }).limit(20)
    setHistory(logs || [])

    const { data: settings } = await supabase.from('user_settings').select('*').single()
    if (settings) {
      setLowStockThreshold(settings.low_stock_threshold || 200)
      setSimilarStockThreshold(settings.similar_stock_threshold || 2)
    }
  }, [router, supabase])

  useEffect(() => { 
    fetchData() 
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
        setTheme(savedTheme);
        if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }
  }, [fetchData])

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      if (newTheme === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const resetFields = () => {
      setBrandInput(''); setMaterialInput(''); setColorInput(''); setColorHex('#000000'); 
      setPriceInput(''); setWeightInput('1000'); setAddQuantity(1); 
      setDateInput(new Date().toISOString().split('T')[0]);
  }

  const loadEditFields = (bobine: any) => {
      setEditingBobine(bobine);
      setBrandInput(bobine.brand);
      setMaterialInput(bobine.material);
      setColorInput(bobine.color_name);
      setColorHex(bobine.color_hex || '#000000');
      setPriceInput(bobine.price);
      setWeightInput(bobine.weight_initial);
      setDateInput(bobine.date_opened || new Date().toISOString().split('T')[0]);
      setIsEditModalOpen(true);
  }

  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase())) ||
                        (b.spool_number && b.spool_number.toString().includes(search))
    const matchMaterial = filterMaterial === 'Tous' || b.material === filterMaterial
    return matchSearch && matchMaterial
  })

  // LOGIQUE DE GROUPEMENT PAR MARQUE
  const groupedByBrand = filteredBobines.reduce((acc: any, spool) => {
    const brand = spool.brand || "Inconnu";
    if (!acc[brand]) acc[brand] = [];
    acc[brand].push(spool);
    return acc;
  }, {});
  const sortedBrands = Object.keys(groupedByBrand).sort();

  const totalValue = bobines.reduce((acc, b) => acc + (b.price || 0), 0);

  const isOldSpool = (dateString: string) => {
      if(!dateString) return false;
      const openDate = new Date(dateString);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      return openDate < sixMonthsAgo;
  }

  const getLowStockSimilarGroups = () => {
    const groups: {[key: string]: number} = {};
    bobines.forEach(b => {
      const key = `${b.brand}-${b.material}-${b.color_name}`;
      groups[key] = (groups[key] || 0) + 1;
    });
    return Object.entries(groups).filter(([key, count]) => count < similarStockThreshold).map(([key, count]) => {
      const [brand, material, color] = key.split('-');
      return { brand, material, color, count };
    });
  };
  const similarAlerts = getLowStockSimilarGroups();

  if (!user) return <div className="bg-[#F5F5F7] dark:bg-black min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7] font-sans pb-20 transition-colors duration-300">
      <style jsx global>{`
        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-modal { animation: modalPop { 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; } }
        .animate-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl shadow-lg">
              <Disc3 size={24} className="animate-[spin_12s_linear_infinite]" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white hidden sm:block">Stock Filaments</h1>
          </div>

          <nav className="bg-gray-200/50 dark:bg-gray-800/50 p-1 rounded-lg flex items-center">
            <button onClick={() => setActiveTab('stock')} className={`px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'stock' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-gray-300'}`}>
              <Package size={14} /> Stock
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'history' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-gray-300'}`}>
              <History size={14} /> Historique
            </button>
            <button onClick={() => setActiveTab('alerte')} className={`px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'alerte' ? 'bg-white dark:bg-[#2C2C2E] text-black dark:text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-gray-300'}`}>
              <Settings size={14} /> Config
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-yellow-400 transition-colors cursor-pointer">
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer">
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade">
        
        {activeTab === 'stock' ? (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Valeur Totale</p>
                <p className="text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">{totalValue.toFixed(2)} €</p>
              </div>
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-1">Alertes Poids</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-semibold text-orange-500 tracking-tight">{bobines.filter(b => (b.weight_initial - (b.weight_used || 0)) < lowStockThreshold).length}</p>
                    <span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full">{'<'} {lowStockThreshold}g</span>
                </div>
              </div>
              
              {similarAlerts.length > 0 ? (
                <div className="lg:col-span-2 bg-orange-50/50 dark:bg-orange-900/10 p-6 rounded-2xl border border-orange-100/50 dark:border-orange-900/30 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-3">
                       <AlertTriangle size={16} className="text-orange-500" />
                       <p className="text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wide">Réapprovisionnement conseillé</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {similarAlerts.map((a, i) => (
                        <span key={i} className="bg-white dark:bg-[#2C2C2E] text-orange-600 dark:text-orange-300 border border-orange-100 dark:border-orange-900/30 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                          {a.count}x {a.brand} {a.material} {a.color}
                        </span>
                      ))}
                   </div>
                </div>
              ) : (
                 <button onClick={() => setShowCalculator(!showCalculator)} className="lg:col-span-2 bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all flex items-center justify-center gap-3 group active:scale-[0.99] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer">
                    <Calculator size={20} className="text-gray-500 group-hover:text-blue-500" />
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400">Calculateur de Projet</span>
                 </button>
              )}
            </div>

            {/* CALCULATEUR */}
            {showCalculator && (
              <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl animate-fade">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg flex items-center gap-2"><Calculator size={18} className="text-blue-500"/> Simulateur de coût</h3>
                    <button onClick={() => setShowCalculator(false)}><X size={18} className="text-gray-400 hover:text-black cursor-pointer"/></button>
                </div>
                <input type="number" value={calcWeight} onChange={(e) => setCalcWeight(e.target.value)} placeholder="Poids du print (g)" className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-bold" />
              </div>
            )}

            {/* RECHERCHE */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <button onClick={() => { resetFields(); setIsModalOpen(true); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3.5 rounded-xl font-bold text-sm shadow-lg cursor-pointer flex items-center justify-center gap-2 active:scale-95 transition-all">
                  <Plus size={18} /> Ajouter
              </button>
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input type="text" placeholder="Rechercher..." className="w-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800 rounded-xl py-3.5 pl-12 pr-4 outline-none text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 cursor-pointer" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))].map(m => (
                  <button key={m} onClick={() => setFilterMaterial(m)} className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${filterMaterial === m ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg' : 'bg-white dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50'}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* GRILLE GROUPÉE PAR MARQUE - STABILISÉE */}
            <div className="space-y-12">
              {sortedBrands.map(brandName => (
                <section key={brandName} className="animate-fade">
                  <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-2 mb-6">
                    <ChevronRight size={18} className="text-blue-500" />
                    <h2 className="text-xl font-bold tracking-tight text-gray-400 dark:text-gray-500 uppercase">{brandName}</h2>
                    <span className="text-xs font-bold bg-gray-200 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{groupedByBrand[brandName].length}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedByBrand[brandName].map((bobine: any) => {
                      const reste = (bobine.weight_initial || 1000) - (bobine.weight_used || 0);
                      const pourcent = Math.max(0, Math.min(100, (reste / bobine.weight_initial) * 100));
                      const isLow = reste < lowStockThreshold;
                      const isOld = isOldSpool(bobine.date_opened);
                      
                      return (
                        <div key={bobine.id} className={`bg-white dark:bg-[#1C1C1E] rounded-2xl border transition-all duration-300 flex flex-col group hover:-translate-y-1 ${isLow ? 'border-orange-200 shadow-orange-50' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                          <div className="h-16 w-full relative flex items-end p-4 pb-2" style={{ backgroundColor: bobine.color_hex || '#F5F5F7' }}>
                              <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-black/5 dark:border-white/10">
                                  <span className="text-[10px] font-bold">#{bobine.spool_number}</span>
                              </div>
                              <div className="absolute top-3 right-3 flex gap-2">
                                  {isOld && <div className="bg-blue-50/90 dark:bg-blue-900/50 p-1 rounded-lg text-blue-500 shadow-sm border border-blue-100 dark:border-blue-900" title="Ouvert > 6 mois"><Droplets size={12} /></div>}
                                  {bobine.price > 0 && <div className="bg-white/90 dark:bg-[#1C1C1E]/90 px-2 py-1 rounded-lg text-[10px] font-bold border border-black/5 dark:border-white/10 shadow-sm">{bobine.price} €</div>}
                              </div>
                          </div>

                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg leading-tight truncate text-gray-900 dark:text-white">{bobine.material}</h3>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{bobine.color_name}</p>
                              </div>
                              <div className="flex gap-1">
                                <button onClick={() => loadEditFields(bobine)} className="text-gray-400 hover:text-blue-600 p-2 cursor-pointer transition-colors"><Edit2 size={16} /></button>
                                <form action={async (formData) => { if (window.confirm(`Supprimer #${bobine.spool_number} ?`)) { await deleteSpool(formData); fetchData(); } }}>
                                  <input type="hidden" name="id" value={bobine.id} />
                                  <button className="text-gray-400 hover:text-red-500 p-2 cursor-pointer transition-colors"><Trash2 size={16} /></button>
                                </form>
                              </div>
                            </div>

                            {calcWeight && reste >= parseInt(calcWeight) && (
                                <div className="mb-4 text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center uppercase tracking-wide">
                                    Estimation : {((bobine.price / bobine.weight_initial) * parseInt(calcWeight)).toFixed(2)} €
                                </div>
                            )}
                            
                            <div className="mb-4 flex justify-between items-baseline mb-2">
                              <span className={`text-2xl font-bold tracking-tight ${isLow ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{reste}g</span>
                              <span className="text-gray-400 text-xs font-medium">/ {bobine.weight_initial}g</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mb-6">
                              <div className={`h-full transition-all duration-1000 ${isLow ? 'bg-orange-500' : 'bg-black dark:bg-white'}`} style={{ width: `${pourcent}%` }}></div>
                            </div>
                            
                            <form action={async (formData) => { 
                                const amount = parseInt(formData.get('amount') as string);
                                if (!amount || amount <= 0) return;
                                if (reste - amount <= 0) {
                                    if (window.confirm("Bobine vide. Supprimer du stock ?")) await deleteSpool(formData);
                                } else { await consumeSpool(formData); }
                                fetchData();
                                (document.getElementById(`input-${bobine.id}`) as HTMLInputElement).value = '';
                            }} className="mt-auto flex gap-2">
                              <input type="hidden" name="id" value={bobine.id} />
                              <div className="relative flex-1">
                                  <input id={`input-${bobine.id}`} type="number" name="amount" placeholder="Conso." className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer" required />
                                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">g</span>
                              </div>
                              <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-4 rounded-xl shadow-md active:scale-95 cursor-pointer"><Check size={16}/></button>
                            </form>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : activeTab === 'history' ? (
          <div className="max-w-2xl mx-auto bg-white dark:bg-[#1C1C1E] p-8 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade">
             <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><History className="text-blue-500"/> Impressions récentes</h2>
             {history.length === 0 ? <p className="text-gray-400 italic text-center py-10">Aucun historique disponible.</p> : (
                 <div className="space-y-3">
                    {history.map(log => (
                        <div key={log.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-[#2C2C2E] rounded-2xl border border-gray-100 dark:border-gray-700">
                           <div>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="font-bold text-sm text-gray-800 dark:text-gray-200">{log.spool_name}</p>
                           </div>
                           <span className="text-lg font-black text-blue-500">-{log.amount}g</span>
                        </div>
                    ))}
                 </div>
             )}
          </div>
        ) : (
          <div className="max-w-xl mx-auto bg-white dark:bg-[#1C1C1E] p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 animate-fade">
            <h2 className="text-2xl font-bold mb-8">Réglages</h2>
            <form action={async (f) => { await updateThreshold(f); fetchData(); alert('Sauvegardé !'); }} className="space-y-8">
              <div className="space-y-6">
                <label className="flex justify-between text-sm font-medium mb-4"><span>Poids Faible</span><span className="font-bold text-blue-500">{lowStockThreshold}g</span></label>
                <input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={e=>setLowStockThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-black dark:accent-white" />
                <div className="pt-6 border-t dark:border-gray-800">
                    <label className="block text-sm font-medium mb-4">Seuil Doublons</label>
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={()=>setSimilarStockThreshold(Math.max(1,similarStockThreshold-1))} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-[#1C1C1E] rounded-full shadow-sm cursor-pointer"><Minus size={14}/></button>
                        <span className="text-xl font-bold w-4 text-center">{similarStockThreshold}</span>
                        <button type="button" onClick={()=>setSimilarStockThreshold(similarStockThreshold+1)} className="w-8 h-8 flex items-center justify-center bg-white dark:bg-[#1C1C1E] rounded-full shadow-sm cursor-pointer"><Plus size={14}/></button>
                        <input type="hidden" name="similar_threshold" value={similarStockThreshold}/>
                    </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all">Sauvegarder</button>
            </form>
          </div>
        )}
      </main>

      {/* --- MODALE AJOUT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
          <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg p-8 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto border dark:border-gray-800">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-[#1C1C1E] z-10 pb-2 border-b dark:border-gray-800">
                <h3 className="font-bold text-2xl tracking-tight">Arrivage</h3>
                <button onClick={()=>setIsModalOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"><X size={20}/></button>
            </div>
            <form action={async(f)=>{await addSpool(f);setIsModalOpen(false);fetchData()}} className="space-y-4">
              <input type="hidden" name="quantity" value={addQuantity} />
              <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} />
              <div className="grid grid-cols-2 gap-4">
                  <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS}/>
                  <div className="relative">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Poids (g)</label>
                      <input type="number" name="initial_weight" value={weightInput} onChange={e=>setWeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer" required/>
                  </div>
              </div>
              <CustomInput label="Couleur" name="color" value={colorInput} setValue={setColorInput} list={brandInput.toLowerCase().includes('bambu')?BAMBU_COLORS:[]} onSelect={(i:any)=>{if(i.hex)setColorHex(i.hex)}}/>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <label className="text-xs font-bold text-gray-500">Aperçu :</label>
                  <div className="h-6 w-6 rounded-full border shadow-sm" style={{backgroundColor:colorHex}}/>
                  <input type="color" name="color_hex" value={colorHex} onChange={e=>setColorHex(e.target.value)} className="opacity-0 w-0 h-0" id="cp"/>
                  <label htmlFor="cp" className="text-xs text-blue-500 font-bold cursor-pointer hover:underline transition-all">Modifier</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Prix (€)</label><input type="number" step="0.01" name="price" value={priceInput} onChange={e=>setPriceInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer"/></div>
                  <div><label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Ouverture</label><input type="date" name="date_opened" value={dateInput} onChange={e=>setDateInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer"/></div>
              </div>
              <div className="pt-4 flex gap-4">
                  <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                      <button type="button" onClick={()=>setAddQuantity(Math.max(1,addQuantity-1))} className="p-3 cursor-pointer"><Minus size={18}/></button>
                      <span className="w-10 text-center font-bold text-gray-900 dark:text-white">{addQuantity}</span>
                      <button type="button" onClick={()=>setAddQuantity(Math.min(10,addQuantity+1))} className="p-3 cursor-pointer"><Plus size={18}/></button>
                  </div>
                  <button type="submit" className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all">Ajouter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE EDIT --- */}
      {isEditModalOpen && editingBobine && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
          <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg p-8 rounded-3xl shadow-2xl relative border dark:border-gray-800">
            <div className="flex justify-between items-center mb-6 border-b dark:border-gray-800 pb-4">
                <h3 className="font-bold text-2xl tracking-tight">Modifier #{editingBobine.spool_number}</h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <form action={async(f)=>{await updateSpool(f);setIsEditModalOpen(false);fetchData()}} className="space-y-4">
              <input type="hidden" name="id" value={editingBobine.id}/>
              <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} />
              <div className="grid grid-cols-2 gap-4">
                  <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS}/>
                  <div className="relative">
                      <label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Poids initial (g)</label>
                      <input type="number" name="initial_weight" value={weightInput} onChange={e=>setWeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 p-4 rounded-xl outline-none font-medium cursor-pointer" required/>
                  </div>
              </div>
              <CustomInput label="Couleur" name="color" value={colorInput} setValue={setColorInput} list={brandInput.toLowerCase().includes('bambu')?BAMBU_COLORS:[]} onSelect={(i:any)=>{if(i.hex)setColorHex(i.hex)}}/>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="h-6 w-6 rounded-full border shadow-sm" style={{backgroundColor:colorHex}}/>
                  <input type="color" name="color_hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="opacity-0 w-0 h-0" id="cpe"/>
                  <label htmlFor="cpe" className="text-xs text-blue-500 font-bold cursor-pointer hover:underline transition-all">Modifier</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Prix (€)</label><input type="number" step="0.01" name="price" value={priceInput} onChange={e=>setPriceInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 p-4 rounded-xl font-medium cursor-pointer"/></div>
                  <div><label className="block text-[11px] font-medium text-gray-500 mb-1 uppercase ml-1">Ouverture</label><input type="date" name="date_opened" value={dateInput} onChange={(e) => setDateInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 p-4 rounded-xl font-medium cursor-pointer"/></div>
              </div>
              <button type="submit" className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all">Enregistrer les modifications</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}