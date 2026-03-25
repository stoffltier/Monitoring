import { useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import { BottomNav, ViewState } from './components/BottomNav';
import { MapView } from './components/MapView';
import { ListView } from './components/ListView';
import { AddView } from './components/AddView';
import { ScanView } from './components/ScanView';
import { EditView } from './components/EditView';
import { TrackerItem } from './types';

export default function App() {
  const { items, isLoading, addItem, updateItem, getItem, deleteItem } = useTrackerData();
  const [currentView, setCurrentView] = useState<ViewState>('map');
  const [editingItem, setEditingItem] = useState<TrackerItem | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const handleAdd = (item: TrackerItem) => {
    addItem(item);
  };

  const handleScanSuccess = (decodedText: string) => {
    const item = getItem(decodedText);
    if (item) {
      setEditingItem(item);
      setCurrentView('edit');
      setScanError(null);
    } else {
      setScanError(`Kein Eintrag mit Barcode ${decodedText} gefunden.`);
      setTimeout(() => setScanError(null), 3000);
    }
  };

  const handleEditItem = (item: TrackerItem) => {
    setEditingItem(item);
    setCurrentView('edit');
  };

  const handleUpdateItem = (updatedItem: TrackerItem) => {
    updateItem(updatedItem);
    setEditingItem(updatedItem);
  };

  const handleDeleteItem = (id: string) => {
    deleteItem(id);
    setEditingItem(null);
    setCurrentView('list');
  };

  const handleCloseEdit = () => {
    setEditingItem(null);
    setCurrentView('list');
  };

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-gray-50">Laden...</div>;
  }

  return (
    <div className="h-screen w-full bg-gray-50 flex flex-col overflow-hidden font-sans">
      {scanError && (
        <div className="absolute top-4 left-4 right-4 z-[2000] bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg">
          <p className="font-bold text-sm">{scanError}</p>
        </div>
      )}

      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center z-50 print:hidden">
        <div className="font-bold text-gray-800 text-lg">BG-Monitoring</div>
        <div className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
          Live (Supabase)
        </div>
      </div>

      <main className="flex-1 overflow-hidden relative">
        {currentView === 'map' && <MapView items={items} onEditItem={handleEditItem} />}
        {currentView === 'list' && <ListView items={items} onEditItem={handleEditItem} />}
        {currentView === 'add' && <AddView onAdd={handleAdd} />}
        {currentView === 'scan' && <ScanView onScanSuccess={handleScanSuccess} />}
        
        {currentView === 'edit' && editingItem && (
          <div className="absolute inset-0 bg-gray-50 z-50">
            <EditView
              item={editingItem}
              onUpdate={handleUpdateItem}
              onDelete={handleDeleteItem}
              onClose={handleCloseEdit}
            />
          </div>
        )}
      </main>

      <BottomNav
        currentView={currentView === 'edit' ? 'list' : currentView}
        onChangeView={(view) => {
          if (view !== 'edit') {
            setEditingItem(null);
          }
          setCurrentView(view);
        }}
      />
    </div>
  );
}
