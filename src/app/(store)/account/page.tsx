'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Phone, Mail, MapPin, Plus, Pencil, Trash2, Check, LogOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Address {
  id: string;
  label: string | null;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  isDefault: boolean;
}

interface AddressForm {
  label: string;
  fullName: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  isDefault: boolean;
}

const EMPTY_ADDRESS: AddressForm = {
  label: 'Home',
  fullName: '',
  phone: '',
  streetAddress: '',
  city: '',
  state: '',
  isDefault: false,
};

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
        .then((data) => {
          setProfileForm({
            fullName: data.fullName || session?.user?.name || '',
            phone: data.phone || '',
          });
          setProfileLoaded(true);
        })
        .catch(() => {
          setProfileForm({ fullName: session?.user?.name || '', phone: '' });
          setProfileLoaded(true);
        });
    }

    fetch('/api/account/addresses')
      .then((r) => r.json())
      .then(setAddresses)
      .catch(() => {})
      .finally(() => setLoadingAddresses(false));
  }, [session, router, profileLoaded]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: profileForm.fullName, phone: profileForm.phone }),
      });
      if (!res.ok) throw new Error();
      await update({ name: profileForm.fullName });
      toast.success('Profile updated');
      setIsEditing(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const openAddressDialog = (address?: Address) => {
    if (address) {
      setEditingAddressId(address.id);
      setAddressForm({
        label: address.label || 'Home',
        fullName: address.fullName,
        phone: address.phone,
        streetAddress: address.streetAddress,
        city: address.city,
        state: address.state,
        isDefault: address.isDefault,
      });
    } else {
      setEditingAddressId(null);
      setAddressForm(EMPTY_ADDRESS);
    }
    setAddressDialogOpen(true);
  };

  const handleAddressSubmit = async () => {
    setSavingAddress(true);
    try {
      const url = editingAddressId ? `/api/account/addresses/${editingAddressId}` : '/api/account/addresses';
      const method = editingAddressId ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressForm),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (editingAddressId) {
        setAddresses((prev) => prev.map((a) => (a.id === editingAddressId ? data : a)));
        toast.success('Address updated');
      } else {
        setAddresses((prev) => [...prev, data]);
        toast.success('Address added');
      }
      setAddressDialogOpen(false);
    } catch {
      toast.error('Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast.success('Address deleted');
    }
  };

  const handleSetDefault = async (id: string) => {
    const res = await fetch(`/api/account/addresses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    if (res.ok) {
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
      toast.success('Default address updated');
    }
  };

  if (status === 'loading') return null;
  if (status === 'unauthenticated') {
    router.replace('/login?callbackUrl=/account');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-muted-foreground hover:text-destructive gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Profile Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Information
              </CardTitle>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="+234 800 000 0000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{session?.user?.email}</span>
                      <Badge variant="secondary" className="text-xs">Cannot change</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleSaveProfile} disabled={isSaving}>
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{profileForm.fullName || session?.user?.name || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{profileForm.phone || 'Not set'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{session?.user?.email}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Addresses Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Saved Addresses
              </CardTitle>
              <Dialog
                open={addressDialogOpen}
                onOpenChange={(open) => {
                  setAddressDialogOpen(open);
                  if (!open) { setEditingAddressId(null); setAddressForm(EMPTY_ADDRESS); }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={() => openAddressDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingAddressId ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={addressForm.label}
                        onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))}
                        placeholder="Home, Office, etc."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm((f) => ({ ...f, fullName: e.target.value }))}
                          placeholder="Jane Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm((f) => ({ ...f, phone: e.target.value }))}
                          placeholder="+234 800 000 0000"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Street Address</Label>
                      <Input
                        value={addressForm.streetAddress}
                        onChange={(e) => setAddressForm((f) => ({ ...f, streetAddress: e.target.value }))}
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>City</Label>
                        <Input
                          value={addressForm.city}
                          onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))}
                          placeholder="Lagos"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>State</Label>
                        <Input
                          value={addressForm.state}
                          onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))}
                          placeholder="Lagos"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isDefault"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((f) => ({ ...f, isDefault: e.target.checked }))}
                        className="accent-primary"
                      />
                      <Label htmlFor="isDefault" className="text-sm cursor-pointer">Set as default address</Label>
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleAddressSubmit}
                      disabled={!addressForm.fullName || !addressForm.streetAddress || !addressForm.city || !addressForm.state || savingAddress}
                    >
                      {savingAddress ? 'Saving...' : editingAddressId ? 'Update Address' : 'Add Address'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {loadingAddresses ? (
                <p className="text-sm text-muted-foreground">Loading addresses...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
              ) : (
                <div className="space-y-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className="flex items-start justify-between p-4 border border-border rounded-xl">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.label || addr.fullName}</span>
                          {addr.isDefault && (
                            <Badge variant="secondary" className="text-xs">Default</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{addr.fullName}</p>
                        <p className="text-muted-foreground">{addr.phone}</p>
                        <p className="text-muted-foreground">{addr.streetAddress}</p>
                        <p className="text-muted-foreground">{addr.city}, {addr.state}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!addr.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(addr.id)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Set Default
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openAddressDialog(addr)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Address?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this address from your account.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
