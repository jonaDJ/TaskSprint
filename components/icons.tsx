import type { SVGProps } from "react";

function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
}

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M6 2v4M18 2v4M3 9h18"/><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></Icon>;
export const CheckIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m5 12 4 4L19 6"/></Icon>;
export const ChevronLeft = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m15 18-6-6 6-6"/></Icon>;
export const ChevronRight = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m9 18 6-6-6-6"/></Icon>;
export const PlusIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
export const MoreIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></Icon>;
export const XIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m6 6 12 12M18 6 6 18"/></Icon>;
export const TrashIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M4 7h16M9 11v6M15 11v6M6 7l1 14h10l1-14M9 7V4h6v3"/></Icon>;
export const PencilIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z"/><path d="m14.5 6.7 2.8 2.8"/></Icon>;
export const ClockIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
export const GridIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></Icon>;
export const TargetIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></Icon>;
export const ChartIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></Icon>;
export const HabitIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M12 22c4.4 0 7-3.1 7-7.2 0-3.5-2.2-6.4-5.3-9.3.1 2.5-1.1 4.1-2.5 5.1.1-3.6-1.7-6.5-3.8-8.6.1 4.5-2.4 6.3-2.4 10.8C5 18 7.9 22 12 22Z"/><path d="M9.5 17.5c0-1.7 1-3 2.6-4.5.1 1.5.9 2.3 1.8 3.2.6.6.8 1.2.8 1.8 0 1.6-1.2 3-2.7 3s-2.5-1.5-2.5-3.5Z"/></Icon>;
export const SprintIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z"/></Icon>;
export const LogOutIcon = (p: SVGProps<SVGSVGElement>) => <Icon {...p}><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></Icon>;
