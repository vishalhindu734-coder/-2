import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Users, 
  MapPin, 
  List as ListIcon, 
  Calendar as CalendarIcon, 
  Settings, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Mountain,
  Phone, 
  CheckCircle2, 
  ArrowLeft,
  Search,
  Trash2,
  Moon,
  Sun,
  Building2,
  Edit2,
  Check,
  Star,
  Download,
  RotateCcw,
  User,
  Upload,
  FolderOpen,
  Tag,
  UserPlus,
  UsersRound,
  MessageSquare,
  CalendarCheck,
  UserCheck,
  Award,
  Flag,
  Rocket,
  ShieldCheck,
  Menu as MenuIcon,
  Palette,
  Type,
  Lightbulb,
  X,
  FileText,
  Clock,
  GripVertical,
  LayoutList,
  CalendarDays,
  ChevronLeft,
  Compass,
  LayoutDashboard,
  Layers,
  Zap,
  CalendarSync
} from 'lucide-react';
import { 
  Status, 
  Khand, 
  Mandal, 
  Village, 
  Contact, 
  TripPlan, 
  CustomList, 
  VisitHistory,
  VillageStage,
  ShakhaPosition,
  ShakhaData,
  Meeting,
  AttendanceStatus,
  Category
} from './types';

const formatTime = (timeStr: string) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  const m = minutes.toString().padStart(2, '0');
  return `${h}:${m} ${period}`;
};
import { 
  INITIAL_KHANDS, 
  INITIAL_MANDALS, 
  INITIAL_VILLAGES, 
  INITIAL_CONTACTS, 
  INITIAL_TRIPS, 
  INITIAL_LISTS,
  INITIAL_LIST_CATEGORIES,
  INITIAL_CATEGORIES,
  INITIAL_EVENT_CATEGORIES,
  FLAG_IMAGE_URI
} from './constants';
import { ICON_LIST, LucideIcon, WhatsappIcon } from './icons';
import { IconPicker } from './components/IconPicker';
import { EventsTab, EventDetailTab } from './components/EventTabs';

import { AreaMgmtView } from './components/AreaMgmtView';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isSameWeek,
  isSameMonth,
  addMonths, 
  subMonths,
  subWeeks,
  subDays,
  isToday,
  parseISO,
  addDays,
  addWeeks,
  startOfDay
} from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ExportModal } from './components/ExportModal';
import { ReportsTab } from './components/ReportsTab';
import { AdminPanel } from './components/AdminPanel';
import { generateVolunteerTemplate, parseVolunteerExcel } from './excelUtils';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, updateDoc, collection, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { AppUser } from './types';

type Tab = 'home' | 'swayamsevak' | 'people' | 'trips' | 'lists' | 'groups' | 'work-status' | 'menu' | 'area-mgmt' | 'cat-mgmt' | 'list-cat-mgmt' | 'calendar' | 'event-cat-mgmt' | 'activities' | 'ideas' | 'events' | 'event-detail' | 'settings' | 'reports' | 'admin';

export interface EventModel {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  team: { id: string, name: string, contact: string, role: string, teamRole: string, task: string }[];
  phases: { id: string, phase: string, startDate: string, endDate: string, task: string, workerName: string, followUp: string, todos?: { id: string, text: string, isCompleted: boolean }[] }[];
  departments: { id: string, deptName: string, headName: string, prep: string, meetings: string, followUp: string }[];
  resources: { id: string, itemName: string, type: string, source: string, estCost: number, workerName: string }[];
  expenses: { id: string, date: string, desc: string, type: string, workerName: string, amount: number, notes: string }[];
  incomes: { id: string, date: string, desc: string, type: string, workerName: string, amount: number, notes: string }[];
  executions: { id: string, deptName: string, task: string, workerName: string, followUp: string }[];
  reviews: { id: string, deptName: string, attendance: string, positive: string, improvement: string, followUp: string }[];
  contingencies: { id: string, challenge: string, solution: string, workerName: string, contact: string }[];
}

interface Idea {
  id: string;
  content: string;
  date: string;
  contactId?: string;
  villageId?: string;
  mandalId?: string;
  khandId?: string;
  isCompleted: boolean;
}

const loadData =<T,>(key: string, defaultValue: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

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
  if (age< 10) return 'शिशु';
  if (age >= 10 && age< 15) return 'बाल';
  if (age >= 15 && age<= 35) return 'तरुण';
  if (age > 35) return 'प्रौढ़';
  return null;
};

const isShikshit = (trainings: any[] | undefined): boolean => {
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

function cleanData(data: any): any {
  if (data === undefined || data === null) return data;
  if (Array.isArray(data)) return data.map(cleanData);
  if (typeof data === 'object') {
    const cleaned: any = {};
    for (const key in data) {
      if (data[key] !== undefined) {
         cleaned[key] = cleanData(data[key]);
      }
    }
    return cleaned;
  }
  return data;
}

function useDataSync<T extends {id: string}>(
  collectionName: string,
  localData: T[],
  setLocalData: React.Dispatch<React.SetStateAction<T[]>>,
  appUser: any
) {
  const isInternalUpdate = useRef(false);
  const prevData = useRef<T[] | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!appUser?.uid) return;
    
    console.log(`[useDataSync] Subscribing to ${collectionName}...`);
    const unsub = onSnapshot(collection(db, collectionName), async (snap) => {
      const data = snap.docs.map(d => d.data() as T);
      console.log(`[useDataSync] ${collectionName} received snapshot with ${data.length} items`);
      
      // If collection is empty but we have local initial data, populate it FIRST
      if (isFirstLoad.current && data.length === 0 && localData && localData.length > 0) {
        console.log(`[useDataSync] ${collectionName} is empty in Firebase. Populating with ${localData.length} initial items...`);
        for (const item of localData) {
          if (item.id) {
            await setDoc(doc(db, collectionName, item.id), cleanData(item), {merge: true})
              .catch(e => handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${item.id}`));
          }
        }
        isFirstLoad.current = false;
        return; // The setDoc calls will re-trigger onSnapshot
      }

      isFirstLoad.current = false;
      isInternalUpdate.current = true;
      setLocalData(data);
      
      setTimeout(() => {
        isInternalUpdate.current = false;
        prevData.current = data;
      }, 50);
    }, (error) => {
      console.error(`[useDataSync] Error in ${collectionName}:`, error);
      handleFirestoreError(error, OperationType.LIST, collectionName);
    });

    return () => unsub();
  }, [appUser, collectionName]); // Do NOT depend on setLocalData/localData

  useEffect(() => {
    if (!appUser?.uid || isFirstLoad.current || isInternalUpdate.current || !prevData.current) return;

    console.log(`[useDataSync] Local changes detected in ${collectionName}, computing diff...`);
    const oldMap = new Map((prevData.current || []).map(i => [i.id, i]));
    const newMap = new Map((localData || []).map(i => [i.id, i]));

    for (const [id, item] of newMap) {
      if (!id) continue;
      const oldItem = oldMap.get(id);
      if (!oldItem || JSON.stringify(cleanData(oldItem)) !== JSON.stringify(cleanData(item))) {
        console.log(`[useDataSync] Writing updated/new item to ${collectionName}/${id}`);
        setDoc(doc(db, collectionName, id), cleanData(item), {merge: true})
          .catch(e => handleFirestoreError(e, OperationType.WRITE, `${collectionName}/${id}`));
      }
    }
    
    for (const id of oldMap.keys()) {
      if (!id) continue;
      if (!newMap.has(id)) {
        console.log(`[useDataSync] Deleting item ${collectionName}/${id}`);
        deleteDoc(doc(db, collectionName, id))
          .catch(e => handleFirestoreError(e, OperationType.DELETE, `${collectionName}/${id}`));
      }
    }

    prevData.current = localData;
  }, [localData, appUser, collectionName]);
}

const App: React.FC = () => {
  // Auth State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Core State
  const [ideas, setIdeas] = useState<Idea[]>(() => loadData('ideas', []));
  const [events, setEvents] = useState<EventModel[]>(() => loadData('events', []));
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [khands, setKhands] = useState<Khand[]>(() => loadData('khands', INITIAL_KHANDS));
  const [mandals, setMandals] = useState<Mandal[]>(() => loadData('mandals', INITIAL_MANDALS));
  const [villages, setVillages] = useState<Village[]>(() => loadData('villages', INITIAL_VILLAGES));
  const [contacts, setContacts] = useState<Contact[]>(() => loadData('contacts', INITIAL_CONTACTS));
  const [trips, setTrips] = useState<TripPlan[]>(() => loadData('trips', INITIAL_TRIPS));
  const [tripTimeFilter, setTripTimeFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month' | 'year'>('all');
  const [tripViewMode, setTripViewMode] = useState<'list' | 'calendar'>(() => loadData('tripViewMode', 'list'));
  const [calendarViewType, setCalendarViewType] = useState<'1day' | '3day' | 'week' | 'month' | 'schedule'>('month');
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const data = loadData<any[]>('categories', INITIAL_CATEGORIES);
    if (data.length > 0 && typeof data[0] === 'string') {
      return data.map((name: string, i: number) => ({ id: `c${i}`, name, icon: 'User' }));
    }
    return data;
  });

  const [eventCategories, setEventCategories] = useState<Category[]>(() => {
    const data = loadData<any[]>('eventCategories', INITIAL_EVENT_CATEGORIES);
    if (data.length > 0 && typeof data[0] === 'string') {
      return data.map((name: string, i: number) => ({ id: `ec${i}`, name, icon: 'Calendar' }));
    }
    return data;
  });

  const [customLists, setCustomLists] = useState<CustomList[]>(() => loadData('customLists', INITIAL_LISTS));
  const [listCategories, setListCategories] = useState<Category[]>(() => loadData('listCategories', INITIAL_LIST_CATEGORIES));
  const [meetings, setMeetings] = useState<Meeting[]>(() => loadData('meetings', []));
  const [darkMode, setDarkMode] = useState(() => loadData('darkMode', false));
  const [appTheme, setAppTheme] = useState(() => loadData('appTheme', 'default'));
  const [appFont, setAppFont] = useState(() => loadData('appFont', 'baloo'));
  const [appFontSize, setAppFontSize] = useState(() => loadData('appFontSize', 16));
  const [userName, setUserName] = useState(() => loadData('userName', 'क्षेत्र स्वयंसेवक'));
  const [callRecords, setCallRecords] = useState<Record<string, string>>(() => loadData('callRecords', {}));
  const [whatsappMessage, setWhatsappMessage] = useState(() => loadData('whatsappMessage', 'नमस्ते'));

  // UI State
  const [dashKhand, setDashKhand] = useState<string>('all');
  const [dashMandal, setDashMandal] = useState<string>('all');

  // Helpers
  const getKhandName = (id: string) => khands.find(k => k.id === id)?.name || id;
  const getMandalName = (id: string) => mandals.find(m => m.id === id)?.name || id;
  const getVillageName = (id: string) => villages.find(v => v.id === id)?.name || id;
  const [dashStage, setDashStage] = useState<string>('all');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState<string | 'all'>('all');
  const [peopleStatusFilter, setPeopleStatusFilter] = useState<string | 'all'>('all');
  const [peopleCategoryFilter, setPeopleCategoryFilter] = useState<string | 'all'>('all');
  const [peopleAgeCategoryFilter, setPeopleAgeCategoryFilter] = useState<string | 'all'>('all');
  const [peopleShikshitFilter, setPeopleShikshitFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [peopleShikshanLevelFilter, setPeopleShikshanLevelFilter] = useState<string[]>([]);
  const [peopleKhandFilter, setPeopleKhandFilter] = useState<string>('all');
  const [peopleMandalFilter, setPeopleMandalFilter] = useState<string>('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedVillageId, setSelectedVillageId] = useState<string | null>(null);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>([]);
    const [isBulkUpdateModalOpen, setIsBulkUpdateModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useDataSync('contacts', contacts as any[], setContacts as any, appUser);
  useDataSync('khands', khands as any[], setKhands as any, appUser);
  useDataSync('mandals', mandals as any[], setMandals as any, appUser);
  useDataSync('villages', villages as any[], setVillages as any, appUser);
  useDataSync('trips', trips as any[], setTrips as any, appUser);
  useDataSync('lists', customLists as any[], setCustomLists as any, appUser);
  useDataSync('categories', categories as any[], setCategories as any, appUser);
  useDataSync('eventCategories', eventCategories as any[], setEventCategories as any, appUser);
  useDataSync('listCategories', listCategories as any[], setListCategories as any, appUser);
  useDataSync('meetings', meetings as any[], setMeetings as any, appUser);
  useDataSync('ideas', ideas as any[], setIdeas as any, appUser);
  useDataSync('events', events as any[], setEvents as any, appUser);

  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);
  
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        // Fetch or create app user
        const userRef = doc(db, 'users', user.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setAppUser({ uid: userSnap.id, ...userSnap.data() } as AppUser);
          } else {
            const newUser: AppUser = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || '',
              roleId: null, // by default no role
            };
            try {
              await setDoc(userRef, newUser);
              setAppUser(newUser);
            } catch (e) {
              handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`);
            }
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setAppUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedPeopleIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredPeople = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(peopleSearch.toLowerCase()) || (c.phone && c.phone.includes(peopleSearch));
      const matchStatus = peopleStatusFilter === 'all' || c.status === peopleStatusFilter;
      const matchCategory = peopleCategoryFilter === 'all' || c.category === peopleCategoryFilter;
      
      let matchAgeCat = true;
      if (peopleAgeCategoryFilter !== 'all') {
         const calculatedAgeCategory = getAgeCategory(calculateAge(c.volunteerProfile?.dob)) || 'अज्ञात';
         matchAgeCat = calculatedAgeCategory === peopleAgeCategoryFilter;
      }

      let matchShikshit = true;
      if (peopleShikshitFilter !== 'all') {
         const isShikshitUser = isShikshit(c.volunteerProfile?.sanghTraining);
         matchShikshit = (peopleShikshitFilter === 'yes' && isShikshitUser) || (peopleShikshitFilter === 'no' && !isShikshitUser);
      }

      let matchShikshanLevel = true;
      if (peopleShikshitFilter === 'yes' && peopleShikshanLevelFilter.length > 0) {
         const isMatched = Array.isArray(c.volunteerProfile?.sanghTraining) && 
            c.volunteerProfile.sanghTraining.some((t: any) => peopleShikshanLevelFilter.includes(t.class));
         matchShikshanLevel = isMatched;
      }

      const matchArea = (peopleKhandFilter === 'all' || c.khandId === peopleKhandFilter) && (peopleMandalFilter === 'all' || c.mandalId === peopleMandalFilter);
      return matchSearch && matchStatus && matchCategory && matchAgeCat && matchShikshit && matchShikshanLevel && matchArea;
    });
  }, [contacts, peopleSearch, peopleStatusFilter, peopleCategoryFilter, peopleAgeCategoryFilter, peopleShikshitFilter, peopleShikshanLevelFilter, peopleKhandFilter, peopleMandalFilter]);

  const groupedPeopleData = useMemo(() => {
    const groups: any = {};
    filteredPeople.forEach(c => {
      const kId = c.khandId || 'unknown';
      const mId = c.mandalId || 'unknown';
      const vId = c.villageId || 'unknown';
      
      if (!groups[kId]) groups[kId] = { id: kId, name: getKhandName(kId), mandals: {} };
      if (!groups[kId].mandals[mId]) groups[kId].mandals[mId] = { id: mId, name: getMandalName(mId), villages: {} };
      if (!groups[kId].mandals[mId].villages[vId]) groups[kId].mandals[mId].villages[vId] = { id: vId, name: getVillageName(vId), contacts: [] };
      
      groups[kId].mandals[mId].villages[vId].contacts.push(c);
    });
    return groups;
  }, [filteredPeople, khands, mandals, villages]);

  const [exportTarget, setExportTarget] = useState<{data: any[], title: string, isGeneric?: boolean} | null>(null);
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedContactId(null);
    setViewingTrip(null);
    setSelectedVillageId(null);
    setSelectedListId(null);
    setSelectedMeetingId(null);
    setSelectedEventId(null);
    setSelectedPeopleIds([]);
    setIsBulkUpdateModalOpen(false);
    setExportTarget(null);
  };
  const [isManagingMembers, setIsManagingMembers] = useState(false);

  // Modals / Editing State
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [editingTrip, setEditingTrip] = useState<TripPlan | null>(null);
  const [viewingTrip, setViewingTrip] = useState<TripPlan | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [isAddingTrip, setIsAddingTrip] = useState(false);
  const [isAddingList, setIsAddingList] = useState(false);
  const [editingList, setEditingList] = useState<CustomList | null>(null);
  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [isAddingIdea, setIsAddingIdea] = useState(false);
  const [isLoggingVisit, setIsLoggingVisit] = useState<string | null>(null);
  const [isEditingVisit, setIsEditingVisit] = useState<{contactId: string, history: VisitHistory} | null>(null);
  const [confirmation, setConfirmation] = useState<{ title: string; message: string; onConfirm: () => void; titleFont?: string; messageFont?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const volunteerExcelInputRef = useRef<HTMLInputElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('khands', JSON.stringify(khands));
    localStorage.setItem('mandals', JSON.stringify(mandals));
    localStorage.setItem('villages', JSON.stringify(villages));
    localStorage.setItem('contacts', JSON.stringify(contacts));
    localStorage.setItem('trips', JSON.stringify(trips));
    localStorage.setItem('tripViewMode', JSON.stringify(tripViewMode));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('eventCategories', JSON.stringify(eventCategories));
    localStorage.setItem('listCategories', JSON.stringify(listCategories));
    localStorage.setItem('customLists', JSON.stringify(customLists));
    localStorage.setItem('meetings', JSON.stringify(meetings));
    localStorage.setItem('ideas', JSON.stringify(ideas));
    localStorage.setItem('events', JSON.stringify(events));
    localStorage.setItem('userName', JSON.stringify(userName));
    localStorage.setItem('callRecords', JSON.stringify(callRecords));
    localStorage.setItem('whatsappMessage', JSON.stringify(whatsappMessage));
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    localStorage.setItem('appTheme', JSON.stringify(appTheme));
    localStorage.setItem('appFont', JSON.stringify(appFont));
    localStorage.setItem('appFontSize', JSON.stringify(appFontSize));
    
    // Theme and Dark mode applying
    const html = document.documentElement;
    if (darkMode) html.classList.add('dark');
    else html.classList.remove('dark');
    
    html.classList.remove('theme-nature', 'theme-rose');
    if (appTheme !== 'default') {
      html.classList.add(`theme-${appTheme}`);
    }
    
    const fontClasses = ['font-baloo', 'font-tiro', 'font-mukta', 'font-noto-sans', 'font-noto-serif', 'font-yatra', 'font-kalam', 'font-amita', 'font-rajdhani', 'font-hind', 'font-rozha', 'font-eczar', 'font-poppins', 'font-laila', 'font-karma', 'font-sura', 'font-vesper', 'font-tillana', 'font-glegoo', 'font-khula', 'font-yantramanav', 'font-martel'];
    html.classList.remove(...fontClasses);
    html.classList.add(`font-${appFont}`);

    // Font size applying
    html.style.setProperty('--app-font-size', `${appFontSize}px`);
  }, [khands, mandals, villages, contacts, trips, categories, eventCategories, listCategories, customLists, meetings, userName, darkMode, appTheme, appFont, appFontSize, callRecords, whatsappMessage]);


  const isRecentlyCalled = (id: string) => {
    const lastCall = callRecords[id];
    if (!lastCall) return false;
    const diff = Date.now() - new Date(lastCall).getTime();
    return diff < 48 * 60 * 60 * 1000;
  };

  const handleDial = (id: string) => {
    setCallRecords(prev => ({ ...prev, [id]: new Date().toISOString() }));
  };

  const stats = useMemo(() => {
    const filtered = contacts.filter(c => (dashKhand === 'all' || c.khandId === dashKhand) && (dashMandal === 'all' || c.mandalId === dashMandal));
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byAgeCategory: Record<string, number> = {};
    
    let pendingTodos = 0;
    events.forEach(evt => {
       evt.phases?.forEach((p: any) => {
          if (p.todos && Array.isArray(p.todos)) {
             pendingTodos += p.todos.filter((t: any) => !t.isCompleted).length;
          }
       });
    });
    
    filtered.forEach(c => {
      if (c.category) {
        byCategory[c.category] = (byCategory[c.category] || 0) + 1;
      }
      if (c.status) {
        byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      }
      const ageCat = getAgeCategory(calculateAge(c.volunteerProfile?.dob));
      if (ageCat) {
        byAgeCategory[ageCat] = (byAgeCategory[ageCat] || 0) + 1;
      }
    });

    // Trip Stats
    const statsByKhand: Record<string, { completed: number, planned: number, mandals: Record<string, { completed: number, planned: number }> }> = {};
    khands.forEach(k => {
      statsByKhand[k.name] = { completed: 0, planned: 0, mandals: {} };
      mandals.filter(m => m.khandId === k.id).forEach(m => {
        statsByKhand[k.name].mandals[m.name] = { completed: 0, planned: 0 };
      });
    });

    const now = new Date();
    trips.filter(t => isSameMonth(parseISO(t.date), now)).forEach(t => {
      const kName = getKhandName(t.khandId);
      const mName: string = getMandalName(t.mandalId) as string;
      if (!statsByKhand[kName]) statsByKhand[kName] = { completed: 0, planned: 0, mandals: {} };
      
      statsByKhand[kName].planned++;
      if (t.isCompleted) {
        statsByKhand[kName].completed++;
      }

      if (statsByKhand[kName].mandals[mName] === undefined) statsByKhand[kName].mandals[mName] = { completed: 0, planned: 0 };
      
      statsByKhand[kName].mandals[mName].planned++;
      if (t.isCompleted) {
        statsByKhand[kName].mandals[mName].completed++;
      }
    });

    return {
      total: filtered.length,
      active: filtered.filter(c => c.status === Status.SAKRIYA).length,
      shikshitCount: filtered.filter(c => isShikshit(c.volunteerProfile?.sanghTraining)).length,
      pendingTodos,
      byCategory,
      byStatus,
      byAgeCategory,
      statsByKhand
    };
  }, [contacts, dashKhand, dashMandal, events, trips, khands, mandals]);

  // Actions
  const handleUpdateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setEditingContact(null);
  };

  const handleBulkUpdate = (updates: any) => {
    setContacts(prev => prev.map(c => {
      if (!selectedPeopleIds.includes(c.id)) return c;
      
      let updatedContact = { ...c, ...updates };
      
      // Handle nested volunteerProfile updates
      if (updates.volunteerProfileUpdates) {
        updatedContact.volunteerProfile = {
          ...(c.volunteerProfile || {
            currentResponsibility: '',
            shikshan: {
              prathmikVarg: false,
              prathamVarsh: false,
              dwitiyaVarsh: false,
              tritiyaVarsh: false
            }
          }),
          ...updates.volunteerProfileUpdates
        };
        delete updatedContact.volunteerProfileUpdates;
      }
      
      return updatedContact;
    }));
    setSelectedPeopleIds([]);
    setIsBulkUpdateModalOpen(false);
  };

  const handleAddContact = (newContact: Omit<Contact, 'id' | 'listIds' | 'history'>) => {
    const contact: Contact = { ...newContact, id: `c${Date.now()}`, listIds: [], history: [] };
    setContacts(prev => [...prev, contact]);
    setIsAddingContact(false);
  };

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);

  const handleUpdateTrip = (id: string, updates: Partial<TripPlan>) => {
    if (updates.isCompleted) {
      setShowSuccessOverlay(true);
    }
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    setEditingTrip(null);
  };

  const handleAddIdea = (newIdea: Omit<Idea, 'id' | 'isCompleted'>) => {
    const idea: Idea = { ...newIdea, id: `i${Date.now()}`, isCompleted: false };
    setIdeas(prev => [...prev, idea]);
    setIsAddingIdea(false);
  };

  const handleUpdateIdea = (id: string, updates: Partial<Idea>) => {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const handleDeleteIdea = (id: string) => {
    setIdeas(prev => prev.filter(i => i.id !== id));
  };

  const handleAddTrip = (newTrip: Omit<TripPlan, 'id' | 'isCompleted'>) => {
    const trip: TripPlan = { ...newTrip, id: `t${Date.now()}`, isCompleted: false, schedule: [] };
    setTrips(prev => [...prev, trip]);
    setIsAddingTrip(false);
    setViewingTrip(trip);
  };

  const handleLogVisit = (contactId: string, notes: string, dateStr: string = new Date().toISOString()) => {
    const historyEntry: VisitHistory = {
      id: `h${Date.now()}`,
      date: dateStr,
      notes,
    };
    setContacts(prev => prev.map(c => 
      c.id === contactId 
        ? { ...c, history: [...c.history, historyEntry].sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()), lastVisited: dateStr } 
        : c
    ));
    setIsLoggingVisit(null);
  };

  const handleEditVisitHistory = (contactId: string, historyId: string, notes: string, dateStr: string) => {
    setContacts(prev => prev.map(c => 
      c.id === contactId 
        ? { ...c, history: c.history.map(h => h.id === historyId ? { ...h, notes, date: dateStr } : h).sort((a,b)=>new Date(b.date).getTime() - new Date(a.date).getTime()) } 
        : c
    ));
    setIsEditingVisit(null);
  };

  const handleDeleteVisitHistory = (contactId: string, historyId: string) => {
    setConfirmation({
      title: 'अनुवर्तन हटाएं?',
      message: 'क्या आप इस अनुवर्तन को हटाना चाहते हैं?',
      onConfirm: () => {
        setContacts(prev => prev.map(c => 
          c.id === contactId 
            ? { ...c, history: c.history.filter(h => h.id !== historyId) } 
            : c
        ));
        setConfirmation(null);
      }
    });
  };

  const updateVillageStage = (id: string, stage: VillageStage) => {
    setVillages(prev => prev.map(v => v.id === id ? { ...v, stage } : v));
  };

  const handleUpdateVillage = (id: string, updates: Partial<Village>) => {
    setVillages(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const updateShakhaData = (id: string, data: Partial<ShakhaData>) => {
    setVillages(prev => prev.map(v => v.id === id ? { ...v, shakhaData: { ...v.shakhaData, ...data } as ShakhaData } : v));
  };

  const exportData = () => {
    const data = { khands, mandals, villages, contacts, trips, categories, eventCategories, customLists, meetings, ideas, events, userName };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pravas_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearAllKaryas = () => {
    setConfirmation({
      title: 'सभी कार्यस्थिति हटाएं?',
      message: 'क्या आप सुनिश्चित हैं कि आप सभी शाखा, मिलन और मंडली की कार्यस्थिति हटाना चाहते हैं?',
      onConfirm: () => {
        setVillages(prev => prev.map(v => ({
          ...v,
          stage: VillageStage.NONE,
          karyaDetails: undefined
        })));
        setConfirmation(null);
      }
    });
  };

  const resetAllData = () => {
    setConfirmation({
      title: 'ऐप रिसेट करें?',
      message: 'क्या आप वाकई सारा डेटा मिटाना चाहते हैं? यह क्रिया वापस नहीं ली जा सकती।',
      onConfirm: () => {
        localStorage.clear();
        window.location.reload();
      }
    });
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.khands) setKhands(data.khands);
        if (data.mandals) setMandals(data.mandals);
        if (data.villages) setVillages(data.villages);
        if (data.contacts) setContacts(data.contacts);
        if (data.trips) setTrips(data.trips);
        if (data.categories) setCategories(data.categories);
        if (data.eventCategories) setEventCategories(data.eventCategories);
        if (data.customLists) setCustomLists(data.customLists);
        if (data.meetings) setMeetings(data.meetings);
        if (data.ideas) setIdeas(data.ideas);
        if (data.events) setEvents(data.events);
        if (data.userName) setUserName(data.userName);
        alert('डेटा सफलतापूर्वक रिस्टोर हो गया है!');
      } catch (err) {
        alert('डेटा रिस्टोर करने में त्रुटि हुई। कृपया सही फाइल चुनें।');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const { contacts: importedContacts, newKhands, newMandals, newVillages } = await parseVolunteerExcel(file, khands, mandals, villages);
      if (importedContacts.length > 0) {
        if (newKhands.length > 0) setKhands(prev => [...prev, ...newKhands]);
        if (newMandals.length > 0) setMandals(prev => [...prev, ...newMandals]);
        if (newVillages.length > 0) setVillages(prev => [...prev, ...newVillages]);
        
        setContacts(prev => [...prev, ...importedContacts]);
        alert(`${importedContacts.length} स्वयंसेवक सफलतापूर्वक आयात किए गए!`);
      } else {
        alert('कोई वैध डेटा नहीं मिला।');
      }
    } catch (err) {
      alert('एक्सेल फाइल पढ़ने में त्रुटि हुई।');
    }
    event.target.value = '';
  };

  // Rendering Tabs
  const renderHome = () => {
    const upcomingMeetings = meetings
      .filter(m => new Date(m.date) >= new Date() || isToday(parseISO(m.date)))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 3);

    const getEventIcon = (cat: string) => {
      const iconName = eventCategories.find(c => c.name === cat)?.icon;
      if (iconName) return<LucideIcon name={iconName} size={16} />;
      return<Rocket size={16} />;
    };

    const homeFilteredVillages = villages.filter(v => {
      if (dashKhand !== 'all') {
        const m = mandals.find(x => x.id === v.mandalId);
        if (!m || m.khandId !== dashKhand) return false;
      }
      if (dashMandal !== 'all' && v.mandalId !== dashMandal) return false;
      return true;
    });

    const workStats = {
      shakha: homeFilteredVillages.filter(v => v.stage === VillageStage.SHAKHA).length,
      milan: homeFilteredVillages.filter(v => v.stage === VillageStage.MILAN).length,
      mandali: homeFilteredVillages.filter(v => v.stage === VillageStage.MANDALI).length,
      sampark: homeFilteredVillages.filter(v => v.stage === VillageStage.SAMPARK).length,
    };

    return (
     <div className="p-4 pb-24 animate-in fade-in duration-500 lg:p-8">
       <header className="sticky top-0 z-30 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-xl -mt-4 -mx-4 px-4 py-3 border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm flex justify-between items-center relative overflow-hidden mb-6">
         <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 dark:bg-orange-500/5 rounded-full blur-2xl -mr-10 -mt-10 transition-colors duration-500"></div>
         <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-2xl -ml-10 -mb-10 transition-colors duration-500"></div>
         <div className="relative flex items-center gap-3 flex-1 min-w-0 pr-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 shadow-sm flex items-center justify-center p-1.5 shrink-0 overflow-hidden transition-colors duration-500">
               <img src={FLAG_IMAGE_URI} alt="Dhwaj" className="w-full h-full object-contain drop-shadow-sm" />
            </div>
            <div className="flex-1 min-w-0 py-1">
              <h1 className="text-[22px] font-extrabold text-blue-600 dark:text-blue-500 tracking-tight leading-normal break-words pt-1 transition-colors duration-500">संगठन शिल्पी</h1>
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest truncate pb-1">नमस्ते, {userName}</p>
            </div>
         </div>
         <button onClick={() => setDarkMode(!darkMode)} className="relative p-2.5 bg-white dark:bg-[#0a101f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm active:scale-95 transition-all shrink-0">
            {darkMode ?<Sun size={18} className="text-yellow-500" /> :<Moon size={18} className="text-blue-600" />}
         </button>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
         <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-5 rounded-2xl relative overflow-hidden">
         <SectionHeader icon={MapPin} title="क्षेत्र चुनें" className="mb-4" variant="blue" />
         <div className="grid grid-cols-2 gap-3 relative z-10">
           <div className="relative">
             <select value={dashKhand} onChange={(e) => { setDashKhand(e.target.value); setDashMandal('all'); }} className="w-full bg-white dark:bg-[#0a101f] text-gray-800 dark:text-gray-100 p-3 pl-4 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-xs outline-none shadow-sm appearance-none focus:ring-2 focus:ring-blue-500/50">
               <option value="all">सभी खंड</option>
                {khands.map(k =><option key={k.id} value={k.id}>{k.name}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronRight size={14} className="rotate-90" />
             </div>
           </div>
           <div className="relative">
             <select value={dashMandal} disabled={dashKhand === 'all'} onChange={(e) => setDashMandal(e.target.value)} className="w-full bg-white dark:bg-[#0a101f] text-gray-800 dark:text-gray-100 p-3 pl-4 rounded-xl border border-gray-200 dark:border-gray-800 font-bold text-xs outline-none shadow-sm appearance-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50">
               <option value="all">सभी मंडल</option>
                {mandals.filter(m => m.khandId === dashKhand).map(m =><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
             <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
               <ChevronRight size={14} className="rotate-90" />
             </div>
           </div>
         </div>
          
         <div className="grid grid-cols-4 gap-2 pt-4 mt-2 border-t border-gray-200/50 dark:border-gray-700/50">
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.4, delay: 0.1 }}
               onClick={() => { setDashStage(VillageStage.SHAKHA); setActiveTab('work-status'); }}
               className="bg-orange-50 dark:bg-orange-900/20 text-orange-600 border border-orange-200 dark:border-orange-800 py-1 px-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all">
               <div className="text-2xl font-bold leading-none"><AnimatedNumber value={workStats.shakha} delayMs={250} /></div>
               <div className="text-sm font-medium uppercase tracking-wider font-hindi mt-0.5 leading-tight">शाखा</div>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.4, delay: 0.2 }}
               onClick={() => { setDashStage(VillageStage.MILAN); setActiveTab('work-status'); }}
               className="bg-pink-50 dark:bg-pink-900/20 text-pink-600 border border-pink-200 dark:border-pink-800 py-1 px-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all">
               <div className="text-2xl font-bold leading-none"><AnimatedNumber value={workStats.milan} delayMs={350} /></div>
               <div className="text-sm font-medium uppercase tracking-wider font-hindi mt-0.5 leading-tight">मिलन</div>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.4, delay: 0.3 }}
               onClick={() => { setDashStage(VillageStage.MANDALI); setActiveTab('work-status'); }}
               className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 border border-purple-200 dark:border-purple-800 py-1 px-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all">
               <div className="text-2xl font-bold leading-none"><AnimatedNumber value={workStats.mandali} delayMs={450} /></div>
               <div className="text-sm font-medium uppercase tracking-wider font-hindi mt-0.5 leading-tight">मंडली</div>
            </motion.div>
            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ duration: 0.4, delay: 0.4 }}
               onClick={() => { setDashStage(VillageStage.SAMPARK); setActiveTab('work-status'); }}
               className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800 py-1 px-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all">
               <div className="text-2xl font-bold leading-none"><AnimatedNumber value={workStats.sampark} delayMs={550} /></div>
               <div className="text-sm font-medium uppercase tracking-wider font-hindi mt-0.5 leading-tight">संपर्क</div>
            </motion.div>
         </div>
       </motion.section>

        {/* Pravas Dashboard Integration */}
        {Object.keys(stats.statsByKhand).length > 0 && (
         <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
           <SectionHeader 
             icon={LayoutDashboard} 
             title="प्रवास डैशबोर्ड (इस माह)" 
             variant="orange"
             rightElement={<button onClick={() => setActiveTab('trips')} className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider hover:underline">विस्तार में</button>} 
           />
           <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] dark:border-gray-700/50 p-3 rounded-xl space-y-3">
             <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.statsByKhand).map(([kName, data]) => {
                  // Only show if the khand has data or if no specific khand is filtered
                  if (dashKhand !== 'all' && getKhandName(dashKhand) !== kName) return null;
                  
                  return (
                   <div key={kName} className="bg-orange-50/80 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 rounded-lg p-3">
                     <div className="text-sm font-medium text-orange-800 dark:text-orange-200 border-b border-orange-200/50 dark:border-orange-800/50 pb-2 mb-2 flex justify-between items-center">
                        <span className="truncate flex-1">{kName}</span>
                        <div className="flex bg-white/50 dark:bg-black/20 rounded items-center min-w-max ml-1 shadow-sm">
                          <span className="bg-green-500 text-white px-1.5 py-0.5 rounded-l text-xs font-medium"><AnimatedNumber value={data.completed} /></span>
                          <span className="bg-blue-500 text-white px-1.5 py-0.5 rounded-r text-xs font-medium border-l border-white/20"><AnimatedNumber value={data.planned} /></span>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        {Object.entries(data.mandals).map(([mName, counts]) => (
                         <div key={mName} className="text-xs text-orange-700 dark:text-orange-300 flex justify-between items-center gap-0.5">
                           <span className="truncate flex-1 font-medium">{mName}</span>
                           <div className={`flex rounded whitespace-nowrap min-w-max flex-none items-center shadow-sm ${(counts.completed > 0 || counts.planned > 0) ? 'bg-orange-200/30 dark:bg-orange-900/20' : 'bg-gray-100 dark:bg-gray-800/30'}`}>
                             <span className={`px-1 rounded-l text-xs font-medium ${counts.completed > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'text-gray-400 dark:text-gray-600'}`}><AnimatedNumber value={counts.completed} /></span>
                             <span className={`px-1 rounded-r text-xs font-medium border-l ${counts.planned > 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-white/20 dark:border-black/20' : 'text-gray-400 dark:text-gray-600 border-transparent'}`}><AnimatedNumber value={counts.planned} /></span>
                           </div>
                         </div>
                        ))}
                     </div>
                   </div>
                  );
                })}
             </div>
           </div>
         </motion.section>
        )}

       <div className="grid grid-cols-3 gap-3">
         <StatCard index={0} label="कुल संपर्क" value={stats.total} color="bg-blue-50 dark:bg-blue-900/20 text-blue-800" onClick={() => { setPeopleStatusFilter('all'); setPeopleCategoryFilter('all'); setPeopleAgeCategoryFilter('all'); setPeopleShikshitFilter('all'); setPeopleShikshanLevelFilter([]); setActiveTab('people'); }} />
         <StatCard index={1} label="सक्रिय" value={stats.active} color="bg-green-50 dark:bg-green-900/20 text-green-800" onClick={() => { setPeopleStatusFilter(Status.SAKRIYA); setPeopleCategoryFilter('all'); setPeopleAgeCategoryFilter('all'); setPeopleShikshitFilter('all'); setPeopleShikshanLevelFilter([]); setActiveTab('people'); }} />
         <StatCard index={2} label="शिक्षित" value={stats.shikshitCount} color="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800" onClick={() => { setPeopleCategoryFilter('all'); setPeopleStatusFilter('all'); setPeopleAgeCategoryFilter('all'); setPeopleShikshitFilter('yes'); setPeopleShikshanLevelFilter([]); setActiveTab('people'); }} />
       </div>

       <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
         <SectionHeader icon={Layers} title="श्रेणी अनुसार" variant="purple" />
         <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
             <div 
                 key={cat} 
                 onClick={() => { setPeopleCategoryFilter(cat); setPeopleStatusFilter('all'); setActiveTab('people'); }}
                 className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-2.5 rounded-md border dark:border-gray-700 flex justify-between items-center shadow-sm active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <span className="font-medium dark:text-gray-200 line-clamp-1">{cat}</span>
                <span className="font-medium text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 text-xs rounded-full"><AnimatedNumber value={count} /></span>
             </div>
            ))}
            {Object.keys(stats.byCategory).length === 0 &&<div className="col-span-2 text-center text-xs p-3 text-gray-400 font-medium border rounded-md dark:border-gray-700">डेटा नहीं</div>}
         </div>
       </motion.section>

       <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
         <SectionHeader icon={Zap} title="शक्ति अनुसार" variant="orange" />
         <div className="grid grid-cols-2 gap-2">
            {Object.entries(stats.byStatus).map(([status, count]) => (
             <div 
                 key={status} 
                 onClick={() => { setPeopleStatusFilter(status); setPeopleCategoryFilter('all'); setPeopleAgeCategoryFilter('all'); setActiveTab('people'); }}
                 className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-2.5 rounded-md border dark:border-gray-700 flex justify-between items-center shadow-sm active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
              >
                <span className="font-medium dark:text-gray-200 line-clamp-1">{status}</span>
                <span className="font-medium text-orange-600 bg-orange-50 dark:bg-orange-900/30 px-2 py-0.5 text-xs rounded-full"><AnimatedNumber value={count} /></span>
             </div>
            ))}
            {Object.keys(stats.byStatus).length === 0 && <div className="col-span-2 text-center text-xs p-3 text-gray-400 font-medium border rounded-md dark:border-gray-700">डेटा नहीं</div>}
         </div>
       </motion.section>

       <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
         <SectionHeader icon={User} title="आयु अनुसार" variant="blue" />
          {Object.keys(stats.byAgeCategory).length > 0 ? (
           <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats.byAgeCategory).map(([cat, count]) => (
               <div 
                   key={cat} 
                   onClick={() => { setPeopleAgeCategoryFilter(cat); setPeopleCategoryFilter('all'); setPeopleStatusFilter('all'); setActiveTab('people'); }}
                   className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-2.5 rounded-md border dark:border-gray-700 flex justify-between items-center shadow-sm active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
                >
                  <span className="font-medium dark:text-gray-200 line-clamp-1">{cat}</span>
                  <span className="font-medium text-pink-600 bg-pink-50 dark:bg-pink-900/30 px-2 py-0.5 text-xs rounded-full"><AnimatedNumber value={count} /></span>
               </div>
              ))}
           </div>
          ) : (
           <div className="text-center text-xs p-3 text-gray-400 font-medium border rounded-md dark:border-gray-700">डेटा नहीं</div>
          )}
       </motion.section>

       <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
         <SectionHeader 
           icon={CalendarSync} 
           title="आगामी कार्यक्रम" 
           variant="green"
           rightElement={<button onClick={() => setActiveTab('calendar')} className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:underline">सभी</button>} 
         />
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 space-y-0">
             {upcomingMeetings.map(m => (
               <div key={m.id} onClick={() => { setSelectedListId(m.listId); setSelectedMeetingId(m.id); setActiveTab('lists'); }} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-4 rounded-lg border dark:border-gray-700 flex items-center gap-4 shadow-sm active:scale-95 transition-all border-l-4 border-l-orange-500">
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-md">
                      {getEventIcon(m.category)}
                  </div>
                  <div className="flex-1">
                     <div className="font-medium dark:text-white text-sm leading-snug">{m.title}</div>
                     <div className="text-xs font-medium text-gray-400 mt-1">{new Date(m.date).toLocaleDateString('hi-IN', { dateStyle: 'medium' })} • {m.category}</div>
                  </div>
                  <button 
                       onClick={(e) => {
                           e.stopPropagation();
                           if (confirm(`क्या आप '${m.title}' कार्यक्रम को हटाना चाहते हैं?`)) {
                               setMeetings(prev => prev.filter(meet => meet.id !== m.id));
                           }
                       }}
                       className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer"
                   >
                      <Trash2 size={16} />
                  </button>
                  <ChevronRight size={16} className="text-gray-300"/>
               </div>
             ))}
             {upcomingMeetings.length === 0 && (
               <div className="py-10 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-lg border dark:border-gray-700 text-xs">कोई आगामी कार्यक्रम नहीं है</div>
             )}
         </div>
       </motion.section>
       </div>
     </div>
    );
  };

  const renderSwayamsevak = () => {
    // Filter by search and area first
    const filtered = contacts.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(peopleSearch.toLowerCase()) || c.phone.includes(peopleSearch);
      const matchArea = (dashKhand === 'all' || c.khandId === dashKhand) && (dashMandal === 'all' || c.mandalId === dashMandal);
      return matchSearch && matchArea;
    });

    // Grouping logic: Mandal -> Village -> Contacts
    const grouped: Record<string, Record<string, typeof contacts>> = {};
    filtered.forEach(c => {
      const mandalName = getMandalName(c.mandalId);
      const villageName = getVillageName(c.villageId);
      if (!grouped[mandalName]) grouped[mandalName] = {};
      if (!grouped[mandalName][villageName]) grouped[mandalName][villageName] = [];
      grouped[mandalName][villageName].push(c);
    });

    return (
     <div className="p-3 pb-24 space-y-3">
       <div className="sticky top-0 z-30 pt-3 pb-3 -mt-3 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm -mx-3 px-3 space-y-3">
         <header className="flex justify-between items-center relative overflow-hidden bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-2.5 rounded-2xl shadow-sm">
           <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl flex-none z-0"></div>
           <div className="relative z-10 flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 p-2">
               <UsersRound size={20} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col py-1">
               <h1 className="text-[20px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-normal pt-1">स्वयंसेवक एवं संपर्क</h1>
               <span className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-snug pb-1">कुल डेटा: {contacts.length}</span>
             </div>
           </div>
           <button onClick={() => {
              setEditingContact({ category: 'स्वयंसेवक' } as any);
              setIsAddingContact(true);
            }} className="relative z-10 p-2.5 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/30 active:scale-90 transition-all">
             <Plus size={20} strokeWidth={2.5} />
           </button>
         </header>

         <div className="flex flex-col gap-2 bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-2.5 rounded-2xl shadow-sm">
           <div className="flex items-center gap-2 px-1 text-gray-500 dark:text-gray-400">
             <MapPin size={14} />
             <span className="text-[10px] font-bold uppercase tracking-widest">क्षेत्र एवं खोज</span>
           </div>
           <div className="flex gap-2">
             <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
               <input type="text" placeholder="खोजें..." value={peopleSearch} onChange={e=>setPeopleSearch(e.target.value)} className="w-full bg-gray-50 dark:bg-[#0a101f] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 text-sm p-3 pl-8 rounded-xl outline-none shadow-sm font-medium focus:ring-2 focus:ring-indigo-500/50 transition-all" />
             </div>
             <div className="flex gap-1.5 shrink-0">
               <div className="relative">
                 <select 
                    value={dashKhand} 
                    onChange={(e) => { setDashKhand(e.target.value); setDashMandal('all'); }} 
                    className="appearance-none bg-gray-50 dark:bg-[#0a101f] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold py-2.5 pl-3 pr-8 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all shadow-sm uppercase tracking-wide"
                 >
                    <option value="all">सभी खंड</option>
                    {khands.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
                 </select>
                 <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
               <div className="relative">
                 <select 
                    value={dashMandal} 
                    onChange={(e) => setDashMandal(e.target.value)} 
                    className="appearance-none bg-gray-50 dark:bg-[#0a101f] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-[11px] font-bold py-2.5 pl-3 pr-8 rounded-xl focus:ring-2 focus:ring-indigo-500/30 outline-none transition-all shadow-sm uppercase tracking-wide"
                 >
                    <option value="all">सभी मंडल</option>
                    {mandals.filter(m => dashKhand === 'all' || m.khandId === dashKhand).map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                 </select>
                 <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
               </div>
             </div>
           </div>
         </div>
       </div>

       <div className="space-y-4">
          {filtered.length === 0 ? (
             <div className="py-12 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 rounded-2xl text-xs uppercase tracking-widest opacity-60">कोई संपर्क नहीं मिला</div>
          ) : (
            Object.entries(grouped).sort().map(([mandalName, villageGroup]) => (
             <div key={mandalName} className="space-y-2">
               <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.3 }} className="flex items-center gap-2 px-1">
                 <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/50 px-2.5 py-1 rounded-md shadow-sm">{mandalName}</h3>
                 <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/20 to-transparent"></div>
               </motion.div>
               <div className="grid grid-cols-1 gap-4">
                  {Object.entries(villageGroup).sort().map(([villageName, people]) => (
                   <div key={villageName} className="space-y-1.5">
                     <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1, duration: 0.3 }} className="flex items-center gap-1.5 mt-2 mb-1">
                       <div className="bg-gradient-to-r from-blue-500/10 to-transparent px-3 py-1 rounded-r-lg border-l-2 border-blue-500 flex items-center gap-1.5">
                         <MapPin size={12} className="text-blue-600 dark:text-blue-400" />
                         <span className="text-[13px] font-bold text-blue-800 dark:text-blue-200 leading-none">{villageName} <span className="opacity-60 text-[10px]">({people.length} स्वयंसेवक)</span></span>
                       </div>
                     </motion.div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                        {people.map((c) => {
                          const recentlyCalled = isRecentlyCalled(c.id);
                          const responsibility = c.volunteerProfile?.currentResponsibility;
                          return (
                            <motion.div 
                              key={c.id} 
                              initial={{ opacity: 0, scale: 0.95 }} 
                              animate={{ opacity: 1, scale: 1 }}
                              viewport={{ once: true, margin: '-20px' }} 
                              transition={{ duration: 0.3 }} 
                              onClick={() => setSelectedContactId(c.id)} 
                              className={`glass dark:glass-dark border border-white/10 dark:border-gray-800 p-3 rounded-xl flex items-center gap-3 active:scale-[0.98] transition-all shadow-sm group`}
                            >
                             <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2">
                                 <h4 className="font-medium dark:text-white truncate text-base leading-[1.6] py-0.5 font-hindi">{c.name}</h4>
                                  {responsibility && (
                                   <span className="text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-1 rounded-md border border-blue-500/10 truncate leading-relaxed font-hindi">{responsibility}</span>
                                  )}
                               </div>
                               <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mt-0.5 flex items-center gap-1.5 font-hindi">
                                <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-1 rounded-md leading-relaxed">{c.category}</span>
                                <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                                <span className={`${c.status === Status.SAKRIYA ? "text-green-600 dark:text-green-400" : "text-blue-600 dark:text-blue-400"} leading-relaxed py-0.5`}>{c.status}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <a 
                                 href={`tel:${c.phone}`} 
                                 onClick={(e) => { e.stopPropagation(); handleDial(c.id); }} 
                                 className={`p-2.5 rounded-xl transition-all ${recentlyCalled ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                               >
                                <Phone size={16} />
                              </a>
                              <a
                                 href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                                 target="_blank" rel="noopener noreferrer" 
                                 onClick={(e) => e.stopPropagation()}
                                 className="p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500 transition-all flex items-center justify-center shadow-sm hover:scale-105 active:scale-95"
                               >
                                <WhatsappIcon size={16} />
                              </a>
                            </div>
                           </motion.div>
                          );
                        })}
                     </div>
                   </div>
                  ))}
               </div>
             </div>
            ))
          )}
       </div>
     </div>
    );
  };


  const renderPeople = () => {
    const handleSelectAll = (isFiltered: boolean) => {
       const ids = isFiltered ? filteredPeople.map(c => c.id) : contacts.map(c => c.id);
       setSelectedPeopleIds(ids);
    };

    return (
      <div className="p-3 pb-24 space-y-3 animate-in slide-in-from-right duration-300">
        <header className="flex justify-between items-center bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-2 rounded-2xl shadow-sm sticky top-2 z-30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg">
              <Users size={18}/>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold dark:text-white tracking-tight leading-normal">संपर्क</h1>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-1">कुल डेटा: <AnimatedNumber value={filteredPeople.length} /></span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                setIsSelectionMode(!isSelectionMode);
                if (isSelectionMode) setSelectedPeopleIds([]);
              }} 
              className={`p-2.5 rounded-xl transition-all shadow-lg active:scale-90 ${isSelectionMode ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'}`}
              title={isSelectionMode ? "चयन समाप्त करें" : "बल्क चयन"}
            >
              <CheckCircle2 size={20}/>
            </button>
            <button onClick={() => setExportTarget({ data: filteredPeople, title: 'संपर्क_सूची' })} className="p-2.5 bg-[#080d19]/10 dark:bg-white/10 text-gray-700 dark:text-gray-200 rounded-xl shadow-lg active:scale-90 transition-all">
              <Download size={20}/>
            </button>
            <button onClick={() => setIsAddingContact(true)} className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Plus size={20}/></button>
          </div>
        </header>

        {isSelectionMode && (
          <div className="flex gap-2 p-1 animate-in slide-in-from-top-2 duration-300 overflow-x-auto no-scrollbar">
             <button onClick={() => handleSelectAll(true)} className="flex-none px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-200 text-xs font-bold rounded-lg whitespace-nowrap">फिल्टर किए गए सभी चुनें ({filteredPeople.length})</button>
             <button onClick={() => setSelectedPeopleIds([])} className="flex-none px-3 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 border border-red-200 text-xs font-bold rounded-lg whitespace-nowrap">चयन हटाएं</button>
             {selectedPeopleIds.length > 0 && (
               <button onClick={() => setIsBulkUpdateModalOpen(true)} className="flex-none px-3 py-1.5 bg-green-600 text-white shadow-md text-xs font-bold rounded-lg whitespace-nowrap">बल्क अपडेट ({selectedPeopleIds.length})</button>
             )}
          </div>
        )}

       <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
         <input type="text" placeholder="खोजें..." value={peopleSearch} onChange={e=>setPeopleSearch(e.target.value)} className="w-full bg-white/40 dark:bg-[#080d19]/40 border border-white/50 dark:border-gray-800 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 text-sm p-2 pl-8 rounded-xl outline-none shadow-sm font-medium" />
       </div>

       <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={12} />
            <select 
              value={peopleKhandFilter} 
              onChange={(e) => { setPeopleKhandFilter(e.target.value); setPeopleMandalFilter('all'); }} 
              className="w-full bg-white/40 dark:bg-[#080d19]/40 border border-white/50 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs p-2 pl-8 rounded-xl outline-none shadow-sm font-bold appearance-none"
            >
              <option value="all">सभी खंड</option>
              {khands.map(k => <option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
          </div>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500" size={12} />
            <select 
              value={peopleMandalFilter} 
              onChange={(e) => setPeopleMandalFilter(e.target.value)} 
              disabled={peopleKhandFilter === 'all'}
              className="w-full bg-white/40 dark:bg-[#080d19]/40 border border-white/50 dark:border-gray-800 text-gray-800 dark:text-gray-100 text-xs p-2 pl-8 rounded-xl outline-none shadow-sm font-bold appearance-none disabled:opacity-50"
            >
              <option value="all">सभी मंडल</option>
              {mandals.filter(m => m.khandId === peopleKhandFilter).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={12} />
          </div>
        </div>
        
        {peopleShikshitFilter === 'yes' && (
         <div className="animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 px-1 tracking-tight">शिक्षित वर्ग चुनें:</div>
           <div className="flex flex-wrap gap-2">
              {['प्रारंभिक शिक्षा वर्ग', 'प्राथमिक शिक्षा वर्ग', 'प्रथम वर्ष / संघ शिक्षा वर्ग', 'द्वितीय वर्ष / का वि व - प्रथम', 'तृतीय वर्ष / का वि व - द्वितीय'].map(level => {
                 const isSelected = peopleShikshanLevelFilter.includes(level);
                 return (
                  <button
                     key={level}
                     onClick={() => setPeopleShikshanLevelFilter(prev => isSelected ? prev.filter(l => l !== level) : [...prev, level])}
                     className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border ${isSelected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20' : 'bg-white/60 dark:bg-[#080d19]/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-gray-50'}`}
                   >
                     {level}
                  </button>
                 )
              })}
           </div>
         </div>
        )}

        {/* Compact Filters Banner */}
        {(peopleStatusFilter !== 'all' || peopleCategoryFilter !== 'all' || peopleAgeCategoryFilter !== 'all' || peopleShikshitFilter !== 'all' || peopleShikshanLevelFilter.length > 0 || peopleKhandFilter !== 'all' || peopleMandalFilter !== 'all') && (
          <div className="flex flex-wrap gap-1.5 animate-in fade-in duration-200">
              {peopleKhandFilter !== 'all' && (
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 border border-blue-200/50 dark:border-blue-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {getKhandName(peopleKhandFilter)}
                </div>
              )}
              {peopleMandalFilter !== 'all' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-200/50 dark:border-indigo-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {getMandalName(peopleMandalFilter)}
                </div>
              )}
              {peopleCategoryFilter !== 'all' && (
                <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 border border-indigo-200/50 dark:border-indigo-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {peopleCategoryFilter}
                </div>
              )}
              {peopleStatusFilter !== 'all' && (
                <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 border border-orange-200/50 dark:border-orange-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {peopleStatusFilter}
                </div>
              )}
              {peopleAgeCategoryFilter !== 'all' && (
                <div className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 border border-pink-200/50 dark:border-pink-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {peopleAgeCategoryFilter}
                </div>
              )}
              {peopleShikshitFilter !== 'all' && (
                <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 border border-purple-200/50 dark:border-purple-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight">
                    {peopleShikshitFilter === 'yes' ? 'शिक्षित' : 'अशिक्षित'}
                </div>
              )}
              {peopleShikshanLevelFilter.length > 0 && (
                <div className="bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 border border-cyan-200/50 dark:border-cyan-800/30 px-2 py-0.5 rounded-lg text-xs font-medium uppercase tracking-tight line-clamp-1 max-w-[200px]">
                    {peopleShikshanLevelFilter.map(l => l.split(' ')[0]).join(', ')}
                </div>
              )}
             <button 
                 onClick={() => { setPeopleCategoryFilter('all'); setPeopleStatusFilter('all'); setPeopleAgeCategoryFilter('all'); setPeopleShikshitFilter('all'); setPeopleShikshanLevelFilter([]); setPeopleKhandFilter('all'); setPeopleMandalFilter('all'); }}
                 className="text-xs font-medium text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors ml-1"
              >
                 क्लियर
             </button>
          </div>
        )}

        <div className="space-y-8 pb-32">
          {filteredPeople.length === 0 ? (
            <div className="py-12 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 rounded-2xl text-xs uppercase tracking-widest opacity-60 font-hindi">कोई संपर्क नहीं मिला</div>
          ) : (
            Object.values(groupedPeopleData).sort((a: any, b: any) => a.name.localeCompare(b.name)).map((khand: any, ki: number) => (
              <motion.div 
                key={khand.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: ki * 0.05 }}
                className="space-y-4"
              >
                {/* Khand Graphic Header */}
                <div className="relative overflow-hidden p-5 rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 shadow-2xl shadow-blue-500/30 border border-white/10">
                   <div className="absolute -top-12 -right-12 p-1 opacity-10 -rotate-12">
                      <MapPin size={200} />
                   </div>
                   <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent"></div>
                   
                   <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
                            <MapPin className="text-white" size={28} />
                         </div>
                         <div>
                            <h2 className="text-2xl font-bold text-white font-hindi tracking-tight">{khand.name} खंड</h2>
                            <div className="flex items-center gap-2 mt-1">
                               <div className="h-1 w-10 bg-orange-400 rounded-full"></div>
                               <span className="text-[10px] text-blue-100 font-bold uppercase tracking-[0.2em]">खंड इकाई</span>
                            </div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                         <div className="px-4 py-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 text-[11px] font-bold text-white uppercase tracking-wider">
                            {(Object.values(khand.mandals) as any[]).reduce((acc: number, m: any) => acc + (Object.values(m.villages) as any[]).reduce((acc2: number, v: any) => acc2 + (v.contacts as any[]).length, 0), 0) as number} संपर्क
                         </div>
                      </div>
                   </div>
                </div>

                <div className="space-y-10 pl-0 sm:pl-0 ml-0 mt-4">
                  {Object.values(khand.mandals).sort((a: any, b: any) => a.name.localeCompare(b.name)).map((mandal: any, mi: number) => (
                    <motion.div 
                      key={mandal.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4 }}
                      className="space-y-5 relative"
                    >

                      
                      {/* Mandal Header */}
                      <div className="flex items-center gap-4 group">
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg border border-indigo-100 dark:border-indigo-900/30 group-hover:scale-110 transition-all duration-300">
                           <Building2 size={22} />
                        </div>
                        <div className="flex-1">
                           <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 font-hindi">{mandal.name} मंडल</h3>
                           <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-widest">मंडल क्षेत्र</span>
                              <div className="h-[1px] flex-1 bg-indigo-500/20"></div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-8 pl-1 border-l border-indigo-500/5 ml-1">
                        {Object.values(mandal.villages).sort((a: any, b: any) => a.name.localeCompare(b.name)).map((village: any) => (
                          <div key={village.id} className="space-y-4 relative">
                            {/* Connector Line to Village */}
                            <div className="absolute -left-[14px] top-4 w-3.5 h-[1px] bg-indigo-500/10"></div>
                            
                            {/* Village Header */}
                            <div className="flex items-center justify-between pr-2">
                               <div className="flex items-center gap-2.5 px-4 py-1.5 bg-gradient-to-r from-gray-50 to-transparent dark:from-gray-800/40 dark:to-transparent rounded-r-none rounded-l-xl border-l-4 border-emerald-500">
                                  <Mountain className="text-emerald-500" size={16} />
                                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300 font-hindi">{village.name} ग्राम</span>
                               </div>
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40"></div>
                                  <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500 uppercase tracking-tighter">{village.contacts.length} स्वयंसेवक</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pl-2">
                              {village.contacts.map((c: any) => {
                                const recentlyCalled = isRecentlyCalled(c.id);
                                const responsibility = c.volunteerProfile?.currentResponsibility;
                                const isSelected = selectedPeopleIds.includes(c.id);
                                return (
                                   <motion.div 
                                      key={c.id} 
                                      layout
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.3 }}
                                      onClick={() => isSelectionMode ? toggleSelection(c.id) : setSelectedContactId(c.id)} 
                                      className={`py-2 px-3 rounded-2xl flex items-center gap-3 active:scale-[0.98] transition-all shadow-md border ${isSelected ? 'glass dark:glass-dark border-indigo-500 ring-4 ring-indigo-500/20' : 'glass dark:glass-dark border-white/10 dark:border-gray-800/50'}`}
                                   >
                                     {isSelectionMode ? (
                                       <div className={`w-10 h-10 rounded-xl flex-none flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700'}`}>
                                          {isSelected ? <Check size={20} strokeWidth={3} /> : <div className="w-5 h-5 rounded-lg border-2 border-gray-300 dark:border-gray-600"></div>}
                                       </div>
                                     ) : (
                                       <div className={`w-10 h-10 rounded-xl flex-none flex items-center justify-center text-white font-bold text-base shadow-inner ${recentlyCalled ? 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/20' : 'bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/20'}`}>
                                          {c.name[0]}
                                       </div>
                                     )}
                                     <div className="flex-1 min-w-0">
                                       <div className="flex items-center gap-1.5">
                                         <h4 className="font-medium text-gray-800 dark:text-white truncate text-[15px] leading-tight py-0.5 font-hindi">{c.name}</h4>
                                          {responsibility && (
                                           <span className="text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-md border border-blue-500/10 truncate max-w-[50%] leading-relaxed font-hindi">{responsibility}</span>
                                          )}
                                       </div>
                                       <div className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5 overflow-hidden font-hindi">
                                         <span className="bg-gray-100 dark:bg-gray-800/80 px-1.5 py-0.5 rounded-md whitespace-nowrap leading-relaxed">{c.category}</span>
                                         <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700 shrink-0"></div>
                                         <span className="text-blue-600 dark:text-blue-400 font-extrabold whitespace-nowrap leading-relaxed py-0.5">{c.status}</span>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-1.5 flex-none shrink-0">
                                       <a 
                                          href={`tel:${c.phone}`} 
                                          onClick={(e) => { e.stopPropagation(); handleDial(c.id); }} 
                                          className={`w-9 h-9 rounded-xl transition-all flex items-center justify-center shadow-sm ${recentlyCalled ? 'bg-orange-500 text-white' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'}`}
                                        >
                                         <Phone size={16} />
                                       </a>
                                       <a
                                          href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                                          target="_blank" rel="noopener noreferrer" 
                                          onClick={(e) => e.stopPropagation()}
                                          className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-500 transition-all flex items-center justify-center shadow-sm hover:scale-105 active:scale-95"
                                        >
                                         <WhatsappIcon size={16} />
                                       </a>
                                     </div>
                                   </motion.div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    );
  };
  const renderTrips = () => {
    if (viewingTrip) {
      return (
       <TripDetailModal
           trip={trips.find(t => t.id === viewingTrip.id) || viewingTrip}
           khands={khands} mandals={mandals} villages={villages} contacts={contacts} ideas={ideas}
           onBack={() => setViewingTrip(null)}
           onEdit={() => { setEditingTrip(trips.find(t => t.id === viewingTrip.id) || viewingTrip); setViewingTrip(null); }}
           onUpdate={(updates: Partial<TripPlan>) => handleUpdateTrip(viewingTrip.id, updates)}
           whatsappMessage={whatsappMessage}
           onLogVisit={(contactId: string) => setIsLoggingVisit(contactId)}
        />
      );
    }

    const now = new Date();
    const sortedTrips = [...trips].filter(trip => {
      const pDate = parseISO(trip.date);
      if (tripTimeFilter === 'today') return isSameDay(pDate, now);
      if (tripTimeFilter === 'yesterday') return isSameDay(pDate, subDays(now, 1));
      if (tripTimeFilter === 'week') return isSameWeek(pDate, now);
      if (tripTimeFilter === 'month') return isSameMonth(pDate, now);
      if (tripTimeFilter === 'year') return String(pDate.getFullYear()) === String(now.getFullYear());
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Generate Dashboard Stats
    const statsByKhand: Record<string, { completed: number, planned: number, mandals: Record<string, { completed: number, planned: number }> }> = {};
    khands.forEach(k => {
      statsByKhand[k.name] = { completed: 0, planned: 0, mandals: {} };
      mandals.filter(m => m.khandId === k.id).forEach(m => {
        statsByKhand[k.name].mandals[m.name] = { completed: 0, planned: 0 };
      });
    });

    sortedTrips.forEach(t => {
      const kName = getKhandName(t.khandId);
      const mName: string = getMandalName(t.mandalId) as string;
      if (statsByKhand[kName]) {
        statsByKhand[kName].planned++;
        if (t.isCompleted) statsByKhand[kName].completed++;
        if (statsByKhand[kName].mandals[mName]) {
          statsByKhand[kName].mandals[mName].planned++;
          if (t.isCompleted) statsByKhand[kName].mandals[mName].completed++;
        }
      }
    });
    
    return (
     <div className="p-3 pb-24 space-y-3 animate-in slide-in-from-right duration-300">
       <header className="flex justify-between items-center bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-2 rounded-2xl shadow-sm sticky top-2 z-30">
         <div className="flex items-center gap-2">
           <div className="p-2 bg-orange-600 text-white rounded-xl shadow-lg">
             <CalendarDays size={18}/>
           </div>
           <div className="flex flex-col">
             <h1 className="text-lg font-bold dark:text-white tracking-tight leading-normal">प्रवास योजना</h1>
             <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400 uppercase tracking-widest mt-0.5">नियोजन</span>
           </div>
         </div>
         <div className="flex items-center gap-2">
           <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border dark:border-gray-700">
             <button onClick={() => setTripViewMode('list')} className={`p-1.5 rounded-lg transition-all ${tripViewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-400'}`}><LayoutList size={16}/></button>
             <button onClick={() => setTripViewMode('calendar')} className={`p-1.5 rounded-lg transition-all ${tripViewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600' : 'text-gray-500 hover:text-orange-400'}`}><CalendarIcon size={16}/></button>
           </div>
           <button onClick={() => setIsAddingTrip(true)} className="p-2.5 bg-orange-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><Plus size={20}/></button>
         </div>
       </header>

        {tripViewMode === 'list' ? (
         <>
            {/* Condensed Dashboard */}
            {Object.keys(statsByKhand).length > 0 && (
             <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-2.5 rounded-2xl shadow-sm">
               <div className="flex items-center justify-between mb-2 px-1">
                 <div className="text-xs font-medium text-gray-400 uppercase tracking-widest">प्रवास सारांश</div>
                 <div className="flex gap-2">
                   <div className="flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                     <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">पूर्ण</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                     <span className="text-[10px] font-medium text-gray-500 uppercase tracking-tight">कुल</span>
                   </div>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-2">
                  {Object.entries(statsByKhand).map(([kName, data]) => (
                   <div key={kName} className="bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-800/30 rounded-xl p-2 min-h-0 overflow-hidden">
                     <div className="flex justify-between items-center mb-1 pb-1 border-b dark:border-orange-800/50">
                       <span className="text-[11px] font-medium dark:text-orange-200 truncate pr-1">{kName}</span>
                       <div className="flex items-center text-[10px] font-medium flex-none">
                         <span className="text-green-600 dark:text-green-400"><AnimatedNumber value={data.completed} /></span>
                         <span className="text-gray-400 mx-0.5">/</span>
                         <span className="text-blue-600 dark:text-blue-400"><AnimatedNumber value={data.planned} /></span>
                       </div>
                     </div>
                     <div className="grid grid-cols-1 gap-0.5 max-h-[100px] overflow-y-auto no-scrollbar">
                        {Object.entries(data.mandals).filter(([_, c]) => c.planned > 0).map(([mName, counts]) => (
                         <div key={mName} className="flex justify-between items-center px-1">
                           <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 truncate max-w-[60%]">{mName}</span>
                           <div className="flex items-center gap-0.5">
                             <div className={`w-1 h-1 rounded-full ${counts.completed > 0 ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-800'}`}></div>
                             <span className={`text-[10px] font-medium ${counts.planned > 0 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-300 dark:text-gray-700'}`}><AnimatedNumber value={counts.planned} /></span>
                           </div>
                         </div>
                        ))}
                     </div>
                   </div>
                  ))}
               </div>
             </div>
            )}

            {/* Compact Time Filter */}
           <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'सभी' },
                { id: 'today', label: 'आज' },
                { id: 'week', label: 'सा' },
                { id: 'month', label: 'मा' },
                { id: 'year', label: 'वृ' }
              ].map(f => (
               <button key={f.id} onClick={() => setTripTimeFilter(f.id as any)} className={`flex-none px-3.5 py-1.5 rounded-xl text-[11px] font-medium uppercase transition-all border ${tripTimeFilter === f.id ? 'bg-orange-600 text-white border-orange-600 shadow-sm' : 'bg-white/40 dark:bg-[#080d19]/40 border-white/50 dark:border-gray-700/50 text-gray-500 hover:border-orange-400/50'}`}>{f.label}</button>
              ))}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {sortedTrips.length === 0 ? (
               <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-8 rounded-2xl text-center text-gray-400 font-medium text-[10px] uppercase tracking-widest italic opacity-60">कोई योजना नहीं</div>
              ) : (
                sortedTrips.map(trip => {
                  const hasIdea = ideas.some(i => !i.isCompleted && (i.mandalId === trip.mandalId || trip.villageIds.includes(i.villageId) || trip.peopleIds.includes(i.contactId)));
                  return (
                   <div key={trip.id} onClick={() => setViewingTrip(trip)} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-3 rounded-xl shadow-sm border-l-4 border-l-orange-500 relative animate-in slide-in-from-bottom-2 duration-300">
                     <div className="flex justify-between items-start mb-1.5">
                       <div className="min-w-0 pr-4">
                         <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-tighter mb-0.5">
                            {format(parseISO(trip.date), 'd MMMM, yyyy')}
                         </div>
                         <h4 className="font-medium dark:text-white text-base truncate flex items-center gap-1.5 leading-snug">
                            {getMandalName(trip.mandalId)} 
                           <span className="text-sm font-medium text-gray-400">({getKhandName(trip.khandId)})</span>
                            {hasIdea && !trip.isCompleted &&<span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                         </h4>
                       </div>
                       <div className={`px-1.5 py-0.5 rounded-lg text-[11px] font-medium uppercase ${trip.isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'}`}>
                          {trip.isCompleted ? 'पूर्ण' : 'लंबित'}
                       </div>
                     </div>
                      
                     <div className="flex flex-wrap gap-1 mb-2">
                        {trip.villageIds.slice(0, 4).map(vid => (
                         <span key={vid} className="px-1.5 py-0.5 bg-gray-50/50 dark:bg-gray-800 rounded-lg text-xs font-medium dark:text-gray-300 border dark:border-gray-700/50">{getVillageName(vid)}</span>
                        ))}
                        {trip.villageIds.length > 4 &&<span className="text-xs text-gray-400 font-medium">+{trip.villageIds.length - 4}</span>}
                     </div>

                     <div className="flex items-center gap-1.5 pt-2 border-t dark:border-gray-800/50">
                        {!trip.isCompleted && (
                         <button onClick={(e) => { e.stopPropagation(); handleUpdateTrip(trip.id, { isCompleted: true }); }} className="flex-1 py-1.5 bg-green-500/10 text-green-600 rounded-lg text-xs font-medium uppercase flex items-center justify-center gap-1 active:scale-[0.98] transition-all">
                           <CheckCircle2 size={10}/> पूर्ण
                         </button>
                        )}
                       <button onClick={(e) => { e.stopPropagation(); setEditingTrip(trip); }} className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg active:scale-[0.98] transition-all"><Edit2 size={10}/></button>
                       <button 
                          onClick={(e) => { 
                            e.stopPropagation();
                            setConfirmation({
                              title: 'हटाएं?',
                              message: 'हटाना चाहते हैं?',
                              onConfirm: () => {
                                setTrips(prev => prev.filter(t => t.id !== trip.id));
                                setConfirmation(null);
                              }
                            });
                          }} 
                          className="p-1.5 bg-red-500/10 text-red-600 rounded-lg active:scale-[0.98] transition-all"
                        >
                         <Trash2 size={10}/>
                       </button>
                     </div>
                   </div>
                  );
                })
              )}
           </div>
         </>
        ) : (
         <TripCalendar 
            trips={trips} 
            viewType={calendarViewType} 
            setViewType={setCalendarViewType}
            currentDate={currentCalendarDate}
            setCurrentDate={setCurrentCalendarDate}
            onSelectTrip={(t: TripPlan) => setViewingTrip(t)}
            getMandalName={getMandalName}
            getKhandName={getKhandName}
            getVillageName={getVillageName}
          />
        )}
     </div>
    );
  };

  const renderLists = () => {
    if (selectedMeetingId) {
      const meeting = meetings.find(m => m.id === selectedMeetingId);
      if (!meeting) return null;

      const list = customLists.find(l => l.id === meeting.listId);

      if (!list) {
         return (
          <div className="p-6 flex flex-col items-center justify-center space-y-6 pt-32 animate-in fade-in duration-300">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-2">
               <Trash2 size={32} />
            </div>
            <div className="text-gray-500 font-medium text-center font-hindi">यह बैठक जिस सूची से जुड़ी थी वह हटा दी गई है, या यह बैठक किसी सूची से नहीं जुड़ी है।</div>
            <div className="flex w-full gap-3">
                <button onClick={() => { setSelectedMeetingId(null); setSelectedListId(null); setActiveTab('home'); }} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 rounded-md font-medium active:scale-95 transition-all text-gray-600 dark:text-gray-300 font-hindi">वापस जाएं</button>
                <button 
                    onClick={() => {
                      setMeetings(prev => prev.filter(m => m.id !== meeting.id));
                      setSelectedMeetingId(null);
                      setSelectedListId(null);
                      setActiveTab('home');
                    }}
                    className="flex-1 p-4 bg-red-600 text-white rounded-md font-medium active:scale-95 transition-all shadow-md font-hindi"
                 >
                    बैठक हटाएं
                </button>
            </div>
          </div>
         );
      }

      // If we reach here, list exists
      const listContacts = contacts.filter(c => list.peopleIds.includes(c.id));
      
      const togglePresence = (cid: string) => {
        setMeetings(prev => prev.map(m => {
          if (m.id !== meeting.id) return m;
          const isPresent = m.presentPeopleIds.includes(cid);
          return {
            ...m,
            presentPeopleIds: isPresent 
              ? m.presentPeopleIds.filter(id => id !== cid)
              : [...m.presentPeopleIds, cid]
          };
        }));
      };

      return (
       <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
         <header className="flex items-center gap-4">
           <button onClick={() => setSelectedMeetingId(null)} className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm border dark:border-gray-700 active:scale-95 transition-all"><ArrowLeft size={20} className="dark:text-white"/></button>
           <div className="flex-1">
             <h2 className="text-xl font-bold dark:text-white font-hindi">{meeting.title}</h2>
             <div className="text-sm font-medium text-gray-400 uppercase">{new Date(meeting.date).toLocaleDateString('hi-IN')}</div>
           </div>
           <button 
              onClick={() => {
                setConfirmation({
                  title: 'बैठक हटाएं?',
                  message: `क्या आप '${meeting.title}' बैठक को हटाना चाहते हैं?`,
                  onConfirm: () => {
                    setMeetings(prev => prev.filter(m => m.id !== meeting.id));
                    setSelectedMeetingId(null);
                    setConfirmation(null);
                  }
                });
              }}
              className="p-3 bg-red-50 text-red-600 rounded-md active:scale-95 transition-all"
            >
             <Trash2 size={20}/>
           </button>
         </header>

                {/* RSVP Summary */}
               <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'आ रहे हैं', count: listContacts.filter(c => meeting.attendance[c.id] === AttendanceStatus.COMING).length, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
                    { label: 'नहीं आ रहे', count: listContacts.filter(c => meeting.attendance[c.id] === AttendanceStatus.NOT_COMING).length, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
                    { label: 'निश्चित नहीं', count: listContacts.filter(c => meeting.attendance[c.id] === AttendanceStatus.NOT_CONFIRMED).length, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
                    { label: 'लंबित', count: listContacts.filter(c => !meeting.attendance[c.id] || meeting.attendance[c.id] === AttendanceStatus.PENDING).length, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800' },
                  ].map(s => (
                   <div key={s.label} className={`${s.bg} p-3 rounded-md border dark:border-gray-700 text-center space-y-1`}>
                     <div className={`text-lg font-medium ${s.color}`}><AnimatedNumber value={s.count} /></div>
                     <div className="text-xs font-medium uppercase text-gray-400 font-hindi">{s.label}</div>
                   </div>
                  ))}
               </div>

          {meeting.notes && (
           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-md border border-blue-100 dark:border-blue-900/30">
              <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase mb-1 font-hindi">बैठक के नोट्स</div>
              <div className="text-xs dark:text-gray-300 italic">"{meeting.notes}"</div>
           </div>
          )}

         <button 
             onClick={() => {
                 setSelectedMeetingId(null);
                 setSelectedListId(null);
                 setActiveTab('events');
             }}
             className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-800 shadow-sm active:scale-95 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-3 font-medium font-hindi">
               <Flag size={20} />
                विस्तृत कार्यक्रम नियोजन में जाएं
            </div>
            <ChevronRight size={20} className="opacity-50 text-purple-400" />
         </button>
          
         <div className="space-y-6">
           <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-3">
             <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md w-fit mb-2 font-hindi">उपस्थिति और प्रतिपुष्टि</h3>
              {listContacts.map(c => {
                const status = meeting.attendance[c.id] || AttendanceStatus.PENDING;
                const isPresent = meeting.presentPeopleIds.includes(c.id);
                return (
                 <div key={c.id} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-4 rounded-lg border dark:border-gray-700 shadow-sm space-y-4">
                   <div className="flex justify-between items-center">
                     <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-medium ${isPresent ? 'bg-green-500 shadow-lg' : 'bg-gray-400'}`}>
                          {isPresent ?<UserCheck size={14}/> : c.name[0]}
                       </div>
                       <div>
                         <div className="font-medium dark:text-white text-sm font-hindi">{c.name} ({getVillageName(c.villageId)})</div>
                       </div>
                     </div>
                     <div className="flex gap-2">
                       <button 
                          onClick={() => togglePresence(c.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-[10px] font-medium uppercase transition-all font-hindi ${isPresent ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                        >
                         <UserCheck size={14}/> {isPresent ? 'उपस्थित' : 'अनुपस्थित'}
                       </button>
                       <div className="flex items-center gap-1.5 flex-none shrink-0">
                         <a href={`tel:${c.phone}`} onClick={() => handleDial(c.id)} className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-sm flex items-center justify-center"><Phone size={14}/></a>
                         <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="p-2 bg-[#25D366]/10 text-[#25D366] rounded-sm flex items-center justify-center hover:bg-[#25D366]/20 transition-colors"><WhatsappIcon size={14}/></a>
                       </div>
                     </div>
                   </div>
                    
                   <div className="flex gap-1">
                      {[AttendanceStatus.COMING, AttendanceStatus.NOT_COMING, AttendanceStatus.NOT_CONFIRMED].map((s) => (
                       <button 
                          key={s}
                          onClick={() => {
                            setMeetings(prev => prev.map(m => m.id === meeting.id ? { ...m, attendance: { ...m.attendance, [c.id]: s } } : m));
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-[8px] font-medium uppercase transition-all font-hindi ${status === s ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-900 text-gray-400 border dark:border-gray-800 focus:outline-none'}`}
                        >
                          {s}
                       </button>
                      ))}
                   </div>
                 </div>
                );
              })}
              {listContacts.length === 0 && (
               <div className="py-20 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 text-xs font-hindi">सूची में कोई सदस्य नहीं है</div>
              )}
           </motion.section>
         </div>
       </div>
      );
    }

    if (selectedListId) {
      const list = customLists.find(l => l.id === selectedListId);
      if (!list) return null;
      const listMeetings = meetings.filter(m => m.listId === list.id);
      
      return (
       <div className="p-4 pb-24 space-y-8 animate-in slide-in-from-right duration-300">
          <header className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <button onClick={() => setSelectedListId(null)} className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm border dark:border-gray-700"><ArrowLeft size={20} className="dark:text-white"/></button>
               <h2 className="text-xl font-bold dark:text-white font-hindi">{list.name}</h2>
             </div>
             <div className="flex gap-2">
               <button 
                  onClick={() => setExportTarget({ data: contacts.filter(c => list.peopleIds.includes(c.id)), title: `सूची_${list.name}` })}
                  className="p-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-md shadow-sm active:scale-95 transition-all"
                >
                 <Download size={18}/>
               </button>
               <button 
                  onClick={() => setIsManagingMembers(true)}
                  className="p-3 bg-indigo-600 text-white rounded-md shadow-sm active:scale-95 transition-all"
                >
                 <UserPlus size={18}/>
               </button>
               <button 
                  onClick={() => setIsAddingMeeting(true)}
                  className="p-3 bg-blue-600 text-white rounded-md shadow-lg active:scale-95 transition-all"
                >
                 <CalendarCheck size={18}/>
               </button>
             </div>
          </header>

          <div className="space-y-8">
             <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
               <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md w-fit mb-2 font-hindi">बैठकें और कार्यक्रम</h3>
               <div className="space-y-3">
                  {listMeetings.length === 0 ? (
                   <div className="p-8 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-lg border dark:border-gray-700 text-[10px] font-hindi">कोई बैठक निर्धारित नहीं है</div>
                  ) : (
                    listMeetings.map(m => (
                     <div key={m.id} onClick={() => setSelectedMeetingId(m.id)} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-4 rounded-lg border dark:border-gray-700 flex justify-between items-center shadow-sm active:scale-95 transition-all border-l-4 border-l-blue-500">
                        <div>
                           <div className="font-medium dark:text-white text-sm">{m.title}</div>
                           <div className="text-xs font-medium text-gray-400">{new Date(m.date).toLocaleDateString('hi-IN')}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                           <div className="flex gap-1 items-center">
                             <div className="text-[8px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/30 font-hindi">
                                {Object.values(m.attendance || {}).filter(v => v === AttendanceStatus.COMING).length} आ रहे
                             </div>
                             <div className="text-[8px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-1.5 py-0.5 rounded-lg border border-green-100 dark:border-green-900/30 font-hindi">
                                {m.presentPeopleIds.length} उपस्थित
                             </div>
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmation({
                                    title: 'कार्यक्रम हटाएं?',
                                    message: `क्या आप '${m.title}' कार्यक्रम को हटाना चाहते हैं?`,
                                    onConfirm: () => {
                                        setMeetings(prev => prev.filter(meet => meet.id !== m.id));
                                        setConfirmation(null);
                                    }
                                  });
                                }}
                                className="ml-2 p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-all cursor-pointer"
                              >
                               <Trash2 size={14} />
                             </button>
                           </div>
                        </div>
                     </div>
                    ))
                  )}
               </div>
             </motion.section>

             <motion.section initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-20px' }} transition={{ duration: 0.4 }} className="space-y-4">
               <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-md w-fit mb-2 font-hindi">सूची के सदस्य ({list.peopleIds.length})</h3>
               <div className="space-y-3">
                  {contacts.filter(c => list.peopleIds.includes(c.id)).map(c => {
                    const recentlyCalled = isRecentlyCalled(c.id);
                    return (
                     <div key={c.id} onClick={() => { setSelectedContactId(c.id); }} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-4 rounded-md border dark:border-gray-700 flex items-center gap-4 active:scale-95 transition-all shadow-sm">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-medium ${recentlyCalled ? 'bg-orange-500' : 'bg-indigo-500 shadow-lg shadow-indigo-500/20'}`}>{c.name[0]}</div>
                        <div className="flex-1 font-medium dark:text-gray-100 text-sm flex items-center gap-2 font-hindi">
                            {c.name} ({getVillageName(c.villageId)})
                        </div>
                        <div className="flex items-center gap-1.5 flex-none shrink-0">
                          <a 
                             href={`tel:${c.phone}`} 
                             onClick={(e) => { e.stopPropagation(); handleDial(c.id); }} 
                             className={`p-2 rounded-md active:scale-90 transition-all flex items-center justify-center ${recentlyCalled ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30' : 'bg-green-50 dark:bg-green-900/20 text-green-600'}`}
                           >
                            <Phone size={18} />
                          </a>
                          <a
                             href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
                             target="_blank" rel="noopener noreferrer" 
                             onClick={(e) => e.stopPropagation()}
                             className="p-2 rounded-md active:scale-90 transition-all bg-[#25D366]/10 text-[#25D366] flex items-center justify-center hover:bg-[#25D366]/20"
                           >
                            <WhatsappIcon size={18} />
                          </a>
                        </div>
                        <ChevronRight size={16} className="text-gray-300"/>
                     </div>
                    );
                  })}
                  {list.peopleIds.length === 0 && (
                   <div className="py-20 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 font-hindi">इस सूची में कोई सदस्य नहीं है</div>
                  )}
               </div>
             </motion.section>
          </div>
       </div>
      );
    }

    // Main lists view
    const statsByCategory = listCategories.map(cat => ({
      ...cat,
      count: customLists.filter(l => l.categoryId === cat.id).length
    }));

    const filteredCategories = listCategoryFilter === 'all' 
      ? listCategories 
      : listCategories.filter(c => c.id === listCategoryFilter);

    const ungroupedLists = customLists.filter(l => !l.categoryId || !listCategories.find(c => c.id === l.categoryId));
    const showUngrouped = listCategoryFilter === 'all';

    return (
      <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
        <header className="flex justify-between items-center bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl p-4 -mx-4 -mt-4 sticky top-0 z-10 border-b border-white/20 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
             <button onClick={() => setActiveTab('home')} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg active:scale-90 transition-all">
                <ArrowLeft size={18} />
             </button>
             <h1 className="text-xl font-bold dark:text-white font-hindi">मेरी सूचियां (गट)</h1>
          </div>
          <button onClick={() => setIsAddingList(true)} className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 active:scale-90 transition-all hover:bg-indigo-700">
             <Plus size={20} />
          </button>
        </header>

        {/* Compact Dashboard - 6 Groups in Grid */}
        <div className="flex overflow-x-auto pb-2 -mx-1 px-1 gap-1.5 no-scrollbar scroll-smooth">
           <button 
             onClick={() => setListCategoryFilter('all')}
             className={`p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5 min-w-[56px] ${listCategoryFilter === 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-gray-800/50 text-gray-600 dark:text-gray-400'}`}
           >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center ${listCategoryFilter === 'all' ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                 <LayoutList size={12} />
              </div>
              <span className="text-[8px] font-bold font-hindi">सभी</span>
              <span className="text-[9px] font-black">{customLists.length}</span>
           </button>
            {statsByCategory.map((stat, i) => {
             const isActive = listCategoryFilter === stat.id;
             return (
               <motion.button 
                 key={stat.id}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.03 }}
                 onClick={() => setListCategoryFilter(isActive ? 'all' : stat.id)}
                 className={`p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5 min-w-[56px] ${isActive ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white/40 dark:bg-gray-900/40 border-white/20 dark:border-gray-800/50 text-gray-600 dark:text-gray-400 hover:border-indigo-400/50'}`}
               >
                 <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isActive ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                    <LucideIcon name={stat.icon} size={12} className={isActive ? 'text-white' : ''} />
                 </div>
                 <span className="text-[8px] font-bold font-hindi truncate w-12 text-center">{stat.name}</span>
                 <span className="text-[9px] font-black"><AnimatedNumber value={stat.count} /></span>
               </motion.button>
             );
           })}
        </div>

        <div className="space-y-8 pt-2">
          {filteredCategories.map(cat => {
            const listsInCat = customLists.filter(l => l.categoryId === cat.id);
            if (listsInCat.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md flex items-center justify-center">
                      <LucideIcon name={cat.icon} size={12} />
                   </div>
                   <h2 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{cat.name}</h2>
                   <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent"></div>
                </div>
                
                <div className="grid grid-cols-4 gap-1">
                  {listsInCat.map((list, i) => (
                      <motion.div 
                        key={list.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedListId(list.id)} 
                        className="group bg-white/40 dark:bg-[#080d19]/60 backdrop-blur-3xl border border-white/60 dark:border-gray-800/80 p-1.5 rounded-lg flex flex-col justify-between shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all active:scale-[0.98] cursor-pointer min-h-[76px]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="w-5 h-5 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">
                             <LucideIcon name={list.icon || cat.icon || 'List'} size={10} />
                          </div>
                          <div className="font-bold dark:text-white font-hindi text-[11px] line-clamp-2 leading-tight min-h-[28px]">{list.name}</div>
                          <div className="text-[8px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded-md uppercase w-fit">{list.peopleIds.length} सदस्य</div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100 dark:border-gray-800/30">
                          <div className="flex items-center gap-2">
                           <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setEditingList(list);
                                 setIsAddingList(true);
                               }} 
                               className="text-gray-300 hover:text-indigo-500 transition-colors p-0.5"
                             >
                              <Edit2 size={10}/>
                           </button>
                           <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setConfirmation({
                                   title: 'सूची हटाएं?',
                                   message: `क्या आप '${list.name}' सूची को हटाना चाहते हैं?`,
                                   messageFont: "font-hindi",
                                   onConfirm: () => {
                                     setCustomLists(prev => prev.filter(l => l.id !== list.id));
                                     setMeetings(prev => prev.filter(m => m.listId !== list.id));
                                     setConfirmation(null);
                                   }
                                 });
                               }} 
                               className="text-gray-300 hover:text-red-500 transition-colors p-0.5"
                             >
                              <Trash2 size={10}/>
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {showUngrouped && ungroupedLists.length > 0 && (
             <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                   <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-md flex items-center justify-center">
                      <Layers size={12} />
                   </div>
                   <h2 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest font-hindi">अन्य सूचियां</h2>
                   <div className="flex-1 h-[1px] bg-gradient-to-r from-gray-200 dark:from-gray-800 to-transparent"></div>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {ungroupedLists.map((list, i) => (
                      <motion.div 
                        key={list.id} 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedListId(list.id)} 
                        className="group bg-white/40 dark:bg-[#080d19]/60 backdrop-blur-3xl border border-white/60 dark:border-gray-800/80 p-1.5 rounded-lg flex flex-col justify-between shadow-sm hover:shadow-md transition-all active:scale-[0.98] cursor-pointer min-h-[76px]"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="w-5 h-5 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-center text-gray-500 dark:text-gray-400">
                             <LucideIcon name={list.icon || 'List'} size={10} />
                          </div>
                          <div className="font-bold dark:text-white font-hindi text-[11px] line-clamp-2 leading-tight min-h-[28px]">{list.name}</div>
                          <div className="text-[8px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-1 py-0.5 rounded-full uppercase w-fit">{list.peopleIds.length} सदस्य</div>
                        </div>
                        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100 dark:border-gray-800/30">
                          <div className="text-[7px] text-gray-400 font-hindi uppercase tracking-wider">अवर्गीकृत</div>
                          <div className="flex items-center gap-2">
                           <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setEditingList(list);
                                 setIsAddingList(true);
                               }} 
                               className="text-gray-300 hover:text-indigo-500 transition-colors p-0.5"
                             >
                              <Edit2 size={10}/>
                           </button>
                           <button 
                               onClick={(e) => { 
                                 e.stopPropagation(); 
                                 setConfirmation({
                                   title: 'सूची हटाएं?',
                                   message: `क्या आप '${list.name}' सूची को हटाना चाहते हैं?`,
                                   messageFont: "font-hindi",
                                   onConfirm: () => {
                                     setCustomLists(prev => prev.filter(l => l.id !== list.id));
                                     setMeetings(prev => prev.filter(m => m.listId !== list.id));
                                     setConfirmation(null);
                                   }
                                 });
                               }} 
                               className="text-gray-300 hover:text-red-500 transition-colors"
                             >
                              <Trash2 size={10}/>
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
             </div>
          )}

          {((listCategoryFilter === 'all' && customLists.length === 0) || (listCategoryFilter !== 'all' && customLists.filter(l => l.categoryId === listCategoryFilter).length === 0)) && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
               <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-300">
                  <LayoutList size={40} />
               </div>
               <div>
                  <div className="text-gray-500 font-bold text-lg font-hindi">कोई सूची नहीं मिली</div>
                  <div className="text-gray-400 text-sm mt-1 font-hindi">शायद इस श्रेणी में कोई सूची नहीं है</div>
               </div>
               {listCategoryFilter !== 'all' && (
                 <button onClick={() => setListCategoryFilter('all')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-full font-bold shadow-lg active:scale-95 transition-all font-hindi">सभी सूचियां देखें</button>
               )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorkStatus = () => {
    if (selectedVillageId) {
      const village = villages.find(v => v.id === selectedVillageId);
      if (!village) return null;
      return (
       <VillageDetail 
          village={village} 
          contacts={contacts}
          ideas={ideas}
          onBack={() => setSelectedVillageId(null)}
          onContactClick={(id: string) => { setSelectedContactId(id); }}
          onUpdateVillage={(updates: Partial<Village>) => handleUpdateVillage(village.id, updates)}
          onUpdateStage={(stage: VillageStage) => updateVillageStage(village.id, stage)}
          onUpdateShakhaData={(data: Partial<ShakhaData>) => updateShakhaData(village.id, data)}
        />
      );
    }

    const filteredVillages = villages.filter(v => {
      if (dashKhand !== 'all') {
        const m = mandals.find(x => x.id === v.mandalId);
        if (!m || m.khandId !== dashKhand) return false;
      }
      if (dashMandal !== 'all' && v.mandalId !== dashMandal) return false;
      return true;
    });

    const statusCounts = {
      shakha: filteredVillages.filter(v => v.stage === VillageStage.SHAKHA).length,
      milan: filteredVillages.filter(v => v.stage === VillageStage.MILAN).length,
      mandali: filteredVillages.filter(v => v.stage === VillageStage.MANDALI).length,
      sampark: filteredVillages.filter(v => v.stage === VillageStage.SAMPARK).length,
    };

    // Group by Khand then Mandal (filtered by dashStage)
    const gridVillages = filteredVillages.filter(v => dashStage === 'all' || v.stage === dashStage);
    
    const groupedData = khands
      .filter(k => dashKhand === 'all' || k.id === dashKhand)
      .map(khand => {
        const khandMandals = mandals
          .filter(m => m.khandId === khand.id && (dashMandal === 'all' || m.id === dashMandal))
          .map(mandal => ({
            ...mandal,
            villages: gridVillages.filter(v => v.mandalId === mandal.id)
          }))
          .filter(m => m.villages.length > 0);
        
        return {
          ...khand,
          mandals: khandMandals
        };
      })
      .filter(k => k.mandals.length > 0);

    return (
     <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
       <header className="flex justify-between items-center sticky top-0 z-30 pt-4 pb-2 -mt-4 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm -mx-4 px-4">
         <h1 className="text-2xl font-bold dark:text-white font-hindi">कार्यस्थिति</h1>
         <Building2 className="text-blue-600" />
       </header>

        {/* Dashboard */}
       <div className="grid grid-cols-4 gap-2">
          <div 
             onClick={() => setDashStage(dashStage === VillageStage.SHAKHA ? 'all' : VillageStage.SHAKHA)}
             className={`bg-orange-50 dark:bg-orange-900/20 text-orange-600 border ${dashStage === VillageStage.SHAKHA ? 'border-orange-500 ring-2 ring-orange-500/50' : 'border-orange-200 dark:border-orange-800'} p-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all`}>
             <div className="text-xl font-bold"><AnimatedNumber value={statusCounts.shakha} /></div>
             <div className="text-[9px] font-medium uppercase tracking-wider font-hindi">शाखा</div>
          </div>
          <div 
             onClick={() => setDashStage(dashStage === VillageStage.MILAN ? 'all' : VillageStage.MILAN)}
             className={`bg-pink-50 dark:bg-pink-900/20 text-pink-600 border ${dashStage === VillageStage.MILAN ? 'border-pink-500 ring-2 ring-pink-500/50' : 'border-pink-200 dark:border-pink-800'} p-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all`}>
             <div className="text-xl font-bold"><AnimatedNumber value={statusCounts.milan} /></div>
             <div className="text-[9px] font-medium uppercase tracking-wider font-hindi">मिलन</div>
          </div>
          <div 
             onClick={() => setDashStage(dashStage === VillageStage.MANDALI ? 'all' : VillageStage.MANDALI)}
             className={`bg-purple-50 dark:bg-purple-900/20 text-purple-600 border ${dashStage === VillageStage.MANDALI ? 'border-purple-500 ring-2 ring-purple-500/50' : 'border-purple-200 dark:border-purple-800'} p-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all`}>
             <div className="text-xl font-bold"><AnimatedNumber value={statusCounts.mandali} /></div>
             <div className="text-[9px] font-medium uppercase tracking-wider font-hindi">मंडली</div>
          </div>
          <div 
             onClick={() => setDashStage(dashStage === VillageStage.SAMPARK ? 'all' : VillageStage.SAMPARK)}
             className={`bg-blue-50 dark:bg-blue-900/20 text-blue-600 border ${dashStage === VillageStage.SAMPARK ? 'border-blue-500 ring-2 ring-blue-500/50' : 'border-blue-200 dark:border-blue-800'} p-2 rounded-lg shadow-sm flex flex-col justify-center items-center cursor-pointer active:scale-95 transition-all`}>
             <div className="text-xl font-bold"><AnimatedNumber value={statusCounts.sampark} /></div>
             <div className="text-[9px] font-medium uppercase tracking-wider font-hindi">संपर्क</div>
          </div>
       </div>

        {/* Filters */}
       <div className="grid grid-cols-2 gap-3 pb-2">
           <select 
              value={dashKhand} 
              onChange={(e) => { setDashKhand(e.target.value); setDashMandal('all'); }} 
              className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-md border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-3 rounded-lg font-medium text-xs outline-none"
            >
             <option value="all">सभी खंड</option>
              {khands.map(k =><option key={k.id} value={k.id}>{k.name}</option>)}
           </select>
           <select 
              value={dashMandal} 
              disabled={dashKhand === 'all'} 
              onChange={(e) => setDashMandal(e.target.value)} 
              className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-md border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-3 rounded-lg font-medium text-xs outline-none disabled:opacity-50"
            >
             <option value="all">सभी मंडल</option>
              {mandals.filter(m => m.khandId === dashKhand).map(m =><option key={m.id} value={m.id}>{m.name}</option>)}
           </select>
       </div>

       <div className="space-y-8">
          {groupedData.map(khand => (
            <div key={khand.id} className="space-y-4">
               <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 px-1 border-b-2 border-orange-500/30 pb-2 inline-block font-hindi">{khand.name}</h2>
               <div className="space-y-6">
                   {khand.mandals.map(mandal => (
                     <div key={mandal.id} className="space-y-3">
                        <motion.div initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="flex items-center gap-2 mb-2 mt-4 ml-1">
                           <h3 className="text-xs px-2.5 py-1 bg-indigo-100/80 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-widest rounded-md shadow-sm border border-indigo-200 dark:border-indigo-800/50">{mandal.name}</h3>
                           <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-500/30 to-transparent"></div>
                         </motion.div>
                        <div className="grid grid-cols-3 gap-2">
                            {mandal.villages.map(v => (
                              <div key={v.id} onClick={() => setSelectedVillageId(v.id)} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-3 rounded-lg flex flex-col justify-between items-start gap-1.5 active:scale-95 transition-all cursor-pointer">
                                 <div className="font-medium dark:text-white text-xs line-clamp-1 w-full font-hindi">
                                     {v.name}
                                 </div>
                                 <span className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded-sm shadow-sm font-hindi ${v.stage === VillageStage.SHAKHA ? 'bg-orange-500 text-white' : v.stage === VillageStage.MILAN ? 'bg-pink-500 text-white' : v.stage === VillageStage.MANDALI ? 'bg-purple-500 text-white' : v.stage === VillageStage.SAMPARK ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700'}`}>{v.stage !== VillageStage.NONE ? v.stage : '-'}</span>
                              </div>
                            ))}
                        </div>
                     </div>
                   ))}
               </div>
            </div>
          ))}
          {groupedData.length === 0 && (
           <div className="text-center py-10 text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-md border border-white/50 rounded-lg text-sm">
               कोई गांव / शाखा नहीं मिली
           </div>
          )}
       </div>
     </div>
    );
  };

  if (authLoading) {
    return <div className="h-screen w-full flex items-center justify-center font-hindi bg-gray-50 dark:bg-gray-900"><div className="text-blue-600 font-bold animate-pulse text-lg">लोड हो रहा है...</div></div>;
  }

  if (!firebaseUser) {
    return (
      <div className="h-screen w-full bg-cover bg-center flex flex-col items-center justify-center p-6 text-center font-hindi relative isolate overflow-hidden" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2070&auto=format&fit=crop')" }}>
         <div className="absolute inset-0 bg-black/60 dark:bg-black/80 z-[-1]" />
         <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl text-white max-w-sm w-full shadow-2xl">
            <h1 className="text-4xl font-bold mb-2 break-keep tracking-wider">फील्ड कनेक्ट</h1>
            <p className="text-sm text-gray-200 mb-8 max-w-xs">संगठन के कार्यों और कार्यकर्ताओं को एक सूत्र में पिरोने का डिजिटल माध्यम।</p>
            
            <button 
              onClick={async () => {
                try {
                  await signInWithGoogle();
                } catch (e) {
                  console.error(e);
                }
              }} 
              className="w-full bg-white text-gray-900 border border-transparent shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] font-bold rounded-2xl py-3.5 px-4 flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              गूगल से लॉगिन करें
            </button>

            <div className="mt-8 pt-6 border-t border-white/20 whitespace-normal">
              <p className="text-[10px] text-white/60">केवल अधिकृत कार्यकर्ताओं के लिए।</p>
            </div>
         </div>
      </div>
    );
  }

  return (
   <div className="min-h-[100dvh] w-full relative font-sans transition-colors duration-300 bg-transparent flex">
     <AbstractBackground />

     {/* Desktop Sidebar */}
     <aside className="hidden lg:flex flex-col w-72 fixed inset-y-0 left-0 bg-white/70 dark:bg-[#070b14]/70 backdrop-blur-3xl border-r border-gray-200/50 dark:border-gray-800/50 z-[100] shadow-xl pt-6 pb-6 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
       <div className="px-8 mt-4 mb-10">
           <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 dark:from-blue-400 dark:to-blue-500 bg-clip-text text-transparent transform origin-left transition-all duration-500 tracking-tight font-hindi flex items-center gap-3 drop-shadow-sm">
               <span className="bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 p-2 rounded-xl transition-colors duration-500">
                   <MapPin size={26} className="stroke-[2.5px]" />
               </span>
               फील्ड कनेक्ट
           </h2>
       </div>
       
       <div className="flex-1 overflow-y-auto px-6 space-y-3 no-scrollbar">
         <SidebarNavBtn active={activeTab === 'home'} onClick={() => handleTabChange('home')} icon={<Home />} label="होम" />
         <SidebarNavBtn active={activeTab === 'people' || activeTab === 'swayamsevak'} onClick={() => handleTabChange('people')} icon={<UsersRound />} label="संपर्क" />
         <SidebarNavBtn active={activeTab === 'activities'} onClick={() => handleTabChange('activities')} icon={<Rocket />} label="गतिविधियां" />
         <SidebarNavBtn active={activeTab === 'calendar'} onClick={() => handleTabChange('calendar')} icon={<CalendarIcon />} label="कैलेंडर" />
         <div className="pt-5 mt-5 border-t border-gray-200/50 dark:border-gray-800/50"></div>
         <SidebarNavBtn active={activeTab === 'menu'} onClick={() => handleTabChange('menu')} icon={<MenuIcon />} label="मेनू" />
       </div>
     </aside>

     <div className="flex-1 lg:pl-72 flex flex-col min-h-[100dvh] relative z-0">
        <div className="max-w-md lg:max-w-7xl mx-auto w-full flex-1 flex flex-col relative z-10 px-4 sm:px-0">
           <main className="flex-1 relative z-10 pb-[100px] lg:pb-12 lg:pt-8 w-full">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'swayamsevak' && renderSwayamsevak()}
        {activeTab === 'people' && renderPeople()}
        {activeTab === 'trips' && renderTrips()}
        {activeTab === 'lists' && renderLists()}
        {activeTab === 'work-status' && renderWorkStatus()}
        {activeTab === 'events' && (
         <EventsTab 
            events={events} 
            setEvents={setEvents} 
            meetings={meetings}
            onSelectEvent={(id: string) => { setSelectedEventId(id); setActiveTab('event-detail'); }} 
            onBack={() => setActiveTab('menu')} 
          />
        )}
        {activeTab === 'event-detail' && selectedEventId && (
         <EventDetailTab 
            eventId={selectedEventId} 
            events={events} 
            setEvents={setEvents} 
            contacts={contacts}
            onBack={() => { setSelectedEventId(null); setActiveTab('events'); }} 
          />
        )}
        {activeTab === 'ideas' && (
         <IdeasTab 
            ideas={ideas}
            onUpdate={handleUpdateIdea}
            onDelete={handleDeleteIdea}
            onAdd={() => setIsAddingIdea(true)}
            contacts={contacts}
            villages={villages}
            mandals={mandals}
          />
        )}
        {activeTab === 'activities' && (
         <ActivitiesTab 
            trips={trips} 
            contacts={contacts} 
            meetings={meetings}
            khands={khands}
            mandals={mandals}
            villages={villages}
            onContactClick={(id: string) => { setSelectedContactId(id); }}
            onTripClick={(trip: TripPlan) => { setViewingTrip(trip); setActiveTab('trips'); }}
            onMeetingClick={(meeting: Meeting) => { setSelectedListId(meeting.listId); setSelectedMeetingId(meeting.id); setActiveTab('lists'); }}
            updateHistory={(contactId: string, historyId: string, notes: string) => {
              setContacts(prev => prev.map(c => c.id === contactId ? {
                ...c,
                history: c.history.map(h => h.id === historyId ? { ...h, notes } : h)
              } : c));
            }}
            updateTripNotes={(tripId: string, notes: string) => {
              setTrips(prev => prev.map(t => t.id === tripId ? { ...t, notes } : t));
            }}
            updateMeetingNotes={(meetingId: string, notes: string) => {
              setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, notes } : m));
            }}
          />
        )}
        {activeTab === 'calendar' && (
         <CalendarTab 
            trips={trips} 
            contacts={contacts} 
            meetings={meetings}
            khands={khands} 
            mandals={mandals}
            villages={villages}
            eventCategories={eventCategories}
            dashKhand={dashKhand}
            dashMandal={dashMandal}
            setDashKhand={setDashKhand}
            setDashMandal={setDashMandal}
            setSelectedListId={setSelectedListId}
            setSelectedMeetingId={setSelectedMeetingId}
            setActiveTab={setActiveTab}
            handleUpdateVillage={handleUpdateVillage}
            getMandalName={getMandalName}
            getKhandName={getKhandName}
            getVillageName={getVillageName}
            onTripClick={(trip: TripPlan) => { setViewingTrip(trip); setActiveTab('trips'); }}
            onContactClick={(id: string) => { setSelectedContactId(id); }}
          />
        )}
        {activeTab === 'menu' && (
         <MenuTab 
            userName={userName} setUserName={setUserName} 
            appUser={appUser}
            setActiveTab={setActiveTab} 
          />
        )}
        {activeTab === 'area-mgmt' && (
         <AreaMgmtView
            khands={khands} setKhands={setKhands}
            mandals={mandals} setMandals={setMandals}
            villages={villages} setVillages={setVillages}
            setActiveTab={setActiveTab}
            onBack={() => setActiveTab('menu')}
            setConfirmation={setConfirmation}
          />
        )}
        {activeTab === 'reports' && (
         <ReportsTab
            contacts={contacts}
            trips={trips}
            events={events}
            villages={villages}
            khands={khands}
            mandals={mandals}
            onBack={() => setActiveTab('menu')}
            setExportTarget={setExportTarget}
          />
        )}
        {activeTab === 'settings' && (
         <SettingsTab 
            darkMode={darkMode} setDarkMode={setDarkMode}
            appTheme={appTheme} setAppTheme={setAppTheme}
            appFont={appFont} setAppFont={setAppFont}
            appFontSize={appFontSize} setAppFontSize={setAppFontSize}
            whatsappMessage={whatsappMessage} setWhatsappMessage={setWhatsappMessage}
            setActiveTab={setActiveTab} 
            exportData={exportData} 
            importData={() => fileInputRef.current?.click()}
            generateVolunteerTemplate={generateVolunteerTemplate}
            volunteerExcelInputRef={volunteerExcelInputRef}
            handleImportExcel={handleImportExcel}
            resetAllData={resetAllData} 
            clearAllKaryas={clearAllKaryas}
          />
        )}
        {activeTab === 'cat-mgmt' &&<CatMgmt categories={categories} setCategories={setCategories} onBack={()=>setActiveTab('settings')} setConfirmation={setConfirmation} />}
        {activeTab === 'event-cat-mgmt' &&<CatMgmt title="कार्यक्रम श्रेणी प्रबंधन" categories={eventCategories} setCategories={setEventCategories} onBack={()=>setActiveTab('settings')} setConfirmation={setConfirmation} />}
        {activeTab === 'list-cat-mgmt' &&<CatMgmt title="सूची श्रेणी प्रबंधन" categories={listCategories} setCategories={setListCategories} onBack={()=>setActiveTab('settings')} setConfirmation={setConfirmation} />}
        {activeTab === 'admin' && (
          <div className="h-full overflow-y-auto w-full bg-slate-50 dark:bg-[#070b14]">
            <AdminPanel khands={khands} mandals={mandals} villages={villages} />
          </div>
        )}
        {selectedContactId && contacts.find(c => c.id === selectedContactId) && (
         <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-[#070b14] lg:bg-slate-50/80 lg:dark:bg-[#070b14]/90 lg:backdrop-blur-3xl overflow-y-auto w-full h-[100dvh] lg:flex lg:items-center lg:justify-center">
           <div className="w-full max-w-md lg:max-w-4xl mx-auto min-h-[100dvh] lg:min-h-[85vh] lg:max-h-[85vh] lg:bg-white lg:dark:bg-[#0c1222] lg:shadow-2xl lg:border lg:border-white/20 lg:dark:border-gray-800 lg:rounded-2xl lg:overflow-y-auto relative">
             <ContactProfile 
                contact={contacts.find(c => c.id === selectedContactId)!} 
                khands={khands} mandals={mandals} villages={villages} categories={categories}
                isRecentlyCalled={isRecentlyCalled(selectedContactId)}
                onDial={() => handleDial(selectedContactId)}
                whatsappMessage={whatsappMessage}
                onBack={() => setSelectedContactId(null)} 
                onVillageClick={(id: string) => { setSelectedVillageId(id); setSelectedContactId(null); setActiveTab('work-status'); }}
                onDelete={() => {
                  setConfirmation({
                    title: 'संपर्क हटाएं?',
                    message: `क्या आप वाकई इस संपर्क को हटाना चाहते हैं?`,
                    onConfirm: () => {
                      setContacts(c => c.filter(x => x.id !== selectedContactId));
                      setSelectedContactId(null);
                      setConfirmation(null);
                    }
                  });
                }}
                onEdit={() => setEditingContact(contacts.find(c => c.id === selectedContactId)!)}
                onLogVisit={() => setIsLoggingVisit(selectedContactId)}
                onEditVisitHistory={(h: any) => setIsEditingVisit({ contactId: selectedContactId, history: h })}
                onDeleteVisitHistory={(hId: string) => handleDeleteVisitHistory(selectedContactId, hId)}
              />
           </div>
         </div>
        )}
     </main>

     </div>

     <input 
        type="file" 
        ref={fileInputRef} 
        onChange={importData} 
        accept=".json" 
        className="hidden" 
      />

     <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/80 dark:bg-[#080d19]/90 backdrop-blur-2xl border border-gray-200/50 dark:border-gray-800/50 flex justify-around items-center p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] overflow-hidden rounded-t-[2.5rem] lg:hidden transition-colors duration-500">
        {/* Abstract Dark Gradients */}
       <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-60 overflow-hidden text-transparent">
         <div className="absolute top-0 left-1/4 w-1/2 h-full bg-blue-500/10 blur-[60px] animate-pulse transition-colors duration-500"></div>
         <div className="absolute bottom-0 right-1/4 w-1/2 h-full bg-indigo-500/10 blur-[60px] animate-pulse transition-colors duration-500" style={{ animationDelay: '1s' }}></div>
       </div>
       <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>
        
       <NavBtn active={activeTab === 'home'} onClick={() => handleTabChange('home')} icon={<Home />} />
       <NavBtn active={activeTab === 'people' || activeTab === 'swayamsevak'} onClick={() => handleTabChange('people')} icon={<UsersRound />} />
       <NavBtn active={activeTab === 'activities'} onClick={() => handleTabChange('activities')} icon={<Rocket />} />
       <NavBtn active={activeTab === 'calendar'} onClick={() => handleTabChange('calendar')} icon={<CalendarIcon />} />
        <NavBtn active={activeTab === 'menu'} onClick={() => handleTabChange('menu')} icon={<MenuIcon />} />
      </nav>

      <SuccessOverlay isVisible={showSuccessOverlay} onClose={() => setShowSuccessOverlay(false)} />

      {/* Forms & Modals */}
     <div className="relative z-[200]">
     <ExportModal isOpen={!!exportTarget} onClose={() => setExportTarget(null)} data={exportTarget?.data || []} villages={villages} mandals={mandals} title={exportTarget?.title || 'export'} isGeneric={exportTarget?.isGeneric || false} />
      {(isAddingContact || editingContact) && (
       <ContactFormModal 
          khands={khands} mandals={mandals} villages={villages} categories={categories}
          initialData={editingContact}
          onClose={() => { setIsAddingContact(false); setEditingContact(null); }} 
          onSubmit={(data: any) => (editingContact && editingContact.id) ? handleUpdateContact(editingContact.id, data) : handleAddContact(data)} 
        />
      )}
      {(isAddingTrip || editingTrip) && (
       <TripFormModal 
          khands={khands} mandals={mandals} villages={villages} contacts={contacts}
          initialData={editingTrip}
          ideas={ideas}
          onClose={() => { setIsAddingTrip(false); setEditingTrip(null); }} 
          onSubmit={(data: any) => editingTrip ? handleUpdateTrip(editingTrip.id, data) : handleAddTrip(data)} 
        />
      )}
      {(isAddingList || editingList) && (
        <ListFormModal 
            categories={listCategories}
            initialData={editingList}
            onClose={() => { setIsAddingList(false); setEditingList(null); }} 
            onSubmit={(data: { name: string, categoryId: string, icon: string }) => { 
                if(data.name && data.categoryId) { 
                    if (editingList) {
                      setCustomLists(prev => prev.map(l => l.id === editingList.id ? { ...l, name: data.name, categoryId: data.categoryId, icon: data.icon } : l));
                    } else {
                      setCustomLists(prev => [...prev, { id: `l${Date.now()}`, name: data.name, categoryId: data.categoryId, icon: data.icon, peopleIds: [] }]); 
                    }
                    setIsAddingList(false);
                    setEditingList(null);
                } 
            }} 
         />
      )}
      {isLoggingVisit && (
       <VisitLogModal 
          contactName={contacts.find(c => c.id === isLoggingVisit)?.name || ''} 
          onClose={() => setIsLoggingVisit(null)} 
          onSubmit={(notes: string, dateStr: string) => handleLogVisit(isLoggingVisit!, notes, dateStr)} 
        />
      )}
      {isEditingVisit && (
       <VisitLogModal 
          contactName={contacts.find(c => c.id === isEditingVisit.contactId)?.name || ''} 
          initialNotes={isEditingVisit.history.notes}
          initialDate={isEditingVisit.history.date}
          onClose={() => setIsEditingVisit(null)} 
          onSubmit={(notes: string, dateStr: string) => handleEditVisitHistory(isEditingVisit.contactId, isEditingVisit.history.id, notes, dateStr)} 
          isEdit={true}
        />
      )}
      {isAddingMeeting && (
       <MeetingFormModal 
          onClose={() => setIsAddingMeeting(false)}
          eventCategories={eventCategories}
          ideas={ideas}
          customLists={customLists}
          selectedListId={selectedListId}
          onSubmit={(data: any) => {
            setMeetings(prev => [...prev, { id: `m${Date.now()}`, listId: selectedListId!, ...data, attendance: {}, presentPeopleIds: [] }]);
            setIsAddingMeeting(false);
          }}
        />
      )}
      {isAddingIdea && (
       <IdeaFormModal 
          contacts={contacts}
          villages={villages}
          mandals={mandals}
          khands={khands}
          customLists={customLists}
          onClose={() => setIsAddingIdea(false)}
          onSubmit={(data: any) => {
             if (Array.isArray(data)) {
                setIdeas(prev => [...prev, ...data.map((d, i) => ({...d, id: `i${Date.now()}_${i}`, isCompleted: false}))]);
             } else {
                setIdeas(prev => [...prev, { ...data, id: `i${Date.now()}`, isCompleted: false }]);
             }
             setIsAddingIdea(false);
          }}
        />
      )}
      {isManagingMembers && selectedListId && (
       <ManageListMembersModal 
          list={customLists.find(l => l.id === selectedListId)!}
          contacts={contacts}
          khands={khands}
          mandals={mandals}
          villages={villages}
          onClose={() => setIsManagingMembers(false)}
          onSave={(newPeopleIds: string[]) => {
            setCustomLists(prev => prev.map(l => l.id === selectedListId ? { ...l, peopleIds: newPeopleIds } : l));
            setContacts(prev => prev.map(c => {
               const isInNewList = newPeopleIds.includes(c.id);
               const hadList = c.listIds.includes(selectedListId);
               if (isInNewList && !hadList) return { ...c, listIds: [...c.listIds, selectedListId] };
               if (!isInNewList && hadList) return { ...c, listIds: c.listIds.filter(id => id !== selectedListId) };
               return c;
            }));
            setIsManagingMembers(false);
          }}
        />
      )}
      {isBulkUpdateModalOpen && (
        <BulkUpdateModal 
          selectedCount={selectedPeopleIds.length}
          contacts={contacts}
          khands={khands}
          mandals={mandals}
          villages={villages}
          categories={categories}
          onClose={() => setIsBulkUpdateModalOpen(false)}
          onUpdate={handleBulkUpdate}
        />
      )}
      {confirmation && (
       <div className="fixed inset-0 z-[200] flex flex-col justify-center items-center p-4 bg-slate-50/90 dark:bg-[#070b14]/90 backdrop-blur-md animate-in fade-in duration-300">
         <div className="bg-white/95 dark:bg-[#080d19]/95 backdrop-blur-3xl shadow-[0_16px_60px_-15px_rgba(0,0,0,0.3)] border border-white/20 dark:border-gray-800/50 w-full max-w-sm rounded-[2.5rem] p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-300">
           <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center">
               <Trash2 size={32} />
             </div>
             <div className="space-y-2">
               <h2 className={`text-xl font-bold dark:text-white ${confirmation.titleFont || ''}`}>{confirmation.title}</h2>
               <p className={`text-sm text-gray-500 dark:text-gray-400 font-medium ${confirmation.messageFont || ''}`}>{confirmation.message}</p>
             </div>
           </div>
           <div className="flex gap-3">
             <button onClick={() => setConfirmation(null)} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium rounded-xl active:scale-95 transition-all">नहीं</button>
             <button onClick={confirmation.onConfirm} className="flex-1 p-4 bg-red-600 dark:bg-red-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all">हाँ, हटाएं</button>
           </div>
         </div>
       </div>
      )}
     </div>
    </div>
   </div>
  );
};

// --- Helper Components ---

const AbstractBackground = React.memo(() => (
 <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-slate-50 dark:bg-[#070b14] transition-colors duration-500">
    {/* Glowing blurred blobs / Backlight */}
   <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[70%] bg-blue-300/60 dark:bg-blue-600/40 blur-[100px] rounded-full animate-float transition-colors duration-500"></div>
   <div className="absolute top-[10%] right-[-20%] w-[70%] h-[60%] bg-indigo-200/50 dark:bg-indigo-500/30 blur-[120px] rounded-full animate-float transition-colors duration-500" style={{ animationDelay: '1s' }}></div>
   <div className="absolute bottom-[20%] left-[-10%] w-[80%] h-[70%] bg-orange-200/60 dark:bg-orange-600/20 blur-[100px] rounded-full animate-float-delayed transition-colors duration-500"></div>
   <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[60%] bg-blue-200/50 dark:bg-blue-600/30 blur-[120px] rounded-full animate-float transition-colors duration-500" style={{ animationDelay: '2s' }}></div>
    
    {/* Crystal Glass Shards */}
   <div className="absolute inset-0 z-10 opacity-[0.8] dark:opacity-[0.4] mix-blend-overlay drop-shadow-2xl">
     <svg viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
       <defs>
         <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" /><stop offset="100%" stopColor="#ffffff" stopOpacity="0.1"/></linearGradient>
         <linearGradient id="g2" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" /><stop offset="100%" stopColor="#000000" stopOpacity="0.2"/></linearGradient>
         <linearGradient id="g3" x1="0" y1="1" x2="1" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" /><stop offset="100%" stopColor="#000000" stopOpacity="0.4"/></linearGradient>
         <linearGradient id="g4" x1="1" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ffffff" stopOpacity="1" /><stop offset="100%" stopColor="#ffffff" stopOpacity="0"/></linearGradient>
         <linearGradient id="g5" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" /><stop offset="100%" stopColor="#000000" stopOpacity="0.5"/></linearGradient>
       </defs>

       <g stroke="rgba(255,255,255,1)" strokeWidth="1" strokeLinejoin="bevel">
         <polygon points="0,0 350,0 250,250 0,350" fill="url(#g1)" />
         <polygon points="350,0 800,0 750,350 450,250 250,250" fill="url(#g2)" />
         <polygon points="0,350 250,250 180,600 0,650" fill="url(#g3)" />
         <polygon points="250,250 450,250 650,500 180,600" fill="url(#g4)" />
         <polygon points="450,250 750,350 800,650 650,500" fill="url(#g5)" />
         <polygon points="750,350 800,0 800,650" fill="url(#g1)" />
          
         <polygon points="0,650 180,600 350,900 0,950" fill="url(#g2)" />
         <polygon points="180,600 650,500 750,800 350,900" fill="url(#g1)" />
         <polygon points="650,500 800,650 800,950 750,800" fill="url(#g3)" />
          
         <polygon points="0,950 350,900 450,1200 0,1200" fill="url(#g4)" />
         <polygon points="350,900 750,800 800,1200 450,1200" fill="url(#g5)" />
         <polygon points="750,800 800,950 800,1200" fill="url(#g2)" />
       </g>
     </svg>
   </div>

    {/* Bright Glints / Edge Highlights */}
   <div className="absolute inset-0 z-10 opacity-30 dark:opacity-20 mix-blend-color-dodge">
     <svg viewBox="0 0 800 1200" preserveAspectRatio="xMidYMid slice" className="w-full h-full">
       <g stroke="rgba(255,255,255,1)" strokeWidth="4" fill="none" strokeLinejoin="miter">
         <polyline points="0,0 350,0 250,250 0,350" />
         <polyline points="350,0 800,0 750,350 450,250 250,250" />
         <polyline points="0,350 250,250 180,600 0,650" />
         <polyline points="250,250 450,250 650,500 180,600" />
         <polyline points="450,250 750,350 800,650 650,500" />
         <polyline points="750,350 800,0 800,650" />
         <polyline points="0,650 180,600 350,900 0,950" />
         <polyline points="180,600 650,500 750,800 350,900" />
         <polyline points="650,500 800,650 800,950 750,800" />
         <polyline points="0,950 350,900 450,1200 0,1200" />
         <polyline points="350,900 750,800 800,1200 450,1200" />
         <polyline points="750,800 800,950 800,1200" />
       </g>
     </svg>
   </div>

    {/* Textural Noise */}
   <div className="absolute inset-0 z-20 
      opacity-[0.4] mix-blend-color-burn dark:opacity-[0.3]" 
      style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}
    ></div>
   <div className="absolute inset-0 z-20 
      opacity-[0.2] mix-blend-screen dark:opacity-[0.1]" 
      style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`}}
    ></div>
 </div>
));


const TripCalendar = ({ trips, viewType, setViewType, currentDate, setCurrentDate, onSelectTrip, getMandalName, getKhandName, getVillageName }: any) => {
  const dayNamesHindi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const monthNamesHindi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const handlePrev = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, -1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, -1));
    else if (viewType === '3day') setCurrentDate(addDays(currentDate, -3));
    else setCurrentDate(addDays(currentDate, -1));
  };
  const handleNext = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (viewType === '3day') setCurrentDate(addDays(currentDate, 3));
    else setCurrentDate(addDays(currentDate, 1));
  };
  const handleToday = () => setCurrentDate(new Date());

  const getTripsForDay = (date: Date) => {
    return trips.filter((t: any) => isSameDay(parseISO(t.date), date));
  };

  const renderViewTypeSelector = () => (
   <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
      {[
        { id: '1day', label: '१ दिन' },
        { id: '3day', label: '३ दिन' },
        { id: 'week', label: 'सप्ताह' },
        { id: 'month', label: 'महीना' },
        { id: 'schedule', label: 'अनुसूची' }
      ].map(v => (
       <button 
          key={v.id} 
          onClick={() => setViewType(v.id as any)}
          className={`px-3 py-1.5 rounded-full text-[10px] font-medium uppercase tracking-wider transition-all border ${viewType === v.id ? 'bg-orange-600 text-white border-orange-600 shadow-md' : 'bg-white/40 dark:bg-[#080d19]/40 border-white/50 dark:border-gray-700/50 text-gray-600 dark:text-gray-300'}`}
        >
          {v.label}
       </button>
      ))}
   </div>
  );

  const renderMonthView = () => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = eachDayOfInterval({ start, end });
    const weekDays = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

    return (
     <div className="bg-white/30 dark:bg-[#080d19]/30 backdrop-blur-xl border border-white/40 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xl">
       <div className="grid grid-cols-7 border-b dark:border-gray-800">
          {weekDays.map(d => (
           <div key={d} className="py-2 text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase">{d}</div>
          ))}
       </div>
       <div className="grid grid-cols-7">
          {days.map(day => {
            const dayTrips = getTripsForDay(day);
            const isSelectedMonth = isSameMonth(day, currentDate);
            return (
             <div key={day.toISOString()} className={`min-h-[80px] p-1 border-r border-b dark:border-gray-800 ${isSelectedMonth ? '' : 'opacity-30'} ${isToday(day) ? 'bg-orange-50/50 dark:bg-orange-900/10' : ''}`}>
               <div className={`text-[10px] font-medium mb-1 p-0.5 w-5 h-5 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-orange-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {format(day, 'd')}
               </div>
               <div className="space-y-1">
                  {dayTrips.map((t: any) => (
                   <div 
                      key={t.id} 
                      onClick={() => onSelectTrip(t)}
                      className={`text-[8px] p-1 rounded-sm border truncate font-medium ${t.isCompleted ? 'bg-green-50 border-green-100 text-green-700 dark:bg-green-900/20 dark:border-green-800/30 dark:text-green-300' : 'bg-orange-50 border-orange-100 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800/30 dark:text-orange-300'}`}
                    >
                      {getMandalName(t.mandalId)}
                   </div>
                  ))}
               </div>
             </div>
            );
          })}
       </div>
     </div>
    );
  };

  const renderMultiDayView = (numDays: number) => {
    const days = Array.from({ length: numDays }, (_, i) => addDays(viewType === 'week' ? startOfWeek(currentDate) : currentDate, i));
    
    return (
     <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4 min-h-[400px]">
        {days.map(day => {
          const dayTrips = getTripsForDay(day);
          return (
           <div key={day.toISOString()} className="flex-none w-48 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-2xl p-3 space-y-3 shadow-lg">
             <div className="text-center pb-2 border-b dark:border-gray-800">
               <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{dayNamesHindi[day.getDay()]}</div>
               <div className={`text-xl font-medium mt-0.5 ${isToday(day) ? 'text-orange-600' : 'dark:text-white'}`}>{format(day, 'd')} {monthNamesHindi[day.getMonth()]}</div>
             </div>
             <div className="space-y-3">
                {dayTrips.length === 0 ? (
                 <div className="text-[10px] text-gray-400 text-center py-8 font-medium italic">कोई योजना नहीं</div>
                ) : (
                  dayTrips.map((t: any) => (
                   <div 
                      key={t.id} 
                      onClick={() => onSelectTrip(t)}
                      className={`p-3 rounded-xl border space-y-2 cursor-pointer transition-all active:scale-95 ${t.isCompleted ? 'bg-green-50/50 border-green-100/50 dark:bg-green-900/20 dark:border-green-800/30' : 'bg-orange-50/50 border-orange-100/50 dark:bg-orange-900/20 dark:border-orange-800/30'}`}
                    >
                     <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase">{getKhandName(t.khandId)}</div>
                     <div className="text-xs font-medium dark:text-white leading-snug">{getMandalName(t.mandalId)}</div>
                     <div className="flex flex-wrap gap-1">
                        {t.villageIds.map((vid: string) => (
                         <span key={vid} className="px-1.5 py-0.5 bg-white/50 dark:bg-gray-800 rounded text-[8px] font-medium dark:text-gray-300">{getVillageName(vid)}</span>
                        ))}
                     </div>
                   </div>
                  ))
                )}
             </div>
           </div>
          );
        })}
     </div>
    );
  };

  const renderScheduleView = () => {
    const futureTrips = trips
      .filter((t: any) => parseISO(t.date) >= startOfDay(new Date()))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return (
     <div className="space-y-4">
        {futureTrips.length === 0 ? (
         <div className="bg-white/40 dark:bg-[#080d19]/40 p-8 rounded-2xl text-center border dark:border-gray-800 text-gray-400 font-medium">आगामी कोई प्रवास योजना नहीं है</div>
        ) : (
          futureTrips.map((t: any) => (
           <div key={t.id} onClick={() => onSelectTrip(t)} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 p-4 rounded-xl shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer">
             <div className="flex-none text-center min-w-[50px] pr-4 border-r dark:border-gray-800">
               <div className="text-xs font-medium text-gray-400 uppercase">{monthNamesHindi[parseISO(t.date).getMonth()]}</div>
               <div className="text-xl font-bold dark:text-white">{format(parseISO(t.date), 'd')}</div>
             </div>
             <div className="flex-1 min-w-0">
               <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase truncate">{getKhandName(t.khandId)}</div>
               <div className="text-sm font-medium dark:text-white truncate">{getMandalName(t.mandalId)}</div>
               <div className="flex gap-1 mt-1 overflow-x-hidden">
                  {t.villageIds.slice(0, 2).map((vid: string) => (
                   <span key={vid} className="px-1.5 py-0.5 bg-gray-50/50 dark:bg-gray-800 rounded text-[8px] font-medium dark:text-gray-400 truncate">{getVillageName(vid)}</span>
                  ))}
                  {t.villageIds.length > 2 &&<span className="text-[8px] text-gray-400 font-medium font-mono">+{t.villageIds.length - 2}</span>}
               </div>
             </div>
             <div className={`flex-none px-2 py-1 rounded-lg text-[9px] font-medium uppercase ${t.isCompleted ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30'}`}>
                {t.isCompleted ? 'पूर्ण' : 'लंबित'}
             </div>
           </div>
          ))
        )}
     </div>
    );
  };

  return (
   <div className="space-y-4">
      {renderViewTypeSelector()}
      
     <div className="flex justify-between items-center bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 p-2 rounded-xl">
       <button onClick={handlePrev} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors dark:text-white"><ChevronLeft/></button>
       <div className="flex flex-col items-center">
         <span className="text-sm font-medium dark:text-white uppercase tracking-widest cursor-pointer" onClick={handleToday}>
            {viewType === 'month' ? `${monthNamesHindi[currentDate.getMonth()]} ${currentDate.getFullYear()}` : (viewType === 'schedule' ? 'अनुसूची' : `${currentDate.getDate()} ${monthNamesHindi[currentDate.getMonth()]} ${currentDate.getFullYear()}`)}
         </span>
       </div>
       <button onClick={handleNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors dark:text-white"><ChevronRight/></button>
     </div>

     <div className="min-h-[400px]">
        {viewType === 'month' && renderMonthView()}
        {(viewType === '1day' || viewType === '3day' || viewType === 'week') && renderMultiDayView(viewType === '1day' ? 1 : (viewType === '3day' ? 3 : 7))}
        {viewType === 'schedule' && renderScheduleView()}
     </div>
   </div>
  );
};

const NavBtn = ({ active, onClick, icon }: any) => (
 <button 
    onClick={onClick} 
    className={`flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] transition-all relative group outline-none
      ${active ? '' : 'hover:bg-blue-500/5 dark:hover:bg-white/5'}
    `}
  >
    {active && (
     <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-400/20 rounded-full blur-[20px] -z-10 animate-pulse"></div>
    )}
   <div className={`
      flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-[1.1rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative
      ${active 
        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.5)] border border-white/20 -translate-y-2' 
        : 'text-gray-400 dark:text-gray-500 group-hover:scale-110 group-hover:text-blue-500'
      }
    `}>
      {active &&<div className="absolute top-[10%] left-[20%] right-[20%] h-[30%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>}
     <div className={`transition-all ${active ? 'scale-[1.1] drop-shadow-sm' : 'scale-100'}`}>
         {icon}
     </div>
   </div>
    {active && (
     <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
    )}
 </button>
);


const SidebarNavBtn = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick} 
    className={`flex items-center gap-4 w-full p-4 rounded-2xl transition-all relative group outline-none overflow-hidden
      ${active ? 'bg-gradient-to-r from-blue-500/10 to-transparent dark:from-blue-500/20' : 'hover:bg-blue-500/5 dark:hover:bg-white/5'}
    `}
  >
    {active && (
     <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 blur-[20px] -z-10"></div>
    )}
    <div className={`
      flex items-center justify-center w-11 h-11 rounded-[1.1rem] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] relative
      ${active 
        ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_8px_20px_-4px_rgba(37,99,235,0.5)] border border-white/20' 
        : 'text-gray-400 dark:text-gray-500 group-hover:scale-110 group-hover:text-blue-500'
      }
    `}>
      {active &&<div className="absolute top-[10%] left-[20%] right-[20%] h-[30%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>}
     <div className={`transition-all ${active ? 'scale-[1.1] drop-shadow-sm' : 'scale-100'}`}>
         {icon}
     </div>
    </div>
    <span className={`font-semibold tracking-wide text-sm transition-all duration-300 ${active ? 'text-blue-700 dark:text-blue-300 scale-105' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}`}>
      {label}
    </span>
    {active && (
     <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,1)]"></div>
    )}
  </button>
);


function AnimatedNumber({ value, delayMs = 0 }: { value: number | string, delayMs?: number }) {
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/,/g, ''), 10) : value;
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    if (isNaN(numericValue)) return;

    let startTimestamp: number | null = null;
    const duration = 1200;
    
    // Check what the current value is before starting
    let currentDisplayValue = 0;
    setDisplayValue(prev => {
        currentDisplayValue = prev;
        return prev;
    });

    if (currentDisplayValue === numericValue) return;
    
    let timeoutId: any;
    let animationFrame: number;
    
    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4);
        
        setDisplayValue(Math.round(currentDisplayValue + (numericValue - currentDisplayValue) * easeProgress));
        
        if (progress < 1) {
          animationFrame = window.requestAnimationFrame(step);
        } else {
          setDisplayValue(numericValue);
        }
      };
      
      animationFrame = window.requestAnimationFrame(step);
    };

    if (delayMs > 0) {
      timeoutId = setTimeout(startAnimation, delayMs);
    } else {
      startAnimation();
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [numericValue, delayMs]);

  if (isNaN(numericValue)) return <span>{value}</span>;

  return <span>{displayValue}</span>;
}

const StatCard = ({ label, value, color, onClick, index = 0 }: any) => (
 <motion.div 
   initial={{ opacity: 0, y: 15, scale: 0.95 }}
   animate={{ opacity: 1, y: 0, scale: 1 }}
   transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
   onClick={onClick} 
   className={`${color} p-4 rounded-xl shadow-lg shadow-black/5 border border-white/20 dark:border-white/5 active:scale-95 transition-all flex flex-col justify-center items-center cursor-pointer relative overflow-hidden group backdrop-blur-xl`}>
    <div className="absolute -right-2 -top-2 w-16 h-16 bg-white/20 dark:bg-white/5 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
    <div className="text-3xl font-black relative z-10 tabular-nums tracking-tight mb-1"><AnimatedNumber value={value} delayMs={index * 100 + 300} /></div>
    <div className="text-[10px] sm:text-xs font-bold relative z-10 opacity-80 font-hindi">{label}</div>
    
    {/* Shine effect */}
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
 </motion.div>
);

const SectionHeader = ({ icon: Icon, title, rightElement, className = "", variant = "default" }: any) => {
  const getGradient = () => {
    switch(variant) {
      case 'orange': return "from-orange-500 via-red-500 to-rose-600 shadow-orange-500/20";
      case 'blue': return "from-blue-500 via-indigo-500 to-purple-600 shadow-blue-500/20";
      case 'green': return "from-emerald-500 via-teal-500 to-cyan-600 shadow-emerald-500/20";
      case 'purple': return "from-purple-500 via-fuchsia-100 to-pink-600 shadow-purple-500/20";
      default: return "from-indigo-500 via-purple-500 to-pink-500 shadow-indigo-500/20";
    }
  };

  const getIconColor = () => {
    switch(variant) {
      case 'orange': return "text-orange-500";
      case 'blue': return "text-blue-500";
      case 'green': return "text-emerald-500";
      case 'purple': return "text-purple-500";
      default: return "text-indigo-500";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={`flex justify-between items-center px-1.5 py-1 ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-1.5 h-6 bg-gradient-to-b ${getGradient()} rounded-full shadow-lg`}></div>
          <div className={`absolute -left-1 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-20 rounded-full blur-sm ${getIconColor().replace('text-', 'bg-')}`}></div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={14} className={`${getIconColor()} animate-pulse`} strokeWidth={2.5} />}
            <h3 className="text-sm font-black dark:text-white tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 font-hindi">
              {title}
            </h3>
          </div>
          <div className={`h-[1px] w-8 rounded-full mt-0.5 ${getIconColor().replace('text-', 'bg-')}/30`}></div>
        </div>
      </div>
      <div className="active:scale-90 transition-transform">{rightElement}</div>
    </motion.div>
  );
};

const SuccessOverlay = ({ isVisible, onClose }: { isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 1.5, opacity: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="bg-white/80 dark:bg-black/80 backdrop-blur-3xl p-10 rounded-full shadow-2xl border-4 border-green-500 flex flex-col items-center gap-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <CheckCircle2 size={100} className="text-green-500" strokeWidth={3} />
            </motion.div>
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-2">दौरा संपन्न!</h2>
              <p className="text-green-600 dark:text-green-400 font-bold uppercase tracking-widest text-sm">शानदार कार्य</p>
            </motion.div>
            
            {/* simple confetti particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 rounded-full bg-green-400"
                initial={{ x: 0, y: 0 }}
                animate={{ 
                  x: (i % 2 === 0 ? 1 : -1) * (50 + Math.random() * 50), 
                  y: (i < 3 ? 1 : -1) * (50 + Math.random() * 50),
                  opacity: 0
                }}
                transition={{ duration: 1.5, delay: 0.3 }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ContactProfile = ({ contact, villages, mandals, categories, onDelete, onEdit, onLogVisit, onBack, isRecentlyCalled, onDial, onVillageClick, onEditVisitHistory, onDeleteVisitHistory, whatsappMessage }: any) => {
  const vName = villages.find((v: any) => v.id === contact.villageId)?.name || '';
  const mName = mandals.find((m: any) => m.id === contact.mandalId)?.name || '';
  return (
   <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
     <header className="flex justify-between items-center">
       <button onClick={onBack} className="p-3 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md shadow-sm border dark:border-gray-700 active:scale-95 transition-all"><ArrowLeft size={20} className="dark:text-white"/></button>
       <div className="flex gap-2">
          <button onClick={onEdit} className="p-3 bg-blue-50 text-blue-600 rounded-md active:scale-95 transition-all"><Edit2 size={20}/></button>
          <button onClick={onDelete} className="p-3 bg-red-50 text-red-600 rounded-md active:scale-95 transition-all"><Trash2 size={20}/></button>
       </div>
     </header>
     <div className="text-center space-y-4">
        <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center text-white text-3xl font-medium shadow-xl ring-4 ring-white dark:ring-gray-800 transition-colors ${isRecentlyCalled ? 'bg-orange-500' : 'bg-blue-600'}`}>{contact.name[0]}</div>
        <h2 className="text-2xl font-medium dark:text-white font-hindi">{contact.name}</h2>
        <div className="flex items-center justify-center gap-3">
          <a 
            href={`tel:${contact.phone}`} 
            onClick={onDial} 
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-all ${isRecentlyCalled ? 'bg-orange-500 text-white' : 'bg-blue-600 text-white'}`}
           >
           <Phone size={18}/> {contact.phone}
          </a>
          <a
            href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank" rel="noopener noreferrer" 
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium shadow-lg active:scale-95 transition-all bg-[#25D366] text-white"
           >
           <WhatsappIcon size={18}/>
          </a>
        </div>
     </div>
     <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-6 rounded-sm border dark:border-gray-700 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
           <div className="flex items-center gap-2">
             <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-sm">
                <LucideIcon name={categories.find((c: any) => c.name === contact.category)?.icon || 'Tag'} size={18} />
             </div>
             <div><label className="text-xs font-medium text-gray-400 uppercase font-hindi">श्रेणी</label><div className="text-sm font-medium dark:text-white mt-1 font-hindi">{contact.category}</div></div>
           </div>
           <div><label className="text-xs font-medium text-gray-400 uppercase font-hindi">स्थिति</label><div className="text-sm font-medium dark:text-white mt-1 font-hindi">{contact.status}</div></div>
        </div>

         {(contact.volunteerProfile || contact.category) && (
          <div className="space-y-3 pt-4 border-t dark:border-gray-700">
            <h3 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5"><Tag size={12}/> स्वयंसेवक विवरण</h3>
             
            <div className="bg-gray-50 dark:bg-[#0c1222] rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden text-xs">
              <div className="grid grid-cols-3 border-b border-gray-200 dark:border-gray-800">
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#111827]/50 font-medium text-gray-500 dark:text-gray-400">पिता का नाम</div>
                <div className="p-2 col-span-2 font-medium dark:text-gray-200">{contact.volunteerProfile?.fatherName || '-'}</div>
              </div>
              <div className="grid grid-cols-4 border-b border-gray-200 dark:border-gray-800">
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#111827]/50 font-medium text-gray-500 dark:text-gray-400">रक्त समूह</div>
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 font-medium dark:text-gray-200 uppercase">{contact.volunteerProfile?.bloodGroup || '-'}</div>
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#111827]/50 font-medium text-gray-500 dark:text-gray-400">आयु</div>
                <div className="p-2 font-medium dark:text-gray-200">
                   {contact.volunteerProfile?.dob ? (() => {
                     const dob = new Date(contact.volunteerProfile.dob);
                     if (isNaN(dob.getTime())) return '-';
                     return `${Math.abs(new Date(Date.now() - dob.getTime()).getUTCFullYear() - 1970)} वर्ष`;
                   })() : '-'}
                </div>
              </div>
              <div className="grid grid-cols-4 border-b border-gray-200 dark:border-gray-800">
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#111827]/50 font-medium text-gray-500 dark:text-gray-400">शिक्षा</div>
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 font-medium dark:text-gray-200 line-clamp-1">{contact.volunteerProfile?.education || '-'}</div>
                <div className="p-2 border-r border-gray-200 dark:border-gray-800 bg-gray-100/50 dark:bg-[#111827]/50 font-medium text-gray-500 dark:text-gray-400">व्यवसाय</div>
                <div className="p-2 font-medium dark:text-gray-200 line-clamp-1">{contact.volunteerProfile?.profession || '-'}</div>
              </div>
            </div>

            <h3 className="text-[10px] font-bold text-orange-500 uppercase tracking-widest flex items-center gap-1.5 mt-4"><Tag size={12}/> संघ विवरण</h3>
            <div className="bg-orange-50/50 dark:bg-[#140c08]/50 rounded-lg border border-orange-100 dark:border-orange-900/50 overflow-hidden text-xs">
              <div className="grid grid-cols-3 border-b border-orange-100 dark:border-orange-900/50">
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400">वर्तमान दायित्व</div>
                <div className="p-2 col-span-2 font-medium text-orange-800 dark:text-orange-300">{contact.volunteerProfile?.currentResponsibility || '-'}</div>
              </div>
              <div className="grid grid-cols-3 border-b border-orange-100 dark:border-orange-900/50">
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400">शाखा/मिलन</div>
                <div className="p-2 col-span-2 font-medium text-orange-800 dark:text-orange-300">{contact.volunteerProfile?.currentShakha || '-'}</div>
              </div>
              <div className="grid grid-cols-4 border-b border-orange-100 dark:border-orange-900/50">
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400 mt-auto">प्रवेश</div>
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 font-medium text-orange-800 dark:text-orange-300">{contact.volunteerProfile?.sanghEntryYear || '-'}</div>
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400">शिक्षण</div>
                <div className="p-2 font-medium text-orange-800 dark:text-orange-300">{getHighestShikshan(contact.volunteerProfile?.sanghTraining) || '-'}</div>
              </div>
              <div className="grid grid-cols-4">
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400">गणवेश</div>
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 font-medium text-orange-800 dark:text-orange-300 line-clamp-1">{contact.volunteerProfile?.uniformStatus || '-'}</div>
                <div className="p-2 border-r border-orange-100 dark:border-orange-900/50 bg-orange-100/50 dark:bg-[#1f120a]/50 font-medium text-orange-600 dark:text-orange-400">वाहन</div>
                <div className="p-2 font-medium text-orange-800 dark:text-orange-300 line-clamp-1">{contact.volunteerProfile?.vehicle || '-'}</div>
              </div>
            </div>

             {(contact.volunteerProfile?.areasOfInterest?.length > 0 || contact.volunteerProfile?.availability?.length > 0) && (
              <div className="pt-2">
                 {contact.volunteerProfile?.areasOfInterest?.length > 0 && (
                  <div className="mb-2">
                    <label className="text-[10px] font-medium text-emerald-500 uppercase">रुचि का क्षेत्र</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                       {contact.volunteerProfile.areasOfInterest.map((a: string) =><span key={a} className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded border border-emerald-200 dark:border-emerald-800/50">{a}</span>)}
                    </div>
                  </div>
                 )}
                 {contact.volunteerProfile?.availability?.length > 0 && (
                  <div>
                    <label className="text-[10px] font-medium text-emerald-500 uppercase">उपलब्धता</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                       {contact.volunteerProfile.availability.map((a: string) =><span key={a} className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium rounded border border-emerald-200 dark:border-emerald-800/50">{a}</span>)}
                    </div>
                  </div>
                 )}
              </div>
             )}
          </div>
         )}
        <button 
           onClick={() => onVillageClick(contact.villageId)}
           className="w-full flex items-center justify-between gap-2 text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg uppercase active:scale-95 transition-all"
         >
           <div className="flex items-center gap-2">
             <MapPin size={14}/> {vName} • {mName}
           </div>
           <ChevronRight size={14} />
        </button>
        <div className="space-y-3">
           <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded w-fit uppercase tracking-widest mb-1.5">अनुवर्तन इतिहास</h4>
            {contact.history.length === 0 ? (
              <div className="text-xs text-gray-400 italic">कोई इतिहास नहीं है</div>
            ) : (
               contact.history.map((h: any) => (
                 <div key={h.id} className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-sm border dark:border-gray-800 relative group">
                    <div className="flex justify-between items-start">
                        <div className="text-[10px] font-medium text-blue-500">{new Date(h.date).toLocaleDateString('hi-IN')}</div>
                        <div className="flex gap-4">
                           <button onClick={(e) => { e.stopPropagation(); onEditVisitHistory?.(h); }} className="text-gray-400 hover:text-blue-500 active:scale-90 transition-all p-1"><Edit2 size={14}/></button>
                           <button onClick={(e) => { e.stopPropagation(); onDeleteVisitHistory?.(h.id); }} className="text-gray-400 hover:text-red-500 active:scale-90 transition-all p-1"><Trash2 size={14}/></button>
                        </div>
                    </div>
                    <div className="text-xs dark:text-gray-300 mt-1 whitespace-pre-wrap">"{h.notes}"</div>
                 </div>
               ))
            )}
        </div>
     </div>
     <button onClick={onLogVisit} className="w-full p-4 bg-blue-600 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 abstract-btn"><CheckCircle2 size={18}/> अनुवर्तन दर्ज करें</button>
   </div>
  );
};

const VillageDetail = ({ village, contacts, ideas, onBack, onContactClick, onUpdateVillage, onUpdateStage, onUpdateShakhaData }: any) => {
  const vContacts = contacts.filter((c: any) => c.villageId === village.id);
  const [isEditingSpecialty, setIsEditingSpecialty] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [specialty, setSpecialty] = useState(village.specialty || '');
  const [newName, setNewName] = useState(village.name);

  return (
   <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
      <header className="flex items-center gap-4">
         <button onClick={onBack} className="p-3 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md shadow-sm border dark:border-gray-700 active:scale-95 transition-all"><ArrowLeft size={20} className="dark:text-white"/></button>
         <div className="flex-1 flex justify-between items-center">
            {isEditingName ? (
             <div className="flex items-center gap-2 flex-1">
               <input 
                  autoFocus 
                  className="bg-transparent text-2xl font-bold dark:text-white outline-none border-b-2 border-blue-500 w-full"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onBlur={() => { onUpdateVillage({ name: newName }); setIsEditingName(false); }}
                  onKeyDown={e => { if(e.key === 'Enter') { onUpdateVillage({ name: newName }); setIsEditingName(false); } }}
                />
             </div>
            ) : (
             <div onClick={() => setIsEditingName(true)} className="flex-1 cursor-pointer group">
               <h2 className="text-2xl font-bold dark:text-white group-hover:text-blue-600 transition-colors">{village.name}</h2>
               <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-0.5">गाँव का विवरण (बदलने के लिए नाम पर क्लिक करें)</p>
             </div>
            )}
         </div>
      </header>

       {/* Village Specialty Section */}
      <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-sm text-white shadow-lg shadow-blue-500/20 space-y-4">
         <div className="flex justify-between items-center">
           <div className="flex items-center gap-2">
             <Star size={18} fill="currentColor" />
             <h3 className="font-bold text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 w-fit rounded uppercase tracking-widest">गाँव की विशेषता</h3>
           </div>
           <button 
              onClick={() => {
                if (isEditingSpecialty) {
                  onUpdateVillage({ specialty });
                }
                setIsEditingSpecialty(!isEditingSpecialty);
              }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-sm transition-all active:scale-90"
            >
              {isEditingSpecialty ?<Check size={18} /> :<Edit2 size={18} />}
           </button>
         </div>
          {isEditingSpecialty ? (
           <textarea 
              autoFocus
              className="w-full bg-white/10 p-4 rounded-md border border-white/20 outline-none text-white font-medium placeholder:text-white/50"
              placeholder="गाँव की विशेषताएँ यहाँ लिखें..."
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
            />
          ) : (
           <p className="text-sm font-medium leading-relaxed opacity-90">
              {village.specialty || 'कोई विशेषता नहीं लिखी गई है। सुधारने के लिए पेंसिल आइकॉन पर क्लिक करें।'}
           </p>
          )}
      </div>

      <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-6 rounded-sm border dark:border-gray-700 space-y-6 shadow-sm">
         <div className="space-y-4">
            <label className="text-xs font-medium text-gray-400 uppercase px-1">कार्यस्थिति (कार्य प्रकार)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.values(VillageStage).map(s => (
                  <button key={s} onClick={() => onUpdateStage(s)} className={`p-3 rounded-lg text-xs font-medium border transition-all active:scale-95 ${village.stage === s ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white/60 dark:bg-[#0a101f]/60 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800 hover:border-orange-300 dark:hover:border-orange-900/50'}`}>{s}</button>
                ))}
            </div>

             {village.stage !== VillageStage.NONE && (
              <div className="mt-4 p-4 bg-white/60 dark:bg-[#0a101f]/60 rounded-xl border border-gray-200 dark:border-gray-800 space-y-3 shadow-inner">
                <h4 className="font-medium text-sm text-gray-800 dark:text-white flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                   {village.stage} का विवरण
                </h4>
                 
                 {village.stage !== VillageStage.SAMPARK && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase ml-1">स्थान</label>
                      <input placeholder="स्थान..." className="w-full bg-white dark:bg-[#0f172a] p-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.location || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, location: e.target.value } })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-medium text-gray-500 uppercase ml-1">समय</label>
                      <input type="time" className="w-full bg-white dark:bg-[#0f172a] p-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.time || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, time: e.target.value } })} />
                    </div>

                     {village.stage === VillageStage.MILAN && (
                       <div className="space-y-1">
                         <label className="text-[10px] font-medium text-gray-500 uppercase ml-1">सप्ताह का तय दिन</label>
                         <select className="w-full bg-white dark:bg-[#0f172a] p-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors appearance-none" value={village.karyaDetails?.dayOfWeek || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, dayOfWeek: e.target.value } })}>
                           <option value="">कोई नहीं</option>
                            {['सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार', 'रविवार'].map(d =><option key={d} value={d}>{d}</option>)}
                         </select>
                       </div>
                     )}

                     {village.stage === VillageStage.MANDALI && (
                       <div className="space-y-1 col-span-2">
                         <label className="text-[10px] font-medium text-gray-500 uppercase ml-1">महीने के कौन कौन से दिन</label>
                         <input placeholder="उदा. दूसरे और चौथे शनिवार" className="w-full bg-white dark:bg-[#0f172a] p-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors" value={village.karyaDetails?.daysOfMonth || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, daysOfMonth: e.target.value } })} />
                       </div>
                     )}
                  </div>
                 )}
                 
                 {village.stage === VillageStage.SAMPARK && (
                  <div className="space-y-1">
                     <label className="text-[10px] font-medium text-gray-500 uppercase ml-1">टिप्पणियाँ (Notes)</label>
                     <textarea placeholder="संपर्क के बारे में कुछ लिखें..." className="w-full bg-white dark:bg-[#0f172a] p-2 rounded-lg border border-gray-200 dark:border-gray-700 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors min-h-[60px]" value={village.karyaDetails?.notes || ''} onChange={e => onUpdateVillage({ karyaDetails: { ...village.karyaDetails, notes: e.target.value } })} />
                   </div>
                 )}
              </div>
             )}
         </div>

         <div className="space-y-4 pt-6 border-t border-white/20 dark:border-gray-700/50">
            <label className="text-xs font-medium text-gray-400 uppercase px-1">कार्य योजना (योजना)</label>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-gray-500 ml-1">वर्तमान स्थिति</label>
                <textarea placeholder="अभी क्या स्थिति है?" className="w-full bg-white/50 dark:bg-[#0a101f]/50 p-2 rounded-lg border border-gray-200 dark:border-gray-700/50 outline-none text-xs font-medium dark:text-white focus:border-blue-500 transition-colors min-h-[60px]" value={village.karyaPlan?.current || ''} onChange={e => onUpdateVillage({ karyaPlan: { ...village.karyaPlan, current: e.target.value } })} />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-medium text-blue-500 uppercase">लक्ष्य</label>
                   <button onClick={() => {
                       const newTarget = { id: crypto.randomUUID(), title: '', date: new Date().toISOString().split('T')[0], isCompleted: false };
                       onUpdateVillage({ targets: [...(village.targets || []), newTarget] });
                    }} className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">नया लक्ष्य जोड़ें</button>
                </div>
                <div className="space-y-2">
                   {(village.targets || []).map(target => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // reset time for accurate diff
                      const targetDate = new Date(target.date);
                      targetDate.setHours(0, 0, 0, 0);
                      const diffTime = targetDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      return (
                       <div key={target.id} className={`p-3 rounded-lg border ${target.isCompleted ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 opacity-70' : diffDays< 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50' : 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'} space-y-2 relative transition-all`}>
                          <div className="flex gap-2 items-start">
                            <button onClick={() => {
                                const newTargets = village.targets?.map(t => t.id === target.id ? { ...t, isCompleted: !t.isCompleted } : t);
                                onUpdateVillage({ targets: newTargets });
                             }} className={`shrink-0 w-5 h-5 mt-0.5 rounded-md flex items-center justify-center border transition-all ${target.isCompleted ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-[#0a101f] border-gray-300 dark:border-gray-600 text-transparent'}`}>
                               <CheckCircle2 size={14} className={target.isCompleted ? 'opacity-100' : 'opacity-0'} />
                            </button>
                            <div className="flex-1 space-y-1.5">
                              <input type="text" placeholder="उद्देश्य/लक्ष्य (उदा. 10 नए संपर्क बनाना)" className={`w-full bg-transparent outline-none font-medium text-xs dark:text-white ${target.isCompleted ? 'line-through text-gray-400' : ''}`} value={target.title} onChange={e => {
                                  const newTargets = village.targets?.map(t => t.id === target.id ? { ...t, title: e.target.value } : t);
                                  onUpdateVillage({ targets: newTargets });
                               }} />
                              <div className="flex items-center gap-2">
                                <input type="date" className="bg-white/50 dark:bg-[#0f172a] px-2 py-0.5 rounded text-[10px] font-medium outline-none border border-transparent focus:border-blue-400 dark:text-gray-300" value={target.date} onChange={e => {
                                    const newTargets = village.targets?.map(t => t.id === target.id ? { ...t, date: e.target.value } : t);
                                    onUpdateVillage({ targets: newTargets });
                                 }} />
                                 {!target.isCompleted && (
                                  <span className={`text-[10px] font-medium ${diffDays< 0 ? 'text-red-500' : diffDays<= 7 ? 'text-orange-500' : 'text-blue-500'}`}>
                                     {diffDays< 0 ? `${Math.abs(diffDays)} दिन बीत गए` : diffDays === 0 ? 'आज' : `${diffDays} दिन बचे`}
                                  </span>
                                 )}
                              </div>
                            </div>
                            <button onClick={() => {
                                const newTargets = village.targets?.filter(t => t.id !== target.id);
                                onUpdateVillage({ targets: newTargets });
                             }} className="shrink-0 text-gray-400 hover:text-red-500 p-1 active:scale-95"><Trash2 size={14}/></button>
                          </div>
                       </div>
                      );
                   })}
                   {!(village.targets?.length > 0) && (
                     <div className="text-center p-4 text-[10px] font-medium text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed dark:border-gray-700">
                         कोई लक्ष्य तय नहीं किया गया
                     </div>
                   )}
                </div>
              </div>

            </div>
         </div>

         <div className="space-y-3 pt-6 border-t dark:border-gray-700">
            <div className="flex justify-between items-center px-1">
               <label className="text-[10px] font-medium text-gray-400 uppercase">गाँव के संपर्क ({vContacts.length})</label>
            </div>
            <div className="space-y-2">
               {vContacts.length === 0 ? (
                <div className="p-10 text-center text-gray-400 font-medium bg-gray-50 dark:bg-gray-900 rounded-md text-[10px]">कोई संपर्क नहीं मिला</div>
               ) : (
                 vContacts.map((c: any) => (
                  <div key={c.id} onClick={() => onContactClick(c.id)} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border dark:border-gray-700 active:scale-95 transition-all">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">{c.name[0]}</div>
                    <div className="flex-1">
                      <div className="text-xs font-medium dark:text-white flex items-center gap-2">{c.name}</div>
                      <div className="text-[8px] font-medium text-gray-400 uppercase">{c.category} • {c.status}</div>
                    </div>
                    <ChevronRight size={14} className="text-gray-300" />
                  </div>
                 ))
               )}
            </div>
         </div>

         <div className="space-y-3 pt-6 border-t dark:border-gray-700">
            <label className="text-[10px] font-medium text-gray-400 uppercase px-1">दायित्व वितरण</label>
             {Object.values(ShakhaPosition).map(pos => (
               <div key={pos} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-sm border dark:border-gray-800">
                  <div className="text-[10px] font-medium text-gray-500 uppercase">{pos}</div>
                  <div className="flex items-center gap-2">
                     <select 
                        className="bg-transparent text-[10px] font-medium dark:text-white outline-none text-right" 
                        value={village.shakhaData?.positions?.[pos] || ''} 
                        onChange={e => onUpdateShakhaData({ positions: { ...village.shakhaData?.positions, [pos]: e.target.value } })}
                      >
                        <option value="">चुनें...</option>
                         {vContacts.map((c: any) =><option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                      {village.shakhaData?.positions?.[pos] && (
                       <button onClick={() => onContactClick(village.shakhaData.positions[pos])} className="p-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg active:scale-90"><ChevronRight size={14}/></button>
                      )}
                  </div>
               </div>
             ))}
         </div>
      </div>
   </div>
  );
};

const ContactFormModal = ({ khands, mandals, villages, categories, initialData, onClose, onSubmit }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(initialData?.name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [khandId, setKhandId] = useState(initialData?.khandId || '');
  const [mandalId, setMandalId] = useState(initialData?.mandalId || '');
  const [villageId, setVillageId] = useState(initialData?.villageId || '');
  const [cat, setCat] = useState(initialData?.category || categories[0]?.name || '');
  const [status, setStatus] = useState(initialData?.status || Status.SAKRIYA);
  
  const [showMore, setShowMore] = useState(false);
  const [profile, setProfile] = useState<any>(initialData?.volunteerProfile || {});

  const updateProfile = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleInterestToggle = (interest: string) => {
    const current = profile.areasOfInterest || [];
    if (current.includes(interest)) updateProfile('areasOfInterest', current.filter((i: string) => i !== interest));
    else updateProfile('areasOfInterest', [...current, interest]);
  };

  const handleAvailToggle = (day: string) => {
    const current = profile.availability || [];
    if (current.includes(day)) updateProfile('availability', current.filter((d: string) => d !== day));
    else updateProfile('availability', [...current, day]);
  };

  const addListEntry = (field: string, defaultObj: any) => {
    updateProfile(field, [...(profile[field] || []), defaultObj]);
  };
  const updateListEntry = (field: string, index: number, key: string, value: any) => {
    const list = [...(profile[field] || [])];
    list[index][key] = value;
    updateProfile(field, list);
  };
  const removeListEntry = (field: string, index: number) => {
    const list = [...(profile[field] || [])];
    list.splice(index, 1);
    updateProfile(field, list);
  };

  const INTERESTS = ['शारीरिक', 'बौद्धिक', 'सेवा', 'व्यवस्था', 'प्रचार', 'संपर्क', 'पर्यावरण', 'सद्भावना', 'ग्राम विकास', 'कृषक कार्य', 'पूर्व सैनिक कार्य', 'गौ सेवा', 'धर्मजागरण'];
  const DAYS = ['सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि', 'रवि'];

  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full lg:max-w-4xl mx-auto lg:max-h-[85vh] lg:my-auto lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/20">
     <div className="flex-1 flex flex-col w-full h-full lg:overflow-hidden relative">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight">{initialData?.id ? 'संपर्क सुधारें' : 'नया संपर्क जोड़ें'}</h2>
       </div>
     </header>

     <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-md mx-auto w-full pb-32 relative z-10">
       <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="पूरा नाम" className="col-span-2 p-2.5 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 rounded-md outline-none font-medium text-sm" value={name} onChange={e=>setName(e.target.value)} />
            <input placeholder="मोबाइल नंबर" type="tel" maxLength={10} className="col-span-2 p-2.5 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 rounded-md outline-none font-medium text-sm" value={phone} onChange={e=>setPhone(e.target.value)} />
             
            <select className="p-2 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md font-medium text-xs outline-none" value={khandId} onChange={e=>{setKhandId(e.target.value); setMandalId(''); setVillageId('');}}>
              <option value="">खंड...</option>
               {khands.map((k: any) =><option key={k.id} value={k.id}>{k.name}</option>)}
            </select>
            <select className="p-2 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md font-medium text-xs outline-none disabled:opacity-50" value={mandalId} disabled={!khandId} onChange={e=>{setMandalId(e.target.value); setVillageId('');}}>
              <option value="">मंडल...</option>
               {mandals.filter((m: any) => m.khandId === khandId).map((m: any) =><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
             
            <select className="col-span-2 p-2.5 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md font-medium text-xs outline-none disabled:opacity-50" value={villageId} disabled={!mandalId} onChange={e=>setVillageId(e.target.value)}>
              <option value="">गांव / बस्ती...</option>
               {villages.filter((v: any)=>v.mandalId===mandalId).map((v: any) =><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>

            <select className="p-2 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md font-medium text-xs outline-none" value={cat} onChange={e=>setCat(e.target.value)}>
               {categories.map((c: any) =><option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
             
            <select className="p-2 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-sm text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md font-medium text-xs outline-none" value={status} onChange={e=>setStatus(e.target.value as Status)}>
               {Object.values(Status).map(s =><option key={s} value={s}>{s}</option>)}
            </select>
          </div>

           {/* Expandable Volunteer Profile Details */}
          <div className="pt-2 lg:hidden">
             <button onClick={() => setShowMore(!showMore)} className="w-full py-2.5 flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium text-xs rounded-md transition-all">
                 {showMore ? "विवरण बंद करें" : "+ अधिक विवरण जोड़ें"}
             </button>
          </div>
           
           <div className={`${showMore ? 'block' : 'hidden'} lg:block space-y-4 pt-3 border-t dark:border-gray-800 animate-in slide-in-from-top-4 duration-300 lg:animate-none lg:border-t-0 lg:pt-0`}>
               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border dark:border-gray-800">
                 <h3 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded w-fit uppercase tracking-widest mb-2">व्यक्तिगत जानकारी</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <input placeholder="पिता का नाम" className="col-span-2 sm:col-span-1 p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.fatherName || ''} onChange={e=>updateProfile('fatherName', e.target.value)} />
                    <input placeholder="ईमेल" type="email" className="col-span-2 sm:col-span-1 p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.email || ''} onChange={e=>updateProfile('email', e.target.value)} />
                     
                    <div className="flex items-center gap-2 w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700">
                       <span className="text-xs font-medium text-gray-400">जन्मतिथि</span>
                       <input type="date" className="flex-1 bg-transparent text-[11px] font-medium outline-none" value={profile.dob || ''} onChange={e=>updateProfile('dob', e.target.value)} />
                    </div>
                    <input placeholder="रक्त समूह (ex A+)" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium uppercase outline-none placeholder:text-gray-400" value={profile.bloodGroup || ''} onChange={e=>updateProfile('bloodGroup', e.target.value)} />
                     
                    <select className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none" value={profile.maritalStatus || ''} onChange={e=>updateProfile('maritalStatus', e.target.value)}>
                       <option value="">वैवाहिक स्थिति</option>
                       <option value="विवाहित">विवाहित</option>
                       <option value="अविवाहित">अविवाहित</option>
                    </select>
                    <input placeholder="वैकल्पिक मोबाइल" type="tel" maxLength={10} className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.phone2 || ''} onChange={e=>updateProfile('phone2', e.target.value)} />
                     
                    <textarea placeholder="स्थानीय पता" rows={1} className="col-span-2 p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400 resize-none" value={profile.localAddress || ''} onChange={e=>updateProfile('localAddress', e.target.value)} />
                 </div>
               </div>

               <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border dark:border-gray-800">
                 <h3 className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 rounded w-fit uppercase tracking-widest mb-2">शिक्षा एवं व्यवसाय</h3>
                 <div className="grid grid-cols-2 gap-2">
                    <input placeholder="शैक्षणिक योग्यता" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.education || ''} onChange={e=>updateProfile('education', e.target.value)} />
                    <input placeholder="व्यवसाय" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.profession || ''} onChange={e=>updateProfile('profession', e.target.value)} />
                    <input placeholder="कार्यालय / पद विवरण" className="col-span-2 p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-gray-400" value={profile.officeDetails || ''} onChange={e=>updateProfile('officeDetails', e.target.value)} />
                 </div>
               </div>

               <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-lg p-2.5 border border-orange-100 dark:border-orange-900/40">
                 <h3 className="text-[10px] font-bold text-orange-400 uppercase tracking-widest pl-1 mb-2">सांघिक जानकारी</h3>
                 <div className="grid grid-cols-2 gap-2 mb-2">
                    <input placeholder="प्रवेश वर्ष (YYYY)" type="number" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-orange-100 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-orange-300 dark:placeholder:text-gray-500" value={profile.sanghEntryYear || ''} onChange={e=>updateProfile('sanghEntryYear', e.target.value)} />
                    <input placeholder="शाखा/मिलन" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-orange-100 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-orange-300 dark:placeholder:text-gray-500" value={profile.currentShakha || ''} onChange={e=>updateProfile('currentShakha', e.target.value)} />
                    <input placeholder="वर्तमान दायित्व" className="col-span-2 p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-orange-100 dark:border-gray-700 text-xs font-medium outline-none placeholder:text-orange-300 dark:placeholder:text-gray-500" value={profile.currentResponsibility || ''} onChange={e=>updateProfile('currentResponsibility', e.target.value)} />
                 </div>
                  
                 <div className="space-y-1.5 mb-2">
                   <div className="flex justify-between items-center px-1">
                     <label className="text-[9px] font-medium text-orange-500 uppercase tracking-widest">पूर्व दायित्व</label>
                     <button onClick={() => addListEntry('previousResponsibilities', { title: '', year: '' })} className="text-[10px] font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">+ जोड़ें</button>
                   </div>
                    {Array.isArray(profile.previousResponsibilities) && profile.previousResponsibilities.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-1 items-center">
                       <input placeholder="दायित्व" className="flex-1 p-1.5 bg-white dark:bg-[#070b14] dark:text-white rounded text-[11px] border border-orange-100 dark:border-gray-700 outline-none" value={item.title || ''} onChange={e => updateListEntry('previousResponsibilities', idx, 'title', e.target.value)} />
                       <input placeholder="वर्ष" type="number" className="w-[60px] p-1.5 bg-white dark:bg-[#070b14] dark:text-white rounded text-[11px] border border-orange-100 dark:border-gray-700 outline-none text-center" value={item.year || ''} onChange={e => updateListEntry('previousResponsibilities', idx, 'year', e.target.value)} />
                       <button onClick={() => removeListEntry('previousResponsibilities', idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                     </div>
                    ))}
                 </div>

                 <div className="space-y-1.5">
                   <div className="flex justify-between items-center px-1">
                     <label className="text-[9px] font-medium text-orange-500 uppercase tracking-widest">संघ शिक्षण</label>
                     <button onClick={() => addListEntry('sanghTraining', { class: '', year: '', location: '' })} className="text-[10px] font-medium text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded">+ जोड़ें</button>
                   </div>
                    {Array.isArray(profile.sanghTraining) && profile.sanghTraining.map((item: any, idx: number) => (
                     <div key={idx} className="flex gap-1 items-center">
                       <select className="w-32 p-1.5 bg-white dark:bg-[#070b14] dark:text-white rounded text-[10px] border border-orange-100 dark:border-gray-700 outline-none" value={item.class || ''} onChange={e => updateListEntry('sanghTraining', idx, 'class', e.target.value)}>
                           <option value="">वर्ग...</option>
                           <option value="प्रारंभिक शिक्षा वर्ग">प्रारंभिक</option>
                           <option value="प्राथमिक शिक्षा वर्ग">प्राथमिक</option>
                           <option value="प्रथम वर्ष / संघ शिक्षा वर्ग">प्रथम</option>
                           <option value="द्वितीय वर्ष / का वि व - प्रथम">द्वितीय</option>
                           <option value="तृतीय वर्ष / का वि व - द्वितीय">तृतीय</option>
                           <option value="घोष वर्ग">घोष</option>
                       </select>
                       <input placeholder="वर्ष" type="number" className="min-w-0 w-[50px] p-1.5 bg-white dark:bg-[#070b14] dark:text-white rounded text-[11px] border border-orange-100 dark:border-gray-700 outline-none text-center" value={item.year || ''} onChange={e => updateListEntry('sanghTraining', idx, 'year', e.target.value)} />
                       <input placeholder="स्थान" className="flex-1 min-w-0 p-1.5 bg-white dark:bg-[#070b14] dark:text-white rounded text-[11px] border border-orange-100 dark:border-gray-700 outline-none" value={item.location || ''} onChange={e => updateListEntry('sanghTraining', idx, 'location', e.target.value)} />
                       <button onClick={() => removeListEntry('sanghTraining', idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                     </div>
                    ))}
                 </div>
               </div>

               <div className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg p-2.5 border border-emerald-100 dark:border-emerald-900/40">
                 <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest pl-1 mb-2">कौशल, रुचि एवं संसाधन</h3>
                 <div className="grid grid-cols-3 gap-2 mb-2">
                    <select className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded text-[10px] font-medium border border-emerald-100 dark:border-gray-700 outline-none" value={profile.uniformStatus || ''} onChange={e=>updateProfile('uniformStatus', e.target.value)}>
                       <option value="">गणवेश...</option>
                       <option value="पूर्ण">पूर्ण</option>
                       <option value="अपूर्ण">अपूर्ण</option>
                       <option value="नहीं">नहीं</option>
                    </select>
                    <select className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded text-[10px] font-medium border border-emerald-100 dark:border-gray-700 outline-none" value={profile.vehicle || ''} onChange={e=>updateProfile('vehicle', e.target.value)}>
                       <option value="">वाहन...</option>
                       <option value="दुपहिया">दुपहिया</option>
                       <option value="चौपहिया">चौपहिया</option>
                       <option value="कोई नहीं">कोई नहीं</option>
                    </select>
                    <button onClick={()=>updateProfile('isPratijnyavan', !profile.isPratijnyavan)} className={`w-full p-2 rounded text-[10px] font-medium border transition-all truncate outline-none ${profile.isPratijnyavan ? 'bg-orange-100 border-orange-500 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-white dark:bg-[#070b14] dark:text-white border-emerald-100 dark:border-gray-700'}`}>
                        {profile.isPratijnyavan ? 'प्रतिज्ञावान' : 'अप्राप्त'}
                    </button>
                 </div>
                  
                 <div className="grid grid-cols-2 gap-2 mb-3">
                    <input placeholder="घोष वाद्य" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-emerald-100 dark:border-gray-700 text-[11px] font-medium outline-none placeholder:text-gray-400" value={profile.ghoshVadya || ''} onChange={e=>updateProfile('ghoshVadya', e.target.value)} />
                    <input placeholder="विशेष कौशल / ज्ञान" className="w-full p-2 bg-white dark:bg-[#070b14] dark:text-white rounded border border-emerald-100 dark:border-gray-700 text-[11px] font-medium outline-none placeholder:text-gray-400" value={profile.specialSkills || ''} onChange={e=>updateProfile('specialSkills', e.target.value)} />
                 </div>

                 <div className="space-y-1 mb-3">
                    <label className="text-[9px] font-medium text-emerald-500 uppercase px-1">रुचि के क्षेत्र</label>
                    <div className="flex flex-wrap gap-1">
                        {INTERESTS.map(interest => (
                          <button key={interest} onClick={()=>handleInterestToggle(interest)} className={`px-2 py-1 rounded text-[9px] font-medium border transition-all ${(profile.areasOfInterest || []).includes(interest) ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white dark:bg-[#070b14] dark:text-white border-emerald-100 dark:border-gray-700 text-gray-500'}`}>
                              {interest}
                          </button>
                        ))}
                    </div>
                 </div>

                 <div className="space-y-1">
                    <label className="text-[9px] font-medium text-emerald-500 uppercase px-1">उपलब्धता</label>
                    <div className="flex flex-wrap gap-1">
                        {DAYS.map(day => (
                          <button key={day} onClick={()=>handleAvailToggle(day)} className={`px-2 py-1 rounded text-[9px] font-medium border transition-all ${(profile.availability || []).includes(day) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-[#070b14] dark:text-white border-emerald-100 dark:border-gray-700 text-gray-500'}`}>
                              {day}
                          </button>
                        ))}
                    </div>
                 </div>
               </div>

               <textarea placeholder="अन्य विवरण या टिप्पणी..." rows={2} className="w-full bg-white dark:bg-[#070b14] border border-gray-200 text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:border-gray-700 p-2.5 rounded-lg outline-none font-medium text-xs resize-none" value={profile.otherDetails || ''} onChange={e=>updateProfile('otherDetails', e.target.value)} />
            </div>

       </div>
      </div>
      <div className="bg-white dark:bg-[#070b14] p-4 lg:p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3 relative z-20">
          <button onClick={onClose} className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 dark:text-white font-medium rounded-lg active:scale-95 transition-all text-gray-500 text-sm">रद्द</button>
          <button disabled={!name || !phone || !villageId || isSubmitting} onClick={() => {
             setIsSubmitting(true);
             onSubmit({ name, phone, khandId, mandalId, villageId, category: cat, status, volunteerProfile: profile });
           }} className="flex-1 p-3 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-lg shadow-sm active:scale-95 transition-all disabled:opacity-50 text-sm abstract-btn">{isSubmitting ? 'सुरक्षित हो रहा है...' : 'सुरक्षित'}</button>
      </div>
     </div>
   </div>
  );
};

const TripFormModal = ({ khands, mandals, villages, contacts, initialData, ideas, onClose, onSubmit }: any) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [khandId, setKhandId] = useState(initialData?.khandId || '');
  const [mandalId, setMandalId] = useState(initialData?.mandalId || '');
  const [selVillages, setSelVillages] = useState<string[]>(initialData?.villageIds || []);
  const [selPeople, setSelPeople] = useState<string[]>(initialData?.peopleIds || []);
  const [notes, setNotes] = useState(initialData?.notes || '');

  const relevantIdeas = useMemo(() => {
    if (!mandalId) return [];
    return ideas.filter((idea: Idea) => 
      !idea.isCompleted && 
      (idea.mandalId === mandalId || (idea.villageId && selVillages.includes(idea.villageId)) || (idea.contactId && selPeople.includes(idea.contactId)))
    );
  }, [mandalId, selVillages, selPeople, ideas]);

  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full lg:max-w-4xl mx-auto lg:max-h-[85vh] lg:my-auto lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/20">
     <div className="flex-1 flex flex-col w-full h-full lg:overflow-hidden relative">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight">{initialData ? 'योजना सुधारें' : 'नई प्रवास योजना'}</h2>
       </div>
     </header>

     <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-md mx-auto w-full pb-32 relative z-10">
       <div className="space-y-4">
           {relevantIdeas.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800/40 animate-in bounce-in duration-500">
              <h3 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-2 mb-2"><Lightbulb size={12}/> आपके विचार / रिमाइंडर्स</h3>
              <div className="space-y-2">
                 {relevantIdeas.map((idea: Idea) => (
                  <div key={idea.id} className="text-xs font-medium dark:text-gray-300">• {idea.content}</div>
                 ))}
              </div>
            </div>
           )}
          <input type="date" className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 p-4 rounded-md outline-none font-medium text-sm" value={date} onChange={e=>setDate(e.target.value)} />
          <div className="grid grid-cols-2 gap-3">
             <select className="p-3 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-white rounded-md text-xs font-medium outline-none" value={khandId} onChange={e=>{setKhandId(e.target.value); setMandalId(''); setSelVillages([]); setSelPeople([]);}}>
               <option value="">खंड चुनें</option>
                {khands.map((k:any)=><option key={k.id} value={k.id}>{k.name}</option>)}
             </select>
             <select className="p-3 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-white rounded-md text-xs font-medium outline-none disabled:opacity-50" value={mandalId} disabled={!khandId} onChange={e=>{setMandalId(e.target.value); setSelVillages([]); setSelPeople([]);}}>
               <option value="">मंडल चुनें</option>
                {mandals.filter((m:any)=>m.khandId===khandId).map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
          </div>
           {mandalId && (
            <>
              <div className="space-y-4 pb-4 pt-2">
                 <div>
                   <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">गांव का चयन</label>
                   <div className="grid grid-cols-2 gap-2 mt-2">
                      {villages.filter((v:any)=>v.mandalId===mandalId && !['शाखा', 'मिलन', 'मंडली'].includes(v.stage)).map((v:any)=>(
                       <button key={v.id} onClick={()=>setSelVillages(prev=>prev.includes(v.id)?prev.filter(x=>x!==v.id):[...prev, v.id])} className={`w-full p-2.5 rounded-md text-left text-xs font-medium border flex items-center justify-between transition-all overflow-hidden ${selVillages.includes(v.id)?'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600':'bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border-white/40 border-t-white/70 dark:border-gray-700/50 dark:text-gray-300'}`}>
                         <span className="truncate">{v.name}</span>
                          {selVillages.includes(v.id)&&<CheckCircle2 size={14} className="flex-none ml-1"/>}
                       </button>
                      ))}
                   </div>
                 </div>
                  
                  {villages.filter((v:any)=>v.mandalId===mandalId && ['शाखा', 'मिलन', 'मंडली'].includes(v.stage)).length > 0 && (
                   <div>
                     <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">सक्रिय शाखा/मिलन/मंडली</label>
                     <div className="grid grid-cols-2 gap-2 mt-2">
                        {villages.filter((v:any)=>v.mandalId===mandalId && ['शाखा', 'मिलन', 'मंडली'].includes(v.stage)).map((v:any)=>(
                         <button key={v.id} onClick={()=>setSelVillages(prev=>prev.includes(v.id)?prev.filter(x=>x!==v.id):[...prev, v.id])} className={`w-full p-2.5 rounded-md text-left text-[10px] font-medium border flex items-center justify-between transition-all overflow-hidden ${selVillages.includes(v.id)?'bg-orange-600 dark:bg-orange-500 text-white border-orange-600':'bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border-white/40 border-t-white/70 dark:border-gray-700/50 dark:text-gray-300'}`}>
                           <span className="truncate">{v.name} ({v.stage})</span>
                            {selVillages.includes(v.id)&&<CheckCircle2 size={14} className="flex-none ml-1"/>}
                         </button>
                        ))}
                     </div>
                   </div>
                  )}
              </div>
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">संपर्क का चयन</label>
              <div className="space-y-4">
                 {(() => {
                   const mandalContacts = contacts.filter((c:any)=>c.mandalId===mandalId);
                   const groupedContacts = mandalContacts.reduce((acc: any, c: any) => {
                     const vId = c.villageId || 'other';
                     if (!acc[vId]) acc[vId] = [];
                     acc[vId].push(c);
                     return acc;
                   }, {});

                   return Object.entries(groupedContacts).map(([vId, vContacts]: [string, any]) => {
                     const vName = vId === 'other' ? 'अन्य' : villages.find((v:any)=>v.id===vId)?.name || 'Unknown';
                     return (
                      <div key={vId} className="space-y-2">
                        <motion.div initial={{ opacity: 0, y: 5 }} whileInView={{ opacity: 1, y: 0 }} className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800/50 rounded flex inline-flex w-full mb-1 shadow-sm flex items-center gap-1.5 relative overflow-hidden"><span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent origin-left align-left"></span><MapPin size={10} className="opacity-70 relative z-10"/><span className="relative z-10 text-sm" style={{fontFamily: "inherit"}}>{vName}</span></motion.div>
                        <div className="grid grid-cols-2 gap-2">
                           {vContacts.map((c:any) => (
                            <button key={c.id} onClick={()=>setSelPeople(prev=>prev.includes(c.id)?prev.filter(x=>x!==c.id):[...prev, c.id])} className={`w-full p-2.5 rounded-md text-left text-xs font-medium border flex items-center justify-between transition-all overflow-hidden ${selPeople.includes(c.id)?'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600':'bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border-white/40 border-t-white/70 dark:border-gray-700/50 dark:text-gray-300'}`}>
                              <div className="flex items-center gap-1.5 min-w-0">
                                 <span className="truncate">{c.name}</span>
                                  {ideas.some((i: any) => !i.isCompleted && i.contactId === c.id) &&<span className="flex-none w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>}
                              </div>
                               {selPeople.includes(c.id)&&<CheckCircle2 size={14} className="flex-none ml-1"/>}
                            </button>
                           ))}
                        </div>
                      </div>
                     );
                   });
                 })()}
              </div>
              <textarea placeholder="टिप्पणी / प्रवास विवरण" rows={3} className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 p-4 rounded-md outline-none font-medium text-sm" value={notes} onChange={e=>setNotes(e.target.value)} />
            </>
           )}
       </div>
      </div>
      <div className="bg-white dark:bg-[#070b14] p-4 lg:p-6 border-t border-gray-200 dark:border-gray-800 flex gap-4 relative z-20">
          <button onClick={onClose} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium rounded-xl active:scale-95 transition-all">रद्द</button>
          <button disabled={!mandalId || selVillages.length===0 || isSubmitting} onClick={() => { setIsSubmitting(true); onSubmit({ date, khandId, mandalId, villageIds: selVillages, peopleIds: selPeople, notes, schedule: initialData?.schedule || [], isCompleted: initialData?.isCompleted || false }); }} className="flex-1 p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 abstract-btn">{isSubmitting ? 'सुरक्षित हो रहा है...' : 'सुरक्षित करें'}</button>
      </div>
     </div>
   </div>
  );
};

const TripDetailModal = ({ trip, khands, mandals, villages, contacts, ideas, onBack, onEdit, onUpdate, onLogVisit, whatsappMessage }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'ideas' | 'notes'>('schedule');
  const timelineRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    item: any;
    currentY: number;
    timeStr: string;
  } | null>(null);

  // Use refs for dragging values to ensure handlers always have the latest data and avoid closure stalls
  const dragValuesRef = useRef({
    isDragging: false,
    item: null as any,
    timeStr: '09:00',
    currentY: 0
  });

  const schedule = trip.schedule || [];
  const scheduleRef = useRef(schedule);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    scheduleRef.current = schedule;
    onUpdateRef.current = onUpdate;
  }, [schedule, onUpdate]);

  useEffect(() => {
    dragValuesRef.current.isDragging = !!dragState;
    if (dragState) {
      dragValuesRef.current.item = dragState.item;
      dragValuesRef.current.timeStr = dragState.timeStr;
      dragValuesRef.current.currentY = dragState.currentY;
    }
  }, [dragState]);

  const relevantIdeas = useMemo(() => {
    return ideas.filter((idea: Idea) => 
      !idea.isCompleted && 
      (idea.mandalId === trip.mandalId || 
       (idea.villageId && trip.villageIds.includes(idea.villageId)) || 
       (idea.contactId && trip.peopleIds.includes(idea.contactId)))
    );
  }, [trip, ideas]);

  const khandName = khands.find((k:any)=>k.id===trip.khandId)?.name;
  const mandalName = mandals.find((m:any)=>m.id===trip.mandalId)?.name;

  const getVillageName = (id: string) => villages.find((v:any)=>v.id===id)?.name || 'अज्ञात गांव';
  const getMandalName = (id: string) => mandals.find((m:any)=>m.id===id)?.name || 'अज्ञात मंडल';

  const removeSlot = (id: string) => {
    onUpdate({ schedule: schedule.filter((s:any) => s.id !== id) });
  };

  const unscheduledContacts = useMemo(() => {
    const scheduledIds = schedule.map((s:any) => s.contactId).filter(Boolean);
    const scheduledVillageIds = schedule.map((s:any) => s.villageId).filter(v => !schedule.find((x:any)=>x.contactId && x.villageId === v));

    const result: any[] = [];
    
    trip.peopleIds.forEach((pid: string) => {
      if (!scheduledIds.includes(pid)) {
        const c = contacts.find((x:any)=>x.id===pid);
        if (c) result.push({ type: 'contact', contactId: c.id, title: c.name, subtitle: getVillageName(c.villageId), villageId: c.villageId });
      }
    });

    return result;
  }, [trip, schedule, contacts, villages]);

  const isToday = trip.date === new Date().toISOString().split('T')[0];
  const nowTime = new Date();
  const currentFormattedTime = `${nowTime.getHours() % 12 || 12}:${nowTime.getMinutes().toString().padStart(2, '0')} ${nowTime.getHours() >= 12 ? 'PM' : 'AM'}`;
  const currentTimeString = `${nowTime.getHours().toString().padStart(2, '0')}:${nowTime.getMinutes().toString().padStart(2, '0')}`;

  const displaySchedule = [...schedule];
  if (isToday && schedule.length > 0) {
     displaySchedule.push({ id: 'now', time: currentTimeString, isNow: true } as any);
  }
  displaySchedule.sort((a, b) => a.time.localeCompare(b.time));

  const groupedSchedule: any[] = [];
  let currentGroup: any = null;
  
  displaySchedule.forEach((item: any, idx: number) => {
    if (item.isNow) {
      if (currentGroup) {
        currentGroup.items.push(item);
      } else {
        groupedSchedule.push({ type: 'now', item });
      }
    } else {
      if (!currentGroup) {
        currentGroup = { type: 'village', villageId: item.villageId, items: [item], id: `group_${item.villageId}_${item.id}` };
      } else if (currentGroup.villageId === item.villageId) {
        currentGroup.items.push(item);
      } else {
        groupedSchedule.push(currentGroup);
        currentGroup = { type: 'village', villageId: item.villageId, items: [item], id: `group_${item.villageId}_${item.id}` };
      }
    }
  });
  if (currentGroup) {
    groupedSchedule.push(currentGroup);
  }

  const startDrag = (e: React.PointerEvent, item: any) => {
    e.preventDefault();
    const initialDrag = {
      isDragging: true,
      item,
      currentY: e.clientY,
      timeStr: item.time || '09:00'
    };
    dragValuesRef.current = { ...initialDrag };
    setDragState(initialDrag);
  };

  useEffect(() => {
    if (!dragState) return;

    const handleMove = (e: PointerEvent) => {
      if (!timelineRef.current) return;
      const rect = timelineRef.current.getBoundingClientRect();
      const relativeY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
      
      const totalMinutes = 17 * 60; // 5AM to 10PM (17 hours)
      const minutes = Math.round(relativeY * totalMinutes);
      const h = Math.floor(minutes / 60) + 5;
      const m = Math.floor((minutes % 60) / 15) * 15;
      
      const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      dragValuesRef.current.currentY = e.clientY;
      dragValuesRef.current.timeStr = timeStr;
      setDragState(prev => prev ? { ...prev, currentY: e.clientY, timeStr } : null);
    };

    const handleUp = (e: PointerEvent) => {
      const currentDrag = dragValuesRef.current;
      if (currentDrag.isDragging) {
        const newSlot = {
          id: currentDrag.item.slotId || `slot_${Date.now()}`,
          time: currentDrag.timeStr,
          contactId: currentDrag.item.contactId,
          villageId: currentDrag.item.villageId
        };

        const otherSlots = (scheduleRef.current || []).filter((s:any) => s.id !== newSlot.id);
        onUpdateRef.current({ 
          schedule: [...otherSlots, newSlot].sort((a, b) => a.time.localeCompare(b.time)) 
        });
      }
      setDragState(null);
      dragValuesRef.current.isDragging = false;
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [!!dragState]);

  return (
   <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl overflow-hidden w-full lg:max-w-5xl lg:mx-auto lg:my-auto lg:h-[90vh] lg:rounded-2xl lg:shadow-2xl lg:border lg:border-white/20"
    >
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 dark:border-gray-800 p-3 lg:p-4 shrink-0 z-20 flex items-center justify-between shadow-sm">
       <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg active:scale-90 transition-transform"><ArrowLeft size={16} className="dark:text-white"/></button>
          <div className="min-w-0">
             <h2 className="text-lg font-bold dark:text-white tracking-tight leading-normal">प्रवास विवरण</h2>
             <div className="text-sm font-medium text-gray-500 leading-normal mt-1" style={{fontFamily: "inherit"}}>{mandalName} मण्डल</div>
          </div>
       </div>
       <div className="flex gap-1">
           <button onClick={onEdit} className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg active:scale-90 transition-all"><Edit2 size={14}/></button>
           <button className="p-1.5 bg-orange-500/10 text-orange-600 rounded-lg active:scale-90 transition-all"><Rocket size={14}/></button>
       </div>
     </header>

     <div className="bg-white/90 dark:bg-[#080d19]/90 backdrop-blur-md border-b dark:border-gray-800 flex p-1 z-10 sticky top-[49px]">
       <button onClick={() => setActiveSubTab('schedule')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'schedule' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400'}`}>
         <Clock size={10}/> अनुसूची
       </button>
       <button onClick={() => setActiveSubTab('ideas')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'ideas' ? 'bg-orange-600 text-white shadow-md' : 'text-gray-400'}`}>
         <Lightbulb size={10}/> विचार {relevantIdeas.length > 0 &&<span className="bg-orange-500 text-[9px] px-1 rounded-full text-white">{relevantIdeas.length}</span>}
       </button>
       <button onClick={() => setActiveSubTab('notes')} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-tighter rounded-lg transition-all flex items-center justify-center gap-1.5 ${activeSubTab === 'notes' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400'}`}>
         <FileText size={10}/> टिप्पणी
       </button>
     </div>

     <div className="flex-1 overflow-y-auto p-2.5 md:p-6 space-y-4 relative z-10 pb-32 no-scrollbar">
        {activeSubTab === 'schedule' && (
         <>
           <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded-lg border border-blue-100 dark:border-blue-800/40 space-y-1 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-6 bg-blue-500/5 rounded-full -mr-4 -mt-4 group-hover:scale-110 transition-transform duration-700" />
              <div className="text-xs font-medium text-blue-500 uppercase tracking-widest">दिनांक और स्थान</div>
              <div className="space-y-0.5">
                <div className="text-[12px] font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2 uppercase tracking-tight">
                   {new Date(trip.date).toLocaleDateString('hi-IN', { dateStyle: 'long' })}
                </div>
                <div className="text-sm font-medium dark:text-white flex items-center gap-1 tracking-tight">
                  <MapPin size={12} className="text-blue-500"/> {mandalName} मण्डल • {khandName}
                </div>
              </div>
           </motion.div>

           <div className="space-y-2">
               <div className="flex justify-between items-center px-1">
                 <h3 className="font-bold dark:text-white text-base tracking-tighter uppercase">नियोजित अनुसूची</h3>
               </div>

                {schedule.length === 0 ? (
                 <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-gray-50/50 dark:bg-gray-800/20 p-6 rounded-xl border-2 border-dashed dark:border-gray-700/50 text-center space-y-2"
                  >
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto shadow-inner"><Clock className="text-gray-400" size={16}/></div>
                    <p className="text-sm font-medium text-gray-500">अभी कोई समय निर्धारित नहीं है।</p>
                    <p className="text-xs uppercase font-medium text-gray-400 tracking-widest ">नीचे से कार्ड यहाँ खींचे</p>
                 </motion.div>
                ) : (
                 <div className="relative pl-[4.5rem] pr-2 space-y-3 py-1">
                   <div className="absolute left-[3.5rem] top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-gray-800/50 rounded-full"></div>
                    
                   <AnimatePresence mode="popLayout">
                    {groupedSchedule.map((group: any) => {
                       if (group.type === 'now') {
                          const item = group.item;
                          return (
                           <motion.div 
                              layout
                              key="now" 
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="relative flex items-center h-4 my-2"
                            >
                             <div className="absolute left-[-4.5rem] w-[52px] pr-2 text-right">
                                <span className="text-xs whitespace-nowrap font-medium text-red-500 uppercase z-20 relative">{formatTime(item.time)}</span>
                             </div>
                             <div className="absolute left-[-19px] w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#070b14] z-20 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                             <div className="absolute left-[-15px] right-0 h-px bg-red-500/50 dark:bg-red-500/30 flex items-center z-10">
                                <span className="text-red-500 bg-slate-50 dark:bg-[#070b14] px-1 ml-6 uppercase">अभी</span>
                             </div>
                           </motion.div>
                          );
                       }

                       return (
                       <motion.div 
                          layout
                          key={group.id} 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="relative mb-3 last:mb-0"
                        >
                         <div className="bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-xl border border-white/50 border-t-white/80 shadow-sm rounded-lg dark:border-gray-700/50 relative transition-all hover:shadow-md">
                            <div className="text-sm font-medium text-indigo-500 uppercase tracking-widest px-3 pt-2 pb-1.5 bg-white/40 dark:bg-black/20 rounded-t-lg border-b border-white/50 dark:border-gray-700/50 flex items-center gap-1.5">
                               <MapPin size={10} className="text-indigo-400" />
                                {getVillageName(group.villageId)}
                            </div>
                             
                            <div className="flex flex-col">
                               {group.items.map((item: any) => {
                                 if (item.isNow) {
                                   return (
                                    <motion.div 
                                       layout
                                       key="now" 
                                       initial={{ opacity: 0, scale: 0.8 }}
                                       animate={{ opacity: 1, scale: 1 }}
                                       className="relative flex items-center h-4 my-2 border-b border-transparent last:border-0 z-20"
                                     >
                                      <div className="absolute left-[calc(-4.5rem-2px)] w-[52px] pr-2 text-right">
                                         <span className="text-xs whitespace-nowrap font-medium text-red-500 uppercase z-20 relative">{formatTime(item.time)}</span>
                                      </div>
                                      <div className="absolute left-[calc(-19px-2px)] w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#070b14] z-20 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div>
                                      <div className="absolute left-[-15px] right-[-12px] h-px bg-red-500/80 flex items-center z-10 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                                         <span className="text-red-500 bg-white dark:bg-[#070b14] px-1.5 ml-8 uppercase rounded-full shadow-sm">अभी</span>
                                      </div>
                                    </motion.div>
                                   );
                                 }

                                 const contact = contacts.find((c: any) => c.id === item.contactId);
                                 return (
                                  <div key={item.id} className="relative group/slot min-h-[56px] flex flex-col justify-center p-3 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                     <div className="absolute left-[-4.5rem] top-1/2 -translate-y-1/2 w-[52px] pr-2 text-right">
                                        <div className="text-xs whitespace-nowrap font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{formatTime(item.time)}</div>
                                     </div>
                                     <div className="absolute left-[-19px] top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white dark:ring-[#070b14] z-10 outline outline-1 outline-blue-100 dark:outline-blue-900/50 transition-transform group-hover/slot:scale-125"></div>
                                      
                                     <div className="absolute right-2 top-2 flex gap-1.5 text-gray-400 z-10 opacity-0 group-hover/slot:opacity-100 transition-opacity">
                                        <GripVertical 
                                             size={14} 
                                             style={{ touchAction: 'none' }}
                                             className="cursor-grab active:cursor-grabbing hover:text-gray-600 dark:hover:text-gray-300 transition-colors select-none" 
                                             onPointerDown={(e) => startDrag(e, { ...item, isSlot: true, slotId: item.id, title: contact?.name || getVillageName(item.villageId) })}
                                         />
                                        <button onClick={() => removeSlot(item.id)} className="hover:text-red-500 active:scale-90 transition-all"><Trash2 size={14}/></button>
                                     </div>
                                      {item.contactId ? (
                                       <div className="space-y-2 w-full pr-8">
                                           <div className="flex items-center gap-2">
                                             <div className="w-8 h-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center font-medium text-xs shadow-sm shrink-0 border border-white dark:border-gray-700/50">{contact?.name[0]}</div>
                                             <div className="flex-1 min-w-[100px] cursor-pointer group/name" onClick={() => onLogVisit(item.contactId)}>
                                               <div className="text-base font-medium dark:text-white group-hover/name:text-blue-500 transition-colors uppercase truncate tracking-tight font-hindi">{contact?.name} ({getVillageName(contact?.villageId)})</div>
                                             </div>
                                              {contact?.phone && (
                                               <div className="flex items-center gap-1.5 flex-none shrink-0">
                                                 <a href={`tel:${contact.phone}`} onClick={e => e.stopPropagation()} className="p-1.5 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg active:scale-90 transition-all hover:bg-green-100 dark:hover:bg-green-900/50 shadow-sm shrink-0 flex items-center justify-center">
                                                   <Phone size={12}/>
                                                 </a>
                                                 <a href={`https://wa.me/${contact.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappMessage)}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 bg-[#25D366]/10 text-[#25D366] rounded-lg active:scale-90 transition-all hover:bg-[#25D366]/20 shadow-sm shrink-0 flex items-center justify-center">
                                                   <WhatsappIcon size={12}/>
                                                 </a>
                                               </div>
                                              )}
                                           </div>
                                       </div>
                                      ) : (
                                       <div className="text-[11px] font-medium dark:text-gray-400 py-1 uppercase tracking-widest flex items-center gap-1.5">
                                         <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                          ग्राम भ्रमण
                                       </div>
                                      )}
                                  </div>
                                 );
                               })}
                            </div>
                         </div>
                       </motion.div>
                       );
                    })}
                   </AnimatePresence>
                 </div>
                )}
           </div>

            {unscheduledContacts.length > 0 && (
             <div className="space-y-2 pt-4 border-t dark:border-gray-800/50">
               <div className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-2 flex justify-between items-center">
                 <span>निर्धारित नहीं (खींचें)</span>
                 <span className="text-[9px] bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full font-medium">{unscheduledContacts.length} शेष</span>
               </div>
               <div className="flex flex-wrap gap-1.5">
                    {unscheduledContacts.map((c: any) => (
                     <motion.div 
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        key={c.contactId || c.villageId} 
                        style={{ touchAction: 'none' }}
                        className="bg-white/60 dark:bg-[#0b1221]/60 backdrop-blur-xl border border-white/50 border-t-white/80 shadow-sm px-2.5 py-1 rounded-lg border dark:border-gray-700/50 flex items-center gap-2 group cursor-move hover:border-indigo-400 dark:hover:border-indigo-500/50 transition-colors select-none"
                        onPointerDown={(e) => startDrag(e, c)}
                      >
                       <div className="flex flex-col">
                         <span className="text-xs font-medium dark:text-gray-200 uppercase tracking-tight">{c.title}</span>
                         <span className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">{c.subtitle}</span>
                       </div>
                       <GripVertical 
                            size={10} 
                            className="opacity-20 group-hover:opacity-100 transition-opacity text-gray-400 shrink-0" 
                        />
                     </motion.div>
                    ))}
               </div>
             </div>
            )}
         </>
        )}

        {activeSubTab === 'ideas' && (
         <div className="space-y-4 pt-2">
            <div className="text-base font-medium text-orange-500 uppercase tracking-widest px-1 flex items-center gap-2">
               <Lightbulb size={14}/> मण्डल/गांव से जुड़े विचार ({relevantIdeas.length})
            </div>
             {relevantIdeas.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-800/50 rounded-2xl border border-dashed dark:border-gray-700">
                <p className="text-sm font-medium text-gray-400">कोई जुड़ा हुआ विचार नहीं मिला</p>
              </div>
             ) : (
              <div className="space-y-3">
                 {relevantIdeas.map((idea: Idea) => (
                  <div key={idea.id} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] p-5 rounded-2xl border dark:border-gray-700 flex items-start gap-4">
                     <div className="p-3 bg-orange-100 dark:bg-orange-900/40 text-orange-600 rounded-xl shrink-0">
                       <Lightbulb size={18}/>
                     </div>
                     <div className="flex-1">
                       <div className="text-base font-medium text-gray-800 dark:text-gray-200 leading-relaxed">{idea.content}</div>
                       <div className="text-[9px] font-medium uppercase text-gray-400 mt-3 flex items-center gap-1.5">
                         <MapPin size={10}/> {idea.villageId ? getVillageName(idea.villageId) : getMandalName(idea.mandalId as string)}
                       </div>
                     </div>
                  </div>
                 ))}
              </div>
             )}
         </div>
        )}

        {activeSubTab === 'notes' && (
         <div className="space-y-4 pt-2">
            <div className="text-sm font-medium text-emerald-500 uppercase tracking-widest px-1 flex items-center gap-2">
               <FileText size={14}/> योजना विवरण और टिप्पणी
            </div>
             {trip.notes ? (
               <div className="p-6 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05)] rounded-2xl text-base whitespace-pre-wrap font-medium leading-relaxed dark:text-gray-200 border dark:border-gray-700">
                  {trip.notes}
               </div>
             ) : (
               <div className="p-12 text-center bg-white/40 dark:bg-gray-800/50 rounded-2xl border border-dashed dark:border-gray-700">
                 <p className="text-sm font-medium text-gray-400">कोई विस्तृत विवरण नहीं जोड़ा गया है।</p>
               </div>
             )}
             
            <button onClick={onEdit} className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-900/30 font-medium text-sm uppercase flex items-center justify-center gap-2">
              <Edit2 size={16}/> टिप्पणी संपादित करें
            </button>
         </div>
        )}
     </div>

     <AnimatePresence>
      {dragState?.isDragging && (
       <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md flex"
        >
           <div ref={timelineRef} className="absolute top-[10%] bottom-[10%] left-[3.5rem] w-0.5 bg-gray-200 dark:bg-gray-700 rounded-full shadow-[inset_0_0_4px_rgba(0,0,0,0.1)] z-10">
               {Array.from({length: 18}).map((_, i) => {
                  const h = i + 5;
                  const ampm = h >= 12 ? 'PM' : 'AM';
                  const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
                  return (
                   <div key={i} className="absolute left-0 -translate-y-1/2 flex items-center" style={{ top: `${(i/17)*100}%` }}>
                      <div className="w-2 h-0.5 ml-[-4px] bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                      <span className="absolute right-[12px] text-xs font-medium text-gray-400 dark:text-gray-500 whitespace-nowrap tracking-wider text-right min-w-[50px]">
                         {`${h12}:00 ${ampm}`}
                      </span>
                   </div>
                  );
               })}
           </div>
            
           <div className="absolute left-[3.5rem] right-0 h-px pointer-events-none" style={{ top: dragState.currentY, transform: 'translateY(-50%)', zIndex: 50 }}>
              <div className="absolute top-1/2 left-0 h-1 w-[calc(100%-4.5rem)] max-w-md bg-gradient-to-r from-orange-500 to-transparent -translate-y-1/2 flex items-center shadow-[0_0_12px_rgba(249,115,22,0.6)]">
                 <div className="w-4 h-4 bg-orange-500 rounded-full ring-4 ring-white dark:ring-gray-900 border-2 border-white dark:border-gray-800 -ml-2 shadow-lg animate-pulse"></div>
                 <div className="absolute right-[100%] mr-[15px] px-3 py-1 bg-orange-500 text-white text-xs font-medium rounded-full shadow-lg shadow-orange-500/30 uppercase tracking-widest whitespace-nowrap">
                    {formatTime(dragState.timeStr)}
                 </div>
              </div>
           </div>

           <motion.div 
               layoutId="dragOverlay"
               className="absolute left-[4.5rem] right-2 max-w-md bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-4 rounded-xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] pointer-events-none flex items-center justify-between z-[100] ring-2 ring-white/30" 
               style={{ top: dragState.currentY, transform: 'translateY(-50%)' }}
            >
              <div className="min-w-0">
                  <div className="text-[10px] font-medium opacity-70 mb-1 tracking-widest uppercase flex items-center gap-2">
                      <Clock size={10}/> निर्धारित समय
                  </div>
                  <div className="font-bold text-lg leading-snug tracking-tighter truncate pr-4 uppercase">{dragState.item.title}</div>
                   {dragState.item.subtitle &&<div className="text-indigo-100 text-[11px] font-medium opacity-80 mt-1 truncate uppercase tracking-widest">{dragState.item.subtitle}</div>}
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <GripVertical size={20} className="opacity-80" />
              </div>
           </motion.div>
       </motion.div>
      )}
     </AnimatePresence>
   </motion.div>
  );
};

const CatMgmt = ({ categories, setCategories, onBack, setConfirmation, title = "श्रेणी प्रबंधन" }: any) => {
   const [newCat, setNewCat] = useState('');
   const [newIcon, setNewIcon] = useState('User');
   const [isPickingIcon, setIsPickingIcon] = useState(false);
   const [editId, setEditId] = useState<string | null>(null);

   return (
     <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
        <header className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm border dark:border-gray-700 active:scale-90"><ArrowLeft size={20} className="dark:text-white"/></button>
           <h2 className="text-xl font-bold dark:text-white">{title}</h2>
        </header>
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-5 rounded-md border dark:border-gray-700 space-y-4 shadow-sm">
           <div className="space-y-3">
              <div className="flex gap-2">
                 <div className="flex-1 space-y-1">
                   <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">नाम</label>
                   <input 
                      className="w-full bg-gray-50 dark:bg-gray-900 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700" 
                      placeholder="नाम लिखें..." 
                      value={newCat} 
                      onChange={e=>setNewCat(e.target.value)}
                    />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">आइकॉन</label>
                   <button 
                      onClick={() => setIsPickingIcon(true)}
                      className="p-4 bg-gray-50 dark:bg-gray-900 text-blue-600 rounded-sm border dark:border-gray-700 active:scale-95 transition-all flex items-center justify-center min-w-[60px]"
                    >
                     <LucideIcon name={newIcon} size={24} />
                   </button>
                 </div>
              </div>
              <button 
                onClick={()=>{
                  if(newCat){
                    if (editId) {
                      setCategories(categories.map((c: any) => c.id === editId ? { ...c, name: newCat, icon: newIcon } : c));
                      setEditId(null);
                    } else {
                      setCategories([...categories, { id: `cat_${Date.now()}`, name: newCat, icon: newIcon }]); 
                    }
                    setNewCat('');
                    setNewIcon('User');
                  }
                }} 
                className={`w-full p-4 text-white rounded-sm font-medium active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${editId ? 'bg-orange-600 shadow-orange-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}
               >
                 {editId ?<Edit2 size={20} /> :<Plus size={20} />} {editId ? 'सुधारें' : 'जोड़ें'}
              </button>
               {editId && (
                <button 
                  onClick={() => { setEditId(null); setNewCat(''); setNewIcon('User'); }}
                  className="w-full p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-sm font-medium active:scale-95 transition-all"
                 >
                   रद्द करें
                </button>
               )}
           </div>

           <div className="pt-4 border-t dark:border-gray-700 space-y-2">
              <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">मौजूदा श्रेणियां</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                 {categories.map((c: any) => (
                   <div key={c.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-900 rounded-md border dark:border-gray-700">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm text-blue-600 dark:text-blue-400 shadow-sm border dark:border-gray-700">
                           <LucideIcon name={c.icon} size={18} />
                         </div>
                         <span className="font-medium dark:text-white">{c.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={()=>{
                            setEditId(c.id);
                            setNewCat(c.name);
                            setNewIcon(c.icon);
                          }} 
                          className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-sm transition-all active:scale-90"
                         >
                          <Edit2 size={16}/>
                        </button>
                        <button 
                          onClick={()=>{
                            setConfirmation({
                              title: 'श्रेणी हटाएं?',
                              message: `क्या आप '${c.name}' श्रेणी को हटाना चाहते हैं?`,
                              onConfirm: () => {
                                setCategories(categories.filter((x: any)=>x.id!==c.id));
                                setConfirmation(null);
                                if(editId === c.id) {
                                  setEditId(null);
                                  setNewCat('');
                                  setNewIcon('User');
                                }
                              }
                            });
                          }} 
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-sm transition-all active:scale-90"
                         >
                          <Trash2 size={16}/>
                        </button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

         {isPickingIcon && (
          <IconPicker 
             currentIcon={newIcon}
             onSelect={(icon) => { setNewIcon(icon); setIsPickingIcon(false); }}
             onClose={() => setIsPickingIcon(false)}
           />
         )}
     </div>
   );
};

const SettingsTab = ({ 
  darkMode, setDarkMode, 
  appTheme, setAppTheme, 
  appFont, setAppFont, 
  appFontSize, setAppFontSize,
  whatsappMessage, setWhatsappMessage,
  setActiveTab, 
  exportData, importData, generateVolunteerTemplate, volunteerExcelInputRef, handleImportExcel, resetAllData, clearAllKaryas 
}: any) => (
 <div className="p-4 pb-24 space-y-6 animate-in slide-in-from-right duration-300">
    <header className="flex items-center gap-4">
       <button onClick={() => setActiveTab('menu')} className="p-2 bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm border dark:border-gray-700 active:scale-90">
          <ArrowLeft size={20} className="dark:text-white"/>
       </button>
       <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-400 tracking-tight">सेटिंग्स</h1>
    </header>

    <div className="space-y-4">
       {/* Visual & Theme Category */}
      <div>
        <h2 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded inline-block mb-2 shadow-sm border border-indigo-100 dark:border-indigo-800/30">दिखावट और थीम</h2>
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm text-sm">
          <div className="p-3 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/20">
             <div className="flex items-center gap-3 text-indigo-600"><Moon size={18}/><span className="font-medium dark:text-gray-200">डार्क मोड</span></div>
             <button onClick={()=>setDarkMode(!darkMode)} className={`w-10 h-5 rounded-full relative transition-all ${darkMode?'bg-indigo-600':'bg-gray-300'}`}><div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-all ${darkMode?'left-6':'left-0.5'}`}/></button>
          </div>
           
          <div className="p-3 space-y-3 border-t dark:border-gray-700">
             <div className="flex items-center gap-3 text-pink-600"><Palette size={18}/><span className="font-medium dark:text-gray-200">स्टाइल्स एवं थीम</span></div>
             <div className="grid grid-cols-3 gap-3">
                <button onClick={()=>setAppTheme('default')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'default' ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/30 ring-2 ring-blue-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-blue-600"/><div className="w-3 h-3 rounded-full bg-orange-500"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">डिफ़ॉल्ट</span>
                </button>
                <button onClick={()=>setAppTheme('nature')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'nature' ? 'border-green-600 bg-green-50 dark:bg-green-900/30 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"/><div className="w-3 h-3 rounded-full bg-amber-500"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">प्रकृति</span>
                </button>
                <button onClick={()=>setAppTheme('rose')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'rose' ? 'border-rose-600 bg-rose-50 dark:bg-rose-900/30 ring-2 ring-rose-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-rose-600"/><div className="w-3 h-3 rounded-full bg-purple-500"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">रोज़</span>
                </button>
                <button onClick={()=>setAppTheme('ocean')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'ocean' ? 'border-sky-600 bg-sky-50 dark:bg-sky-900/30 ring-2 ring-sky-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-sky-500"/><div className="w-3 h-3 rounded-full bg-cyan-500"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">ओशन</span>
                </button>
                <button onClick={()=>setAppTheme('sunset')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'sunset' ? 'border-red-600 bg-red-50 dark:bg-red-900/30 ring-2 ring-red-500/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-red-500"/><div className="w-3 h-3 rounded-full bg-orange-400"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">सनसेट</span>
                </button>
                <button onClick={()=>setAppTheme('monochrome')} className={`p-2 rounded-sm border flex flex-col items-center gap-1.5 transition-all ${appTheme === 'monochrome' ? 'border-gray-600 bg-gray-100 dark:bg-gray-800 ring-2 ring-gray-400/20' : 'border-gray-200 dark:border-gray-700'}`}>
                   <div className="flex gap-1"><div className="w-3 h-3 rounded-full bg-slate-600"/><div className="w-3 h-3 rounded-full bg-zinc-500"/></div>
                   <span className="text-[10px] font-medium dark:text-gray-300">ग्रेस्केल</span>
                </button>
             </div>
          </div>

          <div className="p-3 space-y-3 border-t dark:border-gray-700">
             <div className="flex items-center gap-3 text-emerald-600"><Type size={18}/><span className="font-medium dark:text-gray-200">फ़ॉन्ट</span></div>
             <div className="flex overflow-x-auto pb-2 -mx-3 px-3 gap-2 snap-x scrollbar-hide text-xs">
                <button onClick={()=>setAppFont('baloo')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'baloo' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: '"Baloo 2", sans-serif'}}>Baloo</button>
                <button onClick={()=>setAppFont('tiro')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'tiro' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: '"Tiro Devanagari Hindi", serif'}}>Tiro Hindi</button>
                <button onClick={()=>setAppFont('mukta')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'mukta' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Mukta, sans-serif'}}>Mukta</button>
                <button onClick={()=>setAppFont('noto-sans')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'noto-sans' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: '"Noto Sans Devanagari", sans-serif'}}>Noto Sans</button>
                <button onClick={()=>setAppFont('yatra')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'yatra' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: '"Yatra One", sans-serif'}}>Yatra</button>
                <button onClick={()=>setAppFont('kalam')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'kalam' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Kalam, cursive'}}>Kalam</button>
                <button onClick={()=>setAppFont('amita')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'amita' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Amita, cursive'}}>Amita</button>
                <button onClick={()=>setAppFont('rajdhani')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'rajdhani' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Rajdhani, sans-serif'}}>Rajdhani</button>
                <button onClick={()=>setAppFont('hind')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'hind' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Hind, sans-serif'}}>Hind</button>
                <button onClick={()=>setAppFont('poppins')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'poppins' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Poppins, sans-serif'}}>Poppins</button>
                <button onClick={()=>setAppFont('khula')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'khula' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Khula, sans-serif'}}>Khula</button>
                <button onClick={()=>setAppFont('yantramanav')} className={`snap-start shrink-0 px-3 py-1.5 rounded-sm border transition-all ${appFont === 'yantramanav' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 font-medium' : 'border-gray-200 dark:border-gray-700 dark:text-gray-200 text-gray-700'}`} style={{fontFamily: 'Yantramanav, sans-serif'}}>Yantramanav</button>
             </div>
          </div>

          <div className="p-3 space-y-3 border-t dark:border-gray-700">
             <div className="flex items-center gap-3 text-orange-600"><MessageSquare size={18}/><span className="font-medium dark:text-gray-200">टेक्स्ट का आकार</span></div>
             <div className="flex items-center justify-between gap-1 bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-lg border dark:border-gray-700">
                <button onClick={()=>setAppFontSize(14)} className={`flex-1 py-1.5 text-xs rounded transition-all ${appFontSize === 14 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}`}>छोटा</button>
                <button onClick={()=>setAppFontSize(16)} className={`flex-1 py-1.5 text-xs rounded transition-all ${appFontSize === 16 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}`}>सामान्य</button>
                <button onClick={()=>setAppFontSize(18)} className={`flex-1 py-1.5 text-xs rounded transition-all ${appFontSize === 18 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}`}>बड़ा</button>
                <button onClick={()=>setAppFontSize(20)} className={`flex-1 py-1.5 text-xs rounded transition-all ${appFontSize === 20 ? 'bg-white dark:bg-gray-700 shadow-sm text-orange-600 font-medium' : 'text-gray-500 font-medium'}`}>विशाल</button>
             </div>
          </div>
        </div>
      </div>

       {/* App Preferences Category */}
      <div>
        <h2 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded inline-block mb-2 shadow-sm border border-indigo-100 dark:border-indigo-800/30">प्राथमिकताएं</h2>
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm text-sm">
          <div className="p-3 space-y-2">
            <div className="flex items-center gap-3 text-[#25D366]"><WhatsappIcon size={18}/><span className="font-medium dark:text-gray-200">WhatsApp संदेश</span></div>
            <textarea rows={3} value={whatsappMessage}
               onChange={(e) => setWhatsappMessage(e.target.value)}
               placeholder="डिफ़ॉल्ट संदेश..."
               className="w-full p-2 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 rounded flex outline-none font-medium text-xs resize-none"
             ></textarea>
          </div>
           
          <button onClick={()=>setActiveTab('cat-mgmt')} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all border-t dark:border-gray-700">
            <div className="flex items-center gap-3 text-orange-600"><Tag size={18}/><span className="font-medium dark:text-gray-200">संपर्क श्रेणी प्रबंधन</span></div>
            <ChevronRight size={16} className="text-gray-400"/>
          </button>
          <button onClick={()=>setActiveTab('event-cat-mgmt')} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all border-t dark:border-gray-700">
            <div className="flex items-center gap-3 text-purple-600"><Flag size={18}/><span className="font-medium dark:text-gray-200">कार्यक्रम श्रेणी प्रबंधन</span></div>
            <ChevronRight size={16} className="text-gray-400"/>
          </button>
          <button onClick={()=>setActiveTab('list-cat-mgmt')} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all border-t dark:border-gray-700">
            <div className="flex items-center gap-3 text-indigo-600"><Layers size={18}/><span className="font-medium dark:text-gray-200 font-hindi">सूची श्रेणी प्रबंधन</span></div>
            <ChevronRight size={16} className="text-gray-400"/>
          </button>
        </div>
      </div>

       {/* Data & Backup Category */}
      <div>
        <h2 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded inline-block mb-2 shadow-sm border border-indigo-100 dark:border-indigo-800/30">डेटा और सिस्टम</h2>
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm text-sm">
          <button onClick={exportData} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40"><div className="flex items-center gap-3 text-green-600"><Download size={18}/><span className="font-medium dark:text-gray-200">बैकअप (JSON)</span></div></button>
          <button onClick={importData} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 border-t dark:border-gray-700"><div className="flex items-center gap-3 text-blue-600"><Upload size={18}/><span className="font-medium dark:text-gray-200">डेटा रिस्टोर</span></div></button>
          <button onClick={clearAllKaryas} className="w-full p-3 flex justify-between items-center text-orange-600 active:bg-orange-50 dark:active:bg-orange-900/10 transition-all border-t dark:border-gray-700"><div className="flex items-center gap-3"><Trash2 size={18}/><span className="font-medium">सभी शाखा/मिलन हटाएं</span></div></button>
          <button onClick={resetAllData} className="w-full p-3 flex justify-between items-center text-red-600 active:bg-red-50 dark:active:bg-red-900/10 transition-all border-t dark:border-gray-700"><div className="flex items-center gap-3"><RotateCcw size={18}/><span className="font-medium">ऐप रिसेट करें</span></div></button>
        </div>
      </div>

      {/* Volunteer Data Management Category */}
      <div>
        <h2 className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded inline-block mb-2 shadow-sm border border-indigo-100 dark:border-indigo-800/30">स्वयंसेवक डेटा आयात</h2>
        <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md border dark:border-gray-700 overflow-hidden divide-y dark:divide-gray-700 shadow-sm text-sm">
          <button onClick={generateVolunteerTemplate} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 transition-all">
            <div className="flex items-center gap-3 text-green-600"><FileText size={18}/><span className="font-medium dark:text-gray-200">टेम्पलेट डाउनलोड करें</span></div>
            <ChevronRight size={16} className="text-gray-400"/>
          </button>
          <button onClick={() => volunteerExcelInputRef.current?.click()} className="w-full p-3 flex justify-between items-center active:bg-gray-50 dark:active:bg-gray-900/40 border-t dark:border-gray-700 transition-all">
            <div className="flex items-center gap-3 text-blue-600"><Upload size={18}/><span className="font-medium dark:text-gray-200">एक्सेल डेटा इम्पोर्ट करें</span></div>
            <ChevronRight size={16} className="text-gray-400"/>
          </button>
          <input type="file" ref={volunteerExcelInputRef} onChange={handleImportExcel} accept=".xlsx, .xls" className="hidden" />
        </div>
        <p className="p-2 text-[10px] text-gray-500 font-medium italic">नया डेटा जोड़ने के लिए एक्सेल टेम्पलेट का उपयोग करें।</p>
      </div>
    </div>
 </div>
);

const Ripple = ({ x, y, onComplete }: { x: number; y: number; onComplete: () => void }) => (
  <motion.span
    initial={{ scale: 0, opacity: 0.5 }}
    animate={{ scale: 4, opacity: 0 }}
    onAnimationComplete={onComplete}
    style={{ left: x, top: y }}
    className="absolute w-10 h-10 bg-white/40 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
  />
);

const GridMenuItem = ({ icon: Icon, label, color, onClick, delay = 0, variant = "square" }: any) => {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRipples(prev => [...prev, { id: Date.now(), x, y }]);
    setTimeout(() => onClick(), 200);
  };

  const getVariantStyles = () => {
    switch(variant) {
      case 'wide': return "col-span-2 aspect-[2.5/1]";
      default: return "col-span-1 aspect-square";
    }
  };

  return (
    <motion.button
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 350, 
        damping: 25, 
        delay: delay * 0.02 
      }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`relative group flex flex-col items-center justify-center p-3 rounded-2xl bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-white/5 shadow-sm active:shadow-inner transition-all overflow-hidden ${getVariantStyles()}`}
    >
      <AnimatePresence>
        {ripples.map(ripple => (
          <Ripple 
            key={ripple.id} 
            x={ripple.x} 
            y={ripple.y} 
            onComplete={() => setRipples(prev => prev.filter(r => r.id !== ripple.id))} 
          />
        ))}
      </AnimatePresence>

      <div className={`p-2 rounded-xl shadow-md ${color} mb-1.5`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
      
      <span className="text-[10px] font-black dark:text-gray-200 text-center leading-tight font-hindi uppercase tracking-tight">
        {label}
      </span>
    </motion.button>
  );
};

const MenuTab = ({ userName, setUserName, appUser, setActiveTab }: any) => {
  return (
    <div className="flex flex-col h-full bg-[#f8fafc] dark:bg-[#020617] overflow-hidden">
      {/* Compact Static Header */}
      <div className="p-4 bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 shadow-sm shrink-0">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center text-white shadow-lg shrink-0">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <input 
                className="bg-transparent font-black text-gray-900 dark:text-gray-100 text-base w-full outline-none placeholder:text-gray-400 font-hindi truncate" 
                value={appUser ? appUser.displayName || appUser.email : userName} 
                onChange={e => setUserName(e.target.value)}
                readOnly={!!appUser}
                placeholder="नमो नमः..."
              />
              <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] leading-none">
                {appUser ? (appUser.roleId ? 'Swayamsevak' : 'No Role Assigned') : 'Guest'}
              </p>
            </div>
          </div>
          <div>
            {appUser ? (
              <button onClick={() => logout()} className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30">
                Log Out
              </button>
            ) : (
              <button onClick={() => signInWithGoogle()} className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg shadow">
                Google Login
              </button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Grid Optimized for Zero Scroll */}
      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-3 gap-3">
          <GridMenuItem 
            delay={0}
            icon={CalendarIcon} 
            label="कार्यक्रम" 
            color="bg-rose-500 text-white"
            onClick={() => setActiveTab('events')} 
          />
          <GridMenuItem 
            delay={1}
            icon={ListIcon} 
            label="समूह" 
            color="bg-indigo-500 text-white"
            onClick={() => setActiveTab('lists')} 
          />
          <GridMenuItem 
            delay={2}
            icon={Rocket} 
            label="प्रवास" 
            color="bg-orange-500 text-white"
            onClick={() => setActiveTab('trips')} 
          />
          <GridMenuItem 
            delay={3}
            icon={Building2} 
            label="संगठन" 
            color="bg-blue-600 text-white"
            onClick={() => setActiveTab('work-status')} 
          />
          <GridMenuItem 
            delay={4}
            icon={MapPin} 
            label="क्षेत्रीय" 
            color="bg-emerald-600 text-white"
            onClick={() => setActiveTab('area-mgmt')} 
          />
          <GridMenuItem 
            delay={5}
            icon={Lightbulb} 
            label="विजन" 
            color="bg-purple-600 text-white"
            onClick={() => setActiveTab('ideas')} 
          />
          
          <GridMenuItem 
            variant="wide"
            delay={6}
            icon={FileText} 
            label="रिपोर्ट्स एवं डेटा" 
            color="bg-pink-600 text-white"
            onClick={() => setActiveTab('reports')} 
          />
          
          <GridMenuItem 
            variant="wide"
            delay={7}
            icon={Settings} 
            label="सेटिंग्स" 
            color="bg-slate-700 text-white"
            onClick={() => setActiveTab('settings')} 
          />
          <GridMenuItem 
            variant="wide"
            delay={8}
            icon={ShieldCheck} 
            label="एडमिन व अधिकार" 
            color="bg-blue-800 text-white"
            onClick={() => setActiveTab('admin')} 
          />
        </div>

        <div className="mt-auto flex flex-col items-center gap-1 opacity-20 py-4">
          <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.3em]">स्मार्ट डैशबोर्ड सिस्टम</p>
        </div>
      </div>
    </div>
  );
};

const PromptModal = ({ title, placeholder, onSubmit, onCancel }: any) => {
   const [val, setVal] = useState('');
   return (
     <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
        <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
           <div className="flex items-center gap-3">
              <button onClick={onCancel} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
              <h2 className="text-xl font-bold dark:text-white tracking-tight">{title}</h2>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 max-w-md mx-auto w-full space-y-6 relative z-10 pt-8">
           <input autoFocus className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-md outline-none font-medium" placeholder={placeholder} value={val} onChange={e=>setVal(e.target.value)} />
           <div className="flex gap-3">
              <button onClick={onCancel} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium rounded-xl active:scale-95 transition-all">रद्द</button>
              <button onClick={()=>onSubmit(val)} className="flex-1 p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all abstract-btn">बनाएं</button>
           </div>
        </div>
     </div>
   );
};

const MeetingFormModal = ({ onClose, onSubmit, eventCategories, ideas, customLists, selectedListId }: any) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState(eventCategories[0]?.name || '');

  const relevantIdeas = useMemo(() => {
    if (!selectedListId) return [];
    const list = customLists.find((l: any) => l.id === selectedListId);
    if (!list) return [];
    return ideas.filter((idea: Idea) => !idea.isCompleted && idea.contactId && list.peopleIds.includes(idea.contactId));
  }, [selectedListId, customLists, ideas]);
  
  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight">नई बैठक/कार्यक्रम</h2>
       </div>
     </header>

     <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-md mx-auto w-full pb-32 relative z-10">
       <div className="space-y-4">
           {relevantIdeas.length > 0 && (
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/40">
              <h3 className="text-[10px] font-bold text-purple-600 uppercase tracking-widest flex items-center gap-2 mb-2"><Lightbulb size={12}/> सदस्यों से जुड़े विचार</h3>
              <div className="space-y-2">
                 {relevantIdeas.map((idea: Idea) => (
                  <div key={idea.id} className="text-xs font-medium dark:text-gray-300">• {idea.content}</div>
                 ))}
              </div>
            </div>
           )}
          <div className="space-y-2">
             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">विषय</label>
             <input className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-md outline-none border dark:border-gray-700 font-medium dark:text-white" placeholder="बैठक का नाम..." value={title} onChange={e=>setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="space-y-2">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">श्रेणी</label>
                <div className="relative">
                   <select className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-md outline-none border dark:border-gray-700 font-medium dark:text-white text-xs appearance-none pl-11" value={category} onChange={e=>setCategory(e.target.value)}>
                       {eventCategories.map((c: any) =><option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-600">
                      <LucideIcon name={eventCategories.find((c:any)=>c.name===category)?.icon || 'Calendar'} size={18} />
                   </div>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">तारीख</label>
                <input type="date" className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-md outline-none border dark:border-gray-700 font-medium dark:text-white text-xs" value={date} onChange={e=>setDate(e.target.value)} />
             </div>
          </div>
           
          <div className="space-y-2">
             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">स्थान</label>
             <input className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-md outline-none border dark:border-gray-700 font-medium dark:text-white" placeholder="कहाँ मिलेगी मंडली?" value={location} onChange={e=>setLocation(e.target.value)} />
          </div>

          <div className="space-y-2">
             <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">विषय विवरण</label>
             <textarea className="w-full bg-gray-50 dark:bg-gray-800 p-4 rounded-md outline-none border dark:border-gray-700 font-medium dark:text-white min-h-[100px]" placeholder="बैठक के मुख्य बिंदु..." value={notes} onChange={e=>setNotes(e.target.value)} />
          </div>
       </div>
       <button 
          onClick={() => {
            if (!title.trim()) {
              alert('कृपया विषय दर्ज करें');
              return;
            }
            if (!date) {
              alert('कृपया तारीख दर्ज करें');
              return;
            }
            onSubmit({ title, date, location, notes, category });
          }} 
          className="w-full p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 abstract-btn" 
          disabled={!title.trim() || !date}
        >
          सुरक्षित करें
       </button>
     </div>
   </div>
  );
};

const VisitLogModal = ({ contactName, initialNotes, initialDate, onClose, onSubmit, isEdit }: any) => {
  const [notes, setNotes] = useState(initialNotes || '');
  const [date, setDate] = useState(initialDate ? initialDate.split('T')[0] : new Date().toISOString().split('T')[0]);
  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight">{contactName} - अनुवर्तन</h2>
       </div>
     </header>
     <div className="flex-1 overflow-y-auto p-6 max-w-sm mx-auto w-full space-y-6 relative z-10 pt-8">
       <div>
          <label className="text-[10px] font-medium text-gray-400 uppercase tracking-widest px-1">तारीख</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 bg-white dark:bg-[#080d19] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 p-4 rounded-xl outline-none font-medium text-sm shadow-sm" />
       </div>
       <textarea placeholder="अनुवर्तन के मुख्य बिंदु लिखें..." className="w-full p-4 bg-white dark:bg-[#080d19] border border-gray-200 dark:border-gray-800 shadow-sm text-gray-800 dark:text-gray-100 min-h-[160px] outline-none font-medium text-sm rounded-xl resize-none" value={notes} onChange={e=>setNotes(e.target.value)} />
       <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium rounded-xl active:scale-95 transition-all">रद्द</button>
          <button disabled={!notes} onClick={()=>onSubmit(notes, new Date(date).toISOString())} className="flex-1 p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 abstract-btn">{isEdit ? 'अपडेट' : 'दर्ज'} करें</button>
       </div>
     </div>
   </div>
  );
};

const ManageListMembersModal = ({ list, contacts, khands, mandals, villages, onClose, onSave }: any) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(list.peopleIds);
  const [search, setSearch] = useState('');
  const [khandFilter, setKhandFilter] = useState('all');
  const [mandalFilter, setMandalFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');

  const filtered = contacts.filter((c: any) => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
    const matchKhand = khandFilter === 'all' || c.khandId === khandFilter;
    const matchMandal = mandalFilter === 'all' || c.mandalId === mandalFilter;
    const matchVillage = villageFilter === 'all' || c.villageId === villageFilter;
    return matchSearch && matchKhand && matchMandal && matchVillage;
  });

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight font-hindi">सदस्य प्रबंधन: {list.name}</h2>
       </div>
     </header>

     <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-md mx-auto w-full pb-32 relative z-10 pt-6">
          <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
                placeholder="नाम या नंबर खोजें..." 
                className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 pl-10 rounded-md outline-none font-medium text-xs" 
                value={search} onChange={e=>setSearch(e.target.value)} 
              />
          </div>
          <div className="grid grid-cols-3 gap-2">
             <select value={khandFilter} onChange={e=>{setKhandFilter(e.target.value); setMandalFilter('all'); setVillageFilter('all');}} className="p-3 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md text-[10px] font-medium outline-none">
               <option value="all">सभी खंड</option>
                {khands.map((k:any)=><option key={k.id} value={k.id}>{k.name}</option>)}
             </select>
             <select value={mandalFilter} disabled={khandFilter === 'all'} onChange={e=>{setMandalFilter(e.target.value); setVillageFilter('all');}} className="p-3 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md text-[10px] font-medium outline-none disabled:opacity-50">
               <option value="all">सभी मंडल</option>
                {mandals.filter((m:any)=>m.khandId===khandFilter).map((m:any)=><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
             <select value={villageFilter} disabled={mandalFilter === 'all'} onChange={e=>setVillageFilter(e.target.value)} className="p-3 bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md text-[10px] font-medium outline-none disabled:opacity-50">
               <option value="all">सभी गाँव</option>
                {villages.filter((v:any)=>v.mandalId===mandalFilter).map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}
             </select>
          </div>
           
          <div className="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar py-2">
           {filtered.map((c: any) => {
              const isSelected = selectedIds.includes(c.id);
              return (
               <button 
                  key={c.id} 
                  onClick={() => toggleSelection(c.id)}
                  className={`w-full p-4 rounded-md flex items-center gap-4 border transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500' : 'bg-gray-50 dark:bg-gray-800 border-transparent dark:border-gray-700'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-medium ${isSelected ? 'bg-blue-600' : 'bg-gray-400'}`}>{c.name[0]}</div>
                  <div className="flex-1 text-left">
                     <div className={`font-medium text-sm font-hindi ${isSelected ? 'text-blue-700 dark:text-blue-400' : 'dark:text-white'}`}>{c.name} ({villages.find((v:any)=>v.id===c.villageId)?.name})</div>
                     <div className="text-[10px] text-gray-400">{villages.find((v:any)=>v.id===c.villageId)?.name}</div>
                  </div>
                   {isSelected &&<CheckCircle2 size={18} className="text-blue-600"/>}
               </button>
              );
           })}
       </div>

       <div className="pt-4 flex gap-4">
          <button onClick={onClose} className="flex-1 p-4 bg-gray-100 dark:bg-gray-800 dark:text-white font-medium rounded-xl active:scale-95 transition-all">रद्द</button>
          <button onClick={() => onSave(selectedIds)} className="flex-1 p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all abstract-btn">चयनित ({selectedIds.length}) सुरक्षित करें</button>
       </div>
     </div>
   </div>
  );
};

// --- Calendar Tab Component ---

// --- Activities Tab Component ---
const ActivitiesTab = ({ 
  trips, 
  contacts, 
  meetings,
  khands,
  mandals,
  villages,
  onContactClick,
  onTripClick,
  onMeetingClick,
  updateHistory,
  updateTripNotes,
  updateMeetingNotes
}: any) => {
  const [filter, setFilter] = useState<'day' | 'week' | 'month' | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'visit' | 'meeting' | 'trip'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const allActivities = useMemo(() => {
    const visits = contacts.flatMap((c: any) => {
      const vName = villages.find((v: any) => v.id === c.villageId)?.name || 'अज्ञात गांव';
      return c.history.map((h: any) => ({ 
        ...h, 
        type: 'visit', 
        contactName: `${c.name} (${vName})`, 
        contactId: c.id,
        location: vName
      }));
    });
    const m = meetings.map((meet: any) => ({ 
      ...meet, 
      type: 'meeting', 
      contactName: `बैठक: ${meet.title}`,
      notes: meet.notes || '' 
    }));
    const t = trips.map((trip: any) => ({ 
      ...trip, 
      type: 'trip', 
      contactName: `प्रवास: ${mandals.find((man: any) => man.id === trip.mandalId)?.name || 'अज्ञात'} मंडल`,
      notes: trip.notes || '' 
    }));

    const today = new Date();
    // Use type filter first
    let combined = [...visits, ...m, ...t].filter(a => {
        if (typeFilter !== 'all' && a.type !== typeFilter) return false;
        return true;
    }).filter(a => {
      const d = parseISO(a.date);
      return d<= today || isSameDay(d, today);
    });
    
    if (filter === 'day') {
      combined = combined.filter(a => isSameDay(parseISO(a.date), today));
    } else if (filter === 'week') {
      combined = combined.filter(a => isSameWeek(parseISO(a.date), today, { weekStartsOn: 1 }));
    } else if (filter === 'month') {
      combined = combined.filter(a => isSameMonth(parseISO(a.date), today));
    }

    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [contacts, meetings, trips, filter, typeFilter, villages, mandals]);

  // Compute summary ignoring typeFilter
  const summary = useMemo(() => {
    const visits = contacts.flatMap((c: any) => 
      c.history.map((h: any) => ({ ...h, type: 'visit' }))
    );
    const m = meetings.map((meet: any) => ({ ...meet, type: 'meeting' }));
    const t = trips.map((trip: any) => ({ ...trip, type: 'trip' }));

    const today = new Date();
    let combined = [...visits, ...m, ...t].filter(a => {
      const d = parseISO(a.date);
      return d<= today || isSameDay(d, today);
    });

    if (filter === 'day') {
      combined = combined.filter(a => isSameDay(parseISO(a.date), today));
    } else if (filter === 'week') {
      combined = combined.filter(a => isSameWeek(parseISO(a.date), today, { weekStartsOn: 1 }));
    } else if (filter === 'month') {
      combined = combined.filter(a => isSameMonth(parseISO(a.date), today));
    }

    return {
      visits: combined.filter(a => a.type === 'visit').length,
      meetings: combined.filter(a => a.type === 'meeting').length,
      trips: combined.filter(a => a.type === 'trip').length,
    };
  }, [contacts, meetings, trips, filter]);

  const handleSaveNotes = (activity: any) => {
    if (activity.type === 'visit') {
      updateHistory(activity.contactId, activity.id, editVal);
    } else if (activity.type === 'trip') {
      updateTripNotes(activity.id, editVal);
    } else if (activity.type === 'meeting') {
      updateMeetingNotes(activity.id, editVal);
    }
    setEditingId(null);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'visit': return<User className="text-blue-500" size={18} />;
      case 'meeting': return<Users className="text-purple-500" size={18} />;
      case 'trip': return<MapPin className="text-orange-500" size={18} />;
      default: return<Rocket className="text-gray-500" size={18} />;
    }
  };

  return (
   <div className="p-3 pb-24 space-y-4 animate-in fade-in duration-500">
     <div className="sticky top-0 z-30 pt-3 pb-3 -mt-3 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm -mx-3 px-3 space-y-2">
       <header className="flex flex-col gap-3 relative overflow-hidden bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-3 rounded-2xl shadow-sm">
         <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
         <div className="flex justify-between items-center relative gap-2">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 p-2">
               <Rocket size={20} strokeWidth={2.5} />
             </div>
             <div className="flex flex-col py-1">
               <h1 className="text-[20px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-normal pt-1">मेरी गतिविधियां</h1>
               <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-snug pb-1">गतिविधि डैशबोर्ड</span>
             </div>
           </div>
            
           <div className="flex bg-white/80 dark:bg-[#070b14]/80 backdrop-blur-md border border-gray-200 dark:border-gray-700/50 p-1 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'सभी' },
                { id: 'day', label: 'आज' },
                { id: 'week', label: 'सप्ताह' },
                { id: 'month', label: 'माह' }
              ].map(t => (
               <button 
                  key={t.id} 
                  onClick={() => setFilter(t.id as any)}
                  className={`py-1.5 px-3 rounded-lg text-[10px] font-bold transition-all ${filter === t.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
                >
                  {t.label}
               </button>
              ))}
           </div>
         </div>
       </header>

        {/* Dashboard Cards Compact */}
       <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div onClick={() => setTypeFilter(typeFilter === 'visit' ? 'all' : 'visit')} className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer shadow-sm flex flex-col justify-center items-center ${typeFilter === 'visit' ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-500 scale-[1.02]' : 'bg-white/80 dark:bg-[#0a101f]/80 backdrop-blur-md border-gray-200 dark:border-gray-800 active:scale-95'}`}>
             <div className={`text-xl font-bold leading-normal ${typeFilter === 'visit' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>{summary.visits}</div>
             <div className={`text-[9px] font-medium uppercase mt-0.5 tracking-widest ${typeFilter === 'visit' ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>संपर्क</div>
          </div>
          <div onClick={() => setTypeFilter(typeFilter === 'meeting' ? 'all' : 'meeting')} className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer shadow-sm flex flex-col justify-center items-center ${typeFilter === 'meeting' ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-500 scale-[1.02]' : 'bg-white/80 dark:bg-[#0a101f]/80 backdrop-blur-md border-gray-200 dark:border-gray-800 active:scale-95'}`}>
             <div className={`text-xl font-bold leading-normal ${typeFilter === 'meeting' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>{summary.meetings}</div>
             <div className={`text-[9px] font-medium uppercase mt-0.5 tracking-widest ${typeFilter === 'meeting' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>बैठकें</div>
          </div>
          <div onClick={() => setTypeFilter(typeFilter === 'trip' ? 'all' : 'trip')} className={`py-1.5 px-2 rounded-xl border text-center transition-all cursor-pointer shadow-sm flex flex-col justify-center items-center ${typeFilter === 'trip' ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white border-orange-500 scale-[1.02]' : 'bg-white/80 dark:bg-[#0a101f]/80 backdrop-blur-md border-gray-200 dark:border-gray-800 active:scale-95'}`}>
             <div className={`text-xl font-bold leading-normal ${typeFilter === 'trip' ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`}>{summary.trips}</div>
             <div className={`text-[9px] font-medium uppercase mt-0.5 tracking-widest ${typeFilter === 'trip' ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>प्रवास</div>
          </div>
       </div>
     </div>

      {/* Activity Feed */}
     <div className="space-y-3">
        {allActivities.length === 0 ? (
         <div className="p-8 text-center bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 rounded-2xl shadow-sm">
           <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
              <MessageSquare className="text-gray-400" size={24} />
           </div>
           <p className="text-xs font-medium text-gray-400 uppercase tracking-widest leading-normal">कोई गतिविधि नहीं मिली</p>
         </div>
        ) : (
          allActivities.map((activity, idx) => (
           <div key={`${activity.type}-${activity.id}-${idx}`} className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
             <div className="p-3 flex items-start gap-3">
               <div className={`p-2.5 rounded-xl flex-none ${activity.type === 'visit' ? 'bg-blue-500/10 text-blue-600' : activity.type === 'meeting' ? 'bg-purple-500/10 text-purple-600' : 'bg-orange-500/10 text-orange-600'}`}>
                  {getIcon(activity.type)}
               </div>
               <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                   <div className="min-w-0 pr-2">
                      <div className="text-[8px] font-medium uppercase text-gray-400 tracking-tighter leading-normal mb-0.5">
                        {format(parseISO(activity.date), 'd MMM')} • {activity.type === 'visit' ? 'अनुवर्तन' : activity.type === 'meeting' ? 'बैठक' : 'प्रवास'}
                     </div>
                     <h4 className="font-medium dark:text-white text-xs truncate leading-[1.6] py-0.5">{activity.contactName}</h4>
                      {activity.location && (
                       <div className="text-[9px] font-medium text-blue-500 flex items-center gap-1 mt-0.5 truncate bg-blue-50/50 dark:bg-blue-900/10 w-fit px-1.5 py-0.5 rounded-lg">
                         <MapPin size={8} /> {activity.location}
                       </div>
                      )}
                   </div>
                    {activity.type === 'visit' && (
                      <button onClick={() => onContactClick(activity.contactId)} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 active:text-blue-600 rounded-lg transition-colors flex-none">
                         <ChevronRight size={14} />
                      </button>
                    )}
                    {activity.type === 'trip' && (
                      <button onClick={() => onTripClick(activity)} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 active:text-orange-600 rounded-lg transition-colors flex-none">
                         <ChevronRight size={14} />
                      </button>
                    )}
                    {activity.type === 'meeting' && (
                      <button onClick={() => onMeetingClick(activity)} className="p-1.5 bg-gray-100 dark:bg-gray-800 text-gray-400 active:text-purple-600 rounded-lg transition-colors flex-none">
                         <ChevronRight size={14} />
                      </button>
                    )}
                 </div>

                 <div className="mt-2 bg-gray-50/80 dark:bg-black/20 rounded-xl p-2 border border-dashed dark:border-gray-800/50">
                   <div className="flex justify-between items-center mb-1.5">
                      <label className="text-[8px] font-medium text-gray-400 uppercase tracking-widest leading-normal">टिप्पणी</label>
                       {editingId !== `${activity.type}-${activity.id}` && (
                         <button 
                            onClick={() => { setEditingId(`${activity.type}-${activity.id}`); setEditVal(activity.notes); }} 
                            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-all"
                          >
                            <Edit2 size={10} />
                         </button>
                       )}
                   </div>
                    
                    {editingId === `${activity.type}-${activity.id}` ? (
                     <div className="space-y-1.5">
                       <textarea 
                          className="w-full bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder:text-gray-500 text-[10px] font-medium p-2 rounded-xl outline-none border focus:border-blue-500 transition-all leading-relaxed" 
                          value={editVal} 
                          onChange={e => setEditVal(e.target.value)} 
                          autoFocus
                          rows={2}
                          placeholder="अपनी टिप्पणी यहाँ लिखें..."
                        />
                       <div className="flex gap-1.5">
                         <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg text-[8px] font-medium uppercase">रद्द</button>
                         <button onClick={() => handleSaveNotes(activity)} className="flex-1 py-1.5 bg-blue-600 text-white rounded-lg text-[8px] font-medium uppercase shadow-sm">सुरक्षित</button>
                       </div>
                     </div>
                    ) : (
                     <p className="text-[10px] font-medium dark:text-gray-400 italic leading-snug line-clamp-2">
                        {activity.notes ? `"${activity.notes}"` : "कोई टिप्पणी नहीं है..."}
                     </p>
                    )}
                 </div>
               </div>
             </div>
           </div>
          ))
        )}
     </div>
   </div>
  );
};

const CalendarTab = ({ 
  trips, 
  contacts, 
  meetings,
  khands, 
  mandals, 
  villages,
  eventCategories,
  dashKhand, 
  dashMandal, 
  setDashKhand, 
  setDashMandal,
  onTripClick,
  onContactClick,
  setSelectedListId,
  setSelectedMeetingId,
  setActiveTab,
  handleUpdateVillage,
  getMandalName,
  getKhandName,
  getVillageName
}: any) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [karyasExpanded, setKaryasExpanded] = useState(false);
  const [viewType, setViewType] = useState<'month' | '1day' | '3day' | 'week' | 'schedule'>('month');

  const dayNamesHindi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
  const monthNamesHindi = ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

  const handlePrev = () => {
    if (viewType === 'month') setCurrentMonth(addMonths(currentMonth, -1));
    else if (viewType === 'week') setCurrentMonth(addWeeks(currentMonth, -1));
    else if (viewType === '3day') setCurrentMonth(addDays(currentMonth, -3));
    else setCurrentMonth(addDays(currentMonth, -1));
  };
  const handleNext = () => {
    if (viewType === 'month') setCurrentMonth(addMonths(currentMonth, 1));
    else if (viewType === 'week') setCurrentMonth(addWeeks(currentMonth, 1));
    else if (viewType === '3day') setCurrentMonth(addDays(currentMonth, 3));
    else setCurrentMonth(addDays(currentMonth, 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getEventIcon = (cat: string) => {
    const iconName = eventCategories.find(c => c.name === cat)?.icon;
    if (iconName) return<LucideIcon name={iconName} size={10} />;
    return<Rocket size={10} />;
  };

  const filteredTrips = trips.filter((t: any) => 
    (dashKhand === 'all' || t.khandId === dashKhand) && 
    (dashMandal === 'all' || t.mandalId === dashMandal)
  );

  const filteredMeetings = meetings.filter((m: any) => {
    // Meetings don't have khand/mandal directly, but they belong to a list.
    // For simplicity, we show all meetings or we could filter by list members' areas.
    // Let's just show all for now or check if any member matches filter.
    return true; 
  });

  const filteredVisits = contacts.flatMap((c: any) => 
    c.history.map((h: any) => ({ ...h, contactName: c.name, contactId: c.id, khandId: c.khandId, mandalId: c.mandalId }))
  ).filter((v: any) => 
    (dashKhand === 'all' || v.khandId === dashKhand) && 
    (dashMandal === 'all' || v.mandalId === dashMandal)
  );

  const getDayData = (day: Date) => {
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
        if (!v.karyaDetails?.dayOfWeek) return true; // Show on all days if no day is selected so it's not hidden
        return v.karyaDetails?.dayOfWeek === currentDayStr;
      }
      if (v.stage === VillageStage.MANDALI || v.stage === VillageStage.SAMPARK) {
         if (!v.karyaDetails?.daysOfMonth && !v.karyaDetails?.notes) return true; // Show if they haven't written anything
         
         const dateString = day.getDate().toString();
         const matchDayStr = Boolean(v.karyaDetails?.daysOfMonth?.includes(currentDayStr) || v.karyaDetails?.notes?.includes(currentDayStr));
         
         const dayRegex = new RegExp(`\\b${dateString}\\b`);
         const matchDateStr = Boolean(dayRegex.test(v.karyaDetails?.daysOfMonth || '') || dayRegex.test(v.karyaDetails?.notes || ''));
         
         return matchDayStr || matchDateStr;
      }
      return false;
    });

    return {
      trips: filteredTrips.filter((t: any) => isSameDay(parseISO(t.date), day)),
      visits: filteredVisits.filter((v: any) => isSameDay(parseISO(v.date), day)),
      meetings: filteredMeetings.filter((m: any) => isSameDay(parseISO(m.date), day)),
      karyas
    };
  };

  const selectedData = getDayData(selectedDate);

  const weekDays = ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'];

  return (
   <div className="p-3 pb-24 space-y-3 animate-in fade-in duration-500">
     <header className="bg-white/60 dark:bg-[#080d19]/60 backdrop-blur-2xl border border-white/50 dark:border-gray-800 p-3 rounded-2xl shadow-sm space-y-3 sticky top-2 z-30 relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
       <div className="flex justify-between items-center relative z-10">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 p-2">
             <CalendarDays size={20} strokeWidth={2.5} />
           </div>
           <div className="flex flex-col py-1">
             <h1 className="text-[20px] font-extrabold text-gray-900 dark:text-white tracking-tight leading-normal pt-1">कैलेंडर</h1>
             <span className="text-[10.5px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-snug pb-1">
                {viewType === 'month' ? 'मासिक अवलोकन' : (viewType === 'schedule' ? 'अनुसूची' : 'विस्तृत दृश्य')}
             </span>
           </div>
         </div>
          
         <div className="flex items-center gap-2">
           <div className="flex items-center bg-gray-50 dark:bg-gray-800/80 rounded-xl p-1 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button onClick={handlePrev} className="p-1.5 dark:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95"><ChevronLeft size={16}/></button>
              <button onClick={() => setCurrentMonth(new Date())} className="px-2 font-bold text-[10px] text-gray-700 dark:text-white hover:text-blue-600 transition-colors uppercase tracking-wider">{monthNamesHindi[currentMonth.getMonth()]}</button>
              <button onClick={handleNext} className="p-1.5 dark:text-white hover:bg-white dark:hover:bg-gray-700 rounded-lg transition-all active:scale-95"><ChevronRight size={16}/></button>
           </div>
         </div>
       </div>

       <div className="flex flex-col gap-2 relative z-10">
         <div className="flex items-center gap-2 border-t dark:border-gray-800/50 pt-3">
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
                {[
                  { id: '1day', label: '१ दिन' },
                  { id: '3day', label: '३ दिन' },
                  { id: 'week', label: 'सप्ताह' },
                  { id: 'month', label: 'मासिक' },
                  { id: 'schedule', label: 'सूची' }
                ].map(v => (
                 <button 
                    key={v.id} 
                    onClick={() => setViewType(v.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${viewType === v.id ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' : 'bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700/50 text-gray-500 hover:text-gray-900 dark:hover:text-gray-100'}`}
                  >
                    {v.label}
                 </button>
                ))}
            </div>
         </div>
         <div className="flex gap-1.5 bg-gray-50 dark:bg-[#0a101f] rounded-xl p-1.5 border border-gray-200 dark:border-gray-800">
           <div className="relative flex-1">
             <select 
                value={dashKhand} 
                onChange={(e) => { setDashKhand(e.target.value); setDashMandal('all'); }}
                className="w-full bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-200 uppercase p-2 rounded-lg outline-none appearance-none cursor-pointer"
              >
               <option value="all">सभी खंड</option>
                {khands.map((k:any) =><option key={k.id} value={k.id}>{k.name}</option>)}
             </select>
             <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
           </div>
           <div className="w-px bg-gray-300 dark:bg-gray-700 mx-0.5"></div>
           <div className="relative flex-1">
             <select 
                value={dashMandal} 
                disabled={dashKhand === 'all'}
                onChange={(e) => setDashMandal(e.target.value)}
                className="w-full bg-transparent text-[10px] font-bold text-gray-700 dark:text-gray-200 uppercase p-2 rounded-lg outline-none appearance-none cursor-pointer disabled:opacity-50"
              >
               <option value="all">सभी मंडल</option>
                {mandals.filter((m:any) => m.khandId === dashKhand).map((m:any) =><option key={m.id} value={m.id}>{m.name}</option>)}
             </select>
             <ChevronRight size={12} className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 text-gray-400 pointer-events-none" />
           </div>
         </div>
       </div>
     </header>

      {viewType === 'month' ? (
       <>
          {/* Calendar Grid */}
         <div className="bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-md p-4 shadow-sm border dark:border-gray-700">
           <div className="grid grid-cols-7 gap-1 mb-2 text-center">
              {weekDays.map(day => (
               <div key={day} className="text-[10px] font-medium text-gray-400 py-2">{day}</div>
              ))}
           </div>
           <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                const data = getDayData(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = isSameDay(day, selectedDate);
                const isTodayDay = isToday(day);

                return (
                 <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      aspect-square rounded-md flex flex-col items-center justify-center relative transition-all active:scale-90
                      ${!isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                      ${isSelected ? 'bg-blue-600 text-white shadow-lg' : isTodayDay ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' : 'hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white'}
                    `}
                  >
                   <span className="text-xs font-medium">{format(day, 'd')}</span>
                   <div className="flex gap-0.5 mt-1">
                      {data.meetings.length > 0 && (
                       <div className="flex gap-0.5">
                          {data.meetings.slice(0, 2).map((m: any) => (
                           <div key={m.id} className={`${isSelected ? 'text-white/80' : 'text-purple-500'}`}>{getEventIcon(m.category)}</div>
                          ))}
                       </div>
                      )}
                      {data.trips.length > 0 &&<div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />}
                      {data.visits.length > 0 &&<div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/50' : 'bg-blue-400'}`} />}
                      {data.karyas.length > 0 &&<div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white/90' : 'bg-emerald-500'}`} />}
                   </div>
                 </button>
                );
              })}
           </div>
         </div>

          {/* Selected Day Details */}
         <div className="space-y-4">
           <h3 className="text-sm font-bold dark:text-white px-1">
              {format(selectedDate, 'd MMMM')} का विवरण
           </h3>

            {selectedData.karyas?.length > 0 && (
             <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 p-3 rounded-xl transition-all mb-3 text-left overflow-hidden shadow-sm">
                 <div 
                    className="flex items-center justify-between cursor-pointer active:opacity-70 transition-opacity" 
                    onClick={() => setKaryasExpanded(!karyasExpanded)}
                  >
                   <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-lg shadow-md shadow-emerald-500/20">
                         <Rocket size={16} />
                       </div>
                       <div>
                         <div className="font-medium dark:text-white text-sm leading-snug">शाखा / मिलन / मंडली</div>
                         <div className="text-[10px] font-medium text-emerald-600 uppercase mt-0.5">{selectedData.karyas.length} कार्यस्थान</div>
                       </div>
                   </div>
                   <ChevronRight size={18} className={`text-emerald-500 transition-transform ${karyasExpanded ? 'rotate-90' : ''}`} />
                 </div>
                  
                  {karyasExpanded && (
                   <div className="mt-3 space-y-2 pt-3 border-t border-emerald-200/50 dark:border-emerald-800/50 animate-in slide-in-from-top-2 fade-in duration-200">
                        {selectedData.karyas.map((k: any) => (
                         <div key={k.id} className="flex gap-2 p-2.5 bg-white/60 dark:bg-[#0a101f]/60 rounded-lg border border-emerald-100 dark:border-emerald-800/50 shadow-sm relative group">
                             <div className="flex-1">
                               <div className="flex items-center gap-1.5 mb-1">
                                   <span className="bg-emerald-200 dark:bg-emerald-800 px-1.5 py-0.5 rounded text-[8px] font-medium uppercase text-emerald-800 dark:text-emerald-100">{k.stage}</span>
                                   <span className="font-medium dark:text-white text-xs">{k.name}</span>
                                   <span className="text-[9px] font-medium text-gray-500">({mandals.find((m:any) => m.id === k.mandalId)?.name})</span>
                               </div>
                                
                                {(k.karyaDetails?.time || k.karyaDetails?.location || k.karyaDetails?.daysOfMonth || k.karyaDetails?.notes) && (
                                 <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                      {(k.karyaDetails?.time || k.karyaDetails?.location) &&<div className="flex items-center gap-1"><Clock size={10} className="text-emerald-600/50"/><span>{k.karyaDetails?.time ? formatTime(k.karyaDetails.time) + ' बजे' : ''} {k.karyaDetails?.time && k.karyaDetails?.location ? '•' : ''} {k.karyaDetails?.location || ''}</span></div>}
                                      {k.stage === VillageStage.MANDALI && k.karyaDetails?.daysOfMonth &&<div className="opacity-80 mt-0.5 leading-snug">{k.karyaDetails.daysOfMonth}</div>}
                                      {k.karyaDetails?.notes &&<div className="italic opacity-80 mt-0.5 leading-snug">{k.karyaDetails.notes}</div>}
                                 </div>
                                )}
                             </div>
                             <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`क्या आप '${k.name}' की कार्यस्थिति को हटाना चाहते हैं?`)) {
                                    handleUpdateVillage(k.id, { stage: VillageStage.NONE, karyaDetails: undefined });
                                  }
                                }}
                                className="text-gray-400 hover:text-red-500 p-1.5 active:scale-95 transition-all self-start md:opacity-0 md:group-hover:opacity-100"
                              >
                               <Trash2 size={14} />
                             </button>
                         </div>
                        ))}
                   </div>
                  )}
             </div>
            )}
            
            {selectedData.meetings.map((m: any) => (
             <div key={m.id} onClick={() => { setSelectedListId(m.listId); setSelectedMeetingId(m.id); setActiveTab('lists'); }} className="bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/30 p-3 flex items-center gap-3 rounded-xl transition-all mb-3 text-left overflow-hidden shadow-sm active:scale-95 cursor-pointer">
               <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md shadow-purple-500/20">
                    {getEventIcon(m.category)}
               </div>
               <div className="flex-1">
                   <div className="text-[10px] font-medium text-purple-600 uppercase">कार्यक्रम</div>
                   <div className="font-medium dark:text-white text-sm">{m.title}</div>
                   <div className="text-[10px] text-gray-400 font-medium uppercase">{m.category} • {m.location || 'कोई स्थान नहीं'}</div>
               </div>
               <ChevronRight size={18} className="text-purple-300" />
             </div>
            ))}

            {selectedData.trips.length === 0 && selectedData.visits.length === 0 && selectedData.meetings.length === 0 && selectedData.karyas?.length === 0 ? (
             <div className="p-8 text-center text-gray-400 font-medium bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-xl border dark:border-gray-700">
                कोई गतिविधि नहीं
             </div>
            ) : (
             <>
                {selectedData.trips.map((trip: any) => (
                 <div key={trip.id} onClick={() => onTripClick(trip)} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 p-3 flex items-center gap-3 rounded-xl transition-all mb-3 text-left overflow-hidden shadow-sm active:scale-95 cursor-pointer">
                   <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md shadow-orange-500/20"><CalendarIcon size={16}/></div>
                   <div className="flex-1">
                     <div className="text-[10px] font-medium text-orange-600 uppercase">प्रवास योजना</div>
                     <div className="font-medium dark:text-white text-sm">{mandals.find((m:any) => m.id === trip.mandalId)?.name} मंडल</div>
                   </div>
                   <ChevronRight size={18} className="text-orange-300" />
                 </div>
                ))}
                {selectedData.visits.map((visit: any) => (
                 <div key={visit.id} onClick={() => onContactClick(visit.contactId)} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 p-3 flex items-center gap-3 rounded-xl transition-all mb-3 text-left overflow-hidden shadow-sm active:scale-95 cursor-pointer">
                   <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md shadow-blue-500/20"><User size={16}/></div>
                   <div className="flex-1">
                     <div className="text-[10px] font-medium text-blue-600 uppercase">संपर्क: {visit.contactName}</div>
                     <div className="text-xs font-medium dark:text-gray-300 line-clamp-1">{visit.notes}</div>
                   </div>
                   <ChevronRight size={18} className="text-blue-300" />
                 </div>
                ))}
             </>
            )}
         </div>
       </>
      ) : viewType === 'schedule' ? (
       <div className="space-y-4">
           {[...meetings.map(m => ({ ...m, type: 'meeting' })), 
             ...trips.map(t => ({ ...t, type: 'trip' }))]
             .filter(item => parseISO(item.date) >= startOfDay(new Date()))
             .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
             .map(item => (
              <div 
                 key={item.id} 
                 onClick={() => {
                   if (item.type === 'meeting') {
                     setSelectedListId(item.listId); 
                     setSelectedMeetingId(item.id); 
                     setActiveTab('lists');
                   } else {
                     onTripClick(item);
                   }
                 }} 
                 className={`bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 dark:border-gray-700/50 p-4 rounded-xl shadow-sm flex items-center gap-4 active:scale-95 transition-all cursor-pointer border-l-4 ${item.type === 'meeting' ? 'border-l-purple-500' : 'border-l-orange-500'}`}
               >
                <div className="flex-none text-center min-w-[50px] pr-4 border-r dark:border-gray-800">
                   <div className="text-[10px] font-medium text-gray-400 uppercase">{monthNamesHindi[parseISO(item.date).getMonth()]}</div>
                   <div className="text-xl font-bold dark:text-white">{format(parseISO(item.date), 'd')}</div>
                </div>
                <div className="flex-1 min-w-0">
                   <div className={`text-[10px] font-medium uppercase truncate ${item.type === 'meeting' ? 'text-purple-600' : 'text-orange-600'}`}>
                      {item.type === 'meeting' ? item.category : 'प्रवास योजना'}
                   </div>
                   <div className="text-sm font-medium dark:text-white truncate">
                      {item.type === 'meeting' ? item.title : `${getMandalName(item.mandalId)} प्रवास`}
                   </div>
                   <div className="text-[10px] text-gray-400 font-medium truncate">
                      {item.location || (item.type === 'trip' ? getKhandName(item.khandId) : 'कोई स्थान नहीं')}
                   </div>
                </div>
                <div className={item.type === 'meeting' ? 'text-purple-500' : 'text-orange-500'}>
                    {item.type === 'meeting' ? getEventIcon(item.category) :<CalendarIcon size={16}/>}
                </div>
              </div>
             ))
           }
           {meetings.length === 0 && trips.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-medium">कोई आगामी गतिविधि नहीं है</div>
           )}
       </div>
      ) : (
       <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 min-h-[350px]">
           {Array.from({ length: viewType === 'week' ? 7 : (viewType === '3day' ? 3 : 1) }, (_, i) => {
             const day = addDays(viewType === 'week' ? startOfWeek(currentMonth) : currentMonth, i);
             const data = getDayData(day);
             return (
              <div key={day.toISOString()} className="flex-none w-[200px] bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-xl border border-white/50 dark:border-gray-800 rounded-xl p-2.5 space-y-2.5 shadow-sm">
                <div className="text-center pb-2 border-b dark:border-gray-800/60">
                   <div className="text-[8px] font-medium text-gray-400 uppercase tracking-widest leading-normal">{dayNamesHindi[day.getDay()]}</div>
                   <div className={`text-sm font-medium mt-1 leading-normal ${isToday(day) ? 'text-blue-600' : 'dark:text-white'}`}>
                      {day.getDate()} {monthNamesHindi[day.getMonth()]}
                   </div>
                </div>
                 
                <div className="space-y-2">
                    {/* Meetings */}
                    {data.meetings.map((m: any) => (
                     <div key={m.id} onClick={() => { setSelectedListId(m.listId); setSelectedMeetingId(m.id); setActiveTab('lists'); }} className="p-2 bg-purple-500/5 dark:bg-purple-900/10 border border-purple-200/50 dark:border-purple-800/30 rounded-lg space-y-1 cursor-pointer active:scale-[0.98] transition-all">
                       <div className="flex justify-between items-center">
                         <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-tighter leading-normal">{m.category}</div>
                         <div className="text-purple-500 opacity-70 scale-75">{getEventIcon(m.category)}</div>
                       </div>
                       <div className="text-sm font-medium dark:text-white leading-snug line-clamp-2">{m.title}</div>
                        {m.time &&<div className="text-xs font-medium text-gray-400 flex items-center gap-1"><Clock size={10}/> {formatTime(m.time)}</div>}
                     </div>
                    ))}
                    
                    {/* Trips */}
                    {data.trips.map((t: any) => {
                      const participants = t.peopleIds.map((pid: string) => contacts.find((c: any) => c.id === pid)?.name).filter(Boolean);
                      return (
                     <div key={t.id} onClick={() => onTripClick(t)} className="p-2 bg-orange-500/5 dark:bg-orange-900/10 border border-orange-200/50 dark:border-orange-800/30 rounded-lg space-y-1.5 cursor-pointer active:scale-[0.98] transition-all">
                       <div className="flex justify-between items-center">
                         <div className="text-xs font-medium text-orange-600 dark:text-orange-400 uppercase tracking-tighter leading-normal">प्रवास</div>
                          {t.schedule && t.schedule.length > 0 && (
                           <div className="text-xs font-medium text-gray-400 flex items-center gap-0.5"><Clock size={10}/> {formatTime(t.schedule[0].time)}</div>
                          )}
                       </div>
                       <div className="text-sm font-medium dark:text-white leading-snug">{getMandalName(t.mandalId)} मंडल</div>
                        
                        {t.schedule && t.schedule.length > 0 ? (
                         <div className="space-y-0.5">
                            {t.schedule.slice(0, 2).map((item: any) => (
                             <div key={item.id} className="text-[8px] flex justify-between items-center bg-white/30 dark:bg-black/20 px-1 rounded">
                               <span className="text-gray-500 font-medium">{formatTime(item.time)}</span>
                               <span className="dark:text-gray-300 font-medium truncate max-w-[60%]">{contacts.find((c:any) => c.id === item.contactId)?.name}</span>
                             </div>
                            ))}
                            {t.schedule.length > 2 &&<div className="text-[7px] text-gray-400 text-center font-medium">+{t.schedule.length - 2} और</div>}
                         </div>
                        ) : (
                         <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {t.villageIds.slice(0, 3).map((vid: string) => (
                             <span key={vid} className="px-1 py-0.5 bg-white/50 dark:bg-gray-800 rounded text-[7px] font-medium dark:text-gray-300 border border-black/5 dark:border-white/5 leading-normal">{getVillageName(vid)}</span>
                            ))}
                            {t.villageIds.length > 3 &&<span className="text-[7px] text-gray-400 font-medium ml-0.5">+{t.villageIds.length - 3}</span>}
                         </div>
                        )}
                        
                        {participants.length > 0 && !t.schedule?.length && (
                         <div className="text-[7px] text-gray-500 font-medium dark:text-gray-400 border-t dark:border-gray-800 pt-0.5 truncate">
                             संलग्न: {participants.join(', ')}
                         </div>
                        )}
                     </div>
                      );
                    })}
                    
                    {/* Karyas */}
                    {data.karyas.map((k: any) => (
                     <div key={k.id} className="p-2 bg-emerald-500/5 dark:bg-emerald-900/10 border border-emerald-200/50 dark:border-emerald-800/30 rounded-lg space-y-0.5">
                       <div className="text-[8px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter leading-normal">{k.stage}</div>
                       <div className="text-[10px] font-medium dark:text-white leading-snug">{k.name}</div>
                        {k.karyaDetails?.time &&<div className="text-[8px] font-medium text-gray-400 flex items-center gap-1"><Clock size={8}/> {formatTime(k.karyaDetails.time)}</div>}
                     </div>
                    ))}
                    
                    {data.meetings.length === 0 && data.trips.length === 0 && data.karyas.length === 0 && (
                     <div className="text-center py-6 text-[8px] text-gray-400 font-medium uppercase tracking-widest italic opacity-60">कोई नहीं</div>
                    )}
                </div>
              </div>
             );
           })}
       </div>
      )}
   </div>
  );
};

// --- Ideas Tab Component ---
const IdeasTab = ({ ideas, onUpdate, onDelete, onAdd, contacts, villages, mandals }: any) => {
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  const groupedIdeas = useMemo(() => {
    const groups: { id: string, date: string, content: string, isCompleted: boolean, contactIds: string[], villageId?: string, mandalId?: string, ideas: any[] }[] = [];
    ideas.filter((i: Idea) => {
      if (filter === 'all') return true;
      if (filter === 'pending') return !i.isCompleted;
      return i.isCompleted;
    }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()).forEach((idea: Idea) => {
      const existing = groups.find(g => g.content.trim() === idea.content.trim() && g.isCompleted === idea.isCompleted);
      if (existing) {
        existing.ideas.push(idea);
        if (idea.contactId) existing.contactIds.push(idea.contactId);
      } else {
        groups.push({ id: idea.id, content: idea.content, isCompleted: idea.isCompleted, date: idea.date, contactIds: idea.contactId ? [idea.contactId] : [], villageId: idea.villageId, mandalId: idea.mandalId, ideas: [idea] });
      }
    });
    return groups;
  }, [ideas, filter]);

  return (
   <div className="p-4 pb-24 space-y-6 animate-in fade-in duration-500">
     <header className="flex justify-between items-center sticky top-0 z-30 pt-4 pb-3 -mt-4 bg-slate-50/95 dark:bg-[#070b14]/95 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm -mx-4 px-4">
       <div>
         <h1 className="text-2xl font-bold dark:text-white">भविष्य योजना</h1>
       </div>
       <button onClick={onAdd} className="p-4 bg-blue-600 text-white rounded-xl shadow-lg active:scale-90 transition-all abstract-btn">
         <Plus />
       </button>
     </header>

     <div className="flex bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 p-1 rounded-md border dark:border-gray-700 shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'pending', label: 'लंबित' },
          { id: 'completed', label: 'पूर्ण' },
          { id: 'all', label: 'सभी' }
        ].map(t => (
         <button 
            key={t.id} 
            onClick={() => setFilter(t.id as any)}
            className={`flex-1 py-3 px-4 rounded-sm text-xs font-medium transition-all ${filter === t.id ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400'}`}
          >
            {t.label}
         </button>
        ))}
     </div>

     <div className="space-y-3">
        {groupedIdeas.length === 0 ? (
         <div className="p-12 text-center bg-white/40 dark:bg-[#080d19]/40 backdrop-blur-2xl border border-white/50 border-t-white/80 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_0_0_1px_rgba(255,255,255,0.2)] text-gray-800 dark:text-gray-100 dark:border-gray-700/50 rounded-sm border dark:border-gray-700 shadow-sm">
           <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lightbulb className="text-gray-200" size={32} />
           </div>
           <p className="text-sm font-medium text-gray-400">कोई विचार नहीं मिला</p>
         </div>
        ) : (
          groupedIdeas.map((group: any) => {
            const hasMultipleContacts = group.contactIds.length > 1;
            const singleContact = !hasMultipleContacts && group.contactIds.length === 1 ? contacts.find((c: any) => c.id === group.contactIds[0]) : null;
            const village = villages.find((v: any) => v.id === group.villageId);
            const mandal = mandals.find((m: any) => m.id === group.mandalId);
            
            return (
             <div key={group.id} className={`glass dark:glass-dark p-5 rounded-2xl border dark:border-gray-800 shadow-xl flex flex-col gap-3 transition-all relative overflow-hidden group ${group.isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}`}>
               <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-20 group-hover:opacity-100 transition-opacity"></div>
               <div className="flex justify-between items-start gap-4 z-10">
                 <div className="flex-1">
                   <div className="text-xs font-medium uppercase text-blue-500 mb-1">
                      {new Date(group.date).toLocaleDateString('hi-IN')}
                      {hasMultipleContacts && ` • ${group.contactIds.length} संपर्कों से जुड़ा`}
                      {singleContact && ` • संपर्क: ${singleContact.name} (${villages.find((v: any) => v.id === singleContact.villageId)?.name})`}
                      {!hasMultipleContacts && !singleContact && village && ` • गाँव: ${village.name}`}
                      {!hasMultipleContacts && !singleContact && !village && mandal && ` • मंडल: ${mandal.name}`}
                   </div>
                   <p className={`font-medium text-sm dark:text-white ${group.isCompleted ? 'line-through text-gray-400' : ''}`}>{group.content}</p>
                 </div>
                 <div className="flex gap-2">
                   <button 
                      onClick={() => {
                         group.ideas.forEach((i: Idea) => onUpdate(i.id, { isCompleted: !group.isCompleted }));
                      }} 
                      className={`p-2 rounded-sm active:scale-95 transition-all ${group.isCompleted ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}
                    >
                     <Check size={16} />
                   </button>
                   <button onClick={() => {
                        group.ideas.forEach((i: Idea) => onDelete(i.id));
                    }} className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-sm active:scale-95 transition-all">
                     <Trash2 size={16} />
                   </button>
                 </div>
               </div>
             </div>
            );
          })
        )}
     </div>
   </div>
  );
};

const ListFormModal = ({ categories, onClose, onSubmit, initialData }: any) => {
  const [name, setName] = useState(initialData?.name || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [icon, setIcon] = useState(initialData?.icon || '');
  const [showIconPicker, setShowIconPicker] = useState(false);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
      <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
           <h2 className="text-xl font-bold dark:text-white tracking-tight font-hindi">{initialData ? 'सूची संपादित करें' : 'नई सूची बनाएं'}</h2>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-md mx-auto w-full pb-32 relative z-10">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1 font-hindi">सूची का नाम</label>
              <input 
                 autoFocus 
                 className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 p-4 rounded-xl outline-none font-medium text-lg font-hindi" 
                 placeholder="जैसे: मुख्य कार्यकर्ता, मंडल टोली आदि" 
                 value={name} 
                 onChange={e => setName(e.target.value)} 
               />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1 font-hindi">आइकन (Icon) चुनें</label>
              <button 
                onClick={() => setShowIconPicker(!showIconPicker)}
                className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 p-4 rounded-xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg flex items-center justify-center">
                    <LucideIcon 
                      name={icon || categories.find((c: any) => c.id === categoryId)?.icon || 'List'} 
                      size={20} 
                    />
                  </div>
                  <span className="font-medium text-gray-700 dark:text-gray-300 font-hindi">
                    {icon ? icon : (categories.find((c: any) => c.id === categoryId)?.icon ? 'श्रेणी से (From Category)' : 'डिफ़ॉल्ट आइकन')}
                  </span>
                </div>
                <div className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1 text-sm font-bold font-hindi">
                  बदलें <ChevronRight size={16} />
                </div>
              </button>

              <AnimatePresence>
                {showIconPicker && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-6 gap-2 p-4 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 mt-2 max-h-48 overflow-y-auto">
                      {ICON_LIST.map((iconName) => (
                        <button
                          key={iconName}
                          onClick={() => {
                            setIcon(iconName);
                            setShowIconPicker(false);
                          }}
                          className={`w-full aspect-square flex items-center justify-center rounded-lg transition-all ${icon === iconName ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                          <LucideIcon name={iconName} size={18} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1 font-hindi">श्रेणी (Category) चुनें</label>
            <div className="grid grid-cols-2 gap-2">
               {categories.map((cat: any) => {
                 return (
                   <button 
                      key={cat.id}
                      onClick={() => setCategoryId(cat.id)}
                      className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${categoryId === cat.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95' : 'bg-white/40 dark:bg-gray-900/40 border-white/60 dark:border-gray-800/80 text-gray-600 dark:text-gray-400'}`}
                   >
                     <div className={`p-2 rounded-lg ${categoryId === cat.id ? 'bg-indigo-500' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <LucideIcon name={cat.icon} size={18} />
                     </div>
                     <span className="font-bold text-sm truncate font-hindi">{cat.name}</span>
                   </button>
                 );
               })}
            </div>
          </div>

        <div className="pt-4">
          <button 
             onClick={() => onSubmit({ name, categoryId, icon })} 
             disabled={!name || !categoryId}
             className="w-full p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50 font-hindi"
           >
             {initialData ? 'अपडेट करें' : 'सूची बनाएं'}
          </button>
        </div>
      </div>
    </div>
  );
};

const IdeaFormModal = ({ contacts, villages, mandals, khands, customLists, onClose, onSubmit }: any) => {
  const [content, setContent] = useState('');
  const [linkType, setLinkType] = useState<'none' | 'contact' | 'village' | 'mandal' | 'customList'>('none');
  const [linkId, setLinkId] = useState('');
  const [khandId, setKhandId] = useState('');
  const [mandalId, setMandalId] = useState('');

  return (
   <div className="fixed inset-0 z-[200] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
     <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
       <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <h2 className="text-xl font-bold dark:text-white tracking-tight">नया विचार / योजना</h2>
       </div>
     </header>

     <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-md mx-auto w-full pb-32 relative z-10">
         <div className="space-y-2">
           <label className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1">क्या विचार है?</label>
           <textarea 
              autoFocus 
              className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 p-4 rounded-md outline-none font-medium text-sm min-h-[120px]" 
              placeholder="यहाँ लिखें..." 
              value={content} 
              onChange={e => setContent(e.target.value)} 
            />
         </div>

         <div className="space-y-2">
           <label className="text-xs font-medium text-gray-400 uppercase tracking-widest px-1">किस से संबंधित है?</label>
           <div className="grid grid-cols-3 gap-2">
             <button 
                onClick={() => { setLinkType('contact'); setLinkId(''); setKhandId(''); setMandalId(''); }} 
                className={`py-3 px-2 rounded-sm text-xs font-medium uppercase transition-all ${linkType === 'contact' ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border dark:border-gray-700'}`}
              >
               <Users size={14} className="inline mr-1" /> व्यक्ति
             </button>
             <button 
                onClick={() => { setLinkType('village'); setLinkId(''); setKhandId(''); setMandalId(''); }} 
                className={`py-3 px-2 rounded-sm text-xs font-medium uppercase transition-all ${linkType === 'village' ? 'bg-orange-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border dark:border-gray-700'}`}
              >
               <MapPin size={14} className="inline mr-1" /> गाँव
             </button>
             <button 
                onClick={() => { setLinkType('mandal'); setLinkId(''); setKhandId(''); setMandalId(''); }} 
                className={`py-3 px-2 rounded-sm text-xs font-medium uppercase transition-all ${linkType === 'mandal' ? 'bg-indigo-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border dark:border-gray-700'}`}
              >
               <Building2 size={14} className="inline mr-1" /> मंडल
             </button>
             <button 
                onClick={() => { setLinkType('customList'); setLinkId(''); setKhandId(''); setMandalId(''); }} 
                className={`py-3 px-2 rounded-sm text-xs font-medium uppercase transition-all ${linkType === 'customList' ? 'bg-purple-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border dark:border-gray-700'}`}
              >
               <ListIcon size={14} className="inline mr-1" /> सूची
             </button>
             <button 
                onClick={() => { setLinkType('none'); setLinkId(''); setKhandId(''); setMandalId(''); }} 
                className={`col-span-2 py-3 px-2 rounded-sm text-xs font-medium uppercase transition-all ${linkType === 'none' ? 'bg-gray-600 text-white' : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border dark:border-gray-700'}`}
              >
                कोई नहीं
             </button>
           </div>
         </div>

          {linkType !== 'none' && (
           <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed dark:border-gray-700">
               {linkType === 'customList' && (
                <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs" value={linkId} onChange={e => setLinkId(e.target.value)}>
                  <option value="">सूची चुनें...</option>
                   {customLists?.map((l: any) =><option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
               )}
               {linkType === 'contact' && (
                <div className="space-y-3">
                   <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs" value={khandId} onChange={e => { setKhandId(e.target.value); setMandalId(''); setLinkId(''); }}>
                     <option value="">खंड चुनें (वैकल्पिक)...</option>
                      {khands.map((k: any) =><option key={k.id} value={k.id}>{k.name}</option>)}
                   </select>
                    {khandId && (
                      <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs" value={mandalId} onChange={e => { setMandalId(e.target.value); setLinkId(''); }}>
                        <option value="">मंडल चुनें (वैकल्पिक)...</option>
                         {mandals.filter((m:any) => m.khandId === khandId).map((m: any) =><option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    )}
                   <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs" value={linkId} onChange={e => setLinkId(e.target.value)}>
                     <option value="">संपर्क चुनें...</option>
                      {contacts.filter((c:any) => {
                         if (mandalId) return c.mandalId === mandalId;
                         if (khandId) return c.khandId === khandId;
                         return true;
                      }).map((c: any) =><option key={c.id} value={c.id}>{c.name} ({villages.find((v:any)=>v.id===c.villageId)?.name})</option>)}
                   </select>
                </div>
               )}
               {(linkType === 'village' || linkType === 'mandal') && (
                <div className="space-y-3">
                  <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs" value={khandId} onChange={e => { setKhandId(e.target.value); setMandalId(''); setLinkId(''); }}>
                    <option value="">खंड चुनें...</option>
                     {khands.map((k: any) =><option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                   {khandId && (
                     <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs disabled:opacity-50" value={linkType === 'mandal' ? linkId : mandalId} onChange={e => {
                         if(linkType === 'mandal') setLinkId(e.target.value);
                         else { setMandalId(e.target.value); setLinkId(''); }
                      }}>
                       <option value="">मंडल चुनें...</option>
                        {mandals.filter((m:any) => m.khandId === khandId).map((m: any) =><option key={m.id} value={m.id}>{m.name}</option>)}
                     </select>
                   )}
                   {linkType === 'village' && mandalId && (
                     <select className="w-full bg-white/30 dark:bg-[#080d19]/50 backdrop-blur-2xl border border-white/40 border-t-white/70 shadow-[inset_0_1px_2px_rgba(255,255,255,0.6),0_2px_8px_rgba(0,0,0,0.05)] text-gray-800 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 dark:border-gray-700/50 p-4 rounded-sm font-medium dark:text-white outline-none border dark:border-gray-700 text-xs disabled:opacity-50" value={linkId} onChange={e => setLinkId(e.target.value)}>
                       <option value="">गाँव चुनें...</option>
                        {villages.filter((v:any) => v.mandalId === mandalId).map((v: any) =><option key={v.id} value={v.id}>{v.name}</option>)}
                     </select>
                   )}
                </div>
               )}
           </div>
          )}

       <button 
          onClick={() => {
            if (linkType === 'customList') {
              const list = customLists?.find((l: any) => l.id === linkId);
              if (list) {
                const multiIdeas = list.peopleIds.map((pid: string) => ({
                   content,
                   date: new Date().toISOString(),
                   contactId: pid,
                   villageId: contacts.find((c: any) => c.id === pid)?.villageId,
                   mandalId: contacts.find((c: any) => c.id === pid)?.mandalId,
                   khandId: contacts.find((c: any) => c.id === pid)?.khandId,
                }));
                onSubmit(multiIdeas);
              }
            } else {
              onSubmit({ 
                content, 
                date: new Date().toISOString(), 
                contactId: linkType === 'contact' ? linkId : undefined,
                villageId: linkType === 'village' ? linkId : undefined,
                mandalId: linkType === 'mandal' ? linkId : undefined,
                khandId: (linkType === 'village' || linkType === 'mandal') ? khandId : undefined
              });
            }
          }} 
          disabled={!content || (linkType !== 'none' && !linkId)}
          className="w-full p-4 bg-indigo-600 dark:bg-indigo-500 text-white font-medium rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 abstract-btn"
        >
          सुरक्षित करें
       </button>
     </div>
   </div>
  );
};

const BulkUpdateModal = ({ selectedCount, contacts, khands, mandals, villages, categories, onClose, onUpdate }: any) => {
  const [useStatus, setUseStatus] = useState(false);
  const [status, setStatus] = useState(Status.SAKRIYA);
  
  const [useCategory, setUseCategory] = useState(false);
  const [category, setCategory] = useState(categories[0]?.name || '');
  
  const [useResponsibility, setUseResponsibility] = useState(false);
  const [responsibility, setResponsibility] = useState('');
  
  const [useLocation, setUseLocation] = useState(false);
  const [khandId, setKhandId] = useState('');
  const [mandalId, setMandalId] = useState('');
  const [villageId, setVillageId] = useState('');

  const handleUpdate = () => {
    const updates: any = {};
    if (useStatus) updates.status = status;
    if (useCategory) updates.category = category;
    if (useResponsibility) {
      updates.volunteerProfileUpdates = { currentResponsibility: responsibility };
    }
    if (useLocation) {
      if (khandId) updates.khandId = khandId;
      if (mandalId) updates.mandalId = mandalId;
      if (villageId) updates.villageId = villageId;
    }
    
    if (Object.keys(updates).length === 0) {
      alert('कृपया कम से कम एक फ़ील्ड चुनें जिसे आप अपडेट करना चाहते हैं।');
      return;
    }
    
    onUpdate(updates);
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col bg-slate-50/80 dark:bg-[#070b14]/90 backdrop-blur-3xl animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">
      <header className="bg-white/10 dark:bg-[#070b14]/10 border-b border-white/20 shadow-[0_8px_24px_-4px_rgba(0,0,0,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] dark:border-gray-800/50 p-4 sticky top-0 z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-700/50 rounded-full active:scale-95"><ArrowLeft size={20} className="dark:text-white"/></button>
          <div className="flex flex-col">
            <h2 className="text-xl font-bold dark:text-white tracking-tight">बल्क अपडेट</h2>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">{selectedCount} व्यक्ति चयनित</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-md mx-auto w-full pb-32">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/40 text-xs font-medium text-blue-800 dark:text-blue-300 leading-relaxed italic">
          आप एक साथ मुख्य क्षेत्रों को अपडेट कर सकते हैं। केवल उन्हीं क्षेत्रों को चुनें जिन्हें आप बदलना चाहते हैं।
        </div>

        <div className="space-y-4">
          {/* Status Block */}
          <div className={`p-4 rounded-2xl border transition-all ${useStatus ? 'bg-white dark:bg-gray-800 border-indigo-500 shadow-lg ring-1 ring-indigo-500/20' : 'bg-gray-50/50 dark:bg-gray-900/20 border-transparent dark:border-gray-800 opacity-70'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useStatus ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  <ShieldCheck size={18} />
                </div>
                <span className={`font-bold text-sm ${useStatus ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500'}`}>शक्ति (Status)</span>
              </div>
              <button 
                onClick={() => setUseStatus(!useStatus)} 
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all uppercase tracking-widest ${useStatus ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}
              >
                {useStatus ? 'हटाएं' : 'चुनें'}
              </button>
            </div>
            {useStatus && (
              <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl gap-1">
                {Object.values(Status).map((s: any) => (
                  <button 
                    key={s} 
                    onClick={() => setStatus(s)} 
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all ${status === s ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Block */}
          <div className={`p-4 rounded-2xl border transition-all ${useCategory ? 'bg-white dark:bg-gray-800 border-purple-500 shadow-lg ring-1 ring-purple-500/20' : 'bg-gray-50/50 dark:bg-gray-900/20 border-transparent dark:border-gray-800 opacity-70'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useCategory ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  <Tag size={18} />
                </div>
                <span className={`font-bold text-sm ${useCategory ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500'}`}>संपर्क श्रेणी</span>
              </div>
              <button 
                onClick={() => setUseCategory(!useCategory)} 
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all uppercase tracking-widest ${useCategory ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}
              >
                {useCategory ? 'हटाएं' : 'चुनें'}
              </button>
            </div>
            {useCategory && (
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c: any) => (
                  <button 
                    key={c.id} 
                    onClick={() => setCategory(c.name)} 
                    className={`p-2 rounded-xl border text-[9px] font-bold uppercase transition-all flex items-center gap-2 ${category === c.name ? 'bg-purple-600 text-white border-purple-600 shadow-lg' : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500'}`}
                  >
                    <LucideIcon name={c.icon} size={14} />
                    <span className="truncate">{c.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Responsibility Block */}
          <div className={`p-4 rounded-2xl border transition-all ${useResponsibility ? 'bg-white dark:bg-gray-800 border-orange-500 shadow-lg ring-1 ring-orange-500/20' : 'bg-gray-50/50 dark:bg-gray-900/20 border-transparent dark:border-gray-800 opacity-70'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useResponsibility ? 'bg-orange-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  <Award size={18} />
                </div>
                <span className={`font-bold text-sm ${useResponsibility ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'}`}>वर्तमान दायित्व</span>
              </div>
              <button 
                onClick={() => setUseResponsibility(!useResponsibility)} 
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all uppercase tracking-widest ${useResponsibility ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}
              >
                {useResponsibility ? 'हटाएं' : 'चुनें'}
              </button>
            </div>
            {useResponsibility && (
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="दायित्व का नाम..." 
                  value={responsibility} 
                  onChange={e => setResponsibility(e.target.value)} 
                  className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none border dark:border-gray-700 font-medium text-xs dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Location Block */}
          <div className={`p-4 rounded-2xl border transition-all ${useLocation ? 'bg-white dark:bg-gray-800 border-emerald-500 shadow-lg ring-1 ring-emerald-500/20' : 'bg-gray-50/50 dark:bg-gray-900/20 border-transparent dark:border-gray-800 opacity-70'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${useLocation ? 'bg-emerald-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                  <MapPin size={18} />
                </div>
                <span className={`font-bold text-sm ${useLocation ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'}`}>क्षेत्र (Location)</span>
              </div>
              <button 
                onClick={() => setUseLocation(!useLocation)} 
                className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all uppercase tracking-widest ${useLocation ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}
              >
                {useLocation ? 'हटाएं' : 'चुनें'}
              </button>
            </div>
            {useLocation && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <select value={khandId} onChange={e => { setKhandId(e.target.value); setMandalId(''); setVillageId(''); }} className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none border dark:border-gray-700 font-medium text-[10px] dark:text-white appearance-none">
                    <option value="">खंड चुनें...</option>
                    {khands.map((k: any) =><option key={k.id} value={k.id}>{k.name}</option>)}
                  </select>
                  <select value={mandalId} onChange={e => { setMandalId(e.target.value); setVillageId(''); }} className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none border dark:border-gray-700 font-medium text-[10px] dark:text-white appearance-none disabled:opacity-50" disabled={!khandId}>
                    <option value="">मंडल चुनें...</option>
                    {mandals.filter((m: any) => m.khandId === khandId).map((m: any) =><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <select value={villageId} onChange={e => setVillageId(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 p-3 rounded-xl outline-none border dark:border-gray-700 font-medium text-[10px] dark:text-white appearance-none disabled:opacity-50" disabled={!mandalId}>
                    <option value="">गांव चुनें...</option>
                    {villages.filter((v: any) => v.mandalId === mandalId).map((v: any) =><option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
              </div>
            )}
          </div>
        </div>

        <div className="pt-8">
          <button 
            onClick={handleUpdate} 
            className="w-full p-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
          >
            {selectedCount} डेटा अपडेट करें
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;
