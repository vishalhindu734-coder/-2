import React, { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-green-500" />,
  error: <AlertCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-blue-500" />,
  warning: <AlertCircle size={18} className="text-amber-500" />,
};

const BG: Record<ToastType, string> = {
  success: 'border-green-500/30 bg-green-50/90 dark:bg-green-900/30',
  error: 'border-red-500/30 bg-red-50/90 dark:bg-red-900/30',
  info: 'border-blue-500/30 bg-blue-50/90 dark:bg-blue-900/30',
  warning: 'border-amber-500/30 bg-amber-50/90 dark:bg-amber-900/30',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<{
    title: string; message: string;
    onConfirm: () => void; onCancel?: () => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `t${Date.now()}`;
    setToasts(prev => [...prev.slice(-3), { id, message, type, duration }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);

  const showConfirm = useCallback((
    title: string, message: string,
    onConfirm: () => void, onCancel?: () => void
  ) => {
    setConfirm({ title, message, onConfirm, onCancel });
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Toast Stack */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20 }}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-2xl shadow-2xl shadow-black/10 ${BG[toast.type]}`}
            >
              {ICONS[toast.type]}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100 flex-1 font-hindi leading-snug">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {confirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[990] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-white dark:bg-[#0c1222] rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 p-6 w-full max-w-sm"
            >
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-2 font-hindi">{confirm.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 font-hindi leading-relaxed">{confirm.message}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    confirm.onCancel?.();
                    setConfirm(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 active:scale-95 transition-all"
                >
                  रद्द करें
                </button>
                <button
                  onClick={() => {
                    confirm.onConfirm();
                    setConfirm(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-red-600 text-white text-sm font-bold shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  हाँ, हटाएं
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
};
