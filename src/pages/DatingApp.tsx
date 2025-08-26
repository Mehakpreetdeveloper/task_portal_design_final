import { useState } from 'react';
import { ArrowLeft, Heart, MessageCircle, User, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardStack } from '@/components/CardStack';
import { TinderActions } from '@/components/TinderActions';
import { MatchModal } from '@/components/MatchModal';
import { ChatInterface } from '@/components/ChatInterface';
import { MatchesList } from '@/components/MatchesList';
import { useDatingData } from '@/hooks/useDatingData';
import { Match, SwipeAction } from '@/types/dating';
import { cn } from '@/lib/utils';

type ViewMode = 'discovery' | 'matches' | 'chat';

export default function DatingApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('discovery');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [newMatch, setNewMatch] = useState<Match | null>(null);

  const {
    availableUsers,
    matches,
    currentUserProfile,
    handleSwipe,
    sendMessage,
    getMessagesForMatch
  } = useDatingData();

  const onSwipe = (userId: string, action: SwipeAction) => {
    const match = handleSwipe(userId, action);
    if (match) {
      setNewMatch(match);
      setShowMatchModal(true);
    }
  };

  const onStartChat = () => {
    if (newMatch) {
      setSelectedMatch(newMatch);
      setViewMode('chat');
    }
    setShowMatchModal(false);
    setNewMatch(null);
  };

  const onSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    setViewMode('chat');
  };

  const onBack = () => {
    if (viewMode === 'chat') {
      setViewMode('matches');
      setSelectedMatch(null);
    } else {
      setViewMode('discovery');
    }
  };

  const onSendMessage = (content: string) => {
    if (selectedMatch) {
      sendMessage(selectedMatch.id, content);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-card border-b px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {viewMode !== 'discovery' && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            <span className="bg-gradient-romantic bg-clip-text text-transparent">
              tinder
            </span>
          </h1>
          
          <div className="flex gap-2">
            {viewMode === 'discovery' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('matches')}
                className="relative"
              >
                <MessageCircle className="w-5 h-5" />
                {matches.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-xs text-primary-foreground rounded-full flex items-center justify-center">
                    {matches.length}
                  </span>
                )}
              </Button>
            )}
            
            <Button variant="ghost" size="icon">
              <User className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto p-4">
        {viewMode === 'discovery' && (
          <div className="space-y-6">
            <CardStack
              users={availableUsers}
              onSwipe={onSwipe}
            />
            
            {/* Tinder-style Action Buttons */}
            <TinderActions
              onAction={(action) => {
                if (availableUsers.length > 0) {
                  onSwipe(availableUsers[0].id, action);
                }
              }}
              disabled={availableUsers.length === 0}
            />
            
            {/* Discovery Stats */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {availableUsers.length} people nearby
              </p>
            </div>
          </div>
        )}

        {viewMode === 'matches' && (
          <MatchesList
            matches={matches}
            currentUserId={currentUserProfile.id}
            onSelectMatch={onSelectMatch}
          />
        )}

        {viewMode === 'chat' && selectedMatch && (
          <div className="h-[calc(100vh-8rem)]">
            <ChatInterface
              match={selectedMatch}
              currentUserId={currentUserProfile.id}
              messages={getMessagesForMatch(selectedMatch.id)}
              onSendMessage={onSendMessage}
              onBack={onBack}
            />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t">
        <div className="max-w-md mx-auto flex">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-16 rounded-none",
              viewMode === 'discovery' && "bg-primary/10 text-primary"
            )}
            onClick={() => setViewMode('discovery')}
          >
            <div className="flex flex-col items-center gap-1">
              <Heart className="w-5 h-5" />
              <span className="text-xs">Discover</span>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-16 rounded-none relative",
              viewMode === 'matches' && "bg-primary/10 text-primary"
            )}
            onClick={() => setViewMode('matches')}
          >
            <div className="flex flex-col items-center gap-1">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs">Matches</span>
              {matches.length > 0 && (
                <span className="absolute top-2 right-1/2 translate-x-2 w-4 h-4 bg-primary text-xs text-primary-foreground rounded-full flex items-center justify-center">
                  {matches.length}
                </span>
              )}
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="flex-1 h-16 rounded-none"
          >
            <div className="flex flex-col items-center gap-1">
              <User className="w-5 h-5" />
              <span className="text-xs">Profile</span>
            </div>
          </Button>
        </div>
      </nav>

      {/* Match Modal */}
      {showMatchModal && newMatch && (
        <MatchModal
          isOpen={showMatchModal}
          onClose={() => {
            setShowMatchModal(false);
            setNewMatch(null);
          }}
          currentUser={currentUserProfile}
          matchedUser={newMatch.user1Id === currentUserProfile.id ? newMatch.user2 : newMatch.user1}
          onStartChat={onStartChat}
        />
      )}
    </div>
  );
}