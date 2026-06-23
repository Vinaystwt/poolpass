"use client";

import { create } from "zustand";
import {
  isConnected,
  isAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { NETWORK } from "../backend-config";

interface WalletState {
  address: string | null;
  networkPassphrase: string | null;
  available: boolean | null; // is Freighter installed
  connecting: boolean;
  wrongNetwork: boolean;
  init: () => Promise<void>;
  connect: () => Promise<string | null>;
  disconnect: () => void;
  signXdr: (xdr: string) => Promise<string>;
}

function unwrap<T extends Record<string, unknown>>(res: T, key: keyof T): T[keyof T] {
  if (res && typeof res === "object" && "error" in res && res.error) {
    throw new Error(String(res.error));
  }
  return res[key];
}

export const useWallet = create<WalletState>((set, get) => ({
  address: null,
  networkPassphrase: null,
  available: null,
  connecting: false,
  wrongNetwork: false,

  async init() {
    try {
      const conn = await isConnected();
      const available = Boolean((conn as { isConnected?: boolean }).isConnected);
      set({ available });
      if (!available) return;
      const allowed = await isAllowed();
      if ((allowed as { isAllowed?: boolean }).isAllowed) {
        const addr = unwrap(await getAddress(), "address") as string;
        const net = await getNetwork();
        const passphrase = (net as { networkPassphrase?: string }).networkPassphrase ?? null;
        set({
          address: addr || null,
          networkPassphrase: passphrase,
          wrongNetwork: Boolean(passphrase && passphrase !== NETWORK.passphrase),
        });
      }
    } catch {
      set({ available: false });
    }
  },

  async connect() {
    set({ connecting: true });
    try {
      const conn = await isConnected();
      if (!(conn as { isConnected?: boolean }).isConnected) {
        set({ available: false, connecting: false });
        throw new Error("Freighter not found");
      }
      const addr = unwrap(await requestAccess(), "address") as string;
      const net = await getNetwork();
      const passphrase = (net as { networkPassphrase?: string }).networkPassphrase ?? null;
      set({
        address: addr || null,
        networkPassphrase: passphrase,
        wrongNetwork: Boolean(passphrase && passphrase !== NETWORK.passphrase),
        connecting: false,
        available: true,
      });
      return addr || null;
    } catch (e) {
      set({ connecting: false });
      throw e;
    }
  },

  disconnect() {
    // Freighter has no programmatic disconnect; clear local session only.
    set({ address: null, networkPassphrase: null, wrongNetwork: false });
  },

  async signXdr(xdr: string) {
    const address = get().address;
    if (!address) throw new Error("Connect a wallet first");
    const res = await signTransaction(xdr, {
      networkPassphrase: NETWORK.passphrase,
      address,
    });
    return unwrap(res as Record<string, unknown>, "signedTxXdr") as string;
  },
}));
