import {
  Award, Briefcase, Building2, Factory, Flag, Globe2, Landmark, Plane, Scale, Star, TrendingUp, Users,
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
};
