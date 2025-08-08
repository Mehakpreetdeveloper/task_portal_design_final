import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  phone_number: string | null;
  user_type: 'Designer' | 'Marketing' | 'Developer' | 'WordPress' | 'Shopify' | null;
  created_at: string;
  updated_at: string;
};

type UserRole = {
  id: string;
  user_id: string;
  role: 'admin' | 'project_manager' | 'team_lead' | 'user';
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRoles: UserRole[];
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  hasRole: (role: 'admin' | 'project_manager' | 'team_lead' | 'user') => boolean;
  isAdmin: boolean;
  isProjectManager: boolean;
  isTeamLead: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data: profileData } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: rolesData } = await (supabase as any)
      .from('user_roles')
      .select('*')
      .eq('user_id', userId);

    setProfile(profileData);
    setUserRoles(rolesData || []);
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
        }
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: metadata
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const hasRole = (role: 'admin' | 'project_manager' | 'team_lead' | 'user') => {
    return userRoles.some(userRole => userRole.role === role);
  };

  const isAdmin = hasRole('admin');
  const isProjectManager = hasRole('project_manager') || isAdmin;
  const isTeamLead = hasRole('team_lead') || isProjectManager;

  const value: AuthContextType = {
    user,
    session,
    profile,
    userRoles,
    loading,
    signUp,
    signIn,
    signOut,
    hasRole,
    isAdmin,
    isProjectManager,
    isTeamLead,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};