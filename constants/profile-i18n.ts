import type { AppLanguage } from '@/types/profile';

const strings = {
  en: {
    profile: 'Profile',
    settings: 'Settings',
    myFarm: 'My Farm',
    subscription: 'Subscription',
    upgrade: 'Upgrade Plan',
    orders: 'My Orders',
    earnings: 'Earnings',
    logout: 'Logout',
    memberSince: 'Member since',
    cropsPlanted: 'Crops',
    forumPosts: 'Posts',
    editFarm: 'Edit Farm',
  },
  sn: {
    profile: 'Profile',
    settings: 'Zvirongwa',
    myFarm: 'Farm Yangu',
    subscription: 'Kunyoresa',
    upgrade: 'Simudzira Plan',
    orders: 'Maodha Angu',
    earnings: 'Mari Yakawanikwa',
    logout: 'Buda',
    memberSince: 'Nhengo kubva',
    cropsPlanted: 'Zvirimwa',
    forumPosts: 'Zvinyorwa',
    editFarm: 'Gadzirisa Farm',
  },
  nd: {
    profile: 'Iprofayili',
    settings: 'Izilungiselelo',
    myFarm: 'Ipulazi Lami',
    subscription: 'Ukubhalisa',
    upgrade: 'Thuthukisa Iplani',
    orders: 'Ama-oda Ami',
    earnings: 'Imali Etholakele',
    logout: 'Phuma',
    memberSince: 'Ilungu kusukela',
    cropsPlanted: 'Izitshalo',
    forumPosts: 'Okuthunyelwe',
    editFarm: 'Hlela Ipulazi',
  },
} as const;

export function t(key: keyof (typeof strings)['en'], lang: AppLanguage = 'en'): string {
  return strings[lang][key] ?? strings.en[key];
}
