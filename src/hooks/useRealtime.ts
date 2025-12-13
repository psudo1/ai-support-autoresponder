'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useRealtimeSubscription<T>(
  table: string,
  filter?: string,
  callback?: (payload: any) => void
) {
  const [data, setData] = useState<T[]>([]);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

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
          // Use ref to avoid dependency issues
          if (callbackRef.current) {
            callbackRef.current(payload);
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
  }, [table, filter]); // Removed callback from dependencies

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

