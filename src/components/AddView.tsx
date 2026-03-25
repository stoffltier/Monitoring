import { useState } from 'react';
import Barcode from 'react-barcode';
import { format } from 'date-fns';
import { TrackerItem, ItemType } from '../types';

interface AddViewProps {
  onAdd: (item: TrackerItem) => void;
}

export function AddView({ onAdd }: AddViewProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ItemType>('trap');
  const [deploymentDate, setDeploymentDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [generatedItem, setGeneratedItem] = useState<TrackerItem | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Generate a random 5-digit barcode number
    const barcodeId = Math.floor(10000 + Math.random() * 90000).toString();

    const newItem: TrackerItem = {
      id: barcodeId,
      type,
      name: name.trim(),
      deploymentDate,
      status: 'n/a',
      remarks: [],
    };

    setGeneratedItem(newItem);
    onAdd(newItem);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setName('');
    setType('trap');
    setDeploymentDate(format(new Date(), 'yyyy-MM-dd'));
    setGeneratedItem(null);
  };

  if (generatedItem) {
    return (
      <div className="p-4 flex flex-col items-center space-y-6">
        <div className="bg-green-50 text-green-800 p-4 rounded-lg w-full text-center font-medium">
          Erfolgreich angelegt!
        </div>

        {/* This section will be printed */}
        <div id="print-section" className="bg-white p-8 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center space-y-4 w-full max-w-sm">
          <h2 className="text-2xl font-bold">{generatedItem.name}</h2>
          <p className="text-gray-500">{generatedItem.type === 'trap' ? 'Falle' : 'Zubehör'}</p>
          <p className="text-sm font-mono text-gray-400">Datum: {generatedItem.deploymentDate}</p>
          
          <div className="mt-4">
            <Barcode value={generatedItem.id} format="CODE128" width={2} height={80} displayValue={true} />
          </div>
        </div>

        <div className="flex w-full space-x-4 pt-4">
          <button
            onClick={handlePrint}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Label Drucken
          </button>
          <button
            onClick={handleReset}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Weiteres anlegen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Neues Element anlegen</h1>
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Typ</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="trap"
                checked={type === 'trap'}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Falle</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="accessory"
                checked={type === 'accessory'}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-4 h-4 text-blue-600"
              />
              <span>Zubehör</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name / Bezeichnung</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="z.B. Falle Nordwald 1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Datum der Entsendung</label>
          <input
            type="date"
            required
            value={deploymentDate}
            onChange={(e) => setDeploymentDate(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 transition mt-8"
        >
          Barcode generieren
        </button>
      </form>
    </div>
  );
}
