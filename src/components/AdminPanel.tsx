import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import { LogOut, RefreshCw, Download, FileText, BarChart3, Package, Trash2, Loader2, AlertCircle, Edit2, Check, X, ExternalLink, Settings, ShieldCheck, Key } from 'lucide-react';
import { db, auth } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as XLSX from 'xlsx';

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
}

export default function AdminPanel({ token, onLogout }: AdminPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'summary' | 'settings'>('orders');
  
  // Settings state
  const [staffPin, setStaffPin] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const isOwner = auth.currentUser?.email === 'hmalldm95@gmail.com';

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch orders
      let querySnapshot = await getDocs(collection(db, 'orders'));
      
      if (querySnapshot.empty) {
        try {
          const fallbackSnapshot = await getDocs(collection(db, 'pedidos'));
          if (!fallbackSnapshot.empty) {
            querySnapshot = fallbackSnapshot;
          }
        } catch (e) {
          console.log("Fallback collection 'pedidos' failed", e);
        }
      }
      
      const ordersData = querySnapshot.docs
        .filter(doc => doc.id !== 'settings_access' && !doc.data().isSettings)
        .map(doc => {
        const data = doc.data();
        
        let createdAt = new Date().toISOString();
        if (data.createdAt?.toDate) {
          createdAt = data.createdAt.toDate().toISOString();
        } else if (data.created_at?.toDate) {
          createdAt = data.created_at.toDate().toISOString();
        } else if (data.createdAt) {
          createdAt = new Date(data.createdAt).toISOString();
        } else if (data.fecha) {
          createdAt = new Date(data.fecha).toISOString();
        }

        let items = data.items || data.cart || data.productos || [];
        if (items.length === 0 && data.producto_nombre) {
          items = [{
            product_type: data.producto_nombre,
            quantity: data.cantidad || 1,
            design: data.diseno_nombre || '',
            design_code: data.opcion_descripcion || '',
            size: data.talla || '',
            unit_price: data.total / (data.cantidad || 1),
            subtotal: data.total
          }];
        }

        return {
          id: doc.id,
          ...data,
          customer_name: data.cliente_nombre || data.customerName || data.customer_name || data.cliente || 'Desconocido',
          church: data.cliente_telefono || data.phone || data.telefono || data.church || '',
          total_amount: data.total || data.total_amount || 0,
          items: items,
          status: data.estado || data.status || 'Pendiente',
          created_at: createdAt
        };
      }) as Order[];
      
      ordersData.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
      setOrders(ordersData);

      let totalRevenue = 0;
      const summaryMap = new Map();

      ordersData.forEach(order => {
        totalRevenue += Number(order.total_amount);
        order.items?.forEach((item: any) => {
          const key = `${item.product_type || item.product || item.name}|${item.design || item.option || ''}|${item.size || item.talla || ''}`;
          if (!summaryMap.has(key)) {
            summaryMap.set(key, { 
              product_type: item.product_type || item.product || item.name, 
              design: item.design || item.option,
              size: item.size || item.talla, 
              total_qty: 0 
            });
          }
          summaryMap.get(key).total_qty += (item.quantity || item.qty || 1);
        });
      });

      setReports({ totalRevenue, itemsSummary: Array.from(summaryMap.values()) });

      // Fetch settings if owner
      if (isOwner) {
        const accessDoc = await getDoc(doc(db, 'orders', 'settings_access'));
        if (accessDoc.exists()) {
          setStaffPin(accessDoc.data().staffPin || '');
        }
      }

    } catch (error: any) {
      console.error('Error fetching data:', error);
      setErrorMsg(error.message || 'Error desconocido al obtener los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    const path = 'orders/settings_access';
    try {
      await setDoc(doc(db, 'orders', 'settings_access'), {
        staffPin: staffPin,
        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.email || 'unknown',
        isSettings: true
      }, { merge: true });
      alert('Configuración guardada correctamente.');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      
      // Estructura de error detallada para diagnóstico
      const errInfo = {
        error: error.message,
        operationType: 'write',
        path: path,
        authInfo: {
          userId: auth.currentUser?.uid,
          email: auth.currentUser?.email,
          emailVerified: auth.currentUser?.emailVerified,
          isAnonymous: auth.currentUser?.isAnonymous
        }
      };
      console.error('Firestore Error Detail:', JSON.stringify(errInfo));
      
      alert(`Error al guardar la configuración: ${error.message || 'Permisos insuficientes'}`);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleStartEdit = (order: Order) => {
    setEditingId(order.id!);
    setEditForm({
      customer_name: order.customer_name,
      church: order.church,
      status: order.status,
      total_amount: order.total_amount
    });
  };

  const handleUpdateOrder = async () => {
    if (!editingId || !editForm) return;
    setIsUpdating(true);
    try {
      const orderRef = doc(db, 'orders', editingId);
      
      // Update with both old and new field names for compatibility
      const updateData: any = {
        // New app fields
        customer_name: editForm.customer_name,
        church: editForm.church,
        status: editForm.status,
        total_amount: Number(editForm.total_amount),
        // Old app fields
        cliente_nombre: editForm.customer_name,
        customerName: editForm.customer_name,
        cliente_telefono: editForm.church,
        phone: editForm.church,
        telefono: editForm.church,
        estado: editForm.status,
        total: Number(editForm.total_amount)
      };

      await updateDoc(orderRef, updateData);
      await fetchData();
      setEditingId(null);
      setEditForm(null);
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Error al actualizar el pedido.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      await fetchData();
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Error al eliminar el pedido.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportToExcel = () => {
    const dataToExport = orders.map(order => ({
      ID: order.id,
      Fecha: new Date(order.created_at!).toLocaleDateString(),
      Cliente: order.customer_name,
      'Iglesia/Tel': order.church,
      Total: order.total_amount,
      Estado: order.status,
      Articulos: order.items?.map((item: any) => 
        `${item.quantity || 1}x ${item.product_type || item.name} (${item.design || ''} ${item.size || ''})`
      ).join('; ')
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");
    XLSX.writeFile(wb, `Pedidos_Centenario_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleLogout = async () => {
    await signOut(auth);
    onLogout();
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Panel de Administración</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Gestión de pedidos Centenario 2026</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="https://sublimacion-rose.vercel.app/admin"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-xl font-medium transition-colors border border-emerald-100 dark:border-emerald-800/30"
          >
            <ExternalLink className="w-4 h-4" />
            Catálogo Admin
          </a>
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl font-medium transition-colors border border-indigo-100 dark:border-indigo-800/30"
          >
            <Download className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-xl transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Error al cargar los pedidos</h3>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errorMsg}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800/50 rounded-xl w-fit transition-colors">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'orders' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Lista de Pedidos
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
            activeTab === 'summary' 
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Resumen Total
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
              activeTab === 'settings' 
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
        )}
      </div>

      {activeTab === 'summary' && reports && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-indigo-600 dark:bg-indigo-500 text-white p-6 rounded-2xl shadow-sm transition-colors">
            <p className="text-indigo-100 font-medium mb-1">Recaudación Total</p>
            <h3 className="text-4xl font-bold">C$ {reports.totalRevenue.toLocaleString()}</h3>
          </div>
          
          <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Resumen de Artículos
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Producto</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Diseño</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400">Talla</th>
                    <th className="pb-3 font-medium text-gray-500 dark:text-gray-400 text-right">Cantidad Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                   {reports.itemsSummary.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="py-3 text-gray-900 dark:text-gray-100 font-medium">{item.product_type}</td>
                      <td className="py-3 text-gray-600 dark:text-gray-300 text-sm">{item.design || '-'}</td>
                      <td className="py-3 text-gray-500 dark:text-gray-400">{item.size || '-'}</td>
                      <td className="py-3 text-gray-900 dark:text-gray-100 text-right font-semibold">{item.total_qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400">ID</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Cliente</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Iglesia/Tel</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400">Artículos</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-right">Total</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-center">Estado</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-right">Fecha</th>
                  <th className="py-4 px-6 font-medium text-gray-500 dark:text-gray-400 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                      <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{String(order.id).slice(0, 6)}</span>
                    </td>
                    <td className="py-4 px-6">
                      {editingId === order.id ? (
                        <input
                          type="text"
                          value={editForm.customer_name}
                          onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-indigo-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      ) : (
                        <span className="font-medium text-gray-900 dark:text-gray-100">{order.customer_name}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {editingId === order.id ? (
                        <input
                          type="text"
                          value={editForm.church}
                          onChange={(e) => setEditForm({ ...editForm, church: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-indigo-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      ) : (
                        <span className="text-gray-600 dark:text-gray-300">{order.church}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-500 dark:text-gray-400">
                      {order.items?.map((item: any, i: number) => (
                        <div key={i} className="mb-1">
                          <span className="font-medium text-gray-700 dark:text-gray-300">{item.quantity || item.qty || 1}x</span> {item.product_type || item.product || item.name} 
                          <br/>
                          <span className="text-xs opacity-75">
                            {item.design || item.option} {item.design_code ? `[${item.design_code}]` : ''} {item.size || item.talla ? `(${item.size || item.talla})` : ''}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {editingId === order.id ? (
                        <input
                          type="number"
                          value={editForm.total_amount}
                          onChange={(e) => setEditForm({ ...editForm, total_amount: e.target.value })}
                          className="w-24 px-2 py-1 text-sm border border-indigo-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white text-right"
                        />
                      ) : (
                        <span className="font-semibold text-gray-900 dark:text-gray-100">C$ {order.total_amount}</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {editingId === order.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="px-2 py-1 text-xs border border-indigo-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="completado">Completado</option>
                          <option value="cancelado">Cancelado</option>
                        </select>
                      ) : (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          order.status.toLowerCase() === 'completado' 
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
                            : order.status.toLowerCase() === 'cancelado'
                            ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800/50'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/50'
                        }`}>
                          {order.status}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-right text-sm">
                      {new Date(order.created_at!).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {editingId === order.id ? (
                          <>
                            <button
                              onClick={handleUpdateOrder}
                              disabled={isUpdating}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                              title="Guardar"
                            >
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEdit(order)}
                              className="p-1.5 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {deletingId === order.id ? (
                              <div className="flex gap-1">
                                <button onClick={() => handleDeleteOrder(order.id!)} className="text-red-600 text-xs font-bold">SI</button>
                                <button onClick={() => setDeletingId(null)} className="text-gray-400 text-xs">NO</button>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setDeletingId(order.id!)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Borrar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'settings' && isOwner && (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Configuración de Acceso</h3>
              <p className="text-gray-500 dark:text-gray-400">Gestiona el acceso para tus ayudantes</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 p-4 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Nota:</strong> El ayudante podrá ver y editar pedidos, pero no podrá acceder a esta configuración ni borrar pedidos (opcional).
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN de Acceso para Ayudante</label>
                <div className="relative">
                  <input
                    type="text"
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="Ej: 123456"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono tracking-widest"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Key className="w-5 h-5" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">Este es el código que tu ayudante usará para ingresar sin necesidad de cuenta de Google.</p>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings || !staffPin}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isSavingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
