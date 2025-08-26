import { Heart, X, Star, RotateCcw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeAction } from '@/types/dating';
import { cn } from '@/lib/utils';

interface TinderActionsProps {
  onAction: (action: SwipeAction) => void;
  disabled?: boolean;
  className?: string;
}

export function TinderActions({ onAction, disabled = false, className }: TinderActionsProps) {
  const actions = [
    {
      action: 'dislike' as SwipeAction,
      icon: X,
      className: "w-14 h-14 bg-white border-2 border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500 shadow-lg",
      size: "w-6 h-6"
    },
    {
      action: 'superlike' as SwipeAction,
      icon: Star,
      className: "w-12 h-12 bg-white border-2 border-gray-300 text-blue-500 hover:border-blue-400 hover:bg-blue-50 shadow-lg",
      size: "w-5 h-5"
    },
    {
      action: 'like' as SwipeAction,
      icon: Heart,
      className: "w-14 h-14 bg-white border-2 border-gray-300 text-green-500 hover:border-green-400 hover:bg-green-50 shadow-lg",
      size: "w-6 h-6"
    },
    {
      action: 'boost' as SwipeAction,
      icon: Zap,
      className: "w-12 h-12 bg-white border-2 border-gray-300 text-purple-500 hover:border-purple-400 hover:bg-purple-50 shadow-lg",
      size: "w-5 h-5"
    }
  ];

  return (
    <div className={cn("flex items-center justify-center gap-6 p-6", className)}>
      <Button
        variant="ghost"
        size="icon"
        className="w-10 h-10 bg-white border border-gray-300 text-gray-500 hover:border-gray-400 shadow-md"
        disabled={disabled}
        onClick={() => {/* Rewind functionality */}}
      >
        <RotateCcw className="w-4 h-4" />
      </Button>

      {actions.map(({ action, icon: Icon, className: btnClassName, size }) => (
        <Button
          key={action}
          variant="ghost"
          size="icon"
          className={cn(
            "rounded-full transition-all duration-200 hover:scale-110",
            btnClassName,
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
          onClick={() => onAction(action)}
        >
          <Icon className={size} />
        </Button>
      ))}
    </div>
  );
}