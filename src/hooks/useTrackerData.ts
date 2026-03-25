import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TrackerItem, Remark } from '../types';

export function useTrackerData() {
  const [items, setItems] = useState<TrackerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, remarks(*)');

      if (error) throw error;

      if (data) {
        const formattedItems: TrackerItem[] = data.map((row: any) => ({
          id: row.id,
          type: row.type,
          name: row.name,
          deploymentDate: row.deployment_date,
          status: row.status || 'n/a',
          location: row.lat && row.lng ? {
            lat: row.lat,
            lng: row.lng,
            timestamp: row.timestamp
          } : undefined,
          locationHistory: row.location_history || [],
          remarks: (row.remarks || [])
            .map((r: any) => ({
              id: r.id,
              text: r.text,
              timestamp: r.timestamp,
              ownerId: r.owner_id
            }))
            .sort((a: Remark, b: Remark) => b.timestamp - a.timestamp),
          ownerId: row.owner_id
        }));
        setItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();

    // Subscribe to real-time changes
    const channel = supabase.channel('public-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, () => {
        fetchItems();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'remarks' }, () => {
        fetchItems();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addItem = async (item: TrackerItem) => {
    const previousItems = [...items];
    setItems(prev => [...prev, item]);

    try {
      const { remarks, location, locationHistory, ...rest } = item;
      
      const { error: itemError } = await supabase.from('items').insert({
        id: rest.id,
        type: rest.type,
        name: rest.name,
        deployment_date: rest.deploymentDate,
        status: rest.status,
        lat: location?.lat,
        lng: location?.lng,
        timestamp: location?.timestamp,
        location_history: locationHistory || [],
        owner_id: rest.ownerId
      });

      if (itemError) throw itemError;

      if (remarks && remarks.length > 0) {
        const { error: remarksError } = await supabase.from('remarks').insert(
          remarks.map(r => ({
            id: r.id,
            item_id: item.id,
            text: r.text,
            timestamp: r.timestamp,
            owner_id: r.ownerId
          }))
        );
        if (remarksError) throw remarksError;
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setItems(previousItems);
    }
  };

  const updateItem = async (updatedItem: TrackerItem) => {
    const previousItems = [...items];
    setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));

    try {
      const { remarks, location, locationHistory, ...rest } = updatedItem;
      
      const { error: itemError } = await supabase.from('items').update({
        type: rest.type,
        name: rest.name,
        deployment_date: rest.deploymentDate,
        status: rest.status,
        lat: location?.lat,
        lng: location?.lng,
        timestamp: location?.timestamp,
        location_history: locationHistory || [],
        owner_id: rest.ownerId
      }).eq('id', updatedItem.id);

      if (itemError) throw itemError;

      if (remarks && remarks.length > 0) {
        const { error: remarksError } = await supabase.from('remarks').upsert(
          remarks.map(r => ({
            id: r.id,
            item_id: updatedItem.id,
            text: r.text,
            timestamp: r.timestamp,
            owner_id: r.ownerId
          }))
        );
        if (remarksError) throw remarksError;
      }
    } catch (error) {
      console.error('Error updating item:', error);
      setItems(previousItems);
    }
  };

  const getItem = (id: string) => {
    return items.find((item) => item.id === id);
  };

  const deleteItem = async (id: string) => {
    const previousItems = [...items];
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    } catch (error) {
      console.error('Error deleting item:', error);
      setItems(previousItems);
    }
  };

  return {
    items,
    isLoading,
    addItem,
    updateItem,
    getItem,
    deleteItem,
  };
}
