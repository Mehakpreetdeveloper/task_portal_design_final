import { useState, useRef } from 'react';
import { Heart, X, Star, MapPin, Briefcase, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, SwipeAction } from '@/types/dating';
import { cn } from '@/lib/utils';

interface ProfileCardProps {
  user: User;
  onSwipe: (action: SwipeAction) => void;
  className?: string;
  isStacked?: boolean;
  stackIndex?: number;
}

export function ProfileCard({ user, onSwipe, className, isStacked = false, stackIndex = 0 }: ProfileCardProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showInfo, setShowInfo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleSwipe = (action: SwipeAction) => {
    setIsAnimating(true);
    setSwipeDirection(action === 'like' || action === 'superlike' ? 'right' : 'left');
    
    setTimeout(() => {
      onSwipe(action);
      setIsAnimating(false);
      setSwipeDirection(null);
    }, 300);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isStacked) return;
    setIsDragging(true);
    const startX = e.clientX;
    const startY = e.clientY;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      setDragOffset({ x: deltaX, y: deltaY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      
      // Auto-swipe if dragged far enough
      if (Math.abs(dragOffset.x) > 100) {
        handleSwipe(dragOffset.x > 0 ? 'like' : 'dislike');
      }
      setDragOffset({ x: 0, y: 0 });
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === user.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? user.photos.length - 1 : prev - 1
    );
  };

  const rotation = isDragging ? dragOffset.x * 0.1 : 0;
  const translateX = isDragging ? dragOffset.x : 0;
  const translateY = isDragging ? dragOffset.y * 0.1 : 0;

  return (
    <Card
      ref={cardRef}
      className={cn(
        "absolute w-full h-[600px] overflow-hidden cursor-grab active:cursor-grabbing",
        "transition-all duration-300 select-none",
        isStacked && "pointer-events-none",
        isAnimating && swipeDirection === 'right' && "translate-x-full rotate-12 opacity-0",
        isAnimating && swipeDirection === 'left' && "-translate-x-full -rotate-12 opacity-0",
        className
      )}
      style={{
        transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg) scale(${1 - stackIndex * 0.05}) translateY(${stackIndex * -10}px)`,
        zIndex: 50 - stackIndex,
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Photo Section */}
      <div className="relative h-full">
        <img
          src={user.photos[currentPhotoIndex]}
          alt={`${user.name} photo ${currentPhotoIndex + 1}`}
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Photo Navigation Areas */}
        {user.photos.length > 1 && !isStacked && (
          <>
            <div 
              className="absolute left-0 top-0 w-1/3 h-full z-10"
              onClick={(e) => {
                e.stopPropagation();
                prevPhoto();
              }}
            />
            <div 
              className="absolute right-0 top-0 w-1/3 h-full z-10"
              onClick={(e) => {
                e.stopPropagation();
                nextPhoto();
              }}
            />
            
            {/* Photo Indicators */}
            <div className="absolute top-4 left-4 right-4 flex gap-2 z-20">
              {user.photos.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all",
                    index === currentPhotoIndex ? "bg-white" : "bg-white/30"
                  )}
                />
              ))}
            </div>
          </>
        )}

        {/* Info Button */}
        {!isStacked && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 w-8 h-8 bg-black/20 text-white hover:bg-black/40 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setShowInfo(!showInfo);
            }}
          >
            <Info className="w-4 h-4" />
          </Button>
        )}

        {/* Like/Dislike Indicators */}
        {isDragging && Math.abs(dragOffset.x) > 50 && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-30",
            "text-6xl font-bold border-4 border-current rounded-2xl m-8",
            dragOffset.x > 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"
          )}>
            {dragOffset.x > 0 ? "LIKE" : "NOPE"}
          </div>
        )}

        {/* Info Overlay */}
        {showInfo && !isStacked && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col justify-end p-6 z-20">
            <div className="text-white space-y-4">
              <div>
                <h3 className="text-3xl font-bold mb-2">
                  {user.name}, {user.age}
                </h3>
                
                {user.location && (
                  <div className="flex items-center gap-2 text-lg mb-2">
                    <MapPin className="w-5 h-5" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                {user.occupation && (
                  <div className="flex items-center gap-2 text-lg mb-3">
                    <Briefcase className="w-5 h-5" />
                    <span>{user.occupation}</span>
                  </div>
                )}
              </div>

              <p className="text-white/90 text-lg leading-relaxed">
                {user.bio}
              </p>
              
              {user.interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {user.interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="bg-white/20 text-white border-white/30">
                      {interest}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Minimal Info Overlay (when not showing full info) */}
        {!showInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-1">
                {user.name}, {user.age}
              </h3>
              
              {user.location && (
                <div className="flex items-center gap-1 text-sm opacity-90">
                  <MapPin className="w-4 h-4" />
                  <span>{user.location}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}