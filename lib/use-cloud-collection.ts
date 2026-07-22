"use client";
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";

type CloudItem = { id: string };
type CloudRow<T> = { id: string; data: T };

export function useCloudCollection<T extends CloudItem>(collection: string) {
  const [items, setItemsState] = useState<T[]>([]);
  const itemsRef = useRef<T[]>([]);
  useEffect(() => { itemsRef.current = items; }, [items]);
  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | undefined;
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data, error } = await supabase.from("app_items").select("id,data").eq("collection", collection);
      if (!active) return;
      if (error) console.error(`Could not load ${collection}:`, error.message);
      else setItemsState(((data || []) as CloudRow<T>[]).map(row => ({ ...row.data, id: row.id })));
      channel = supabase.channel(`app-items-${collection}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "app_items", filter: `collection=eq.${collection}` }, payload => {
          if (payload.eventType === "DELETE") {
            const id = String((payload.old as { id: string }).id);
            setItemsState(current => current.filter(item => item.id !== id));
          } else {
            const row = payload.new as CloudRow<T>;
            const next = { ...row.data, id: row.id } as T;
            setItemsState(current => current.some(item => item.id === next.id) ? current.map(item => item.id === next.id ? next : item) : [next, ...current]);
          }
        }).subscribe();
    })();
    return () => { active = false; if (channel) void supabase.removeChannel(channel); };
  }, [collection]);

  const setItems: Dispatch<SetStateAction<T[]>> = useCallback(update => {
    const previous = itemsRef.current;
    const next = typeof update === "function" ? update(previous) : update;
    itemsRef.current = next; setItemsState(next);
    const nextIds = new Set(next.map(item => item.id));
    const removed = previous.filter(item => !nextIds.has(item.id)).map(item => item.id);
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      if (removed.length) {
        const { error } = await supabase.from("app_items").delete().eq("collection", collection).in("id", removed);
        if (error) console.error(`Could not delete ${collection}:`, error.message);
      }
      if (next.length) {
        const rows = next.map(item => ({ id: item.id, user_id: auth.user.id, collection, data: item }));
        const { error } = await supabase.from("app_items").upsert(rows, { onConflict: "user_id,collection,id" });
        if (error) console.error(`Could not save ${collection}:`, error.message);
      }
    })();
  }, [collection]);
  return { items, setItems };
}
