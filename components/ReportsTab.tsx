import React, { useState, useMemo } from 'react';
import { FileText, ArrowLeft, Download, Calendar as CalendarIcon, Filter, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { Contact, TripPlan, Meeting, Village, Khand, Mandal } from '../types';

interface ReportsTabProps {
  contacts: Contact[];
  trips: TripPlan[];
  events: any[];
  villages: Village[];
  khands: Khand[];
  mandals: Mandal[];
  onBack: () => void;
  setExportTarget: (target: {title: string; data: any[], isGeneric?: boolean} | null) => void;
}

export const ReportsTab: React.FC<ReportsTabProps> = ({
  contacts, trips, events, villages, khands, mandals, onBack, setExportTarget
}) => {
  const [reportType, setReportType] = useState<'contacts' | 'trips' | 'events' | 'villages'>('trips');
  const [startDate, setStartDate] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const getKhandName = (id: string) => khands.find(k => k.id === id)?.name || 'अज्ञात';
  const getMandalName = (id: string) => mandals.find(m => m.id === id)?.name || 'अज्ञात';
  const getVillageName = (id: string) => villages.find(v => v.id === id)?.name || 'अज्ञात';

  const generatedReport = useMemo(() => {
    if (!startDate || !endDate) return null;
    
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));
    
    let data: any[] = [];
    let summary: any = {};
    let title = '';

    if (reportType === 'trips') {
      title = 'प्रवास रिपोर्ट';
      const filtered = trips.filter(t => {
        if (!t.date) return false;
        try {
          return isWithinInterval(parseISO(t.date), { start, end });
        } catch(e) { return false; }
      });
      data = filtered.map(t => ({
        'तिथि': t.date ? format(parseISO(t.date), 'dd-MM-yyyy') : '',
        'खंड': getKhandName(t.khandId),
        'मंडल': getMandalName(t.mandalId),
        'गांव/बस्ती': t.villageIds.map(getVillageName).join(', '),
        'विवरण': t.notes || '',
        'स्थिति': t.isCompleted ? 'पूर्ण' : 'लंबित'
      }));
      summary = {
        'कुल प्रवास': filtered.length,
        'पूर्ण प्रवास': filtered.filter(t => t.isCompleted).length,
        'लंबित प्रवास': filtered.filter(t => !t.isCompleted).length
      };
    } 
    else if (reportType === 'events') {
      title = 'कार्यक्रम/बैठक रिपोर्ट';
      const filtered = events.filter(e => {
        if (!e.date) return false;
        try {
          return isWithinInterval(parseISO(e.date), { start, end });
        } catch(e) { return false; }
      });
      data = filtered.map(e => ({
         'तिथि': e.date ? format(parseISO(e.date), 'dd-MM-yyyy') : '',
         'शीर्षक': e.title,
         'श्रेणी': e.category,
         'स्थान': e.location || '',
         'कुल आमंत्रित': Object.keys(e.attendance || {}).length,
         'उपस्थित संख्या': (e.presentPeopleIds || []).length
      }));
      summary = {
        'कुल कार्यक्रम': filtered.length,
        'औसत उपस्थिति': filtered.length > 0 ? Math.round(filtered.reduce((acc, e) => acc + (e.presentPeopleIds?.length || 0), 0) / filtered.length) : 0
      };
    }
    else if (reportType === 'villages') {
      title = 'कार्यस्थिति (शाखा/मिलन) रिपोर्ट';
      const filtered = villages.filter(v => v.stage !== 'कुछ नहीं');
      data = filtered.map(v => ({
         'गांव/बस्ती': v.name,
         'मंडल': getMandalName(v.mandalId),
         'कार्यस्थिति': v.stage || 'कुछ नहीं',
         'विशेषता': v.specialty || ''
      }));
      summary = {
        'कुल सक्रिय स्थान': filtered.length,
        'शाखा': filtered.filter(v => v.stage === 'शाखा').length,
        'मिलन': filtered.filter(v => v.stage === 'मिलन').length,
        'मंडली': filtered.filter(v => v.stage === 'मंडली').length,
        'संपर्क': filtered.filter(v => v.stage === 'संपर्क').length
      };
    }
    else if (reportType === 'contacts') {
      title = 'कार्यकर्ता सूची';
      // For contacts, we just show all or filter by lastVisited. 
      // Let's just show all for the report to keep it simple, or filter by recent history if needed.
      // Usually, contact reports are full exports.
      data = contacts.map(c => {
         return {
           'नाम': c.name,
           'फोन': c.phone,
           'श्रेणी': c.category,
           'अवस्था': c.status,
           'खंड': getKhandName(c.khandId),
           'मंडल': getMandalName(c.mandalId),
           'रक्त समूह': c.volunteerProfile?.bloodGroup || '',
           'अंतिम संपर्क': c.lastVisited ? format(parseISO(c.lastVisited), 'dd-MM-yyyy') : 'कभी नहीं'
         };
      });
      summary = {
        'कुल कार्यकर्ता': contacts.length,
        'सक्रिय शक्ति': contacts.filter(c => c.status === 'सक्रिय शक्ति').length,
        'संचित शक्ति': contacts.filter(c => c.status === 'संचित शक्ति').length
      };
    }

    return { title, data, summary };
  }, [reportType, startDate, endDate, trips, events, villages, contacts, khands, mandals]);

  const handleExport = () => {
    if (generatedReport) {
      setExportTarget({
         title: generatedReport.title,
         data: generatedReport.data,
         isGeneric: true
      });
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm active:scale-90 transition-all">
           <ArrowLeft size={20} className="dark:text-white"/>
        </button>
        <h1 className="text-xl font-bold text-blue-900 dark:text-blue-400 tracking-normal">रिपोर्ट्स</h1>
      </header>

      <div className="space-y-4">
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-4 rounded-xl shadow-sm space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5 block">रिपोर्ट का प्रकार</label>
            <select 
              className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-sm font-medium dark:text-white outline-none"
              value={reportType}
              onChange={(e: any) => setReportType(e.target.value)}
            >
              <option value="trips">प्रवास रिपोर्ट</option>
              <option value="events">कार्यक्रम / बैठक रिपोर्ट</option>
              <option value="villages">कार्यस्थिति रिपोर्ट (शाखा/मिलन)</option>
              <option value="contacts">कार्यकर्ता समग्र रिपोर्ट</option>
            </select>
          </div>

          {(reportType === 'trips' || reportType === 'events') && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5 block">दिनांक से</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input 
                    type="date" 
                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 pl-9 p-3 rounded-lg text-sm font-medium dark:text-white outline-none"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1.5 block">दिनांक तक</label>
                <div className="relative">
                  <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input 
                    type="date" 
                    className="w-full bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 pl-9 p-3 rounded-lg text-sm font-medium dark:text-white outline-none"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {generatedReport && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 p-4 rounded-xl">
              <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                <BarChart3 size={16} /> सारांश ({generatedReport.title})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(generatedReport.summary).map(([key, value]) => (
                  <div key={key} className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg border border-blue-100/50 dark:border-blue-800/20 shadow-sm">
                    <div className="text-[10px] font-medium text-gray-500 uppercase">{key}</div>
                    <div className="text-xl font-bold dark:text-white text-blue-950 mt-0.5">{String(value)}</div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              onClick={handleExport}
              disabled={generatedReport.data.length === 0}
              className="w-full p-4 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
            >
              <Download size={20} />
              <span>एक्सपोर्ट करें ({generatedReport.data.length} रिकॉर्ड)</span>
            </button>
            
            {generatedReport.data.length > 0 && (
              <div className="bg-white/40 dark:bg-[#080d19]/40 border border-white/50 dark:border-gray-800 p-4 rounded-xl shadow-sm text-center">
                 <div className="text-xs font-medium text-gray-500">
                   एक्सपोर्ट करने के बाद आपको PDF, CSV, JSON या Text फॉर्मेट चुनने का विकल्प मिलेगा।
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
