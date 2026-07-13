import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "@/lib/api";
import { useCartStore } from "@/store/cartStore";
import { queryClient } from "@/providers/ReactQueryProvider";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthStore {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void | Promise<void>;
  // kept for backward compat — persist middleware handles rehydration now
  loadUser: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      login: (user, token) => {
        set({ user, token });
        
        // Trigger cart merging
        const localItems = useCartStore.getState().items;
        if (localItems.length > 0) {
          api.post("/cart/merge", {
            items: localItems.map((item) => ({
              productId: item.product._id,
              quantity: item.quantity,
            })),
          })
            .then((res) => {
              const formattedItems = res.data.items.map((item: any) => ({
                product: item.product,
                quantity: item.quantity,
              }));
              useCartStore.setState({ items: formattedItems });
              queryClient.invalidateQueries({ queryKey: ["cart"] });
            })
            .catch((err) => {
              console.error("Cart merge failed:", err);
            });
        } else {
          queryClient.invalidateQueries({ queryKey: ["cart"] });
        }
      },

      logout: async () => {
        try {
          await api.post("/auth/logout");
        } catch (err) {
          console.error("Backend logout failed:", err);
        }
        set({ user: null, token: null });
        useCartStore.getState().clearCart();
        queryClient.clear();
      },

      // No-op: persist middleware auto-rehydrates from localStorage on mount
      loadUser: () => {},
    }),
    {
      name: "auth-storage", // ← matches what api.ts reads
    }
  )
);
