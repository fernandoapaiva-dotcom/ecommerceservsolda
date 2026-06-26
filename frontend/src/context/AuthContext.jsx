import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

const initialState = {
  token: localStorage.getItem('token') || null,
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: true,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      return {
        ...state,
        token: action.payload.token,
        user: action.payload.user,
        loading: false,
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return {
        ...state,
        token: null,
        user: null,
        loading: false,
      };
    case 'SET_USER':
      localStorage.setItem('user', JSON.stringify(action.payload));
      return {
        ...state,
        user: action.payload,
        loading: false,
      };
    case 'STOP_LOADING':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Validate session on mount
  useEffect(() => {
    const checkSession = async () => {
      if (state.token) {
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              Authorization: `Bearer ${state.token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            dispatch({ type: 'SET_USER', payload: data.user });
          } else {
            // Token expired or invalid
            dispatch({ type: 'LOGOUT' });
          }
        } catch (e) {
          console.error('Session validation error:', e);
          dispatch({ type: 'STOP_LOADING' });
        }
      } else {
        dispatch({ type: 'STOP_LOADING' });
      }
    };
    checkSession();
  }, [state.token]);

  const login = (token, user) => {
    dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const updateUserProfile = (user) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
