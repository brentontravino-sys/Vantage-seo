import React from 'react';
import { Button } from '@/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { vizion } from '@/api/vizionClient';
import { User, Bell, Shield, CreditCard, LogOut, Key, Palette } from 'lucide-react';
import PageHeader from '@/ui/PageHeader';

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Account" title="Settings" description="Manage your profile, notifications, security, and appearance." />

      <div className="space-y-6">
        {/* Profile */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Profile</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Email</span>
              <span className="text-sm text-white">{user?.email || '—'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-400">Name</span>
              <span className="text-sm text-white">{user?.name || '—'}</span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Notifications</h3>
          </div>
          <p className="text-sm text-neutral-400">Notification preferences coming soon.</p>
        </div>

        {/* Security */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Key className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Security</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">Change password and manage 2FA.</p>
          <Button variant="outline" className="border-lime-300/30 text-lime-200 hover:bg-lime-300/10">
            Change password
          </Button>
        </div>

        {/* Appearance */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <Palette className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Appearance</h3>
          </div>
          <p className="text-sm text-neutral-400">Theme is controlled from the sidebar toggle.</p>
        </div>

        {/* Billing */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <CreditCard className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Billing & subscription</h3>
          </div>
          <p className="text-sm text-neutral-400 mb-4">View your plan, billing history, and manage payments.</p>
          <Button variant="outline" className="border-lime-300/30 text-lime-200 hover:bg-lime-300/10">
            Manage subscription
          </Button>
        </div>

        {/* Sign out */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="w-5 h-5 text-lime-300" />
            <h3 className="text-white font-semibold">Session</h3>
          </div>
          <Button
            variant="outline"
            className="border-rose-300/30 text-rose-200 hover:bg-rose-300/10"
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
