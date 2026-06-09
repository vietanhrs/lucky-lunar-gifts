import { useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Send, Gift, Loader2, Check, AlertCircle, Wallet, Users } from "lucide-react";
import { toast } from "sonner";
import { isConfigured, NETWORK } from "@/lib/cardano";
import { decodeGiftCode } from "@/lib/giftCode";
import { claimGift, getGiftEnvelopes, lovelaceToAda } from "@/lib/gift";
import {
  fetchGift,
  isBackendEnabled,
  recordClaim,
  type ApiClaim,
  type ApiGift,
} from "@/lib/api";

const ClaimGift = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";
  const { wallet, refreshBalance } = useWallet();
  const configured = isConfigured();

  const [answer, setAnswer] = useState("");
  const [claimerName, setClaimerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [claimedTx, setClaimedTx] = useState<string | null>(null);
  const [envelopes, setEnvelopes] = useState<{
    count: number;
    totalAda: number;
    totalLovelace: string;
  } | null>(null);
  const [loadingEnvelopes, setLoadingEnvelopes] = useState(false);
  const [meta, setMeta] = useState<ApiGift | null>(null);
  const [claims, setClaims] = useState<ApiClaim[]>([]);

  const lockTxHash = useMemo(() => {
    try {
      return decodeGiftCode(code).t;
    } catch {
      return "";
    }
  }, [code]);

  // Prefer the backend's hint (also stored on-chain-adjacent); fall back to the
  // scrambled characters carried inside the gift code.
  const hint = useMemo(() => {
    if (meta?.hint?.length) return meta.hint;
    try {
      return decodeGiftCode(code).h;
    } catch {
      return [];
    }
  }, [code, meta]);

  const shuffledDisplay = hint.length > 0 ? "/" + hint.join("/") : "";

  const loadEnvelopes = useCallback(async () => {
    if (!code || !configured) return;
    setLoadingEnvelopes(true);
    try {
      const { count, totalLovelace } = await getGiftEnvelopes(code);
      setEnvelopes({
        count,
        totalAda: lovelaceToAda(totalLovelace),
        totalLovelace: totalLovelace.toString(),
      });
    } catch (err) {
      console.error("Failed to load gift:", err);
    } finally {
      setLoadingEnvelopes(false);
    }
  }, [code, configured]);

  const loadMeta = useCallback(async () => {
    if (!isBackendEnabled() || !lockTxHash) return;
    const data = await fetchGift(lockTxHash);
    if (data) {
      setMeta(data.gift);
      setClaims(data.claims);
    }
  }, [lockTxHash]);

  useEffect(() => {
    loadEnvelopes();
    loadMeta();
  }, [loadEnvelopes, loadMeta]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || submitting) return;
    setSubmitting(true);
    try {
      const txHash = await claimGift(wallet, code, answer);
      setClaimedTx(txHash);
      toast.success("Claimed! The lucky money is on its way to your wallet. 🧧");
      refreshBalance();

      // Best-effort: record the claim (and claimer name) with the backend.
      if (isBackendEnabled() && lockTxHash) {
        try {
          await recordClaim(lockTxHash, {
            claimerName: claimerName.trim() || undefined,
            claimerAddress: await wallet.getChangeAddress(),
            claimTxHash: txHash,
            amountLovelace: envelopes?.totalLovelace ?? "0",
          });
        } catch (err) {
          console.error("Failed to record claim metadata:", err);
        }
      }
    } catch (err) {
      console.error("Failed to claim gift:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to claim. Check your answer."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gradient-peach mb-2">
          {meta?.title ? meta.title : "🧧 Claim Your Lucky ADA"}
        </h1>
        {meta?.message && (
          <p className="text-foreground mb-2 whitespace-pre-wrap">{meta.message}</p>
        )}
        <p className="text-muted-foreground mb-6 break-all">
          Gift code: <span className="font-mono text-foreground">{code || "—"}</span>
        </p>

        {!configured && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Blockfrost isn't configured. Set <code>VITE_BLOCKFROST_PROJECT_ID</code>{" "}
              and <code>VITE_CARDANO_NETWORK</code> in your <code>.env</code> file to
              claim on-chain.
            </span>
          </div>
        )}

        {claimedTx ? (
          <Card className="border-primary/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                Gift claimed!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Your transaction has been submitted. The ADA will arrive once it's
                confirmed on-chain.
              </p>
              <p className="text-xs text-muted-foreground break-all">
                Tx: <span className="font-mono">{claimedTx}</span>
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Available envelopes */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-primary" />
                  This gift
                  <span className="ml-auto text-xs font-normal text-muted-foreground capitalize">
                    {NETWORK}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingEnvelopes ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Looking up envelopes...
                  </div>
                ) : envelopes ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {envelopes.count} unclaimed envelope
                      {envelopes.count === 1 ? "" : "s"}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {envelopes.totalAda.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}{" "}
                      ₳ available
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Enter your answer below to claim.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Shuffled word display */}
            {shuffledDisplay && (
              <Card className="mb-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Guess the Secret Word</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Rearrange these shuffled characters to find the original word:
                  </p>
                  <div className="rounded-xl bg-secondary p-6 text-center">
                    <span className="text-3xl sm:text-4xl font-bold text-primary tracking-wider break-all leading-relaxed">
                      {shuffledDisplay}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Receiving wallet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <WalletConnect />
              </CardContent>
            </Card>

            {/* Answer form */}
            <form onSubmit={handleSubmit}>
              <Card className="mb-6">
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="answer" className="text-sm font-medium">
                      Your Answer
                    </Label>
                    <Input
                      id="answer"
                      placeholder="Type your answer..."
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      required
                      className="mt-1 text-lg font-bold"
                    />
                  </div>
                  {isBackendEnabled() && (
                    <div>
                      <Label htmlFor="claimerName" className="text-sm font-medium">
                        Your Name{" "}
                        <span className="text-muted-foreground font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="claimerName"
                        placeholder="Let the gift owner know who you are..."
                        maxLength={60}
                        value={claimerName}
                        onChange={(e) => setClaimerName(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full gradient-peach text-primary-foreground shadow-peach hover:shadow-peach-lg transition-shadow rounded-xl"
                    size="lg"
                    disabled={!wallet || !configured || !answer.trim() || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Claim Gift
                      </>
                    )}
                  </Button>
                  {!wallet && (
                    <p className="text-xs text-center text-muted-foreground">
                      Connect a wallet above to receive the ADA.
                    </p>
                  )}
                </CardContent>
              </Card>
            </form>

            {/* Recipients who've already claimed (from the backend) */}
            {claims.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Claimed by ({claims.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {claims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm">
                            {claim.claimerName || "Anonymous"}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono truncate">
                            {claim.claimerAddress}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-primary ml-4">
                          {lovelaceToAda(claim.amountLovelace).toLocaleString(
                            undefined,
                            { maximumFractionDigits: 2 }
                          )}{" "}
                          ₳
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </motion.div>
    </Layout>
  );
};

export default ClaimGift;
