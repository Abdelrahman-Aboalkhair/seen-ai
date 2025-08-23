import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { User, Session, AuthError } from "@supabase/supabase-js";
import { supabase, Profile } from "./supabase";
import toast from "react-hot-toast";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: AuthError }>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{ error?: AuthError }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      // If profile doesn't exist, create one
      if (!data) {
        console.log(
          "Profile not found, creating new profile for user:",
          userId
        );
        await createProfile(userId);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }, []);

  // Load user on mount
  useEffect(() => {
    async function loadUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
          await loadProfile(user.id);
        }
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    }
    loadUser();

    // Set up auth listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfile]);

  async function createProfile(userId: string) {
    try {
      // Get user info from auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No user found when creating profile");
        return;
      }

      const profileData = {
        id: userId,
        email: user.email!,
        full_name: user.user_metadata?.full_name || "User",
        credits: 500,
        total_searches: 0,
        total_analyses: 0,
        is_admin: false,
      };

      const { data, error } = await supabase
        .from("profiles")
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error("Error creating profile:", error);
        toast.error("خطأ في إنشاء ملف المستخدم");
        return;
      }

      console.log("Profile created successfully:", data);
      setProfile(data);
    } catch (error) {
      console.error("Error creating profile:", error);
    }
  }

  async function refreshProfile() {
    if (user) {
      await loadProfile(user.id);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log("Attempting to sign in with:", { email });

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("Sign in response:", { data, error });

      if (error) {
        console.error("Supabase auth error:", error);
        // Map common Supabase errors to user-friendly messages
        let errorMessage = "فشل في تسجيل الدخول";

        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "يرجى تأكيد البريد الإلكتروني أولاً";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "محاولات كثيرة، يرجى المحاولة لاحقاً";
        } else {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        return { error };
      }

      if (data.user) {
        console.log("User signed in successfully:", data.user.id);
        toast.success("تم تسجيل الدخول بنجاح!");
        return {};
      }

      return {};
    } catch (error: any) {
      console.error("Sign in error:", error);
      toast.error("حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى");
      return { error };
    }
  }

  async function signUp(email: string, password: string, fullName: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.protocol}//${window.location.host}/auth/callback`,
        },
      });

      if (error) {
        // Map common Supabase errors to user-friendly messages
        let errorMessage = "Sign up failed";

        if (error.message.includes("User already registered")) {
          errorMessage =
            "An account with this email already exists. Please sign in instead.";
        } else if (error.message.includes("Password")) {
          errorMessage = "Password must be at least 6 characters long.";
        } else if (error.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = error.message;
        }

        toast.error(errorMessage);
        return { error };
      }

      toast.success("Activation link sent to your email!");
      return {};
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast.error("An unexpected error occurred. Please try again.");
      return { error };
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        toast.error("Error signing out");
      } else {
        toast.success("Successfully signed out");
      }
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Error signing out");
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
