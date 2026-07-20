import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, userRoles, profiles, accounts, sessions, verificationTokens } from '@/db/schema';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1)
          .then((r) => r[0]);

        if (!user?.hashedPassword) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.hashedPassword,
        );
        if (!valid) return null;

        // Fetch role
        const roleRow = await db
          .select()
          .from(userRoles)
          .where(eq(userRoles.userId, user.id))
          .limit(1)
          .then((r) => r[0]);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: roleRow?.role ?? 'customer',
        };
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  events: {
    async createUser({ user }) {
      // Fires when a new user is created via OAuth (e.g. Google).
      // Mirrors the Supabase trigger: automatically create profile + customer role.
      await db.insert(profiles).values({
        userId: user.id!,
        fullName: user.name ?? null,
        email: user.email ?? null,
      }).onConflictDoNothing();
      await db.insert(userRoles).values({
        userId: user.id!,
        role: 'customer',
      }).onConflictDoNothing();
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // Credentials provider sets role directly; OAuth providers don't — fetch from DB
        if ((user as any).role) {
          token.role = (user as any).role;
        } else {
          const roleRow = await db
            .select()
            .from(userRoles)
            .where(eq(userRoles.userId, user.id!))
            .limit(1)
            .then((r) => r[0]);
          token.role = roleRow?.role ?? 'customer';
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
