import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ArrowLeft, X, ChevronRight, Map, MapPin, Tent } from 'lucide-react';
import { Khand, Mandal, Village, VillageStage } from '../types';

interface AreaMgmtViewProps {
  khands: Khand[];
  setKhands: React.Dispatch<React.SetStateAction<Khand[]>>;
  mandals: Mandal[];
  setMandals: React.Dispatch<React.SetStateAction<Mandal[]>>;
  villages: Village[];
  setVillages: React.Dispatch<React.SetStateAction<Village[]>>;
  setActiveTab: (tab: any) => void;
  onBack: () => void;
  setConfirmation: any;
}

export const AreaMgmtView: React.FC<AreaMgmtViewProps> = ({
  khands, setKhands,
  mandals, setMandals,
  villages, setVillages,
  setActiveTab,
  onBack,
  setConfirmation
}) => {
  const [selectedKhandId, setSelectedKhandId] = useState<string | null>(null);
  const [selectedMandalId, setSelectedMandalId] = useState<string | null>(null);
  
  const [editingNode, setEditingNode] = useState<{type: 'khand'|'mandal'|'village', id?: string, data: any} | null>(null);

  const handleDelete = (e: React.MouseEvent, type: 'khand'|'mandal'|'village', id: string) => {
    e.stopPropagation();
    
    if (type === 'khand') {
       if (mandals.some(m => m.khandId === id)) return alert('इस खंड में मंडल हैं। पहले उन्हें हटाएं।');
    } else if (type === 'mandal') {
       if (villages.some(v => v.mandalId === id)) return alert('इस मंडल में स्थान/ग्राम हैं। पहले उन्हें हटाएं।');
    }

    setConfirmation({
      title: 'हटाने की पुष्टि',
      message: 'क्या आप सुनिश्चित हैं कि आप इसे हटाना चाहते हैं?',
      onConfirm: () => {
        if (type === 'khand') {
          setKhands(prev => prev.filter(x => x.id !== id));
        } else if (type === 'mandal') {
          setMandals(prev => prev.filter(x => x.id !== id));
        } else {
          setVillages(prev => prev.filter(x => x.id !== id));
        }
        setConfirmation(null);
      }
    });
  };

  const handleSave = () => {
    if (!editingNode) return;
    const { type, id, data } = editingNode;

    if (!data.name?.trim()) return alert('नाम आवश्यक है');

    if (type === 'khand') {
      if (id) {
        setKhands(prev => prev.map(k => k.id === id ? { ...k, ...data } : k));
      } else {
        setKhands(prev => [...prev, { id: Date.now().toString(), name: data.name }]);
      }
    } else if (type === 'mandal') {
      // For create, default to selectedKhand if missing
      const kId = data.khandId || selectedKhandId;
      if (!kId) return alert('खंड आवश्यक है');
      
      if (id) {
        setMandals(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
      } else {
        setMandals(prev => [...prev, { id: Date.now().toString(), name: data.name, khandId: kId }]);
      }
    } else if (type === 'village') {
      // For create, default to selectedMandal if missing
      const mId = data.mandalId || selectedMandalId;
      if (!mId) return alert('मंडल आवश्यक है');

      if (id) {
        setVillages(prev => prev.map(v => v.id === id ? { ...v, ...data } : v));
      } else {
        setVillages(prev => [...prev, { 
          id: Date.now().toString(), 
          name: data.name, 
          mandalId: mId, 
          stage: data.stage || VillageStage.NONE,
          specialty: data.specialty || ''
        }]);
      }
    }
    setEditingNode(null);
  };

  const handleEdit = (e: React.MouseEvent, type: 'khand'|'mandal'|'village', item: any) => {
    e.stopPropagation();
    setEditingNode({ type, id: item.id, data: { ...item } });
  };

  const renderBreadcrumbs = () => {
    const activeKhand = khands.find(k => k.id === selectedKhandId);
    const activeMandal = mandals.find(m => m.id === selectedMandalId);

    return (
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 mb-6 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] dark:border-gray-700/50 p-3 rounded-lg w-full">
        <button className="flex items-center gap-1 hover:text-blue-600 transition-colors" onClick={() => { setSelectedKhandId(null); setSelectedMandalId(null); }}>
           <Map size={14} /> सभी खंड
        </button>
        {activeKhand && (
          <>
            <ChevronRight size={12} className="opacity-50" />
            <button className="flex items-center gap-1 hover:text-blue-600 transition-colors" onClick={() => setSelectedMandalId(null)}>
               <MapPin size={14} /> {activeKhand.name}
            </button>
          </>
        )}
        {activeMandal && (
          <>
            <ChevronRight size={12} className="opacity-50" />
            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
               <Tent size={14} /> {activeMandal.name}
            </span>
          </>
        )}
      </div>
    );
  };

  const renderForm = () => {
    if (!editingNode) return null;
    const { type, data } = editingNode;

    const title = editingNode.id ? 'संपादित करें' : 'नया जोड़ें';
    const formLabel = type === 'khand' ? 'खंड' : type === 'mandal' ? 'मंडल' : 'स्थान';

    return (
      <div className="fixed inset-0 z-50 bg-white/50 dark:bg-gray-900/80 backdrop-blur-md flex p-4 items-center justify-center">
        <div className="bg-white/80 dark:bg-gray-800/90 backdrop-blur-2xl w-full max-w-sm rounded-[1.5rem] p-6 shadow-2xl animate-in zoom-in-95 duration-200 space-y-5 border border-white/60 dark:border-gray-700">
           <div className="flex justify-between items-center mb-2">
             <h3 className="font-extrabold text-xl dark:text-white flex items-center gap-2 text-gray-800">
                {title} <span className="opacity-50">({formLabel})</span>
             </h3>
             <button onClick={() => setEditingNode(null)} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"><X size={18} className="text-gray-500 dark:text-gray-300" /></button>
           </div>

           <div className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">नाम *</label>
               <input 
                 autoFocus
                 className="w-full bg-white dark:bg-gray-900/50 p-4 pl-5 rounded-xl dark:text-white outline-none font-medium border border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm" 
                 placeholder={`${formLabel} का नाम`}
                 value={data.name || ''}
                 onChange={e => setEditingNode({ ...editingNode, data: { ...data, name: e.target.value } })}
                 onKeyDown={e => e.key === 'Enter' && handleSave()}
               />
             </div>

             {type === 'mandal' && !editingNode.id && !selectedKhandId && (
               <div>
                 <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">मूल खंड</label>
                 <select 
                   className="w-full bg-white dark:bg-gray-900/50 p-4 pl-5 rounded-xl dark:text-white outline-none font-medium border border-gray-200 dark:border-gray-700 focus:border-blue-500 shadow-sm appearance-none"
                   value={data.khandId || ''}
                   onChange={e => setEditingNode({ ...editingNode, data: {...data, khandId: e.target.value} })}
                 >
                   <option value="">-- खंड चुनें --</option>
                   {khands.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                 </select>
               </div>
             )}

             {type === 'village' && (
                <>
                   {!editingNode.id && !selectedMandalId && (
                     <div>
                       <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">मूल मंडल</label>
                       <select 
                         className="w-full bg-white dark:bg-gray-900/50 p-4 pl-5 rounded-xl dark:text-white outline-none font-medium border border-gray-200 dark:border-gray-700 focus:border-blue-500 shadow-sm appearance-none"
                         value={data.mandalId || ''}
                         onChange={e => setEditingNode({ ...editingNode, data: {...data, mandalId: e.target.value} })}
                       >
                         <option value="">-- मंडल चुनें --</option>
                         {mandals.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                     </div>
                   )}
                   <div>
                     <label className="block text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">उपस्थिति (Stage)</label>
                     <select 
                       className="w-full bg-white dark:bg-gray-900/50 p-4 pl-5 rounded-xl dark:text-white outline-none font-medium border border-gray-200 dark:border-gray-700 focus:border-blue-500 shadow-sm appearance-none"
                       value={data.stage || VillageStage.NONE}
                       onChange={e => setEditingNode({ ...editingNode, data: {...data, stage: e.target.value as VillageStage} })}
                     >
                       {Object.values(VillageStage).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                   </div>
                </>
             )}
           </div>

           <button onClick={handleSave} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 active:from-blue-700 active:to-blue-600 text-white p-4 rounded-xl font-medium mt-4 shadow-lg shadow-blue-500/30 transform active:scale-[0.98] transition-all">
             सेव करें
           </button>
        </div>
      </div>
    );
  };

  const renderList = () => {
    // Determine the list of items to render
    let currentLevel: 'khands' | 'mandals' | 'villages';
    let dataList: any[] = [];
    let emptyMsg = '';
    let icon = null;

    if (!selectedKhandId) {
      currentLevel = 'khands';
      dataList = khands;
      emptyMsg = 'कोई खंड उपलब्ध नहीं है';
      icon = <Map size={24} className="text-blue-500 opacity-80" />;
    } else if (!selectedMandalId) {
      currentLevel = 'mandals';
      dataList = mandals.filter(m => m.khandId === selectedKhandId);
      emptyMsg = 'इस खंड में कोई मंडल नहीं है';
      icon = <MapPin size={24} className="text-indigo-500 opacity-80" />;
    } else {
      currentLevel = 'villages';
      dataList = villages.filter(v => v.mandalId === selectedMandalId);
      emptyMsg = 'इस मंडल में कोई स्थान नहीं है';
      icon = <Tent size={24} className="text-emerald-500 opacity-80" />;
    }

    return (
      <div className="space-y-4">
        {dataList.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-[1.5rem] border border-white/40 dark:border-gray-700/50 shadow-sm">
             <div className="w-16 h-16 bg-white/60 dark:bg-gray-800/80 rounded-full flex items-center justify-center mb-4 shadow-sm">
               {icon}
             </div>
             <p className="text-gray-500 dark:text-gray-400 font-medium mb-6">{emptyMsg}</p>
             <button 
               onClick={() => setEditingNode({ type: currentLevel === 'khands' ? 'khand' : currentLevel === 'mandals' ? 'mandal' : 'village', data: {} })}
               className="px-6 py-3 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-full font-medium flex items-center gap-2 hover:bg-blue-100 transition-colors shadow-sm"
             >
               <Plus size={18} /> जोड़ना शुरू करें
             </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dataList.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => {
                  if (currentLevel === 'khands') setSelectedKhandId(item.id);
                  else if (currentLevel === 'mandals') setSelectedMandalId(item.id);
                }}
                className={`group bg-white/50 dark:bg-[#080d19]/40 backdrop-blur-xl border border-white/60 dark:border-gray-700/50 p-4 sm:p-5 rounded-[1.2rem] flex justify-between items-center shadow-[0_4px_16px_rgba(0,0,0,0.03),inset_0_1px_1px_rgba(255,255,255,0.8)] cursor-pointer active:scale-[0.98] transition-all hover:bg-white/70 dark:hover:bg-gray-800/60
                  animate-in slide-in-from-bottom-4 duration-300
                `}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-[inset_0_1px_3px_rgba(255,255,255,0.7)] ${
                    currentLevel === 'khands' ? 'bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 dark:from-blue-900/50 dark:to-blue-900/20 dark:text-blue-400' :
                    currentLevel === 'mandals' ? 'bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-600 dark:from-indigo-900/50 dark:to-indigo-900/20 dark:text-indigo-400' :
                    'bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 dark:from-emerald-900/50 dark:to-emerald-900/20 dark:text-emerald-400'
                  }`}>
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                       {item.name}
                       {item.stage && (
                         <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider shadow-sm
                           ${['SAMITI', 'MANDAL'].includes(item.stage) ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 
                           item.stage === 'MILAN' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' : 
                           'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}
                         `}>
                           {item.stage}
                         </span>
                       )}
                    </h4>
                    {/* Show counts */}
                    {currentLevel === 'khands' && (
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-1">
                        <MapPin size={10} /> {mandals.filter(m => m.khandId === item.id).length} मंडल • {villages.filter(v => mandals.some(m => m.id === v.mandalId && m.khandId === item.id)).length} स्थान
                      </p>
                    )}
                    {currentLevel === 'mandals' && (
                      <p className="text-xs font-medium text-gray-500 flex items-center gap-1 mt-1">
                        <Tent size={10} /> {villages.filter(v => v.mandalId === item.id).length} स्थान
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                   <button 
                     onClick={(e) => handleEdit(e, currentLevel === 'khands' ? 'khand' : currentLevel === 'mandals' ? 'mandal' : 'village', item)}
                     className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-700 text-gray-500 hover:text-blue-600 hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none transition-all"
                   >
                     <Edit2 size={16} />
                   </button>
                   <button 
                     onClick={(e) => handleDelete(e, currentLevel === 'khands' ? 'khand' : currentLevel === 'mandals' ? 'mandal' : 'village', item.id)}
                     className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-gray-700 text-gray-400 hover:text-red-600 hover:bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-none transition-all"
                   >
                     <Trash2 size={16} />
                   </button>
                   
                   {currentLevel !== 'villages' && (
                     <div className="w-10 h-10 flex items-center justify-center text-gray-300 dark:text-gray-600 ml-1">
                       <ChevronRight size={24} />
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getAddType = () => !selectedKhandId ? 'khand' : !selectedMandalId ? 'mandal' : 'village';
  const getAddLabel = () => !selectedKhandId ? 'नया खंड' : !selectedMandalId ? 'नया मंडल' : 'नया स्थान';

  return (
    <div className="p-4 sm:p-6 pb-24 space-y-6 animate-in fade-in duration-300 relative min-h-screen">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/40 dark:border-gray-700/50 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] active:scale-95 transition-all text-gray-700 dark:text-gray-200">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 tracking-normal drop-shadow-sm">
            कार्यक्षेत्र प्रबंधन
          </h1>
        </div>
        
        <button 
          onClick={() => setEditingNode({ type: getAddType(), data: {} })}
          className="p-3 sm:px-5 sm:py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium rounded-xl shadow-[0_4px_12px_rgba(59,130,246,0.3),inset_0_1px_1px_rgba(255,255,255,0.4)] flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all outline-none"
        >
          <Plus size={20} /> <span className="hidden sm:inline">{getAddLabel()}</span>
        </button>
      </div>

      {renderBreadcrumbs()}

      {renderList()}

      {renderForm()}
    </div>
  );
};

