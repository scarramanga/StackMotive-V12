import React from "react";
import {
  CandlestickChart,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  CircleDollarSign,
  CreditCard,
  FileText,
  Globe,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  Loader2,
  Mail,
  Moon,
  Settings,
  SunMedium,
  User,
  Users,
  Wallet,
  AlertTriangle,
} from "lucide-react";
// Using simpler icons since we don't have the exact broker icons
import { FaBuilding, FaExchangeAlt } from "react-icons/fa";

export type IconProps = React.HTMLAttributes<SVGElement>;

export const Icons = {
  spinner: Loader2,
  sun: SunMedium,
  moon: Moon,
  user: User,
  dashboard: LayoutDashboard,
  settings: Settings,
  chart: LineChart,
  candlestick: CandlestickChart,
  dollar: CircleDollarSign,
  creditCard: CreditCard,
  mail: Mail,
  help: HelpCircle,
  check: CheckCircle2,
  warning: AlertTriangle,
  globe: Globe,
  chevronRight: ChevronRight,
  chevronLeft: ChevronLeft,
  users: Users,
  wallet: Wallet,
  fileText: FileText,
  
  // Broker icons using abstractions to avoid direct broker SVGs
  tiger: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  ibkr: (props: IconProps) => <FaBuilding {...props} />,
  kucoin: (props: IconProps) => <FaExchangeAlt {...props} />,
  kraken: (props: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 16v-3a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
      <path d="M12 16v2" />
      <circle cx="12" cy="12" r="10" />
      <path d="m9 8 1 1" />
      <path d="m14 8 1 1" />
      <path d="M9 12h6" />
    </svg>
  ),
};