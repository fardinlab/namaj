export interface Member {
  id: string;
  name: string;
  phone?: string;
  photo?: string; // base64 encoded image (max 100KB)
  createdAt: string;
}

export interface AttendanceRecord {
  memberId: string;
  date: string; // YYYY-MM-DD format
  prayers: {
    fajr: boolean;
    zuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
  };
}

export interface CampaignConfig {
  startDate: string;
  endDate: string;
  streakTarget: number;
}

export type PrayerName = 'fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha';

export const PRAYER_NAMES: Record<PrayerName, string> = {
  fajr: 'ফজর',
  zuhr: 'যোহর',
  asr: 'আসর',
  maghrib: 'মাগরিব',
  isha: 'এশা',
};

export const DEFAULT_CAMPAIGN_CONFIG: CampaignConfig = {
  startDate: '2026-02-04',
  endDate: '2026-03-25',
  streakTarget: 41,
};
