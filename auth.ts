import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import type { User } from '@/app/lib/definitions';
import bcrypt from 'bcryptjs';
import { prisma } from '@/app/lib/prisma';

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user.');
  } finally {
    await prisma.$disconnect();
  }
}

export const { auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({ email: z.string().email(), password: z.string().min(6) })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user as User;
        }
        console.error('Invalid credentials');
        return null;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 外部リンクの場合はそのままリダイレクト
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // 内部リンクの場合は /home にリダイレクト
      return '/home';
    },
  },
});