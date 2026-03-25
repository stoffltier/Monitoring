export type ItemType = 'trap' | 'accessory';

export interface LocationData {
  lat: number;
  lng: number;
  timestamp: number;
}

export interface Remark {
  id: string;
  text: string;
  timestamp: number;
  ownerId?: string;
}

export type ItemStatus = 'i.O.' | 'n.i.O.' | 'n/a';

export interface TrackerItem {
  id: string; // The barcode number
  type: ItemType;
  name: string;
  deploymentDate: string; // ISO string
  status: ItemStatus;
  location?: LocationData;
  locationHistory?: LocationData[];
  remarks: Remark[];
  ownerId?: string;
}
