export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'PM' | 'Team Lead' | 'User';
  phone: string;
  photo: string;
  employeeType: 'Developer' | 'Designer' | 'Marketing' | 'QA' | 'Product Manager';
  joinDate: string;
  status: 'Active' | 'Inactive';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'Todo' | 'In Progress' | 'In Review' | 'Completed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedTo: string[];
  projectIds: string[];
  createdBy: string;
  createdAt: string;
  dueDate: string;
  comments: Comment[];
  attachments: string[];
  tags: string[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
  teamMembers: string[];
  startDate: string;
  endDate: string;
  progress: number;
  attachments: string[];
  createdBy: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  mentions: string[];
  createdAt: string;
}

export interface Notification {
  id: string;
  type: 'task_created' | 'task_assigned' | 'task_completed' | 'project_updated' | 'comment_mention';
  title: string;
  message: string;
  userId: string;
  relatedId: string;
  createdAt: string;
  read: boolean;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    role: 'Admin',
    phone: '+1-555-0101',
    photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
    employeeType: 'Product Manager',
    joinDate: '2023-01-15',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    role: 'Team Lead',
    phone: '+1-555-0102',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    employeeType: 'Developer',
    joinDate: '2023-02-20',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@company.com',
    role: 'User',
    phone: '+1-555-0103',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    employeeType: 'Designer',
    joinDate: '2023-03-10',
    status: 'Active'
  },
  {
    id: '4',
    name: 'David Kim',
    email: 'david.kim@company.com',
    role: 'PM',
    phone: '+1-555-0104',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    employeeType: 'Developer',
    joinDate: '2023-04-05',
    status: 'Active'
  },
  {
    id: '5',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    role: 'User',
    phone: '+1-555-0105',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    employeeType: 'Marketing',
    joinDate: '2023-05-12',
    status: 'Active'
  },
  {
    id: '6',
    name: 'James Wilson',
    email: 'james.wilson@company.com',
    role: 'User',
    phone: '+1-555-0106',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    employeeType: 'QA',
    joinDate: '2023-06-01',
    status: 'Inactive'
  }
];

export const mockProjects: Project[] = [
  {
    id: '1',
    title: 'Website Redesign',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    status: 'Active',
    teamMembers: ['2', '3', '4'],
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    progress: 65,
    attachments: ['wireframes.pdf', 'design-system.sketch'],
    createdBy: '1',
    createdAt: '2023-12-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Mobile App Development',
    description: 'Native iOS and Android app for customer engagement',
    status: 'Planning',
    teamMembers: ['2', '4', '6'],
    startDate: '2024-02-15',
    endDate: '2024-08-30',
    progress: 10,
    attachments: ['requirements.docx', 'mockups.fig'],
    createdBy: '1',
    createdAt: '2024-01-10T14:30:00Z'
  },
  {
    id: '3',
    title: 'Marketing Campaign Q1',
    description: 'Comprehensive marketing strategy for Q1 2024 product launch',
    status: 'Completed',
    teamMembers: ['5'],
    startDate: '2024-01-01',
    endDate: '2024-03-31',
    progress: 100,
    attachments: ['campaign-brief.pdf', 'assets.zip'],
    createdBy: '1',
    createdAt: '2023-12-01T09:00:00Z'
  }
];

export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design new homepage layout',
    description: 'Create wireframes and mockups for the new homepage design focusing on user engagement',
    status: 'In Progress',
    priority: 'High',
    assignedTo: ['3'],
    projectIds: ['1'],
    createdBy: '1',
    createdAt: '2024-01-15T10:00:00Z',
    dueDate: '2024-02-15T23:59:59Z',
    comments: [],
    attachments: ['homepage-wireframe.sketch'],
    tags: ['design', 'homepage', 'ux']
  },
  {
    id: '2',
    title: 'Implement user authentication',
    description: 'Set up secure login system with OAuth integration',
    status: 'Todo',
    priority: 'Critical',
    assignedTo: ['2', '4'],
    projectIds: ['1', '2'],
    createdBy: '1',
    createdAt: '2024-01-20T14:30:00Z',
    dueDate: '2024-02-28T23:59:59Z',
    comments: [],
    attachments: [],
    tags: ['backend', 'security', 'authentication']
  },
  {
    id: '3',
    title: 'Create social media content',
    description: 'Develop engaging content for Instagram, Twitter, and LinkedIn',
    status: 'Completed',
    priority: 'Medium',
    assignedTo: ['5'],
    projectIds: ['3'],
    createdBy: '1',
    createdAt: '2024-01-05T09:15:00Z',
    dueDate: '2024-01-31T23:59:59Z',
    comments: [],
    attachments: ['content-calendar.xlsx', 'graphics.zip'],
    tags: ['marketing', 'social-media', 'content']
  },
  {
    id: '4',
    title: 'API endpoint testing',
    description: 'Comprehensive testing of all REST API endpoints',
    status: 'In Review',
    priority: 'High',
    assignedTo: ['6'],
    projectIds: ['2'],
    createdBy: '2',
    createdAt: '2024-01-25T11:00:00Z',
    dueDate: '2024-02-10T23:59:59Z',
    comments: [],
    attachments: ['test-cases.xlsx'],
    tags: ['testing', 'api', 'qa']
  },
  {
    id: '5',
    title: 'Database optimization',
    description: 'Optimize database queries for better performance',
    status: 'Todo',
    priority: 'Medium',
    assignedTo: ['2'],
    projectIds: ['1'],
    createdBy: '4',
    createdAt: '2024-01-30T16:20:00Z',
    dueDate: '2024-02-20T23:59:59Z',
    comments: [],
    attachments: [],
    tags: ['database', 'performance', 'backend']
  }
];

export const mockComments: Comment[] = [
  {
    id: '1',
    taskId: '1',
    userId: '3',
    content: 'I\'ve completed the initial wireframes. @sarah.johnson please review when you have a chance.',
    mentions: ['1'],
    createdAt: '2024-01-16T10:30:00Z'
  },
  {
    id: '2',
    taskId: '1',
    userId: '1',
    content: 'Great work! The layout looks promising. Can you add a call-to-action section?',
    mentions: [],
    createdAt: '2024-01-16T14:45:00Z'
  }
];

export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'task_assigned',
    title: 'New Task Assigned',
    message: 'You have been assigned to "Design new homepage layout"',
    userId: '3',
    relatedId: '1',
    createdAt: '2024-01-15T10:00:00Z',
    read: false
  },
  {
    id: '2',
    type: 'comment_mention',
    title: 'You were mentioned',
    message: 'Emily Rodriguez mentioned you in a comment',
    userId: '1',
    relatedId: '1',
    createdAt: '2024-01-16T10:30:00Z',
    read: false
  },
  {
    id: '3',
    type: 'task_completed',
    title: 'Task Completed',
    message: 'Lisa Thompson completed "Create social media content"',
    userId: '1',
    relatedId: '3',
    createdAt: '2024-01-31T15:20:00Z',
    read: true
  },
  {
    id: '4',
    type: 'project_updated',
    title: 'Project Update',
    message: 'Website Redesign project progress updated to 65%',
    userId: '1',
    relatedId: '1',
    createdAt: '2024-02-01T09:10:00Z',
    read: false
  }
];