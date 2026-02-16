'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { addSpool, deleteSpool, consumeSpool, updateSpool, updateThreshold } from './actions'
import { Search, Plus, Trash2, Disc3, LogOut, X, Edit2, Minus, Settings, Package, Euro, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- DONNÉES & SUGGESTIONS ---
const SUGGESTED_BRANDS = ["Sunlu", "eSUN", "Prusament", "Creality", "Eryone", "PolyMaker", "Bambu Lab", "Amazon Basics", "Geeetech"];
const SUGGESTED_MATERIALS = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Nylon", "Wood", "Silk"];

// Liste Bambu avec Codes Hex approximatifs pour l'affichage
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

// --- COMPOSANT INPUT CUSTOM (Défini à l'extérieur pour éviter le bug du focus) ---
const CustomInput = ({ label, name, value, setValue, list, placeholder, onSelect }: any) => {
  const [showList, setShowList] = useState(false);

  return (
    <div className="relative">
      <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">{label}</label>
      <input 
        name={name} 
        value={value} 
        onChange={(e) => { setValue(e.target.value); setShowList(true); }}
        onFocus={() => setShowList(true)}
        onBlur={() => setTimeout(() => setShowList(false), 200)}
        placeholder={placeholder} 
        autoComplete="off"
        className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] transition-all font-bold cursor-pointer" 
        required 
      />
      {showList && list && list.length > 0 && (
        <ul className="absolute z-30 w-full mt-2 bg-[#1A1A2E] border border-gray-700 rounded-2xl max-h-48 overflow-y-auto shadow-2xl animate-fade">
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
                  className="p-4 hover:bg-[#2D7DD2] hover:text-white cursor-pointer font-bold text-sm border-b border-gray-800/50 last:border-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {hex && <div className="w-4 h-4 rounded-full border border-gray-500/50 shadow-sm" style={{ backgroundColor: hex }}></div>}
                    <span>{display}</span>
                  </div>
                  {subtext && <span className="opacity-50 text-[10px]">{subtext}</span>}
                </li>
             )
          })}
        </ul>
      )}
    </div>
  );
};

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'alerte'>('stock')
  
  // Paramètres utilisateur
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  const [similarStockThreshold, setSimilarStockThreshold] = useState(2)
  
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBobine, setEditingBobine] = useState<any>(null)
  const [addQuantity, setAddQuantity] = useState(1)

  // États des champs (Unifiés pour Ajout et Edition)
  const [brandInput, setBrandInput] = useState('')
  const [materialInput, setMaterialInput] = useState('')
  const [colorInput, setColorInput] = useState('')
  const [colorHex, setColorHex] = useState('#2D7DD2') // Stocke la couleur hexadécimale actuelle

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

  // --- LOGIQUE METIER ---
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

  // Reset des champs lors de l'ouverture des modales
  const resetFields = () => {
      setBrandInput(''); setMaterialInput(''); setColorInput(''); setColorHex('#2D7DD2'); setAddQuantity(1);
  }

  const loadEditFields = (bobine: any) => {
      setEditingBobine(bobine);
      setBrandInput(bobine.brand);
      setMaterialInput(bobine.material);
      setColorInput(bobine.color_name);
      setColorHex(bobine.color_hex || '#2D7DD2');
      setIsEditModalOpen(true);
  }

  if (!user) return <div className="bg-[#1A1A2E] min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#EAEAEA] font-sans pb-20 selection:bg-[#2D7DD2]/30">
      <style jsx global>{`
        @keyframes modalPop { 0% { opacity: 0; transform: scale(0.9) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-modal { animation: modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-fade { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      <header className="border-b border-gray-800 bg-[#16213E]/80 backdrop-blur-md p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#2D7DD2] to-blue-600 p-2 rounded-xl">
              <Disc3 size={28} className="text-white animate-[spin_8s_linear_infinite]" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-white hidden sm:block">Stock Filaments</h1>
          </div>

          <nav className="flex bg-[#1A1A2E] p-1 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'stock' ? 'bg-[#2D7DD2] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
              <Package size={14} /> <span className="hidden xs:inline">Stock</span>
            </button>
            <button onClick={() => setActiveTab('alerte')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'alerte' ? 'bg-[#F18F01] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
              <Settings size={14} /> <span className="hidden xs:inline">Alertes</span>
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block opacity-60">
              {user.user_metadata?.username || (user.email ? user.email.split('@')[0] : 'Utilisateur')}
            </span>
            <button onClick={handleSignOut} className="p-2.5 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-xl transition-all cursor-pointer"><LogOut size={20} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-10 animate-fade">
        
        {activeTab === 'stock' ? (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#16213E] p-6 rounded-3xl border border-gray-800/60 shadow-sm">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">Valeur Stock</p>
                <p className="text-4xl font-black text-[#2D7DD2]">{totalValue.toFixed(2)}€</p>
              </div>
              <div className="bg-[#16213E] p-6 rounded-3xl border border-gray-800/60 border-l-4 border-l-[#F18F01]">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest text-[#F18F01]">Alertes Poids</p>
                <p className="text-4xl font-black text-[#F18F01]">{bobines.filter(b => (b.weight_initial - (b.weight_used || 0)) < lowStockThreshold).length}</p>
              </div>
              
              {/* Carte Alertes Similaires */}
              {similarAlerts.length > 0 && (
                <div className="lg:col-span-2 bg-[#F18F01]/10 p-6 rounded-3xl border border-[#F18F01]/30 flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute right-0 top-0 p-4 opacity-10"><AlertTriangle size={100} /></div>
                   <p className="text-[#F18F01] text-[10px] font-black uppercase mb-2 tracking-widest">Réapprovisionnement nécessaire</p>
                   <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {similarAlerts.map((a, i) => (
                        <span key={i} className="bg-[#F18F01] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                          {a.count}x {a.brand} {a.material} {a.color}
                        </span>
                      ))}
                   </div>
                </div>
              )}
              
              {similarAlerts.length === 0 && (
                 <button onClick={() => { resetFields(); setIsModalOpen(true); }} className="lg:col-span-2 bg-gradient-to-r from-[#2D7DD2] to-blue-600 p-6 rounded-3xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-4 group active:scale-[0.97] cursor-pointer">
                    <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform duration-300"><Plus size={28} className="text-white" /></div>
                    <span className="text-lg font-black uppercase tracking-widest text-white">Ajouter au stock</span>
                 </button>
              )}
            </div>

            {/* Si alertes affichées, mettre le bouton ajouter en dessous */}
            {similarAlerts.length > 0 && (
               <button onClick={() => { resetFields(); setIsModalOpen(true); }} className="w-full bg-gradient-to-r from-[#2D7DD2] to-blue-600 p-6 rounded-3xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-4 group active:scale-[0.97] cursor-pointer">
                  <Plus size={28} className="text-white group-hover:rotate-90 transition-transform" />
                  <span className="text-lg font-black uppercase tracking-widest text-white">Ajouter une nouvelle bobine</span>
               </button>
            )}

            {/* RECHERCHE */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="text" placeholder="Rechercher..." className="w-full bg-[#16213E] border border-gray-800 rounded-2xl py-4 pl-14 pr-6 focus:border-[#2D7DD2] outline-none font-bold" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                {materials.map(m => (
                  <button key={m} onClick={() => setFilterMaterial(m)} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest cursor-pointer active:scale-90 ${filterMaterial === m ? 'bg-[#2D7DD2] text-white' : 'bg-[#16213E] text-gray-500 border border-gray-800'}`}>{m}</button>
                ))}
              </div>
            </div>

            {/* GRILLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredBobines.map((bobine) => {
                const poidsInitial = bobine.weight_initial || 1000;
                const reste = poidsInitial - (bobine.weight_used || 0);
                const pourcent = Math.max(0, Math.min(100, (reste / poidsInitial) * 100));
                const isLow = reste < lowStockThreshold;
                
                return (
                  <div key={bobine.id} className={`bg-[#16213E] rounded-[2rem] border overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col group hover:-translate-y-2 ${isLow ? 'border-[#F18F01]/40 shadow-[0_0_15px_rgba(241,143,1,0.1)]' : 'border-gray-800/60'}`}>
                    <div className="h-3 w-full relative transition-all duration-500 group-hover:h-4" style={{ backgroundColor: bobine.color_hex || '#2D7DD2' }}>
                        <div className="absolute top-3 left-4 bg-[#1A1A2E]/90 border border-gray-800 px-2 py-1 rounded-md shadow-lg backdrop-blur-sm z-10">
                            <span className="text-[10px] font-black text-[#2D7DD2]">#{bobine.spool_number}</span>
                        </div>
                        {bobine.price > 0 && (
                           <div className="absolute top-3 right-4 bg-[#1A1A2E]/90 border border-gray-800 px-2 py-1 rounded-md shadow-lg backdrop-blur-sm z-10 flex items-center gap-1">
                              <Euro size={10} className="text-gray-400"/> <span className="text-[10px] font-black text-white">{bobine.price}€</span>
                           </div>
                        )}
                    </div>

                    <div className="p-7 pt-10 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-black text-xl leading-tight mb-1 truncate text-white">{bobine.brand}</h3>
                          <div className="flex items-center gap-2">
                            <span className="bg-[#1A1A2E] text-[#2D7DD2] text-[10px] font-black uppercase px-2 py-0.5 rounded-md border border-[#2D7DD2]/20">{bobine.material}</span>
                            <span className="text-xs text-gray-500 font-bold truncate">{bobine.color_name}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          <button onClick={() => loadEditFields(bobine)} className="text-gray-500 hover:text-[#2D7DD2] p-2.5 rounded-xl bg-[#1A1A2E] border border-gray-800 cursor-pointer"><Edit2 size={16} /></button>
                          <form action={async (formData) => { if (window.confirm(`Supprimer la bobine #${bobine.spool_number} ?`)) { await deleteSpool(formData); fetchData(); } }}>
                            <input type="hidden" name="id" value={bobine.id} />
                            <button className="text-gray-500 hover:text-red-500 p-2.5 rounded-xl bg-[#1A1A2E] border border-gray-800 cursor-pointer"><Trash2 size={16} /></button>
                          </form>
                        </div>
                      </div>
                      
                      <div className="flex items-baseline gap-2 mb-4">
                         <span className={`text-4xl font-black tracking-tighter ${isLow ? 'text-[#F18F01] animate-pulse' : 'text-white'}`}>{reste}g</span>
                         <span className="text-gray-600 text-xs font-black uppercase tracking-widest">/ {poidsInitial}g</span>
                      </div>
                      <div className="w-full bg-[#1A1A2E] rounded-full h-4 mb-8 p-1 border border-gray-800 shadow-inner">
                        <div className={`h-full rounded-full transition-all duration-1000 ease-out shadow-lg ${isLow ? 'bg-gradient-to-r from-orange-500 to-[#F18F01]' : 'bg-gradient-to-r from-teal-500 to-[#44BBA4]'}`} style={{ width: `${pourcent}%` }}></div>
                      </div>
                      
                      {/* --- FORMULAIRE CONSOMMATION SÉCURISÉ --- */}
                      <form action={async (formData) => { 
                          const amount = parseFloat(formData.get('amount') as string);
                          if (!amount || amount <= 0) return;

                          // VÉRIFICATION ANTI-NÉGATIF
                          if (reste - amount <= 0) {
                              if (window.confirm("⚠️ Cette bobine sera vide.\n\nVoulez-vous la supprimer définitivement du stock ?")) {
                                  await deleteSpool(formData); // Supprime si OUI
                              }
                              // Si NON, ne fait rien (pas de consommation enregistrée)
                          } else {
                              await consumeSpool(formData); // Consomme normalement
                          }
                          
                          fetchData(); 
                          const input = document.getElementById(`input-${bobine.id}`) as HTMLInputElement; 
                          if (input) input.value = ''; 
                      }} className="mt-auto">
                        <input type="hidden" name="id" value={bobine.id} />
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input id={`input-${bobine.id}`} type="number" name="amount" placeholder="Poids utilisé" className="w-full bg-[#1A1A2E] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm outline-none focus:border-[#2D7DD2] font-black" required />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] font-black uppercase pointer-events-none">g</span>
                          </div>
                          <button type="submit" className="bg-[#2D7DD2] hover:bg-[#2465aa] text-white px-6 py-3.5 rounded-2xl transition-all font-black text-xs uppercase shadow-lg cursor-pointer active:scale-90">OK</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* --- CONFIGURATION --- */
          <div className="max-w-2xl mx-auto bg-[#16213E] p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl animate-fade">
            <h2 className="text-2xl font-black uppercase tracking-tight mb-8 flex items-center gap-3"><Settings className="text-[#F18F01]" /> Configuration des Alertes</h2>
            <form action={async (formData) => { await updateThreshold(formData); fetchData(); alert('Sauvegardé !'); }} className="space-y-8">
              <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-gray-800 space-y-4">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Alerte poids faible (g)</label>
                <div className="flex items-center gap-6">
                  <input type="range" name="threshold" min="50" max="500" step="10" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(parseInt(e.target.value))} className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#F18F01]" />
                  <span className="text-4xl font-black text-[#F18F01] min-w-[100px] text-right">{lowStockThreshold}g</span>
                </div>
              </div>
              <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-gray-800 space-y-4">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Alerte stock critique (nb bobines)</label>
                <div className="flex items-center gap-6">
                  <button type="button" onClick={() => setSimilarStockThreshold(Math.max(1, similarStockThreshold - 1))} className="p-3 bg-gray-800 rounded-xl hover:text-[#F18F01] cursor-pointer"><Minus /></button>
                  <span className="text-4xl font-black text-[#F18F01] min-w-[50px] text-center">{similarStockThreshold}</span>
                  <button type="button" onClick={() => setSimilarStockThreshold(similarStockThreshold + 1)} className="p-3 bg-gray-800 rounded-xl hover:text-[#F18F01] cursor-pointer"><Plus /></button>
                  <input type="hidden" name="similar_threshold" value={similarStockThreshold} />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#F18F01] hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl cursor-pointer">SAUVEGARDER</button>
            </form>
          </div>
        )}
      </main>

      {/* --- MODALE AJOUT (UNIFIÉE) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#16213E] w-full max-w-md p-10 rounded-[2.5rem] border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-modal max-h-screen overflow-y-auto">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-3xl text-white tracking-tighter uppercase leading-none">Nouvel arrivage</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white bg-[#1A1A2E] p-2.5 rounded-full cursor-pointer"><X size={24} /></button>
                </div>
                
                <form action={async (formData) => { await addSpool(formData); setIsModalOpen(false); fetchData(); }} className="space-y-6">
                    <input type="hidden" name="quantity" value={addQuantity} />
                    
                    <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} placeholder="ex: Sunlu" />

                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS} placeholder="ex: PLA" />
                        <div>
                           <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue="1000" className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                        </div>
                    </div>

                    <CustomInput 
                      label="Couleur" 
                      name="color" 
                      value={colorInput} 
                      setValue={setColorInput} 
                      list={brandInput.toLowerCase().includes('bambu') ? BAMBU_COLORS : []} 
                      placeholder="Nom de couleur"
                      onSelect={(item: any) => { if(item.hex) setColorHex(item.hex); }}
                    />
                    <div className="flex gap-2">
                       <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1 self-center">Aperçu :</label>
                       <input type="color" name="color_hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-8 w-full rounded-lg bg-transparent border-none cursor-pointer" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Prix (€)</label>
                        <input type="number" step="0.01" name="price" placeholder="0.00" className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center bg-[#1A1A2E] border border-gray-800 rounded-2xl p-1.5 shrink-0 shadow-inner">
                            <button type="button" onClick={() => setAddQuantity(Math.max(1, addQuantity - 1))} className="p-3 hover:text-[#2D7DD2] transition-colors text-gray-600 cursor-pointer"><Minus size={20} /></button>
                            <span className="w-10 text-center font-black text-[#2D7DD2] text-xl">{addQuantity}</span>
                            <button type="button" onClick={() => setAddQuantity(Math.min(10, addQuantity + 1))} className="p-3 hover:text-[#2D7DD2] transition-colors text-gray-600 cursor-pointer"><Plus size={20} /></button>
                        </div>
                        <button type="submit" className="flex-1 bg-gradient-to-r from-[#2D7DD2] to-blue-600 py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl active:scale-[0.98] transition-all cursor-pointer">
                            CONFIRMER {addQuantity > 1 ? `(${addQuantity})` : ''}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* --- MODALE ÉDITION (UNIFIÉE) --- */}
      {isEditModalOpen && editingBobine && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#16213E] w-full max-w-md p-10 rounded-[2.5rem] border border-gray-700 shadow-2xl relative animate-modal">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl text-white uppercase tracking-tighter">Modifier #{editingBobine.spool_number}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white bg-[#1A1A2E] p-2.5 rounded-full cursor-pointer"><X size={24} /></button>
                </div>
                <form action={async (formData) => { await updateSpool(formData); setIsEditModalOpen(false); fetchData(); }} className="space-y-6">
                    <input type="hidden" name="id" value={editingBobine.id} />
                    
                    <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} placeholder="ex: Sunlu" />

                    <div className="grid grid-cols-2 gap-4">
                        <CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS} placeholder="ex: PLA" />
                        <div>
                           <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue={editingBobine.weight_initial} className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                        </div>
                    </div>

                    <CustomInput 
                      label="Couleur" 
                      name="color" 
                      value={colorInput} 
                      setValue={setColorInput} 
                      list={brandInput.toLowerCase().includes('bambu') ? BAMBU_COLORS : []} 
                      placeholder="Nom"
                      onSelect={(item: any) => { if(item.hex) setColorHex(item.hex); }}
                    />
                    <div className="flex gap-2">
                       <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1 self-center">Aperçu :</label>
                       <input type="color" name="color_hex" value={colorHex} onChange={(e) => setColorHex(e.target.value)} className="h-8 w-full rounded-lg bg-transparent border-none cursor-pointer" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Prix (€)</label>
                        <input type="number" step="0.01" name="price" defaultValue={editingBobine.price} className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" />
                    </div>

                    <button type="submit" className="w-full bg-[#2D7DD2] py-5 rounded-2xl font-black text-xs tracking-widest uppercase mt-4 shadow-lg active:scale-95 transition-all cursor-pointer">SAUVEGARDER</button>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}