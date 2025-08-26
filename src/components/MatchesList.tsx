import { MessageCircle, Phone, Video, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types/dating';

interface MatchesListProps {
  matches: Match[];
  currentUserId: string;
  onSelectMatch: (match: Match) => void;
  onCall?: (match: Match) => void;
  onVideoCall?: (match: Match) => void;
}

export function MatchesList({
  matches,
  currentUserId,
  onSelectMatch,
  onCall,
  onVideoCall
}: MatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gradient-romantic rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">💕</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
        <p className="text-muted-foreground">
          Keep swiping to find your perfect match!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Your Matches</h2>
      
      <div className="space-y-3">
        {matches.map((match) => {
          const otherUser = match.user1Id === currentUserId ? match.user2 : match.user1;
          const hasUnreadMessage = false; // This would come from your state management
          
          return (
            <Card
              key={match.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onSelectMatch(match)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={otherUser.photos[0]} alt={otherUser.name} />
                    <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                  </Avatar>
                  {hasUnreadMessage && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{otherUser.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      New Match
                    </Badge>
                  </div>
                  
                  {match.lastMessage ? (
                    <p className="text-sm text-muted-foreground truncate">
                      {match.lastMessage.content}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Matched {new Date(match.matchedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMatch(match);
                    }}
                  >
                    <MessageCircle className="w-4 h-4" />
                  </Button>
                  
                  {onCall && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCall(match);
                      }}
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {onVideoCall && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onVideoCall(match);
                      }}
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}