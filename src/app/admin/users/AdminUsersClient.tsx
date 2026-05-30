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
    <div>
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Users</p>
            <p className="text-2xl font-bold">{users.length}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Administrators</p>
            <p className="text-2xl font-bold">{adminCount}</p>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <ShieldX className="h-5 w-5 text-gray-500" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Customers</p>
            <p className="text-2xl font-bold">{customerCount}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-xl">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition"
          >
            <UserPlus className="h-4 w-4" />
            Add Admin
          </button>
        </div>

        {/* Add Dialog */}
        {showAddDialog && (
          <div className="p-4 bg-blue-50 border-b flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-600">User Email</label>
              <input
                type="email"
                placeholder="Enter user's email..."
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="mt-1 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">User must have signed up already.</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={addAdminByEmail}
                disabled={!newAdminEmail || loading}
                className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
              >
                Grant Access
              </button>
              <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 rounded-lg text-sm border hover:bg-white transition">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Roles</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${user.roles.includes('admin') ? 'bg-primary/10' : 'bg-gray-100'}`}>
                        <span className={`text-sm font-semibold ${user.roles.includes('admin') ? 'text-primary' : 'text-gray-500'}`}>
                          {(user.fullName ?? user.email ?? '?').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.fullName ?? 'Unknown'}</p>
                        {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map((role) => (
                        <span key={role} className={`text-xs px-2 py-0.5 rounded-full font-medium ${role === 'admin' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.roles.includes('admin') ? (
                      <button
                        onClick={() => revokeAdmin(user.id)}
                        disabled={loading}
                        className="flex items-center gap-1 text-xs text-red-600 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition ml-auto disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() => grantAdmin(user.id)}
                        disabled={loading}
                        className="flex items-center gap-1 text-xs text-primary border border-primary/30 px-3 py-1 rounded-lg hover:bg-primary/5 transition ml-auto disabled:opacity-50"
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
          {filtered.length === 0 && <div className="text-center py-10 text-gray-500">No users found.</div>}
        </div>
      </div>
    </div>
  );
}
