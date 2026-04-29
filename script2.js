import fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf-8');

const searchStr = `<div className="space-y-3">
             <label className="text-[10px] font-bold text-gray-400 uppercase px-1">कार्य प्रकार</label>
             <div className="grid grid-cols-2 gap-2">
                {Object.values(VillageStage).map(s => (
                   <button key={s} onClick={() => onUpdateStage(s)} className={\`p-3 rounded-md text-[10px] font-black border transition-all active:scale-95 \${village.stage === s ? 'bg-orange-600 text-white border-orange-600' : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border-gray-100 dark:border-gray-800'}\`}>{s}</button>
                ))}
             </div>
          </div>

          <div className="space-y-3 pt-6 border-t dark:border-gray-700">`;

const replaceStr = `<div className="space-y-4">
             <label className="text-xs font-bold text-gray-400 uppercase px-1">कार्यस्थिति (कार्य प्रकार)</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(VillageStage).map(s => (
                   <button key={s} onClick={() => onUpdateStage(s)} className={\`p-3 rounded-lg text-xs font-black border transition-all active:scale-95 \${village.stage === s ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white/60 dark:bg-[#0a101f]/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-900/50'}\`}>{s}</button>
                ))}
             </div>

             {village.stage !== VillageStage.NONE && (
               <div className="mt-4 p-5 bg-white/60 dark:bg-[#0a101f]/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-4 shadow-inner">
                 <h4 className="font-black text-sm text-gray-800 dark:text-white flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   {village.stage} का विवरण
                 </h4>
                 
                 {village.stage !== VillageStage.SAMPARK && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">स्थान</label>
                       <input placeholder="स्थान..." className="w-full bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-bold dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.location || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, location: e.target.value } })} />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">समय</label>
                       <input type="time" className="w-full bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-bold dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.time || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, time: e.target.value } })} />
                     </div>
                   </div>
                 )}

                 {village.stage === VillageStage.MILAN && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">सप्ताह का तय दिन</label>
                      <select className="w-full bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-bold dark:text-white focus:border-blue-500 transition-colors appearance-none" value={village.karyaDetails?.dayOfWeek || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, dayOfWeek: e.target.value } })}>
                        <option value="">सप्ताह का तय दिन चुनें</option>
                        {['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'].map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                 )}

                 {village.stage === VillageStage.MANDALI && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">महीने के कौन कौन से दिन</label>
                      <input placeholder="उदा. दूसरे और चौथे शनिवार" className="w-full bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-bold dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.daysOfMonth || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, daysOfMonth: e.target.value } })} />
                    </div>
                 )}
                 
                 {village.stage === VillageStage.SAMPARK && (
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">टिप्पणियाँ (Notes)</label>
                      <textarea placeholder="संपर्क के बारे में कुछ लिखें..." className="w-full bg-white dark:bg-[#0f172a] p-3 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-bold dark:text-white focus:border-blue-500 transition-colors min-h-[80px]" value={village.karyaDetails?.notes || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, notes: e.target.value } })} />
                    </div>
                 )}
               </div>
             )}
          </div>

          <div className="space-y-4 pt-6 border-t border-white/20 dark:border-gray-700/50">
             <label className="text-xs font-bold text-gray-400 uppercase px-1">कार्य योजना (योजना)</label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-gray-500 ml-1">वर्तमान स्थिति</label>
                 <textarea placeholder="अभी क्या स्थिति है?" className="w-full bg-white/50 dark:bg-[#0a101f]/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700/50 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors min-h-[80px]" value={village.karyaPlan?.current || ''} onChange={e => onUpdateVillage({ karyaPlan: { ...village.karyaPlan, current: e.target.value } })} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-blue-500 ml-1">1 महीने की योजना</label>
                 <textarea placeholder="1 महीने में क्या लक्ष्य है?" className="w-full bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors min-h-[80px]" value={village.karyaPlan?.month1 || ''} onChange={e => onUpdateVillage({ karyaPlan: { ...village.karyaPlan, month1: e.target.value } })} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-orange-500 ml-1">6 महीने की योजना</label>
                 <textarea placeholder="6 महीने में क्या लक्ष्य है?" className="w-full bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 outline-none text-xs font-medium dark:text-white focus:border-orange-500 transition-colors min-h-[80px]" value={village.karyaPlan?.month6 || ''} onChange={e => onUpdateVillage({ karyaPlan: { ...village.karyaPlan, month6: e.target.value } })} />
               </div>
               <div className="space-y-1">
                 <label className="text-[10px] font-bold text-emerald-500 ml-1">1 वर्ष की योजना</label>
                 <textarea placeholder="1 वर्ष में क्या लक्ष्य है?" className="w-full bg-emerald-50/50 dark:bg-emerald-900/10 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30 outline-none text-xs font-medium dark:text-white focus:border-emerald-500 transition-colors min-h-[80px]" value={village.karyaPlan?.year1 || ''} onChange={e => onUpdateVillage({ karyaPlan: { ...village.karyaPlan, year1: e.target.value } })} />
               </div>
             </div>
          </div>

          <div className="space-y-3 pt-6 border-t dark:border-gray-700">`;

if (content.includes('कार्य प्रकार')) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync('App.tsx', content);
  console.log('App.tsx updated properly.');
} else {
  console.log('Search string not found!');
}
