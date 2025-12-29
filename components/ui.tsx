import React from 'react';
import { LucideIcon } from 'lucide-react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon: Icon, action }) => {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-black/30 border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300 ${className}`}>
      {(title || Icon) && (
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
          <div className="flex items-center gap-3">
            {Icon && <Icon className="w-5 h-5 text-amber-500" />}
            <h3 className="font-bold text-slate-900 dark:text-amber-50 text-lg">{title}</h3>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-5 text-slate-700 dark:text-slate-300">{children}</div>
    </div>
  );
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'gold' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    // Azul Escuro Profundo
    primary: "bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 shadow-lg shadow-slate-200 dark:shadow-blue-900/20 focus:ring-slate-500",
    // Dourado/Amber
    gold: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200 dark:shadow-amber-900/20 focus:ring-amber-500",
    secondary: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 focus:ring-emerald-500",
    outline: "border-2 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-300",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-100 dark:border-red-900/30 focus:ring-red-400",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-base px-5 py-3",
    lg: "text-lg px-6 py-4"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  color?: 'green' | 'blue' | 'red' | 'gray' | 'gold';
}

export const Badge: React.FC<BadgeProps> = ({ children, color = 'blue' }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    gray: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    gold: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500"
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${colors[color]}`}>
      {children}
    </span>
  );
};