'use client'
import { useState } from 'react'
import { BrandLogo } from './BrandLogo'

export const CustomInput = ({ label, name, value, setValue, list, placeholder, onSelect, type = "text", step }: any) => {
  const [showList, setShowList] = useState(false);
  return (
    <div className="group">
      <label className="block text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1.5 uppercase ml-1 transition-colors group-focus-within:text-blue-500">{label}</label>
      <div className="relative">
        <input 
            type={type} step={step} name={name} value={value} 
            onChange={(e) => { setValue(e.target.value); if(list) setShowList(true); }} 
            onFocus={() => { if(list) setShowList(true); }} 
            onBlur={() => setTimeout(() => setShowList(false), 200)} 
            placeholder={placeholder} autoComplete="off" 
            className="w-full bg-gray-50/50 dark:bg-[#2C2C2E] border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white p-4 rounded-xl outline-none focus:bg-white dark:focus:bg-[#3A3A3C] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium cursor-pointer placeholder:text-gray-400" 
            required 
        />
        {showList && list && list.length > 0 && (
          <ul className="absolute z-50 w-full mt-2 bg-white/90 dark:bg-[#2C2C2E]/90 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl max-h-48 overflow-y-auto shadow-2xl animate-fade">
            {list.filter((item: any) => typeof item === 'string' ? item.toLowerCase().includes(value.toLowerCase()) : (item.name.toLowerCase().includes(value.toLowerCase()) || (item.ref && item.ref.includes(value)))).map((item: any, index: number) => {
               const display = typeof item === 'string' ? item : item.name;
               return (
                  <li key={index} onClick={() => { setValue(display); setShowList(false); if (onSelect) onSelect(item); }} className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center justify-between text-gray-800 dark:text-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      {name === "brand" && <BrandLogo brand={display} className="w-5 h-5" />}
                      {item.hex && <div className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: item.hex }}></div>}
                      <span className="font-medium">{display}</span>
                    </div>
                    {item.ref && <span className="text-gray-400 text-xs font-mono">#{item.ref}</span>}
                  </li>
               )
            })}
          </ul>
        )}
      </div>
    </div>
  );
};