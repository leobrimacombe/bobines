'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function FilamentCharts({ logs }: { logs: any[] }) {
  
  const data = useMemo(() => {
    const grouped: any = {};
    
    // On trie pour avoir les dates dans l'ordre chronologique
    [...logs].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).forEach(log => {
      const date = new Date(log.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      
      if (!grouped[date]) grouped[date] = { date, weight: 0, cost: 0 };
      
      grouped[date].weight += log.amount;
      
      if (log.spools && log.spools.price && log.spools.weight_initial) {
        const costPerGram = log.spools.price / log.spools.weight_initial;
        grouped[date].cost += (log.amount * costPerGram);
      }
    });

    return Object.values(grouped);
  }, [logs]);

  if (data.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-fade">
      
      {/* GRAPHIQUE 1 : POIDS (BARRES) */}
      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Consommation Journalière (g)</h3>
        <div className="h-[220px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 600}} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#9CA3AF'}} 
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{backgroundColor: '#1C1C1E', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'}}
                itemStyle={{color: '#fff', fontWeight: 'bold'}}
                labelStyle={{color: '#9CA3AF', marginBottom: '0.2rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px'}}
              />
              <Bar dataKey="weight" radius={[6, 6, 6, 6]} barSize={40}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="url(#colorGradientBlue)" />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradientBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3B82F6" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* GRAPHIQUE 2 : COÛT (BARRES) */}
      <div className="bg-white dark:bg-[#1C1C1E] p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6">Coût Estimé (€)</h3>
        <div className="h-[220px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.2} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#9CA3AF', fontWeight: 600}} 
                dy={10} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 11, fill: '#9CA3AF'}} 
              />
              <Tooltip 
                cursor={{fill: 'transparent'}}
                contentStyle={{backgroundColor: '#1C1C1E', borderRadius: '12px', border: 'none', color: '#fff', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)'}}
                itemStyle={{color: '#fff', fontWeight: 'bold'}}
                // --- CORRECTION VERCEL ICI ---
                // On utilise 'any' pour éviter le conflit de type et on sécurise avec Number()
                formatter={(value: any) => [`${Number(value).toFixed(2)} €`, 'Coût']}
                labelStyle={{color: '#9CA3AF', marginBottom: '0.2rem', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px'}}
              />
              <Bar dataKey="cost" radius={[6, 6, 6, 6]} barSize={40}>
                 {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="url(#colorGradientGreen)" />
                ))}
              </Bar>
              <defs>
                <linearGradient id="colorGradientGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  )
}