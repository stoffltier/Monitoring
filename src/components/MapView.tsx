import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { format } from 'date-fns';
import { Navigation } from 'lucide-react';
import { TrackerItem, ItemStatus } from '../types';

const createCustomIcon = (status: ItemStatus) => {
  let color = '#3b82f6'; // blue (n/a)
  if (status === 'i.O.') color = '#22c55e'; // green
  if (status === 'n.i.O.') color = '#ef4444'; // red

  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3" fill="white"></circle>
    </svg>
  `;

  return new L.DivIcon({
    html: svgIcon,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface MapViewProps {
  items: TrackerItem[];
  onEditItem: (item: TrackerItem) => void;
}

// Component to auto-fit map bounds to markers
function MapBounds({ items }: { items: TrackerItem[] }) {
  const map = useMap();

  useEffect(() => {
    const itemsWithLocation = items.filter((item) => item.location);
    if (itemsWithLocation.length > 0) {
      const bounds = L.latLngBounds(
        itemsWithLocation.map((item) => [item.location!.lat, item.location!.lng])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [items, map]);

  return null;
}

function LocateControl() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    setIsLocating(true);
    map.locate().on('locationfound', function (e) {
      setIsLocating(false);
      map.flyTo(e.latlng, map.getZoom());
      
      // Add a small blue dot for user location
      L.circleMarker(e.latlng, {
        radius: 8,
        fillColor: '#3b82f6',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 1
      }).addTo(map);
    }).on('locationerror', function (e) {
      setIsLocating(false);
      alert('Standort konnte nicht ermittelt werden.');
    });
  };

  return (
    <button
      onClick={handleLocate}
      disabled={isLocating}
      className="absolute bottom-6 right-4 z-[1000] bg-white p-3 rounded-full shadow-lg border border-gray-200 text-blue-600 hover:bg-blue-50 transition disabled:opacity-50"
      title="Mein Standort"
    >
      <Navigation className="w-6 h-6" />
    </button>
  );
}

export function MapView({ items, onEditItem }: MapViewProps) {
  const itemsWithLocation = items.filter((item) => item.location);
  
  // Default center (Germany roughly)
  const defaultCenter: [number, number] = [51.1657, 10.4515];

  return (
    <div className="h-full w-full flex flex-col relative">
      <div className="absolute top-4 left-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-md border border-gray-200">
        <h1 className="text-lg font-bold text-gray-800">Standorte</h1>
        <p className="text-sm text-gray-500">
          {itemsWithLocation.length} von {items.length} Elementen auf der Karte
        </p>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={6}
        className="flex-1 w-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <LocateControl />

        {itemsWithLocation.length > 0 && <MapBounds items={itemsWithLocation} />}

        {itemsWithLocation.map((item) => (
          <Marker
            key={item.id}
            position={[item.location!.lat, item.location!.lng]}
            icon={createCustomIcon(item.status)}
          >
            <Popup className="rounded-xl">
              <div className="p-1 min-w-[150px]">
                <h3 className="font-bold text-base mb-1">{item.name}</h3>
                <p className="text-xs text-gray-500 mb-2">
                  {item.type === 'trap' ? 'Falle' : 'Zubehör'} • {item.id}
                </p>
                <p className="text-xs text-gray-600 mb-3">
                  Aktualisiert: {format(new Date(item.location!.timestamp), 'dd.MM.yyyy HH:mm')}
                </p>
                <button
                  onClick={() => onEditItem(item)}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Bearbeiten
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
