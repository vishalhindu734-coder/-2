const fs = require('fs');
const content = fs.readFileSync('App.tsx', 'utf8');

const regex = /<div className="bg-white\/40 dark:bg\[#080d19\]\/40 backdrop-blur-2xl border border-white\/50 border-t-white\/80 shadow-\[0_4px_24px_-1px_rgba\(0,0,0,0.05\),inset_0_1px_1px_rgba\(255,255,255,0.8\),inset_0_0_0_1px_rgba\(255,255,255,0.2\)\] text-gray-800 dark:text-gray-100 dark:border-gray-700\/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm">([\s\S]*?)<button onClick={resetAllData}([\s\S]*?)<\/button>\s*<\/div>/;

const replacement = `     <div className="space-y-6">
       {/* Visual & Theme Category */}
       <div>
         <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2">दिखावट और थीम</h2>
         <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm">
           <div className="p-5 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
              <div className="flex items-center gap-4 text-indigo-600"><Moon/><span className="font-medium dark:text-white">डार्क मोड</span></div>
              <button onClick={()=>setDarkMode(!darkMode)} className={\`w-12 h-6 rounded-full relative transition-all \${darkMode?'bg-indigo-600':'bg-gray-300'}\`}><div className={\`w-4 h-4 bg-white rounded-full absolute top-1 transition-all \${darkMode?'left-7':'left-1'}\`}/></button>
           </div>
           
           <div className="p-5 space-y-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-4 text-pink-600 mb-2"><Palette/><span className="font-medium dark:text-white">स्टाइल्स एवं थीम</span></div>
              <div className="grid grid-cols-3 gap-3">
                 <button onClick={()=>setAppTheme('default')} className={\`p-3 rounded-sm border flex flex-col items-center gap-2 transition-all \${appTheme === 'default' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}\`}>
                    <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-blue-600"/><div className="w-3 h-3 rounded-full bg-orange-500"/></div>
                    <span className="text-[10px] font-medium dark:text-white">डिफ़ॉल्ट</span>
                 </button>
                 <button onClick={()=>setAppTheme('nature')} className={\`p-3 rounded-sm border flex flex-col items-center gap-2 transition-all \${appTheme === 'nature' ? 'border-green-600 bg-green-50 dark:bg-green-900/30' : 'border-gray-200 dark:border-gray-700'}\`}>
                    <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"/><div className="w-3 h-3 rounded-full bg-amber-500"/></div>
                    <span className="text-[10px] font-medium dark:text-white">प्रकृति</span>
                 </button>
                 <button onClick={()=>setAppTheme('rose')} className={\`p-3 rounded-sm border flex flex-col items-center gap-2 transition-all \${appTheme === 'rose' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/30' : 'border-gray-200 dark:border-gray-700'}\`}>
                    <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-rose-600"/><div className="w-3 h-3 rounded-full bg-purple-500"/></div>
                    <span className="text-[10px] font-medium dark:text-white">रोज़</span>
                 </button>
              </div>
           </div>

           <div className="p-5 space-y-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-4 text-emerald-600 mb-2"><Type/><span className="font-medium dark:text-white">फ़ॉन्ट</span></div>
              <div className="flex overflow-x-auto pb-4 -mx-5 px-5 gap-3 snap-x scrollbar-hide">
                 <button onClick={()=>setAppFont('baloo')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'baloo' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Baloo 2", sans-serif'}}>Baloo 2</button>
                 <button onClick={()=>setAppFont('tiro')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'tiro' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Tiro Devanagari Hindi", serif'}}>Tiro Hindi</button>
                 <button onClick={()=>setAppFont('mukta')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'mukta' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Mukta, sans-serif'}}>Mukta</button>
                 <button onClick={()=>setAppFont('noto-sans')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'noto-sans' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Noto Sans Devanagari", sans-serif'}}>Noto Sans</button>
                 <button onClick={()=>setAppFont('noto-serif')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'noto-serif' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Noto Serif Devanagari", serif'}}>Noto Serif</button>
                 <button onClick={()=>setAppFont('yatra')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'yatra' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Yatra One", sans-serif'}}>Yatra One</button>
                 <button onClick={()=>setAppFont('kalam')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'kalam' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Kalam, cursive'}}>Kalam</button>
                 <button onClick={()=>setAppFont('amita')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'amita' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Amita, cursive'}}>Amita</button>
                 <button onClick={()=>setAppFont('rajdhani')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'rajdhani' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Rajdhani, sans-serif'}}>Rajdhani</button>
                 <button onClick={()=>setAppFont('hind')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'hind' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Hind, sans-serif'}}>Hind</button>
                 <button onClick={()=>setAppFont('rozha')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'rozha' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Rozha One", serif'}}>Rozha One</button>
                 <button onClick={()=>setAppFont('eczar')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'eczar' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Eczar, serif'}}>Eczar</button>
                 <button onClick={()=>setAppFont('poppins')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'poppins' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Poppins, sans-serif'}}>Poppins</button>
                 <button onClick={()=>setAppFont('laila')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'laila' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Laila, sans-serif'}}>Laila</button>
                 <button onClick={()=>setAppFont('karma')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'karma' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Karma, serif'}}>Karma</button>
                 <button onClick={()=>setAppFont('sura')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'sura' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Sura, serif'}}>Sura</button>
                 <button onClick={()=>setAppFont('vesper')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'vesper' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: '"Vesper Libre", serif'}}>Vesper</button>
                 <button onClick={()=>setAppFont('tillana')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'tillana' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Tillana, cursive'}}>Tillana</button>
                 <button onClick={()=>setAppFont('glegoo')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'glegoo' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Glegoo, serif'}}>Glegoo</button>
                 <button onClick={()=>setAppFont('khula')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'khula' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Khula, sans-serif'}}>Khula</button>
                 <button onClick={()=>setAppFont('yantramanav')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'yantramanav' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Yantramanav, sans-serif'}}>Yantramanav</button>
                 <button onClick={()=>setAppFont('martel')} className={\`snap-start shrink-0 px-5 py-3 rounded-sm border transition-all \${appFont === 'martel' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-white text-gray-700 font-medium'}\`} style={{fontFamily: 'Martel, serif'}}>Martel</button>
              </div>
           </div>

           <div className="p-5 space-y-4 border-t dark:border-gray-700">
              <div className="flex items-center gap-4 text-orange-600 mb-2"><MessageSquare size={20}/><span className="font-medium dark:text-white">टेक्स्ट का आकार (Font Size)</span></div>
              <div className="flex items-center justify-between gap-2 bg-gray-100/50 dark:bg-gray-800/50 p-1.5 rounded-xl border dark:border-gray-700">
                 <button onClick={()=>setAppFontSize(14)} className={\`flex-1 py-2 text-xs rounded-lg transition-all \${appFontSize === 14 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}\`}>छोटा</button>
                 <button onClick={()=>setAppFontSize(16)} className={\`flex-1 py-2 text-xs rounded-lg transition-all \${appFontSize === 16 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}\`}>सामान्य</button>
                 <button onClick={()=>setAppFontSize(18)} className={\`flex-1 py-2 text-sm rounded-lg transition-all \${appFontSize === 18 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}\`}>बड़ा</button>
                 <button onClick={()=>setAppFontSize(20)} className={\`flex-1 py-2 text-base rounded-lg transition-all \${appFontSize === 20 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}\`}>विशाल</button>
              </div>
           </div>
         </div>
       </div>

       {/* App Preferences Category */}
       <div>
         <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-2 mb-2">प्राथमिकताएं</h2>
         <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm">
           <div className="p-5 space-y-4">
             <div className="flex items-center gap-4 text-[#25D366] mb-2"><WhatsappIcon size={20}/><span className="font-medium dark:text-white">WhatsApp संदेश</span></div>
             <textarea rows={4} value={whatsappMessage}
               onChange={(e) => setWhatsappMessage(e.target.value)}
               placeholder="डिफ़ॉल्ट संदेश..."
               className="w-full p-2.5 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 rounded-md outline-none font-medium text-sm"
             ></textarea>
           </div>
           
           <button onClick={()=>setActiveTab('cat-mgmt')} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all border-t dark:border-gray-700">
             <div className="flex items-center gap-4 text-orange-600"><Tag/><span className="font-medium dark:text-white">संपर्क श्रेणी प्रबंधन</span></div>
             <ChevronRight size={18} className="text-gray-300"/>
           </button>
           <button onClick={()=>setActiveTab('event-cat-mgmt')} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all border-t dark:border-gray-700">
             <div className="flex items-center gap-4 text-purple-600"><Flag/><span className="font-medium dark:text-white">कार्यक्रम श्रेणी प्रबंधन</span></div>
             <ChevronRight size={18} className="text-gray-300"/>
           </button>
         </div>
       </div>

       {/* Data & Backup Category */}
       <div>
         <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 mb-2">डेटा और सिस्टम</h2>
         <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm">
           <button onClick={exportData} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40"><div className="flex items-center gap-4 text-green-600"><Download/><span className="font-medium dark:text-white">बैकअप (JSON)</span></div></button>
           <button onClick={importData} className="w-full p-5 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 border-t dark:border-gray-700"><div className="flex items-center gap-4 text-blue-600"><Upload/><span className="font-medium dark:text-white">डेटा रिस्टोर</span></div></button>
           <button onClick={clearAllKaryas} className="w-full p-5 flex justify-between items-center text-orange-600 active:bg-orange-50 dark:active:bg-orange-900/10 transition-all border-t dark:border-gray-700"><div className="flex items-center gap-4"><Trash2/><span className="font-medium">सभी शाखा/मिलन/मंडली हटाएं</span></div></button>
           <button onClick={resetAllData} className="w-full p-5 flex justify-between items-center text-red-600 active:bg-red-50 dark:active:bg-red-900/10 transition-all border-t dark:border-gray-700"><div className="flex items-center gap-4"><RotateCcw/><span className="font-medium">ऐप रिसेट करें</span></div></button>
         </div>
       </div>
     </div>`;

const newCode = content.replace(regex, replacement);
fs.writeFileSync('App.tsx', newCode, 'utf8');
console.log('Done replacement.');
