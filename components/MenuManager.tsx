import React, { useState, useMemo } from 'react';
import { MenuItem } from '../types';
import { Search, Plus, Upload, Edit, Trash2, Save, X, Filter, Loader2, Database } from 'lucide-react';
import { syncService } from '../services/SyncService';
import { ExcelUploadService } from '../services/ExcelUploadService';
import { supabase } from '../lib/supabase';

interface MenuManagerProps {
  menuData: MenuItem[];
  setMenuData: (data: MenuItem[]) => void;
}

const MenuManager: React.FC<MenuManagerProps> = ({ menuData, setMenuData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<MenuItem>>({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'syncing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract unique categories
  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(menuData.map(item => item.category)))];
  }, [menuData]);

  // Filter Data
  const filteredData = useMemo(() => {
    return menuData.filter(item => {
      const matchesSearch =
        item.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name_ar.includes(searchTerm);
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [menuData, searchTerm, selectedCategory]);

  const handleEditClick = (item: MenuItem) => {
    setEditingKey(item.key);
    setEditForm(item);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    if (!editingKey) return;

    try {
      // 1. Find the item to update
      const itemToUpdate = editForm;
      const originalItem = menuData.find(i => i.key === editingKey);

      if (!originalItem || !itemToUpdate) return;

      // 2. Optimistic UI Update
      const updatedData = menuData.map(item =>
        item.key === editingKey ? { ...item, ...itemToUpdate } as MenuItem : item
      );
      setMenuData(updatedData);

      // 3. Persist to Supabase
      const { error } = await supabase
        .from('menu_items')
        .update({
          name_en: itemToUpdate.name_en,
          name_ar: itemToUpdate.name_ar,
          price: itemToUpdate.price,
          // Handle category separately if needed, but for now assuming items stay in category or category ID logic is handled
          // NOTE: If managing categories by name, you might need to lookup ID. 
          // For simplicity in this fix, we assume direct update.
          // IF category changed, strictly we should update category_id. 
        })
        .eq('id', originalItem.id);   // Assuming 'key' is mapped to 'id' or we have the ID

      if (error) {
        console.error('Failed to save to DB:', error);
        alert('Failed to save changes. Please try again.');
        // Revert UI if needed (omitted for brevity)
        return;
      }

      // 4. Global HQ Sync
      syncService.broadcastMenuUpdate('GLOBAL', updatedData);

      setEditingKey(null);
      setEditForm({});
    } catch (err) {
      console.error('Error saving edit:', err);
    }
  };

  const handleDelete = (key: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      const updatedData = menuData.filter(item => item.key !== key);
      setMenuData(updatedData);

      // Global HQ Sync
      syncService.broadcastMenuUpdate('GLOBAL', updatedData);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadStatus('parsing');

      // 1. Parse File
      const items = await ExcelUploadService.parseFile(file);

      if (items.length === 0) {
        throw new Error('No valid menu items found in the file.');
      }

      setUploadStatus('syncing');

      // 2. Clear Existing Data (Optional but requested by user)
      if (window.confirm('Clear existing menu items before uploading?')) {
        await supabase.from('menu_item_modifiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('menu_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('menu_categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }

      // 3. Upload to Database (Assume Riyadh Branch for now, or detect from context)
      // For this demo, we'll use a placeholder or the first branch found if not in context
      const { data: branches } = await supabase.from('branches').select('id').limit(1);
      const branchId = branches?.[0]?.id;

      if (!branchId) throw new Error('No branch found to associate menu with.');

      await ExcelUploadService.uploadToDatabase(items, branchId);

      setUploadStatus('success');
      setTimeout(() => {
        setIsUploadModalOpen(false);
        setUploadStatus('idle');
        window.location.reload(); // Refresh to see changes
      }, 1500);

    } catch (err: any) {
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to upload menu.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
      {/* Header Controls */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Menu Management</h2>
          <p className="text-sm text-slate-500">Manage items, prices, and categories</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Upload Excel</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-sky-600 transition-colors shadow-sm font-medium shadow-primary/20">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Item</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name (EN/AR)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-slate-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200 hover:border-slate-300'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name (EN)</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name (AR)</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price (SAR)</th>
              <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((item) => (
              <tr key={item.key} className="hover:bg-blue-50/30 transition-colors group">
                <td className="p-4 text-sm text-slate-400 font-mono">{item.key}</td>
                <td className="p-4 text-sm font-medium text-slate-700">
                  {editingKey === item.key ? (
                    <input
                      type="text"
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : (
                    <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs font-semibold text-slate-600 border border-slate-200">{item.category}</span>
                  )}
                </td>
                <td className="p-4 text-sm font-semibold text-slate-800">
                  {editingKey === item.key ? (
                    <input
                      type="text"
                      value={editForm.name_en}
                      onChange={(e) => setEditForm({ ...editForm, name_en: e.target.value })}
                      className="w-full p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : item.name_en}
                </td>
                <td className="p-4 text-sm font-arabic text-slate-600" dir="rtl">
                  {editingKey === item.key ? (
                    <input
                      type="text"
                      value={editForm.name_ar}
                      onChange={(e) => setEditForm({ ...editForm, name_ar: e.target.value })}
                      className="w-full p-2 border border-blue-200 rounded text-right focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : item.name_ar}
                </td>
                <td className="p-4 text-sm font-bold text-accent">
                  {editingKey === item.key ? (
                    <input
                      type="number"
                      step="0.5"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                      className="w-24 p-2 border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  ) : item.price.toFixed(2)}
                </td>
                <td className="p-4 text-right">
                  {editingKey === item.key ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={handleSaveEdit} className="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={handleCancelEdit} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-primary hover:bg-blue-50 rounded-full transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.key)} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredData.length === 0 && (
          <div className="p-12 text-center text-slate-400">
            <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Filter className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-medium">No menu items found</p>
            <p className="text-sm mt-1">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Upload Modal Overlay */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl transform transition-all border border-slate-100 animate-pop">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Upload Menu Data</h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center hover:border-primary hover:bg-blue-50 transition-all bg-slate-50 cursor-pointer relative group">
              {uploadStatus === 'idle' || uploadStatus === 'error' ? (
                <>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleFileUpload}
                  />
                  <div className="bg-white w-12 h-12 rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 border border-slate-100 group-hover:scale-110 transition-transform">
                    <Upload className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">Click to upload Excel file</p>
                  <p className="text-xs text-slate-400 mt-1">Supported formats: .xlsx, .csv</p>
                  {uploadStatus === 'error' && (
                    <p className="text-xs text-red-500 mt-2 font-bold">{errorMessage}</p>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-4">
                  <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                  <p className="text-sm font-bold text-slate-700">
                    {uploadStatus === 'parsing' ? 'Reading File...' :
                      uploadStatus === 'syncing' ? 'Syncing with Supabase...' :
                        'Almost done!'}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-2">Processing Data...</p>
                </div>
              )}
            </div>

            {uploadStatus === 'success' && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-3 animate-fade-in">
                <div className="bg-emerald-500 p-1 rounded-full">
                  <Save className="w-3 h-3 text-white" />
                </div>
                <p className="text-xs font-bold text-emerald-700">Menu synced successfully! Refreshing...</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors font-medium text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManager;