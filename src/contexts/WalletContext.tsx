import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { BrowserWallet } from "@meshsdk/core";

interface InstalledWallet {
  name: string;
  icon: string;
  version: string;
}

interface WalletContextType {
  wallet: BrowserWallet | null;
  address: string;
  lovelace: string;
  installedWallets: InstalledWallet[];
  isConnecting: boolean;
  connect: (walletName: string) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<BrowserWallet | null>(null);
  const [address, setAddress] = useState("");
  const [lovelace, setLovelace] = useState("0");
  const [isConnecting, setIsConnecting] = useState(false);

  const installedWallets = BrowserWallet.getInstalledWallets();

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    try {
      const l = await wallet.getLovelace();
      setLovelace(l);
    } catch (e) {
      console.error("Failed to get balance:", e);
    }
  }, [wallet]);

  const connect = useCallback(async (walletName: string) => {
    setIsConnecting(true);
    try {
      const w = await BrowserWallet.enable(walletName);
      setWallet(w);
      const addr = await w.getChangeAddress();
      setAddress(addr);
      const l = await w.getLovelace();
      setLovelace(l);
    } catch (e) {
      console.error("Failed to connect wallet:", e);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setAddress("");
    setLovelace("0");
  }, []);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        address,
        lovelace,
        installedWallets,
        isConnecting,
        connect,
        disconnect,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}
