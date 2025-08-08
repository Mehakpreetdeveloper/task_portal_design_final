import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Task, Project, Comment, mockUsers, mockTasks, mockProjects, mockComments } from '@/data/mockData';

interface DataContextType {
  // Data
  users: User[];
  tasks: Task[];
  projects: Project[];
  comments: Comment[];
  
  // User CRUD
  createUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, user: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Task CRUD
  createTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  // Project CRUD
  createProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Comment CRUD
  addComment: (comment: Omit<Comment, 'id'>) => void;
  updateComment: (id: string, comment: Partial<Comment>) => void;
  deleteComment: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [comments, setComments] = useState<Comment[]>(mockComments);

  const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // User CRUD
  const createUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: generateId() };
    setUsers(prev => [...prev, newUser]);
  };

  const updateUser = (id: string, userUpdate: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === id ? { ...user, ...userUpdate } : user
    ));
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(user => user.id !== id));
    // Also remove user from tasks and projects
    setTasks(prev => prev.map(task => ({
      ...task,
      assignedTo: task.assignedTo.filter(userId => userId !== id)
    })));
    setProjects(prev => prev.map(project => ({
      ...project,
      teamMembers: project.teamMembers.filter(userId => userId !== id)
    })));
  };

  // Task CRUD
  const createTask = (task: Omit<Task, 'id'>) => {
    const newTask = { ...task, id: generateId() };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, taskUpdate: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === id ? { ...task, ...taskUpdate } : task
    ));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
    setComments(prev => prev.filter(comment => comment.taskId !== id));
  };

  // Project CRUD
  const createProject = (project: Omit<Project, 'id'>) => {
    const newProject = { ...project, id: generateId() };
    setProjects(prev => [...prev, newProject]);
  };

  const updateProject = (id: string, projectUpdate: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id ? { ...project, ...projectUpdate } : project
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    // Remove project references from tasks
    setTasks(prev => prev.map(task => ({
      ...task,
      projectIds: task.projectIds.filter(projectId => projectId !== id)
    })));
  };

  // Comment CRUD
  const addComment = (comment: Omit<Comment, 'id'>) => {
    const newComment = { ...comment, id: generateId() };
    setComments(prev => [...prev, newComment]);
  };

  const updateComment = (id: string, commentUpdate: Partial<Comment>) => {
    setComments(prev => prev.map(comment => 
      comment.id === id ? { ...comment, ...commentUpdate } : comment
    ));
  };

  const deleteComment = (id: string) => {
    setComments(prev => prev.filter(comment => comment.id !== id));
  };

  return (
    <DataContext.Provider value={{
      users,
      tasks,
      projects,
      comments,
      createUser,
      updateUser,
      deleteUser,
      createTask,
      updateTask,
      deleteTask,
      createProject,
      updateProject,
      deleteProject,
      addComment,
      updateComment,
      deleteComment,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}