import * as XLSX from 'xlsx';
import { Contact, Status, VolunteerProfile, Khand, Mandal, Village, VisitHistory } from './types';

export const VOLUNTEER_EXCEL_COLUMNS = [
  'नाम*',
  'फ़ोन*',
  'खंड*',
  'मंडल*',
  'गाँव/बस्ती*',
  'श्रेणी',
  'शक्ति (Status)',
  'पिता का नाम',
  'जन्म तिथि (YYYY-MM-DD)',
  'रक्त समूह',
  'वैवाहिक स्थिति',
  'वैकल्पिक फ़ोन',
  'ईमेल',
  'पता',
  'शिक्षा',
  'व्यवसाय',
  'कार्यालय विवरण',
  'संघ प्रवेश वर्ष',
  'वर्तमान शाखा',
  'वर्तमान दायित्व',
  'पूर्व दायित्व (कोमा से अलग)',
  'प्राथमिक वर्ग (वर्ष)',
  'प्राथमिक वर्ग (स्थान)',
  'प्रथम वर्ष (वर्ष)',
  'प्रथम वर्ष (स्थान)',
  'द्वितीय वर्ष (वर्ष)',
  'द्वितीय वर्ष (स्थान)',
  'तृतीय वर्ष (वर्ष)',
  'तृतीय वर्ष (स्थान)',
  'गणवेश स्थिति',
  'वाहन',
  'प्रतिज्ञावान (हाँ/नहीं)',
  'घोष वाद्य',
  'विशेष कौशल',
  'रुचि के क्षेत्र (कोमा से अलग)',
  'उपलब्धता (कोमा से अलग)',
  'अन्य विवरण'
];

export const generateVolunteerTemplate = () => {
  const ws = XLSX.utils.aoa_to_sheet([VOLUNTEER_EXCEL_COLUMNS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
  
  // Add some sample data
  const sampleData = [
    [
      'राम कुमार',
      '9876543210',
      'खंड 1',
      'मंडल A',
      'गाँव X',
      'कार्यकर्ता',
      'सक्रिय शक्ति',
      'श्याम कुमार',
      '1995-05-15',
      'O+',
      'विवाहित',
      '9876543211',
      'ram@example.com',
      'गाँव X, जिला Y',
      'BA',
      'खेती',
      '-',
      '2010',
      'विजय शाखा',
      'मुख्य शिक्षक',
      'गट नायक, शाखा कार्यवाह',
      '2012', 'गाँव X',
      '2014', 'शहर Y',
      '2016', 'क्षेत्र Z',
      '', '',
      'पूर्ण',
      'दुपहिया',
      'हाँ',
      'बांसुरी',
      'संगीत',
      'खेल, सेवा',
      'रविवार, शाम',
      'सक्रिय कार्यकर्ता'
    ]
  ];
  XLSX.utils.sheet_add_aoa(ws, sampleData, { origin: -1 });

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'volunteer_template.xlsx';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

export const parseVolunteerExcel = async (
  file: File,
  khands: Khand[],
  mandals: Mandal[],
  villages: Village[]
): Promise<{ 
  contacts: Contact[], 
  newKhands: Khand[], 
  newMandals: Mandal[], 
  newVillages: Village[] 
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length <= 1) {
          resolve({ contacts: [], newKhands: [], newMandals: [], newVillages: [] });
          return;
        }

        const headers = jsonData[0];
        const rows = jsonData.slice(1);

        const currentKhands = [...khands];
        const currentMandals = [...mandals];
        const currentVillages = [...villages];
        const newKhands: Khand[] = [];
        const newMandals: Mandal[] = [];
        const newVillages: Village[] = [];

        const contacts: Contact[] = rows.map((row, index) => {
          const getVal = (headerName: string) => {
            const idx = headers.indexOf(headerName);
            return idx !== -1 ? row[idx]?.toString().trim() : undefined;
          };

          const name = getVal('नाम*');
          const phone = getVal('फ़ोन*');
          const khandName = getVal('खंड*');
          const mandalName = getVal('मंडल*');
          const villageName = getVal('गाँव/बस्ती*');

          if (!name || !phone || !khandName || !mandalName || !villageName) {
            return null;
          }

          let khand = currentKhands.find(k => k.name === khandName);
          if (!khand) {
            khand = { id: `k_${Date.now()}_${khandName}`, name: khandName };
            currentKhands.push(khand);
            newKhands.push(khand);
          }

          let mandal = currentMandals.find(m => m.name === mandalName && m.khandId === khand!.id);
          if (!mandal) {
            mandal = { id: `m_${Date.now()}_${mandalName}`, name: mandalName, khandId: khand!.id };
            currentMandals.push(mandal);
            newMandals.push(mandal);
          }

          let village = currentVillages.find(v => v.name === villageName && v.mandalId === mandal!.id);
          if (!village) {
            village = { id: `v_${Date.now()}_${villageName}`, name: villageName, mandalId: mandal!.id, stage: 'कुछ नहीं' as any };
            currentVillages.push(village);
            newVillages.push(village);
          }
          
          const statusVal = getVal('शक्ति (Status)');
          let status: Status = Status.UTSUK;
          if (statusVal === 'सक्रिय शक्ति') status = Status.SAKRIYA;
          else if (statusVal === 'संचित शक्ति') status = Status.SANCHIT;
          else if (statusVal === 'सज्जन शक्ति') status = Status.SAJJAN;

          const sanghTraining: Array<{class: string, year: string, location: string}> = [];
          
          const prathmikYear = getVal('प्राथमिक वर्ग (वर्ष)');
          const prathmikLoc = getVal('प्राथमिक वर्ग (स्थान)');
          if (prathmikYear || prathmikLoc) {
            sanghTraining.push({ class: 'प्राथमिक वर्ग', year: prathmikYear || '', location: prathmikLoc || '' });
          }

          const prathamYear = getVal('प्रथम वर्ष (वर्ष)');
          const prathamLoc = getVal('प्रथम वर्ष (स्थान)');
          if (prathamYear || prathamLoc) {
            sanghTraining.push({ class: 'प्रथम वर्ष', year: prathamYear || '', location: prathamLoc || '' });
          }

          const dwitiyaYear = getVal('द्वितीय वर्ष (वर्ष)');
          const dwitiyaLoc = getVal('द्वितीय वर्ष (स्थान)');
          if (dwitiyaYear || dwitiyaLoc) {
            sanghTraining.push({ class: 'द्वितीय वर्ष', year: dwitiyaYear || '', location: dwitiyaLoc || '' });
          }

          const tritiyaYear = getVal('तृतीय वर्ष (वर्ष)');
          const tritiyaLoc = getVal('तृतीय वर्ष (स्थान)');
          if (tritiyaYear || tritiyaLoc) {
            sanghTraining.push({ class: 'तृतीय वर्ष', year: tritiyaYear || '', location: tritiyaLoc || '' });
          }

          const volunteerProfile: VolunteerProfile = {
            fatherName: getVal('पिता का नाम'),
            dob: getVal('जन्म तिथि (YYYY-MM-DD)'),
            bloodGroup: getVal('रक्त समूह'),
            maritalStatus: getVal('वैवाहिक स्थिति'),
            phone2: getVal('वैकल्पिक फ़ोन'),
            email: getVal('ईमेल'),
            localAddress: getVal('पता'),
            education: getVal('शिक्षा'),
            profession: getVal('व्यवसाय'),
            officeDetails: getVal('कार्यालय विवरण'),
            sanghEntryYear: getVal('संघ प्रवेश वर्ष'),
            currentShakha: getVal('वर्तमान शाखा'),
            currentResponsibility: getVal('वर्तमान दायित्व'),
            previousResponsibilitiesStr: getVal('पूर्व दायित्व (कोमा से अलग)'),
            sanghTraining,
            uniformStatus: getVal('गणवेश स्थिति'),
            vehicle: getVal('वाहन'),
            isPratijnyavan: getVal('प्रतिज्ञावान (हाँ/नहीं)') === 'हाँ',
            ghoshVadya: getVal('घोष वाद्य'),
            specialSkills: getVal('विशेष कौशल'),
            areasOfInterest: getVal('रुचि के क्षेत्र (कोमा से अलग)')?.split(',').map(s => s.trim()).filter(Boolean),
            availability: getVal('उपलब्धता (कोमा से अलग)')?.split(',').map(s => s.trim()).filter(Boolean),
            otherDetails: getVal('अन्य विवरण')
          };

          return {
            id: `c_imp_${Date.now()}_${index}`,
            name,
            phone,
            khandId: khand.id,
            mandalId: mandal.id,
            villageId: village.id,
            category: getVal('श्रेणी') || 'अन्य',
            status,
            listIds: [],
            history: [],
            volunteerProfile
          };
        }).filter(Boolean) as Contact[];

        resolve({ contacts, newKhands, newMandals, newVillages });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
