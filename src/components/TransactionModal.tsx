import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  PiggyBank,
  Copy,
  Check,
  Smartphone,
  Globe
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

import easypaisaLogo from "@/assets/logos/easypaisa.png";
import jazzcashLogo from "@/assets/logos/jazzcash.png";
import paypalLogo from "@/assets/logos/paypal.png";
import wiseLogo from "@/assets/logos/wise.png";
import payoneerLogo from "@/assets/logos/payoneer.png";
import skrillLogo from "@/assets/logos/skrill.png";
import binanceLogo from "@/assets/logos/binance.png";
import perfectmoneyLogo from "@/assets/logos/perfectmoney.png";
import hblLogo from "@/assets/logos/hbl.png";
import ublLogo from "@/assets/logos/ubl.png";
import mcbLogo from "@/assets/logos/mcb.png";
import alliedLogo from "@/assets/logos/allied.png";
import meezanLogo from "@/assets/logos/meezan.png";
import faysalLogo from "@/assets/logos/faysal.png";
import bankislamiLogo from "@/assets/logos/bankislami.png";
import askariLogo from "@/assets/logos/askari.png";

const DEPOSIT_ACCOUNTS = [
  {
    id: "easypaisa",
    name: "Easypaisa",
    logo: easypaisaLogo,
    color: "bg-green-500",
    accountName: "Fazal ur Rehman",
    accountNumber: "03343558055",
    recommended: true,
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    logo: jazzcashLogo,
    color: "bg-red-500",
    accountName: "Fazal ur Rehman",
    accountNumber: "03343558055",
    recommended: false,
  },
];

const INTERNATIONAL_WALLETS = [
  { id: "paypal", name: "PayPal", logo: paypalLogo, description: "Worldwide" },
  { id: "wise", name: "Wise", logo: wiseLogo, description: "Low fees, 80+ countries" },
  { id: "payoneer", name: "Payoneer", logo: payoneerLogo, description: "190+ countries" },
  { id: "skrill", name: "Skrill", logo: skrillLogo, description: "40+ currencies" },
  { id: "binance", name: "Binance Pay", logo: binanceLogo, description: "Crypto & fiat" },
  { id: "perfectmoney", name: "Perfect Money", logo: perfectmoneyLogo, description: "E-currency" },
];

const PAKISTAN_BANKS = [
  { id: "hbl", name: "HBL", logo: hblLogo, description: "Habib Bank Limited" },
  { id: "ubl", name: "UBL", logo: ublLogo, description: "United Bank Limited" },
  { id: "mcb", name: "MCB", logo: mcbLogo, description: "MCB Bank" },
  { id: "allied", name: "Allied Bank", logo: alliedLogo, description: "Allied Bank Limited" },
  { id: "meezan", name: "Meezan Bank", logo: meezanLogo, description: "Islamic Banking" },
  { id: "faysal", name: "Faysal Bank", logo: faysalLogo, description: "Faysal Bank Limited" },
  { id: "bankislami", name: "BankIslami", logo: bankislamiLogo, description: "Islamic Banking" },
  { id: "askari", name: "Askari Bank", logo: askariLogo, description: "Askari Bank Limited" },
];

const AnimatedLogo = ({ src, alt, className = "", delay = 0 }: { src: string; alt: string; className?: string; delay?: number }) => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    className={`transition-all duration-500 hover:scale-110 ${className}`}
    style={{
      animation: `logoFloat 3s ease-in-out ${delay}s infinite`,
    }}
  />
);

export const TransactionModal = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>("easypaisa");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [depositTab, setDepositTab] = useState("pakistan");
  const { toast } = useToast();

  const handleCopyAccount = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    toast({
      title: "Copied!",
      description: "Account number copied to clipboard",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Dialog>
      <style>{`
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-4px) scale(1.05); }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.1); }
          50% { box-shadow: 0 0 12px 4px rgba(255,255,255,0.15); }
        }
      `}</style>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <PiggyBank className="w-4 h-4" />
          Deposit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg border-primary/30 bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-primary text-glow">
            Deposit Funds
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Quick & secure deposits via Easypaisa, JazzCash, international wallets & Pakistani banks
          </p>
        </DialogHeader>

        {/* Sub-tabs for Pakistan vs International */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={depositTab === "pakistan" ? "default" : "outline"}
            size="sm"
            onClick={() => setDepositTab("pakistan")}
            className="flex-1 gap-1"
          >
            <Smartphone className="w-3 h-3" />
            Pakistan
          </Button>
          <Button
            variant={depositTab === "international" ? "default" : "outline"}
            size="sm"
            onClick={() => setDepositTab("international")}
            className="flex-1 gap-1"
          >
            <Globe className="w-3 h-3" />
            International
          </Button>
        </div>

        {depositTab === "pakistan" && (
          <div className="space-y-4 mt-2">
            {DEPOSIT_ACCOUNTS.map((account, idx) => {
              const isOpen = selectedMethod === account.id;
              return (
              <div
                key={account.id}
                className={`p-4 rounded-lg border-2 relative overflow-hidden cursor-pointer transition-all ${
                  account.id === "easypaisa"
                    ? "bg-green-500/20 border-green-500"
                    : "bg-red-500/20 border-red-500"
                }`}
                onClick={() => setSelectedMethod(isOpen ? null : account.id)}
              >
                {account.recommended && (
                  <div className="absolute top-0 right-0 bg-green-500 text-foreground text-xs px-2 py-1 rounded-bl-lg font-medium">
                    RECOMMENDED
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-lg bg-background/80 flex items-center justify-center p-1 overflow-hidden"
                    style={{ animation: `logoPulse 2s ease-in-out ${idx * 0.3}s infinite` }}>
                    <AnimatedLogo src={account.logo} alt={account.name} className="w-10 h-10 object-contain" delay={idx * 0.5} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-foreground">{account.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {isOpen ? "Tap to hide details" : "Tap to view account details"}
                    </p>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-2 bg-background/50 rounded-lg p-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Account Name:</span>
                      <span className="font-semibold text-sm text-foreground">{account.accountName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary">{account.accountNumber}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyAccount(account.accountNumber, account.id)}
                          className="h-7 w-7 p-0"
                        >
                          {copiedId === account.id ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              );
            })}

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Or deposit from banks</p>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-1">
                {PAKISTAN_BANKS.map((method, idx) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-md bg-background/80 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                      <AnimatedLogo src={method.logo} alt={method.name} className="w-7 h-7 object-contain" delay={idx * 0.2} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-xs text-foreground truncate">{method.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {depositTab === "international" && (
          <div className="space-y-3 mt-2">
            <p className="text-sm text-muted-foreground">
              Deposit using international wallets from 80+ countries
            </p>
            <div className="grid grid-cols-2 gap-2">
              {INTERNATIONAL_WALLETS.map((wallet, idx) => (
                <button
                  key={wallet.id}
                  onClick={() => setSelectedMethod(wallet.id)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                    selectedMethod === wallet.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50 hover:bg-secondary/50"
                  }`}
                >
                  <div className="w-10 h-10 rounded-md bg-background/80 flex items-center justify-center p-1 overflow-hidden shrink-0"
                    style={{ animation: `logoPulse 2.5s ease-in-out ${idx * 0.4}s infinite` }}>
                    <AnimatedLogo src={wallet.logo} alt={wallet.name} className="w-8 h-8 object-contain" delay={idx * 0.3} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground">{wallet.name}</p>
                    <p className="text-xs text-muted-foreground">{wallet.description}</p>
                  </div>
                </button>
              ))}
            </div>
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-center text-muted-foreground">
                📧 For international deposits, contact us at <span className="text-primary font-medium">support@offai.com</span> with your wallet details
              </p>
            </div>
          </div>
        )}

        <div className="mt-2 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-center text-muted-foreground">
            💡 After sending payment, your balance will be updated automatically
          </p>
        </div>

        <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-center text-muted-foreground">
            🌍 Registered with FBR (Pakistan), USA & 80+ countries worldwide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
