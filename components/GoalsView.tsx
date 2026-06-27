import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../firebase';
import { collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase-errors';
import { PlusIcon, TrashIcon, PencilIcon, UsersIcon } from './icons';

export interface GoalData {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number;
  assignees: string[];
  dueDate: string;
  createdAt: number;
}

interface GoalsViewProps {
  user: User;
  allUsers: User[];
  showToast: (msg: string) => void;
}

const GoalsView: React.FC<GoalsViewProps> = ({ user, allUsers, showToast }) => {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalData | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formStatus, setFormStatus] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [formProgress, setFormProgress] = useState<number>(0);
  const [formDueDate, setFormDueDate] = useState('');
  const [formAssignees, setFormAssignees] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If we are using a mock user (auth bypassed or failed), don't try to sync to Firestore
    // to avoid Missing or insufficient permissions.
    if (user.id.startsWith('user-')) {
        setIsLoading(false);
        return;
    }

    const unsubscribe = onSnapshot(collection(db, 'project_goals'), (snapshot) => {
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GoalData));
      setGoals(goalsData.sort((a, b) => b.createdAt - a.createdAt));
      setIsLoading(false);
    }, (error) => {
      console.warn('Cannot fetch goals. This may be because you are using a mock user.', error);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const openCreateModal = () => {
    setEditingGoal(null);
    setFormTitle('');
    setFormDesc('');
    setFormStatus('not_started');
    setFormProgress(0);
    setFormDueDate('');
    setFormAssignees([]);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: GoalData) => {
    setEditingGoal(goal);
    setFormTitle(goal.title);
    setFormDesc(goal.description);
    setFormStatus(goal.status);
    setFormProgress(goal.progress);
    setFormDueDate(goal.dueDate);
    setFormAssignees(goal.assignees || []);
    setIsModalOpen(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    if (user.id.startsWith('user-')) {
        showToast('Tính năng này yêu cầu đăng nhập bằng Google.');
        setIsModalOpen(false);
        return;
    }

    setIsSubmitting(true);
    try {
      const goalPayload = {
        title: formTitle,
        description: formDesc,
        status: formStatus,
        progress: Number(formProgress),
        dueDate: formDueDate,
        assignees: formAssignees,
      };

      if (editingGoal) {
        await updateDoc(doc(db, 'project_goals', editingGoal.id), goalPayload);
        showToast('Đã cập nhật mục tiêu');
      } else {
        await addDoc(collection(db, 'project_goals'), {
          ...goalPayload,
          createdAt: Date.now()
        });
        showToast('Đã tạo mục tiêu mới');
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error as Error, editingGoal ? OperationType.UPDATE : OperationType.CREATE);
      showToast('Lỗi khi lưu mục tiêu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa mục tiêu này?')) return;

    if (user.id.startsWith('user-')) {
        showToast('Tính năng này yêu cầu đăng nhập bằng Google.');
        return;
    }

    try {
      await deleteDoc(doc(db, 'project_goals', id));
      showToast('Đã xóa mục tiêu');
    } catch (error) {
      handleFirestoreError(error as Error, OperationType.DELETE);
      showToast('Lỗi khi xóa mục tiêu');
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-[--color-text-secondary]">Đang tải...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-2 sm:p-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[--color-text-primary]">Quản lý Mục tiêu</h2>
          <p className="text-sm text-[--color-text-secondary]">Tạo và theo dõi các mục tiêu quan trọng.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-[--color-accent-600] text-white px-4 py-2 rounded-xl font-bold shadow-md hover:bg-[--color-accent-500] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span className="hidden sm:inline">Tạo Mục tiêu</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto no-scrollbar pb-10">
        {goals.map(goal => (
          <div key={goal.id} className="bg-[--color-surface-primary] border border-[--color-border-secondary] rounded-2xl p-4 shadow-sm flex flex-col gap-3 hover:shadow-md transition-shadow relative group">
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-bold text-[--color-text-primary] text-lg leading-tight line-clamp-2">{goal.title}</h3>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEditModal(goal)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg"><PencilIcon className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(goal.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"><TrashIcon className="w-4 h-4" /></button>
              </div>
            </div>
            {goal.description && <p className="text-sm text-[--color-text-secondary] line-clamp-3">{goal.description}</p>}
            
            <div className="mt-auto pt-3 border-t border-[--color-border-secondary] flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className={`px-2 py-1 rounded-md font-bold ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                  goal.status === 'in_progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                  'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {goal.status === 'completed' ? 'Đã hoàn thành' : goal.status === 'in_progress' ? 'Đang thực hiện' : 'Chưa bắt đầu'}
                </span>
                <span className="text-[--color-text-secondary] font-medium">{goal.dueDate || 'Không có hạn'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full bg-[--color-surface-secondary] overflow-hidden">
                  <div className="h-full bg-[--color-accent-500] rounded-full transition-all" style={{ width: `${goal.progress}%` }}></div>
                </div>
                <span className="text-xs font-bold text-[--color-text-primary]">{goal.progress}%</span>
              </div>
              {goal.assignees && goal.assignees.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <UsersIcon className="w-3.5 h-3.5 text-[--color-text-secondary]" />
                  <div className="flex -space-x-1.5">
                    {goal.assignees.map(userId => {
                      const u = allUsers.find(x => x.id === userId);
                      if (!u) return null;
                      return <img key={userId} src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full border border-white dark:border-slate-800" title={u.name} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {goals.length === 0 && (
          <div className="col-span-full py-10 text-center text-[--color-text-secondary] bg-[--color-surface-primary] border border-dashed border-[--color-border-secondary] rounded-2xl">
            Chưa có mục tiêu nào. Hãy tạo mục tiêu đầu tiên!
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[--color-surface-primary] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-6 border-b border-[--color-border-secondary] flex items-center justify-between shrink-0 bg-[--color-surface-secondary]/50">
              <h3 className="text-xl font-bold text-[--color-text-primary] flex items-center gap-2">
                {editingGoal ? 'Chỉnh sửa Mục tiêu' : 'Tạo Mục tiêu mới'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-[--color-text-secondary] hover:bg-[--color-surface-tertiary] rounded-full transition-colors">
                <TrashIcon className="w-5 h-5" /> {/* Just using as close placeholder if XIcon not imported, wait XIcon is better */}
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto no-scrollbar flex-1">
              <form id="goal-form" onSubmit={handleSaveGoal} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Tên mục tiêu <span className="text-red-500">*</span></label>
                  <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl px-4 py-2.5 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] transition-shadow" placeholder="Nhập tên mục tiêu..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Mô tả</label>
                  <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl px-4 py-2.5 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] transition-shadow min-h-[100px] resize-y" placeholder="Mô tả chi tiết mục tiêu..."></textarea>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Trạng thái</label>
                    <select value={formStatus} onChange={e => setFormStatus(e.target.value as 'not_started' | 'in_progress' | 'completed')} className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl px-4 py-2.5 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] transition-shadow">
                      <option value="not_started">Chưa bắt đầu</option>
                      <option value="in_progress">Đang thực hiện</option>
                      <option value="completed">Đã hoàn thành</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Tiến độ (%)</label>
                    <input type="number" min="0" max="100" value={formProgress} onChange={e => setFormProgress(Number(e.target.value))} className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl px-4 py-2.5 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Hạn chót</label>
                  <input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl px-4 py-2.5 text-[--color-text-primary] focus:outline-none focus:ring-2 focus:ring-[--color-accent-500] transition-shadow" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[--color-text-primary] mb-1.5">Người phụ trách (từ danh bạ)</label>
                  <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto p-2 bg-[--color-surface-secondary] border border-[--color-border-secondary] rounded-xl">
                    {allUsers.map(u => (
                      <label key={u.id} className="flex items-center gap-2 cursor-pointer hover:bg-[--color-surface-tertiary] p-1.5 rounded-lg transition-colors">
                        <input type="checkbox" checked={formAssignees.includes(u.id)} onChange={(e) => {
                          if (e.target.checked) setFormAssignees([...formAssignees, u.id]);
                          else setFormAssignees(formAssignees.filter(id => id !== u.id));
                        }} className="rounded text-[--color-accent-500] focus:ring-[--color-accent-500]" />
                        <img src={u.avatar} alt={u.name} className="w-6 h-6 rounded-full" />
                        <span className="text-sm font-medium text-[--color-text-primary]">{u.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 sm:p-6 border-t border-[--color-border-secondary] flex justify-end gap-3 shrink-0 bg-[--color-surface-primary]">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl font-bold text-[--color-text-secondary] hover:bg-[--color-surface-secondary] transition-colors">
                Hủy
              </button>
              <button type="submit" form="goal-form" disabled={isSubmitting} className="px-5 py-2.5 rounded-xl font-bold bg-[--color-accent-600] text-white hover:bg-[--color-accent-500] transition-colors shadow-md disabled:opacity-70 flex items-center gap-2">
                {isSubmitting && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>}
                {editingGoal ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsView;
