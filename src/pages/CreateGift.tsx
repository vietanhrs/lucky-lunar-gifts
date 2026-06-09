import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { WalletConnect } from "@/components/WalletConnect";
import { useWallet } from "@/contexts/WalletContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  Wallet,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { isConfigured, NETWORK } from "@/lib/cardano";
import { createGift, daysFromNow, lovelaceToAda } from "@/lib/gift";

interface GiftItem {
  id: string;
  amount: string;
  count: string;
}

const REFUND_DEADLINE_DAYS = 30;

const CreateGift = () => {
  const { wallet, lovelace, refreshBalance } = useWallet();
  const adaBalance = lovelaceToAda(lovelace);
  const configured = isConfigured();

  const [secretWord, setSecretWord] = useState("");
  const [giftItems, setGiftItems] = useState<GiftItem[]>([
    { id: crypto.randomUUID(), amount: "", count: "1" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [giftCode, setGiftCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addGiftItem = () => {
    setGiftItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), amount: "", count: "1" },
    ]);
  };

  const removeGiftItem = (id: string) => {
    setGiftItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateGiftItem = (id: string, field: "amount" | "count", value: string) => {
    setGiftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const totalEnvelopes = useMemo(
    () => giftItems.reduce((sum, item) => sum + (parseInt(item.count) || 0), 0),
    [giftItems]
  );

  const totalAdaGifted = useMemo(
    () =>
      giftItems.reduce(
        (sum, item) =>
          sum + (parseFloat(item.amount) || 0) * (parseInt(item.count) || 0),
        0
      ),
    [giftItems]
  );

  const estimatedFee = totalEnvelopes * 0.5;
  const totalRequired = totalAdaGifted + estimatedFee;
  const hasInsufficientBalance =
    wallet && totalRequired > adaBalance && totalRequired > 0;

  const shareUrl = giftCode
    ? `${window.location.origin}/claim?code=${encodeURIComponent(giftCode)}`
    : "";

  const copyCode = async () => {
    if (!giftCode) return;
    await navigator.clipboard.writeText(giftCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || submitting) return;

    // Expand each line item into one amount per envelope.
    const envelopeAmountsAda: number[] = [];
    for (const item of giftItems) {
      const amount = parseFloat(item.amount);
      const count = parseInt(item.count) || 0;
      if (!(amount > 0) || count <= 0) continue;
      for (let i = 0; i < count; i++) envelopeAmountsAda.push(amount);
    }
    if (envelopeAmountsAda.length === 0) {
      toast.error("Add at least one envelope with an amount.");
      return;
    }

    setSubmitting(true);
    try {
      const { code } = await createGift(wallet, {
        secret: secretWord,
        envelopeAmountsAda,
        deadlineMs: daysFromNow(REFUND_DEADLINE_DAYS),
      });
      setGiftCode(code);
      toast.success("Gift created! Share the code below.");
      refreshBalance();
    } catch (err) {
      console.error("Failed to create gift:", err);
      toast.error(err instanceof Error ? err.message : "Failed to create gift.");
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
        <h1 className="text-2xl font-bold text-gradient-peach mb-6">
          🧧 Create a Lucky Gift
        </h1>

        {!configured && (
          <div className="mb-6 flex items-start gap-2 rounded-lg bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Blockfrost isn't configured. Set <code>VITE_BLOCKFROST_PROJECT_ID</code>{" "}
              and <code>VITE_CARDANO_NETWORK</code> in your <code>.env</code> file
              to create and claim gifts on-chain.
            </span>
          </div>
        )}

        {/* Wallet Section */}
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
            <div className="flex items-center justify-between">
              <WalletConnect />
              {wallet && (
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Balance</div>
                  <div className="text-lg font-bold text-foreground">
                    {adaBalance.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    ₳
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Success / result */}
        {giftCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-primary/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  Gift created!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Share this gift code with your recipients. They'll solve the
                  secret-word puzzle to claim their lucky money.
                </p>
                <div className="flex gap-2">
                  <Input readOnly value={giftCode} className="font-mono text-xs" />
                  <Button type="button" variant="outline" size="icon" onClick={copyCode}>
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/claim?code=${encodeURIComponent(giftCode)}`}>
                    Open claim page
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground break-all">{shareUrl}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Gift Form */}
        {wallet && !giftCode && (
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
          >
            {/* Secret Word */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Secret Word Quiz</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="secretWord" className="text-sm text-muted-foreground mb-2 block">
                  Recipients must guess this word from shuffled characters to claim the gift
                </Label>
                <Input
                  id="secretWord"
                  placeholder="Enter a secret word or phrase..."
                  value={secretWord}
                  onChange={(e) => setSecretWord(e.target.value)}
                  required
                />
              </CardContent>
            </Card>

            {/* Gift Items */}
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Gift Envelopes</CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addGiftItem}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {giftItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-end gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground">Amount (₳)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="10"
                        value={item.amount}
                        onChange={(e) => updateGiftItem(item.id, "amount", e.target.value)}
                        required
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs text-muted-foreground">Envelopes</Label>
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={item.count}
                        onChange={(e) => updateGiftItem(item.id, "count", e.target.value)}
                        required
                      />
                    </div>
                    {giftItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeGiftItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="mb-6">
              <CardContent className="pt-6 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total gift amount</span>
                  <span className="font-medium">{totalAdaGifted.toFixed(2)} ₳</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Est. transaction fee ({totalEnvelopes} envelopes)
                  </span>
                  <span className="font-medium">~{estimatedFee.toFixed(1)} ₳</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total required</span>
                  <span className="text-primary">{totalRequired.toFixed(2)} ₳</span>
                </div>

                {hasInsufficientBalance && (
                  <div className="flex items-center gap-2 text-sm text-destructive mt-2 p-2 rounded-md bg-destructive/10">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Insufficient balance. You need {totalRequired.toFixed(2)} ₳ but
                    only have {adaBalance.toFixed(2)} ₳.
                  </div>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              size="lg"
              className="w-full gradient-peach text-primary-foreground shadow-peach hover:shadow-peach-lg transition-shadow rounded-xl"
              disabled={
                !!hasInsufficientBalance ||
                !secretWord.trim() ||
                !configured ||
                submitting
              }
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating gift...
                </>
              ) : (
                "Create Gift 🧧"
              )}
            </Button>
          </motion.form>
        )}
      </motion.div>
    </Layout>
  );
};

export default CreateGift;
