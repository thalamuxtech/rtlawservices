import {
  Award, BookOpen, Briefcase, Building2, CalendarClock, Factory, FileSearch, Flag, Globe2, GraduationCap, HeartHandshake, House, IdCard,
  Landmark, Plane, Scale, ShieldCheck, Star, Tent, TrendingUp, Umbrella, Users,
  type LucideIcon,
} from "lucide-react";
import type { Expertise } from "@/content/expertise";

export const EXPERTISE_ICONS: Record<Expertise["icon"], LucideIcon> = {
  users: Users,
  flag: Flag,
  briefcase: Briefcase,
  scale: Scale,
  globe: Globe2,
  star: Star,
  award: Award,
  building: Building2,
  plane: Plane,
  trending: TrendingUp,
  factory: Factory,
  landmark: Landmark,
  shield: ShieldCheck,
  heart: HeartHandshake,
  umbrella: Umbrella,
  tent: Tent,
  calendar: CalendarClock,
  idcard: IdCard,
  house: House,
  graduation: GraduationCap,
  book: BookOpen,
  search: FileSearch,
};
