'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../utils/supabase/client'
import { addSpool, deleteSpool, consumeSpool } from './actions'
import { Search, Plus, Trash2, Disc3, LogOut, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

// --- LISTES DE SUGGESTIONS ---
const SUGGESTED_BRANDS = ["Sunlu", "eSUN", "Prusament", "Creality", "Eryone", "PolyMaker", "Bambu Lab", "Amazon Basics", "Geeetech"];
const SUGGESTED_MATERIALS = ["PLA", "PLA+", "PETG", "ABS", "TPU", "ASA", "Nylon", "Wood", "Silk"];

export default function Home() {
  const [bobines, setBobines] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [filterMaterial, setFilterMaterial] = useState('Tous')
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  const fetchBobines = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    const { data } = await supabase
      .from('spools')
      .select('*')
      .order('created_at', { ascending: false })
    setBobines(data || [])
  }, [router, supabase])

  useEffect(() => {
    fetchBobines()
  }, [fetchBobines])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredBobines = bobines.filter(b => {
    const matchSearch = b.brand.toLowerCase().includes(search.toLowerCase()) || 
                        (b.color_name && b.color_name.toLowerCase().includes(search.toLowerCase()))
    const matchMaterial = filterMaterial === 'Tous' || b.material === filterMaterial
    return matchSearch && matchMaterial
  })

  const materials = ['Tous', ...new Set(bobines.map(b => b.material).filter(Boolean))]

  if (!user) return <div className="bg-[#1A1A2E] min-h-screen"></div>

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-[#EAEAEA] font-sans pb-20">
      
      <header className="border-b border-gray-800 bg-[#16213E]/80 backdrop-blur-md p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            {/* Le nouveau logo Bobine avec un léger dégradé */}
            <div className="bg-gradient-to-br from-[#2D7DD2] to-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Disc3 size={28} className="text-white" />
            </div>
            {/* Titre aligné sur la nouvelle DA */}
            <h1 className="text-lg font-black tracking-tighter uppercase text-white">
              Stock Filaments
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Affichage du pseudo s'il existe, sinon l'email */}
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest hidden md:block">
              Connecté : {user.user_metadata?.username || user.email.split('@')[0]}
            </span>
            <button 
              onClick={handleSignOut} 
              className="p-2.5 hover:bg-red-500/10 text-red-400 rounded-xl transition border border-transparent hover:border-red-500/30"
              title="Se déconnecter"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-8 space-y-8">
        
        {/* STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#16213E] p-5 rounded-2xl border border-gray-800/60 shadow-sm">
            <p className="text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">Total Bobines</p>
            <p className="text-3xl font-black text-[#2D7DD2]">{bobines.length}</p>
          </div>
          <div className="bg-[#16213E] p-5 rounded-2xl border border-gray-800/60 border-l-4 border-l-[#F18F01] shadow-sm">
            <p className="text-gray-400 text-xs uppercase font-bold mb-1 tracking-wider">Stock Faible</p>
            <p className="text-3xl font-black text-[#F18F01]">
              {bobines.filter(b => (b.weight_initial - b.weight_used) < 200).length}
            </p>
          </div>
        </div>

        {/* FILTRES & RECHERCHE */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une marque, une couleur..." 
              className="w-full bg-[#16213E] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 focus:ring-2 focus:ring-[#2D7DD2] outline-none transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {materials.map(m => (
              <button
                key={m}
                onClick={() => setFilterMaterial(m)}
                className={`px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition ${filterMaterial === m ? 'bg-[#2D7DD2] text-white' : 'bg-[#16213E] text-gray-400 border border-gray-800'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* GRILLE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <button onClick={() => setIsModalOpen(true)} className="border-3 border-dashed border-gray-800/60 rounded-3xl flex flex-col items-center justify-center p-8 hover:border-[#2D7DD2] hover:bg-[#2D7DD2]/5 transition group min-h-[250px]">
            <div className="bg-gray-800 group-hover:bg-[#2D7DD2] p-5 rounded-full mb-4 transition shadow-lg">
              <Plus size={36} className="text-gray-400 group-hover:text-white" />
            </div>
            <span className="font-bold text-lg text-gray-500 group-hover:text-[#2D7DD2]">Ajouter une bobine</span>
          </button>

          {filteredBobines.map((bobine) => {
            const poidsInitial = bobine.weight_initial || 1000;
            const reste = poidsInitial - (bobine.weight_used || 0);
            const pourcent = Math.max(0, Math.min(100, (reste / poidsInitial) * 100));
            const isLow = reste < 200;

            return (
              <div key={bobine.id} className="bg-[#16213E] rounded-3xl border border-gray-800/60 overflow-hidden hover:shadow-2xl transition-all flex flex-col group">
                <div className="h-3 w-full" style={{ backgroundColor: bobine.color_hex || '#2D7DD2' }}></div>
                
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold text-xl leading-tight mb-1">{bobine.brand}</h3>
                      <div className="flex items-center gap-2">
                        <span className="bg-[#1A1A2E] text-[#2D7DD2] text-xs font-black uppercase px-2 py-1 rounded-md">{bobine.material}</span>
                        <span className="text-sm text-gray-400 truncate max-w-[100px]">{bobine.color_name}</span>
                      </div>
                    </div>
                    
                    {/* --- SUPPRESSION AVEC CONFIRMATION --- */}
                    <form action={async (formData) => {
                      if (window.confirm(`Supprimer définitivement la bobine ${bobine.brand} ?`)) {
                        await deleteSpool(formData);
                        fetchBobines();
                      }
                    }}>
                      <input type="hidden" name="id" value={bobine.id} />
                      <button className="text-gray-600 hover:text-red-500 transition p-1 rounded">
                        <Trash2 size={18} />
                      </button>
                    </form>
                  </div>

                  <div className="flex items-baseline gap-2 mb-3">
                    <span className={`text-3xl font-black ${isLow ? 'text-[#F18F01]' : 'text-white'}`}>{reste}g</span>
                    <span className="text-gray-500 font-medium">/ {poidsInitial}g</span>
                  </div>

                  <div className="w-full bg-[#1A1A2E] rounded-full h-3 mb-6 p-0.5 border border-gray-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${isLow ? 'bg-[#F18F01]' : 'bg-[#44BBA4]'}`} 
                      style={{ width: `${pourcent}%` }}
                    ></div>
                  </div>

                  {/* --- FORMULAIRE SANS LOGO ET SANS FLÈCHES --- */}
                  <form 
                    action={async (formData) => {
                      await consumeSpool(formData);
                      fetchBobines();
                      const input = document.getElementById(`input-${bobine.id}`) as HTMLInputElement;
                      if (input) input.value = '';
                    }} 
                    className="mt-auto"
                  >
                    <input type="hidden" name="id" value={bobine.id} />
                    
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input 
                          id={`input-${bobine.id}`}
                          type="number" 
                          name="amount" 
                          placeholder="Poids utilisé" 
                          /* Classe CSS pour masquer les flèches sur Chrome/Safari/Firefox */
                          className="w-full bg-[#1A1A2E] border border-gray-800 rounded-xl py-2.5 px-4 text-sm outline-none focus:border-[#2D7DD2] transition font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold pointer-events-none">g</span>
                      </div>
                      
                      <button 
                        type="submit"
                        className="bg-[#2D7DD2] hover:bg-[#2465aa] text-white px-5 py-2.5 rounded-xl transition font-bold text-sm shadow-lg shadow-blue-900/20 active:scale-95"
                      >
                        OK
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* --- MODALE D'AJOUT AVEC LISTES DÉROULANTES --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#16213E] w-full max-w-md p-8 rounded-3xl border border-gray-700 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-2xl text-white">Nouvelle Bobine</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white bg-[#1A1A2E] p-2 rounded-full"><X size={24} /></button>
                </div>
                
                <form action={async (formData) => {
                        await addSpool(formData);
                        setIsModalOpen(false); 
                        fetchBobines();
                    }} className="space-y-5">
                    
                    {/* CHAMP MARQUE (AVEC DATALIST) */}
                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Marque</label>
                        <input 
                          name="brand" 
                          list="brand-list" 
                          placeholder="ex: Sunlu" 
                          className="w-full bg-[#1A1A2E] border border-gray-800 p-4 rounded-2xl outline-none focus:border-[#2D7DD2]" 
                          required 
                        />
                        <datalist id="brand-list">
                          {SUGGESTED_BRANDS.map(brand => <option key={brand} value={brand} />)}
                        </datalist>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* CHAMP MATIÈRE (AVEC DATALIST) */}
                        <div>
                            <label className="block text-sm font-bold text-gray-400 mb-2">Matière</label>
                            <input 
                              name="material" 
                              list="material-list" 
                              placeholder="ex: PLA" 
                              className="w-full bg-[#1A1A2E] border border-gray-800 p-4 rounded-2xl outline-none focus:border-[#2D7DD2]" 
                              required 
                            />
                            <datalist id="material-list">
                              {SUGGESTED_MATERIALS.map(m => <option key={m} value={m} />)}
                            </datalist>
                        </div>
                        <div>
                           <label className="block text-sm font-bold text-gray-400 mb-2">Poids (g)</label>
                           <input type="number" name="initial_weight" defaultValue="1000" className="w-full bg-[#1A1A2E] border border-gray-800 p-4 rounded-2xl outline-none focus:border-[#2D7DD2]" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-400 mb-2">Couleur</label>
                        <div className="flex gap-3">
                            <input name="color" placeholder="Nom de couleur" className="flex-1 bg-[#1A1A2E] border border-gray-800 p-4 rounded-2xl outline-none focus:border-[#2D7DD2]" required />
                            <div className="bg-[#1A1A2E] border border-gray-800 p-2 rounded-2xl h-[58px] w-[58px] flex items-center justify-center">
                                <input type="color" name="color_hex" defaultValue="#2D7DD2" className="h-10 w-10 rounded-xl bg-transparent border-none cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full bg-gradient-to-r from-[#2D7DD2] to-blue-600 py-4 rounded-2xl font-bold text-lg mt-6 text-white shadow-lg active:scale-95 transition-transform">
                        Enregistrer dans le stock
                    </button>
                </form>
            </div>
        </div>
      )}
    </div>
  )
}