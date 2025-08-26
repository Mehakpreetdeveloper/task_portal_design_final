import { useState, useEffect } from 'react';
import { User, Match, Message, SwipeAction } from '@/types/dating';
import { useToast } from '@/hooks/use-toast';
import profile1 from '@/assets/profile1.jpg';
import profile2 from '@/assets/profile2.jpg';
import profile3 from '@/assets/profile3.jpg';

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Emma',
    age: 24,
    bio: 'Love hiking, coffee, and good conversations. Looking for someone to explore the city with! 🌟',
    photos: [profile1],
    location: 'San Francisco, CA',
    interests: ['Hiking', 'Coffee', 'Photography', 'Travel', 'Yoga'],
    occupation: 'UX Designer',
    education: 'Stanford University'
  },
  {
    id: '2',
    name: 'Alex',
    age: 27,
    bio: 'Software engineer by day, chef by night. Always down for trying new restaurants and outdoor adventures.',
    photos: [profile2],
    location: 'San Francisco, CA',
    interests: ['Cooking', 'Tech', 'Rock Climbing', 'Music'],
    occupation: 'Software Engineer',
    education: 'UC Berkeley'
  },
  {
    id: '3',
    name: 'Sarah',
    age: 26,
    bio: 'Artist and dog lover 🎨🐕 Looking for genuine connections and someone who appreciates creativity.',
    photos: [profile3],
    location: 'Oakland, CA',
    interests: ['Art', 'Dogs', 'Museums', 'Wine', 'Books'],
    occupation: 'Graphic Designer',
    education: 'Art Institute'
  }
];

const currentUser: User = {
  id: 'current',
  name: 'You',
  age: 25,
  bio: 'Your profile here',
  photos: ['/placeholder.svg'],
  location: 'San Francisco, CA',
  interests: ['Dating', 'Fun', 'Adventure'],
};

export function useDatingData() {
  const [availableUsers, setAvailableUsers] = useState<User[]>(mockUsers);
  const [matches, setMatches] = useState<Match[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [currentUserProfile] = useState<User>(currentUser);
  const { toast } = useToast();

  const handleSwipe = (userId: string, action: SwipeAction) => {
    const swipedUser = availableUsers.find(user => user.id === userId);
    if (!swipedUser) return;

    // Remove user from available users
    setAvailableUsers(prev => prev.filter(user => user.id !== userId));

    if (action === 'like' || action === 'superlike') {
      // Simulate 50% match rate for demo
      const isMatch = Math.random() > 0.5;
      
      if (isMatch) {
        const newMatch: Match = {
          id: `match_${Date.now()}`,
          user1Id: currentUserProfile.id,
          user2Id: userId,
          user1: currentUserProfile,
          user2: swipedUser,
          matchedAt: new Date()
        };
        
        setMatches(prev => [newMatch, ...prev]);
        setMessages(prev => ({ ...prev, [newMatch.id]: [] }));
        
        return newMatch; // Return match for modal
      }
    }

    if (action === 'like') {
      toast({
        title: "Keep swiping!",
        description: "No match this time, but there are more profiles to explore.",
      });
    }

    return null;
  };

  const sendMessage = (matchId: string, content: string) => {
    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      matchId,
      senderId: currentUserProfile.id,
      content,
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage]
    }));

    // Update match with last message
    setMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, lastMessage: newMessage }
        : match
    ));

    // Simulate response after 2 seconds
    setTimeout(() => {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        const otherUser = match.user1Id === currentUserProfile.id ? match.user2 : match.user1;
        const responses = [
          "Hey! Nice to meet you 😊",
          "Thanks for the message!",
          "How's your day going?",
          "I'd love to know more about you!",
          "What do you like to do for fun?"
        ];
        
        const responseMessage: Message = {
          id: `msg_${Date.now()}_response`,
          matchId,
          senderId: otherUser.id,
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          type: 'text'
        };

        setMessages(prev => ({
          ...prev,
          [matchId]: [...(prev[matchId] || []), responseMessage]
        }));

        setMatches(prev => prev.map(match => 
          match.id === matchId 
            ? { ...match, lastMessage: responseMessage }
            : match
        ));
      }
    }, 2000);
  };

  return {
    availableUsers,
    matches,
    messages,
    currentUserProfile,
    handleSwipe,
    sendMessage,
    getMessagesForMatch: (matchId: string) => messages[matchId] || []
  };
}