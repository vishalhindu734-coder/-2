import fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf-8');

// Insert the Area Mgmt button into MenuTab
const searchStr = `<button onClick={()=>setActiveTab('trips')} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all">
           <div className="flex items-center gap-4 text-orange-600"><CalendarIcon/><span className="font-bold dark:text-white">प्रवास योजना</span></div>
           <ChevronRight size={18} className="text-gray-300"/>
         </button>`;

const replaceStr = `<button onClick={()=>setActiveTab('trips')} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all">
           <div className="flex items-center gap-4 text-orange-600"><CalendarIcon/><span className="font-bold dark:text-white">प्रवास योजना</span></div>
           <ChevronRight size={18} className="text-gray-300"/>
         </button>
         <button onClick={()=>setActiveTab('area-mgmt')} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all">
           <div className="flex items-center gap-4 text-emerald-600"><MapPin/><span className="font-bold dark:text-white">स्थान प्रबंधन (Location Management)</span></div>
           <ChevronRight size={18} className="text-gray-300"/>
         </button>`;

if (content.includes(searchStr)) {
  content = content.replace(searchStr, replaceStr);
  fs.writeFileSync('App.tsx', content);
  console.log('Menu updated');
} else {
  console.log('Could not find the target string directly');
}
