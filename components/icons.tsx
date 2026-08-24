type IconProps = { size?: number };

const iconProps = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const IconDashboard = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>
);
export const IconClients = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><circle cx="9" cy="8" r="3.25" /><path d="M3.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6" /><circle cx="17" cy="8.5" r="2.5" /><path d="M15.7 14.2c2.6.4 4.5 2.7 4.8 5.8" /></svg>
);
export const IconLoans = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="2.5" y="5" width="19" height="14" rx="2.2" /><path d="M2.5 9.5h19" /><path d="M6 14.5h5" /></svg>
);
export const IconPayments = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 9v.01M18 15v.01" /></svg>
);
export const IconReports = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2.5 20h19" /></svg>
);
export const IconAdmin = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.4-2-3.4-2.3.9a7.7 7.7 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.6a7.7 7.7 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.4a7.6 7.6 0 0 0 0 3l-2 1.4 2 3.4 2.3-.9c.76.66 1.64 1.17 2.6 1.5l.5 2.6h4l.5-2.6a7.7 7.7 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.4Z" /></svg>
);
export const IconCheck = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M4 12.5 9.5 18 20 6" /></svg>
);
export const IconAlert = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M12 3 2 20h20L12 3Z" /><path d="M12 10v4.5M12 17.5v.01" /></svg>
);
export const IconInbox = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M3.5 12.5h5l1.6 2.5h3.8l1.6-2.5h5" /><path d="M5.2 6.5 3.5 12.5V18a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-5.5l-1.7-6a2 2 0 0 0-1.9-1.4H7.1a2 2 0 0 0-1.9 1.4Z" /></svg>
);
export const IconLogout = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" /></svg>
);
export const IconEye = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
export const IconEyeOff = ({ size = 18 }: IconProps) => (
  <svg {...iconProps(size)}><path d="M3 3l18 18" /><path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.7 6.7C4 8.5 2 12 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4.3-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></svg>
);
