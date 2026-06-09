import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Search } from 'lucide-react';
import TaskCard from '@/components/TaskCard';
import { CATEGORY_LABELS } from '@/components/TaskCard';
import { SkeletonCard } from '@/components/Skeleton';
import { useTaskStore } from '@/stores/taskStore';

const CATEGORY_FILTERS: { key: string; label: string }[] = [
  { key: '全部', label: '全部' },
  ...Object.entries(CATEGORY_LABELS).map(([key, label]) => ({ key, label })),
];

const SORT_OPTIONS = ['最新发布', '赏金最高', '距离最近', '即将截止'];

export default function TaskHall() {
  const navigate = useNavigate();
  const { tasks, loading, category, sort, setCategory, setSort, fetchTasks } = useTaskStore();
  const [sortOpen, setSortOpen] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return (
    <div className="min-h-screen" style={{ background: '#FFFBF0' }}>
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  category === cat.key
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'bg-orange-50 text-gray-600 hover:bg-orange-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600 transition-colors"
              >
                {sort}
                <ChevronDown className={`w-4 h-4 transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
              </button>
              {sortOpen && (
                <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-orange-100 py-1 z-30 min-w-[120px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => { setSort(opt); setSortOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition-colors ${
                        sort === opt ? 'text-orange-600 font-medium' : 'text-gray-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400">{tasks.length} 个任务</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <SkeletonCard count={6} />
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Search className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">暂无任务</p>
            <p className="text-sm mt-1">当前分类下还没有任务，快来发布第一个吧</p>
            <button
              onClick={() => navigate('/tasks/new')}
              className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              发布第一个任务
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/tasks/new')}
        className="fixed bottom-8 right-8 w-14 h-14 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 z-30"
      >
        <Plus className="w-7 h-7" />
      </button>
    </div>
  );
}
