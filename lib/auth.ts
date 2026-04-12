import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getDb, getUserByEmail } from '@/lib/db';

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is required.');
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const db = getDb();
        const user = getUserByEmail(db, credentials.email);
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          is_admin: Boolean(user.is_admin),
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = Number((user as { id: string }).id);
        token.is_admin = (user as unknown as { is_admin: boolean }).is_admin;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.is_admin = token.is_admin;
      return session;
    },
  },
  pages: { signIn: '/login' },
};
