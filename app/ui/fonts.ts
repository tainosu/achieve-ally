import { Inter, Lusitana, Zen_Maru_Gothic } from 'next/font/google';

export const inter = Inter({ subsets: ['latin'] });
export const zenMaruGothic = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['400'],
});
export const zenMaruGothicBold = Zen_Maru_Gothic({
  subsets: ['latin'],
  weight: ['700'],
  variable: '--font-zen-maru-gothic-bold',
});
export const lusitana = Lusitana({ subsets: ['latin'], weight: ['400', '700'] });