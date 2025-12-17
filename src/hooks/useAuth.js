import { useState, useEffect } from 'react';
import { getSupabaseClient, isSupabaseConfigured } from '../api/supabase';

// Sistema de autenticação com fallback para localStorage
// Se Supabase não estiver disponível, usa localStorage como backup

const LOCAL_USERS_KEY = 'cacau_market_users';
const CURRENT_USER_KEY = 'cacau_market_current_user';

// Usuários de demo para teste
const DEMO_USERS = {
  'demo@cacaumarket.com': {
    id: 'demo-user-001',
    email: 'demo@cacaumarket.com',
    password: 'Demo@123456',
    name: 'Demo User',
  },
  'test@cacaumarket.com': {
    id: 'test-user-001',
    email: 'test@cacaumarket.com',
    password: 'Test@123456',
    name: 'Test User',
  },
  'cliente@cacau.com': {
    id: 'cliente-001',
    email: 'cliente@cacau.com',
    password: 'Cacau@123',
    name: 'Cliente Cacau',
  },
};

// Verificar se Supabase está disponível
const isSupabaseAvailable = () => isSupabaseConfigured();

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializa auth state ao montar
  useEffect(() => {
    const getSession = async () => {
      try {
        setLoading(true);

        // 1. Verificar se há usuário no localStorage
        const storedUser = localStorage.getItem(CURRENT_USER_KEY);
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setSession({ user: userData });
          setLoading(false);
          return;
        }

        // 2. Tentar Supabase se disponível
        if (isSupabaseAvailable()) {
          const supabase = getSupabaseClient();
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (!sessionError && session) {
            setSession(session);
            setUser(session?.user || null);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar sessão:', err);
      } finally {
        setLoading(false);
      }
    };

    getSession();
  }, []);

  // Login com Email
  const login = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Tentar com Supabase se disponível
      if (isSupabaseAvailable()) {
        const supabase = getSupabaseClient();
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (!signInError && data?.user) {
          setSession(data.session);
          setUser(data.user);
          return data;
        }
      }

      // 2. Fallback: verificar localStorage
      const storedUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      
      // 3. Verificar usuários de demo
      const user = storedUsers[email] || DEMO_USERS[email];
      
      if (user && user.password === password) {
        const userData = {
          id: user.id,
          email: user.email,
          name: user.name,
          user_metadata: { full_name: user.name },
        };
        
        setUser(userData);
        setSession({ user: userData });
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
        
        return { user: userData, session: { user: userData } };
      }

      throw new Error('Email ou senha inválidos');
    } catch (err) {
      const message = err.message || 'Erro ao fazer login';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Register com Email
  const register = async (email, password, fullName = '') => {
    try {
      setLoading(true);
      setError(null);

      // 1. Tentar com Supabase se disponível
      if (isSupabaseAvailable()) {
        const supabase = getSupabaseClient();
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });

        if (!signUpError && data?.user) {
          return data;
        }
      }

      // 2. Fallback: salvar em localStorage
      const storedUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
      
      if (storedUsers[email]) {
        throw new Error('Este email já está registrado');
      }

      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password,
        name: fullName || email.split('@')[0],
      };

      storedUsers[email] = newUser;
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(storedUsers));

      const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        user_metadata: { full_name: newUser.name },
      };

      setUser(userData);
      setSession({ user: userData });
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));

      return { user: userData };
    } catch (err) {
      const message = err.message || 'Erro ao registrar';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Login com Google
  const loginWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseAvailable()) {
        // Google login não disponível em modo offline
        throw new Error('Google login disponível apenas com Supabase configurado');
      }

      const supabase = getSupabaseClient();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (oauthError) throw oauthError;

      return data;
    } catch (err) {
      const message = err.message || 'Erro ao fazer login com Google';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tentar fazer logout no Supabase se disponível
      if (isSupabaseAvailable()) {
        const supabase = getSupabaseClient();
        await supabase.auth.signOut();
      }

      // Limpar localStorage
      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setSession(null);
    } catch (err) {
      const message = err.message || 'Erro ao desconectar';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset Password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);

      if (!isSupabaseAvailable()) {
        throw new Error('Recuperação de senha disponível apenas com Supabase configurado');
      }

      const supabase = getSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) throw resetError;

      return true;
    } catch (err) {
      const message = err.message || 'Erro ao enviar link de reset';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    session,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    resetPassword,
    isAuthenticated: !!user,
    isSupabaseAvailable: isSupabaseAvailable(),
  };
};

export default useAuth;
