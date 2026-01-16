import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  Send, 
  ArrowDownLeft, 
  Smartphone, 
  Building2, 
  CreditCard,
  Clock
} from "lucide-react";
import { useState } from "react";

const PAYMENT_METHODS = [
  {
    id: "easypaisa",
    name: "Easypaisa",
    icon: Smartphone,
    color: "bg-green-500",
    description: "Mobile wallet",
  },
  {
    id: "jazzcash",
    name: "JazzCash",
    icon: Smartphone,
    color: "bg-red-500",
    description: "Mobile wallet",
  },
  {
    id: "hbl",
    name: "HBL",
    icon: Building2,
    color: "bg-emerald-600",
    description: "Habib Bank Limited",
  },
  {
    id: "ubl",
    name: "UBL",
    icon: Building2,
    color: "bg-purple-600",
    description: "United Bank Limited",
  },
  {
    id: "mcb",
    name: "MCB",
    icon: Building2,
    color: "bg-blue-600",
    description: "MCB Bank",
  },
  {
    id: "allied",
    name: "Allied Bank",
    icon: Building2,
    color: "bg-orange-500",
    description: "Allied Bank Limited",
  },
  {
    id: "meezan",
    name: "Meezan Bank",
    icon: Building2,
    color: "bg-teal-600",
    description: "Islamic Banking",
  },
  {
    id: "faysal",
    name: "Faysal Bank",
    icon: Building2,
    color: "bg-indigo-600",
    description: "Faysal Bank Limited",
  },
  {
    id: "bankislami",
    name: "BankIslami",
    icon: Building2,
    color: "bg-cyan-600",
    description: "Islamic Banking",
  },
  {
    id: "askari",
    name: "Askari Bank",
    icon: Building2,
    color: "bg-amber-600",
    description: "Askari Bank Limited",
  },
];

export const TransactionModal = () => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

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
              Send & Receive Money
            </DialogTitle>
            <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/50">
              <Clock className="w-3 h-3 mr-1" />
              Coming Soon
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Quick & secure transfers via Easypaisa, JazzCash & all Pakistani banks
          </p>
        </DialogHeader>

        <Tabs defaultValue="send" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="send" className="gap-2">
              <Send className="w-4 h-4" />
              Send Money
            </TabsTrigger>
            <TabsTrigger value="receive" className="gap-2">
              <ArrowDownLeft className="w-4 h-4" />
              Receive Money
            </TabsTrigger>
          </TabsList>

          <TabsContent value="send" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Select Payment Method</Label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                {PAYMENT_METHODS.map((method) => (
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
              <Input
                id="account"
                placeholder="Enter account or phone number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled
              />
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
                {PAYMENT_METHODS.map((method) => (
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
