'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, Mail, MapPin, Plus, Pencil, Trash2, Check,
  LogOut, Package, Heart, ChevronRight, CircleCheckBig,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const inputCls = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white placeholder:text-gray-400 transition-all';

interface Address {
  id: string; label: string | null; fullName: string; phone: string;
  streetAddress: string; city: string; state: string; isDefault: boolean;
}
interface AddressForm {
  label: string; fullName: string; phone: string;
  streetAddress: string; city: string; state: string; isDefault: boolean;
}
const EMPTY_ADDRESS: AddressForm = { label: 'Home', fullName: '', phone: '', streetAddress: '', city: '', state: '', isDefault: false };

export default function AccountPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({ fullName: '', phone: '' });
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressForm>(EMPTY_ADDRESS);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!session?.user) { router.push('/login'); return; }
    if (!profileLoaded) {
      fetch('/api/account/profile')
        .then((r) => r.json())
        .then((d) => { setProfileForm({ fullName: d.fullName || session?.user?.name || '', phone: d.phone || '' }); setProfileLoaded(true); })
        .catch(() => { setProfileForm({ fullName: session?.user?.name || '', phone: '' }); setProfileLoaded(true); });
    }
    fetch('/api/account/addresses').then((r) => r.json()).then(setAddresses).catch(() => {}).finally(() => setLoadingAddresses(false));
  }, [session, router, profileLoaded]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) });
      if (!res.ok) throw new Error();
      await update({ name: profileForm.fullName });
      toast.success('Profile updated');
      setIsEditing(false);
    } catch { toast.error('Failed to update profile'); }
    finally { setIsSaving(false); }
  };

  const openAddressDialog = (address?: Address) => {
    if (address) { setEditingAddressId(address.id); setAddressForm({ label: address.label || 'Home', fullName: address.fullName, phone: address.phone, streetAddress: address.streetAddress, city: address.city, state: address.state, isDefault: address.isDefault }); }
    else { setEditingAddressId(null); setAddressForm(EMPTY_ADDRESS); }
    setAddressDialogOpen(true);
  };

  const handleAddressSubmit = async () => {
    setSavingAddress(true);
    try {
      const url = editingAddressId ? `/api/account/addresses/${editingAddressId}` : '/api/account/addresses';
      const res = await fetch(url, { method: editingAddressId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addressForm) });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAddresses((prev) => editingAddressId ? prev.map((a) => a.id === editingAddressId ? data : a) : [...prev, data]);
      toast.success(editingAddressId ? 'Address updated' : 'Address added');
      setAddressDialogOpen(false);
    } catch { toast.error('Failed to save address'); }
    finally { setSavingAddress(false); }
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) { setAddresses((prev) => prev.filter((a) => a.id !== id)); toast.success('Address deleted'); }
  };

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isDefault: true }) });
    if (res.ok) { setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id }))); toast.success('Default address set'); }
  };

  if (status === 'loading') return null;
  if (status === 'unauthenticated') { router.replace('/login?callbackUrl=/account'); return null; }

  const initials = (profileForm.fullName || session?.user?.name || 'U').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-primary">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold">My Account</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 items-start">

          {/* ── SIDEBAR ── */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Avatar */}
            <div className="bg-gradient-to-br from-primary/10 to-orange-50 px-5 py-6 text-center border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-xl font-black mx-auto mb-3 shadow-md">
                {session?.user?.image ? (
                  <Image src={session.user.image} alt="" width={64} height={64} className="rounded-full" />
                ) : initials}
              </div>
              <p className="font-extrabold text-sm text-gray-900 truncate">{profileForm.fullName || session?.user?.name || 'My Account'}</p>
              <p className="text-xs text-gray-500 truncate mt-0.5">{session?.user?.email}</p>
            </div>

            {/* Nav links */}
            <nav className="p-2">
              {[
                { icon: User,    label: 'Profile',    href: '/account',  active: true },
                { icon: Package, label: 'My Orders',  href: '/orders',   active: false },
                { icon: Heart,   label: 'Wishlist',   href: '/wishlist', active: false },
              ].map(({ icon: Icon, label, href, active }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    active ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                  {active && <ChevronRight className="h-3.5 w-3.5 ml-auto" />}
                </Link>
              ))}
              <div className="h-px bg-gray-100 my-2" />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                Sign Out
              </button>
            </nav>
          </div>

          {/* ── MAIN CONTENT ── */}
          <div className="space-y-4">

            {/* Personal Info */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Personal Information
                </h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                    <input value={profileForm.fullName} onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Your full name" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Phone Number</label>
                    <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234 800 000 0000" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Email</label>
                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-500">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{session?.user?.email}</span>
                      <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full font-bold ml-auto flex-shrink-0">Read-only</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="flex-1 h-10 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50">
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="flex-1 h-10 border-2 border-gray-200 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { icon: User,  label: 'Full Name',  value: profileForm.fullName || session?.user?.name || '—' },
                    { icon: Phone, label: 'Phone',      value: profileForm.phone || '—' },
                    { icon: Mail,  label: 'Email',      value: session?.user?.email ?? '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Saved Addresses */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-extrabold text-gray-900 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  Saved Addresses
                </h2>
                <Dialog
                  open={addressDialogOpen}
                  onOpenChange={(open) => { setAddressDialogOpen(open); if (!open) { setEditingAddressId(null); setAddressForm(EMPTY_ADDRESS); } }}
                >
                  <DialogTrigger asChild>
                    <button onClick={() => openAddressDialog()} className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                      <Plus className="h-3.5 w-3.5" />
                      Add Address
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle className="font-extrabold">{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Label</label>
                        <input value={addressForm.label} onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))} placeholder="Home, Office…" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                          <input value={addressForm.fullName} onChange={(e) => setAddressForm((f) => ({ ...f, fullName: e.target.value }))} placeholder="Jane Doe" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Phone</label>
                          <input type="tel" value={addressForm.phone} onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))} placeholder="08012345678" className={inputCls} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">Street Address</label>
                        <input value={addressForm.streetAddress} onChange={(e) => setAddressForm((f) => ({ ...f, streetAddress: e.target.value }))} placeholder="123 Main Street" className={inputCls} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">City</label>
                          <input value={addressForm.city} onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))} placeholder="Lagos" className={inputCls} />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">State</label>
                          <input value={addressForm.state} onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))} placeholder="Lagos" className={inputCls} />
                        </div>
                      </div>
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input type="checkbox" checked={addressForm.isDefault} onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))} className="accent-primary w-4 h-4" />
                        <span className="text-sm font-semibold text-gray-700">Set as default address</span>
                      </label>
                      <button
                        onClick={handleAddressSubmit}
                        disabled={!addressForm.fullName || !addressForm.streetAddress || !addressForm.city || !addressForm.state || savingAddress}
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                      >
                        {savingAddress ? 'Saving…' : editingAddressId ? 'Update Address' : 'Add Address'}
                      </button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {loadingAddresses ? (
                <p className="text-sm text-gray-400 py-4 text-center">Loading addresses…</p>
              ) : addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No saved addresses yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Add one to speed up checkout.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`rounded-xl border-2 p-4 ${addr.isDefault ? 'border-primary/30 bg-primary/5' : 'border-gray-100 bg-gray-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm text-gray-800">{addr.label || 'Address'}</span>
                            {addr.isDefault && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                <CircleCheckBig className="h-2.5 w-2.5" /> Default
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {addr.fullName} · {addr.phone}<br />
                            {addr.streetAddress}<br />
                            {addr.city}, {addr.state}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!addr.isDefault && (
                            <button onClick={() => handleSetDefault(addr.id)} className="text-[10px] font-bold text-primary hover:underline px-2 py-1 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Default
                            </button>
                          )}
                          <button onClick={() => openAddressDialog(addr)} className="w-8 h-8 rounded-lg hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button className="w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete this address?</AlertDialogTitle>
                                <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAddress(addr.id)} className="bg-red-500 hover:bg-red-600 text-white">Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="bg-white rounded-2xl shadow-sm p-5">
              <h2 className="font-extrabold text-gray-900 mb-3">Quick Links</h2>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/orders" className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-orange-50 rounded-xl transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Package className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">My Orders</p>
                    <p className="text-xs text-gray-500">Track & view</p>
                  </div>
                </Link>
                <Link href="/wishlist" className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-red-50 rounded-xl transition-colors group">
                  <div className="w-9 h-9 rounded-lg bg-red-50 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Heart className="h-4 w-4 text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">Wishlist</p>
                    <p className="text-xs text-gray-500">Saved items</p>
                  </div>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
