import { Disc3, Package, History, Settings, Sun, Moon, LogOut } from 'lucide-react'

export default function Header({ activeTab, setActiveTab, theme, toggleTheme, handleSignOut }: any) {
  return (
    <header className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-30 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="bg-black dark:bg-white text-white dark:text-black p-2 rounded-xl shadow-lg hover:rotate-3 transition-transform duration-300">
              <Disc3 size={24} className="animate-[spin_12s_linear_infinite]" />
            </div>
            <h1 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Stock Filaments</h1>
          </div>

          <nav className="bg-gray-200/50 dark:bg-gray-800/50 p-1.5 rounded-2xl flex items-center relative w-full sm:w-[340px]">
            <div className={`absolute top-1.5 left-1.5 h-[calc(100%-0.75rem)] w-[calc(33.33%-0.375rem)] bg-white dark:bg-[#3A3A3C] rounded-xl shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${activeTab === 'stock' ? 'translate-x-0' : activeTab === 'history' ? 'translate-x-[100%]' : 'translate-x-[200%]'}`} />
            <button onClick={() => setActiveTab('stock')} className={`relative z-10 flex-1 py-2 text-[11px] sm:text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'stock' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}><Package size={14} /> Stock</button>
            <button onClick={() => setActiveTab('history')} className={`relative z-10 flex-1 py-2 text-[11px] sm:text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'history' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}><History size={14} /> Historique</button>
            <button onClick={() => setActiveTab('alerte')} className={`relative z-10 flex-1 py-2 text-[11px] sm:text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'alerte' ? 'text-black dark:text-white' : 'text-gray-500 hover:text-gray-700'}`}><Settings size={14} /> Config</button>
          </nav>

          <div className="flex items-center gap-3 absolute top-4 right-4 sm:static">
            <button onClick={toggleTheme} className="p-2 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-yellow-400 transition-all cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 hover:scale-110">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={handleSignOut} className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-all cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 hover:scale-110"><LogOut size={20} /></button>
          </div>
        </div>
      </header>
  )
}