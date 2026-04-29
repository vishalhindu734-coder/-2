import * as Icons from 'lucide-react';
import React from 'react';

export const ICON_LIST = [
  'User', 'Users', 'UserCheck', 'UserPlus', 'UsersRound',
  'Home', 'Building2', 'Building', 'Warehouse', 'Landmark',
  'MapPin', 'Flag', 'Rocket', 'Map', 'Compass',
  'Star', 'Award', 'BadgeCheck', 'Heart', 'Smile',
  'MessageSquare', 'Phone', 'Mail', 'Bell', 'Calendar',
  'CalendarCheck', 'CheckCircle2', 'Clock', 'History', 'Zap',
  'Briefcase', 'GraduationCap', 'Book', 'Library', 'School',
  'Shield', 'Key', 'Lock', 'Unlock', 'KeyRound',
  'Camera', 'Image', 'Video', 'Music', 'Mic',
  'Laptop', 'Smartphone', 'Tablet', 'Tv', 'Speaker',
  'ShoppingBag', 'ShoppingCart', 'CreditCard', 'Banknote', 'Coins',
  'Gift', 'PartyPopper', 'Cake', 'Coffee', 'Utensils',
  'Globe', 'Navigation', 'Tent', 'Plane', 'Train',
  'Bus', 'Car', 'Bike', 'Truck', 'Anchor',
  'Sun', 'Moon', 'Cloud', 'CloudRain', 'Wind',
  'Leaf', 'TreePine', 'Sprout', 'Flower2', 'Wind',
  'Search', 'Settings', 'Trash2', 'Edit2', 'Plus',
  'Filter', 'List', 'Menu', 'LayoutGrid', 'Table',
  'ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'ChevronRight',
  'Info', 'AlertCircle', 'AlertTriangle', 'HelpCircle', 'MoreHorizontal',
  'Activity', 'Fingerprint', 'Stethoscope', 'HeartPulse', 'Thermometer',
  'Hammer', 'Wrench', 'Pickaxe', 'Scissors', 'PenTool',
  'Lightbulb', 'BookOpen', 'Check', 'X', 'Ban',
  'Hash', 'AtSign', 'Link', 'Dna', 'Atom',
  'Anchor', 'Angry', 'Annoyed', 'Aperture', 'Apple',
  'Archive', 'Armchair', 'ArrowBigDown', 'ArrowBigLeft', 'ArrowBigRight',
  'ArrowBigUp', 'Asterisk', 'Axe', 'Baby', 'Backpack',
  'BaggageClaim', 'Banana', 'Banknote', 'Barcode', 'Baseline',
  'Bath', 'Battery', 'BatteryCharging', 'BatteryFull', 'BatteryLow',
  'BatteryMedium', 'BatteryWarning', 'Beaker', 'Bean', 'BeanOff',
  'Handshake', 'HeartHandshake', 'Network', 'Siren', 'Megaphone',
  'FlagTriangleRight', 'Crown', 'Medal', 'ScrollText', 'Newspaper',
  'Mic2', 'Volume2', 'Radio', 'Wifi', 'Layers',
  'HardDrive', 'FileText', 'FolderOpen', 'Milestone', 'Trophy',
  'Target', 'Gavel', 'Scale', 'Hand', 'HelpingHand',
  'Puzzle', 'Combine', 'GitBranch', 'GitPullRequest', 'Orbit',
  'Component', 'Shapes', 'Boxes', 'Package', 'LifeBuoy',
  'ShieldCheck', 'Eye', 'BrainCircuit', 'Timer', 'Hourglass',
  'Inbox', 'Send', 'Share2', 'ExternalLink', 'Monitor',
  'Cpu', 'Database', 'CloudUpload', 'Download', 'UserRoundCheck',
  'UserRoundX', 'Ear', 'Glasses', 'Syringe', 'Umbrella',
  'Mountain', 'Sunset', 'Sunrise', 'Plug', 'Power',
  'Terminal', 'Code', 'Braces', 'Sigma', 'SquareFunction',
  'CircleDollarSign', 'Gem', 'Trello', 'Kanban', 'LayoutList',
  'Workflow', 'Factory', 'Castle', 'Church', 'Infinity',
  'Lamp', 'Flashlight', 'Droplets', 'Flame', 'Waves', 'Maximize', 'Minimize'
];

export const WhatsappIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M11.996 0A12.001 12.001 0 0 0 0 11.996c0 2.126.549 4.195 1.595 6.002L.002 24l6.155-1.614A11.96 11.96 0 0 0 11.996 24C18.625 24 24 18.625 24 11.996 24 5.367 18.625 0 11.996 0Zm6.565 17.15c-.297.838-1.464 1.545-2.227 1.637-.698.086-1.527.135-2.28-.112-.663-.217-1.428-.485-2.302-.917-1.127-.557-2.348-1.396-3.414-2.46-1.066-1.065-1.93-2.285-2.486-3.414-.43-.873-.699-1.638-.916-2.3-.244-.75-.195-1.576-.11-2.274.091-.762.793-1.928 1.632-2.227.18-.063.376-.098.577-.098.24 0 .47.054.675.155.3.15.54.428.694.755.197.42.438.983.69 1.596.223.543.468 1.155.602 1.488.169.421.139.81-.073 1.154-.117.188-.235.342-.352.483-.119.141-.238.282-.361.436-.215.268-.445.556-.251.895.53 1.054 1.118 1.938 1.748 2.568.629.63 1.503 1.218 2.558 1.748.337.192.624.084.894-.132.155-.125.295-.245.437-.361.14-.118.293-.24.482-.353.344-.212.733-.241 1.154-.073.332.133.945.378 1.488.601.611.251 1.171.492 1.593.689.327.153.606.39.754.69.1.205.154.434.154.674 0 .201-.033.395-.098.574Z" />
  </svg>
);

export const LucideIcon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return null;
  return <IconComponent size={size} className={className} />;
};
