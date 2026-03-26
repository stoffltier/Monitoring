import { useState } from 'react';
import { useTrackerData } from './hooks/useTrackerData';
import { BottomNav, ViewState } from './components/BottomNav';
import { MapView } from './components/MapView';
import { ListView } from './components/ListView';
import { AddView } from './components/AddView';
import { ScanView } from './components/ScanView';
import { EditView } from './components/EditView';
import { TrackerItem } from './types';
import { hasSupabaseConfig } from './supabase';
import { AlertTriangle } from 'lucide-react';

export default function App() {
  if (!hasSupabaseConfig) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
        <div className="bg-white border border-red-200 shadow-lg p-6 rounded-xl max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Fehlende Konfiguration</h1>
          <p className="text-gray-600 mb-6 text-sm">
            Die App kann nicht gestartet werden, da die Verbindung zur Datenbank (Supabase) fehlt. 
            Bitte hinterlege die folgenden Umgebungsvariablen (Environment Variables) in deinem Hosting-Dashboard (z.B. Vercel):
          </p>
          <div className="text-left font-mono text-xs bg-gray-100 p-4 rounded-lg border border-gray-200 mb-6 space-y-2 overflow-x-auto">
            <div className="font-bold text-gray-800">VITE_SUPABASE_URL</div>
            <div className="font-bold text-gray-800">VITE_SUPABASE_ANON_KEY</div>
          </div>
          <p className="text-sm text-gray-500">
            Nachdem du die Variablen hinzugefügt hast, musst du die Seite neu laden (oder bei Vercel ein neues Deployment anstoßen).
          </p>
        </div>
      </div>
    );
  }

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
