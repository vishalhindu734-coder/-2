
export const calculateAge = (dob: string | undefined): number | null => {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const diff = Date.now() - d.getTime();
  const ageDate = new Date(diff); 
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  return years + (months / 12);
};

export const getAgeCategory = (age: number | null): string | null => {
  if (age === null) return null;
  if (age < 10) return 'शिशु';
  if (age >= 10 && age < 15) return 'बाल';
  if (age >= 15 && age <= 35) return 'तरुण';
  if (age > 35) return 'प्रौढ़';
  return null;
};

export const isShikshit = (trainings: any[] | undefined): boolean => {
  if (!Array.isArray(trainings) || trainings.length === 0) return false;
  const levels = [
    'प्रारंभिक शिक्षा वर्ग',
    'प्राथमिक शिक्षा वर्ग',
    'प्रथम वर्ष / संघ शिक्षा वर्ग',
    'द्वितीय वर्ष / का वि व - प्रथम',
    'तृतीय वर्ष / का वि व - द्वितीय'
  ];
  return trainings.some(t => levels.includes(t.class));
};

export const getHighestShikshan = (trainings: any[] | undefined): string | null => {
  if (!Array.isArray(trainings) || trainings.length === 0) return null;
  const levels = [
    'प्रारंभिक शिक्षा वर्ग',
    'प्राथमिक शिक्षा वर्ग',
    'प्रथम वर्ष / संघ शिक्षा वर्ग',
    'द्वितीय वर्ष / का वि व - प्रथम',
    'तृतीय वर्ष / का वि व - द्वितीय'
  ];
  let highestIndex = -1;
  let highestName = null;
  for (const t of trainings) {
    const idx = levels.indexOf(t.class);
    if (idx > highestIndex) {
      highestIndex = idx;
      highestName = t.class;
    }
  }
  return highestName;
};
