import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../firebase';
import { collection, query, limit, getDocs } from 'firebase/firestore';
import { Task } from './TasklistView';
import { User, View } from '../types';
import { CalendarEvent } from './CalendarView';
import { SearchIcon, ChecklistIcon, UserIcon, CalendarIcon, XIcon, ChevronRightIcon, ZapIcon, ChevronUpIcon, ChevronDownIcon } from './icons';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (view: View, itemId?: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<{
        tasks: Task[];
        users: User[];
        events: CalendarEvent[];
    }>({ tasks: [], users: [], events: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const flatResults = [
        ...results.tasks.map(t => ({ ...t, resType: 'task' as const })),
        ...results.users.map(u => ({ ...u, resType: 'user' as const })),
        ...results.events.map(e => ({ ...e, resType: 'event' as const }))
    ];

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setSearchTerm('');
            setResults({ tasks: [], users: [], events: [] });
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const handleSearch = useCallback(async (val: string) => {
        if (!val.trim()) {
            setResults({ tasks: [], users: [], events: [] });
            return;
        }

        setIsLoading(true);
        try {
            const lowerVal = val.toLowerCase();
            
            // Search Tasks
            const tasksQ = query(collection(db, 'tasks'), limit(20));
            const tasksSnap = await getDocs(tasksQ);
            const tasks = tasksSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Task))
                .filter(t => t.text.toLowerCase().includes(lowerVal))
                .slice(0, 5);

            // Search Users
            const usersQ = query(collection(db, 'users'), limit(20));
            const usersSnap = await getDocs(usersQ);
            const users = usersSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as User))
                .filter(u => u.name.toLowerCase().includes(lowerVal) || u.email.toLowerCase().includes(lowerVal))
                .slice(0, 5);

            // Search Events
            const eventsQ = query(collection(db, 'events'), limit(20));
            const eventsSnap = await getDocs(eventsQ);
            const events = eventsSnap.docs
                .map(d => {
                    const data = d.data();
                    return { id: d.id, ...data, date: new Date(data.date) } as CalendarEvent;
                })
                .filter(e => e.title.toLowerCase().includes(lowerVal))
                .slice(0, 5);

            setResults({ tasks, users, events });
            setSelectedIndex(0);
        } catch (error) {
            console.error("Command palette search error:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, handleSearch]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % (flatResults.length || 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + flatResults.length) % (flatResults.length || 1));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (flatResults[selectedIndex]) {
                    handleSelect(flatResults[selectedIndex]);
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, flatResults, selectedIndex, onClose]);

    const handleSelect = (item: { resType: string; id: string }) => {
        if (item.resType === 'task') {
            onNavigate('tasklist', item.id);
        } else if (item.resType === 'user') {
            onNavigate('user-management', item.id);
        } else if (item.resType === 'event') {
            onNavigate('calendar', item.id);
        }
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="flex items-center px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                            <SearchIcon className="w-5 h-5 text-slate-400" />
                            <input 
                                ref={inputRef}
                                type="text"
                                placeholder="Tìm kiếm công việc, người dùng, sự kiện..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 ml-3 bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 text-lg placeholder-slate-400"
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-slate-400 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 rounded uppercase">ESC</span>
                                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                    <XIcon className="w-5 h-5 text-slate-400" />
                                </button>
                            </div>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto no-scrollbar py-2">
                            {isLoading && (
                                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm font-medium">Đang tìm kiếm...</span>
                                </div>
                            )}

                            {!isLoading && searchTerm && flatResults.length === 0 && (
                                <div className="p-10 text-center text-slate-400">
                                    <p className="text-sm">Không tìm thấy kết quả cho "{searchTerm}"</p>
                                </div>
                            )}

                            {!isLoading && flatResults.length > 0 && (
                                <div className="space-y-4 px-2">
                                    {results.tasks.length > 0 && (
                                        <div>
                                            <h4 className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Công việc</h4>
                                            {results.tasks.map((task) => {
                                                const idx = results.tasks.indexOf(task);
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <div 
                                                        key={task.id}
                                                        onClick={() => handleSelect({ ...task, resType: 'task' })}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        <ChecklistIcon className={`w-5 h-5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`} />
                                                        <span className="flex-1 font-medium text-sm truncate">{task.text}</span>
                                                        {isSelected && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {results.users.length > 0 && (
                                        <div>
                                            <h4 className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Người dùng</h4>
                                            {results.users.map((u) => {
                                                const idx = results.tasks.length + results.users.indexOf(u);
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <div 
                                                        key={u.id}
                                                        onClick={() => handleSelect({ ...u, resType: 'user' })}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        {u.avatar ? (
                                                            <img src={u.avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                                                        ) : (
                                                            <UserIcon className={`w-5 h-5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`} />
                                                        )}
                                                        <div className="flex-1 truncate">
                                                            <p className="font-medium text-sm">{u.name}</p>
                                                            <p className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>{u.email}</p>
                                                        </div>
                                                        {isSelected && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {results.events.length > 0 && (
                                        <div>
                                            <h4 className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">Sự kiện</h4>
                                            {results.events.map((e) => {
                                                const idx = results.tasks.length + results.users.length + results.events.indexOf(e);
                                                const isSelected = selectedIndex === idx;
                                                return (
                                                    <div 
                                                        key={e.id}
                                                        onClick={() => handleSelect({ ...e, resType: 'event' })}
                                                        onMouseEnter={() => setSelectedIndex(idx)}
                                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all ${isSelected ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'}`}
                                                    >
                                                        <CalendarIcon className={`w-5 h-5 ${isSelected ? 'text-rose-100' : 'text-slate-400'}`} />
                                                        <div className="flex-1 truncate">
                                                            <p className="font-medium text-sm">{e.title}</p>
                                                            <p className={`text-[10px] ${isSelected ? 'text-rose-200' : 'text-slate-400'}`}>{e.date.toLocaleDateString()}</p>
                                                        </div>
                                                        {isSelected && <ChevronRightIcon className="w-4 h-4 ml-auto" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {!searchTerm && (
                                <div className="px-3 py-8 text-center">
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 border-dashed">
                                        <ZapIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">Bắt đầu tìm kiếm mọi thứ</p>
                                        <p className="text-xs text-slate-400">Tìm kiếm nhanh chóng công việc, đồng nghiệp hoặc các sự kiện sắp tới.</p>
                                    </div>
                                    <div className="mt-8 grid grid-cols-2 gap-4">
                                        <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                             <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Phím tắt</h5>
                                             <div className="flex flex-col gap-2">
                                                 <div className="flex items-center justify-between">
                                                     <span className="text-xs text-slate-500">Mở Dashboard</span>
                                                     <span className="text-[10px] font-bold bg-white dark:bg-slate-700 px-1 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">G + D</span>
                                                 </div>
                                                 <div className="flex items-center justify-between">
                                                     <span className="text-xs text-slate-500">Mở Tasklist</span>
                                                     <span className="text-[10px] font-bold bg-white dark:bg-slate-700 px-1 py-0.5 rounded shadow-sm border border-slate-200 dark:border-slate-600">G + T</span>
                                                 </div>
                                             </div>
                                        </div>
                                        <div className="text-left bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                                             <h5 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Hành động nhanh</h5>
                                             <div className="flex flex-col gap-2">
                                                <button onClick={() => { onNavigate('tasklist'); onClose(); }} className="text-xs text-blue-600 font-bold hover:underline py-0.5 text-left">+ Tạo Task mới</button>
                                                <button onClick={() => { onNavigate('calendar'); onClose(); }} className="text-xs text-blue-600 font-bold hover:underline py-0.5 text-left">+ Tạo Sự kiện</button>
                                             </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1"><ChevronUpIcon className="w-3 h-3"/> <ChevronDownIcon className="w-3 h-3"/> Di chuyển</span>
                                <span className="flex items-center gap-1"><XIcon className="w-3 h-3 -rotate-45"/> Chọn</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Tìm kiếm thông minh</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
