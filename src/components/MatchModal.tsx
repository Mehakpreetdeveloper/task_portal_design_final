import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, X } from 'lucide-react';
import { User } from '@/types/dating';

interface MatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  matchedUser: User;
  onStartChat: () => void;
}

export function MatchModal({ 
  isOpen, 
  onClose, 
  currentUser, 
  matchedUser, 
  onStartChat 
}: MatchModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-gradient-romantic border-0">
        <div className="relative p-6 text-center text-white">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-white hover:bg-white/20"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
          
          <div className="mb-6">
            <div className="flex justify-center items-center mb-4">
              <Heart className="w-16 h-16 text-white animate-pulse" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold mb-2">It's a Match!</h2>
            <p className="text-white/90">
              You and {matchedUser.name} liked each other
            </p>
          </div>

          {/* Profile Photos */}
          <div className="flex justify-center items-center gap-4 mb-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={currentUser.photos[0]}
                  alt={currentUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            
            <Heart className="w-8 h-8 text-white" fill="currentColor" />
            
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <img
                  src={matchedUser.photos[0]}
                  alt={matchedUser.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-white/20 border-white/30 text-white hover:bg-white/30"
              onClick={onClose}
            >
              Keep Swiping
            </Button>
            <Button
              className="flex-1 bg-white text-primary hover:bg-white/90"
              onClick={onStartChat}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Say Hello
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}