'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { addSpool, deleteSpool, consumeSpool, updateSpool, updateThreshold } from './actions'
import { Search, Plus, Trash2, Disc3, LogOut, X, Edit2, Minus, Settings, Package, Hash } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- SUGGESTIONS ---
const SUGGESTED_BRANDS = ["Sunlu", "eSUN", "Prusament", "Creality", "Eryone", "PolyMaker", "Bambu Lab", "Amazon Basics", "Geeetech"];
const SUGGESTED_MATERIALS = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Nylon", "Wood", "Silk"];

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'stock' | 'alerte'>('stock')
  const [lowStockThreshold, setLowStockThreshold] = useState(200)
  
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingBobine, setEditingBobine] = useState<any>(null)
  const [addQuantity, setAddQuantity] = useState(1)

  const [showBrands, setShowBrands] = useState(false)
  const [showMaterials, setShowMaterials] = useState(false)
  const [brandInput, setBrandInput] = useState('')
  const [materialInput, setMaterialInput] = useState('')
  
  const supabase = createClient()
  const router = useRouter()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    setUser(user)

    // Récupération des bobines
    const { data: spools } = await supabase.from('spools').select('*').order('created_at', { ascending: false })
    setBobines(spools || [])

    // Récupération du seuil personnalisé
    const { data: settings } = await supabase.from('user_settings').select('low_stock_threshold').single()
    if (settings) setLowStockThreshold(settings.low_stock_threshold)
  }, [router, supabase])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // --- FILTRAGE (MARQUE, COULEUR OU NUMÉRO) ---
  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase())) ||
                        (b.spool_number && b.spool_number.toString().includes(search)) // Recherche par numéro
    const matchMaterial = filterMaterial === 'Tous' || b.material === filterMaterial
    return matchSearch && matchMaterial
  })

  const materials = ['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))]

  if (!user) return <div className="bg-[#1A1A2E] min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#EAEAEA] font-sans pb-20 selection:bg-[#2D7DD2]/30">
      
      {/* Tes animations personnalisées conservées */}
      <style jsx global>{`
        @keyframes modalPop {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          70% { transform: scale(1.02) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-modal { animation: modalPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .animate-fade { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>

      <header className="border-b border-gray-800 bg-[#16213E]/80 backdrop-blur-md p-4 sticky top-0 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group cursor-default">
            <div className="bg-gradient-to-br from-[#2D7DD2] to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-all duration-500">
              <Disc3 size={28} className="text-white animate-[spin_8s_linear_infinite]" />
            </div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-white hidden sm:block">Stock Filaments</h1>
          </div>

          {/* Navigation par onglets stylée */}
          <nav className="flex bg-[#1A1A2E] p-1 rounded-xl border border-gray-800">
            <button onClick={() => setActiveTab('stock')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'stock' ? 'bg-[#2D7DD2] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
              <Package size={14} /> <span className="hidden xs:inline">Stock</span>
            </button>
            <button onClick={() => setActiveTab('alerte')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer ${activeTab === 'alerte' ? 'bg-[#F18F01] text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>
              <Settings size={14} /> <span className="hidden xs:inline">Alertes</span>
            </button>
          </nav>

          <button onClick={handleSignOut} className="p-2.5 bg-red-500/5 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-transparent hover:border-red-500/30 cursor-pointer active:scale-90">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-10 animate-fade">
        
        {activeTab === 'stock' ? (
          <>
            {/* --- VUE STOCK --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#16213E] p-6 rounded-3xl border border-gray-800/60 shadow-sm transition-colors hover:border-[#2D7DD2]/30">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest">Total Bobines</p>
                <p className="text-4xl font-black text-[#2D7DD2]">{bobines.length}</p>
              </div>
              <div className="bg-[#16213E] p-6 rounded-3xl border border-gray-800/60 border-l-4 border-l-[#F18F01] shadow-sm">
                <p className="text-gray-500 text-[10px] font-black uppercase mb-1 tracking-widest text-[#F18F01]">Alerte ({lowStockThreshold}g)</p>
                <p className="text-4xl font-black text-[#F18F01]">{bobines.filter(b => (b.weight_initial - (b.weight_used || 0)) < lowStockThreshold).length}</p>
              </div>
              <button onClick={() => setIsModalOpen(true)} className="lg:col-span-2 bg-gradient-to-r from-[#2D7DD2] to-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-4 group active:scale-[0.97] cursor-pointer">
                <div className="bg-white/20 p-2 rounded-xl group-hover:rotate-90 transition-transform duration-300"><Plus size={28} className="text-white" /></div>
                <span className="text-lg font-black uppercase tracking-widest text-white">Ajouter au stock</span>
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                <input type="text" placeholder="Chercher marque, couleur ou #numéro..." className="w-full bg-[#16213E] border border-gray-800 rounded-2xl py-4 pl-14 pr-6 focus:ring-2 focus:ring-[#2D7DD2]/50 outline-none transition-all shadow-inner focus:border-[#2D7DD2]" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                {materials.map(m => (
                  <button key={m} onClick={() => setFilterMaterial(m)} className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer active:scale-90 whitespace-nowrap ${filterMaterial === m ? 'bg-[#2D7DD2] text-white shadow-[0_0_15px_rgba(45,125,210,0.4)]' : 'bg-[#16213E] text-gray-500 border border-gray-800 hover:text-gray-300 hover:border-gray-600'}`}>{m}</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredBobines.map((bobine) => {
                const poidsInitial = bobine.weight_initial || 1000;
                const reste = poidsInitial - (bobine.weight_used || 0);
                const pourcent = Math.max(0, Math.min(100, (reste / poidsInitial) * 100));
                const isLow = reste < lowStockThreshold;
                
                return (
                  <div key={bobine.id} className={`bg-[#16213E] rounded-[2rem] border overflow-hidden hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-300 flex flex-col group hover:-translate-y-2 ${isLow ? 'border-[#F18F01]/40 shadow-[0_0_15px_rgba(241,143,1,0.1)]' : 'border-gray-800/60'}`}>
                    
                    {/* BARRE DE COULEUR + BADGE NUMÉRO */}
                    <div className="h-3 w-full relative transition-all duration-500 group-hover:h-4" style={{ backgroundColor: bobine.color_hex || '#2D7DD2' }}>
                        <div className="absolute top-3 left-4 bg-[#1A1A2E]/90 border border-gray-800 px-2 py-1 rounded-md shadow-lg backdrop-blur-sm z-10">
                            <span className="text-[10px] font-black text-[#2D7DD2]">#{bobine.spool_number}</span>
                        </div>
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
                          <button onClick={() => { setEditingBobine(bobine); setIsEditModalOpen(true); }} className="text-gray-500 hover:text-[#2D7DD2] hover:bg-[#2D7DD2]/10 transition-all p-2.5 rounded-xl bg-[#1A1A2E] border border-gray-800 cursor-pointer active:scale-90"><Edit2 size={16} /></button>
                          <form action={async (formData) => { if (window.confirm(`Supprimer la bobine #${bobine.spool_number} ?`)) { await deleteSpool(formData); fetchData(); } }}>
                            <input type="hidden" name="id" value={bobine.id} />
                            <button className="text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all p-2.5 rounded-xl bg-[#1A1A2E] border border-gray-800 cursor-pointer active:scale-90"><Trash2 size={16} /></button>
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
                      <form action={async (formData) => { await consumeSpool(formData); fetchData(); const input = document.getElementById(`input-${bobine.id}`) as HTMLInputElement; if (input) input.value = ''; }} className="mt-auto">
                        <input type="hidden" name="id" value={bobine.id} />
                        <div className="flex gap-3">
                          <div className="relative flex-1">
                            <input id={`input-${bobine.id}`} type="number" name="amount" placeholder="Poids du print" className="w-full bg-[#1A1A2E] border border-gray-800 rounded-2xl py-3.5 px-5 text-sm outline-none focus:border-[#2D7DD2] font-black transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" required />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-[10px] font-black uppercase pointer-events-none">g</span>
                          </div>
                          <button type="submit" className="bg-[#2D7DD2] hover:bg-[#2465aa] text-white px-6 py-3.5 rounded-2xl transition-all font-black text-xs uppercase shadow-lg shadow-blue-900/40 active:scale-90 cursor-pointer">OK</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        ) : (
          /* --- VUE ALERTES RÉGLABLES --- */
          <div className="max-w-2xl mx-auto bg-[#16213E] p-10 rounded-[2.5rem] border border-gray-800 shadow-2xl animate-fade">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-4 bg-[#F18F01]/10 rounded-2xl text-[#F18F01] shadow-[0_0_20px_rgba(241,143,1,0.1)]"><Settings size={32} /></div>
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Configuration des Alertes</h2>
                <p className="text-gray-500 text-sm">Ajustez le seuil de filament restant pour déclencher une alerte.</p>
              </div>
            </div>

            <form action={async (formData) => { await updateThreshold(formData); fetchData(); alert('Seuil mis à jour !'); }} className="space-y-8">
              <div className="bg-[#1A1A2E] p-8 rounded-3xl border border-gray-800 space-y-4">
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest">Seuil de stock faible</label>
                <div className="flex items-center gap-6">
                  <input 
                    type="range" 
                    name="threshold" 
                    min="50" 
                    max="500" 
                    step="10" 
                    value={lowStockThreshold} 
                    onChange={(e) => setLowStockThreshold(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-[#F18F01]"
                  />
                  <span className="text-4xl font-black text-[#F18F01] min-w-[120px] text-right tracking-tighter">{lowStockThreshold}g</span>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#F18F01] hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-xs tracking-[0.2em] uppercase shadow-xl shadow-orange-900/20 active:scale-[0.98] transition-all cursor-pointer">
                SAUVEGARDER LE RÉGLAGE
              </button>
            </form>
          </div>
        )}
      </main>

      {/* --- MODALE D'AJOUT (AVEC TES MENUS CUSTOM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#16213E] w-full max-w-md p-10 rounded-[2.5rem] border border-gray-700 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-modal">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-3xl text-white tracking-tighter uppercase">Nouvel arrivage</h3>
                    <button onClick={() => { setIsModalOpen(false); setAddQuantity(1); setShowBrands(false); setShowMaterials(false); }} className="text-gray-500 hover:text-white bg-[#1A1A2E] p-2.5 rounded-full cursor-pointer active:scale-90"><X size={24} /></button>
                </div>
                
                <form action={async (formData) => { await addSpool(formData); setIsModalOpen(false); setAddQuantity(1); fetchData(); }} className="space-y-6">
                    <input type="hidden" name="quantity" value={addQuantity} />
                    
                    <div className="relative">
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Marque</label>
                        <input name="brand" value={brandInput} onChange={(e) => { setBrandInput(e.target.value); setShowBrands(true); }} onFocus={() => setShowBrands(true)} onBlur={() => setTimeout(() => setShowBrands(false), 200)} placeholder="ex: Sunlu" autoComplete="off" className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] transition-all font-bold cursor-pointer" required />
                        {showBrands && (
                          <ul className="absolute z-30 w-full mt-2 bg-[#1A1A2E] border border-gray-700 rounded-2xl max-h-48 overflow-y-auto shadow-2xl animate-fade">
                            {SUGGESTED_BRANDS.filter(b => b.toLowerCase().includes(brandInput.toLowerCase())).map(b => (
                              <li key={b} onClick={() => { setBrandInput(b); setShowBrands(false); }} className="p-4 hover:bg-[#2D7DD2] hover:text-white cursor-pointer font-bold text-sm transition-colors border-b border-gray-800/50 last:border-0">{b}</li>
                            ))}
                          </ul>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Matière</label>
                            <input name="material" value={materialInput} onChange={(e) => { setMaterialInput(e.target.value); setShowMaterials(true); }} onFocus={() => setShowMaterials(true)} onBlur={() => setTimeout(() => setShowMaterials(false), 200)} placeholder="ex: PLA" autoComplete="off" className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] transition-all font-bold cursor-pointer" required />
                            {showMaterials && (
                              <ul className="absolute z-30 w-full mt-2 bg-[#1A1A2E] border border-gray-700 rounded-2xl max-h-48 overflow-y-auto shadow-2xl animate-fade">
                                {SUGGESTED_MATERIALS.filter(m => m.toLowerCase().includes(materialInput.toLowerCase())).map(m => (
                                  <li key={m} onClick={() => { setMaterialInput(m); setShowMaterials(false); }} className="p-4 hover:bg-[#2D7DD2] hover:text-white cursor-pointer font-bold text-sm border-b border-gray-800/50 last:border-0">{m}</li>
                                ))}
                              </ul>
                            )}
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue="1000" className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] transition-all font-bold cursor-pointer" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-[0.2em] ml-1">Couleur</label>
                        <div className="flex gap-3">
                            <input name="color" placeholder="Nom" className="flex-1 bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] transition-all font-bold cursor-pointer" required />
                            <input type="color" name="color_hex" defaultValue="#2D7DD2" className="h-[66px] w-16 rounded-2xl bg-[#1A1A2E] border border-gray-800 p-2 cursor-pointer transition-transform hover:scale-105 shadow-inner" />
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-6">
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

      {/* --- MODALE ÉDITION (AVEC NUMÉRO DANS LE TITRE) --- */}
      {isEditModalOpen && editingBobine && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#16213E] w-full max-w-md p-10 rounded-[2.5rem] border border-gray-700 shadow-2xl relative animate-modal">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-black text-2xl text-white uppercase tracking-tighter">Modifier la fiche #{editingBobine.spool_number}</h3>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white bg-[#1A1A2E] p-2.5 rounded-full cursor-pointer"><X size={24} /></button>
                </div>
                <form action={async (formData) => { await updateSpool(formData); setIsEditModalOpen(false); fetchData(); }} className="space-y-6">
                    <input type="hidden" name="id" value={editingBobine.id} />
                    <input name="brand" defaultValue={editingBobine.brand} className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                    <div className="grid grid-cols-2 gap-4">
                        <input name="material" defaultValue={editingBobine.material} className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                        <input type="number" name="initial_weight" defaultValue={editingBobine.weight_initial} className="w-full bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                    </div>
                    <div className="flex gap-3">
                        <input name="color" defaultValue={editingBobine.color_name} className="flex-1 bg-[#1A1A2E] border border-gray-800 p-5 rounded-2xl outline-none focus:border-[#2D7DD2] font-bold cursor-pointer" required />
                        <input type="color" name="color_hex" defaultValue={editingBobine.color_hex} className="h-[66px] w-16 rounded-2xl bg-[#1A1A2E] border border-gray-800 p-2 cursor-pointer" />
                    </div>
                    <button type="submit" className="w-full bg-[#2D7DD2] py-5 rounded-2xl font-black text-xs tracking-widest uppercase mt-4 shadow-lg active:scale-95 transition-all cursor-pointer">SAUVEGARDER</button>
                </form>
            </div>
        </div>
      )}

    </div>
  )
}