import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Send, Users } from "lucide-react";

// Mock data
const MOCK_GIFT = {
  originalWord: "happy new year",
  recipients: [
    {
      name: "Alice",
      walletAddress: "addr1qxy8e...3nk7",
      amount: 10,
    },
    {
      name: "Bob",
      walletAddress: "addr1qz9f2...8mk4",
      amount: 10,
    },
    {
      name: "",
      walletAddress: "addr1q8h3d...2jp9",
      amount: 5,
    },
  ],
};

function shuffleString(str: string): string {
  const chars = str.split("");
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("/");
}

const ClaimGift = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";

  const [answer, setAnswer] = useState("");
  const [claimerName, setClaimerName] = useState("");

  const shuffledDisplay = useMemo(
    () => "/" + shuffleString(MOCK_GIFT.originalWord),
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Claim attempt:", { code, answer, claimerName });
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-2xl font-bold text-gradient-peach mb-2">
          🧧 Claim Your Lucky ADA
        </h1>
        <p className="text-muted-foreground mb-8">
          Gift code: <span className="font-mono text-foreground">{code}</span>
        </p>

        {/* Shuffled word display */}
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
                  value={claimerName}
                  onChange={(e) => setClaimerName(e.target.value)}
                  className="mt-1"
                />
              </div>
              <Button
                type="submit"
                className="w-full gradient-peach text-primary-foreground shadow-peach hover:shadow-peach-lg transition-shadow rounded-xl"
                size="lg"
              >
                <Send className="mr-2 h-4 w-4" />
                Claim Gift
              </Button>
            </CardContent>
          </Card>
        </form>

        {/* Recipients list */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Recipients ({MOCK_GIFT.recipients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {MOCK_GIFT.recipients.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm">
                      {r.name || "Anonymous"}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono truncate">
                      {r.walletAddress}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-primary ml-4">
                    {r.amount} ₳
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Layout>
  );
};

export default ClaimGift;
