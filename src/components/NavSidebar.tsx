import React, { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { File as FileEdit, Rocket, PenLine, Camera, LayoutDashboard, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import { getUserSavedOutputsMeta, getUserCopySessions } from '../services/supabaseClient';

// ── Relative time helper ───────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

interface RecentItem {
  id: string;
  label: string;
  date: string;
}

// ── Sub-item dropdown ──────────────────────────────────────────────────────────

interface LazyDropdownProps {
  label: string;
  loadItems: () => Promise<RecentItem[]>;
  onSelect: (item: RecentItem) => void;
}

const LazyDropdown: React.FC<LazyDropdownProps> = ({ label, loadItems, onSelect }) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<RecentItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  const handleToggle = useCallback(async () => {
    const next = !open;
    setOpen(next);
    if (next && items === null) {
      setLoading(true);
      try {
        const result = await loadItems();
        setItems(result);
      } finally {
        setLoading(false);
      }
    }
  }, [open, items, loadItems]);

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center gap-1.5 py-1 rounded text-left transition-colors"
        style={{ paddingLeft: '22px', color: '#9ca3af' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
      >
        <ChevronRight
          size={9}
          style={{
            flexShrink: 0,
            transition: 'transform 150ms',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />
        <span style={{ fontSize: '9px', fontWeight: 500, letterSpacing: '0.02em' }}>{label}</span>
      </button>

      {open && (
        <div style={{ paddingLeft: '34px' }} className="pb-0.5">
          {loading ? (
            <div className="flex items-center gap-1.5 py-1">
              <Loader2 size={9} className="animate-spin text-gray-400" />
              <span style={{ fontSize: '9px', color: '#9ca3af' }}>Loading…</span>
            </div>
          ) : items && items.length > 0 ? (
            items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setOpen(false); onSelect(item); }}
                className="w-full text-left py-0.5 rounded transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f97316'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9ca3af'; }}
              >
                <div style={{ fontSize: '9px', fontWeight: 500 }} className="truncate leading-tight">
                  {item.label}
                </div>
                <div style={{ fontSize: '8px', color: '#6b7280' }}>{item.date}</div>
              </button>
            ))
          ) : (
            <p style={{ fontSize: '9px', color: '#6b7280' }} className="py-0.5 italic">
              {label === 'Recent Projects' ? 'No saved projects yet' : 'No sessions yet'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main NavSidebar ────────────────────────────────────────────────────────────

const NavSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isAdmin } = useIsAdmin(currentUser);

  const baseItems = [
    { label: 'Copy Maker', path: '/copy-maker', Icon: FileEdit, adminOnly: false },
    { label: 'Start Hub', path: null, Icon: Rocket, adminOnly: false },
    { label: 'Purpose Rewrite', path: '/quick-polish', Icon: PenLine, adminOnly: true },
    { label: 'Copy Snap', path: '/copy-snap', Icon: Camera, adminOnly: true },
    { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard, adminOnly: false },
  ];

  const items = baseItems.filter(item => !item.adminOnly || isAdmin);

  const loadRecentProjects = useCallback(async (): Promise<RecentItem[]> => {
    if (!currentUser?.id) return [];
    const { data } = await getUserSavedOutputsMeta(currentUser.id, 5);
    if (!data) return [];
    return data.map((o: any) => ({
      id: o.id,
      label: o.title || 'Untitled',
      date: relativeTime(o.last_accessed_at || o.created_at),
    }));
  }, [currentUser?.id]);

  const loadRecentSessions = useCallback(async (): Promise<RecentItem[]> => {
    if (!currentUser?.id) return [];
    const { data } = await getUserCopySessions(currentUser.id, 5);
    if (!data) return [];
    return (data as any[])
      .filter((s: any) => s.scope_key === 'copy-maker' || !s.scope_key)
      .slice(0, 5)
      .map((s: any) => ({
        id: s.id,
        label: s.session_name || s.name || 'Untitled session',
        date: relativeTime(s.last_accessed_at || s.created_at),
      }));
  }, [currentUser?.id]);

  const handleProjectSelect = useCallback((item: RecentItem) => {
    navigate(`/copy-maker?savedOutputId=${item.id}`);
  }, [navigate]);

  const handleSessionSelect = useCallback((item: RecentItem) => {
    navigate(`/copy-maker?sessionId=${item.id}`);
  }, [navigate]);

  return (
    <aside
      className="sticky top-0 h-screen flex-shrink-0 flex flex-col border-r border-gray-200 dark:border-gray-800 bg-gray-100 dark:bg-black"
      style={{ width: 160 }}
    >
      <div className="px-2.5 pt-2 pb-1 border-b border-gray-100 dark:border-gray-800">
        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: '#f97316' }}>
          Navigate
        </span>
      </div>
      <div className="space-y-0 px-1.5 pt-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        {items.map(({ label, path, Icon }) => {
          const isActive = path ? location.pathname === path : false;
          const isDashboard = label === 'Dashboard';
          return (
            <div key={label}>
              <button
                type="button"
                onClick={() => {
                  if (!path) {
                    window.dispatchEvent(new CustomEvent('forceOpenStartHub'));
                  } else {
                    navigate(path);
                  }
                }}
                className="w-full flex items-center gap-2 py-1.5 px-2 rounded text-[10px] font-medium transition-colors text-left"
                style={isActive ? {
                  borderLeft: '2px solid #f97316',
                  paddingLeft: '6px',
                  color: '#f97316',
                  background: 'rgba(249,115,22,0.07)',
                } : {
                  borderLeft: '2px solid transparent',
                  paddingLeft: '6px',
                  color: '#6b7280',
                }}
                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(249,115,22,0.06)'; }}
                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = ''; }}
              >
                <Icon size={11} style={{ flexShrink: 0 }} />
                {label}
              </button>

              {isDashboard && (
                <div className="space-y-0 mt-0.5">
                  <LazyDropdown
                    label="Recent Projects"
                    loadItems={loadRecentProjects}
                    onSelect={handleProjectSelect}
                  />
                  <LazyDropdown
                    label="Recent Sessions"
                    loadItems={loadRecentSessions}
                    onSelect={handleSessionSelect}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default NavSidebar;
