import React, { useState } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { signInWithPopup } from 'firebase/auth';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      onLogin(result.user.uid);
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-700 w-full max-w-md transition-colors">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">Acceso Administrativo</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Inicia sesión con tu cuenta de Google autorizada</p>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-800/30 mb-6">
            {error}
          </p>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-lg"
        >
          {loading ? 'Verificando...' : (
            <>
              <LogIn className="w-5 h-5" />
              Ingresar con Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}
