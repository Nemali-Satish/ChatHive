import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  User,
  Shield,
  MessageSquare,
  Bell,
  Keyboard,
  HelpCircle,
  LogOut,
  ChevronRight,
  Cog,
  ArrowLeft
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import ThemeToggle from '../components/ui/ThemeToggle';
import useAuthStore from '../store/useAuthStore';
import ProfileSetup from './ProfileSetup';
import { useTheme } from '../context/ThemeContext';

const items = [
  { key: 'account', icon: User, title: 'Account', subtitle: 'Security notifications, account info' },
  { key: 'chats', icon: MessageSquare, title: 'Preferences', subtitle: 'Theme, wallpaper, chat settings' },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [selected, setSelected] = useState(null);
  const { theme, setTheme, toggleTheme } = useTheme();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const showListOnSmall = !selected;

  const renderDetail = () => {
    if (!selected) return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center select-none">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-panel border border-default flex items-center justify-center">
            <Cog className="size-10 text-secondary" />
          </div>
          <h2 className="text-2xl font-semibold text-secondary">Settings</h2>
        </div>
      </div>
    );
    if (selected === 'account') {
      return <ProfileSetup onSuccess={() => setSelected(null)} />;
    }
    if (selected === 'chats') {
      return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6">
          <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
          <div className="rounded-2xl border border-default bg-panel p-4 sm:p-6 space-y-6">
            <section>
              <h3 className="text-lg font-medium mb-2">Theme</h3>
              <div className="flex gap-3">
                <button
                  className={`btn ${theme==='light' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('light')}
                >Light</button>
                <button
                  className={`btn ${theme==='dark' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setTheme('dark')}
                >Dark</button>
                <button className="btn btn-outline" onClick={toggleTheme}>Toggle</button>
              </div>
            </section>
          </div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold">Coming soon</h2>
        <p className="text-secondary mt-1">This settings section is not implemented yet.</p>
      </div>
    );
  };

  return (
    <div className="h-screen bg-app text-primary flex">
      <aside className={`w-full sm:w-96 max-w-[28rem] border-r border-default bg-panel flex flex-col ${showListOnSmall ? 'flex' : 'hidden'} sm:flex`}>
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-header border-b border-default">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-full hover-surface"
              aria-label="Back to chats"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="size-5" />
            </button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
        </div>

        <div className="px-6">
          <div className="flex items-center gap-4 py-3">
            <Avatar size="xl" src={user?.avatar?.url} />
            <div className="min-w-0">
              <div className="font-medium truncate">{user?.name || user?.username || 'User'}</div>
              <div className="text-secondary text-sm truncate">{user?.bio || 'First, solve the problem. Then, write the code.'}</div>
            </div>
          </div>
        </div>

        <div className="px-6"><div className="h-px bg-[var(--border)] my-2" /></div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2">
          {items.map(({ key, icon: Icon, title, subtitle }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg hover-surface ${selected===key ? 'bg-muted' : ''}`}
            >
              <Icon className="size-5 text-secondary" />
              <div className="flex-1 min-w-0">
                <div className="font-medium">{title}</div>
                <div className="text-sm text-secondary truncate">{subtitle}</div>
              </div>
              <ChevronRight className="size-4 text-secondary" />
            </button>
          ))}

          <button
            type="button"
            onClick={onLogout}
            className="w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg text-red-500 hover:bg-red-500/10 mt-2"
          >
            <LogOut className="size-5" />
            <span className="font-medium">Log out</span>
          </button>
        </nav>
      </aside>

      <main className={`flex-1 bg-app ${selected ? 'block' : 'hidden'} sm:block overflow-auto`}>
        {/* Small screens: header with back arrows when detail is open */}
        <div className="sm:hidden">
          {selected && (
            <div className="flex items-center justify-between px-2 py-3 bg-header border-b border-default sticky top-0 z-10">
              <div className="flex items-center gap-1">
                {!selected && (
                <button
                  type="button"
                  className="p-2 rounded-full hover-surface"
                  aria-label="Back to chats"
                  onClick={() => navigate('/')}
                >
                  <ArrowLeft className="size-5" />
                </button>
                )}
                <button className="btn btn-ghost px-2" onClick={() => setSelected(null)}><ArrowLeft/></button>
              </div>
            </div>
          )}
        </div>
        {renderDetail()}
      </main>
    </div>
  );
}
