'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { addSpool, deleteSpool, consumeSpool, updateSpool, updateThreshold } from './actions'
import { Search, Plus, Trash2, Disc3, LogOut, X, Edit2, Minus, Settings, Package, Euro, AlertTriangle, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- DONNÉES ---
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

// --- COMPOSANT INPUT "APPLE STYLE" (Curseur Pointer Force) ---
const CustomInput = ({ label, name, value, setValue, list, placeholder, onSelect, type = "text", step }: any) => {
  const [showList, setShowList] = useState(false);

  return (
    <div className="group">
      <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide ml-1">{label}</label>
      <div className="relative">
        <input 
          type={type}
          step={step}
          name={name} 
          value={value} 
          onChange={(e) => { setValue(e.target.value); if(list) setShowList(true); }}
          onFocus={() => { if(list) setShowList(true); }}
          onBlur={() => setTimeout(() => setShowList(false), 200)}
          placeholder={placeholder} 
          autoComplete="off"
          // AJOUT DE 'cursor-pointer' ICI
          className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 p-4 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium placeholder:text-gray-400 cursor-pointer" 
          required 
        />
        {showList && list && list.length > 0 && (
          <ul className="absolute z-50 w-full mt-2 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-xl max-h-48 overflow-y-auto shadow-xl animate-fade">
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
                  <li 
                    key={index} 
                    onClick={() => { 
                      setValue(display); 
                      setShowList(false);
                      if (onSelect) onSelect(item); 
                    }} 
                    // AJOUT DE 'cursor-pointer' ICI AUSSI
                    className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b border-gray-100 last:border-0 flex items-center justify-between text-gray-800 transition-colors"
                  >
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
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'alerte'>('stock')
  
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [similarStockThreshold, setSimilarStockThreshold] = useState(2)
  
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
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

  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    setUser(user)

    const { data: spools } = await supabase.from('spools').select('*').order('created_at', { ascending: false })
    setBobines(spools || [])

    const { data: settings } = await supabase.from('user_settings').select('*').single()
    if (settings) {
      setLowStockThreshold(settings.low_stock_threshold || 200)
      setSimilarStockThreshold(settings.similar_stock_threshold || 2)
    }
  }, [router, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase())) ||
                        (b.spool_number && b.spool_number.toString().includes(search))
    const matchMaterial = filterMaterial === 'Tous' || b.material === filterMaterial
    return matchSearch && matchMaterial
  })

  const totalValue = bobines.reduce((acc, b) => acc + (b.price || 0), 0);

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

  const materials = ['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))]

  const resetFields = () => {
      setBrandInput(''); setMaterialInput(''); setColorInput(''); setColorHex('#000000'); setPriceInput(''); setWeightInput('1000'); setAddQuantity(1);
  }

  const loadEditFields = (bobine: any) => {
      setEditingBobine(bobine);
      setBrandInput(bobine.brand);
      setMaterialInput(bobine.material);
      setColorInput(bobine.color_name);
      setColorHex(bobine.color_hex || '#000000');
      setPriceInput(bobine.price);
      setWeightInput(bobine.weight_initial);
      setIsEditModalOpen(true);
  }

  if (!user) return <div className="bg-[#F5F5F7] min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans pb-20 selection:bg-blue-100 selection:text-blue-900">
      <style jsx global>{`
        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-modal { animation: modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      {/* --- HEADER --- */}
      <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-2 rounded-xl shadow-lg shadow-black/10">
              <Disc3 size={24} className="animate-[spin_12s_linear_infinite]" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 hidden sm:block">Stock Filaments</h1>
          </div>

          <nav className="bg-gray-200/50 p-1 rounded-lg flex items-center">
            <button 
              onClick={() => setActiveTab('stock')}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'stock' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              <Package size={14} /> Stock
            </button>
            <button 
              onClick={() => setActiveTab('alerte')}
              className={`px-4 py-1.5 rounded-[6px] text-xs font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${activeTab === 'alerte' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              <Settings size={14} /> Alertes
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-400 hidden md:block">
              {user.user_metadata?.username || (user.email ? user.email.split('@')[0] : 'Utilisateur')}
            </span>
            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer">
                <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8 animate-fade">
        
        {activeTab === 'stock' ? (
          <>
            {/* --- STATS --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Valeur Totale</p>
                <p className="text-3xl font-semibold text-gray-900 tracking-tight">{totalValue.toFixed(2)} €</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Alertes Poids</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-semibold text-orange-500 tracking-tight">{bobines.filter(b => (b.weight_initial - (b.weight_used || 0)) < lowStockThreshold).length}</p>
                    <span className="text-xs text-orange-500 font-medium bg-orange-50 px-2 py-0.5 rounded-full">{'<'} {lowStockThreshold}g</span>
                </div>
              </div>
              
              {similarAlerts.length > 0 ? (
                <div className="lg:col-span-2 bg-orange-50/50 p-6 rounded-2xl border border-orange-100/50 flex flex-col justify-center">
                   <div className="flex items-center gap-2 mb-3">
                       <AlertTriangle size={16} className="text-orange-500" />
                       <p className="text-orange-600 text-xs font-bold uppercase tracking-wide">Réapprovisionnement conseillé</p>
                   </div>
                   <div className="flex flex-wrap gap-2">
                      {similarAlerts.map((a, i) => (
                        <span key={i} className="bg-white text-orange-600 border border-orange-100 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                          {a.count}x {a.brand} {a.material} {a.color}
                        </span>
                      ))}
                   </div>
                </div>
              ) : (
                 <button onClick={() => { resetFields(); setIsModalOpen(true); }} className="lg:col-span-2 bg-white p-6 rounded-2xl border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-3 group active:scale-[0.99] shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer">
                    <div className="bg-gray-100 group-hover:bg-blue-500 p-2 rounded-full transition-colors">
                        <Plus size={20} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-semibold text-gray-500 group-hover:text-blue-600">Ajouter une nouvelle bobine</span>
                 </button>
              )}
            </div>

            {similarAlerts.length > 0 && (
               <button onClick={() => { resetFields(); setIsModalOpen(true); }} className="w-full bg-black text-white p-4 rounded-xl shadow-lg shadow-black/10 hover:bg-gray-900 transition-all flex items-center justify-center gap-3 active:scale-[0.99] cursor-pointer">
                  <Plus size={20} />
                  <span className="text-sm font-semibold">Ajouter une bobine</span>
               </button>
            )}

            {/* --- RECHERCHE --- */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Rechercher une bobine..." 
                    className="w-full bg-white border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm text-sm font-medium cursor-pointer" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                {materials.map(m => (
                  <button key={m} onClick={() => setFilterMaterial(m)} className={`px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all active:scale-95 cursor-pointer ${filterMaterial === m ? 'bg-black text-white shadow-lg shadow-black/10' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* --- GRILLE BOBINES --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBobines.map((bobine) => {
                const poidsInitial = bobine.weight_initial || 1000;
                const reste = poidsInitial - (bobine.weight_used || 0);
                const pourcent = Math.max(0, Math.min(100, (reste / poidsInitial) * 100));
                const isLow = reste < lowStockThreshold;
                
                return (
                  <div key={bobine.id} className={`bg-white rounded-2xl border overflow-hidden hover:shadow-xl hover:shadow-black/5 transition-all duration-300 flex flex-col group hover:-translate-y-1 ${isLow ? 'border-orange-200 shadow-orange-50' : 'border-gray-100 shadow-sm'}`}>
                    
                    <div className="h-16 w-full relative flex items-end p-4 pb-2" style={{ backgroundColor: bobine.color_hex || '#F5F5F7' }}>
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-black/5">
                            <span className="text-[10px] font-bold text-gray-900 tracking-tight">#{bobine.spool_number}</span>
                        </div>
                        {bobine.price > 0 && (
                           <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-black/5 flex items-center gap-1">
                              <span className="text-[10px] font-bold text-gray-900">{bobine.price} €</span>
                           </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent pointer-events-none"></div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-lg leading-tight mb-1 truncate text-gray-900">{bobine.brand}</h3>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border border-gray-200">{bobine.material}</span>
                            <span className="text-xs text-gray-500 truncate">{bobine.color_name}</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => loadEditFields(bobine)} className="text-gray-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"><Edit2 size={16} /></button>
                          <form action={async (formData) => { if (window.confirm(`Supprimer #${bobine.spool_number} ?`)) { await deleteSpool(formData); fetchData(); } }}>
                            <input type="hidden" name="id" value={bobine.id} />
                            <button className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"><Trash2 size={16} /></button>
                          </form>
                        </div>
                      </div>
                      
                      <div className="mb-5">
                         <div className="flex justify-between items-baseline mb-2">
                            <span className={`text-2xl font-bold tracking-tight ${isLow ? 'text-orange-500' : 'text-gray-900'}`}>{reste}<span className="text-sm font-medium text-gray-400 ml-0.5">g</span></span>
                            <span className="text-gray-400 text-xs font-medium">sur {poidsInitial}g</span>
                         </div>
                         <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${isLow ? 'bg-orange-500' : 'bg-gray-900'}`} style={{ width: `${pourcent}%` }}></div>
                         </div>
                      </div>
                      
                      <form action={async (formData) => { 
                          const amount = parseFloat(formData.get('amount') as string);
                          if (!amount || amount <= 0) return;
                          if (reste - amount <= 0) {
                              if (window.confirm("Bobine vide. Supprimer du stock ?")) await deleteSpool(formData);
                          } else {
                              await consumeSpool(formData); 
                          }
                          fetchData(); 
                          const input = document.getElementById(`input-${bobine.id}`) as HTMLInputElement; 
                          if (input) input.value = ''; 
                      }} className="mt-auto flex gap-2">
                        <div className="relative flex-1">
                            <input id={`input-${bobine.id}`} type="number" name="amount" placeholder="Conso." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium transition-all cursor-pointer" required />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold pointer-events-none">g</span>
                        </div>
                        <button type="submit" className="bg-gray-900 hover:bg-black text-white px-4 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"><Check size={16}/></button>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* --- CONFIGURATION --- */
          <div className="max-w-xl mx-auto bg-white p-10 rounded-[2.5rem] border border-gray-200 shadow-xl animate-fade">
            <h2 className="text-2xl font-bold tracking-tight mb-2 text-gray-900">Préférences</h2>
            <p className="text-gray-500 mb-8 text-sm">Gérez vos seuils d'alertes automatiques.</p>
            
            <form action={async (formData) => { await updateThreshold(formData); fetchData(); alert('Préférences mises à jour.'); }} className="space-y-8">
              
              <div className="space-y-6">
                  <div>
                    <label className="flex justify-between text-sm font-medium text-gray-700 mb-4">
                        <span>Alerte Poids Faible</span>
                        <span className="font-bold text-blue-600">{lowStockThreshold}g</span>
                    </label>
                    <input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black" />
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700 mb-4">Alerte Stock Critique (Doublons)</label>
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-200">
                        <span className="text-xs text-gray-500 max-w-[200px]">Alerter si une référence possède moins de :</span>
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setSimilarStockThreshold(Math.max(1, similarStockThreshold - 1))} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"><Minus size={14}/></button>
                            <span className="text-xl font-bold text-gray-900 w-4 text-center">{similarStockThreshold}</span>
                            <button type="button" onClick={() => setSimilarStockThreshold(similarStockThreshold + 1)} className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full hover:bg-gray-100 transition-colors shadow-sm cursor-pointer"><Plus size={14}/></button>
                            <input type="hidden" name="similar_threshold" value={similarStockThreshold} />
                        </div>
                    </div>
                  </div>
              </div>

              <button type="submit" className="w-full bg-black hover:bg-gray-800 text-white py-4 rounded-2xl font-bold text-sm tracking-wide shadow-lg active:scale-[0.98] transition-all cursor-pointer">ENREGISTRER</button>
            </form>
          </div>
        )}
      </main>

      {/* --- MODALE AJOUT --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl relative animate-modal max-h-[90vh] overflow-y-auto border border-gray-100">
                <div className="flex justify-between items-center mb-8 sticky top-0 bg-white z-10 pb-4 border-b border-gray-50">
                    <h3 className="font-bold text-2xl text-gray-900 tracking-tight">Ajouter une bobine</h3>
                    <button onClick={() => setIsModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"><X size={20} className="text-gray-600" /></button>
                </div>
                
                <form action={async (formData) => { await addSpool(formData); setIsModalOpen(false); fetchData(); }} className="space-y-5">
                    <input type="hidden" name="quantity" value={addQuantity} />
                    
                    <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} placeholder="ex: Sunlu" />

                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS} placeholder="ex: PLA" />
                        <div>
                           <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide ml-1">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue="1000" className="w-full bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all cursor-pointer" required />
                        </div>
                    </div>

                    <CustomInput 
                      label="Couleur" 
                      name="color" 
                      value={colorInput} 
                      setValue={setColorInput} 
                      list={brandInput.toLowerCase().includes('bambu') ? BAMBU_COLORS : []} 
                      placeholder="Nom de la couleur"
                      onSelect={(item: any) => { if(item.hex) setColorHex(item.hex); }}
                    />
                    
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <label className="text-xs font-medium text-gray-500">Aperçu :</label>
                       <div className="h-6 w-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colorHex }}></div>
                       <input type="color" name="color_hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="opacity-0 w-0 h-0" id="colorPicker" />
                       <label htmlFor="colorPicker" className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Modifier</label>
                    </div>

                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide ml-1">Prix (€)</label>
                        <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all cursor-pointer" />
                    </div>
                    
                    <div className="pt-4 flex gap-4">
                        <div className="flex items-center bg-gray-100 rounded-xl p-1">
                            <button type="button" onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))} className="p-3 hover:bg-white rounded-lg transition-all shadow-sm text-gray-600 cursor-pointer"><Minus size={18} /></button>
                            <span className="w-10 text-center font-bold text-gray-900">{addQuantity}</span>
                            <button type="button" onClick={() => setAddQuantity(Math.min(10, addQuantity + 1))} className="p-3 hover:bg-white rounded-lg transition-all shadow-sm text-gray-600 cursor-pointer"><Plus size={18} /></button>
                        </div>
                        <button type="submit" className="flex-1 bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer">
                            AJOUTER AU STOCK
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODALE EDIT --- */}
      {isEditModalOpen && editingBobine && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-white w-full max-w-lg p-8 rounded-[2rem] shadow-2xl relative animate-modal border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-2xl text-gray-900 tracking-tight">Modifier #{editingBobine.spool_number}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors cursor-pointer"><X size={20} className="text-gray-600" /></button>
                </div>
                <form action={async (formData) => { await updateSpool(formData); setIsEditModalOpen(false); fetchData(); }} className="space-y-5">
                    <input type="hidden" name="id" value={editingBobine.id} />
                    <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} />
                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS} />
                        <div>
                           <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide ml-1">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue={editingBobine.weight_initial} className="w-full bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all cursor-pointer" required />
                        </div>
                    </div>
                    <CustomInput label="Couleur" name="color" value={colorInput} setValue={setColorInput} list={brandInput.toLowerCase().includes('bambu') ? BAMBU_COLORS : []} onSelect={(item: any) => { if(item.hex) setColorHex(item.hex); }} />
                    <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <label className="text-xs font-medium text-gray-500">Aperçu :</label>
                       <div className="h-6 w-6 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colorHex }}></div>
                       <input type="color" name="color_hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="opacity-0 w-0 h-0" id="colorPickerEdit" />
                       <label htmlFor="colorPickerEdit" className="text-xs text-blue-600 font-medium cursor-pointer hover:underline">Modifier</label>
                    </div>
                    <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase tracking-wide ml-1">Prix (€)</label>
                        <input type="number" step="0.01" name="price" defaultValue={editingBobine.price} className="w-full bg-gray-50 border border-gray-200 text-gray-900 p-4 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium transition-all cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full bg-black text-white py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg hover:bg-gray-800 active:scale-[0.98] transition-all cursor-pointer">ENREGISTRER</button>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}