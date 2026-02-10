import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Gift, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Layout } from "@/components/Layout";
import heroImage from "@/assets/peach-blossom-hero.jpg";

const Index = () => {
  const [claimCode, setClaimCode] = useState("");
  const navigate = useNavigate();

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (claimCode.trim()) {
      navigate(`/claim?code=${encodeURIComponent(claimCode.trim())}`);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative w-full max-w-2xl mx-auto text-center"
        >
          {/* Hero image */}
          <div className="relative rounded-2xl overflow-hidden mb-8 shadow-peach-lg">
            <img
              src={heroImage}
              alt="Peach blossoms for Lunar New Year"
              className="w-full h-48 sm:h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-0 right-0">
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient-peach">
                🧧 Lucky ADA
              </h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                Send lucky money this Lunar New Year
              </p>
            </div>
          </div>

          {/* Create Gift Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Button
              size="lg"
              className="gradient-peach text-primary-foreground shadow-peach hover:shadow-peach-lg transition-shadow text-lg px-8 py-6 rounded-xl w-full max-w-sm"
              onClick={() => navigate("/create")}
            >
              <Gift className="mr-2 h-5 w-5" />
              Create Gift
            </Button>
          </motion.div>

          {/* Claim section */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-8"
          >
            <div className="relative max-w-sm mx-auto">
              <div className="text-sm text-muted-foreground mb-3">
                Have a gift code? Claim it below
              </div>
              <form onSubmit={handleClaim} className="flex gap-2">
                <Input
                  placeholder="Enter gift code..."
                  value={claimCode}
                  onChange={(e) => setClaimCode(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="outline" size="icon">
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default Index;
