import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Zap, Mail, Lock, ArrowLeft, Loader2, User, Hash, CheckCircle } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");
const nameSchema = z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters");

const Auth = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(searchParams.get("mode") === "signup");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/generate");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/generate");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateInputs = () => {
    if (isSignUp) {
      try {
        nameSchema.parse(fullName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          toast.error(e.errors[0].message);
          return false;
        }
      }
    }
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return false;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        toast.error(e.errors[0].message);
        return false;
      }
    }

    if (isSignUp && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setIsLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });
        if (error) throw error;
        
        // Create profile after signup
        if (data.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              user_id: data.user.id,
              full_name: fullName,
            });
          if (profileError && !profileError.message.includes('duplicate')) {
            console.error("Profile creation error:", profileError);
          }
        }
        
        setShowVerificationMessage(true);
        toast.success("Please check your email to verify your account!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (error: any) {
      if (error.message.includes("User already registered")) {
        toast.error("An account with this email already exists. Please sign in.");
      } else if (error.message.includes("Invalid login credentials")) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Generate a unique user ID preview
  const generateUserIdPreview = () => {
    if (!email) return "Your unique ID will appear here";
    const hash = email.split('@')[0].slice(0, 4).toUpperCase();
    return `OFF-${hash}-XXXX`;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        {showVerificationMessage ? (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-green-500/20 border border-green-500/30 mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-foreground text-glow mb-4">
              Check Your Email
            </h1>
            <p className="text-muted-foreground mb-6">
              We've sent a verification link to <span className="text-primary font-medium">{email}</span>. 
              Please check your inbox and click the link to verify your account.
            </p>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Didn't receive the email? Check your spam folder or
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setShowVerificationMessage(false);
                  setIsSignUp(true);
                }}
              >
                Try again with a different email
              </Button>
              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowVerificationMessage(false);
                    setIsSignUp(false);
                  }}
                  className="text-primary hover:underline text-sm"
                >
                  Already verified? Sign in
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-primary shadow-[0_0_40px_hsl(50_100%_50%/0.5)] mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl font-bold text-foreground text-glow">
                {isSignUp ? "Create Account" : "Welcome Back"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {isSignUp ? "Join OFF AI and start generating code" : "Sign in to continue coding"}
              </p>
            </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">Your Account ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    value={generateUserIdPreview()}
                    className="pl-11 bg-muted/50"
                    disabled
                  />
                </div>
                <p className="text-xs text-muted-foreground">Auto-generated unique ID</p>
              </div>
            </>
          )}

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-11"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-muted-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-11"
                required
              />
            </div>
          </div>

          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-11"
                  required
                />
              </div>
            </div>
          )}

          <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isSignUp ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <span className="text-primary font-medium">Sign in</span>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <span className="text-primary font-medium">Sign up</span>
              </>
            )}
          </button>
        </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
