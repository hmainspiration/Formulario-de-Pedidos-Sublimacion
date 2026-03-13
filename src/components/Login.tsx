import React, { useState } from 'react';
import { Lock, LogIn, UserCircle, Key } from 'lucide-react';
import { auth, googleProvider, db } from '../lib/firebase';
import { signInWithPopup, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

interface LoginProps {
  onLogin: (token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'google' | 'pin'>('google');
  const [pin, setPin] = useState('');

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

  const handlePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    
    setError('');
    setLoading(true);
    try {
      // 1. Iniciar sesión anónima PRIMERO para tener permisos de lectura
      const result = await signInAnonymously(auth);
      
      // 2. Ahora que estamos autenticados, verificar el PIN en Firestore
      const accessDoc = await getDoc(doc(db, 'orders', 'settings_access'));
      const data = accessDoc.data();
      // Prioriza el PIN de la base de datos, si no existe usa el de respaldo '1926'
      const storedPin = (data && data.staffPin) ? data.staffPin : '1926';

      if (pin !== storedPin) {
        await signOut(auth);
        throw new Error('PIN incorrecto');
      }
      
      // 3. Crear sesión de ayudante válida por 24 horas
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);
      
      await setDoc(doc(db, 'staff_sessions', result.user.uid), {
        expires: Timestamp.fromDate(expires),
        createdAt: Timestamp.now(),
        type: 'staff'
      });

      onLogin(result.user.uid);
    } catch (err: any) {
      console.error(err);
      setError(err.message === 'PIN incorrecto' ? 'PIN incorrecto' : 'Error al verificar PIN');
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
        <p className="text-center text-gray-500 dark:text-gray-400 mb-8">Selecciona tu método de ingreso</p>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-8">
          <button
            onClick={() => setLoginMode('google')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'google' 
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <UserCircle className="w-4 h-4" />
            Correo
          </button>
          <button
            onClick={() => setLoginMode('pin')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              loginMode === 'pin' 
                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Key className="w-4 h-4" />
            PIN
          </button>
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-sm font-medium text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-800/30 mb-6">
            {error}
          </p>
        )}

        {loginMode === 'google' ? (
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
        ) : (
          <form onSubmit={handlePinLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN de Acceso</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Introduce el PIN"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-lg"
            >
              {loading ? 'Verificando...' : (
                <>
                  <LogIn className="w-5 h-5" />
                  Ingresar con PIN
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
