import React, { useState } from 'react';
import { CATALOG, OrderItem, ProductCatalogItem, ProductSize } from '../types';
import { Plus, Trash2, ShoppingCart, Save, ChevronDown, Check, AlertCircle, CheckCircle2 } from 'lucide-react';

interface OrderFormProps {
  onSave: (customerName: string, church: string, items: OrderItem[], totalAmount: number) => Promise<void>;
}

export default function OrderForm({ onSave }: OrderFormProps) {
  const [customerName, setCustomerName] = useState('');
  const [church, setChurch] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  
  // Current item being added
  const [selectedProductId, setSelectedProductId] = useState<string>('camisas');
  const [selectedDesign, setSelectedDesign] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const selectedProduct = CATALOG[selectedProductId];

  const handleAddItem = () => {
    if (!selectedDesign) {
      showNotification('error', 'Por favor selecciona un diseño.');
      return;
    }
    if (selectedProduct.sizes && !selectedSize) {
      showNotification('error', 'Por favor selecciona una talla.');
      return;
    }
    if (quantity < 1) {
      showNotification('error', 'La cantidad debe ser al menos 1.');
      return;
    }

    let unitPrice = selectedProduct.price || 0;
    if (selectedProduct.sizes && selectedSize) {
      const sizeObj = selectedProduct.sizes.find(s => s.label === selectedSize);
      if (sizeObj) unitPrice = sizeObj.price;
    }

    const designObj = selectedProduct.designs.find(d => d.label === selectedDesign);

    const newItem: OrderItem = {
      product_type: selectedProduct.name,
      design: selectedDesign,
      design_code: designObj?.code,
      size: selectedSize || undefined,
      quantity,
      unit_price: unitPrice,
      subtotal: unitPrice * quantity
    };

    setItems([...items, newItem]);
    
    // Reset form but keep product type
    setSelectedDesign('');
    setSelectedSize('');
    setQuantity(1);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSave = async () => {
    if (!customerName.trim() || !church.trim()) {
      showNotification('error', 'Por favor ingresa el nombre y la iglesia.');
      return;
    }
    if (items.length === 0) {
      showNotification('error', 'El pedido debe tener al menos un artículo.');
      return;
    }

    setIsSaving(true);
    setNotification(null);
    try {
      await onSave(customerName, church, items, totalAmount);
      // Clear form on success
      setCustomerName('');
      setChurch('');
      setItems([]);
      showNotification('success', 'Pedido guardado exitosamente.');
    } catch (error: any) {
      showNotification('error', `Error al guardar el pedido: ${error.message || 'Error desconocido'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-8">
      {notification && (
        <div className={`p-4 rounded-xl flex items-center gap-3 transition-all ${
          notification.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{notification.message}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Datos del Cliente</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="Ej. Juan Pérez"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Iglesia</label>
            <input
              type="text"
              value={church}
              onChange={(e) => setChurch(e.target.value)}
              className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
              placeholder="Ej. Central"
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Agregar Productos</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto</label>
            <div className="relative">
              <select
                value={selectedProductId}
                onChange={(e) => {
                  setSelectedProductId(e.target.value);
                  setSelectedDesign('');
                  setSelectedSize('');
                }}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
              >
                {Object.values(CATALOG).map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diseño</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedProduct.designs.map(design => (
                <button
                  key={design.label}
                  onClick={() => setSelectedDesign(design.label)}
                  className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    selectedDesign === design.label 
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' 
                      : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {selectedDesign === design.label && <Check className="w-4 h-4" />}
                  {design.label}
                </button>
              ))}
            </div>
          </div>

          {selectedProduct.sizes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Talla</label>
              <div className="flex flex-wrap gap-2">
                {selectedProduct.sizes.map(size => (
                  <button
                    key={size.label}
                    onClick={() => setSelectedSize(size.label)}
                    className={`w-12 h-12 rounded-xl border text-sm font-medium transition-all flex flex-col items-center justify-center ${
                      selectedSize === size.label 
                        ? 'border-indigo-600 bg-indigo-600 text-white' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{size.label}</span>
                  </button>
                ))}
              </div>
              {selectedSize && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Precio unitario: C$ {selectedProduct.sizes.find(s => s.label === selectedSize)?.price}
                </p>
              )}
            </div>
          )}

          <div className="flex items-end gap-4">
            <div className="w-32">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all dark:text-white"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="flex-1 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar al Pedido
            </button>
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <ShoppingCart className="w-6 h-6 text-gray-900 dark:text-white" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resumen del Pedido</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            {items.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {item.quantity}x {item.product_type}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Diseño: {item.design} {item.size && `| Talla: ${item.size}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-gray-900 dark:text-white">C$ {item.subtotal}</p>
                  <button
                    onClick={() => removeItem(index)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between py-4 border-t border-gray-100 dark:border-gray-700 mb-6">
            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">Total a Pagar</span>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">C$ {totalAmount}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 text-white px-6 py-3.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 text-lg"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Guardando...' : 'Guardar Pedido'}
          </button>
        </div>
      )}
    </div>
  );
}
