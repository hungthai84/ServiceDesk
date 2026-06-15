import { IconProps } from './components/icons';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'admin' | 'member';
  avatar?: string;
  phoneNumber?: string;
  isGoogleLinked?: boolean;
  googleEmail?: string;
}

export interface ThemeSettings {
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
}

export type View = 'dashboard' | 'drive' | 'meeting' | 'tasklist' | 'contacts' | 'calendar' | 'notes' | 'blog' | 'blog-article' | 'email' | 'chat' | 'newsfeed' | 'tasks' | 'new-blog-post' | 'training' | 'class-detail' | 'settings' | 'check-in' | 'user-management' | 'requests' | 'website-data' | 'projects' | 'team-chat' | 'org-chart' | 'process';

export type ServiceName = 'Drive' | 'Keep' | 'Tasks' | 'Gmail' | 'Calendar' | 'Classroom' | 'Blogger' | 'Chat' | 'Meet';

export interface ServiceState {
  id: ServiceName;
  name: string;
  icon: React.ReactElement<IconProps>;
  isConnected: boolean;
  isSyncEnabled: boolean;
  lastSync?: string;
  storageUsage?: string;
}

export interface CheckInEntry {
  id: number;
  checkInTime: Date;
  checkOutTime?: Date;
  checkInLocation: string;
  checkOutLocation?: string;
}

export interface RecentItem {
  id: string;
  name: string;
  type: View;
  icon: React.ReactElement<IconProps>;
  itemId?: string;
}

export interface ActivityItem {
  id: string;
  user: { name: string; avatar: string; };
  action: 'login' | 'file_edit' | 'task_complete' | 'meeting_scheduled' | 'comment_added';
  target: string;
  timestamp: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  type: 'system' | 'mention' | 'task';
  link?: string;
}
