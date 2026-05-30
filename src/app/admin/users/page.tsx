export const dynamic = 'force-dynamic';

import { db } from '@/lib/db';
import { users, profiles, userRoles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Shield, ShieldCheck } from 'lucide-react';
import AdminUsersClient from './AdminUsersClient';

export default async function AdminUsersPage() {
  const allProfiles = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
  const allUsers = await db.select().from(users);
  const allRoles = await db.select().from(userRoles);

  const combined = allProfiles.map((profile) => {
    const user = allUsers.find((u) => u.id === profile.userId);
    const roles = allRoles.filter((r) => r.userId === profile.userId).map((r) => r.role);
    return {
      id: profile.userId,
      fullName: profile.fullName,
      email: user?.email ?? null,
      createdAt: profile.createdAt.toISOString(),
      roles,
    };
  });

  const adminCount = combined.filter((u) => u.roles.includes('admin')).length;
  const customerCount = combined.filter((u) => !u.roles.includes('admin')).length;

  return <AdminUsersClient users={combined} adminCount={adminCount} customerCount={customerCount} />;
}
