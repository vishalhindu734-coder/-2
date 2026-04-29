import React, { useState } from 'react';
import { ArrowLeft, Download, FileJson, FileText, TableProperties, FileDown, CheckCircle2, Circle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getAgeCategory, calculateAge, getHighestShikshan } from '../App';

export const ExportModal = ({ isOpen, onClose, data, villages, mandals, title = 'export', isGeneric = false }: any) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'json' | 'txt'>('csv');
  const [selectedColumns, setSelectedColumns] = useState({
    name: true,
    phone: true,
    village: true,
    mandal: true,
    category: true,
    status: true,
    age: false,
    bloodGroup: false,
    fatherName: false,
    shikshan: false,
    responsibility: false,
    shakha: false,
    sanghEntryYear: false,
    profession: false,
    education: false,
    uniformStatus: false,
    vehicle: false,
    areasOfInterest: false,
    availability: false
  });

  if (!isOpen) return null;

  const toggleColumn = (key: keyof typeof selectedColumns) => {
    setSelectedColumns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getExportDataRows = () => {
    if (isGeneric) return data;
    return data.map((c: any) => {
      const vName = villages.find((v: any) => v.id === c.villageId)?.name || 'अज्ञात';
      const mName = mandals.find((m: any) => m.id === c.mandalId)?.name || 'अज्ञात';
      const ageStr = c.volunteerProfile?.dob ? `${calculateAge(c.volunteerProfile.dob)} वर्ष` : '-';
      const shikshanStr = getHighestShikshan(c.volunteerProfile?.sanghTraining) || '-';

      const row: any = {};
      if (selectedColumns.name) row['नाम'] = c.name;
      if (selectedColumns.phone) row['फ़ोन'] = c.phone;
      if (selectedColumns.village) row['ग्राम/बस्ती'] = vName;
      if (selectedColumns.mandal) row['मण्डल'] = mName;
      if (selectedColumns.category) row['श्रेणी'] = c.category;
      if (selectedColumns.status) row['स्थिति'] = c.status;
      if (selectedColumns.age) row['आयु'] = ageStr;
      if (selectedColumns.bloodGroup) row['रक्त समूह'] = c.volunteerProfile?.bloodGroup || '-';
      if (selectedColumns.fatherName) row['पिता का नाम'] = c.volunteerProfile?.fatherName || '-';
      if (selectedColumns.shikshan) row['शिक्षण'] = shikshanStr;
      if (selectedColumns.responsibility) row['दायित्व'] = c.volunteerProfile?.currentResponsibility || '-';
      if (selectedColumns.shakha) row['शाखा/मिलन'] = c.volunteerProfile?.currentShakha || '-';
      if (selectedColumns.sanghEntryYear) row['प्रवेश वर्ष'] = c.volunteerProfile?.sanghEntryYear || '-';
      if (selectedColumns.profession) row['व्यवसाय'] = c.volunteerProfile?.profession || '-';
      if (selectedColumns.education) row['शिक्षा'] = c.volunteerProfile?.education || '-';
      if (selectedColumns.uniformStatus) row['गणवेश'] = c.volunteerProfile?.uniformStatus || '-';
      if (selectedColumns.vehicle) row['वाहन'] = c.volunteerProfile?.vehicle || '-';
      if (selectedColumns.areasOfInterest) row['रुचि के क्षेत्र'] = c.volunteerProfile?.areasOfInterest?.join(', ') || '-';
      if (selectedColumns.availability) row['उपलब्धता'] = c.volunteerProfile?.availability?.join(', ') || '-';

      return row;
    });
  };

  const handleExport = () => {
    const rows = getExportDataRows();
    if (rows.length === 0) return alert('कोई डेटा नहीं है');

    const headers = Object.keys(rows[0]);

    if (selectedFormat === 'json') {
      const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.json`;
      a.click();
    } 
    else if (selectedFormat === 'csv') {
      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.csv`;
      a.click();
    }
    else if (selectedFormat === 'pdf') {
       const printWindow = window.open('', '_blank');
       if (!printWindow) {
         alert('पॉप-अप ब्लॉक कर दिया गया है। कृपया ब्राउज़र में पॉप-अप की अनुमति दें।');
         return;
       }

       let html = `
       <!DOCTYPE html>
       <html lang="hi" dir="ltr">
       <head>
         <meta charset="utf-8">
         <title>${title}</title>
         <style>
           @page { size: auto; margin: 15mm; }
           body {
             background-color: #ffffff;
             color: #000000;
             font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Mangal", "Noto Sans Devanagari";
             margin: 0;
             padding: 0;
           }
           h2 { text-align: center; color: #1e3a8a; font-size: 24px; margin-bottom: 20px; }
           .meta { text-align: right; font-size: 14px; margin-bottom: 10px; color: #475569; }
           table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 20px; }
           th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
           th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
           tr:nth-child(even) { background-color: #f8fafc; }
           .footer { margin-top: 20px; text-align: center; font-size: 11px; color: #64748b; }
           .no-print { background: #eff6ff; padding: 15px; text-align: center; margin-bottom: 20px; border-bottom: 1px solid #bfdbfe; }
           .no-print p { margin: 0 0 10px 0; color: #1e3a8a; font-weight: bold; }
           .btn { background: #2563eb; color: white; border: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; font-weight: bold; }
           .btn-outline { background: white; color: #334155; border: 1px solid #cbd5e1; padding: 8px 16px; border-radius: 6px; font-size: 14px; cursor: pointer; margin-left: 10px; font-weight: bold; }
           @media print {
             .no-print { display: none; }
             body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
             th { background-color: #f1f5f9 !important; }
           }
         </style>
       </head>
       <body>
         <div class="no-print">
           <p>पीडीएफ के रूप में सहेजने के लिए: डेस्टिनेशन ड्रॉपडाउन में 'Save as PDF' (पीडीएफ के रूप में सहेजें) चुनें।</p>
           <button class="btn" onclick="window.print()">प्रिंट / पीडीएफ सहेजें</button>
           <button class="btn-outline" onclick="window.close()">बंद करें</button>
         </div>
         <h2>${title}</h2>
         <div class="meta">कुल संपर्क: <strong>${rows.length}</strong></div>
         <table>
           <thead>
             <tr>
               ${headers.map(h => `<th>${h}</th>`).join('')}
             </tr>
           </thead>
           <tbody>
             ${rows.map((row: any) => `
               <tr>
                 ${headers.map(h => `<td>${row[h] || ''}</td>`).join('')}
               </tr>
             `).join('')}
           </tbody>
         </table>
         <div class="footer">प्रवास-प्लान — जेनरेट किया गया: ${new Date().toLocaleDateString('hi-IN')}</div>
         <script>
           window.onload = function() { setTimeout(function() { window.print(); }, 500); };
         </script>
       </body>
       </html>
       `;

       printWindow.document.write(html);
       printWindow.document.close();
    }
    else if (selectedFormat === 'txt') {
      let txtContent = `सूची: ${title}\nकुल सदस्य: ${rows.length}\n\n`;
      rows.forEach((row: any, i: number) => {
        txtContent += `*${i+1}. ${row['नाम'] || ''}*\n`;
        headers.forEach(h => {
          if (h !== 'नाम') {
            txtContent += `${h}: ${row[h]}\n`;
          }
        });
        txtContent += `\n`;
      });

      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title}.txt`;
      a.click();
    }
    onClose();
  };

  const columnsList = [
    { id: 'name', label: 'नाम' },
    { id: 'phone', label: 'फ़ोन' },
    { id: 'village', label: 'ग्राम/बस्ती' },
    { id: 'mandal', label: 'मण्डल' },
    { id: 'category', label: 'श्रेणी' },
    { id: 'status', label: 'स्थिति' },
    { id: 'age', label: 'आयु' },
    { id: 'fatherName', label: 'पिता का नाम' },
    { id: 'bloodGroup', label: 'रक्त समूह' },
    { id: 'shakha', label: 'शाखा/मिलन' },
    { id: 'responsibility', label: 'दायित्व' },
    { id: 'shikshan', label: 'शिक्षण' },
    { id: 'sanghEntryYear', label: 'प्रवेश वर्ष' },
    { id: 'profession', label: 'व्यवसाय' },
    { id: 'education', label: 'शिक्षा' },
    { id: 'vehicle', label: 'वाहन' },
    { id: 'uniformStatus', label: 'गणवेश' },
    { id: 'areasOfInterest', label: 'रुचि' },
    { id: 'availability', label: 'उपलब्धता' },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0c1222] rounded-t-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
             <div>
               <h2 className="text-xl font-bold dark:text-white tracking-normal">डेटा एक्सपोर्ट</h2>
               <div className="text-xs font-medium text-gray-500 uppercase tracking-widest">{data.length} संपर्क चयनित</div>
             </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          {!isGeneric && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">कॉलम चुनें (Select Columns)</h3>
              <div className="grid grid-cols-2 gap-2">
                {columnsList.map(col => {
                  const isSelected = selectedColumns[col.id as keyof typeof selectedColumns];
                  return (
                    <button 
                      key={col.id} 
                      onClick={() => toggleColumn(col.id as keyof typeof selectedColumns)}
                      className={`flex items-center gap-2 p-2.5 rounded-xl border ${isSelected ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-800'}`}
                    >
                      {isSelected ? <CheckCircle2 size={18} className="text-blue-600"/> : <Circle size={18} className="text-gray-400"/>}
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'}`}>{col.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">प्रारूप (Format)</h3>
            <div className="flex gap-2 p-1 bg-gray-100/50 dark:bg-gray-800/50 rounded-2xl overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setSelectedFormat('csv')} 
                className={`flex flex-col items-center gap-2 py-3 px-4 min-w-[72px] rounded-xl font-medium text-xs transition-all ${selectedFormat === 'csv' ? 'bg-white dark:bg-[#151b2b] text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <TableProperties size={24} />
                <span>CSV</span>
              </button>
              <button 
                onClick={() => setSelectedFormat('pdf')} 
                className={`flex flex-col items-center gap-2 py-3 px-4 min-w-[72px] rounded-xl font-medium text-xs transition-all ${selectedFormat === 'pdf' ? 'bg-white dark:bg-[#151b2b] text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <FileDown size={24} />
                <span>PDF</span>
              </button>
              <button 
                onClick={() => setSelectedFormat('txt')} 
                className={`flex flex-col items-center gap-2 py-3 px-4 min-w-[72px] rounded-xl font-medium text-xs transition-all ${selectedFormat === 'txt' ? 'bg-white dark:bg-[#151b2b] text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <FileText size={24} />
                <span>Text</span>
              </button>
              <button 
                onClick={() => setSelectedFormat('json')} 
                className={`flex flex-col items-center gap-2 py-3 px-4 min-w-[72px] rounded-xl font-medium text-xs transition-all ${selectedFormat === 'json' ? 'bg-white dark:bg-[#151b2b] text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-white/50'}`}
              >
                <FileJson size={24} />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-[#070b14] border-t border-gray-100 dark:border-gray-800/50 pb-8 shrink-0">
           <button 
             onClick={handleExport}
             className="w-full bg-blue-600 text-white font-medium p-4 rounded-xl shadow-[0_8px_16px_-4px_rgba(37,99,235,0.4)] active:scale-95 transition-all flex justify-center items-center gap-2"
           >
             <Download size={20} />
             अभी एक्सपोर्ट करें ({selectedFormat.toUpperCase()})
           </button>
        </div>
      </div>
    </div>
  );
};
