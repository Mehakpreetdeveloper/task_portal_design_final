import { ProfileCard } from '@/components/ProfileCard';
import { User, SwipeAction } from '@/types/dating';
import { cn } from '@/lib/utils';

interface CardStackProps {
  users: User[];
  onSwipe: (userId: string, action: SwipeAction) => void;
  className?: string;
}

export function CardStack({ users, onSwipe, className }: CardStackProps) {
  const visibleCards = users.slice(0, 3); // Show up to 3 cards in stack

  const handleSwipe = (action: SwipeAction) => {
    if (visibleCards.length > 0) {
      onSwipe(visibleCards[0].id, action);
    }
  };

  if (visibleCards.length === 0) {
    return (
      <div className={cn("relative w-full h-[600px] flex items-center justify-center", className)}>
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-romantic rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔥</span>
          </div>
          <h3 className="text-2xl font-bold mb-3">You're all caught up!</h3>
          <p className="text-muted-foreground max-w-sm">
            New people are added to Tinder all the time. Check back later for fresh faces!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative w-full h-[600px]", className)}>
      {visibleCards.map((user, index) => (
        <ProfileCard
          key={user.id}
          user={user}
          onSwipe={handleSwipe}
          isStacked={index > 0}
          stackIndex={index}
          className="absolute inset-0"
        />
      ))}
    </div>
  );
}