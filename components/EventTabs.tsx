import React, { useState } from 'react';
import { EventModel } from '../App';
import { Plus, ArrowLeft, Calendar as CalendarIcon, MapPin, Clock, Users, List as ListIcon, DollarSign, CheckCircle, AlertTriangle, AlertCircle, Trash2, PieChart, Phone, Edit3, Save, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
};

export const EventsTab = ({ events, setEvents, meetings, onSelectEvent, onBack }: any) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [selectedMeetingId, setSelectedMeetingId] = useState('');

  const handleCreate = () => {
    let name = newEventName;
    let date = new Date().toISOString().split('T')[0];
    let location = '';

    if (selectedMeetingId) {
       const m = meetings.find((x: any) => x.id === selectedMeetingId);
       if (m) {
          name = name || m.title || m.category;
          date = m.date;
          if (!location) location = m.location || '';
       }
    }

    if (!name && !selectedMeetingId) return;

    const newEvent: EventModel = {
      id: uuidv4(),
      name: name || 'नया कार्यक्रम',
      date: date,
      time: '10:00',
      location: location,
      team: [],
      phases: [],
      departments: [],
      resources: [],
      expenses: [],
      incomes: [],
      executions: [],
      reviews: [],
      contingencies: []
    };
    setEvents([...events, newEvent]);
    setIsAdding(false);
    setNewEventName('');
    setSelectedMeetingId('');
    onSelectEvent(newEvent.id);
  };

  const pendingTodos = events.reduce((sum: number, evt: any) => sum + (evt.phases?.reduce((s: number, p: any) => s + (p.todos?.filter((t: any) => !t.isCompleted).length || 0), 0) || 0), 0);

  return (
    <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-300">
      <header className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
        <div className="flex items-center gap-3">
           <button onClick={onBack} className="p-2 bg-white dark:bg-gray-800 rounded-sm border dark:border-gray-700 shadow-sm"><ArrowLeft size={16} className="dark:text-white"/></button>
           <h1 className="text-xl font-bold text-blue-900 dark:text-blue-400 tracking-normal">कार्यक्रम नियोजन</h1>
        </div>
        <button onClick={() => setIsAdding(true)} className="p-3 bg-blue-600 text-white rounded-md shadow-md active:scale-95 transition-all">
          <Plus size={20} />
        </button>
      </header>

      {pendingTodos > 0 && (
         <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl flex items-center justify-between shadow-sm">
            <div>
               <div className="text-[10px] font-medium uppercase text-orange-600 dark:text-orange-500 tracking-widest mb-1">लंबित टू-डू</div>
               <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{pendingTodos} <span className="text-sm font-medium opacity-60">कार्य शेष</span></div>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-orange-500 dark:text-orange-400">
               <AlertCircle size={24} />
            </div>
         </div>
      )}

      {isAdding && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 space-y-4">
          <div className="space-y-3">
             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">कार्यक्रम का नाम</label>
             <input className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-medium dark:text-white outline-none border border-transparent focus:border-blue-300" placeholder="या नया नाम लिखें..." value={newEventName} onChange={e => setNewEventName(e.target.value)} />
          </div>
          
          <div className="text-center text-xs font-medium text-gray-400">या</div>
          
          <div className="space-y-3">
             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">मौजूदा बैठक से लिंक करें</label>
             <select className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-medium text-gray-700 dark:text-gray-300 outline-none border border-transparent focus:border-blue-300" value={selectedMeetingId} onChange={(e) => setSelectedMeetingId(e.target.value)}>
                <option value="">कोई बैठक नहीं...</option>
                {meetings.map((m: any) => (
                   <option key={m.id} value={m.id}>{m.title || m.category} ({new Date(m.date).toLocaleDateString('hi-IN')})</option>
                ))}
             </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
             <button onClick={() => { setIsAdding(false); setSelectedMeetingId(''); setNewEventName(''); }} className="px-4 py-2 text-gray-500 font-medium active:scale-95">रद्द</button>
             <button onClick={handleCreate} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md active:scale-95 transition-all">बनाएं</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {events.length === 0 && !isAdding && (
          <div className="py-20 text-center text-gray-400 font-medium bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 text-sm">अभी कोई विस्तृत कार्यक्रम नियोजित नहीं है</div>
        )}
        {events.map((event: EventModel) => (
          <div key={event.id} onClick={() => onSelectEvent(event.id)} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm active:scale-95 transition-all text-left flex items-start gap-4 cursor-pointer">
             <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-md">
                 <CalendarIcon size={20} />
             </div>
             <div className="flex-1">
                 <h3 className="text-lg font-bold dark:text-white leading-tight">{event.name}</h3>
                 <div className="text-xs font-medium text-gray-400 uppercase tracking-widest mt-1 flex gap-2 items-center">
                    <Clock size={12} /> {new Date(event.date).toLocaleDateString('hi-IN')}
                 </div>
             </div>
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 if (confirm('क्या आप सुनिश्चित हैं कि आप इस कार्यक्रम को हटाना चाहते हैं?')) {
                   setEvents(events.filter((e: EventModel) => e.id !== event.id));
                 }
               }}
               className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all"
             >
               <Trash2 size={18} />
             </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const EventDetailTab = ({ eventId, events, setEvents, contacts, onBack }: any) => {
  const event = events.find((e: EventModel) => e.id === eventId);
  const [activeSubTab, setActiveSubTab] = useState<'dashboard'|'team'|'phases'|'resources'|'finance'|'execution'|'gantt'>('dashboard');
  const [isEditing, setIsEditing] = useState(false);

  if (!event) return null;

  const updateEvent = (updates: Partial<EventModel>) => {
    setEvents(events.map((e: EventModel) => e.id === event.id ? { ...e, ...updates } : e));
  };

  const totalIncome = event.incomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
  const totalExpense = event.expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const currentBalance = totalIncome - totalExpense;

  return (
    <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
      {/* Shared Voluteers Datalist */}
      <datalist id="workers">
         {contacts?.map((c: any) => <option key={c.id} value={c.name} />)}
      </datalist>

      <header className="flex items-center gap-3 bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm relative">
        <button onClick={onBack} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-sm border dark:border-gray-700"><ArrowLeft size={16} className="dark:text-white"/></button>
        <div className="flex-1">
          {isEditing ? (
             <input className="w-full bg-transparent font-bold text-xl dark:text-white outline-none border-b border-blue-300 dark:border-blue-800" value={event.name} onChange={e => updateEvent({ name: e.target.value })} autoFocus />
          ) : (
             <div className="w-full font-bold text-xl dark:text-white">{event.name}</div>
          )}
          <div className="text-[10px] font-medium text-blue-500 uppercase tracking-widest mt-0.5">विस्तृत नियोजन</div>
        </div>
        <button 
           onClick={() => setIsEditing(!isEditing)}
           className={`p-2 rounded-sm border font-medium text-xs flex items-center gap-1.5 transition-colors ${isEditing ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400' : 'bg-gray-50 text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
           {isEditing ? <Save size={14}/> : <Edit3 size={14}/>}
           <span className="hidden sm:inline">{isEditing ? 'सेव करें' : 'संपादित करें'}</span>
        </button>
        <button 
           onClick={() => {
              if (confirm('क्या आप सुनिश्चित हैं कि आप इस विस्तृत कार्यक्रम को हटाना चाहते हैं?')) {
                 setEvents(events.filter((e: EventModel) => e.id !== event.id));
                 onBack();
              }
           }} 
           className="p-2 text-blue-600 bg-blue-50 dark:bg-blue-900/20 rounded-md active:scale-95 transition-all"
        >
           <Trash2 size={16} />
        </button>
      </header>

      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar snap-x">
         <SubTabBtn active={activeSubTab==='dashboard'} onClick={()=>setActiveSubTab('dashboard')} icon={<PieChart/>} label="डैशबोर्ड" />
         <SubTabBtn active={activeSubTab==='team'} onClick={()=>setActiveSubTab('team')} icon={<Users/>} label="टोली" />
         <SubTabBtn active={activeSubTab==='phases'} onClick={()=>setActiveSubTab('phases')} icon={<ListIcon/>} label="चरण/कार्य" />
         <SubTabBtn active={activeSubTab==='gantt'} onClick={()=>setActiveSubTab('gantt')} icon={<CalendarIcon/>} label="गैंट चार्ट" />
         <SubTabBtn active={activeSubTab==='resources'} onClick={()=>setActiveSubTab('resources')} icon={<MapPin/>} label="संसाधन" />
         <SubTabBtn active={activeSubTab==='finance'} onClick={()=>setActiveSubTab('finance')} icon={<DollarSign/>} label="आर्थिक" />
         <SubTabBtn active={activeSubTab==='execution'} onClick={()=>setActiveSubTab('execution')} icon={<CheckCircle/>} label="समीक्षा" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border dark:border-gray-700 shadow-sm">
        
        {activeSubTab === 'dashboard' && (
          <div className="space-y-6">
             <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-900/20 text-center flex flex-col justify-center">
                    <div className="text-2xl font-bold text-blue-600 leading-none">{event.team.length}</div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-2 leading-none">कार्यकर्ता</div>
                 </div>
                 <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-md border border-indigo-100 dark:border-indigo-900/20 text-center flex flex-col justify-center">
                    <div className="text-2xl font-bold text-indigo-600 leading-none">{event.phases.length}</div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-2 leading-none">चरण</div>
                 </div>
                 <div className="col-span-2 lg:col-span-1 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-md border border-orange-100 dark:border-orange-900/20 text-center flex flex-col justify-center">
                    <div className="text-2xl font-bold text-orange-600 leading-none">
                      {event.phases?.reduce((acc: number, p: any) => acc + (p.todos?.filter((t: any) => t.isCompleted).length || 0), 0) || 0}
                      <span className="text-base text-orange-400">/{event.phases?.reduce((acc: number, p: any) => acc + (p.todos?.length || 0), 0) || 0}</span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest mt-2 leading-none">पूर्ण कार्य</div>
                 </div>
                 <div className="col-span-2 lg:col-span-3 bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-md border border-indigo-100 dark:border-indigo-900/20 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">बजट बैलेंस</div>
                        <div className={`text-2xl font-medium ${currentBalance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>₹ {currentBalance.toLocaleString('hi-IN')}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-medium text-gray-500">आय: <span className="text-indigo-600">₹ {totalIncome.toLocaleString()}</span></div>
                        <div className="text-xs font-medium text-gray-500">व्यय: <span className="text-blue-600">₹ {totalExpense.toLocaleString()}</span></div>
                    </div>
                 </div>
             </div>

             <div className="space-y-4 pt-4 border-t dark:border-gray-700">
               <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">सामान्य जानकारी</h3>
               {isEditing ? (
                 <>
                   <div className="space-y-1">
                     <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">दिनांक</label>
                     <input type="date" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-medium dark:text-white outline-none border dark:border-gray-700" value={event.date} onChange={e => updateEvent({ date: e.target.value })} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">समय</label>
                     <input type="time" className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-medium dark:text-white outline-none border dark:border-gray-700" value={event.time} onChange={e => updateEvent({ time: e.target.value })} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">स्थान</label>
                     <input className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-md font-medium dark:text-white outline-none border dark:border-gray-700" value={event.location} onChange={e => updateEvent({ location: e.target.value })} placeholder="स्थान दर्ज करें..." />
                   </div>
                 </>
               ) : (
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-700/50 text-sm font-medium dark:text-gray-200">
                       <Clock size={16} className="inline mr-2 text-blue-500 mb-0.5"/> 
                       {event.date ? new Date(event.date).toLocaleDateString('hi-IN') : '-'}
                       <span className="text-gray-400 font-medium ml-1 text-xs">({event.time ? formatTime(event.time) : '-'})</span>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border dark:border-gray-700/50 text-sm font-medium dark:text-gray-200 truncate">
                       <MapPin size={16} className="inline mr-2 text-blue-500 mb-0.5"/> 
                       {event.location || '-'}
                    </div>
                 </div>
               )}
             </div>
          </div>
        )}

        {activeSubTab === 'team' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">संचालन टोली</h3>
                <button onClick={() => updateEvent({ team: [...event.team, { id: uuidv4(), name: '', contact: '', role: '', teamRole: '', task: '' }]})} className="text-blue-600 font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">+ जोड़ें</button>
             </div>
             
               <div className="space-y-3">
                 {event.team.map((t: any) => (
                   <div key={t.id} className="p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg relative group shadow-sm flex flex-col gap-2">
                      <button onClick={() => updateEvent({ team: event.team.filter((x: any) => x.id !== t.id) })} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors z-10"><Trash2 size={14}/></button>
                      
                      <div className="grid grid-cols-2 gap-2">
                         <div className="space-y-0.5">
                            <label className="text-[9px] font-medium text-gray-400 uppercase tracking-widest pl-1">कार्यकर्ता</label>
                            <div className="flex items-center pr-1">
                               <input 
                                 list="workers" 
                                 className="w-full bg-transparent font-medium text-[15px] dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                                 value={t.name} 
                                 onChange={e => {
                                   const newName = e.target.value;
                                   const volunteer = contacts?.find((c: any) => c.name === newName);
                                   updateEvent({ 
                                     team: event.team.map((x: any) => x.id === t.id ? { ...x, name: newName, contact: volunteer?.phone || x.contact } : x) 
                                   });
                                 }} 
                                 placeholder="नाम दर्ज करें..." 
                               />
                               {t.contact && (
                                  <a href={`tel:${t.contact}`} className="text-blue-600 dark:text-blue-400 p-1 flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 rounded-full mx-1">
                                     <Phone size={12} />
                                  </a>
                               )}
                            </div>
                         </div>
                         
                         <div className="space-y-0.5 pl-2 border-l dark:border-gray-800">
                            <label className="text-[9px] font-medium text-gray-400 uppercase tracking-widest pl-1">दायित्व</label>
                            <input 
                               className="w-[90%] bg-transparent font-medium text-blue-600 outline-none text-sm placeholder:font-medium placeholder:text-blue-300/50" 
                               value={t.teamRole} 
                               onChange={e => updateEvent({ team: event.team.map((x: any) => x.id === t.id ? { ...x, teamRole: e.target.value } : x) })} 
                               placeholder="प्रमुख..." 
                            />
                         </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800 px-2 py-1.5 rounded border border-gray-100 dark:border-gray-700">
                         <input 
                            className="w-full bg-transparent font-medium text-gray-600 dark:text-gray-400 text-xs outline-none" 
                            value={t.task} 
                            onChange={e => updateEvent({ team: event.team.map((x: any) => x.id === t.id ? { ...x, task: e.target.value } : x) })} 
                            placeholder="जिम्मे लगे कार्य..." 
                         />
                      </div>
                   </div>
                 ))}
                 {event.team.length === 0 && (
                   <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                     <p className="text-sm font-medium text-gray-400">अभी टोली में किसी को नहीं जोड़ा गया है</p>
                   </div>
                 )}
               </div>
             
          </div>
        )}

        {/* Similar maps for phases, resources, finance, reviews based on the schema mapping */}
        {activeSubTab === 'phases' && (
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">कार्यक्रम के चरण</h3>
                    <button onClick={() => updateEvent({ phases: [...event.phases, { id: uuidv4(), phase: '', startDate: '', endDate: '', task: '', workerName: '', followUp: '' }]})} className="text-blue-600 font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">+ चरण</button>
                 </div>
                 
                 <div className="space-y-4">
                    {event.phases.map((p: any) => (
                       <div key={p.id} className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-xl relative flex flex-col gap-3 shadow-sm group">
                          <button onClick={() => updateEvent({ phases: event.phases.filter((x: any) => x.id !== p.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          
                          <input 
                              className="w-[90%] bg-transparent font-bold text-lg dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                              value={p.phase} 
                              onChange={e => updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, phase: e.target.value } : x) })} 
                              placeholder="चरण का नाम..." 
                          />
                          
                          <div className="flex gap-3">
                             <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">आरंभ</label>
                                <input type="date" className="w-full bg-white dark:bg-gray-800 p-2.5 text-xs font-medium border border-transparent focus:border-gray-200 dark:focus:border-gray-700 rounded-lg outline-none" value={p.startDate} onChange={e => updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, startDate: e.target.value } : x) })} />
                             </div>
                             <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">पूर्ण</label>
                                <input type="date" className="w-full bg-white dark:bg-gray-800 p-2.5 text-xs font-medium border border-transparent focus:border-gray-200 dark:focus:border-gray-700 rounded-lg outline-none" value={p.endDate} onChange={e => updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, endDate: e.target.value } : x) })} />
                             </div>
                          </div>
                          
                          <div className="bg-white dark:bg-gray-800/50 border border-transparent focus-within:border-gray-200 dark:focus-within:border-gray-700 rounded-lg p-3">
                             <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2 flex justify-between">
                                <span>टू-डू सूची</span>
                                <span className="text-blue-500 cursor-pointer" onClick={() => {
                                    const newTodos = [...(p.todos || []), { id: uuidv4(), text: '', isCompleted: false }];
                                    updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, todos: newTodos } : x) });
                                }}>+ नया जोड़ें</span>
                             </div>
                             <div className="space-y-2">
                                {(p.todos || []).map((todo: any) => (
                                   <div key={todo.id} className="flex items-center gap-2 group/todo">
                                      <input 
                                         type="checkbox" 
                                         checked={todo.isCompleted} 
                                         onChange={e => {
                                             const newTodos = p.todos.map((t: any) => t.id === todo.id ? { ...t, isCompleted: e.target.checked } : t);
                                             updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, todos: newTodos } : x) });
                                         }} 
                                         className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" 
                                      />
                                      <input 
                                         type="text" 
                                         value={todo.text} 
                                         onChange={e => {
                                             const newTodos = p.todos.map((t: any) => t.id === todo.id ? { ...t, text: e.target.value } : t);
                                             updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, todos: newTodos } : x) });
                                         }} 
                                         className={`flex-1 bg-transparent outline-none text-sm font-medium ${todo.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-200'}`} 
                                         placeholder="नई टू-डू..." 
                                      />
                                      <button 
                                         onClick={() => {
                                             const newTodos = p.todos.filter((t: any) => t.id !== todo.id);
                                             updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, todos: newTodos } : x) });
                                         }} 
                                         className="text-gray-300 hover:text-red-500 opacity-0 group-hover/todo:opacity-100 transition-opacity"
                                      >
                                         <Trash2 size={14}/>
                                      </button>
                                   </div>
                                ))}
                                {(!p.todos || p.todos.length === 0) && !p.task && (
                                   <div className="text-xs text-gray-400 italic">कोई टू-डू नहीं है</div>
                                )}
                                {/* Backward compatibility for old task description */}
                                {p.task && (!p.todos || p.todos.length === 0) && (
                                   <div className="text-xs text-gray-400 mb-1">विरासत कार्य :</div>
                                )}
                                {p.task && (!p.todos || p.todos.length === 0) && (
                                   <textarea 
                                      className="w-full bg-gray-50 dark:bg-gray-900 border border-transparent rounded-lg p-2 font-medium text-gray-600 dark:text-gray-400 text-sm outline-none resize-none min-h-[60px]" 
                                      value={p.task} 
                                      onChange={e => updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, task: e.target.value } : x) })} 
                                   />
                                )}
                             </div>
                          </div>
                          
                          <input 
                             list="workers" 
                             className="w-full bg-transparent font-medium text-blue-600 text-sm outline-none mt-1 placeholder:font-medium placeholder:text-blue-300" 
                             value={p.workerName} 
                             onChange={e => {
                                updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, workerName: e.target.value } : x) });
                             }} 
                             placeholder="तय कार्यकर्ता..." 
                          />
                          
                          <input 
                             className="w-full bg-transparent font-medium text-indigo-600 dark:text-indigo-500 text-xs outline-none placeholder:font-medium placeholder:text-indigo-300" 
                             value={p.followUp} 
                             onChange={e => updateEvent({ phases: event.phases.map((x: any) => x.id === p.id ? { ...x, followUp: e.target.value } : x) })} 
                             placeholder="अनुवर्तन (प्रगति स्थिति)..." 
                          />
                       </div>
                    ))}
                    {event.phases.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-sm font-medium text-gray-400">अभी कोई चरण नहीं बनाया गया है</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeSubTab === 'resources' && (
           <div className="space-y-4">
              <div className="flex justify-between items-center">
                 <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">साधन - सामग्री</h3>
                 <button onClick={() => updateEvent({ resources: [...event.resources, { id: uuidv4(), itemName: '', type: '', source: 'उपलब्ध', estCost: 0, workerName: '' }]})} className="text-blue-600 font-medium text-xs bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded">+ सामग्री</button>
              </div>
              
              <div className="space-y-3">
                 {event.resources.map((r: any) => (
                    <div key={r.id} className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-xl relative grid grid-cols-2 gap-3 mt-2 shadow-sm group">
                       <button onClick={() => updateEvent({ resources: event.resources.filter((x: any) => x.id !== r.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                       
                       <input 
                          className="col-span-2 w-[90%] bg-transparent font-bold text-lg dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                          value={r.itemName} 
                          onChange={e => updateEvent({ resources: event.resources.map((x: any) => x.id === r.id ? { ...x, itemName: e.target.value } : x) })} 
                          placeholder="वस्तु का नाम..." 
                       />
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">स्रोत</label>
                          <select 
                             className="w-full bg-white dark:bg-gray-800 p-2.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-transparent focus:border-gray-200 dark:focus:border-gray-700 outline-none" 
                             value={r.source} 
                             onChange={e => updateEvent({ resources: event.resources.map((x: any) => x.id === r.id ? { ...x, source: e.target.value } : x) })}
                          >
                             <option value="उपलब्ध">उपलब्ध</option>
                             <option value="किराया">किराया</option>
                             <option value="सौजन्य">सौजन्य</option>
                             <option value="खरीद">खरीद</option>
                          </select>
                       </div>
                       
                       <div className="space-y-1">
                          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">खर्च (अनुमानित)</label>
                          <div className="relative">
                             <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-gray-400">₹</div>
                             <input 
                                type="number" 
                                className="w-full bg-white dark:bg-gray-800 p-2.5 pl-7 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-300 border border-transparent focus:border-gray-200 dark:focus:border-gray-700 outline-none" 
                                value={r.estCost || ''} 
                                onChange={e => updateEvent({ resources: event.resources.map((x: any) => x.id === r.id ? { ...x, estCost: Number(e.target.value) } : x) })} 
                                placeholder="राशि" 
                             />
                          </div>
                       </div>
                       
                       <input 
                          list="workers" 
                          className="col-span-2 bg-transparent font-medium text-blue-600 text-sm outline-none mt-2 placeholder:font-medium placeholder:text-blue-300" 
                          value={r.workerName} 
                          onChange={e => updateEvent({ resources: event.resources.map((x: any) => x.id === r.id ? { ...x, workerName: e.target.value } : x) })} 
                          placeholder="प्रबंधक / तय कार्यकर्ता..." 
                       />
                    </div>
                 ))}
                 {event.resources.length === 0 && (
                   <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                     <p className="text-sm font-medium text-gray-400">अभी कोई सामग्री नहीं जोड़ी गई है</p>
                   </div>
                 )}
              </div>
              
           </div>
        )}

        {activeSubTab === 'finance' && (
           <div className="space-y-8">
              
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-50 dark:from-indigo-900/10 dark:to-indigo-900/10 p-4 rounded-lg flex items-center justify-between border border-indigo-100 dark:border-indigo-900/20">
                 <div>
                    <div className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">कुल शेष</div>
                    <div className={`text-3xl font-medium ${currentBalance >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>₹ {currentBalance.toLocaleString()}</div>
                 </div>
                 <div className="text-right">
                    <div className="text-sm font-medium text-gray-500">आय: <span className="text-indigo-600">₹ {totalIncome.toLocaleString()}</span></div>
                    <div className="text-sm font-medium text-gray-500">व्यय: <span className="text-blue-600">₹ {totalExpense.toLocaleString()}</span></div>
                 </div>
              </div>

              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-widest">आय वृत्त</h3>
                    <button onClick={() => updateEvent({ incomes: [...event.incomes, { id: uuidv4(), date: new Date().toISOString().split('T')[0], desc: '', type: '', workerName: '', amount: 0, notes: '' }]})} className="text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded font-medium text-xs">+ आय</button>
                 </div>
                 
                 <div className="space-y-4">
                    {event.incomes.map((i: any) => (
                       <div key={i.id} className="p-4 bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-900/20 rounded-xl relative grid grid-cols-2 gap-4 shadow-sm border-l-4 border-l-indigo-500 group">
                          <button onClick={() => updateEvent({ incomes: event.incomes.filter((x: any) => x.id !== i.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          
                          <input 
                             className="col-span-2 w-[90%] bg-transparent font-bold text-lg dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                             value={i.desc} 
                             onChange={e => updateEvent({ incomes: event.incomes.map((x: any) => x.id === i.id ? { ...x, desc: e.target.value } : x) })} 
                             placeholder="आय विवरण..." 
                          />
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">राशि</label>
                             <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-indigo-600">₹</div>
                                <input 
                                   type="number" 
                                   className="w-full bg-indigo-50 dark:bg-indigo-900/10 p-2.5 pl-7 rounded-lg text-sm font-medium border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 outline-none text-indigo-700 dark:text-indigo-400" 
                                   value={i.amount || ''} 
                                   onChange={e => updateEvent({ incomes: event.incomes.map((x: any) => x.id === i.id ? { ...x, amount: Number(e.target.value) } : x) })} 
                                   placeholder="0" 
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">दिनांक</label>
                             <input 
                                type="date" 
                                className="w-full bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg text-xs font-medium border border-transparent focus:border-gray-200 dark:focus:border-gray-700 outline-none" 
                                value={i.date} 
                                onChange={e => updateEvent({ incomes: event.incomes.map((x: any) => x.id === i.id ? { ...x, date: e.target.value } : x) })} 
                             />
                          </div>
                          
                          <input 
                             list="workers" 
                             className="col-span-2 bg-transparent font-medium text-gray-500 dark:text-gray-400 text-sm outline-none mt-1 placeholder:text-gray-300" 
                             value={i.workerName} 
                             onChange={e => updateEvent({ incomes: event.incomes.map((x: any) => x.id === i.id ? { ...x, workerName: e.target.value } : x) })} 
                             placeholder="जमाकर्ता / कार्यकर्ता..." 
                          />
                       </div>
                    ))}
                    {event.incomes.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-sm font-medium text-gray-400">अभी कोई आय दर्ज नहीं की गई है</p>
                      </div>
                    )}
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-widest">व्यय वृत्त</h3>
                    <button onClick={() => updateEvent({ expenses: [...event.expenses, { id: uuidv4(), date: new Date().toISOString().split('T')[0], desc: '', type: '', workerName: '', amount: 0, notes: '' }]})} className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded font-medium text-xs">+ व्यय</button>
                 </div>
                 
                 <div className="space-y-4">
                    {event.expenses.map((e: any) => (
                       <div key={e.id} className="p-4 bg-white dark:bg-gray-900 border border-blue-100 dark:border-blue-900/20 rounded-xl relative grid grid-cols-2 gap-4 shadow-sm border-l-4 border-l-blue-500 group">
                          <button onClick={() => updateEvent({ expenses: event.expenses.filter((x: any) => x.id !== e.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          
                          <input 
                             className="col-span-2 w-[90%] bg-transparent font-bold text-lg dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                             value={e.desc} 
                             onChange={evt => updateEvent({ expenses: event.expenses.map((x: any) => x.id === e.id ? { ...x, desc: evt.target.value } : x) })} 
                             placeholder="व्यय विवरण..." 
                          />
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">राशि</label>
                             <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-blue-600">₹</div>
                                <input 
                                   type="number" 
                                   className="w-full bg-blue-50 dark:bg-blue-900/10 p-2.5 pl-7 rounded-lg text-sm font-medium border border-transparent focus:border-blue-200 dark:focus:border-blue-800 outline-none text-blue-700 dark:text-blue-400" 
                                   value={e.amount || ''} 
                                   onChange={evt => updateEvent({ expenses: event.expenses.map((x: any) => x.id === e.id ? { ...x, amount: Number(evt.target.value) } : x) })} 
                                   placeholder="0" 
                                />
                             </div>
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">दिनांक</label>
                             <input 
                                type="date" 
                                className="w-full bg-gray-50 dark:bg-gray-800 p-2.5 rounded-lg text-xs font-medium border border-transparent focus:border-gray-200 dark:focus:border-gray-700 outline-none" 
                                value={e.date} 
                                onChange={evt => updateEvent({ expenses: event.expenses.map((x: any) => x.id === e.id ? { ...x, date: evt.target.value } : x) })} 
                             />
                          </div>
                          
                          <input 
                             list="workers" 
                             className="col-span-2 bg-transparent font-medium text-gray-500 dark:text-gray-400 text-sm outline-none mt-1 placeholder:text-gray-300" 
                             value={e.workerName} 
                             onChange={evt => updateEvent({ expenses: event.expenses.map((x: any) => x.id === e.id ? { ...x, workerName: evt.target.value } : x) })} 
                             placeholder="खर्च करने वाले कार्यकर्ता..." 
                          />
                       </div>
                    ))}
                    {event.expenses.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-sm font-medium text-gray-400">अभी कोई व्यय दर्ज नहीं किया गया है</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {activeSubTab === 'gantt' && (() => {
           const gPhases = event.phases?.filter((p: any) => p.startDate && p.endDate && new Date(p.startDate).getTime() <= new Date(p.endDate).getTime())
             .map((p: any) => ({
                ...p, 
                start: new Date(p.startDate).getTime(), 
                end: new Date(p.endDate).getTime()
             }))
             .sort((a: any,b: any) => a.start - b.start) || [];
             
           if (gPhases.length === 0) {
              return (
                 <div className="py-12 flex flex-col items-center justify-center text-gray-400 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed dark:border-gray-700">
                    <CalendarIcon size={40} className="mb-3 opacity-20" />
                    <p className="font-medium text-sm">गैंट चार्ट के लिए पर्याप्त डेटा नहीं है</p>
                    <p className="text-xs font-medium mt-1">चरणों में प्रारंभ और अंत तिथि दर्ज करें।</p>
                 </div>
              );
           }

            const minDate = Math.min(...gPhases.map((p: any) => p.start)) - 86400000;
            const maxDate = Math.max(...gPhases.map((p: any) => p.end)) + 86400000;
           const totalDuration = Math.max(maxDate - minDate, 86400000); // minimum 1 day

           const today = new Date().getTime();
           const showTodayLine = today >= minDate && today <= maxDate;
           const todayLeftRatio = (today - minDate) / totalDuration;
           const todayLeftPct = (todayLeftRatio * 100).toFixed(2) + '%';

           return (
              <div className="space-y-4 mt-2">
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">गैंट चार्ट</h3>
                    <div className="text-[10px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                       {new Date(minDate).toLocaleDateString('hi-IN', {month:'short', day:'numeric'})} - {new Date(maxDate).toLocaleDateString('hi-IN', {month:'short', day:'numeric'})}
                    </div>
                 </div>
                 
                 <div className="relative pt-8 pb-2">
                    {/* Timeline labels */}
                    <div className="absolute top-0 left-0 right-0 flex justify-between text-[10px] font-medium text-gray-400 px-2">
                       <span>{new Date(minDate).toLocaleDateString('hi-IN', {month:'short', day:'numeric'})}</span>
                       <span>{new Date(minDate + totalDuration / 2).toLocaleDateString('hi-IN', {month:'short', day:'numeric'})}</span>
                       <span>{new Date(maxDate).toLocaleDateString('hi-IN', {month:'short', day:'numeric'})}</span>
                    </div>

                    <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-gray-200 dark:before:bg-gray-700">
                       {/* Grid Lines */}
                       {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                          <div 
                             key={ratio}
                             className="absolute top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-800/30 -z-10"
                             style={{ left: `${ratio * 100}%` }}
                          />
                       ))}
                       
                       {/* Today Line */}
                       {showTodayLine && (
                          <div 
                             className="absolute top-0 bottom-0 w-[2px] bg-red-500 z-10" 
                             style={{ left: todayLeftPct }}
                          >
                             <div className="absolute -top-5 -translate-x-1/2 bg-red-500 text-white text-[9px] font-medium px-1.5 py-0.5 rounded shadow-sm">आज</div>
                          </div>
                       )}

                       {gPhases.map((p: any, idx: number) => {
                          const leftRatio = (p.start - minDate) / totalDuration;
                          let widthRatio = (p.end - p.start) / totalDuration;
                          if (widthRatio < 0.05) widthRatio = 0.05; // min width visual
                          const leftPct = (leftRatio * 100).toFixed(2) + '%';
                          const widthPct = (widthRatio * 100).toFixed(2) + '%';
                          const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-indigo-500', 'bg-blue-500', 'bg-orange-500'];
                          const bgClass = colors[idx % colors.length];

                          const totalTasks = p.todos?.length || 0;
                          const doneTasks = p.todos?.filter((t: any) => t.isCompleted).length || 0;
                          const taskText = totalTasks > 0 ? ` (${doneTasks}/${totalTasks} कार्य)` : '';

                          return (
                             <div key={p.id} className="relative w-full h-14 bg-gray-50 dark:bg-gray-900/50 rounded overflow-hidden flex items-center group">
                                <div className="absolute inset-y-0 opacity-10 bg-gray-200 dark:bg-gray-700 w-full" />
                                <div 
                                   className={`absolute inset-y-1 rounded-md opacity-20 ${bgClass}`} 
                                   style={{ left: leftPct, width: widthPct }}
                                />
                                <div 
                                   className={`absolute inset-y-2 rounded shadow-sm ${bgClass} transition-all duration-500 group-hover:brightness-110 flex items-center px-2 overflow-hidden whitespace-nowrap text-[10px] font-medium text-white`} 
                                   style={{ left: leftPct, width: widthPct, minWidth: '40px' }}
                                >
                                   <span className="truncate drop-shadow-md z-10">{p.phase || 'अनाम चरण'}{taskText}</span>
                                </div>
                                
                                <div className="absolute left-0 right-0 px-2 pointer-events-none flex justify-between items-center h-full">
                                   <span className="text-[9px] font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 px-1 rounded backdrop-blur z-20">
                                     {new Date(p.start).toLocaleDateString('hi-IN', {day:'numeric', month:'short'})}
                                   </span>
                                   <span className="text-[9px] font-medium text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-800/80 px-1 rounded backdrop-blur z-20">
                                     {new Date(p.end).toLocaleDateString('hi-IN', {day:'numeric', month:'short'})}
                                   </span>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 </div>
              </div>
           );
        })()}

        {activeSubTab === 'execution' && (
           <div className="space-y-8">
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">समीक्षा</h3>
                    <button onClick={() => updateEvent({ reviews: [...event.reviews, { id: uuidv4(), deptName: '', attendance: '', positive: '', improvement: '', followUp: '' }]})} className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded font-medium text-xs">+ समीक्षा</button>
                 </div>
                 
                 <div className="space-y-4">
                    {event.reviews.map((r: any) => (
                       <div key={r.id} className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700/50 rounded-xl relative flex flex-col gap-3 shadow-sm group border-l-4 border-l-blue-500">
                          <button onClick={() => updateEvent({ reviews: event.reviews.filter((x: any) => x.id !== r.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          
                          <input 
                             className="w-[90%] bg-transparent font-bold text-lg dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600" 
                             value={r.deptName} 
                             onChange={e => updateEvent({ reviews: event.reviews.map((x: any) => x.id === r.id ? { ...x, deptName: e.target.value } : x) })} 
                             placeholder="समीक्षा विषय / कार्यविभाग..." 
                          />
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">उपस्थिति / सहभागिता</label>
                             <input 
                                className="w-full bg-white dark:bg-gray-800 p-2.5 border border-transparent focus:border-gray-200 dark:focus:border-gray-700 rounded-lg font-medium text-gray-600 dark:text-gray-400 text-sm outline-none" 
                                value={r.attendance} 
                                onChange={e => updateEvent({ reviews: event.reviews.map((x: any) => x.id === r.id ? { ...x, attendance: e.target.value } : x) })} 
                                placeholder="उपस्थित / अपेक्षित विवरण..." 
                             />
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-indigo-600 dark:text-indigo-500 uppercase tracking-widest pl-1">सकारात्मक बिंदु</label>
                             <textarea 
                                className="w-full bg-indigo-50 dark:bg-indigo-900/10 p-3 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 rounded-lg font-medium text-indigo-700 dark:text-indigo-400 text-sm outline-none resize-none min-h-[60px]" 
                                value={r.positive} 
                                onChange={e => updateEvent({ reviews: event.reviews.map((x: any) => x.id === r.id ? { ...x, positive: e.target.value } : x) })} 
                                placeholder="क्या अच्छा रहा..." 
                             />
                          </div>
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-blue-500 uppercase tracking-widest pl-1">सुधार के बिंदु</label>
                             <textarea 
                                className="w-full bg-blue-50 dark:bg-blue-900/10 p-3 border border-transparent focus:border-blue-200 dark:focus:border-blue-800 rounded-lg font-medium text-blue-600 dark:text-blue-400 text-sm outline-none resize-none min-h-[60px]" 
                                value={r.improvement} 
                                onChange={e => updateEvent({ reviews: event.reviews.map((x: any) => x.id === r.id ? { ...x, improvement: e.target.value } : x) })} 
                                placeholder="क्या बेहतर हो सकता था..." 
                             />
                          </div>
                          
                          <input 
                             className="w-full bg-transparent font-medium text-blue-600 dark:text-blue-500 text-sm outline-none mt-1 placeholder:font-medium placeholder:text-blue-300" 
                             value={r.followUp} 
                             onChange={e => updateEvent({ reviews: event.reviews.map((x: any) => x.id === r.id ? { ...x, followUp: e.target.value } : x) })} 
                             placeholder="अनुवर्तन निर्णय..." 
                          />
                       </div>
                    ))}
                    {event.reviews.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-sm font-medium text-gray-400">अभी कोई समीक्षा दर्ज नहीं की गई है</p>
                      </div>
                    )}
                 </div>
              </div>
              
              <div>
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest text-gray-400">आकस्मिक योजना (Plan B)</h3>
                    <button onClick={() => updateEvent({ contingencies: [...event.contingencies, { id: uuidv4(), challenge: '', solution: '', workerName: '', contact: '' }]})} className="text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded font-medium text-xs">+ योजना</button>
                 </div>
                 
                 <div className="space-y-4">
                    {event.contingencies.map((c: any) => (
                       <div key={c.id} className="p-4 bg-gray-50 dark:bg-gray-900 border border-dashed border-blue-300 dark:border-blue-900/50 rounded-xl relative flex flex-col gap-3 shadow-sm group">
                          <button onClick={() => updateEvent({ contingencies: event.contingencies.filter((x: any) => x.id !== c.id) })} className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                          
                          <input 
                             className="w-[90%] bg-transparent font-bold text-blue-600 dark:text-blue-500 outline-none text-lg placeholder:text-blue-300 dark:placeholder:text-blue-800" 
                             value={c.challenge} 
                             onChange={e => updateEvent({ contingencies: event.contingencies.map((x: any) => x.id === c.id ? { ...x, challenge: e.target.value } : x) })} 
                             placeholder="सम्भावित चुनौती..." 
                          />
                          
                          <div className="space-y-1">
                             <label className="text-[10px] font-medium text-indigo-600 dark:text-indigo-500 uppercase tracking-widest pl-1">संभावित समाधान</label>
                             <textarea 
                                className="w-full bg-white dark:bg-gray-800/50 p-3 border border-transparent focus:border-indigo-200 dark:focus:border-indigo-800 rounded-lg font-medium text-indigo-700 dark:text-indigo-500 text-sm outline-none resize-none min-h-[60px] placeholder:text-indigo-300" 
                                value={c.solution} 
                                onChange={e => updateEvent({ contingencies: event.contingencies.map((x: any) => x.id === c.id ? { ...x, solution: e.target.value } : x) })} 
                                placeholder="चुनौती आने पर क्या करेंगे..." 
                             />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-1">
                             <div className="col-span-2 space-y-1">
                                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest pl-1">जिम्मेदार व्यक्ति</label>
                                <div className="flex items-center gap-2 w-full bg-white dark:bg-gray-800 p-2.5 border border-transparent focus-within:border-gray-200 dark:focus-within:border-gray-700 rounded-lg">
                                   <input 
                                      list="workers" 
                                      className="flex-1 bg-transparent font-medium text-gray-700 dark:text-gray-300 text-sm outline-none" 
                                      value={c.workerName} 
                                      onChange={e => {
                                        const newName = e.target.value;
                                        const volunteer = contacts?.find((v: any) => v.name === newName);
                                        updateEvent({ contingencies: event.contingencies.map((x: any) => x.id === c.id ? { ...x, workerName: newName, contact: volunteer?.phone || x.contact } : x) });
                                      }} 
                                      placeholder="तय कार्यकर्ता..." 
                                   />
                                   {c.contact && (
                                     <a href={`tel:${c.contact}`} className="text-blue-600 dark:text-blue-400 p-1.5 flex-shrink-0 bg-blue-50 dark:bg-blue-900/30 rounded-full mx-1 hover:bg-blue-100 transition-colors">
                                        <Phone size={14} />
                                     </a>
                                   )}
                                </div>
                             </div>
                          </div>
                       </div>
                    ))}
                    {event.contingencies.length === 0 && (
                      <div className="text-center py-6 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                        <p className="text-sm font-medium text-gray-400">कोई आकस्मिक योजना नहीं बनाई गई है</p>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

const SubTabBtn = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`px-4 py-2 min-w-max flex flex-col items-center justify-center gap-1 rounded-md flex-none transition-all snap-start ${active ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium shadow-sm' : 'bg-transparent text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'}`}>
    {React.cloneElement(icon, { size: 18 })}
    <span className="text-[10px] uppercase tracking-wider">{label}</span>
  </button>
);
