import { useState } from 'react';
import { format } from 'date-fns';
import { MapPin, Plus, Save, AlertCircle, Printer, Trash2 } from 'lucide-react';
import Barcode from 'react-barcode';
import { v4 as uuidv4 } from 'uuid';
import { TrackerItem, Remark, ItemStatus } from '../types';

interface EditViewProps {
  item: TrackerItem;
  onUpdate: (item: TrackerItem) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export function EditView({ item, onUpdate, onDelete, onClose }: EditViewProps) {
  const [newRemark, setNewRemark] = useState('');
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const updatedItem: TrackerItem = {
      ...item,
      status: e.target.value as ItemStatus,
    };
    onUpdate(updatedItem);
  };

  const handleUpdateLocation = () => {
    setIsUpdatingLocation(true);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError('Geolokalisierung wird von diesem Browser nicht unterstützt.');
      setIsUpdatingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
        };
        
        const updatedHistory = [newLocation, ...(item.locationHistory || [])];

        const updatedItem: TrackerItem = {
          ...item,
          location: newLocation,
          locationHistory: updatedHistory,
        };
        onUpdate(updatedItem);
        setIsUpdatingLocation(false);
      },
      (error) => {
        console.error('Error getting location', error);
        setLocationError('Standort konnte nicht ermittelt werden. Bitte Berechtigungen prüfen.');
        setIsUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddRemark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemark.trim()) return;

    const remark: Remark = {
      id: uuidv4(),
      text: newRemark.trim(),
      timestamp: Date.now(),
    };

    const updatedItem: TrackerItem = {
      ...item,
      remarks: [remark, ...item.remarks],
    };

    onUpdate(updatedItem);
    setNewRemark('');
  };

  return (
    <div className="p-4 flex flex-col h-full overflow-y-auto pb-24">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold truncate pr-2">{item.name}</h1>
        <div className="flex space-x-2">
          <button onClick={() => window.print()} className="text-gray-500 hover:text-gray-800 font-medium p-2 bg-gray-100 rounded-lg" title="Label drucken">
            <Printer className="w-5 h-5" />
          </button>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 font-medium px-3 py-1 bg-gray-100 rounded-lg">
            Schließen
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 block">Typ</span>
            <span className="font-semibold">{item.type === 'trap' ? 'Falle' : 'Zubehör'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Barcode ID</span>
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{item.id}</span>
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 block">Entsendungsdatum</span>
            <span className="font-semibold">{format(new Date(item.deploymentDate), 'dd.MM.yyyy')}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-gray-100">
            <span className="text-gray-500 block mb-1">Status</span>
            <select
              value={item.status || 'n/a'}
              onChange={handleStatusChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 font-medium"
            >
              <option value="i.O.">i.O. (In Ordnung)</option>
              <option value="n.i.O.">n.i.O. (Nicht in Ordnung)</option>
              <option value="n/a">n/a (Unbekannt)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold mb-3 flex items-center">
          <MapPin className="w-5 h-5 mr-2 text-blue-600" />
          Standort
        </h2>
        
        {item.location ? (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-3">
            <p className="text-sm text-blue-800 mb-1">
              Zuletzt aktualisiert: {format(new Date(item.location.timestamp), 'dd.MM.yyyy HH:mm')}
            </p>
            <p className="text-xs font-mono text-blue-600 truncate">
              {item.location.lat.toFixed(6)}, {item.location.lng.toFixed(6)}
            </p>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 mb-3 flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">Noch kein Standort erfasst.</p>
          </div>
        )}

        {locationError && (
          <p className="text-red-600 text-sm mb-3">{locationError}</p>
        )}

        <button
          onClick={handleUpdateLocation}
          disabled={isUpdatingLocation}
          className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-70 mb-4"
        >
          {isUpdatingLocation ? 'Ermittle Standort...' : 'Standort jetzt aktualisieren'}
        </button>

        {item.locationHistory && item.locationHistory.length > 1 && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Standort-Historie</h3>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {item.locationHistory.slice(1).map((loc, idx) => (
                <div key={idx} className="text-xs bg-gray-50 p-2 rounded-lg border border-gray-100 flex justify-between items-center">
                  <span className="font-mono text-gray-600">
                    {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
                  </span>
                  <span className="text-gray-500">
                    {format(new Date(loc.timestamp), 'dd.MM.yyyy HH:mm')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold mb-3">Bemerkungen</h2>
        
        <form onSubmit={handleAddRemark} className="mb-6">
          <textarea
            value={newRemark}
            onChange={(e) => setNewRemark(e.target.value)}
            placeholder="Neue Bemerkung hinzufügen..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[100px] mb-2"
          />
          <button
            type="submit"
            disabled={!newRemark.trim()}
            className="w-full flex items-center justify-center bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-50"
          >
            <Plus className="w-5 h-5 mr-2" />
            Speichern
          </button>
        </form>

        <div className="space-y-3">
          {item.remarks.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">Keine Bemerkungen vorhanden.</p>
          ) : (
            item.remarks.map((remark) => (
              <div key={remark.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-gray-800 text-sm mb-2">{remark.text}</p>
                <p className="text-xs text-gray-500 text-right">
                  {format(new Date(remark.timestamp), 'dd.MM.yyyy HH:mm')}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        {isConfirmingDelete ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 font-medium mb-3 text-sm text-center">
              Möchtest du diesen Eintrag wirklich unwiderruflich löschen?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Abbrechen
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Ja, löschen
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsConfirmingDelete(true)}
            className="w-full flex items-center justify-center text-red-600 py-3 rounded-lg font-semibold hover:bg-red-50 transition border border-transparent hover:border-red-100"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Eintrag löschen
          </button>
        )}
      </div>

      {/* Hidden print section */}
      <div id="print-section" className="absolute -left-[9999px] bg-white p-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center space-y-4 w-full max-w-sm">
        <h2 className="text-2xl font-bold">{item.name}</h2>
        <p className="text-gray-500">{item.type === 'trap' ? 'Falle' : 'Zubehör'}</p>
        <p className="text-sm font-mono text-gray-400">Datum: {item.deploymentDate}</p>
        
        <div className="mt-4">
          <Barcode value={item.id} format="CODE128" width={2} height={80} displayValue={true} />
        </div>
      </div>
    </div>
  );
}
