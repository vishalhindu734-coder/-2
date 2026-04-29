import fs from 'fs';

let content = fs.readFileSync('App.tsx', 'utf-8');

// 1. Pass villages to CalendarTab
const searchStr1 = `<CalendarTab 
            trips={trips} 
            contacts={contacts} 
            meetings={meetings}
            khands={khands} 
            mandals={mandals} 
            eventCategories={eventCategories}`;

const replaceStr1 = `<CalendarTab 
            trips={trips} 
            contacts={contacts} 
            meetings={meetings}
            khands={khands} 
            mandals={mandals} 
            villages={villages}
            eventCategories={eventCategories}`;

if (content.includes(searchStr1)) {
  content = content.replace(searchStr1, replaceStr1);
}

// 2. update CalendarTab definition
const searchStr2 = `const CalendarTab = ({ 
  trips, 
  contacts, 
  meetings,
  khands, 
  mandals, 
  eventCategories,`;

const replaceStr2 = `const CalendarTab = ({ 
  trips, 
  contacts, 
  meetings,
  khands, 
  mandals, 
  villages,
  eventCategories,`;

if (content.includes(searchStr2)) {
  content = content.replace(searchStr2, replaceStr2);
}

// 3. update getDayData to include karyas
const searchStr3 = `const getDayData = (day: Date) => {
    return {
      trips: filteredTrips.filter((t: any) => isSameDay(parseISO(t.date), day)),
      visits: filteredVisits.filter((v: any) => isSameDay(parseISO(v.date), day)),
      meetings: filteredMeetings.filter((m: any) => isSameDay(parseISO(m.date), day))
    };
  };`;

const replaceStr3 = `const getDayData = (day: Date) => {
    const hindiDays = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const currentDayStr = hindiDays[day.getDay()];
    
    // Filter Karyas
    const karyas = villages.filter((v: any) => {
      // Apply area filter
      if (dashKhand !== 'all') {
        const m = mandals.find((x:any) => x.id === v.mandalId);
        if (!m || m.khandId !== dashKhand) return false;
      }
      if (dashMandal !== 'all' && v.mandalId !== dashMandal) return false;

      // Filter by day
      if (v.stage === VillageStage.SHAKHA) return true; // Daily
      if (v.stage === VillageStage.MILAN) {
        return v.karyaDetails?.dayOfWeek === currentDayStr;
      }
      if (v.stage === VillageStage.MANDALI || v.stage === VillageStage.SAMPARK) {
         // Mandali / Sampark might not have an exact parsable day, so we show it if the text contains the day string
         if (!v.karyaDetails?.daysOfMonth && !v.karyaDetails?.notes) return false;
         return Boolean(v.karyaDetails?.daysOfMonth?.includes(currentDayStr) || v.karyaDetails?.notes?.includes(currentDayStr));
      }
      return false;
    });

    return {
      trips: filteredTrips.filter((t: any) => isSameDay(parseISO(t.date), day)),
      visits: filteredVisits.filter((v: any) => isSameDay(parseISO(v.date), day)),
      meetings: filteredMeetings.filter((m: any) => isSameDay(parseISO(m.date), day)),
      karyas
    };
  };`;

if (content.includes(searchStr3)) {
  content = content.replace(searchStr3, replaceStr3);
}

// 4. render dot in Calendar grid
const searchStr4 = `{data.meetings.length > 0 && (
                    <div className="flex gap-0.5">
                      {data.meetings.slice(0, 2).map((m: any) => (
                        <div key={m.id} className={\`\${isSelected ? 'text-white/80' : 'text-purple-500'}\`}>{getEventIcon(m.category)}</div>
                      ))}
                    </div>
                  )}
                  {data.trips.length > 0 && <div className={\`w-1 h-1 rounded-full \${isSelected ? 'bg-white' : 'bg-orange-500'}\`} />}
                  {data.visits.length > 0 && <div className={\`w-1 h-1 rounded-full \${isSelected ? 'bg-white/50' : 'bg-blue-400'}\`} />}
                </div>`;

const replaceStr4 = `{data.meetings.length > 0 && (
                    <div className="flex gap-0.5">
                      {data.meetings.slice(0, 2).map((m: any) => (
                        <div key={m.id} className={\`\${isSelected ? 'text-white/80' : 'text-purple-500'}\`}>{getEventIcon(m.category)}</div>
                      ))}
                    </div>
                  )}
                  {data.trips.length > 0 && <div className={\`w-1 h-1 rounded-full \${isSelected ? 'bg-white' : 'bg-orange-500'}\`} />}
                  {data.visits.length > 0 && <div className={\`w-1 h-1 rounded-full \${isSelected ? 'bg-white/50' : 'bg-blue-400'}\`} />}
                  {data.karyas.length > 0 && <div className={\`w-1 h-1 rounded-full \${isSelected ? 'bg-white/90' : 'bg-emerald-500'}\`} />}
                </div>`;

if (content.includes(searchStr4)) {
  content = content.replace(searchStr4, replaceStr4);
}

// 5. Render details below calendar
const searchStr5 = `<div className="space-y-4">
        <h3 className="text-sm font-black dark:text-white px-1">
          {format(selectedDate, 'd MMMM')} का विवरण
        </h3>
        
        {selectedData.meetings.map((m: any) => (`

const replaceStr5 = `<div className="space-y-4">
        <h3 className="text-sm font-black dark:text-white px-1">
          {format(selectedDate, 'd MMMM')} का विवरण
        </h3>

        {selectedData.karyas?.map((k: any) => (
           <div key={k.id} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-4 rounded-lg flex items-center gap-4 transition-all mb-3 text-left">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-md shadow-md shadow-emerald-500/20">
                 <Rocket size={18} />
              </div>
              <div className="flex-1">
                 <div className="text-[10px] font-black text-emerald-600 uppercase flex gap-2 items-center">कार्यस्थिति <span className="bg-emerald-200 dark:bg-emerald-800 px-1 py-0.5 rounded text-[8px]">{k.stage}</span></div>
                 <div className="font-bold dark:text-white text-sm">{k.name} ({mandals.find((m:any) => m.id === k.mandalId)?.name})</div>
                 <div className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1 max-w-[250px] leading-relaxed">
                   {(k.karyaDetails?.time || k.karyaDetails?.location) && <span className="block">{k.karyaDetails?.time ? k.karyaDetails.time + ' बजे' : ''} {k.karyaDetails?.location ? '• ' + k.karyaDetails.location : ''}</span>}
                   {k.stage === VillageStage.MANDALI && k.karyaDetails?.daysOfMonth && <span className="block mt-0.5 opacity-80">{k.karyaDetails.daysOfMonth}</span>}
                   {k.karyaDetails?.notes && <span className="block mt-0.5 italic opacity-80">{k.karyaDetails.notes}</span>}
                 </div>
              </div>
           </div>
        ))}
        
        {selectedData.meetings.map((m: any) => (`

if (content.includes(searchStr5)) {
  content = content.replace(searchStr5, replaceStr5);
}

const searchStr6 = `{selectedData.trips.length === 0 && selectedData.visits.length === 0 && selectedData.meetings.length === 0 ? (`

const replaceStr6 = `{selectedData.trips.length === 0 && selectedData.visits.length === 0 && selectedData.meetings.length === 0 && selectedData.karyas?.length === 0 ? (`

if (content.includes(searchStr6)) {
  content = content.replace(searchStr6, replaceStr6);
}

fs.writeFileSync('App.tsx', content);
console.log('Calendar integration done');
