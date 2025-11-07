import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/store/useAppStore";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const setCurrentUserId = useAppStore((state) => state.setCurrentUserId);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update store with current user ID
        if (session?.user) {
          setCurrentUserId(session.user.id);
        } else {
          setCurrentUserId('');
        }
        
        // Defer Supabase calls with setTimeout to prevent deadlock
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profileData } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", session.user.id)
                .maybeSingle();
              
              setProfile(profileData);
              setLoading(false);
            } catch (error: any) {
              if (import.meta.env.DEV) {
                console.error('[Auth] Profile fetch failed:', error.message);
              }
              setLoading(false);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Update store with current user ID
      if (session?.user) {
        setCurrentUserId(session.user.id);
        
        try {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();
          
          setProfile(profileData);
          setLoading(false);
        } catch (error: any) {
          if (import.meta.env.DEV) {
            console.error('[Auth] Profile fetch failed:', error.message);
          }
          setLoading(false);
        }
      } else {
        setCurrentUserId('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUserId]);

  const signOut = async () => {
    setCurrentUserId(''); // Clear user ID from store
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
