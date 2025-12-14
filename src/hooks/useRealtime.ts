'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const channelName = `${table}_changes${filter ? `_${filter}` : ''}`;
    const newChannel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: filter,
        },
        (payload) => {
          if (callback) {
            callback(payload);
          }
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [table, filter, callback]);

  return { data, channel };
}

export function useRealtimeTickets(callback?: (payload: any) => void) {
  return useRealtimeSubscription('tickets', undefined, callback);
}

export function useRealtimeAIResponses(callback?: (payload: any) => void) {
  return useRealtimeSubscription('ai_responses', undefined, callback);
}

export function useRealtimeConversations(
  ticketId?: string,
  callback?: (payload: any) => void
) {
  const filter = ticketId ? `ticket_id=eq.${ticketId}` : undefined;
  return useRealtimeSubscription('conversations', filter, callback);
}

