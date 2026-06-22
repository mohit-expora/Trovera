import { create } from "zustand";
import type { Book } from "@/types/book";

interface BookStoreState {
  optimisticBooks: Map<string, Partial<Book>>;
  pendingDeletes: Set<string>;
  optimisticUpdate: (id: string, partial: Partial<Book>) => void;
  optimisticDelete: (id: string) => void;
  revertOptimistic: (id: string) => void;
  clearOptimistic: () => void;
}

export const useBookStore = create<BookStoreState>()((set) => ({
  optimisticBooks: new Map(),
  pendingDeletes: new Set(),

  optimisticUpdate: (id, partial) =>
    set((state) => {
      const map = new Map(state.optimisticBooks);
      map.set(id, { ...(map.get(id) ?? {}), ...partial });
      return { optimisticBooks: map };
    }),

  optimisticDelete: (id) =>
    set((state) => {
      const deletes = new Set(state.pendingDeletes);
      deletes.add(id);
      return { pendingDeletes: deletes };
    }),

  revertOptimistic: (id) =>
    set((state) => {
      const map = new Map(state.optimisticBooks);
      map.delete(id);
      const deletes = new Set(state.pendingDeletes);
      deletes.delete(id);
      return { optimisticBooks: map, pendingDeletes: deletes };
    }),

  clearOptimistic: () =>
    set({ optimisticBooks: new Map(), pendingDeletes: new Set() }),
}));
