import React, { useState, useEffect, useRef } from 'react';
import TaskManagementBanner from './TaskManagementBanner';
import { FileTextIcon, XIcon, ClipboardListIcon, TrashIcon, ClockIcon } from './icons';
import { RecentItem, AppNotification } from '../App';
import { db } from '../firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

type TaskStatus = 'Cần làm' | 'Đang làm' | 'Xem xét' | 'Hoàn thành';
type TaskPriority = 'Cao' | 'Trung bình' | 'Thấp';

export interface TaskLabel {
    name: string;
    color: string;
}

export interface TaskComment {
    id: string;
    author: string;
    text: string;
    timestamp: number;
}

export interface TaskSubtask {
    id: string;
    title: string;
    completed: boolean;
}

export interface TaskHistoryItem {
    id: string;
    action: string;
    details: string;
    timestamp: number;
}

interface Task {
    id: string;
    title: string;
    project: string;
    priority: TaskPriority;
    status: TaskStatus;
    notes?: string;
    dueDate?: string;
    labels?: TaskLabel[];
    comments?: TaskComment[];
    subtasks?: TaskSubtask[];
    attachments?: { id: string, name: string, url: string, size: number }[];
    history?: TaskHistoryItem[];
    completedAt?: number;
    archived?: boolean;
    timeSpent?: number; // Total time in milliseconds
    timerStartedAt?: number; // Timestamp when timer was last started
}

const mockTasks: Task[] = [
    { id: 't1', title: 'Thiết kế banner quảng cáo', project: 'Marketing Mùa lễ hội', priority: 'Cao', status: 'Cần làm', notes: 'Yêu cầu: Kích thước 1200x628px. Tone màu chủ đạo là đỏ và vàng. Chèn logo ở góc phải.', dueDate: '2024-08-10', labels: [{name: 'Gấp', color: 'bg-red-500'}], comments: [] },
    { id: 't2', title: 'Phân tích hành vi người dùng', project: 'Tối ưu hóa Onboarding', priority: 'Cao', status: 'Đang làm', notes: '', dueDate: '2024-08-15', labels: [{name: 'Tính năng', color: 'bg-blue-500'}], comments: [] },
    { id: 't3', title: 'Viết nội dung social media', project: 'Marketing Mùa lễ hội', priority: 'Trung bình', status: 'Cần làm', labels: [], comments: [] },
    { id: 't4', title: 'Test A/B trang giá', project: 'Tối ưu hóa Conversion', priority: 'Trung bình', status: 'Xem xét', notes: 'So sánh 2 phiên bản: layout 3 cột và layout bảng giá chi tiết. Liên hệ team design để lấy file Figma.', dueDate: '2024-08-05', labels: [{name: 'Thử nghiệm', color: 'bg-purple-500'}], comments: [] },
    { id: 't5', 'title': 'Fix bug #512 - Nút submit bị vô hiệu hóa', project: 'Bảo trì hệ thống', priority: 'Cao', status: 'Đang làm', notes: 'Bug xảy ra trên trình duyệt Safari phiên bản 15.x. Cần kiểm tra lại logic validation form.', labels: [{name: 'Lỗi', color: 'bg-red-600'}], comments: [] },
    { id: 't6', title: 'Lên kế hoạch cho Q1/2025', project: 'Chiến lược công ty', priority: 'Thấp', status: 'Hoàn thành', labels: [], comments: [] },
    { id: 't7', title: 'Redesign trang đăng ký', project: 'Tối ưu hóa Onboarding', priority: 'Trung bình', status: 'Xem xét', labels: [{name: 'Thiết kế', color: 'bg-pink-500'}], comments: [] },
    { id: 't8', 'title': 'Cập nhật thư viện dependencies', project: 'Bảo trì hệ thống', priority: 'Thấp', status: 'Hoàn thành', notes: 'Chạy `npm audit` để kiểm tra các lỗ hổng bảo mật sau khi cập nhật.', labels: [{name: 'Bảo trì', color: 'bg-slate-500'}], comments: [] },
];

const priorityStyles: Record<TaskPriority, string> = {
    'Cao': 'bg-red-100 text-red-700 border-l-4 border-red-500',
    'Trung bình': 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500',
    'Thấp': 'bg-green-100 text-green-700 border-l-4 border-green-500',
};

const statusStyles: Record<TaskStatus, { bg: string, text: string }> = {
    'Cần làm': { bg: 'bg-slate-200', text: 'text-slate-800' },
    'Đang làm': { bg: 'bg-blue-200', text: 'text-blue-800' },
    'Xem xét': { bg: 'bg-purple-200', text: 'text-purple-800' },
    'Hoàn thành': { bg: 'bg-green-200', text: 'text-green-800' },
}

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onSaveTask: (task: Task, isAutoSave?: boolean) => void;
    onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task: initialTask, onClose, onSaveTask, onDelete }) => {
    const [task, setTask] = useState(initialTask);
    const [newComment, setNewComment] = useState('');
    const [newLabelName, setNewLabelName] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [timerActive, setTimerActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(initialTask.timeSpent || 0);

    // Auto-save logic
    useEffect(() => {
        const timer = setTimeout(() => {
            // Shallow check for changes to avoid infinite loop
            if (task.notes !== initialTask.notes || 
                task.status !== initialTask.status || 
                task.dueDate !== initialTask.dueDate ||
                JSON.stringify(task.subtasks) !== JSON.stringify(initialTask.subtasks) ||
                JSON.stringify(task.labels) !== JSON.stringify(initialTask.labels)) {
                
                onSaveTask(task, true);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [task.notes, task.status, task.dueDate, task.subtasks, task.labels]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerActive) {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1000);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerActive]);

    const handleToggleTimer = () => {
        if (timerActive) {
            // Stop timer
            const newTimeSpent = elapsedTime;
            setTask(current => ({ ...current, timeSpent: newTimeSpent, timerStartedAt: undefined }));
            setTimerActive(false);
        } else {
            // Start timer
            setTask(current => ({ ...current, timerStartedAt: Date.now() }));
            setTimerActive(true);
        }
    };

    const handleResetTimer = () => {
        setElapsedTime(0);
        setTask(current => ({ ...current, timeSpent: 0, timerStartedAt: undefined }));
        setTimerActive(false);
    };

    const formatTime = (ms: number) => {
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)));
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');

    const handleSave = () => {
        const history: TaskHistoryItem[] = [...(task.history || [])];
        if (task.status !== initialTask.status) {
            history.push({
                id: `hist-${Date.now()}-status`,
                action: 'Cập nhật trạng thái',
                details: `Từ "${initialTask.status}" sang "${task.status}"`,
                timestamp: Date.now()
            });
        }
        
        onSaveTask({
            ...task,
            history,
            completedAt: task.status === 'Hoàn thành' && initialTask.status !== 'Hoàn thành' ? Date.now() : task.completedAt
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const newFiles = Array.from(e.target.files).map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            url: URL.createObjectURL(file),
            size: file.size
        }));
        setTask(current => ({ ...current, attachments: [...(current.attachments || []), ...newFiles] }));
        e.target.value = '';
    };

    const handleRemoveAttachment = (id: string) => {
        setTask(current => ({ ...current, attachments: current.attachments?.filter(a => a.id !== id) }));
    };

    const handleChange = <K extends keyof Task>(field: K, value: Task[K]) => {
        setTask(current => ({ ...current, [field]: value }));
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment: TaskComment = {
            id: Date.now().toString(),
            author: 'Người dùng hiện tại',
            text: newComment,
            timestamp: Date.now()
        };
        setTask(current => ({ ...current, comments: [...(current.comments || []), comment] }));
        setNewComment('');
    };

    const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && newLabelName.trim()) {
            e.preventDefault();
            const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
            const randomColor = colors[Math.floor(Math.random() * colors.length)];
            const newLabel: TaskLabel = { name: newLabelName.trim(), color: randomColor };
            setTask(current => ({ ...current, labels: [...(current.labels || []), newLabel] }));
            setNewLabelName('');
        }
    };

    const handleRemoveLabel = (indexToRemove: number) => {
        setTask(current => ({
            ...current,
            labels: current.labels?.filter((_, index) => index !== indexToRemove)
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" aria-modal="true" role="dialog">
            <div className="absolute inset-0" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up max-h-[90vh]">
                <header className="p-4 border-b border-[--color-border-secondary] flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-[--color-text-primary]">{task.title}</h2>
                        <div className="flex gap-4 mt-1">
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
                                Lịch sử
                             </button>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-[--color-text-secondary]" aria-label="Close">
                        <XIcon className="w-5 h-5"/>
                    </button>
                </header>
                <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar">
                    {activeTab === 'details' ? (
                      <>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label htmlFor="task-status" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Trạng thái</label>
                                <select
                                    id="task-status"
                                    value={task.status}
                                    onChange={(e) => handleChange('status', e.target.value as TaskStatus)}
                                    className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                                >
                                    <option value="Cần làm">Cần làm</option>
                                    <option value="Đang làm">Đang làm</option>
                                    <option value="Xem xét">Xem xét</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                <label htmlFor="task-dueDate" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Ngày hết hạn</label>
                                <input
                                    id="task-dueDate"
                                    type="date"
                                    value={task.dueDate || ''}
                                    onChange={(e) => handleChange('dueDate', e.target.value)}
                                    className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl flex items-center justify-between border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${timerActive ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-blue-100 text-blue-600'}`}>
                                    <ClockIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Thời gian thực hiện</p>
                                    <p className="text-2xl font-mono font-bold text-[--color-text-primary]">{formatTime(elapsedTime)}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    type="button"
                                    onClick={handleToggleTimer}
                                    className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${timerActive ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                                >
                                    {timerActive ? 'Tạm dừng' : 'Bắt đầu'}
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleResetTimer}
                                    className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                    title="Reset timer"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        
                        <div>
                            <label className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Nhãn (Labels)</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {(task.labels || []).map((label, index) => (
                                    <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${label.color}`}>
                                        {label.name}
                                        <button type="button" onClick={() => handleRemoveLabel(index)} className="ml-1.5 hover:text-white/70">
                                            <XIcon className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={newLabelName}
                                onChange={(e) => setNewLabelName(e.target.value)}
                                onKeyDown={handleAddLabel}
                                placeholder="Gõ tên nhãn và nhấn Enter (VD: Quan trọng)"
                                className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] text-sm focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            />
                        </div>
    
                        <div>
                            <label className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Nhiệm vụ phụ (Subtasks)</label>
                            <div className="space-y-2 mb-2">
                                {(task.subtasks || []).map(st => (
                                    <div key={st.id} className="flex items-center justify-between group bg-white/50 dark:bg-black/10 p-2 rounded border border-slate-100 dark:border-slate-800">
                                        <label className="flex items-center gap-2 cursor-pointer flex-1">
                                            <input 
                                                type="checkbox" 
                                                checked={st.completed} 
                                                onChange={(e) => {
                                                    const newSubtasks = (task.subtasks || []).map(s => s.id === st.id ? { ...s, completed: e.target.checked } : s);
                                                    handleChange('subtasks', newSubtasks);
                                                }}
                                                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                            />
                                            <span className={`text-sm ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{st.title}</span>
                                        </label>
                                        <button 
                                            onClick={() => handleChange('subtasks', (task.subtasks || []).filter(s => s.id !== st.id))}
                                            className="text-red-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        >
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && newSubtaskTitle.trim()) {
                                        e.preventDefault();
                                        const st: TaskSubtask = { id: Date.now().toString(), title: newSubtaskTitle.trim(), completed: false };
                                        handleChange('subtasks', [...(task.subtasks || []), st]);
                                        setNewSubtaskTitle('');
                                    }
                                }}
                                placeholder="Thêm nhiệm vụ phụ và nhấn Enter..."
                                className="w-full bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] text-sm focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-[--color-text-secondary] mb-1 block flex justify-between items-center">
                                Đính kèm
                                <label className="cursor-pointer text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 text-xs">
                                    <ClockIcon className="w-3.5 h-3.5" /> Thêm tệp
                                    <input type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*" capture="environment" />
                                </label>
                            </label>
                            <div className="space-y-2">
                                {(task.attachments || []).map(att => (
                                    <div key={att.id} className="flex items-center justify-between p-2 bg-white/50 dark:bg-black/10 rounded border border-slate-100 dark:border-slate-800 group">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <div className="w-7 h-7 bg-blue-100 text-blue-600 rounded flex items-center justify-center shrink-0">
                                                <FileTextIcon className="w-4 h-4" />
                                            </div>
                                            <span className="text-xs truncate">{att.name}</span>
                                        </div>
                                        <button onClick={() => handleRemoveAttachment(att.id)} className="text-red-400 opacity-0 group-hover:opacity-100 p-1">
                                            <XIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
    
                        <div>
                            <label htmlFor="task-notes" className="text-sm font-semibold text-[--color-text-secondary] mb-1 block">Ghi chú</label>
                            <textarea
                                id="task-notes"
                                value={task.notes || ''}
                                onChange={(e) => handleChange('notes', e.target.value)}
                                rows={4}
                                placeholder="Thêm ghi chú hoặc mô tả cho công việc này..."
                                className="w-full bg-[--color-surface-primary] p-2.5 rounded-md border border-[--color-border-secondary] focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none resize-y"
                            />
                        </div>
                        
                        <div className="border-t border-[--color-border-secondary] pt-4 mt-2">
                            <label className="text-sm font-semibold text-[--color-text-secondary] mb-3 block">Bình luận</label>
                            <div className="flex flex-col gap-3 mb-4">
                                {(task.comments || []).map(comment => (
                                    <div key={comment.id} className="bg-white/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-semibold text-sm text-[--color-text-primary]">{comment.author}</span>
                                            <span className="text-xs text-[--color-text-secondary]">{new Date(comment.timestamp).toLocaleString('vi-VN')}</span>
                                        </div>
                                        <p className="text-sm text-[--color-text-primary]">{comment.text}</p>
                                    </div>
                                ))}
                                {(!task.comments || task.comments.length === 0) && (
                                    <p className="text-sm text-[--color-text-secondary] italic">Chưa có bình luận nào.</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Viết bình luận..."
                                    className="flex-1 bg-[--color-surface-primary] p-2 rounded-md border border-[--color-border-secondary] text-sm focus:ring-1 focus:ring-[--color-accent-500] focus:outline-none"
                                />
                                <button 
                                    type="button" 
                                    onClick={handleAddComment}
                                    className="px-4 py-2 bg-[--color-surface-secondary] dark:bg-white/10 hover:bg-[--color-surface-tertiary] rounded-md text-sm font-semibold text-[--color-text-primary] transition-colors"
                                >
                                    Gửi
                                </button>
                            </div>
                        </div>
                      </>
                    ) : (
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-slate-500 uppercase">Lịch sử thay đổi</h3>
                            {(task.history && task.history.length > 0) ? (
                                <div className="space-y-4 border-l-2 border-slate-200 ml-2 pl-6 pb-4">
                                    {task.history.sort((a,b) => b.timestamp - a.timestamp).map(item => (
                                        <div key={item.id} className="relative">
                                            <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                                            <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm transition-all hover:border-blue-200">
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
                                <p className="text-center text-slate-400 py-10 text-sm italic">Chưa có lịch sử thay đổi nào.</p>
                            )}
                        </div>
                    )}
                </div>
                <footer className="p-4 mt-auto border-t border-[--color-border-secondary] flex justify-between items-center shrink-0">
                    <button 
                        type="button" 
                        onClick={() => onDelete(task.id)}
                        className="flex items-center gap-2 py-2 px-4 rounded-lg text-red-600 font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                    >
                        <TrashIcon className="w-4 h-4" />
                        Xóa Công việc
                    </button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="py-2 px-5 rounded-lg text-[--color-text-secondary] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Hủy</button>
                        <button type="button" onClick={handleSave} className="py-2 px-6 bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white font-semibold rounded-lg shadow-sm hover:shadow-md transition-all">Lưu Công việc</button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

const KanbanColumn: React.FC<{ 
    title: TaskStatus; 
    tasks: Task[]; 
    selectedTaskIds: string[];
    onSelectTask: (task: Task) => void; 
    onDeleteTask: (taskId: string) => void;
    onToggleSelection: (taskId: string) => void;
}> = ({ title, tasks, selectedTaskIds, onSelectTask, onDeleteTask, onToggleSelection }) => {
    const styles = statusStyles[title];
    return (
        <div className="flex-1 flex flex-col gap-4 p-4 bg-white/50 rounded-xl min-w-[300px]">
            <div className="flex justify-between items-center">
                <h2 className={`font-bold text-lg ${styles.text}`}>{title}</h2>
                <span className={`px-2.5 py-1 text-sm font-semibold rounded-full ${styles.bg} ${styles.text}`}>{tasks.length}</span>
            </div>
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar pr-2 -mr-2">
                {tasks.map(task => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                        <div 
                            key={task.id} 
                            onClick={() => onSelectTask(task)}
                            className={`relative group w-full text-left p-4 bg-white/80 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer transform hover:-translate-y-1 ${priorityStyles[task.priority]} ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                        >
                            <label className="absolute top-2 left-2 z-10 p-1" onClick={(e) => { e.stopPropagation(); }}>
                                <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => onToggleSelection(task.id)}
                                    className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                                />
                            </label>
                            <div className="flex justify-between items-start pl-6">
                                <h3 className="font-semibold text-slate-800">{task.title}</h3>
                                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ml-2 shrink-0 ${statusStyles[task.status].bg} ${statusStyles[task.status].text}`}>
                                    {task.status}
                                </span>
                            </div>
                            {(task.labels && task.labels.length > 0) && (
                                <div className="flex flex-wrap gap-1 mt-2 pl-6">
                                    {task.labels.map((label, idx) => (
                                        <span key={idx} className={`px-2 py-0.5 text-[10px] font-bold rounded-md text-white ${label.color}`}>
                                            {label.name}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mt-1 pl-6">Dự án: {task.project}</p>
                            {task.subtasks && task.subtasks.length > 0 && (
                <div className="mt-2 pl-6 flex items-center gap-1.5 text-slate-600">
                    <ClipboardListIcon className="w-4 h-4" />
                    <span className="text-xs font-medium">{task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} Việc phụ</span>
                </div>
            )}
            {task.dueDate && (
                                <div className="mt-2 pl-6 flex items-center gap-1.5 text-sm text-slate-600">
                                    <ClockIcon className="w-4 h-4" />
                                    <span className="font-medium">{new Date(task.dueDate + 'T00:00:00').toLocaleDateString('vi-VN')}</span>
                                </div>
                            )}
                            {task.timeSpent ? (
                                <div className="mt-1 pl-6 flex items-center gap-1.5 text-blue-600 text-[10px] font-bold uppercase tracking-tight">
                                    <ClockIcon className="w-3 h-3" />
                                    <span>Time: {Math.floor(task.timeSpent / 3600000)}h {Math.floor((task.timeSpent % 3600000) / 60000)}m</span>
                                </div>
                            ) : null}
                            {task.notes && task.notes.trim().length > 0 && (
                                <div className="mt-2 pl-6 flex items-center gap-1.5 text-slate-600">
                                    <FileTextIcon className="w-4 h-4" />
                                    <span className="text-xs font-medium">Có ghi chú</span>
                                </div>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTask(task.id);
                                }}
                                className="absolute top-2 right-2 p-1.5 bg-white/50 rounded-full text-red-500 hover:bg-red-100 opacity-0 group-hover:opacity-100 transition-opacity"
                                aria-label="Xóa công việc"
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


interface TaskViewProps {
    onItemViewed: (item: RecentItem) => void;
    onSendNotification?: (notif: Omit<AppNotification, 'id' | 'createdAt'>) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ onItemViewed, onSendNotification }) => {
    const columns: TaskStatus[] = ['Cần làm', 'Đang làm', 'Xem xét', 'Hoàn thành'];
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [taskToDeleteId, setTaskToDeleteId] = useState<string | null>(null);
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [notifiedTasks, setNotifiedTasks] = useState<Set<string>>(new Set());

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'kanban_tasks'), (snapshot) => {
            if (snapshot.empty) {
                // Seed mock data if collection is completely empty
                mockTasks.forEach(task => {
                    setDoc(doc(db, 'kanban_tasks', task.id), task);
                });
                return;
            }
            const fetchedTasks: Task[] = [];
            snapshot.forEach(docSnap => {
                fetchedTasks.push({ id: docSnap.id, ...docSnap.data() } as Task);
            });
            setTasks(fetchedTasks);
        });
        return () => unsubscribe();
    }, []);

    // 1 hr before notification polling
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            tasks.forEach(task => {
                if (!task.dueDate) return;
                
                // Pretend the due date is midnight of that day, or just 23:59:59
                // Example due date format: "YYYY-MM-DD"
                const dueTime = new Date(`${task.dueDate}T23:59:59`);
                if (isNaN(dueTime.getTime())) return;
                
                const timeDiffMs = dueTime.getTime() - now.getTime();
                // Check if time difference is between 0 and 60 minutes
                if (timeDiffMs > 0 && timeDiffMs <= 60 * 60 * 1000) {
                    if (!notifiedTasks.has(task.id)) {
                        if (onSendNotification) {
                            onSendNotification({
                                userId: 'user-1',
                                title: 'Sắp đến hạn',
                                message: `Nhiệm vụ "${task.title}" sẽ hết hạn trong vòng 1 giờ nữa!`,
                                read: false,
                                type: 'task',
                                link: 'tasklist'
                            });
                        }
                        setNotifiedTasks(prev => new Set(prev).add(task.id));
                    }
                }
            });
        }, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [tasks, notifiedTasks, onSendNotification]);

    const handleSelectTask = (task: Task) => {
        setSelectedTask(task);
        onItemViewed({
            id: `task-${task.id}`,
            name: task.title,
            type: 'tasks',
            icon: <ClipboardListIcon />,
            itemId: task.id
        });
    };

    const handleCloseModal = () => {
        setSelectedTask(null);
    };

    const handleSaveTask = async (updatedTask: Task, isAutoSave = false) => {
        try {
            await setDoc(doc(db, 'kanban_tasks', updatedTask.id), updatedTask);
            if (!isAutoSave) handleCloseModal();
        } catch (error) {
            console.error("Error saving task: ", error);
        }
    };

    const handleDeleteRequest = (taskId: string) => {
        setSelectedTask(null); // Ensure detail modal is closed
        setTaskToDeleteId(taskId);
    };

    const handleConfirmDelete = async () => {
        if (taskToDeleteId) {
            try {
                await deleteDoc(doc(db, 'kanban_tasks', taskToDeleteId));
                setTaskToDeleteId(null);
                setSelectedTaskIds(prev => prev.filter(id => id !== taskToDeleteId));
            } catch (error) {
                console.error("Error deleting task: ", error);
            }
        }
    };

    const handleCancelDelete = () => {
        setTaskToDeleteId(null);
    };

    const handleToggleSelection = (taskId: string) => {
        setSelectedTaskIds(prev => 
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`Bạn có chắc muốn xóa ${selectedTaskIds.length} nhiệm vụ đã chọn?`)) {
            try {
                await Promise.all(selectedTaskIds.map(id => deleteDoc(doc(db, 'kanban_tasks', id))));
                setSelectedTaskIds([]);
            } catch (error) {
                console.error("Error bulk deleting tasks: ", error);
            }
        }
    };

    const handleBulkMove = async (newStatus: TaskStatus) => {
        try {
            await Promise.all(selectedTaskIds.map(id => updateDoc(doc(db, 'kanban_tasks', id), { status: newStatus })));
            setSelectedTaskIds([]);
        } catch (error) {
            console.error("Error bulk moving tasks: ", error);
        }
    };

    const handleBulkPriority = async (newPriority: TaskPriority) => {
        try {
            await Promise.all(selectedTaskIds.map(id => updateDoc(doc(db, 'kanban_tasks', id), { priority: newPriority })));
            setSelectedTaskIds([]);
        } catch (error) {
            console.error("Error bulk changing priority: ", error);
        }
    };

    const taskCounts = columns.reduce((acc, status) => {
        acc[status] = tasks.filter(t => t.status === status).length;
        return acc;
    }, {} as Record<TaskStatus, number>);

    const chartData = columns.map(status => ({
        name: status,
        value: taskCounts[status]
    })).filter(d => d.value > 0);

    const COLORS = {
        'Cần làm': '#94a3b8',
        'Đang làm': '#3b82f6',
        'Xem xét': '#a855f7',
        'Hoàn thành': '#22c55e'
    };

    const scrollRef = useRef<HTMLDivElement>(null);

    const handleWheel = (e: React.WheelEvent) => {
        if (scrollRef.current && e.deltaY !== 0) {
            scrollRef.current.scrollLeft += e.deltaY;
        }
    };

    return (
        <main className="flex-1 flex flex-col min-h-0 overflow-hidden p-6 relative">
            {taskToDeleteId && (
                <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex justify-center items-center p-4" aria-modal="true" role="dialog">
                    <div className="relative w-full max-w-md bg-[--color-surface-tertiary] backdrop-blur-2xl rounded-xl shadow-2xl flex flex-col animate-fade-in-up">
                        <header className="p-4 border-b border-[--color-border-secondary]">
                            <h2 className="text-lg font-bold text-[--color-text-primary]">Xác nhận Xóa</h2>
                        </header>
                        <div className="p-5">
                            <p className="text-[--color-text-secondary]">Bạn có chắc chắn muốn xóa công việc này không? Hành động này không thể hoàn tác.</p>
                        </div>
                        <footer className="p-4 border-t border-[--color-border-secondary] flex justify-end gap-3">
                            <button type="button" onClick={handleCancelDelete} className="py-2 px-5 rounded-lg text-[--color-text-secondary] font-semibold hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Hủy</button>
                            <button type="button" onClick={handleConfirmDelete} className="py-2 px-6 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md">Xác nhận Xóa</button>
                        </footer>
                    </div>
                </div>
            )}
            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask}
                    onClose={handleCloseModal}
                    onSaveTask={handleSaveTask}
                    onDelete={handleDeleteRequest}
                />
            )}
            <div className="shrink-0 mb-6">
                <TaskManagementBanner />
            </div>

            {/* Task Summary Dashboard */}
            <div className="shrink-0 mb-6 bg-white/50 backdrop-blur-md rounded-xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-8">
                <div className="flex-1 flex items-center justify-around w-full">
                    {columns.map(status => (
                        <div key={status} className="flex flex-col items-center">
                            <span className="text-2xl font-bold text-slate-800">{taskCounts[status]}</span>
                            <span className={`text-xs font-semibold uppercase tracking-wider ${statusStyles[status].text}`}>{status}</span>
                        </div>
                    ))}
                </div>
                
                {chartData.length > 0 && (
                    <div className="w-full md:w-64 h-48 shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    animationBegin={0}
                                    animationDuration={1500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as TaskStatus]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Legend 
                                    iconType="circle" 
                                    layout="vertical" 
                                    align="right" 
                                    verticalAlign="middle" 
                                    wrapperStyle={{ fontSize: '10px', fontWeight: '600', paddingLeft: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            <div 
                ref={scrollRef}
                onWheel={handleWheel}
                className="flex-1 flex gap-6 overflow-x-auto no-scrollbar pb-2"
            >
                {columns.map(status => (
                    <KanbanColumn 
                        key={status} 
                        title={status}
                        tasks={tasks.filter(t => t.status === status)}
                        selectedTaskIds={selectedTaskIds}
                        onSelectTask={handleSelectTask}
                        onDeleteTask={handleDeleteRequest}
                        onToggleSelection={handleToggleSelection}
                    />
                ))}
            </div>

            {/* Bulk Actions Context Bar */}
            {selectedTaskIds.length > 0 && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full flex items-center gap-4 shadow-2xl animate-fade-in-up z-30">
                    <span className="font-semibold">{selectedTaskIds.length} phần tử được chọn</span>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Chuyển thẻ:</span>
                        <select className="bg-slate-700 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500" onChange={(e) => { if(e.target.value) handleBulkMove(e.target.value as TaskStatus); }}>
                            <option value="">-- Chọn --</option>
                            {columns.map(col => <option key={col} value={col}>{col}</option>)}
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-300">Mức độ:</span>
                        <select className="bg-slate-700 text-sm rounded px-2 py-1 border-none focus:ring-1 focus:ring-blue-500" onChange={(e) => { if(e.target.value) handleBulkPriority(e.target.value as TaskPriority); }}>
                            <option value="">-- Chọn --</option>
                            <option value="Cao">Cao</option>
                            <option value="Trung bình">Trung bình</option>
                            <option value="Thấp">Thấp</option>
                        </select>
                    </div>
                    <div className="h-6 w-px bg-slate-600"></div>
                    <button onClick={handleBulkDelete} className="text-red-400 hover:text-red-300 font-semibold text-sm transition-colors">
                        Xóa
                    </button>
                    <button onClick={() => setSelectedTaskIds([])} className="ml-2 hover:bg-slate-700 p-1 rounded-full transition-colors">
                        <XIcon className="w-5 h-5 text-slate-400 hover:text-white" />
                    </button>
                </div>
            )}
        </main>
    );
};

export default TaskView;