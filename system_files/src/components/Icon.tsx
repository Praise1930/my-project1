// MamaTrack GPS — Named icons
//
// One lookup for every pictogram in the interface. The dashboards previously
// used emoji, which render as a different cartoon on every platform (Apple,
// Google and Windows all draw an ambulance differently) and cannot be recoloured
// or aligned to the surrounding text. These are line icons that inherit
// currentColor and sit on the text baseline.
//
//   <Icon name="ambulance" />
//   <Icon name="emergency" size={22} />

import React from 'react';
import {
  Activity, Ambulance, AlertTriangle, ArrowLeft, Baby, BarChart3, BedDouble,
  BookOpen, Bot, Building2, Calendar, CheckCircle2, ChevronRight, CircleDot,
  ClipboardList, Droplet, FileText, Fuel, Hand, Heart, Hospital, House,
  KeyRound, LifeBuoy, Map as MapIcon, MapPin, Megaphone, Menu, MessageSquare,
  Moon, Navigation, Pencil, Phone, Plus, RadioTower, RefreshCw, Rocket, Satellite,
  Scissors, Search, Shield, SignalHigh, Siren, Sparkles, Star, Stethoscope, Sun,
  Trash2, TrendingUp, User, UserRound, Users, Wrench, X, XCircle, Zap,
} from 'lucide-react';

export type IconName =
  | 'ambulance' | 'doctor' | 'warning' | 'emergency' | 'success' | 'mother'
  | 'baby' | 'clipboard' | 'hospital' | 'online' | 'phone' | 'close' | 'failed'
  | 'edit' | 'calendar' | 'trend' | 'sos' | 'menu' | 'fast' | 'add' | 'delete'
  | 'key' | 'critical' | 'breastfeeding' | 'location' | 'blood' | 'chart'
  | 'signal' | 'search' | 'map' | 'woman' | 'vht' | 'home' | 'chat' | 'bed'
  | 'notes' | 'star' | 'pending' | 'man' | 'child' | 'launch' | 'shield'
  | 'refresh' | 'back' | 'heart' | 'announce' | 'wave' | 'book' | 'sparkle'
  | 'tools' | 'fuel' | 'satellite' | 'network' | 'surgery' | 'facility'
  | 'moon' | 'sun' | 'assistant' | 'profile' | 'people' | 'vitals'
  | 'navigate' | 'next';

const ICONS: Record<IconName, React.ComponentType<{ size?: number | string; strokeWidth?: number | string; className?: string }>> = {
  ambulance: Ambulance,
  doctor: Stethoscope,
  warning: AlertTriangle,
  emergency: Siren,
  success: CheckCircle2,
  mother: UserRound,
  baby: Baby,
  clipboard: ClipboardList,
  hospital: Hospital,
  online: CircleDot,
  phone: Phone,
  close: X,
  failed: XCircle,
  edit: Pencil,
  calendar: Calendar,
  trend: TrendingUp,
  sos: LifeBuoy,
  menu: Menu,
  fast: Zap,
  add: Plus,
  delete: Trash2,
  key: KeyRound,
  critical: AlertTriangle,
  breastfeeding: Baby,
  location: MapPin,
  blood: Droplet,
  chart: BarChart3,
  signal: RadioTower,
  search: Search,
  map: MapIcon,
  woman: UserRound,
  vht: RadioTower,
  home: House,
  chat: MessageSquare,
  bed: BedDouble,
  notes: FileText,
  star: Star,
  pending: CircleDot,
  man: User,
  child: Baby,
  launch: Rocket,
  shield: Shield,
  refresh: RefreshCw,
  back: ArrowLeft,
  heart: Heart,
  announce: Megaphone,
  wave: Hand,
  book: BookOpen,
  sparkle: Sparkles,
  tools: Wrench,
  fuel: Fuel,
  satellite: Satellite,
  network: SignalHigh,
  surgery: Scissors,
  facility: Building2,
  moon: Moon,
  sun: Sun,
  assistant: Bot,
  profile: User,
  people: Users,
  vitals: Activity,
  navigate: Navigation,
  next: ChevronRight,
};

interface IconProps {
  name: IconName | string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** Set when the icon carries meaning no adjacent text already conveys. */
  label?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 18,
  strokeWidth = 1.75,
  className,
  label,
}) => {
  const Glyph = ICONS[name as IconName];
  if (!Glyph) return null;

  return (
    <span
      className={className}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: '-0.15em', flex: 'none' }}
    >
      <Glyph size={size} strokeWidth={strokeWidth} />
    </span>
  );
};
