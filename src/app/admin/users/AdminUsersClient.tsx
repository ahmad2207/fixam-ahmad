'use client';

import { useState } from 'react';
import { Shield, ShieldCheck, ShieldX, Search, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  fullName: string | null;
  email: string | null;
  createdAt: string;
  roles: string[];
}

interface Props {
  users: UserRow[];
  adminCount: number;
  customerCount: number;
}

export default function AdminUsersClient({ users: initial, adminCount, customerCount }: Props) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const filtered = users.filter((u) =>
    (u.fullName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const grantAdmin = async (userId: string) => {
    setLoading(true);
    const res = await fetch('/api/admin/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'admin' }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: [...u.roles, 'admin'] } : u));
      toast.success('Admin access granted');
    } else {
      toast.error('Failed to grant admin access');
    }
    setLoading(false);
  };

  const revokeAdmin = async (userId: string) => {
    if (!confirm('Revoke admin access from this user?')) return;
    setLoading(true);
    const res = await fetch('/api/admin/users/roles', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: 'admin' }),
    });
    if (res.ok) {
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, roles: u.roles.filter((r) => r !== 'admin') } : u));
      toast.success('Admin access revoked');
    } else {
      toast.error('Failed to revoke admin access');
    }
    setLoading(false);
  };

  const addAdminByEmail = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/users/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newAdminEmail, role: 'admin' }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => u.id === updated.userId ? { ...u, roles: [...u.roles, 'admin'] } : u));
      toast.success('Admin access granted');
      setNewAdminEmail('');
      setShowAddDialog(false);
    } else {
      const data = await res.json();
      toast.error(data.error ?? 'Failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{users.length} registered users</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Users',     value: users.length,   icon: Shield,      color: 'bg-primary/10 text-primary',       border: 'border-primary/15' },
          { label: 'Administrators',  value: adminCount,     icon: ShieldCheck, color: 'bg-emerald-50 text-emerald-600',   border: 'border-emerald-100' },
          { label: 'Customers',       value: customerCount,  icon: ShieldX,     color: 'bg-muted text-muted-foreground',   border: 'border-border' },
        ].map(({ label, value, icon: Icon, color, border }) => (
          <div key={label} className={`bg-card rounded-2xl p-5 border shadow-sm ${border}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                <p className="text-2xl font-bold text-foreground mt-1 leading-none">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-border bg-muted/20">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-background"
            />
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm shadow-primary/20"
          >
            <UserPlus className="h-4 w-4" />
            Add Admin
          </button>
        </div>

        {/* Add Dialog */}
        {showAddDialog && (
          <div className="p-4 bg-primary/5 border-b border-border flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">User Email</label>
              <input
                type="email"
                placeholder="Enter user's email…"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="mt-1.5 w-full border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background"
              />
              <p className="text-xs text-muted-foreground mt-1">User must have signed up already.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addAdminByEmail}
                disabled={!newAdminEmail || loading}
                className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition disabled:opacity-50"
              >
                Grant Access
              </button>
              <button
                onClick={() => setShowAddDialog(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-border hover:bg-secondary transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Roles</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Joined</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((user) => (
                <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${user.roles.includes('admin') ? 'bg-primary/10' : 'bg-muted'}`}>
                        <span className={`text-sm font-bold ${user.roles.includes('admin') ? 'text-primary' : 'text-muted-foreground'}`}>
                          {(user.fullName ?? user.email ?? '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{user.fullName ?? 'Unknown'}</p>
                        {user.email && <p className="text-xs text-muted-foreground">{user.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span
                          key={role}
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                            role === 'admin'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : 'bg-muted text-muted-foreground border-border'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-sm">
                    {new Date(user.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {user.roles.includes('admin') ? (
                      <button
                        onClick={() => revokeAdmin(user.id)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 text-xs text-destructive border border-destructive/20 bg-destructive/5 px-3 py-1.5 rounded-lg hover:bg-destructive/10 transition ml-auto disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => grantAdmin(user.id)}
                        disabled={loading}
                        className="inline-flex items-center gap-1.5 text-xs text-primary border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-lg hover:bg-primary/10 transition ml-auto disabled:opacity-50"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        Make Admin
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
