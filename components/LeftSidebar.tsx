import React, { useState } from 'react';
import { HomeIcon, CalendarIcon, StickyNoteIcon, ChecklistIcon, UsersIcon, FolderIcon, BookOpenIcon, RssIcon, GraduationCapIcon, XIcon, ClipboardListIcon, ChevronDownIcon, ChevronUpIcon, SitemapIcon, WorkflowIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { View, RecentItem, User } from '../types';
import { useLanguage } from './LanguageContext';
import UserMenu from './UserMenu';

// --- Sidebar Components ---

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  isCollapsed: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active = false, isCollapsed, onClick }) => (
  <button onClick={onClick} className={`flex items-center w-full gap-3 px-4 py-[8px] rounded-lg transition-colors ${active ? 'bg-[--color-surface-tertiary] text-[--color-accent-700] dark:text-[--color-accent-400] font-semibold shadow-sm' : 'text-[--color-text-secondary] hover:bg-[--color-surface-secondary] hover:text-[--color-text-primary]'} ${isCollapsed ? 'justify-center' : ''}`}>
    <div className="flex-center-icon w-5 h-5 shrink-0">
      {icon}
    </div>
    <span className={`whitespace-nowrap font-medium text-sm transition-opacity duration-200 leading-none ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{label}</span>
  </button>
);

interface LeftSidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
  activeView: View;
  onNavigate: (view: View, section?: string) => void;
  recentlyViewed: RecentItem[];
  onAiClick?: () => void;
  isAiOpen?: boolean;
  user: User;
  onLogout: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ 
  isCollapsed, 
  onToggleCollapse, 
  isMobileOpen, 
  onClose, 
  activeView, 
  onNavigate, 
  recentlyViewed, 
  onAiClick, 
  isAiOpen,
  user,
  onLogout
}) => {
  const { t } = useLanguage();
  const [isRecentExpanded, setIsRecentExpanded] = useState(true);

  return (
    <div 
        className={`fixed inset-y-0 left-0 z-40 md:relative md:z-20 shrink-0 transition-transform duration-300 ease-in-out md:transform-none ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <aside className={`relative flex flex-col p-[5px] bg-transparent h-full transition-all duration-300 ease-in-out shrink-0 w-[190px] md:${isCollapsed ? 'w-20' : 'w-[190px]'}`}>
        
        {/* Toggle Button */}
        <button 
          onClick={onToggleCollapse}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full hidden md:flex items-center justify-center shadow-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-all z-50 group"
        >
          {isCollapsed ? (
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500" />
          ) : (
            <ChevronLeftIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-500" />
          )}
        </button>

        <div className="flex items-center justify-end mb-6 md:hidden">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
                <XIcon className="w-6 h-6 text-[--color-text-secondary]" />
            </button>
        </div>

        {/* Spacing on Desktop when Brand Logo is moved to TopSidebar */}
        <div className="hidden md:block h-3"></div>

        <nav className="flex-grow flex flex-col justify-center gap-[5px] overflow-y-auto no-scrollbar">
          <NavItem icon={<HomeIcon className="w-5 h-5 shrink-0 text-indigo-500" />} label={t('dashboard')} active={activeView === 'dashboard'} isCollapsed={isCollapsed} onClick={() => onNavigate('dashboard')} />
          <NavItem icon={<RssIcon className="w-5 h-5 shrink-0 text-orange-500" />} label={t('newsfeed')} active={activeView === 'newsfeed'} isCollapsed={isCollapsed} onClick={() => onNavigate('newsfeed')} />
          
          <NavItem icon={<ChecklistIcon className="w-5 h-5 shrink-0 text-teal-600" />} label={t('projects') || 'Dự án'} active={activeView === 'projects'} isCollapsed={isCollapsed} onClick={() => onNavigate('projects')} />
          <NavItem icon={<FolderIcon className="w-5 h-5 shrink-0 text-yellow-500" />} label={t('drive')} active={activeView === 'drive'} isCollapsed={isCollapsed} onClick={() => onNavigate('drive')} />
          <NavItem icon={<ChecklistIcon className="w-5 h-5 shrink-0 text-green-500" />} label={t('tasklist')} active={activeView === 'tasklist'} isCollapsed={isCollapsed} onClick={() => onNavigate('tasklist')} />
          <NavItem icon={<UsersIcon className="w-5 h-5 shrink-0 text-cyan-500" />} label={t('contacts')} active={activeView === 'contacts'} isCollapsed={isCollapsed} onClick={() => onNavigate('contacts')} />
          <NavItem icon={<CalendarIcon className="w-5 h-5 shrink-0 text-red-500" />} label={t('calendar')} active={activeView === 'calendar'} isCollapsed={isCollapsed} onClick={() => onNavigate('calendar')} />
          <NavItem icon={<StickyNoteIcon className="w-5 h-5 shrink-0 text-amber-500" />} label={t('notes')} active={activeView === 'notes'} isCollapsed={isCollapsed} onClick={() => onNavigate('notes')} />
          <NavItem icon={<BookOpenIcon className="w-5 h-5 shrink-0 text-emerald-500" />} label={t('blog')} active={activeView === 'blog'} isCollapsed={isCollapsed} onClick={() => onNavigate('blog')} />
          <NavItem icon={<GraduationCapIcon className="w-5 h-5 shrink-0 text-violet-500" />} label={t('training')} active={activeView === 'training'} isCollapsed={isCollapsed} onClick={() => onNavigate('training')} />
          <NavItem icon={<ClipboardListIcon className="w-5 h-5 shrink-0 text-rose-500" />} label={t('requestsAndApprovals')} active={activeView === 'requests'} isCollapsed={isCollapsed} onClick={() => onNavigate('requests')} />
          <NavItem icon={<SitemapIcon className="w-5 h-5 shrink-0 text-cyan-600" />} label={t('orgChartConfig')} active={activeView === 'org-chart'} isCollapsed={isCollapsed} onClick={() => onNavigate('org-chart')} />
          <NavItem icon={<WorkflowIcon className="w-5 h-5 shrink-0 text-fuchsia-500" />} label="Quy trình" active={activeView === 'process'} isCollapsed={isCollapsed} onClick={() => onNavigate('process')} />

          {recentlyViewed.length > 0 && (
            <div className="shrink-0 mt-2">
              <div className="w-full border-t my-2 border-[--color-border-secondary]"></div>
              <button 
                onClick={() => setIsRecentExpanded(!isRecentExpanded)}
                className={`w-full flex items-center justify-between px-4 py-1 text-xs font-bold uppercase tracking-wider text-[--color-text-subtle] hover:text-[--color-text-primary] transition-colors ${isCollapsed ? 'justify-center opacity-0 h-0 hidden' : 'opacity-100'}`}
              >
                <span>{t('recentlyViewed') || 'RECENT'}</span>
                {isRecentExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 flex flex-col gap-[5px] mt-1 ${isRecentExpanded || isCollapsed ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {recentlyViewed.map(item => (
                  <NavItem
                    key={item.id}
                    icon={React.cloneElement(item.icon, { className: "w-5 h-5 shrink-0" })}
                    label={item.name}
                    isCollapsed={isCollapsed}
                    onClick={() => onNavigate(item.type, item.itemId)}
                  />
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Section: Profile + AI Assistant */}
        <div className="mt-auto pt-3 border-t border-[--color-border-secondary]/60 flex flex-col gap-2.5 shrink-0">
          {/* User Profile placed above AI */}
          <div className={`flex items-center gap-2.5 w-full p-1 rounded-xl transition-all ${!isCollapsed ? 'bg-slate-100/30 dark:bg-slate-800/30 border border-[--color-border-secondary]/40 px-2 py-1.5' : 'justify-center'}`}>
            <UserMenu user={user} onLogout={onLogout} onNavigate={onNavigate} direction="up" />
            {!isCollapsed && (
              <div className="flex-1 min-w-0 flex flex-col text-left">
                <span className="text-sm font-semibold text-[--color-text-primary] truncate leading-tight">{user.name}</span>
                <span className="text-[10px] text-[--color-text-subtle] truncate font-medium uppercase tracking-wider mt-0.5">{user.role || 'Member'}</span>
              </div>
            )}
          </div>

          {onAiClick && (
            <div className="flex flex-col items-center shrink-0 w-full animate-fade-in-up">
              {!isCollapsed ? (
                <button
                  onClick={onAiClick}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r ${
                    isAiOpen 
                      ? 'from-indigo-500/20 to-purple-500/20 border-[--color-accent-500]' 
                      : 'from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/18 hover:to-purple-500/18 border-[--color-border-secondary]'
                  } border transition-all duration-300 transform active:scale-95 text-left`}
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-purple-500/30">
                    <img 
                      src="https://i.ibb.co/x8Spz9Qm/Avata-AI-POW.gif" 
                      alt="AI Assistant"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[--color-text-primary] flex items-center gap-1">
                      Trợ lý ảo AI
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    </div>
                    <div className="text-[10px] text-[--color-text-subtle] truncate">Trò chuyện & hỗ trợ...</div>
                  </div>
                </button>
              ) : (
                <button
                  onClick={onAiClick}
                  className={`w-10 h-10 rounded-full overflow-hidden shrink-0 border transition-all duration-300 ${
                    isAiOpen ? 'border-[--color-accent-500] ring-2 ring-[--color-accent-500]/50' : 'border-purple-500/30 hover:shadow-lg hover:scale-105'
                  }`}
                  title="Trợ lý ảo AI"
                >
                  <img 
                    src="https://i.ibb.co/x8Spz9Qm/Avata-AI-POW.gif" 
                    alt="AI Assistant"
                    className="w-full h-full object-cover" 
                  />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default LeftSidebar;