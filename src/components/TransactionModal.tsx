import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Send, 
  ArrowDownLeft, 
  Smartphone, 
  Building2, 
  CreditCard,
  Clock,
  PiggyBank,
  Copy,
  Check,
  Globe
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEPOSIT_ACCOUNTS = [
  {
    id: "easypaisa",
    name: "Easypaisa",
    icon: Smartphone,
    color: "bg-green-500",
    accountName: "Fazal ur Rehman",
    accountNumber: "03343558055",
    recommended: true,
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    icon: Smartphone,
    color: "bg-red-500",
    accountName: "Fazal ur Rehman",
    accountNumber: "03343558055",
    recommended: false,
  },
];

const INTERNATIONAL_WALLETS = [
  { id: "paypal", name: "PayPal", icon: Globe, color: "bg-blue-600", description: "Worldwide" },
  { id: "wise", name: "Wise", icon: Globe, color: "bg-emerald-500", description: "Low fees, 80+ countries" },
  { id: "payoneer", name: "Payoneer", icon: Globe, color: "bg-orange-500", description: "190+ countries" },
  { id: "skrill", name: "Skrill", icon: Globe, color: "bg-purple-600", description: "40+ currencies" },
  { id: "binance", name: "Binance Pay", icon: Globe, color: "bg-yellow-500", description: "Crypto & fiat" },
  { id: "perfectmoney", name: "Perfect Money", icon: Globe, color: "bg-red-600", description: "E-currency" },
];

const PAKISTAN_BANKS = [
  { id: "hbl", name: "HBL", icon: Building2, color: "bg-emerald-600", description: "Habib Bank Limited" },
  { id: "ubl", name: "UBL", icon: Building2, color: "bg-purple-600", description: "United Bank Limited" },
  { id: "mcb", name: "MCB", icon: Building2, color: "bg-blue-600", description: "MCB Bank" },
  { id: "allied", name: "Allied Bank", icon: Building2, color: "bg-orange-500", description: "Allied Bank Limited" },
  { id: "meezan", name: "Meezan Bank", icon: Building2, color: "bg-teal-600", description: "Islamic Banking" },
  { id: "faysal", name: "Faysal Bank", icon: Building2, color: "bg-indigo-600", description: "Faysal Bank Limited" },
  { id: "bankislami", name: "BankIslami", icon: Building2, color: "bg-cyan-600", description: "Islamic Banking" },
  { id: "askari", name: "Askari Bank", icon: Building2, color: "bg-amber-600", description: "Askari Bank Limited" },
];

const ALL_PAYMENT_METHODS = [
  { id: "easypaisa", name: "Easypaisa", icon: Smartphone, color: "bg-green-500", description: "Mobile wallet" },
  { id: "jazzcash", name: "JazzCash", icon: Smartphone, color: "bg-red-500", description: "Mobile wallet" },
  ...INTERNATIONAL_WALLETS,
  ...PAKISTAN_BANKS,
];

export const TransactionModal = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>("easypaisa");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
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
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wallet className="w-4 h-4" />
          Transactions
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg border-primary/30 bg-card max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl text-primary text-glow">
              Send, Receive & Deposit
            </DialogTitle>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/50">
              <Clock className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Quick & secure transfers via Easypaisa, JazzCash, international wallets & Pakistani banks
          </p>
        </DialogHeader>

        <Tabs defaultValue="deposit" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="deposit" className="gap-1 text-xs sm:text-sm">
              <PiggyBank className="w-3 h-3 sm:w-4 sm:h-4" />
              Deposit
            </TabsTrigger>
            <TabsTrigger value="send" className="gap-1 text-xs sm:text-sm">
              <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              Send
            </TabsTrigger>
            <TabsTrigger value="receive" className="gap-1 text-xs sm:text-sm">
              <ArrowDownLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              Receive
            </TabsTrigger>
          </TabsList>

          <TabsContent value="deposit" className="space-y-4 mt-4">
            {/* Sub-tabs for Pakistan vs International */}
            <div className="flex gap-2">
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
              <>
                {/* Featured Deposit Accounts */}
                {DEPOSIT_ACCOUNTS.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 rounded-lg border-2 relative overflow-hidden ${
                      account.id === "easypaisa"
                        ? "bg-green-500/20 border-green-500"
                        : "bg-red-500/20 border-red-500"
                    }`}
                  >
                    {account.recommended && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-lg font-medium">
                        RECOMMENDED
                      </div>
                    )}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${account.color} flex items-center justify-center`}>
                        <account.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground">{account.name}</h3>
                        <p className="text-xs text-muted-foreground">Send to deposit instantly</p>
                      </div>
                    </div>
                    
                    <div className="space-y-2 bg-background/50 rounded-lg p-3">
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
                  </div>
                ))}

                <div className="space-y-2">
                  <Label>Or deposit from banks</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                    {PAKISTAN_BANKS.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-2 p-2 rounded-lg border transition-all text-left ${
                          selectedMethod === method.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-md ${method.color} flex items-center justify-center`}>
                          <method.icon className="w-3 h-3 text-white" />
                        </div>
                        <p className="font-medium text-xs text-foreground">{method.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {depositTab === "international" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Deposit using international wallets from 80+ countries
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {INTERNATIONAL_WALLETS.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => setSelectedMethod(wallet.id)}
                      className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                        selectedMethod === wallet.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-primary/50 hover:bg-secondary/50"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-md ${wallet.color} flex items-center justify-center`}>
                        <wallet.icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
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

            <div className="p-3 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-xs text-center text-muted-foreground">
                💡 After sending payment, your balance will be updated automatically
              </p>
            </div>
          </TabsContent>

          <TabsContent value="send" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {ALL_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md ${method.color} flex items-center justify-center`}>
                      <method.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account">Account / Phone Number</Label>
              <Input id="account" placeholder="Enter account or phone number" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input id="amount" type="number" placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} disabled />
            </div>

            <Button variant="glow" className="w-full" disabled>
              <Send className="w-4 h-4 mr-2" />
              Send Money (Coming Soon)
            </Button>
          </TabsContent>

          <TabsContent value="receive" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Your Receiving Accounts</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {ALL_PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                      selectedMethod === method.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50 hover:bg-secondary/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-md ${method.color} flex items-center justify-center`}>
                      <method.icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{method.name}</p>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">Your Account Details</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Select a payment method above to view your account details and share them for receiving payments.
              </p>
            </div>

            <Button variant="glow" className="w-full" disabled>
              <ArrowDownLeft className="w-4 h-4 mr-2" />
              Generate QR Code (Coming Soon)
            </Button>
          </TabsContent>
        </Tabs>

        <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/30">
          <p className="text-xs text-center text-muted-foreground">
            🌍 Registered with FBR (Pakistan), USA & 80+ countries worldwide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};