import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Wallet, LogOut, Loader2 } from "lucide-react";

export function WalletConnect() {
  const { wallet, address, isConnecting, installedWallets, connect, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  const shortAddress = address
    ? `${address.slice(0, 8)}...${address.slice(-6)}`
    : "";

  if (wallet && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="font-mono text-sm">
            <Wallet className="mr-2 h-4 w-4" />
            {shortAddress}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={disconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      <Button onClick={() => setModalOpen(true)} disabled={isConnecting}>
        {isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wallet className="mr-2 h-4 w-4" />
        )}
        Connect Wallet
      </Button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect a Cardano Wallet</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
            {installedWallets.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No Cardano wallets detected. Please install a CIP-30 compatible wallet extension.
              </p>
            ) : (
              installedWallets.map((w) => (
                <button
                  key={w.name}
                  onClick={async () => {
                    await connect(w.name);
                    setModalOpen(false);
                  }}
                  className="flex items-center gap-4 rounded-lg border border-border p-4 hover:bg-secondary transition-colors"
                >
                  <img
                    src={w.icon}
                    alt={w.name}
                    className="h-10 w-10 rounded-lg"
                  />
                  <span className="font-medium capitalize">{w.name}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
