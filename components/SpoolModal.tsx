'use client'

import { useState, useEffect } from 'react'
import { X, Minus, Plus, Loader2 } from 'lucide-react'
import { CustomInput } from './ui/CustomInput'
import { addSpool, updateSpool } from '../app/actions'
import { useFormStatus } from 'react-dom'

const SUGGESTED_BRANDS = ["Bambu Lab", "Sunlu", "eSUN", "Prusament", "Creality", "Eryone", "PolyMaker", "Amazon Basics", "Geeetech", "Anycubic", "Overture"];
const SUGGESTED_MATERIALS = ["PLA", "PLA Basic", "PLA Matte", "PLA Tough+", "PLA Silk+", "PLA Translucent", "PLA Silk Multi-Color", "PLA Wood", "PLA Basic Gradient", "PLA Galaxy", "PLA Metal", "PLA Marble", "PLA Glow", "PLA Sparkle", "PLA-CF", "PLA Aero", "PETG", "PETG Matte", "PETG-HF", "PETG Translucent", "PETG-CF", "ABS", "TPU", "ASA", "Nylon", "PC", "PVA", "HIPS", "Carbon"];

// --- COULEURS OFFICIELLES BAMBU (Issues de ton fichier Excel, avec Hex améliorés) ---
const BAMBU_COLORS = [
    { name: 'Blanc ivoire', ref: '11100', hex: '#F5F5DC' },
    { name: 'Noir Basic', ref: '10101', hex: '#1A1A1A' },
    { name: 'Blanc os', ref: '11103', hex: '#E3DAC9' },
    { name: 'Jaune citron', ref: '11400', hex: '#FFEA00' },
    { name: 'Mandarine', ref: '11300', hex: '#FF8C00' },
    { name: 'Rose sakura', ref: '11201', hex: '#FFB7C5' },
    { name: 'Violet lilas', ref: '11700', hex: '#C8A2C8' },
    { name: 'Prune', ref: '11204', hex: '#8E4585' },
    { name: 'Rouge écarlate', ref: '11200', hex: '#FF2400' },
    { name: 'Rouge foncé', ref: '11202', hex: '#8B0000' },
    { name: 'Vert pomme', ref: '11502', hex: '#8DB600' },
    { name: 'Vert herbacé', ref: '11500', hex: '#5CBA35' },
    { name: 'Vert foncé', ref: '11501', hex: '#006400' },
    { name: 'Bleu glacier', ref: '11601', hex: '#A5F2F3' },
    { name: 'Bleu ciel', ref: '11603', hex: '#87CEEB' },
    { name: 'Bleu marine', ref: '11600', hex: '#000080' },
    { name: 'Bleu foncé', ref: '11602', hex: '#00008B' },
    { name: 'Brun clair du désert', ref: '11401', hex: '#D4B895' },
    { name: 'Marron latte', ref: '11800', hex: '#C5A059' },
    { name: 'Caramel', ref: '11803', hex: '#C68E17' },
    { name: 'Terre cuite', ref: '11203', hex: '#E2725B' },
    { name: 'Marron foncé', ref: '11801', hex: '#5C4033' },
    { name: 'Chocolat noir', ref: '11802', hex: '#3D1C04' },
    { name: 'Gris cendré', ref: '11102', hex: '#B2BEB5' },
    { name: 'Gris nardo', ref: '11104', hex: '#808487' },
    { name: 'Anthracite', ref: '11101', hex: '#383E42' }
];

// --- COULEURS STANDARDS (Pour Sunlu, eSun, etc.) ---
const STANDARD_COLORS = [
    { name: 'Noir', hex: '#000000' }, { name: 'Blanc', hex: '#FFFFFF' }, { name: 'Gris', hex: '#808080' }, 
    { name: 'Gris Argent', hex: '#C0C0C0' }, { name: 'Rouge', hex: '#FF0000' }, { name: 'Bleu', hex: '#0000FF' }, 
    { name: 'Bleu Ciel', hex: '#87CEEB' }, { name: 'Vert', hex: '#008000' }, { name: 'Vert Pomme', hex: '#8DB600' }, 
    { name: 'Jaune', hex: '#FFFF00' }, { name: 'Orange', hex: '#FFA500' }, { name: 'Rose', hex: '#FFC0CB' }, 
    { name: 'Violet', hex: '#800080' }, { name: 'Marron', hex: '#A52A2A' }, { name: 'Or (Gold)', hex: '#FFD700' }, 
    { name: 'Cuivre', hex: '#B87333' }, { name: 'Transparent', hex: '#F0F8FF' }, { name: 'Arc-en-ciel (Rainbow)', hex: '#FF00FF' }
];

function ModalSubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  if (isEdit) {
    return (
      <button type="submit" disabled={pending} className="w-full bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg cursor-pointer active:scale-95 transition-all hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2">
        {pending && <Loader2 size={18} className="animate-spin" />}
        {pending ? 'Enregistrement...' : 'Enregistrer'}
      </button>
    )
  }
  return (
    <button type="submit" disabled={pending} className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-all hover:opacity-90 disabled:opacity-70 flex items-center justify-center gap-2 cursor-pointer">
      {pending && <Loader2 size={18} className="animate-spin" />}
      {pending ? 'Ajout...' : 'Ajouter'}
    </button>
  )
}

export default function SpoolModal({ isOpen, onClose, refreshData, initialData = null, prefillData = null }: any) {
  const [addQuantity, setAddQuantity] = useState(1)
  const [brandInput, setBrandInput] = useState('')
  const [materialInput, setMaterialInput] = useState('')
  const [colorInput, setColorInput] = useState('')
  const [colorHex, setColorHex] = useState('#000000')
  const [priceInput, setPriceInput] = useState('')
  const [weightInput, setWeightInput] = useState('1000')
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (initialData) {
        setBrandInput(initialData.brand); setMaterialInput(initialData.material); setColorInput(initialData.color_name); setColorHex(initialData.color_hex || '#000000');
        setPriceInput(initialData.price); setWeightInput(initialData.weight_initial); setDateInput(initialData.date_opened || new Date().toISOString().split('T')[0]);
    } else if (prefillData) {
        setBrandInput(prefillData.brand); setMaterialInput(prefillData.material); setColorInput(prefillData.color_name); setColorHex(prefillData.color_hex || '#000000');
        setPriceInput(''); setWeightInput('1000'); setAddQuantity(1); setDateInput(new Date().toISOString().split('T')[0]);
    } else {
        setBrandInput(''); setMaterialInput(''); setColorInput(''); setColorHex('#000000'); 
        setPriceInput(''); setWeightInput('1000'); setAddQuantity(1); setDateInput(new Date().toISOString().split('T')[0]);
    }
  }, [initialData, prefillData, isOpen]);

  if (!isOpen) return null;

  const getColorList = () => { 
      if (brandInput.toLowerCase().includes('bambu')) return BAMBU_COLORS; 
      const isStandardMaterial = ['pla', 'petg', 'abs', 'tpu'].some(m => materialInput.toLowerCase().includes(m));
      if (isStandardMaterial) return STANDARD_COLORS;
      return []; 
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fade">
      <div className="bg-white dark:bg-[#1C1C1E] w-full max-w-lg p-8 rounded-3xl shadow-2xl relative max-h-[90vh] overflow-y-auto border dark:border-gray-800 animate-modal">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-[#1C1C1E] pb-4 border-b border-gray-100 dark:border-gray-800 z-10">
            <h3 className="font-bold text-2xl tracking-tight text-gray-900 dark:text-white">{initialData ? `Modifier #${initialData.spool_number}` : 'Arrivage'}</h3>
            <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-600 dark:text-gray-400"/></button>
        </div>
        <form action={async(f)=>{ 
            if(initialData) { await updateSpool(f); } else { await addSpool(f); }
            onClose(); refreshData(); 
        }} className="space-y-4">
          {initialData && <input type="hidden" name="id" value={initialData.id}/>}
          {!initialData && <input type="hidden" name="quantity" value={addQuantity} />}
          
          <CustomInput label="Marque" name="brand" value={brandInput} setValue={setBrandInput} list={SUGGESTED_BRANDS} />
          <div className="grid grid-cols-2 gap-4"><CustomInput label="Matière" name="material" value={materialInput} setValue={setMaterialInput} list={SUGGESTED_MATERIALS}/><div className="relative"><label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase ml-1">Poids (g)</label><input type="number" name="initial_weight" value={weightInput} onChange={e=>setWeightInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer text-gray-900 dark:text-white" required/></div></div>
          
          <CustomInput label="Couleur" name="color" value={colorInput} setValue={setColorInput} list={getColorList()} onSelect={(i:any)=>{if(i.hex)setColorHex(i.hex)}}/>
          
          <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700"><label className="text-xs font-bold text-gray-500">Aperçu :</label><div className="h-6 w-6 rounded-full border shadow-sm" style={{backgroundColor:colorHex}}/><input type="color" name="color_hex" value={colorHex} onChange={e=>setColorHex(e.target.value)} className="opacity-0 w-0 h-0" id="cp"/><label htmlFor="cp" className="text-xs text-blue-500 font-bold cursor-pointer hover:underline transition-all">Modifier</label></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase ml-1">Prix (€)</label><input type="number" step="0.01" name="price" value={priceInput} onChange={e=>setPriceInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer text-gray-900 dark:text-white"/></div><div><label className="block text-[11px] font-medium text-gray-500 mb-1.5 uppercase ml-1">Ouverture</label><input type="date" name="date_opened" value={dateInput} onChange={e=>setDateInput(e.target.value)} className="w-full bg-gray-50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 p-4 rounded-xl outline-none font-medium cursor-pointer text-gray-900 dark:text-white"/></div></div>
          
          {!initialData ? (
             <div className="pt-4 flex gap-4">
                 <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                     <button type="button" onClick={()=>setAddQuantity(Math.max(1,addQuantity-1))} className="p-3 cursor-pointer hover:bg-white dark:hover:bg-black rounded-lg transition-colors"><Minus size={18} className="text-gray-600 dark:text-gray-400"/></button>
                     <span className="w-10 text-center font-bold text-gray-900 dark:text-white">{addQuantity}</span>
                     <button type="button" onClick={()=>setAddQuantity(Math.min(10,addQuantity+1))} className="p-3 cursor-pointer hover:bg-white dark:hover:bg-black rounded-lg transition-colors"><Plus size={18} className="text-gray-600 dark:text-gray-400"/></button>
                 </div>
                 <ModalSubmitButton isEdit={false} />
             </div>
          ) : (
             <ModalSubmitButton isEdit={true} />
          )}
        </form>
      </div>
    </div>
  )
}