
export enum Status {
  SAKRIYA = 'सक्रिय शक्ति',
  SANCHIT = 'संचित शक्ति',
  SAJJAN = 'सज्जन शक्ति',
  UTSUK = 'उत्सुक शक्ति'
}

export enum VillageStage {
  SHAKHA = 'शाखा',
  MILAN = 'मिलन',
  MANDALI = 'मंडली',
  SAMPARK = 'संपर्क',
  NONE = 'कुछ नहीं'
}

export interface KaryaDetails {
  location?: string;
  time?: string;
  dayOfWeek?: string;
  daysOfMonth?: string;
  notes?: string;
}

export interface KaryaPlan {
  current?: string;
  month1?: string;
  month6?: string;
  year1?: string;
}

export enum ShakhaPosition {
  MUKHYA_SHIKSHAK = 'मुख्य शिक्षक',
  SAHA_MUKHYA_SHIKSHAK = 'सह मुख्य शिक्षक',
  GAN_SHIKSHAK = 'गण शिक्षक',
  GAT_NATAK = 'गट नाटक',
  SHAKHA_KARYAVAH = 'शाखा कार्यवाह',
  GAT_NATAK_PRAMUKH = 'गट नाटक प्रमुख'
}

export interface ShakhaData {
  shakhaName: string;
  positions: Partial<Record<ShakhaPosition, string>>; // Stores contactId
}

export interface Target {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  isCompleted?: boolean;
}

export interface Village {
  id: string;
  name: string;
  mandalId: string;
  stage: VillageStage;
  shakhaData?: ShakhaData;
  specialty?: string;
  karyaDetails?: KaryaDetails;
  karyaPlan?: KaryaPlan;
  targets?: Target[];
}

export interface Mandal {
  id: string;
  name: string;
  khandId: string;
}

export interface Khand {
  id: string;
  name: string;
}

export interface VisitHistory {
  id: string;
  date: string;
  notes: string;
  nextFollowUp?: string;
}

export interface PreviousResponsibility {
  responsibility: string;
  year: string;
}

export interface SanghTraining {
  varg: string;
  year: string;
  location: string;
}

export interface VolunteerProfile {
  fatherName?: string;
  dob?: string;
  bloodGroup?: string;
  maritalStatus?: string;
  phone2?: string;
  email?: string;
  localAddress?: string;
  education?: string;
  profession?: string;
  officeDetails?: string;
  sanghEntryYear?: string;
  currentShakha?: string;
  currentResponsibility?: string;
  previousResponsibilitiesStr?: string;
  sanghTraining?: Array<{class: string, year: string, location: string}>;
  uniformStatus?: string; // पूर्ण, अपूर्ण, नहीं
  vehicle?: string; // दुपहिया, चौपहिया
  isPratijnyavan?: boolean;
  ghoshVadya?: string;
  specialSkills?: string;
  areasOfInterest?: string[];
  availability?: string[];
  otherDetails?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  khandId: string;
  mandalId: string;
  villageId: string;
  category: string; // Changed from Enum to string for dynamic support
  status: Status;
  lastVisited?: string;
  listIds: string[];
  history: VisitHistory[];
  volunteerProfile?: VolunteerProfile;
}

export interface TripScheduleItem {
  id: string;
  time: string;
  villageId: string;
  contactId: string;
}

export interface TripPlan {
  id: string;
  date: string;
  khandId: string;
  mandalId: string;
  villageIds: string[];
  peopleIds: string[];
  schedule?: TripScheduleItem[];
  notes: string;
  isCompleted: boolean;
}

export interface CustomList {
  id: string;
  name: string;
  peopleIds: string[];
  categoryId?: string;
  icon?: string;
}

export enum AttendanceStatus {
  COMING = 'आ रहे हैं',
  NOT_COMING = 'नहीं आ रहे',
  NOT_CONFIRMED = 'निश्चित नहीं',
  PENDING = 'लंबित'
}

export interface Category {
  id: string;
  name: string;
  icon: string; // Lucide icon name
  color?: string;
}

export interface Meeting {
  id: string;
  listId: string;
  title: string;
  date: string;
  location?: string;
  notes?: string;
  category: string;
  attendance: Record<string, AttendanceStatus>; // RSVP: volunteerId -> status
  presentPeopleIds: string[]; // Actual attendance
}

// ---- Role Based Access Control Models ---- //

export type Permission = 
  | 'manage_users'
  | 'manage_roles'
  | 'manage_areas' // Khand, Mandal, Village
  | 'manage_contacts'
  | 'manage_events'
  | 'view_reports'
  | 'manage_ideas';

export interface AppRole {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface AppUser {
  uid: string;
  email: string;
  displayName?: string;
  roleId: string | null;
  areaPermissions?: {
    khandIds: string[];
    mandalIds: string[];
    villageIds: string[];
  };
}
