/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import OrderForm from './components/OrderForm';
import AdminPanel from './components/AdminPanel';
import Login from './components/Login';
import { OrderItem } from './types';
import { ClipboardList, BarChart2, Moon, Sun } from 'lucide-react';
import { db, auth } from './lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'admin'>('form');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAdminToken(user.uid);
      } else {
        setAdminToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSaveOrder = async (customerName: string, church: string, items: OrderItem[], totalAmount: number) => {
    try {
      const orderData = {
        customer_name: customerName,
        customerName: customerName, // Guardamos ambos para compatibilidad
        church,
        phone: church, // En la app vieja era teléfono, lo guardamos para compatibilidad
        total_amount: totalAmount,
        total: totalAmount, // Para compatibilidad
        items: items.map((item: any) => ({
          product_type: item.product_type,
          design: item.design,
          design_code: item.design_code || null,
          size: item.size || null,
          quantity: item.quantity,
          unit_price: item.unit_price,
          subtotal: item.subtotal
        })),
        status: 'Pendiente',
        estado: 'Pendiente',
        created_at: serverTimestamp(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), orderData);
    } catch (error: any) {
      console.error("Full error object:", error);
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">
              C
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white hidden sm:block">
              Centenario 2026
            </h1>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'form' 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Pedido</span>
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                activeTab === 'admin' 
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300' 
                  : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              <BarChart2 className="w-4 h-4" />
              <span className="hidden sm:inline">Reportes</span>
            </button>
            
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1"></div>
            
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-all"
              title={isDark ? "Modo claro" : "Modo oscuro"}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </nav>
        </div>
      </header>

      <main className="py-8 px-4">
        {activeTab === 'form' ? (
          <OrderForm onSave={handleSaveOrder} />
        ) : adminToken ? (
          <AdminPanel token={adminToken} onLogout={() => setAdminToken(null)} />
        ) : (
          <Login onLogin={setAdminToken} />
        )}
      </main>
    </div>
  );
}
