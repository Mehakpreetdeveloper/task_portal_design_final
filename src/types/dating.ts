export interface User {
  id: string;
  name: string;
  age: number;
  bio: string;
  photos: string[];
  location: string;
  interests: string[];
  occupation?: string;
  education?: string;
}

export interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  user1: User;
  user2: User;
  matchedAt: Date;
  lastMessage?: Message;
}

export interface Message {
  id: string;
  matchId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
}

export interface Like {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: Date;
}

export type SwipeAction = 'like' | 'dislike' | 'superlike' | 'boost';