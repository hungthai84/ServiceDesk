import React from 'react';
import { getAccessToken } from '../firebase';
import { showPicker } from '../googlePicker';
import { GoogleIcon } from './icons';

interface GooglePickerButtonProps {
  onPicked: (docs: { 
    id: string; 
    name: string; 
    mimeType: string; 
    url: string; 
    lastEditedUtc: number; 
    iconUrl: string; 
    parentId: string; 
    sizeBytes?: number;
  }[]) => void;
  className?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
}

const GooglePickerButton: React.FC<GooglePickerButtonProps> = ({ 
  onPicked, 
  className = '', 
  label = 'Chọn từ Drive',
  variant = 'primary'
}) => {
  const [isOpening, setIsOpening] = React.useState(false);

  const handleClick = async () => {
    setIsOpening(true);
    try {
      const token = await getAccessToken(true);
      if (!token) throw new Error("Chưa kết nối");
      showPicker(token, (result) => {
        if (result.action === 'picked' && result.docs) {
          onPicked(result.docs);
        }
      });
    } catch (error) {
      console.error('Picker error:', error);
    } finally {
      setIsOpening(false);
    }
  };

  const baseStyles = "flex items-center gap-2 transition-all transform active:scale-95 disabled:opacity-50 font-bold px-4 py-2 rounded-lg shadow-sm";
  const variants = {
    primary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-md",
    secondary: "bg-blue-600 text-white hover:bg-blue-700 shadow-md",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 shadow-none px-2 py-2",
    icon: "bg-transparent hover:bg-black/5 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 shadow-none p-1.5 rounded-full px-1.5 py-1.5"
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={isOpening}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      title={label}
    >
      <GoogleIcon className={variant === 'icon' ? 'w-4 h-4' : 'w-5 h-5'} />
      {variant !== 'icon' && <span className="hidden sm:inline">{isOpening ? 'Đang mở...' : label}</span>}
    </button>
  );
};

export default GooglePickerButton;
