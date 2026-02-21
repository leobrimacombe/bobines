'use client'

import { X, Settings, Plus, Loader2, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { updateGroupThreshold } from '../app/actions'
import SpoolCard from './SpoolCard'
import { useFormStatus } from 'react-dom'

function SaveButton() {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50">
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Sauvegarder
        </button>
    )
}

export default function GroupDetailsModal({ isOpen, onClose, group, refreshData, onEditSpool, onAddSpool, lowStockThreshold }: any) {
    const [minSpools, setMinSpools] = useState(1);

    useEffect(() => { 
        if (group) {
            setMinSpools(group.minSpools);
        }
    }, [group]);

    if (!isOpen || !group) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 flex items-center justify-center p-4 animate-fade">
            <div className="bg-[#F5F5F7] dark:bg-black w-full max-w-6xl h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl border dark:border-gray-800 animate-modal">
                
                {/* HEADER */}
                <div className="bg-white dark:bg-[#1C1C1E] p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full border shadow-sm" style={{backgroundColor: group.color_hex}} />
                        <div>
                            <h2 className="text-2xl font-bold dark:text-white leading-tight">{group.brand} <span className="text-gray-400">|</span> {group.material}</h2>
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">{group.color_name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"><X size={24} className="text-gray-600 dark:text-gray-400"/></button>
                </div>

                {/* SCROLLABLE CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8">
                    
                    {/* REGLAGE ALERTE SPECIFIQUE */}
                    <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-500"><Settings size={24} /></div>
                            <div>
                                <h3 className="font-bold dark:text-white">Alerte de sécurité</h3>
                                <p className="text-xs text-gray-500 font-medium">M'avertir si le nombre de bobines <b>neuves (complètes)</b> passe sous ce seuil.</p>
                            </div>
                        </div>
                        <form action={async () => {
                            const fd = new FormData();
                            fd.append('brand', group.brand);
                            fd.append('material', group.material);
                            fd.append('color_name', group.color_name);
                            fd.append('min_spools', minSpools.toString());
                            await updateGroupThreshold(fd);
                            refreshData();
                        }} className="flex items-center gap-3 w-full md:w-auto">
                            <input type="number" min="0" value={minSpools} onChange={e=>setMinSpools(parseInt(e.target.value))} className="w-20 bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-2.5 rounded-xl text-center font-bold dark:text-white outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer" />
                            <span className="text-sm font-bold text-gray-500 mr-2 whitespace-nowrap">complètes</span>
                            <SaveButton />
                        </form>
                    </div>

                    {/* LISTE DES BOBINES */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl dark:text-white">Vos bobines ({group.spools.length})</h3>
                            <button onClick={() => onAddSpool(group)} className="bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 rounded-xl font-bold text-sm shadow-md flex items-center gap-2 hover:opacity-90 transition-opacity active:scale-95 cursor-pointer">
                                <Plus size={16} /> Ajouter une bobine
                            </button>
                        </div>
                        
                        {group.spools.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white dark:bg-[#1C1C1E] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                                Aucune bobine active de ce type en stock.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                {group.spools.map((bobine: any) => (
                                    <SpoolCard key={bobine.id} bobine={bobine} lowStockThreshold={lowStockThreshold} refreshData={refreshData} onEdit={onEditSpool} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}