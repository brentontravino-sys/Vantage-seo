import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { vizion } from '@/api/vizionClient';
import useProjects from '@/hooks/useProjects';
import {
  LayoutDashboard, Search, Activity, Link2, TrendingUp, FileText,
  LogOut, Menu, X, Radar, Compass, GitCompare, BarChart3, PieChart as PieChartIcon,
  Sun, Moon, ChevronDown, ChevronRight, ChevronLeft, User, Settings, Zap, Globe, Plus
} from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { Button } from '@/ui/button';
import { cn } from '@/lib/utils';

// ── Tooltip (lightweight, no external dep) ─────────────────────────────────
function Tooltip({ label, side = 'right', children }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span
          className={cn(
            'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-lg ring-1 ring-white/10',
            side === 'right' && 'left-full ml-2 top-1/2 -translate-y-1/2',
            side === 'top' && 'bottom-full mb-2 left-1/2 -translate-x-1/2'
          )}
        >
          {label}
        </span>
      )}
    </span>
  );
}

// ── Sidebar rail item (icon only; hover reveals label) ──────────────────────
function RailItem({ icon: Icon, label, active, onClick, indent = false }) {
  return (
    <Tooltip label={label}>
      <button
        onClick={onClick}
        className={cn(
          'group/rail relative flex h-11 w-11 items-center justify-center rounded-xl transition-colors',
          active
            ? 'bg-lime-300/15 text-lime-300 ring-1 ring-lime-300/30'
            : 'text-neutral-400 hover:bg-white/5 hover:text-white'
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
      </button>
    </Tooltip>
  );
}

// ── Expandable group flyout (click rail item → reveals children) ─────────────
function GroupFlyout({ group, onClose }) {
  return (
    <div className="absolute left-[68px] top-0 z-50 w-60 rounded-xl border border-white/10 bg-neutral-950/95 p-2 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{group.label}</span>
        <button onClick={onClose} className="text-neutral-500 hover:text-white">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="mt-1 space-y-0.5">
        {group.items.map(({ to, label, icon: Icon, exact }) => (
          <NavLink key={to} to={to} label={label} icon={Icon} exact={exact} onNavigate={onClose} />
        ))}
      </div>
    </div>
  );
}

function NavLink({ to, label, icon: Icon, exact, onNavigate }) {
  const { pathname } = useLocation();
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        active ? 'bg-lime-300/10 text-lime-200' : 'text-neutral-300 hover:bg-white/5 hover:text-white'
      )}
    >
      {Icon && <Icon className="h-4 w-4 shrink-0" />}
      <span>{label}</span>
    </Link>
  );
}

// ── Profile / user block ────────────────────────────────────────────────────
function UserProfile({ user, compact }) {
  const { logout } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  if (compact) {
    return (
      <Tooltip label={user?.name || user?.email || 'User'} side="top">
        <button
          onClick={logout}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-300/20 text-sm font-semibold text-lime-200 ring-1 ring-white/10"
          title="Sign out"
        >
          {initials}
        </button>
      </Tooltip>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5 ring-1 ring-white/5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime-300/20">
        <span className="text-sm font-semibold text-lime-200">{initials}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{user?.name || user?.email || 'User'}</p>
        <p className="truncate text-xs text-neutral-500">{user?.email || ''}</p>
      </div>
      <button onClick={logout} className="text-neutral-500 transition-colors hover:text-white" title="Sign out">
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

// ── Project selector (compact, for rail) ────────────────────────────────────
function ProjectSelectorCompact({ projects, activeId, onSelect }) {
  const activeProject = projects.find(p => p.id === activeId);
  if (!projects.length) {
    return (
      <Tooltip label="Add project">
        <Link to="/?addProject=1" className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-300/10 text-lime-300 ring-1 ring-lime-300/20">
          <Plus className="h-5 w-5" />
        </Link>
      </Tooltip>
    );
  }
  return (
    <Tooltip label={activeProject?.domain || projects[0]?.domain}>
      <Link to="/" className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/5 text-lime-300 ring-1 ring-white/10">
        <Globe className="h-5 w-5 shrink-0" />
      </Link>
    </Tooltip>
  );
}

// ── Navigation model (flat rail + grouped flyouts) ──────────────────────────
const RAIL_ORDER = [
  { key: 'home', icon: LayoutDashboard, label: 'Dashboard', to: '/', exact: true },
  { key: 'explorer', icon: Compass, label: 'Site Explorer', to: '/explorer' },
  { key: 'keywords', icon: Search, label: 'Keyword Research', to: '/keywords' },
  { key: 'rank', icon: TrendingUp, label: 'Position Tracking', to: '/rank-tracker' },
  { key: 'audit', icon: Activity, label: 'Site Audit', to: '/site-audit' },
  { key: 'backlinks', icon: Link2, label: 'Backlinks', to: '/backlinks' },
  { key: 'traffic', icon: BarChart3, label: 'Traffic Analytics', to: '/traffic-analytics' },
  { key: 'market', icon: PieChartIcon, label: 'Market Overview', to: '/market-overview' },
  { key: 'compare', icon: GitCompare, label: 'Compare Domains', to: '/compare' },
  { key: 'reports', icon: FileText, label: 'Reports', to: '/reports' },
];

const GROUPS = [
  {
    key: 'marketing',
    label: 'Marketing & Content',
    icon: Zap,
    items: [
      { to: '/campaigns', label: 'Campaigns', icon: Zap },
      { to: '/content', label: 'Content Ideas', icon: Search },
      { to: '/competitors', label: 'Competitors', icon: GitCompare },
    ],
  },
  {
    key: 'social',
    label: 'Social',
    icon: BarChart3,
    items: [
      { to: '/social-analytics', label: 'Social Analytics', icon: BarChart3 },
      { to: '/social-posts', label: 'Social Posts', icon: Activity },
    ],
  },
];

const BOTTOM_ITEMS = [
  { key: 'settings', icon: Settings, label: 'Settings', to: '/settings' },
];

// ── Main layout ─────────────────────────────────────────────────────────────
export default function Layout() {
  const { user } = useAuth();
  const { projects, loading, activeId, select } = useProjects();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(false); // full-width mode
  const [flyout, setFlyout] = useState(null); // which group flyout is open
  const { pathname } = useLocation();

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { setFlyout(null); }, [pathname]);

  const isActive = (item) =>
    item.exact ? pathname === item.to : pathname.startsWith(item.to);

  // ── Desktop icon rail ────────────────────────────────────────────────────
  const desktopSidebar = (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/[0.07] bg-background/60 backdrop-blur-sm transition-[width] duration-200 lg:flex',
        expanded ? 'w-64' : 'w-[72px]'
      )}
    >
      {/* Top: logo (top bar) */}
      <div className="flex h-16 items-center border-b border-white/[0.07] px-3">
        <Link to="/" className={`flex flex-1 items-center gap-2.5 overflow-hidden ${expanded ? 'justify-start' : 'justify-center'}`}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-lime-300/15 ring-1 ring-lime-300/30">
            <Radar className="h-5 w-5 text-lime-300" />
          </span>
          {expanded && (
            <span className="truncate font-semibold tracking-tight text-white text-lg">Vizion SEO</span>
          )}
        </Link>
      </div>

      {/* Collapse control — sits just under the logo, no overlap */}
      <button
        onClick={() => setExpanded(e => !expanded)}
        className="mx-auto mt-2 flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-white"
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {expanded ? <ChevronLeft className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </button>

      {/* Rail body — scrollbar hidden, wheel/trackpad scroll still works */}
      <div className="hide-scrollbar relative flex flex-1 flex-col overflow-y-auto px-3 py-4">
        {/* Project + main rail items */}
        <div className="flex flex-col items-center gap-1.5">
          {!expanded && (
            <div className="relative">
              <ProjectSelectorCompact projects={projects} activeId={activeId} onSelect={select} />
            </div>
          )}

          {RAIL_ORDER.map((item) => (
            <div key={item.key} className="relative w-full">
              {expanded ? (
                <NavLink to={item.to} label={item.label} icon={item.icon} exact={item.exact} />
              ) : (
                <RailItem
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item)}
                  onClick={() => {}}
                />
              )}
            </div>
          ))}

          {/* Group flyout triggers */}
          {GROUPS.map((group) => (
            <div key={group.key} className="relative w-full">
              {expanded ? (
                <div className="mt-2">
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {group.label}
                  </p>
                  {group.items.map((it) => (
                    <NavLink key={it.to} to={it.to} label={it.label} icon={it.icon} />
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <RailItem
                    icon={group.icon}
                    label={group.label}
                    active={group.items.some((i) => isActive(i))}
                    onClick={() => setFlyout(flyout === group.key ? null : group.key)}
                  />
                  {flyout === group.key && (
                    <GroupFlyout group={group} onClose={() => setFlyout(null)} />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Expanded scroll hint spacer */}
        {expanded && <div className="mt-4" />}

        {/* Bottom: settings + theme + user */}
        <div className="mt-auto flex flex-col items-center gap-1.5 pt-4">
          {BOTTOM_ITEMS.map((item) => (
            <div key={item.key} className="relative w-full">
              {expanded ? (
                <NavLink to={item.to} label={item.label} icon={item.icon} />
              ) : (
                <RailItem icon={item.icon} label={item.label} active={isActive(item)} onClick={() => {}} />
              )}
            </div>
          ))}

          {!expanded ? (
            <>
              <Tooltip label={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
                <button
                  onClick={toggle}
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-neutral-400 hover:bg-white/5 hover:text-white"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
              </Tooltip>
              <UserProfile user={user} compact />
            </>
          ) : (
            <>
              <button
                onClick={toggle}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-neutral-400 hover:bg-white/5 hover:text-white"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
              <UserProfile user={user} />
            </>
          )}
        </div>
      </div>
    </aside>
  );

  // ── Mobile header + drawer ─────────────────────────────────────────────────
  const mobileHeader = (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-background/90 px-4 backdrop-blur lg:hidden">
      <Link to="/" className="flex items-center gap-2">
        <Radar className="h-5 w-5 text-lime-300" />
        <span className="font-semibold text-white">Vizion SEO</span>
      </Link>
      <div className="flex items-center gap-2">
        <button onClick={toggle} className="text-neutral-300">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-neutral-300">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </header>
  );

  const mobileDrawer = mobileOpen && (
    <div className="fixed inset-0 z-30 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
      <aside className="absolute left-0 top-0 flex h-full w-72 flex-col overflow-y-auto border-r border-white/[0.07] bg-background p-4">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-lime-300" />
            <span className="font-semibold text-white">Vizion SEO</span>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="text-neutral-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <UserProfile user={user} />
        <div className="my-4">
          <ProjectSelectorCompactMob projects={projects} activeId={activeId} onSelect={select} />
        </div>

        <nav className="space-y-1">
          {RAIL_ORDER.map((item) => (
            <NavLink key={item.key} to={item.to} label={item.label} icon={item.icon} exact={item.exact} onNavigate={() => setMobileOpen(false)} />
          ))}
          {GROUPS.map((group) => (
            <div key={group.key}>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-neutral-500">{group.label}</p>
              {group.items.map((it) => (
                <NavLink key={it.to} to={it.to} label={it.label} icon={it.icon} onNavigate={() => setMobileOpen(false)} />
              ))}
            </div>
          ))}
          <div className="pt-3">
            {BOTTOM_ITEMS.map((item) => (
              <NavLink key={item.key} to={item.to} label={item.label} icon={item.icon} onNavigate={() => setMobileOpen(false)} />
            ))}
          </div>
        </nav>
      </aside>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-body text-neutral-200">
      {desktopSidebar}
      {mobileHeader}
      {mobileDrawer}

      <main className={cn('transition-[padding] duration-200', expanded ? 'lg:pl-64' : 'lg:pl-[72px]')}>
        <div className="lg:hidden pt-14" />
        <div className="mx-auto max-w-7xl px-5 py-8 md:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// Mobile project selector
function ProjectSelectorCompactMob({ projects, activeId, onSelect }) {
  const activeProject = projects.find(p => p.id === activeId);
  if (!projects.length) {
    return (
      <Link to="/?addProject=1" className="flex w-full items-center gap-2 rounded-lg bg-lime-300/10 px-3 py-2 text-sm font-medium text-lime-200">
        <Plus className="h-4 w-4" /> Add your first project
      </Link>
    );
  }
  return (
    <Link to="/" className="flex w-full items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm font-medium text-neutral-200">
      <Globe className="h-4 w-4 shrink-0 text-lime-300" />
      <span className="truncate">{activeProject?.domain || projects[0]?.domain}</span>
    </Link>
  );
}
