import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Home',
};

export default function Page() { 
    redirect('/login');
}
