'use client'

import { useState } from 'react'
import { Edit2, Trash2, Droplets, Check, Loader2 } from 'lucide-react'
import { deleteSpool, consumeSpool } from '../app/actions'
import { useFormStatus } from 'react-dom'
import ConfirmModal from './ui/ConfirmModal'

// --- LISTE DES COULEURS BAMBU AVEC REFERENCES ---
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

function ConsumeButton() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" disabled={pending} className="bg-black dark:bg-white text-white dark:text-black px-4 rounded-xl shadow-md active:scale-90 cursor-pointer hover:opacity-90 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:scale-100 flex items-center justify-center min-w-[44px]">
      {pending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16}/>}
    </button>
  )
}

function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="text-gray-400 hover:text-red-500 p-2 cursor-pointer transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg hover:scale-110 active:scale-95">
      <Trash2 size={16} />
    </button>
  )
}

export default function SpoolCard({ bobine, lowStockThreshold, refreshData, onEdit }: any) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalConfig, setModalConfig] = useState<{ title: string, message: string, action: () => void, isDanger: boolean }>({ 
    title: '', message: '', action: () => {}, isDanger: false 
  })

  // SECURITE ANTI-CRASH
  if (!bobine) return null;

  const reste = (bobine.weight_initial || 1000) - (bobine.weight_used || 0);
  const pourcent = Math.max(0, Math.min(100, (reste / bobine.weight_initial) * 100));
  const isLow = reste < lowStockThreshold;
  const isOld = (d:string) => d && new Date(d) < new Date(new Date().setMonth(new Date().getMonth()-6));

  // --- LOGIQUE D'AFFICHAGE DE LA REF ---
  const isBambu = bobine.brand?.toLowerCase().includes('bambu');
  const bambuColor = isBambu ? BAMBU_COLORS.find(c => c.name === bobine.color_name) : null;
  const displayColor = bambuColor ? `${bobine.color_name} #${bambuColor.ref}` : bobine.color_name;

  const handleDeleteClick = () => {
    setModalConfig({
        title: 'Supprimer la bobine ?', message: `Voulez-vous vraiment supprimer la bobine #${bobine.spool_number} ? Elle sera archivée.`, isDanger: true,
        action: async () => { const fd = new FormData(); fd.append('id', bobine.id); await deleteSpool(fd); refreshData(); setModalOpen(false); }
    });
    setModalOpen(true);
  }

  const handleConsume = async (formData: FormData) => {
    const amount = parseInt(formData.get('amount') as string);
    if (!amount || amount <= 0) return;
    if (reste - amount <= 0) {
        setModalConfig({
            title: 'Bobine terminée ?', message: `Cette consommation va vider la bobine (${reste}g restants). Voulez-vous la sortir du stock ?`, isDanger: true,
            action: async () => { await deleteSpool(formData); refreshData(); setModalOpen(false); }
        });
        setModalOpen(true);
    } else {
        await consumeSpool(formData); refreshData();
        const input = document.getElementById(`input-${bobine.id}`) as HTMLInputElement;
        if (input) input.value = '';
    }
  }

  return (
    <>
        <div className={`bg-white dark:bg-[#1C1C1E] rounded-2xl border transition-all duration-300 flex flex-col group hover:-translate-y-1 hover:shadow-xl ${isLow ? 'border-orange-200 shadow-orange-50' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
            <div className="h-16 w-full relative flex items-end p-4 pb-2 rounded-t-2xl" style={{ backgroundColor: bobine.color_hex || '#F5F5F7' }}>
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-2 py-1 rounded-lg shadow-sm border border-black/5 dark:border-white/10"><span className="text-[10px] font-bold">#{bobine.spool_number}</span></div>
                <div className="absolute top-3 right-3 flex gap-2">
                    {isOld(bobine.date_opened) && <div className="bg-blue-50/90 dark:bg-blue-900/50 p-1 rounded-lg text-blue-500 shadow-sm border border-blue-100 dark:border-blue-900" title="Ouvert > 6 mois"><Droplets size={12} /></div>}
                    {bobine.price > 0 && <div className="bg-white/90 dark:bg-[#1C1C1E]/90 px-2 py-1 rounded-lg text-[10px] font-bold shadow-sm border border-black/5 dark:border-white/10">{bobine.price} €</div>}
                </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate text-gray-900 dark:text-white">{bobine.material}</h3>
                        {/* AFFICHAGE AVEC REF ICI */}
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">{displayColor}</p>
                    </div>
                    <div className="flex gap-1">
                        <button onClick={() => onEdit(bobine)} className="text-gray-400 hover:text-blue-600 p-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg hover:scale-110 active:scale-95"><Edit2 size={16} /></button>
                        <DeleteButton onClick={handleDeleteClick} />
                    </div>
                </div>
                <div className="mb-4 flex justify-between items-baseline mb-2"><span className={`text-2xl font-bold tracking-tight ${isLow ? 'text-orange-500' : 'text-gray-900 dark:text-white'}`}>{reste}g</span><span className="text-gray-400 text-xs font-medium">/ {bobine.weight_initial}g</span></div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mb-6"><div className={`h-full transition-all duration-1000 ${isLow ? 'bg-orange-500' : 'bg-black dark:bg-white'}`} style={{ width: `${pourcent}%` }}></div></div>
                
                <form action={handleConsume} className="mt-auto flex gap-2">
                    <input type="hidden" name="id" value={bobine.id} />
                    <div className="relative flex-1 group/input"><input id={`input-${bobine.id}`} type="number" name="amount" placeholder="Conso." className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 rounded-xl py-2.5 px-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer group-hover/input:bg-white dark:group-hover/input:bg-[#3A3A3C] shadow-sm hover:shadow-md" required /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">g</span></div>
                    <ConsumeButton />
                </form>
            </div>
        </div>
        <ConfirmModal isOpen={modalOpen} title={modalConfig.title} message={modalConfig.message} onConfirm={modalConfig.action} onCancel={() => setModalOpen(false)} isDanger={modalConfig.isDanger} />
    </>
  )
}