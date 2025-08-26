import { useState } from 'react';
import { ArrowLeft, Send, Phone, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Match, Message } from '@/types/dating';
import { cn } from '@/lib/utils';

interface ChatInterfaceProps {
  match: Match;
  currentUserId: string;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onBack: () => void;
  onCall?: () => void;
  onVideoCall?: () => void;
}

export function ChatInterface({
  match,
  currentUserId,
  messages,
  onSendMessage,
  onBack,
  onCall,
  onVideoCall
}: ChatInterfaceProps) {
  const [newMessage, setNewMessage] = useState('');
  
  const otherUser = match.user1Id === currentUserId ? match.user2 : match.user1;

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b bg-gradient-subtle">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        
        <Avatar className="w-10 h-10">
          <AvatarImage src={otherUser.photos[0]} alt={otherUser.name} />
          <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-semibold">{otherUser.name}</h3>
          <p className="text-sm text-muted-foreground">Online</p>
        </div>
        
        <div className="flex gap-2">
          {onCall && (
            <Button variant="ghost" size="icon" onClick={onCall}>
              <Phone className="w-5 h-5" />
            </Button>
          )}
          {onVideoCall && (
            <Button variant="ghost" size="icon" onClick={onVideoCall}>
              <Video className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-romantic rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👋</span>
              </div>
              <p className="text-muted-foreground">
                You matched with {otherUser.name}!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Start the conversation with a hello
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwn = message.senderId === currentUserId;
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-end gap-2",
                    isOwn ? "justify-end" : "justify-start"
                  )}
                >
                  {!isOwn && (
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={otherUser.photos[0]} alt={otherUser.name} />
                      <AvatarFallback>{otherUser.name[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div
                    className={cn(
                      "max-w-[70%] px-4 py-2 rounded-2xl",
                      isOwn
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted rounded-bl-md"
                    )}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={cn(
                      "text-xs mt-1",
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${otherUser.name}...`}
            className="flex-1"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-gradient-romantic hover:opacity-90"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}