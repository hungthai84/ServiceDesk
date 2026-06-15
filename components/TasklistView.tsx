import React, { useState, useEffect, useRef } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusIcon, XIcon, TrashIcon, MessageSquareIcon, PaperAirplaneIcon, MoreVerticalIcon, PaperclipIcon, UserPlusIcon, UsersIcon, ShareIcon, SearchIcon, MicIcon } from './icons';
import { motion, AnimatePresence } from 'motion/react';
import { User, AppNotification } from '../types';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';

// --- TYPES ---
export interface TaskComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  timestamp: number;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
}

export interface TaskSubtask {
  id: string;
  text: string;
  completed: boolean;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
}

export interface TaskHistoryItem {
  id: string;
  action: string;
  details: string;
  timestamp: number;
}

export interface Task {
  id: string;
  text: string;
  notes?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: number;
  status?: 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành';
  priority?: 'Thấp' | 'Trung bình' | 'Cao';
  comments?: TaskComment[];
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  relatedUserIds?: string[];
  linkedNoteIds?: string[];
  linkedEmailIds?: string[];
  linkedChatIds?: string[];
  subtasks?: TaskSubtask[];
  attachments?: TaskAttachment[];
  history?: TaskHistoryItem[];
  updatedAt?: number;
  archived?: boolean;
  recurring?: 'daily' | 'weekly' | 'monthly' | 'none';
  dependencyId?: string; 
  timeSpent?: number;
  timerStartedAt?: number;
  order?: number;
}

export interface TaskList {
  id: string;
  name: string;
  tasks: Task[];
  source?: 'google';
  sharedUserIds?: string[];
  autoAssignmentRules?: { priority: 'Thấp' | 'Trung bình' | 'Cao', userId: string }[];
}

// --- MOCK DATA ---
export const mockTaskLists: TaskList[] = [
  {
    id: 'list-1',
    name: 'Việc hôm nay',
    tasks: [
      { id: 'task-1-1', text: 'Gọi lại cho khách hàng A', completed: false, dueDate: '2024-07-29' },
      { id: 'task-1-2', text: 'Hoàn thành báo cáo tuần', completed: false, notes: 'Lấy số liệu từ Google Analytics và Salesforce.' },
      { id: 'task-1-3', text: 'Mua quà sinh nhật cho mẹ', completed: true },
      { id: 'task-1-4', text: 'Kiểm tra email và lịch trình', completed: false, dueDate: new Date().toISOString().split('T')[0] },
    ],
  },
  {
    id: 'list-2',
    name: 'Dự án POW',
    tasks: [
      { id: 'task-2-1', text: 'Viết tài liệu demo cho module Tasklist', completed: false, dueDate: '2024-08-05' },
      { id: 'task-2-2', text: 'Review PR #125 của đồng nghiệp', completed: false },
      { id: 'task-2-3', text: 'Deploy bản vá lỗi lên staging', completed: true },
    ],
  },
  {
    id: 'list-3',
    name: 'Ý tưởng nội bộ',
    tasks: [
      { id: 'task-3-1', text: 'Tổ chức buổi workshop về AI', completed: false },
      { id: 'task-3-2', text: 'Cải thiện quy trình onboarding cho nhân viên mới', completed: false },
    ],
  },
];

export const mockTaskTemplates = [
    { id: 'tpl-1', text: 'Chuẩn bị họp Daily', notes: 'Chuẩn bị danh sách các vấn đề và kết quả đạt được.', priority: 'Trung bình' as const },
    { id: 'tpl-2', text: 'Họp đồng bộ hàng tuần', notes: 'Cập nhật trạng thái dự án cho nhóm.', priority: 'Trung bình' as const },
    { id: 'tpl-3', text: 'Duyệt mã nguồn (Code Review)', priority: 'Cao' as const }
];

import { fetchTaskLists, fetchTasks, getAccessToken } from '../googleTasks';

// --- BANNER COMPONENT ---
const AnimatedTasklistIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 120 100" 
        className="w-14 h-14 drop-shadow-lg"
        aria-hidden="true"
    >
        <style>{`
            .clipboard-group {
                animation: float 6s ease-in-out infinite;
            }
            @keyframes float {
                0% { transform: translateY(0px); }
                50% { transform: translateY(-8px); }
                100% { transform: translateY(0px); }
            }
            .check-mark {
                stroke-dasharray: 30;
                stroke-dashoffset: 30;
                animation: draw-check 3s ease-in-out infinite;
                animation-delay: 1s;
            }
            @keyframes draw-check {
                0% { stroke-dashoffset: 30; }
                25% { stroke-dashoffset: 0; }
                75% { stroke-dashoffset: 0; }
                100% { stroke-dashoffset: -30; }
            }
        `}</style>
        <g className="clipboard-group">
            <path d="M85,15 H35 A5,5 0 0,0 30,20 V80 A5,5 0 0,0 35,85 H85 A5,5 0 0,0 90,80 V20 A5,5 0 0,0 85,15 Z" fill="#fff" stroke="#e0e7ff" strokeWidth="2" />
            <path d="M70,10 h-20 a8,8 0 0,0 0,16 h20 a8,8 0 0,0 0,-16 Z" fill="#a5b4fc" />
            <line x1="45" y1="58" x2="75" y2="58" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="68" x2="65" y2="68" stroke="#c7d2fe" strokeWidth="3" strokeLinecap="round" />
            
            <g transform="translate(0, -5)">
                <circle cx="50" cy="40" r="10" fill="#34d399" opacity="0.2" />
                <path className="check-mark" d="M45 40 L49 44 L57 36" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
        </g>
    </svg>
);

const TasklistBanner: React.FC<{ onSync?: () => void, isSyncing?: boolean }> = ({ onSync, isSyncing }) => {
    return (
        <div className="relative p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 text-white overflow-hidden shadow-lg">
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-white/10 rounded-full z-0" aria-hidden="true"></div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-lg opacity-80 z-0 -rotate-12" aria-hidden="true"></div>
            <div className="relative z-10 flex flex-col sm:flex-row justify-between items-center gap-2">
                <div className="text-center sm:text-left">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg sm:text-xl font-bold">Danh sách việc</h1>
                        {onSync && (
                            <button 
                                onClick={onSync} 
                                disabled={isSyncing}
                                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-semibold backdrop-blur-sm transition-all shadow-sm flex items-center gap-2"
                            >
                                {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Google Tasks'}
                            </button>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-indigo-100 max-w-lg italic">
                        “Việc nhỏ – nhưng nhớ kỹ. Đồng bộ, nhắc đúng, xử lý gọn.”
                    </p>
                </div>
                <div className="shrink-0 hidden md:block">
                    <AnimatedTasklistIcon />
                </div>
            </div>
        </div>
    );
};

// --- EDIT MODAL ---
const TaskEditModal: React.FC<{ 
    task: Task, 
    user: User,
    allUsers: User[],
    allTasks: Task[],
    onClose: () => void, 
    onSave: (task: Task) => void, 
    onDelete: (taskId: string) => void,
    onSaveAsTemplate: (task: Task) => void 
}> = ({ task: initialTask, user, allUsers, allTasks, onClose, onSave, onDelete, onSaveAsTemplate }) => {
    const [task, setTask] = useState(initialTask);
    const [commentText, setCommentText] = useState('');
    const [showUserPicker, setShowUserPicker] = useState<'assignee' | 'related' | null>(null);
    const [showSubtaskUserPickerId, setShowSubtaskUserPickerId] = useState<string | null>(null);
    const [showLinkPicker, setShowLinkPicker] = useState<boolean>(false);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [subtaskText, setSubtaskText] = useState('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    const saveTimerRef = React.useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = React.useRef(true);

    React.useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        setSaveStatus('saving');
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

        saveTimerRef.current = setTimeout(() => {
            onSave({ ...task, updatedAt: Date.now() });
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 1500);

        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, [task, onSave]);

    const handleAddSubtask = (e?: React.KeyboardEvent | React.MouseEvent) => {
        if (e) e.preventDefault();
        if (!subtaskText.trim()) return;
        setTask({
            ...task,
            subtasks: [...(task.subtasks || []), { id: `subtask-${Date.now()}`, text: subtaskText.trim(), completed: false }]
        });
        setSubtaskText('');
    };

    const handleToggleSubtask = (subtaskId: string) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st)
        });
    };

    const handleDeleteSubtask = (subtaskId: string) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.filter(st => st.id !== subtaskId)
        });
    };

    const handleSetSubtaskAssignee = (subtaskId: string, selectedUser: User) => {
        setTask({
            ...task,
            subtasks: task.subtasks?.map(st => st.id === subtaskId ? { 
                ...st, 
                assigneeId: selectedUser.id,
                assigneeName: selectedUser.name,
                assigneeAvatar: selectedUser.avatar
             } : st)
        });
        setShowSubtaskUserPickerId(null);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: URL.createObjectURL(file), // mock url for preview
            size: file.size
        }));
        
        setTask({
            ...task,
            attachments: [...(task.attachments || []), ...newFiles]
        });
        e.target.value = ''; // reset input
    };

    const handleDeleteAttachment = (attachmentId: string) => {
        setTask({
            ...task,
            attachments: task.attachments?.filter(a => a.id !== attachmentId)
        });
    };

    // Mock data for links
    const mockNotes = [
        { id: 'note-1', title: 'Biên bản cuộc họp tuần 34' },
        { id: 'note-2', title: 'Quy trình vận hành kho mới' },
        { id: 'note-3', title: 'Ý tưởng marketing Q3' }
    ];
    
    const mockEmails = [
        { id: 'email-1', subject: 'Xác nhận đơn hàng #4492' },
        { id: 'email-2', subject: 'Thư mời họp: Dự án Pow' },
        { id: 'email-3', subject: 'Báo cáo doanh thu tháng 7' }
    ];
    
    const mockChats = [
        { id: 'chat-1', title: 'Nhóm dự án Pow' },
        { id: 'chat-2', title: 'Trao đổi với KH' },
        { id: 'chat-3', title: 'Thông báo chung' }
    ];
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Add history log if there are changes
        const history: TaskHistoryItem[] = [...(task.history || [])];
        if (task.status !== initialTask.status) {
            history.push({
                id: `hist-${Date.now()}-status`,
                action: 'Cập nhật trạng thái',
                details: `Từ "${initialTask.status || 'Chưa rõ'}" sang "${task.status}"`,
                timestamp: Date.now()
            });
        }
        if (task.assigneeId !== initialTask.assigneeId) {
            history.push({
                id: `hist-${Date.now()}-assignee`,
                action: 'Thay đổi người phụ trách',
                details: `Sang "${task.assigneeName || 'Chưa rõ'}"`,
                timestamp: Date.now()
            });
        }
        
        const finalTask = {
            ...task,
            history,
            completedAt: task.completed && !initialTask.completed ? Date.now() : task.completedAt,
            updatedAt: Date.now()
        };
        
        onSave(finalTask);
    };

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        
        const newComment: TaskComment = {
            id: `comment-${Date.now()}`,
            authorId: user.id,
            authorName: user.name,
            authorAvatar: user.avatar,
            text: commentText.trim(),
            timestamp: Date.now()
        };

        setTask({
            ...task,
            comments: [...(task.comments || []), newComment]
        });
        setCommentText('');
    };

    const toggleRelatedUser = (userId: string) => {
        const related = task.relatedUserIds || [];
        if (related.includes(userId)) {
            setTask({ ...task, relatedUserIds: related.filter(id => id !== userId) });
        } else {
            setTask({ ...task, relatedUserIds: [...related, userId] });
        }
    };

    const toggleLinkedItem = (type: 'note' | 'email' | 'chat', itemId: string) => {
        if (type === 'note') {
            const current = task.linkedNoteIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedNoteIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedNoteIds: [...current, itemId] });
            }
        } else if (type === 'email') {
            const current = task.linkedEmailIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedEmailIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedEmailIds: [...current, itemId] });
            }
        } else if (type === 'chat') {
            const current = task.linkedChatIds || [];
            if (current.includes(itemId)) {
                setTask({ ...task, linkedChatIds: current.filter(id => id !== itemId) });
            } else {
                setTask({ ...task, linkedChatIds: [...current, itemId] });
            }
        }
    };

    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex justify-center items-center p-4">
             <div className="absolute inset-0" onClick={onClose}></div>
             <div className="relative w-[80%] h-[80%] overflow-hidden bg-[#F4F5F7] rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
                 <header className="p-4 border-b border-slate-200/80 flex justify-between items-center sticky top-0 bg-[#F4F5F7] z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold text-slate-800">Chỉnh sửa công việc</h2>
                            {saveStatus === 'saving' && (
                                <span className="text-[10px] text-blue-500 font-medium animate-pulse flex items-center gap-1 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100 uppercase tracking-wider">
                                    <svg className="animate-spin h-2.5 w-2.5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Đang lưu
                                </span>
                            )}
                            {saveStatus === 'saved' && (
                                <span className="text-[10px] text-green-500 font-medium flex items-center gap-1 bg-green-50 px-1.5 py-0.5 rounded-full border border-green-100 uppercase tracking-wider">
                                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Đã lưu
                                </span>
                            )}
                        </div>
                        <div className="flex gap-4 mt-2">
                             <button 
                                onClick={() => setActiveTab('details')}
                                className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'details' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                             >
                                Chi tiết
                             </button>
                             <button 
                                onClick={() => setActiveTab('history')}
                                className={`text-[10px] font-bold uppercase tracking-wider pb-1 border-b-2 transition-all ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                             >
                                Lịch sử thay đổi
                             </button>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-slate-400/20"><XIcon className="w-5 h-5"/></button>
                 </header>
                 
                 <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row min-h-0">
                    {activeTab === 'details' ? (
                        <form onSubmit={handleSave} className="flex-1 p-6 space-y-6 border-b lg:border-b-0 lg:border-r border-slate-200/50">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên công việc</label>
                                    <input type="text" value={task.text} onChange={e => setTask({...task, text: e.target.value})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-3 font-medium text-lg focus:ring-2 focus:ring-blue-500/20 transition-all outline-none" required />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        {/* Assignee Selection */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Người phụ trách</label>
                                            <div className="relative">
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowUserPicker(showUserPicker === 'assignee' ? null : 'assignee')}
                                                    className="w-full flex items-center gap-3 bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors text-left"
                                                >
                                                    {task.assigneeId ? (
                                                        <>
                                                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
                                                                {allUsers.find(u => u.id === task.assigneeId)?.name.charAt(0) || 'U'}
                                                            </div>
                                                            <span className="text-sm font-medium text-slate-700">{allUsers.find(u => u.id === task.assigneeId)?.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-slate-400 italic">Chọn người phụ trách</span>
                                                    )}
                                                </button>
                                                
                                                {showUserPicker === 'assignee' && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                        {allUsers.map(u => (
                                                            <button 
                                                                key={u.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setTask({ ...task, assigneeId: u.id, assigneeName: u.name, assigneeAvatar: u.avatar });
                                                                    setShowUserPicker(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors"
                                                            >
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{u.name.charAt(0)}</div>
                                                                <span className="text-xs text-slate-700">{u.name}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
    
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Trạng thái</label>
                                            <select value={task.status || 'Cần làm'} onChange={e => setTask({...task, status: e.target.value as 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                                <option value="Cần làm">Cần làm</option>
                                                <option value="Đang làm">Đang làm</option>
                                                <option value="Xem xét">Xem xét</option>
                                                <option value="Hoàn thành">Hoàn thành</option>
                                            </select>
                                        </div>
                                    </div>
    
                                    <div className="space-y-4">
                                         {/* Related/Followers Selection */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Người liên quan</label>
                                            <div className="relative">
                                                <button 
                                                    type="button"
                                                    onClick={() => setShowUserPicker(showUserPicker === 'related' ? null : 'related')}
                                                    className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                                >
                                                    <div className="flex -space-x-2">
                                                        {(task.relatedUserIds || []).length > 0 ? (
                                                            task.relatedUserIds!.slice(0, 3).map(id => (
                                                                <div key={id} className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white ring-2 ring-white text-[10px] font-bold">
                                                                    {allUsers.find(u => u.id === id)?.name.charAt(0) || 'U'}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-sm text-slate-400 italic">Thêm người liên quan</span>
                                                        )}
                                                        {(task.relatedUserIds || []).length > 3 && (
                                                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 ring-2 ring-white text-[10px] font-bold">
                                                                +{(task.relatedUserIds || []).length - 3}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <UsersIcon className="w-4 h-4 text-slate-400" />
                                                </button>
                                                
                                                {showUserPicker === 'related' && (
                                                    <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 max-h-48 overflow-y-auto p-1">
                                                        {allUsers.map(u => (
                                                            <button 
                                                                key={u.id}
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleRelatedUser(u.id);
                                                                }}
                                                                className={`w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-md transition-colors ${task.relatedUserIds?.includes(u.id) ? 'bg-blue-50' : ''}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">{u.name.charAt(0)}</div>
                                                                    <span className="text-xs text-slate-700">{u.name}</span>
                                                                </div>
                                                                {task.relatedUserIds?.includes(u.id) && <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Độ ưu tiên</label>
                                            <select value={task.priority || 'Trung bình'} onChange={e => setTask({...task, priority: e.target.value as 'Thấp' | 'Trung bình' | 'Cao'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                                <option value="Thấp">Thấp</option>
                                                <option value="Trung bình">Trung bình</option>
                                                <option value="Cao">Cao</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
    
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Liên kết thông tin</label>
                                        <div className="relative">
                                            <button 
                                                type="button"
                                                onClick={() => setShowLinkPicker(!showLinkPicker)}
                                                className="w-full flex items-center justify-between bg-white/70 border border-slate-300/50 rounded-lg p-2.5 hover:bg-white transition-colors"
                                            >
                                                <span className="text-sm text-slate-700 truncate min-w-0 pr-2">
                                                    {((task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) + (task.linkedChatIds?.length || 0)) > 0 
                                                        ? `${(task.linkedNoteIds?.length || 0) + (task.linkedEmailIds?.length || 0) + (task.linkedChatIds?.length || 0)} liên kết` 
                                                        : 'Thêm liên kết'}
                                                </span>
                                                <PaperclipIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                            </button>
                                            {showLinkPicker && (
                                                <div className="absolute top-full left-0 w-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 z-20 overflow-hidden flex flex-col">
                                                    <div className="p-2 border-b border-slate-100 flex items-center gap-2 bg-slate-50">
                                                        <SearchIcon className="w-4 h-4 text-slate-400 shrink-0" />
                                                        <input 
                                                            type="text" 
                                                            placeholder="Tìm kiếm..."
                                                            value={linkSearchTerm}
                                                            onChange={e => setLinkSearchTerm(e.target.value)}
                                                            className="w-full bg-transparent border-none text-xs text-slate-700 focus:outline-none placeholder-slate-400"
                                                        />
                                                    </div>
                                                    <div className="max-h-56 overflow-y-auto p-1">
                                                        <div className="px-2 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ghi chú</div>
                                                        {mockNotes.filter(n => n.title.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(n => (
                                                            <label key={n.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedNoteIds?.includes(n.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                                <input type="checkbox" checked={task.linkedNoteIds?.includes(n.id) || false} onChange={() => toggleLinkedItem('note', n.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                                <span className="flex-1 min-w-0 font-medium leading-snug">{n.title}</span>
                                                            </label>
                                                        ))}
                                                        <div className="px-2 py-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email</div>
                                                        {mockEmails.filter(em => em.subject.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(em => (
                                                            <label key={em.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedEmailIds?.includes(em.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                                <input type="checkbox" checked={task.linkedEmailIds?.includes(em.id) || false} onChange={() => toggleLinkedItem('email', em.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                                <span className="flex-1 min-w-0 font-medium leading-snug">{em.subject}</span>
                                                            </label>
                                                        ))}
                                                        <div className="px-2 py-1.5 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Trò chuyện</div>
                                                        {mockChats.filter(c => c.title.toLowerCase().includes(linkSearchTerm.toLowerCase())).map(c => (
                                                            <label key={c.id} className={`w-full flex items-start gap-2 p-2 hover:bg-slate-50 rounded-md transition-colors text-xs cursor-pointer ${task.linkedChatIds?.includes(c.id) ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}>
                                                                <input type="checkbox" checked={task.linkedChatIds?.includes(c.id) || false} onChange={() => toggleLinkedItem('chat', c.id)} className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                                                <span className="flex-1 min-w-0 font-medium leading-snug">{c.title}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ngày hết hạn</label>
                                        <input type="date" value={task.dueDate || ''} onChange={e => setTask({...task, dueDate: e.target.value})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Định kỳ</label>
                                        <select value={task.recurring || 'none'} onChange={e => setTask({...task, recurring: e.target.value as 'daily' | 'weekly' | 'monthly' | 'none'})} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium">
                                            <option value="none">Không định kỳ</option>
                                            <option value="daily">Hàng ngày</option>
                                            <option value="weekly">Hàng tuần</option>
                                            <option value="monthly">Hàng tháng</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Phụ thuộc vào</label>
                                        <select 
                                            value={task.dependencyId || ''} 
                                            onChange={e => setTask({...task, dependencyId: e.target.value || undefined})} 
                                            className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-2.5 outline-none text-sm font-medium"
                                        >
                                            <option value="">Không có</option>
                                            {allTasks.filter(t => t.id !== task.id).map(t => (
                                                <option key={t.id} value={t.id}>{t.text}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
    
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Danh sách công việc phụ</label>
                                    <div className="space-y-2">
                                        {(task.subtasks || []).map(st => (
                                            <div key={st.id} className="flex items-center gap-2 group relative">
                                                <input type="checkbox" checked={st.completed} onChange={() => handleToggleSubtask(st.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer transition-colors" />
                                                <span className={`flex-1 text-sm min-w-0 break-words ${st.completed ? 'text-slate-400 line-through decoration-slate-300' : 'text-slate-700'}`}>{st.text}</span>
                                                
                                                <div className="relative shrink-0 flex items-center">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setShowSubtaskUserPickerId(showSubtaskUserPickerId === st.id ? null : st.id)}
                                                        className={`p-1 rounded transition-all flex items-center ${st.assigneeId ? 'opacity-100 hover:opacity-80' : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                                        title={st.assigneeName || "Chỉ định người phụ trách"}
                                                    >
                                                        {st.assigneeAvatar ? (
                                                            <img src={st.assigneeAvatar} alt="" className="w-5 h-5 rounded-full shadow-sm" />
                                                        ) : st.assigneeName ? (
                                                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[9px] shadow-sm">
                                                                {st.assigneeName.charAt(0)}
                                                            </div>
                                                        ) : (
                                                            <UserPlusIcon className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {showSubtaskUserPickerId === st.id && (
                                                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-[60] py-1">
                                                            <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Chọn người</div>
                                                            <div className="max-h-40 overflow-y-auto no-scrollbar">
                                                                {allUsers.map(u => (
                                                                    <button
                                                                        key={u.id}
                                                                        type="button"
                                                                        onClick={() => handleSetSubtaskAssignee(st.id, u)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-slate-50 transition-colors text-left"
                                                                    >
                                                                        {u.avatar ? (
                                                                            <img src={u.avatar} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                                                                        ) : (
                                                                            <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">{u.name.charAt(0)}</div>
                                                                        )}
                                                                        <span className="text-xs font-medium text-slate-700 truncate">{u.name}</span>
                                                                        {st.assigneeId === u.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
    
                                                <button type="button" onClick={() => handleDeleteSubtask(st.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition-all shrink-0">
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="flex items-center gap-2 mt-2">
                                            <PlusIcon className="w-4 h-4 text-slate-400" />
                                            <input 
                                                type="text" 
                                                value={subtaskText} 
                                                onChange={e => setSubtaskText(e.target.value)} 
                                                onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(e); }}
                                                placeholder="Thêm việc phụ..."
                                                className="flex-1 bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-0" 
                                            />
                                            <button type="button" onClick={handleAddSubtask} disabled={!subtaskText.trim()} className="text-xs font-bold text-blue-600 disabled:opacity-50 hover:text-blue-700 transition-colors uppercase tracking-wider">Thêm</button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 flex justify-between items-center">
                                        Tệp đính kèm
                                        <label className="cursor-pointer text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                                            <MicIcon className="w-3.5 h-3.5" /> Chụp ảnh / Chọn tệp
                                            <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" capture="environment" />
                                        </label>
                                    </label>
                                    {(task.attachments && task.attachments.length > 0) ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {task.attachments.map(att => (
                                                <div key={att.id} className="flex items-center justify-between p-2 bg-white/70 border border-slate-200 rounded-lg hover:border-slate-300 transition-colors group">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-8 h-8 rounded bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                            <PaperclipIcon className="w-4 h-4" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold text-slate-700 truncate">{att.name}</p>
                                                            <p className="text-[10px] text-slate-400">{(att.size / 1024).toFixed(1)} KB</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => handleDeleteAttachment(att.id)} className="p-1.5 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 rounded-md transition-all shrink-0">
                                                        <XIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-slate-300/50 border-dashed rounded-lg cursor-pointer bg-white/40 hover:bg-white/60 transition-colors">
                                            <div className="flex flex-col items-center justify-center pt-2 pb-3">
                                                <p className="max-w-xs text-xs text-slate-500 text-center"><span className="font-semibold text-blue-600">Nhấp để tải lên</span> hoặc kéo thả</p>
                                            </div>
                                            <input type="file" className="hidden" multiple onChange={handleFileUpload} />
                                        </label>
                                    )}
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Ghi chú</label>
                                    <textarea value={task.notes || ''} onChange={e => setTask({...task, notes: e.target.value})} rows={3} className="w-full bg-white/70 border border-slate-300/50 rounded-lg p-3 resize-none outline-none text-sm" placeholder="Mô tả chi tiết công việc..." />
                                </div>
                            </div>
                            
                            <div className="pt-4 flex justify-between items-center bg-transparent">
                                <button type="button" onClick={() => { onDelete(task.id); onClose(); }} className="py-2 px-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm">
                                    <TrashIcon className="w-4 h-4" /> Xóa
                                </button>
                                <div className="flex gap-3">
                                    <button 
                                        type="button" 
                                        onClick={() => onSaveAsTemplate(task)} 
                                        className="py-2 px-4 bg-amber-100 text-amber-700 hover:bg-amber-200 rounded-lg font-semibold flex items-center gap-2 transition-colors text-sm"
                                        title="Lưu thành mẫu công việc để dùng lại sau này"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                        Lưu làm mẫu
                                    </button>
                                    <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors text-sm">Hủy</button>
                                    <button type="submit" className="py-2.5 px-8 bg-blue-600 text-white font-bold rounded-lg shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all text-sm">Lưu</button>
                                </div>
                            </div>
                        </form>
                    ) : (
                        <div className="flex-1 p-6 space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase">Lịch sử thay đổi</h3>
                            {(task.history && task.history.length > 0) ? (
                                <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-6">
                                    {task.history.sort((a,b) => b.timestamp - a.timestamp).map(item => (
                                        <div key={item.id} className="relative">
                                            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-slate-800 text-xs">{item.action}</span>
                                                    <span className="text-[10px] text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                                </div>
                                                <p className="text-xs text-slate-600">{item.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-400 py-10 text-sm italic">Chưa có lịch sử thay đổi nào được ghi lại.</p>
                            )}
                        </div>
                    )}

                    {/* Comments Section */}
                    <div className="w-full lg:w-96 flex flex-col bg-[#F4F5F7] border-l border-slate-200 min-h-0">
                        <header className="px-4 py-3 flex items-center gap-2">
                            <MessageSquareIcon className="w-4 h-4 text-slate-500" />
                            <h3 className="font-bold text-slate-700 text-sm">Thảo luận</h3>
                            <span className="bg-slate-300/50 text-slate-600 px-1.5 py-0.5 rounded-md text-[10px] font-bold">{(task.comments || []).length}</span>
                        </header>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                            {(task.comments || []).length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 opacity-60 py-10">
                                    <MessageSquareIcon className="w-10 h-10" />
                                    <p className="text-xs font-medium">Chưa có bình luận nào</p>
                                </div>
                            ) : (
                                task.comments!.map(comment => (
                                    <div key={comment.id} className="flex gap-3 animate-fade-in group">
                                        <div className="shrink-0">
                                            {comment.authorAvatar ? (
                                                <img src={comment.authorAvatar} alt={comment.authorName} className="w-8 h-8 rounded-full shadow-sm" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-[10px] uppercase shadow-sm">
                                                    {comment.authorName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-slate-800 truncate">{comment.authorName}</span>
                                                <span className="text-[10px] font-medium text-slate-400 shrink-0">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-2xl rounded-tl-none shadow-sm transition-colors w-fit max-w-[90%]">
                                                <p className="text-[13px] text-slate-700 whitespace-pre-wrap leading-relaxed">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="px-4 pb-4 pt-2">
                             <div className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-300 transition-all">
                                <textarea 
                                    value={commentText}
                                    onChange={e => setCommentText(e.target.value)}
                                    placeholder="Viết phản hồi..."
                                    rows={2}
                                    className="w-full bg-transparent border-none p-3 pt-3 pr-12 text-sm focus:ring-0 outline-none resize-none"
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAddComment();
                                        }
                                    }}
                                />
                                <button 
                                    onClick={handleAddComment}
                                    disabled={!commentText.trim()}
                                    className="absolute right-2 bottom-2 p-1.5 bg-blue-600 text-white rounded-xl shadow-sm hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-50 transition-all"
                                >
                                    <PaperAirplaneIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                 </div>
             </div>
        </div>
    );
};

// --- SORTABLE TASK ITEM ---
interface SortableTaskItemProps {
    task: Task;
    listId: string;
    onEdit: (data: { task: Task; listId: string }) => void;
    onToggle: (listId: string, taskId: string) => void;
    onDelete: (listId: string, taskId: string) => void;
    onShare: (task: Task) => void;
    selectedTaskIds: string[];
    onToggleSelection: (taskId: string) => void;
}

const SortableTaskItem = ({ task, listId, onEdit, onToggle, onDelete, onShare, selectedTaskIds, onToggleSelection, allUsers, isBlocked }: SortableTaskItemProps & { allUsers: User[], isBlocked?: boolean }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: task.id });

    const [showHoverDetails, setShowHoverDetails] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 50 : (showHoverDetails ? 100 : 1),
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : undefined
    };

    const completionRate = task.subtasks && task.subtasks.length > 0 
        ? Math.round((task.subtasks.filter((s: TaskSubtask) => s.completed).length / task.subtasks.length) * 100) 
        : 0;

    const assignee = allUsers.find(u => u.id === task.assigneeId);

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...attributes} 
            {...listeners}
            className="relative"
            onMouseEnter={() => setShowHoverDetails(true)}
            onMouseLeave={() => setShowHoverDetails(false)}
        >
            <motion.div 
                layout
                className={`bg-white p-3.5 rounded-xl shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] border transition-all group relative cursor-pointer ${isBlocked ? 'border-red-200 bg-red-50/10' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'}`}
                onClick={() => onEdit({ task, listId })}
            >
                <div className="flex gap-3">
                    <label className="absolute top-2 right-2 max-h-0 opacity-0 group-hover:opacity-100 group-hover:max-h-12 overflow-visible transition-all cursor-pointer z-10" onClick={e => e.stopPropagation()}>
                        <input 
                            type="checkbox"
                            checked={selectedTaskIds.includes(task.id)}
                            onChange={() => onToggleSelection(task.id)}
                            className={`w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${selectedTaskIds.includes(task.id) ? 'opacity-100' : ''}`}
                        />
                    </label>
                    <div className="pt-0.5 shrink-0" onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => onToggle(listId, task.id)}
                            disabled={isBlocked}
                            className={`w-5 h-5 rounded-full border-[1.5px] transition-colors flex items-center justify-center p-[2px] ${task.completed ? 'border-blue-500 bg-blue-500 text-white' : isBlocked ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-blue-500'}`}
                        >
                             {task.completed ? (
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                             ) : isBlocked ? (
                                <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                             ) : (
                                <div className="w-full h-full rounded-full bg-blue-600 scale-0 group-hover:scale-50 transition-transform opacity-50"></div>
                             )}
                        </button>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1.5 pr-6">
                            <div className="flex items-center gap-1.5 min-w-0">
                                {isBlocked && <span className="text-[10px] font-bold text-red-600 uppercase tracking-tight bg-red-100 px-1.5 rounded shrink-0">Bị chặn</span>}
                                <h3 className={`text-sm font-semibold leading-snug break-words truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.text}</h3>
                            </div>
                            {!task.completed && task.priority && (
                                <span className={`px-2 py-0.5 mt-0.5 text-[10px] font-bold rounded-full whitespace-nowrap shrink-0 ${task.priority === 'Cao' ? 'bg-red-100 text-red-600' : task.priority === 'Thấp' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                    {task.priority}
                                </span>
                            )}
                        </div>

                        {task.subtasks && task.subtasks.length > 0 && (
                            <div className="mb-2">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến độ việc phụ</span>
                                    <span className="text-[10px] font-bold text-blue-600">{completionRate}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div 
                                        className="bg-blue-500 h-full transition-all duration-500" 
                                        style={{ width: `${completionRate}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                        
                        {/* Footer Info */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2">
                                {assignee && (
                                    <div className="flex items-center gap-1.5" title={assignee.name}>
                                        {assignee.avatar ? (
                                            <img src={assignee.avatar} alt="" className="w-5 h-5 rounded-full shadow-sm ring-1 ring-slate-200" />
                                        ) : (
                                            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-[9px] shadow-sm">
                                                {assignee.name.charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {task.recurring && task.recurring !== 'none' && (
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase px-1.5 py-0.5 bg-slate-50 rounded border border-slate-100">
                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        <span>{task.recurring === 'daily' ? 'Ngày' : task.recurring === 'weekly' ? 'Tuần' : 'Tháng'}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-2.5 text-slate-400">
                                {task.comments && task.comments.length > 0 && (
                                    <div className="flex items-center gap-1">
                                        <MessageSquareIcon className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold">{task.comments.length}</span>
                                    </div>
                                )}
                                
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -mr-1">
                                    <button onClick={(e) => { e.stopPropagation(); onShare(task); }} className="p-1 hover:text-blue-600 transition-colors" title="Chia sẻ"><ShareIcon className="w-3.5 h-3.5" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDelete(listId, task.id); }} className="p-1 hover:text-red-500 transition-colors"><TrashIcon className="w-3.5 h-3.5"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* HOVER DETAILS POPOVER */}
            <AnimatePresence>
                {showHoverDetails && !isDragging && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-full ml-3 top-0 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 z-50 pointer-events-auto cursor-default hidden lg:block"
                        onClick={e => e.stopPropagation()}
                    >
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100 flex justify-between items-center">
                            Chi tiết nhanh
                            {isBlocked && <span className="text-red-500">Lock</span>}
                        </h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-bold text-slate-700 mb-1">Trạng thái</p>
                                <div className="flex flex-wrap gap-2">
                                    {(['Cần làm', 'Đang làm', 'Hoàn thành'] as const).map((s) => (
                                        <button 
                                            key={s}
                                            disabled={isBlocked && s === 'Hoàn thành'}
                                            onClick={() => onToggle(listId, task.id)}
                                            className={`px-2 py-1 text-[10px] font-bold rounded-md uppercase border transition-all ${task.status === s ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {task.notes && (
                                <div>
                                    <p className="text-xs font-bold text-slate-700 mb-0.5">Ghi chú</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed italic">{task.notes}</p>
                                </div>
                            )}
                            {task.dependencyId && (
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                    <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                                    </svg>
                                    <span>Lệ thuộc: {task.dependencyId.slice(0, 8)}...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- MAIN COMPONENT ---
const TasklistView: React.FC<{ 
  user: User, 
  allUsers: User[], 
  initialListId?: string,
  onSendNotification?: (notifData: Omit<AppNotification, 'id' | 'createdAt'>) => void
}> = ({ user, allUsers, onSendNotification }) => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  useEffect(() => {
    if (!user || user.id.startsWith('user-')) {
        setTaskLists(mockTaskLists);
        return;
    }

    const q = query(
        collection(db, 'tasks'),
        where('ownerId', '==', user.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedTasks = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Task));

        fetchedTasks.sort((a, b) => {
            const oA = typeof a.order === 'number' ? a.order : 0;
            const oB = typeof b.order === 'number' ? b.order : 0;
            if (oA !== oB) return oA - oB;
            return (a.createdAt || 0) - (b.createdAt || 0);
        });
        
        const listsMap: Record<string, Task[]> = {};
        fetchedTasks.forEach(t => {
            const lid = t.taskListId || 'list-default';
            if (!listsMap[lid]) listsMap[lid] = [];
            listsMap[lid].push(t);
        });

        // Seed with at least one list if none exist
        if (Object.keys(listsMap).length === 0) {
            setTaskLists(mockTaskLists);
        } else {
             const newLists: TaskList[] = Object.entries(listsMap).map(([id, tasks]) => ({
                id,
                name: id === 'list-default' ? 'Công việc cá nhân' : id,
                tasks
            }));
            setTaskLists(newLists);
        }
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    return () => unsubscribe();
  }, [user?.id]);

  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  
  const handleSyncGoogleTasks = async () => {
      setIsSyncingTasks(true);
      showToast('Đang kết nối Google Tasks...');
      try {
          const token = await getAccessToken();
          if (!token) throw new Error("Chưa xác thực Google");
          
          const gLists = await fetchTaskLists(token);
          
          const syncedLists: TaskList[] = [];
          for (const gList of gLists) {
              const gTasks = await fetchTasks(token, gList.id);
              const mappedTasks: Task[] = gTasks.map(t => ({
                 id: t.id,
                 text: t.title,
                 notes: t.notes,
                 dueDate: t.due ? t.due.split('T')[0] : undefined,
                 completed: t.status === 'completed',
                 status: t.status === 'completed' ? 'Hoàn thành' : 'Cần làm',
                 priority: 'Trung bình',
                 source: 'google'
              }));
              syncedLists.push({
                  id: gList.id,
                  name: `(Google) ${gList.title}`,
                  tasks: mappedTasks,
                  source: 'google',
                  sharedUserIds: []
              });
          }
          
          setTaskLists(prev => {
              const prevWithoutGoogle = prev.filter(l => l.source !== 'google');
              return [...prevWithoutGoogle, ...syncedLists];
          });
          
          showToast('Đồng bộ Google Tasks thành công!');
      } catch (err) {
          console.error('Lỗi quy trình đồng bộ Google Tasks:', err);
          showToast('Đồng bộ thất bại. Vui lòng kết nối Google Tasks trong Cài đặt.');
      } finally {
          setIsSyncingTasks(false);
      }
  };

  const [newTaskTexts, setNewTaskTexts] = useState<Record<string, string>>({});
  const [newTaskPriorities, setNewTaskPriorities] = useState<Record<string, 'Thấp' | 'Trung bình' | 'Cao'>>({});
  const [newTaskRecurrings, setNewTaskRecurrings] = useState<Record<string, 'daily' | 'weekly' | 'monthly' | 'none'>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<{task: Task, listId: string} | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<{taskId: string, listId: string} | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [showTemplateMenuId, setShowTemplateMenuId] = useState<string | null>(null);
  const [listeningListId, setListeningListId] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [taskTemplates, setTaskTemplates] = useState<Task[]>(mockTaskTemplates);

  const handleBulkUpdate = (updates: Partial<Task>) => {
    setTaskLists(prev => prev.map(list => ({
        ...list,
        tasks: list.tasks.map(task => 
            selectedTaskIds.includes(task.id) ? { ...task, ...updates, updatedAt: Date.now() } : task
        )
    })));
    setSelectedTaskIds([]);
    setShowBulkActions(false);
    showToast(`Đã cập nhật ${selectedTaskIds.length} công việc!`);
  };

  const getAutoAssignee = (listId: string, priority: 'Thấp' | 'Trung bình' | 'Cao') => {
    const list = taskLists.find(l => l.id === listId);
    if (!list?.autoAssignmentRules) return undefined;
    const rule = list.autoAssignmentRules.find(r => r.priority === priority);
    return rule?.userId;
  };

  const isTaskBlocked = (task: Task) => {
    if (!task.dependencyId) return false;
    const allTasks = taskLists.flatMap(l => l.tasks);
    const dependency = allTasks.find(t => t.id === task.dependencyId);
    return dependency ? !dependency.completed : false;
  };

  const handleSaveAsTemplate = (task: Task) => {
    const newTemplate = { ...task, id: `tpl-${Date.now()}` };
    setTaskTemplates([...taskTemplates, newTemplate]);
    showToast("Đã lưu thành mẫu công việc!");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    if (active.id !== over.id) {
        let targetListId = '';
        let activeListIndex = -1;
        let overListIndex = -1;
        let activeTaskIndex = -1;
        let overTaskIndex = -1;

        taskLists.forEach((list, lIdx) => {
            const tIdx = list.tasks.findIndex(t => t.id === active.id);
            if (tIdx !== -1) {
                activeListIndex = lIdx;
                activeTaskIndex = tIdx;
            }
            const otIdx = list.tasks.findIndex(t => t.id === over.id);
            if (otIdx !== -1) {
                overListIndex = lIdx;
                overTaskIndex = otIdx;
            }
        });

        if (activeListIndex !== -1 && overListIndex !== -1) {
            const newLists = taskLists.map(l => ({ ...l, tasks: [...l.tasks] }));
            targetListId = newLists[overListIndex].id;

            if (activeListIndex === overListIndex) {
                // Reorder within the same list
                newLists[activeListIndex].tasks = arrayMove(
                    newLists[activeListIndex].tasks,
                    activeTaskIndex,
                    overTaskIndex
                );
            } else {
                // Move between lists
                const taskToMove = { ...newLists[activeListIndex].tasks[activeTaskIndex], taskListId: targetListId };
                newLists[activeListIndex].tasks.splice(activeTaskIndex, 1);
                newLists[overListIndex].tasks.splice(overTaskIndex, 0, taskToMove);
            }

            setTaskLists(newLists);

            // Firestore sync
            if (auth.currentUser && !active.id.toString().startsWith('task-')) {
                if (activeListIndex !== overListIndex) {
                    updateDoc(doc(db, 'tasks', active.id.toString()), {
                        taskListId: targetListId
                    }).catch(err => console.error("Error updating taskListId on drag end:", err));
                }

                // Update position order of all tasks in the target list
                newLists[overListIndex].tasks.forEach((t, index) => {
                    if (!t.id.startsWith('task-')) {
                        updateDoc(doc(db, 'tasks', t.id), {
                            order: index
                        }).catch(err => console.error("Error updating task order:", err));
                    }
                });

                if (activeListIndex !== overListIndex) {
                    // Update position order of the source list
                    newLists[activeListIndex].tasks.forEach((t, index) => {
                        if (!t.id.startsWith('task-')) {
                            updateDoc(doc(db, 'tasks', t.id), {
                                order: index
                            }).catch(err => console.error("Error updating task order in source list:", err));
                        }
                    });
                }
            }
        }
    }
  };

  const handleStartVoice = (listId: string) => {
      if (listeningListId === listId) return;
      
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
          showToast("Trình duyệt không hỗ trợ nhận diện giọng nói");
          return;
      }
      
      // @ts-expect-error - SpeechRecognition is not widely supported in type definitions
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'vi-VN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      
      recognition.onstart = () => {
          setListeningListId(listId);
      };
      
      recognition.onresult = (event: Event & { results: Array<Array<{ transcript: string }>> }) => {
          const transcript = event.results[0][0].transcript;
          setNewTaskTexts(prev => ({
              ...prev,
              [listId]: (prev[listId] ? prev[listId] + ' ' : '') + transcript
          }));
      };
      
      recognition.onerror = (event: Event & { error: string }) => {
          console.error('Speech recognition error', event.error);
          showToast("Lỗi nhận diện giọng nói");
          setListeningListId(null);
      };
      
      recognition.onend = () => {
          setListeningListId(null);
      };
      
      recognition.start();
  };

  // Thêm state cho danh sách
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');
  const [listMenuOpenId, setListMenuOpenId] = useState<string | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [sharingListId, setSharingListId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 2500);
  };

  const handleShare = (task: Task) => {
    const shareUrl = `${window.location.protocol}//${window.location.host}/?shareType=task&shareId=${task.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      showToast(`Đã sao chép liên kết chia sẻ công việc: "${task.text}"!`);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast(`Đã sao chép liên kết chia sẻ công việc: "${task.text}"!`);
    });
  };

  const handleAddList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
        const newList: TaskList = {
            id: `list-${Date.now()}`,
            name: newListName.trim(),
            tasks: [],
            sharedUserIds: []
        };
        setTaskLists([...taskLists, newList]);
        setNewListName('');
        setIsAddingList(false);
        return;
    }

    try {
        await addDoc(collection(db, 'taskLists'), {
            name: newListName.trim(),
            ownerId: currentUser.uid,
            createdAt: Date.now(),
            sharedUserIds: []
        });
        setNewListName('');
        setIsAddingList(false);
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'taskLists');
    }
  };

  const handleDeleteList = async (listId: string) => {
    if(confirm('Bạn có chắc chắn muốn xóa danh sách này?')) {
        if (!auth.currentUser || listId.startsWith('list-')) {
            setTaskLists(taskLists.filter(l => l.id !== listId));
            setListMenuOpenId(null);
            return;
        }

        try {
            await deleteDoc(doc(db, 'taskLists', listId));
            // Also delete tasks in this list? Usually tasks are linked by listId.
            // For now, just deleting the list item.
        } catch (error) {
            handleFirestoreError(error, OperationType.DELETE, 'taskLists');
        }
    }
    setListMenuOpenId(null);
  };

  const handleSaveListName = () => {
    if (!editingListName.trim() || !editingListId) return;
    setTaskLists(taskLists.map(l => 
        l.id === editingListId ? { ...l, name: editingListName.trim() } : l
    ));
    setEditingListId(null);
  };

  const handleToggleShareUser = (listId: string, userId: string) => {
      setTaskLists(taskLists.map(l => {
          if (l.id === listId) {
              const currentShared = l.sharedUserIds || [];
              if (currentShared.includes(userId)) {
                  return { ...l, sharedUserIds: currentShared.filter(id => id !== userId) };
              } else {
                  return { ...l, sharedUserIds: [...currentShared, userId] };
              }
          }
          return l;
      }));
  };

  const handleAddTask = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const text = newTaskTexts[listId];
    if (!text?.trim()) return;

    const currentUser = auth.currentUser;
    const priority = newTaskPriorities[listId] || 'Trung bình';
    const recurring = newTaskRecurrings[listId] || 'none';
    const autoAssigneeId = getAutoAssignee(listId, priority);
    const autoAssignee = autoAssigneeId ? allUsers.find(u => u.id === autoAssigneeId) : undefined;

    if (!currentUser || listId.startsWith('list-')) {
        const taskId = `task-${Date.now()}`;
        const newTask: Task = {
            id: taskId,
            text: text.trim(),
            completed: false,
            status: 'Cần làm',
            priority,
            recurring,
            updatedAt: Date.now(),
            assigneeId: autoAssigneeId || user.id,
            assigneeName: autoAssignee?.name || user.name,
            assigneeAvatar: autoAssignee?.avatar || user.avatar,
            order: 0
        };

        setTaskLists(taskLists.map(l => 
            l.id === listId ? { ...l, tasks: [newTask, ...l.tasks] } : l
        ));
        setNewTaskTexts({ ...newTaskTexts, [listId]: '' });
        setNewTaskPriorities({ ...newTaskPriorities, [listId]: 'Trung bình' });
        setNewTaskRecurrings({ ...newTaskRecurrings, [listId]: 'none' });
        return;
    }

    try {
        await addDoc(collection(db, 'tasks'), {
            text: text.trim(),
            completed: false,
            status: 'Cần làm',
            priority: newTaskPriorities[listId] || 'Trung bình',
            recurring,
            ownerId: currentUser.uid,
            taskListId: listId,
            createdAt: Date.now(),
            assigneeId: currentUser.uid,
            assigneeName: currentUser.displayName || 'Me',
            order: 0
        });
        setNewTaskTexts({ ...newTaskTexts, [listId]: '' });
        setNewTaskPriorities({ ...newTaskPriorities, [listId]: 'Trung bình' });
        setNewTaskRecurrings({ ...newTaskRecurrings, [listId]: 'none' });
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleToggleTask = async (listId: string, taskId: string) => {
    const task = taskLists.find(l => l.id === listId)?.tasks.find(t => t.id === taskId);
    if (!task) return;

    let regeneratedTask: Task | null = null;
    const nowCompleted = !task.completed;
    
    // Recurring task logic
    if (nowCompleted && task.recurring && task.recurring !== 'none') {
        regeneratedTask = {
            ...task,
            id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            completed: false,
            completedAt: undefined,
            updatedAt: Date.now(),
            history: []
        };
        
        // Update dueDate for regenerated task
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            if (task.recurring === 'daily') date.setDate(date.getDate() + 1);
            else if (task.recurring === 'weekly') date.setDate(date.getDate() + 7);
            else if (task.recurring === 'monthly') date.setMonth(date.getMonth() + 1);
            regeneratedTask.dueDate = date.toISOString().split('T')[0];
        }
    }

    if (!auth.currentUser || taskId.startsWith('task-')) {
        setTaskLists(taskLists.map(list => 
            list.id === listId
                ? {
                    ...list,
                    tasks: list.tasks.map(t =>
                        t.id === taskId ? { ...t, completed: nowCompleted, completedAt: nowCompleted ? Date.now() : undefined } : t
                    ),
                }
                : list
        ));
        
        if (regeneratedTask) {
            setTaskLists(prev => prev.map(l => l.id === listId ? { ...l, tasks: [regeneratedTask!, ...l.tasks] } : l));
            showToast("Đã tạo công việc định kỳ tiếp theo!");
        }
        return;
    }

    try {
        await updateDoc(doc(db, 'tasks', taskId), {
            completed: nowCompleted,
            completedAt: nowCompleted ? Date.now() : null
        });

        if (regeneratedTask) {
            const currentUser = auth.currentUser;
            await addDoc(collection(db, 'tasks'), {
                ...regeneratedTask,
                id: undefined, // let firestore generate id
                ownerId: currentUser.uid,
                taskListId: listId,
                createdAt: Date.now()
            });
            showToast("Đã tạo công việc định kỳ tiếp theo!");
        }
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };
  
  const handleSaveTask = async (updatedTask: Task) => {
    if (!editingTask) return;

    if (!auth.currentUser || updatedTask.id.startsWith('task-')) {
        setTaskLists(taskLists.map(list => 
            list.id === editingTask.listId
                ? {
                    ...list,
                    tasks: list.tasks.map(task =>
                        task.id === updatedTask.id ? updatedTask : task
                    ),
                }
                : list
        ));
        setEditingTask(null);
        return;
    }

    try {
        const { id, ...data } = updatedTask;
        await updateDoc(doc(db, 'tasks', id), {
            text: data.text,
            notes: data.notes || '',
            dueDate: data.dueDate || '',
            completed: data.completed,
            status: data.status || 'Cần làm',
            priority: data.priority || 'Trung bình',
            recurring: data.recurring || 'none',
            dependencyId: data.dependencyId || null
        });
        setEditingTask(null);
    } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'tasks');
    }
  };

  const handleDeleteTask = (listId: string, taskId: string) => {
    setTaskToDelete({ listId, taskId });
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;
    
    if (!auth.currentUser || taskToDelete.taskId.startsWith('task-')) {
        setTaskLists(taskLists.map(list =>
            list.id === taskToDelete.listId
            ? { ...list, tasks: list.tasks.filter(task => task.id !== taskToDelete.taskId) }
            : list
        ));
        setTaskToDelete(null);
        return;
    }

    try {
        await deleteDoc(doc(db, 'tasks', taskToDelete.taskId));
        setTaskToDelete(null);
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, 'tasks');
    }
  };

  const handlePrint = () => {
    const allTasks = taskLists.flatMap(list => list.tasks.map(task => ({
      ...task,
      listName: list.name
    })));

    const filtered = allTasks.filter(task => {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.text.toLowerCase().includes(searchLower) ||
        (task.assigneeName && task.assigneeName.toLowerCase().includes(searchLower)) ||
        (task.priority && task.priority.toLowerCase().includes(searchLower))
      );
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Báo cáo danh sách công việc</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { bg-color: #f2f2f2; }
            .priority-cao { color: red; font-weight: bold; }
            .status-hoan-thanh { color: green; }
          </style>
        </head>
        <body>
          <h1>Danh sách công việc (${new Date().toLocaleDateString()})</h1>
          <table>
            <thead>
              <tr>
                <th>Công việc</th>
                <th>Danh sách</th>
                <th>Người phụ trách</th>
                <th>Hạn chót</th>
                <th>Độ ưu tiên</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(t => `
                <tr>
                  <td>${t.text}</td>
                  <td>${t.listName}</td>
                  <td>${t.assigneeName || 'Chưa phân công'}</td>
                  <td>${t.dueDate || '-'}</td>
                  <td class="priority-${(t.priority || '').toLowerCase()}">${t.priority || 'Trung bình'}</td>
                  <td class="status-${(t.status || '').toLowerCase().replace(' ', '-')}">${t.status || (t.completed ? 'Hoàn thành' : 'Cần làm')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  // Auto-archive tasks logic: Archive "Hoàn thành" tasks older than 30 days
  useEffect(() => {
    const archiveInterval = setInterval(() => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        let hasChanges = false;
        const newTaskLists = taskLists.map(list => {
            const updatedTasks = list.tasks.map(task => {
                if (task.completed && task.completedAt && task.completedAt < thirtyDaysAgo && !task.archived) {
                    hasChanges = true;
                    return { ...task, archived: true };
                }
                return task;
            });
            return { ...list, tasks: updatedTasks };
        });

        if (hasChanges) {
            setTaskLists(newTaskLists);
            // In a real app, you'd update firestore here too for each changed task
            // For now, we update local state
        }
    }, 1000 * 60 * 60); // Check once an hour
    return () => clearInterval(archiveInterval);
  }, [taskLists]);

  // Deadline notifications logic
  useEffect(() => {
    const notificationInterval = setInterval(() => {
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      taskLists.forEach(list => {
        list.tasks.forEach(task => {
          if (task.dueDate && !task.completed && !task.archived) {
            const dueTime = new Date(`${task.dueDate}T23:59:59`).getTime();
            const timeDiff = dueTime - now;
            
            if (timeDiff > 0 && timeDiff < oneHour) {
               // Logic to prevent duplicate notifications would be needed here
               // For now, we just call onSendNotification if it exists
               if (onSendNotification) {
                   onSendNotification({
                       userId: task.assigneeId || user.id,
                       title: `Sắp đến hạn: ${task.text}`,
                       message: `Công việc này sẽ hết hạn trong vòng 1 giờ nữa.`,
                       read: false,
                       type: 'task',
                       link: 'tasklist'
                   });
               }
            }
          }
        });
      });
    }, 60000); // Check every minute
    return () => clearInterval(notificationInterval);
  }, [taskLists, onSendNotification, user.id]);

  const handleDownloadCSV = () => {
    const allTasks = taskLists.flatMap(list => list.tasks.map(task => ({
      ...task,
      listName: list.name
    })));

    const filtered = allTasks.filter(task => {
      const searchLower = searchTerm.toLowerCase();
      return (
        task.text.toLowerCase().includes(searchLower) ||
        (task.assigneeName || '').toLowerCase().includes(searchLower) ||
        (task.priority || '').toLowerCase().includes(searchLower)
      );
    });

    if (filtered.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    const headers = ["ID", "Công việc", "Danh sách", "Trạng thái", "Độ ưu tiên", "Người phụ trách", "Ngày hết hạn", "Hoàn thành"];
    const rows = filtered.map(t => [
      t.id,
      t.text.replace(/"/g, '""'),
      t.listName.replace(/"/g, '""'),
      t.status || '',
      t.priority || '',
      t.assigneeName || '',
      t.dueDate || '',
      t.completed ? "Có" : "Không"
    ]);

    const csvContent = "\uFEFF" + [
      headers.join(","),
      ...rows.map(r => r.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tasks_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cancelDeleteTask = () => {
    setTaskToDelete(null);
  };

  const handleToggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
    );
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    if (scrollRef.current && e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleBulkComplete = () => {
    setTaskLists(taskLists.map(list => ({
      ...list,
      tasks: list.tasks.map(task => 
        selectedTaskIds.includes(task.id) ? { ...task, completed: true } : task
      )
    })));
    setSelectedTaskIds([]);
  };

  const handleBulkDelete = () => {
    if (confirm(`Bạn có chắc muốn xóa ${selectedTaskIds.length} nhiệm vụ đã chọn?`)) {
      setTaskLists(taskLists.map(list => ({
        ...list,
        tasks: list.tasks.filter(task => !selectedTaskIds.includes(task.id))
      })));
      setSelectedTaskIds([]);
    }
  };

  const applyTemplate = (listId: string, template: typeof mockTaskTemplates[0]) => {
    const newTask: Task = {
        id: `task-${Date.now()}`,
        text: template.text,
        notes: template.notes,
        priority: template.priority,
        completed: false,
        updatedAt: Date.now(),
    };
    setTaskLists(taskLists.map(list => 
        list.id === listId 
            ? { ...list, tasks: [...list.tasks, newTask] }
            : list
    ));
    setShowTemplateMenuId(null);
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-[3px] pb-24 md:pb-8">
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar">
        {editingTask && <TaskEditModal 
            task={editingTask.task} 
            user={user}
            allUsers={allUsers}
            allTasks={taskLists.flatMap(l => l.tasks)}
            onClose={() => setEditingTask(null)} 
            onSave={handleSaveTask} 
            onDelete={(taskId) => { handleDeleteTask(editingTask.listId, taskId); setEditingTask(null); }} 
            onSaveAsTemplate={handleSaveAsTemplate}
        />}
        
        {taskToDelete && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div className="absolute inset-0" onClick={cancelDeleteTask}></div>
            <div className="relative w-full max-w-sm bg-white/90 backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
              <div className="p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-2">Xóa công việc</h2>
                <p className="text-slate-600 text-sm">Bạn có chắc chắn muốn xóa công việc này? Hành động này không thể hoàn tác.</p>
              </div>
              <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-slate-50/50 rounded-b-xl">
                <button onClick={cancelDeleteTask} className="py-2 px-4 rounded-lg font-semibold text-slate-700 hover:bg-slate-200 transition-colors">Hủy</button>
                <button onClick={confirmDeleteTask} className="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md shadow-red-500/20">Xóa</button>
              </div>
            </div>
          </div>
        )}

        <TasklistBanner onSync={handleSyncGoogleTasks} isSyncing={isSyncingTasks} />
        
        {/* Search and Action Bar */}
        <div className="flex flex-col sm:flex-row gap-3 px-1 py-2">
            <div className="relative flex-1 group">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo tên công việc, người phụ trách hoặc độ ưu tiên..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/70 backdrop-blur-md border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none transition-all shadow-sm"
                />
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handlePrint}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <ShareIcon className="w-4 h-4 rotate-180" /> In danh sách
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center gap-2"
                >
                  <ShareIcon className="w-4 h-4" /> Xuất CSV
                </button>
                {selectedTaskIds.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleBulkComplete}
                      className="px-4 py-2 bg-blue-100 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4 rotate-45" /> Hoàn thành ({selectedTaskIds.length})
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-xl text-sm font-bold hover:bg-red-200 transition-all flex items-center gap-2"
                    >
                      <TrashIcon className="w-4 h-4" /> Xóa ({selectedTaskIds.length})
                    </button>
                  </div>
                )}
            </div>
        </div>
        
        {/* Kanban Board Container */}
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
        <div 
            ref={scrollRef}
            onWheel={handleWheel}
            className="flex-1 flex gap-4 overflow-x-auto overflow-y-hidden no-scrollbar pb-4 snap-x relative h-full"
        >
            {taskLists.map(list => {
                const searchLower = searchTerm.toLowerCase();
                const filteredTasks = list.tasks.filter(task => {
                    return (
                      task.text.toLowerCase().includes(searchLower) ||
                      (task.assigneeName || '').toLowerCase().includes(searchLower) ||
                      (task.priority || '').toLowerCase().includes(searchLower)
                    );
                });

                const uncompletedTasks = filteredTasks.filter(t => !t.completed);
                const completedTasks = filteredTasks.filter(t => t.completed);

                return (
                  <div key={list.id} className="w-80 sm:w-96 shrink-0 bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 flex flex-col snap-center max-h-full overflow-hidden">
                    {/* Column Header */}
                    <div className="p-4 border-b border-white/50 shrink-0 flex justify-between items-center bg-white/40">
                      {editingListId === list.id ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="text" 
                            value={editingListName} 
                            onChange={e => setEditingListName(e.target.value)} 
                            className="flex-1 bg-white border border-blue-500 rounded px-2 py-1 text-sm font-semibold text-slate-800"
                            autoFocus
                            onKeyDown={e => { if(e.key === 'Enter') handleSaveListName(); if(e.key === 'Escape') setEditingListId(null); }}
                          />
                          <button onClick={handleSaveListName} className="text-blue-600 font-bold text-xs">Lưu</button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-slate-800">{list.name}</h2>
                            <span className="text-sm font-bold text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{list.tasks.length}</span>
                            {/* Chân dung người dùng được chia sẻ */}
                            {list.sharedUserIds && list.sharedUserIds.length > 0 && (
                                <div className="flex -space-x-2">
                                  {list.sharedUserIds.map(uid => {
                                      const u = allUsers.find(au => au.id === uid);
                                      if (!u) return null;
                                      return u.avatar ? (
                                        <img key={u.id} src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full border border-white" title={u.name} />
                                      ) : (
                                        <div key={u.id} className="w-6 h-6 rounded-full border border-white bg-slate-200 flex justify-center items-center text-[10px] text-slate-600 font-bold" title={u.name}>{u.name.charAt(0)}</div>
                                      );
                                  })}
                                </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity relative">
                            <button onClick={() => setSharingListId(sharingListId === list.id ? null : list.id)} className={`p-1 rounded-lg transition-colors ${sharingListId === list.id ? 'bg-blue-100 text-blue-600' : 'text-slate-500 hover:bg-slate-100'}`} title="Thêm thành viên">
                                <UserPlusIcon className="w-4 h-4" />
                            </button>
                            {sharingListId === list.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                                  <div className="px-3 py-2 text-xs font-bold text-slate-500 border-b border-slate-100">Chia sẻ danh sách</div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {allUsers.map(u => (
                                      <label key={u.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={list.sharedUserIds?.includes(u.id) || false}
                                            onChange={() => handleToggleShareUser(list.id, u.id)}
                                            className="rounded text-blue-600"
                                        />
                                        <span className="text-xs font-medium text-slate-700 truncate">{u.name}</span>
                                      </label>
                                    ))}
                                  </div>
                              </div>
                            )}

                            <button onClick={() => setListMenuOpenId(listMenuOpenId === list.id ? null : list.id)} className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"><MoreVerticalIcon className="w-5 h-5" /></button>
                            {listMenuOpenId === list.id && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-20 py-1">
                                <button onClick={() => { setEditingListId(list.id); setEditingListName(list.name); setListMenuOpenId(null); }} className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Đổi tên</button>
                                <button onClick={() => handleDeleteList(list.id)} className="w-full text-left px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Xóa danh sách</button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-4">
                      {/* Add Task Quick Row */}
                      <div className="flex flex-col gap-2">
                          <form onSubmit={(e) => handleAddTask(e, list.id)} className="flex items-center gap-3 bg-white/70 p-2.5 rounded-xl border border-white/50 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <PlusIcon className="w-5 h-5 text-blue-500 shrink-0 ml-1" />
                            <input
                                type="text"
                                value={newTaskTexts[list.id] || ''}
                                onChange={(e) => setNewTaskTexts({...newTaskTexts, [list.id]: e.target.value})}
                                placeholder={listeningListId === list.id ? "Đang nghe..." : "Thêm công việc mới..."}
                                className="flex-1 bg-transparent border-none text-sm text-slate-700 placeholder-slate-400 focus:outline-none font-medium min-w-0"
                            />
                            <button
                                type="button"
                                onClick={() => handleStartVoice(list.id)}
                                title="Nhập bằng giọng nói"
                                className={`shrink-0 p-1.5 rounded-full transition-all ${listeningListId === list.id ? 'bg-red-100 text-red-500 animate-pulse' : 'text-slate-400 hover:text-blue-500 hover:bg-slate-100'}`}
                            >
                                <MicIcon className="w-5 h-5 flex-shrink-0" />
                            </button>
                            <select 
                                value={newTaskPriorities[list.id] || 'Trung bình'} 
                                onChange={e => setNewTaskPriorities({...newTaskPriorities, [list.id]: e.target.value as 'Thấp' | 'Trung bình' | 'Cao'})}
                                className="bg-transparent text-xs text-slate-500 font-semibold focus:outline-none shrink-0"
                            >
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                            </select>
                            <select 
                                value={newTaskRecurrings[list.id] || 'none'} 
                                onChange={e => setNewTaskRecurrings({...newTaskRecurrings, [list.id]: e.target.value as 'daily' | 'weekly' | 'monthly' | 'none'})}
                                className="bg-transparent text-xs text-slate-500 font-semibold focus:outline-none shrink-0"
                                title="Định kỳ"
                            >
                                <option value="none">Không lặp</option>
                                <option value="daily">Hàng ngày</option>
                                <option value="weekly">Hàng tuần</option>
                                <option value="monthly">Hàng tháng</option>
                            </select>
                          </form>
                          <div className="relative">
                              <button 
                                  onClick={() => setShowTemplateMenuId(showTemplateMenuId === list.id ? null : list.id)}
                                  className="mx-auto flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800  transition-colors"
                              >
                                  <PlusIcon className="w-3.5 h-3.5"/> Dùng mẫu
                              </button>
                              {showTemplateMenuId === list.id && (
                                  <div className="absolute top-full mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
                                      <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chọn mẫu</div>
                                      <ul className="max-h-48 overflow-y-auto no-scrollbar">
                                          {mockTaskTemplates.map(tpl => (
                                              <li key={tpl.id}>
                                                  <button 
                                                      onClick={() => applyTemplate(list.id, tpl)}
                                                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                                                  >
                                                      <span className="block font-semibold text-slate-800 text-xs mb-0.5">{tpl.text}</span>
                                                      {tpl.notes && <span className="block text-[10px] text-slate-500 line-clamp-1">{tpl.notes}</span>}
                                                  </button>
                                              </li>
                                          ))}
                                      </ul>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* Tasks List */}
                      <div className="space-y-3">
                        <SortableContext items={uncompletedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                            <AnimatePresence initial={false}>
                            {uncompletedTasks.map((task) => (
                              <SortableTaskItem 
                                key={task.id}
                                task={task}
                                listId={list.id}
                                onEdit={setEditingTask}
                                onToggle={handleToggleTask}
                                onDelete={handleDeleteTask}
                                onShare={handleShare}
                                selectedTaskIds={selectedTaskIds}
                                onToggleSelection={handleToggleTaskSelection}
                                allUsers={allUsers}
                                isBlocked={isTaskBlocked(task)}
                              />
                            ))}
                            </AnimatePresence>
                        </SortableContext>
                      </div>

                      {completedTasks.length > 0 && (
                        <div className="pt-2">
                          <details className="group">
                              <summary className="text-xs font-bold text-slate-500 cursor-pointer list-outside p-1.5 hover:bg-white/40 rounded-lg transition-colors flex items-center gap-1 flex-row-reverse justify-end marker:content-none">
                                  <span>Đã xong ({completedTasks.length})</span>
                                  <svg className="w-3 h-3 text-slate-400 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                  </svg>
                              </summary>
                              <div className="mt-3 space-y-2.5 pl-1.5">
                                  {completedTasks.map(task => (
                                      <div key={task.id} className="flex items-start gap-3 group relative opacity-70 hover:opacity-100 transition-opacity">
                                          <label className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer z-10" onClick={e => e.stopPropagation()}>
                                              <input 
                                                  type="checkbox"
                                                  checked={selectedTaskIds.includes(task.id)}
                                                  onChange={() => handleToggleTaskSelection(task.id)}
                                                  className={`w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${selectedTaskIds.includes(task.id) ? 'opacity-100' : ''}`}
                                              />
                                          </label>
                                          <div className="pt-0.5 shrink-0">
                                              <button 
                                                  onClick={() => handleToggleTask(list.id, task.id)}
                                                  className="w-5 h-5 rounded-full border-[1.5px] border-blue-500 transition-colors flex items-center justify-center bg-blue-500 text-white"
                                              >
                                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                                  </svg>
                                              </button>
                                          </div>
                                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditingTask({ task, listId: list.id })}>
                                              <p className="text-sm font-medium text-slate-500 line-through decoration-slate-400 decoration-1 break-words">{task.text}</p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                );
            })}
            
            {/* Add List Button */}
            <div className="w-80 sm:w-96 shrink-0 snap-center">
              {isAddingList ? (
                <div className="bg-white/60 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 p-4 animate-scale-in">
                  <form onSubmit={handleAddList} className="flex flex-col gap-3">
                    <input 
                      type="text" 
                      value={newListName} 
                      onChange={e => setNewListName(e.target.value)} 
                      placeholder="Nhập tên danh sách..."
                      className="bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                    <div className="flex gap-2">
                        <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-md">Thêm danh sách</button>
                        <button type="button" onClick={() => { setIsAddingList(false); setNewListName(''); }} className="px-4 py-2 hover:bg-slate-200/50 rounded-lg font-bold text-slate-500 text-sm transition-colors">Hủy</button>
                    </div>
                  </form>
                </div>
              ) : (
                <button onClick={() => setIsAddingList(true)} className="w-full flex items-center gap-2 bg-white/40 hover:bg-white/60 backdrop-blur-sm border border-white/40 p-4 rounded-2xl transition-all shadow-sm group">
                  <div className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                    <PlusIcon className="w-5 h-5"/>
                  </div>
                  <span className="font-bold text-slate-600 group-hover:text-blue-700">Thêm danh sách mới</span>
                </button>
              )}
            </div>
        </div>
        </DndContext>
      </div>
      
      {/* Bulk actions bottom bar */}
      <AnimatePresence>
        {selectedTaskIds.length > 0 && (
            <motion.div 
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900/95 text-white px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md z-[100] flex items-center gap-8 border border-white/10"
            >
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đã chọn</span>
                    <span className="text-xl font-black text-blue-400 leading-tight">{selectedTaskIds.length} <span className="text-xs font-medium text-slate-300">Việc</span></span>
                </div>
                
                <div className="h-8 w-px bg-slate-700 mx-2" />

                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setShowBulkActions(true)}
                        className="flex flex-col items-center gap-1 hover:text-blue-400 transition-colors group"
                    >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <PlusIcon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Cập nhật</span>
                    </button>
                    <button 
                        onClick={() => {
                            if(confirm(`Xóa ${selectedTaskIds.length} công việc đã chọn?`)) {
                                setTaskLists(prev => prev.map(l => ({
                                    ...l,
                                    tasks: l.tasks.filter(t => !selectedTaskIds.includes(t.id))
                                })));
                                setSelectedTaskIds([]);
                                showToast("Đã xóa các công việc!");
                            }
                        }}
                        className="flex flex-col items-center gap-1 hover:text-red-400 transition-colors group"
                    >
                        <div className="p-2 bg-white/10 rounded-xl group-hover:bg-red-600 group-hover:text-white transition-all">
                            <TrashIcon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-tighter">Xóa</span>
                    </button>
                </div>
                
                <button onClick={() => setSelectedTaskIds([])} className="ml-4 p-1.5 hover:bg-white/10 rounded-full transition-colors"><XIcon className="w-5 h-5" /></button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Actions Modal */}
      {showBulkActions && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                  <header className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-800">Cập nhật hàng loạt ({selectedTaskIds.length} việc)</h3>
                      <button onClick={() => setShowBulkActions(false)} className="p-1 hover:bg-slate-200 rounded-full"><XIcon className="w-5 h-5"/></button>
                  </header>
                  <div className="p-6 space-y-6">
                      <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Đổi trạng thái</label>
                            <div className="grid grid-cols-2 gap-2">
                                {(['Cần làm', 'Đang làm', 'Xem xét', 'Hoàn thành'] as const).map((s) => (
                                    <button 
                                        key={s} 
                                        onClick={() => handleBulkUpdate({ status: s, completed: s === 'Hoàn thành' })}
                                        className="py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-blue-500 hover:text-blue-600 transition-all text-center"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Gán cho người phụ trách</label>
                            <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-50 rounded-xl border border-slate-200 no-scrollbar">
                                {allUsers.map(u => (
                                    <button 
                                        key={u.id}
                                        onClick={() => handleBulkUpdate({ assigneeId: u.id, assigneeName: u.name, assigneeAvatar: u.avatar })}
                                        className="w-full flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors text-left"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">{u.name.charAt(0)}</div>
                                        <span className="text-xs font-bold text-slate-700">{u.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                      </div>
                  </div>
                  <footer className="p-4 bg-slate-50 flex justify-end">
                      <button onClick={() => setShowBulkActions(false)} className="text-sm font-bold text-slate-500 px-4 py-2 hover:text-slate-700">Đóng</button>
                  </footer>
              </div>
          </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-fade-in-up">
          <div className="w-2 h-2 rounded-full bg-green-400"></div>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};

export default TasklistView;