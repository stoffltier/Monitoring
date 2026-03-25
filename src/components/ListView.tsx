import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { MapPin, Box, AlertCircle, Download, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { TrackerItem, ItemStatus } from '../types';

interface ListViewProps {
  items: TrackerItem[];
  onEditItem: (item: TrackerItem) => void;
}

type SortOption = 'name' | 'deploymentDate' | 'lastEdit';

const getStatusColor = (status: ItemStatus) => {
  switch (status) {
    case 'i.O.': return 'bg-green-100 text-green-800 border-green-200';
    case 'n.i.O.': return 'bg-red-100 text-red-800 border-red-200';
    case 'n/a': default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

function TrackerListItem({ item, onEdit }: { item: TrackerItem; onEdit: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const lastLocDate = item.location ? format(new Date(item.location.timestamp), 'dd.MM.yyyy') : null;
  const lastRemarkDate = item.remarks.length > 0 ? format(new Date(item.remarks[0].timestamp), 'dd.MM.yyyy') : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition overflow-hidden">
      {/* Header - Always visible, toggles expansion */}
      <div 
        className="p-4 cursor-pointer flex justify-between items-center"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{item.name}</h3>
          <span className="text-xs text-gray-500">{item.type === 'trap' ? 'Falle' : 'Zubehör'}</span>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-end space-y-1">
            <span className="bg-gray-100 text-gray-600 text-xs font-mono px-2 py-1 rounded">
              {item.id}
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded border ${getStatusColor(item.status)}`}>
              {item.status}
            </span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Collapsible Body */}
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3 bg-white border border-gray-100 p-3 rounded-lg">
            <div>
              <span className="block text-gray-400">Entsendet</span>
              <span className="font-medium">{format(new Date(item.deploymentDate), 'dd.MM.yyyy')}</span>
            </div>
            <div>
              <span className="block text-gray-400">Letzte Bemerkung</span>
              <span className="font-medium">{lastRemarkDate || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="block text-gray-400">Letzter Standort</span>
              <span className="font-medium">{lastLocDate || '-'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 mb-4">
            <div className="flex items-center text-sm">
              {item.location ? (
                <>
                  <MapPin className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-700 text-xs font-medium">Standort erfasst</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-700 text-xs font-medium">Kein Standort</span>
                </>
              )}
            </div>
            
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
              {item.remarks.length} Bemerkung(en)
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="w-full flex items-center justify-center bg-blue-100 text-blue-700 py-2.5 rounded-lg font-semibold hover:bg-blue-200 transition"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Bearbeiten
          </button>
        </div>
      )}
    </div>
  );
}

export function ListView({ items, onEditItem }: ListViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('lastEdit');

  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearch) ||
          item.id.toLowerCase().includes(lowerSearch)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      result = result.filter((item) => item.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'deploymentDate') {
        return new Date(b.deploymentDate).getTime() - new Date(a.deploymentDate).getTime();
      } else if (sortBy === 'lastEdit') {
        const getLastEdit = (item: TrackerItem) => {
          const locTime = item.location?.timestamp || 0;
          const remarkTime = item.remarks.length > 0 ? item.remarks[0].timestamp : 0;
          return Math.max(locTime, remarkTime, new Date(item.deploymentDate).getTime());
        };
        return getLastEdit(b) - getLastEdit(a);
      }
      return 0;
    });

    return result;
  }, [items, searchTerm, statusFilter, sortBy]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Typ', 'Name', 'Status', 'Entsendungsdatum', 'Letzter Standort', 'Letzte Bemerkung', 'Anzahl Bemerkungen', 'Breitengrad', 'Längengrad'];
    
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedItems.map(item => {
        const lastLocDate = item.location ? format(new Date(item.location.timestamp), 'dd.MM.yyyy HH:mm') : '';
        const lastRemarkDate = item.remarks.length > 0 ? format(new Date(item.remarks[0].timestamp), 'dd.MM.yyyy HH:mm') : '';
        
        return [
          item.id,
          item.type === 'trap' ? 'Falle' : 'Zubehör',
          `"${item.name.replace(/"/g, '""')}"`,
          item.status,
          item.deploymentDate,
          lastLocDate,
          lastRemarkDate,
          item.remarks.length,
          item.location?.lat || '',
          item.location?.lng || ''
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bg-monitoring-export-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Alle Einträge</h1>
        <button 
          onClick={handleExportCSV}
          className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
        >
          <Download className="w-4 h-4 mr-2" />
          CSV Export
        </button>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Suchen (Name oder ID)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ItemStatus | 'all')}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">Alle Status</option>
              <option value="i.O.">i.O.</option>
              <option value="n.i.O.">n.i.O.</option>
              <option value="n/a">n/a</option>
            </select>
          </div>
          
          <div className="flex-1 relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm appearance-none focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="lastEdit">Letzte Änderung</option>
              <option value="deploymentDate">Entsendungsdatum</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {filteredAndSortedItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <Box className="w-16 h-16 mb-4 text-gray-300" />
          <p className="text-lg font-medium">Keine Einträge gefunden</p>
          <p className="text-sm">Passe deine Filter an oder lege etwas Neues an.</p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto flex-1 pb-4">
          {filteredAndSortedItems.map((item) => (
            <TrackerListItem 
              key={item.id} 
              item={item} 
              onEdit={() => onEditItem(item)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
