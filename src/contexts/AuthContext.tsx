import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

WebBrowser.maybeCompleteAuthSession();

const domain = process.env.EXPO_PUBLIC_AUTH0_DOMAIN!.trim();
const clientId = process.env.EXPO_PUBLIC_AUTH0_CLIENT_ID!.trim();
const AUTH_TOKEN_KEY = '@root_auth_token';

const discovery = {
  authorizationEndpoint: `https://${domain}/authorize`,
  tokenEndpoint: `https://${domain}/oauth/token`,
  revocationEndpoint: `https://${domain}/oauth/revoke`,
};

function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const jsonPayload = decodeURIComponent(
      atob(padded)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

const DEV_USER_AUTH0_ID = 'dev|test-user-001';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  devLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  devLogin: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'com.root.app', path: 'callback' });
  console.log('[Auth] redirectUri =', redirectUri); // Add this exact URL to Auth0 Allowed Callback URLs

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredToken();
  }, []);

  useEffect(() => {
    if (response?.type === 'success' && request?.codeVerifier) {
      exchangeCode(response.params.code, request.codeVerifier);
    } else if (response?.type === 'error' || response?.type === 'cancel') {
      setLoading(false);
    }
  }, [response]);

  async function loadStoredToken() {
    // Safety timeout — if Supabase hangs on mobile, don't block forever
    const timer = setTimeout(() => setLoading(false), 8000);
    try {
      const stored = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (stored) {
        const { id_token } = JSON.parse(stored);
        if (id_token) {
          await syncUser(id_token);
          return;
        }
      }
    } catch {}
    finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }

  async function exchangeCode(code: string, codeVerifier: string) {
    try {
      const res = await fetch(`https://${domain}/oauth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: clientId,
          code,
          code_verifier: codeVerifier,
          redirect_uri: redirectUri,
        }),
      });
      const tokens = await res.json();
      if (tokens.id_token) {
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(tokens));
        await syncUser(tokens.id_token);
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  async function syncUser(idToken: string) {
    setLoading(true);
    try {
      const payload = parseJwt(idToken);
      if (!payload?.sub) { setLoading(false); return; }

      const displayName = payload.name ?? payload.email ?? 'Explorer';
      const { data: existing } = await supabase
        .from('users').select('*').eq('auth0_id', payload.sub).single();

      if (existing) {
        setCurrentUser(existing);
        return;
      }

      const base = displayName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
      const username = `${base}${Math.floor(Math.random() * 9999)}`;
      const { data: newUser } = await supabase
        .from('users').insert({ auth0_id: payload.sub, username }).select('*').single();
      setCurrentUser(newUser);
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    if (!request) return;
    setLoading(true);
    await promptAsync();
  }

  async function logout() {
    await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
    setCurrentUser(null);
  }

  async function devLogin() {
    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from('users').select('*').eq('auth0_id', DEV_USER_AUTH0_ID).single();
      if (existing) {
        setCurrentUser(existing);
        return;
      }
      const { data: newUser } = await supabase
        .from('users')
        .insert({ auth0_id: DEV_USER_AUTH0_ID, username: 'devexplorer' })
        .select('*')
        .single();
      setCurrentUser(newUser);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider
      value={{ currentUser, loading, isAuthenticated: !!currentUser, login, logout, devLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
