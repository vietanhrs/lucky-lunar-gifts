import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Wallet, Loader2, AlertCircle, Gift, RefreshCw, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { isConfigured, NETWORK } from "@/lib/cardano";
import { listOwnedGifts, refundGift, lovelaceToAda, type OwnedGift } from "@/lib/gift";

function formatDeadline(ms: number): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

const MyGifts = () => {
  const { wallet, refreshBalance } = useWallet();
  const configured = isConfigured();

  const [gifts, setGifts] = useState<OwnedGift[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [refundingTx, setRefundingTx] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!wallet || !configured) return;
    setLoading(true);
    try {
      setGifts(await listOwnedGifts(wallet));
    } catch (err) {
      console.error("Failed to load gifts:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load gifts.");
    } finally {
      setLoading(false);
    }
  }, [wallet, configured]);

  useEffect(() => {
    if (wallet) load();
    else setGifts(null);
  }, [wallet, load]);

  const handleRefund = async (gift: OwnedGift) => {
    if (!wallet || refundingTx) return;
    setRefundingTx(gift.lockTxHash);
    try {
      await refundGift(wallet, gift.lockTxHash, gift.deadlineMs);
      toast.success("Refund submitted. The ADA is returning to your wallet.");
      refreshBalance();
      await load();
    } catch (err) {
      console.error("Failed to refund gift:", err);
      toast.error(err instanceof Error ? err.message : "Failed to refund.");
    } finally {
      setRefundingTx(null);
    }
  };

  const now = Date.now();

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gradient-peach">🧧 My Gifts</h1>
          {wallet && configured && (
            <Button
              variant="outline"
              size="sm"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>

        {!configured && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Blockfrost isn't configured. Set <code>VITE_BLOCKFROST_PROJECT_ID</code>{" "}
              and <code>VITE_CARDANO_NETWORK</code> in your <code>.env</code> file.
            </span>
          </div>
        )}

        {/* Wallet */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 text-primary" />
              Wallet
              <span className="ml-auto text-xs font-normal text-muted-foreground capitalize">
                {NETWORK}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WalletConnect />
          </CardContent>
        </Card>

        {wallet && (
          <>
            {loading && gifts === null ? (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground py-12">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading your gifts...
              </div>
            ) : gifts && gifts.length > 0 ? (
              <div className="space-y-4">
                {gifts.map((gift) => {
                  const refundable = gift.deadlineMs > 0 && now >= gift.deadlineMs;
                  const isRefunding = refundingTx === gift.lockTxHash;
                  return (
                    <Card key={gift.lockTxHash}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-primary">
                              {lovelaceToAda(gift.totalLovelace).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 }
                              )}{" "}
                              ₳
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {gift.count} unclaimed envelope
                              {gift.count === 1 ? "" : "s"}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Refundable after {formatDeadline(gift.deadlineMs)}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono truncate mt-1">
                              {gift.lockTxHash}
                            </div>
                          </div>
                          <Badge variant={refundable ? "default" : "secondary"}>
                            {refundable ? "Refundable" : "Active"}
                          </Badge>
                        </div>

                        <Button
                          variant="outline"
                          className="w-full mt-4"
                          disabled={!refundable || isRefunding}
                          onClick={() => handleRefund(gift)}
                        >
                          {isRefunding ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Refunding...
                            </>
                          ) : (
                            <>
                              <Undo2 className="mr-2 h-4 w-4" />
                              {refundable
                                ? "Refund unclaimed envelopes"
                                : "Refund available after deadline"}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center text-center gap-2 text-muted-foreground py-12">
                <Gift className="h-8 w-8" />
                <p className="text-sm">
                  No gifts found for this wallet on {NETWORK}.
                </p>
              </div>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default MyGifts;
