import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  BookOpen, Upload, Plus, Trash2, DollarSign, Image, 
  CreditCard, User as UserIcon, Star, MessageCircle, Send, ShoppingCart, Package,
  Wallet, Clock, Banknote
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast as hookToast } from "@/hooks/use-toast";

interface Course {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  file_url: string | null;
  file_name: string | null;
  image_url: string | null;
  account_number: string | null;
  account_name: string | null;
  created_at: string;
}

interface Review {
  id: string;
  course_id: string;
  user_id: string;
  rating: number | null;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string;
  } | null;
}

const Courses = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Review form states
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  // Order states
  const [orderMessage, setOrderMessage] = useState("");
  const [orderTid, setOrderTid] = useState("");
  const [orderSenderName, setOrderSenderName] = useState("");
  const [orderSenderNumber, setOrderSenderNumber] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  // Earnings states
  const [balance, setBalance] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("");
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      } else {
        fetchCourses().then(() => {
          const openCourseId = searchParams.get("open");
          if (openCourseId) {
            // Auto-open course from notification link
            supabase.from("courses").select("*").eq("id", openCourseId).single().then(({ data }) => {
              if (data) {
                openCourseDetail(data as Course);
                setSearchParams({}, { replace: true });
              }
            });
          }
        });
        fetchEarnings(session.user.id);
        fetchWithdrawn(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchEarnings = async (userId: string) => {
    const { data: orders } = await supabase
      .from("course_orders")
      .select("status, course_id")
      .eq("seller_id", userId);
    if (!orders) return;
    const acceptedOrders = orders.filter((o) => o.status === "accepted");
    setPendingOrders(orders.filter((o) => o.status === "pending").length);
    setTotalOrders(orders.length);
    if (acceptedOrders.length === 0) { setBalance(0); return; }
    const courseIds = [...new Set(acceptedOrders.map((o) => o.course_id))];
    const { data: courses } = await supabase.from("courses").select("id, price").in("id", courseIds);
    const priceMap = Object.fromEntries((courses || []).map((c) => [c.id, c.price]));
    setBalance(acceptedOrders.reduce((sum, o) => sum + (priceMap[o.course_id] || 0), 0));
  };

  const fetchWithdrawn = async (userId: string) => {
    const { data } = await supabase.from("withdrawals").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    if (data) {
      setWithdrawals(data);
      setTotalWithdrawn(data.filter(w => w.status === "approved" || w.status === "pending").reduce((sum, w) => sum + Number(w.amount), 0));
    }
  };

  const handleWithdraw = async () => {
    if (!user) return;
    const amount = Number(withdrawAmount);
    const available = balance - totalWithdrawn;
    if (!amount || amount <= 0 || amount > available) {
      hookToast({ title: "Invalid amount", description: `Max: Rs. ${available.toLocaleString()}`, variant: "destructive" });
      return;
    }
    if (!withdrawMethod || !withdrawAccount || !withdrawName) {
      hookToast({ title: "Fill all fields", variant: "destructive" });
      return;
    }
    setWithdrawLoading(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id, amount, method: withdrawMethod,
      account_number: withdrawAccount, account_name: withdrawName,
    });
    setWithdrawLoading(false);
    if (error) { hookToast({ title: "Error", description: error.message, variant: "destructive" }); }
    else {
      hookToast({ title: "Withdrawal Requested!", description: `Rs. ${amount.toLocaleString()} via ${withdrawMethod}` });
      setWithdrawOpen(false); setWithdrawAmount(""); setWithdrawMethod(""); setWithdrawAccount(""); setWithdrawName("");
      fetchWithdrawn(user.id);
    }
  };

  const fetchCourses = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load courses");
      console.error(error);
    } else {
      setCourses(data || []);
    }
    setIsLoading(false);
  };

  const fetchReviews = async (courseId: string) => {
    setLoadingReviews(true);
    const { data: reviewsData, error } = await supabase
      .from("course_reviews")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load reviews:", error);
      setReviews([]);
    } else if (reviewsData) {
      // Fetch profiles for each review
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);
      
      const reviewsWithProfiles: Review[] = reviewsData.map(review => ({
        ...review,
        profiles: profilesMap.has(review.user_id) 
          ? { full_name: profilesMap.get(review.user_id)! }
          : null
      }));
      
      setReviews(reviewsWithProfiles);
    }
    setLoadingReviews(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!price || parseFloat(price) < 0) {
      toast.error("Please enter a valid price");
      return;
    }

    setUploading(true);
    let fileUrl = null;
    let fileName = null;
    let imageUrl = null;

    try {
      // Upload course file if selected
      if (file && user) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}-file.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("courses")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("courses")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
      }

      // Upload image if selected
      if (imageFile && user) {
        const imageExt = imageFile.name.split(".").pop();
        const imagePath = `${user.id}/${Date.now()}-image.${imageExt}`;
        
        const { error: imageUploadError } = await supabase.storage
          .from("courses")
          .upload(imagePath, imageFile);

        if (imageUploadError) throw imageUploadError;

        const { data: imageUrlData } = supabase.storage
          .from("courses")
          .getPublicUrl(imagePath);

        imageUrl = imageUrlData.publicUrl;
      }

      // Insert course record
      const { error: insertError } = await supabase
        .from("courses")
        .insert({
          user_id: user?.id,
          title: title.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          file_url: fileUrl,
          file_name: fileName,
          image_url: imageUrl,
          account_number: accountNumber.trim() || null,
          account_name: accountName.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success("Course created successfully!");
      resetForm();
      setIsDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to create course");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPrice("");
    setAccountNumber("");
    setAccountName("");
    setFile(null);
    setImageFile(null);
  };

  const handleDelete = async (course: Course, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      // Delete files from storage
      if (course.file_url && user) {
        const filePath = course.file_url.split("/courses/")[1];
        if (filePath) {
          await supabase.storage.from("courses").remove([filePath]);
        }
      }
      if (course.image_url && user) {
        const imagePath = course.image_url.split("/courses/")[1];
        if (imagePath) {
          await supabase.storage.from("courses").remove([imagePath]);
        }
      }

      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", course.id);

      if (error) throw error;

      toast.success("Course deleted");
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete course");
    }
  };

  const openCourseDetail = (course: Course) => {
    setSelectedCourse(course);
    fetchReviews(course.id);
  };

  const submitReview = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (!selectedCourse || !user) return;

    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from("course_reviews")
        .insert({
          course_id: selectedCourse.id,
          user_id: user.id,
          rating: newRating,
          comment: newComment.trim(),
        });

      if (error) throw error;

      toast.success("Review submitted!");
      setNewComment("");
      setNewRating(5);
      fetchReviews(selectedCourse.id);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;
    
    try {
      const { error } = await supabase
        .from("course_reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
      
      toast.success("Review deleted");
      if (selectedCourse) fetchReviews(selectedCourse.id);
    } catch (error: any) {
      toast.error("Failed to delete review");
    }
  };

  const submitOrder = async () => {
    if (!orderMessage.trim()) {
      toast.error("Please enter a message for the seller");
      return;
    }
    if (!selectedCourse || !user) return;

    setSubmittingOrder(true);
    try {
      const { error } = await supabase
        .from("course_orders")
        .insert({
          course_id: selectedCourse.id,
          buyer_id: user.id,
          seller_id: selectedCourse.user_id,
          message: orderMessage.trim(),
        });

      if (error) throw error;

      toast.success("Order sent to the publisher!");
      setOrderMessage("");
      setShowOrderForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to send order");
    } finally {
      setSubmittingOrder(false);
    }
  };

  // Check if current user is the course owner
  const isOwner = selectedCourse?.user_id === user?.id;

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/20 text-neon-cyan text-xs sm:text-sm mb-4">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                Courses Marketplace
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text-multi">
                Explore Courses
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-2">
                Create, share, and discover amazing courses
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90">
                  <Plus className="w-4 h-4" />
                  New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto border-neon-purple/30">
                <DialogHeader>
                  <DialogTitle className="gradient-text-multi">Create New Course</DialogTitle>
                  <DialogDescription>
                    Add course details, payment info, and upload files.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter course title"
                      className="border-neon-cyan/30 focus:border-neon-cyan"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your course in detail..."
                      rows={4}
                      className="border-neon-cyan/30 focus:border-neon-cyan"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-cyan" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="pl-9 border-neon-cyan/30 focus:border-neon-cyan"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="accountName">Account Name</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-magenta" />
                        <Input
                          id="accountName"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Your name"
                          className="pl-9 border-neon-magenta/30 focus:border-neon-magenta"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-magenta" />
                        <Input
                          id="accountNumber"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Payment account"
                          className="pl-9 border-neon-magenta/30 focus:border-neon-magenta"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Course Image</Label>
                    <div className="border-2 border-dashed border-neon-purple/30 rounded-lg p-4 text-center hover:border-neon-purple/50 transition-colors">
                      <input
                        id="image"
                        type="file"
                        onChange={handleImageChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <label htmlFor="image" className="cursor-pointer">
                        <Image className="w-8 h-8 mx-auto mb-2 text-neon-purple" />
                        {imageFile ? (
                          <p className="text-sm text-foreground">{imageFile.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click to upload course thumbnail
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Course File</Label>
                    <div className="border-2 border-dashed border-neon-orange/30 rounded-lg p-4 text-center hover:border-neon-orange/50 transition-colors">
                      <input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="video/*,application/pdf,.zip,.rar"
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-neon-orange" />
                        {file ? (
                          <p className="text-sm text-foreground">{file.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Upload video, PDF, or archive
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-magenta hover:opacity-90" disabled={uploading}>
                    {uploading ? "Uploading..." : "Create Course"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Earnings Dashboard */}
          {user && (
            <div className="mb-8 p-6 rounded-xl bg-card/80 backdrop-blur-sm border border-neon-green/20">
              <h2 className="text-xl font-bold gradient-text-multi mb-4">My Earnings</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-neon-green/5 border border-neon-green/10">
                  <Wallet className="w-6 h-6 text-neon-green mx-auto mb-2" />
                  <div className="text-2xl font-bold text-neon-green">Rs. {(balance - totalWithdrawn).toLocaleString()}</div>
                  <p className="text-muted-foreground text-xs mt-1">Available</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-neon-cyan/5 border border-neon-cyan/10">
                  <ShoppingCart className="w-6 h-6 text-neon-cyan mx-auto mb-2" />
                  <div className="text-2xl font-bold text-neon-cyan">{totalOrders}</div>
                  <p className="text-muted-foreground text-xs mt-1">Total Orders</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-neon-yellow/5 border border-neon-yellow/10">
                  <Clock className="w-6 h-6 text-neon-yellow mx-auto mb-2" />
                  <div className="text-2xl font-bold text-neon-yellow">{pendingOrders}</div>
                  <p className="text-muted-foreground text-xs mt-1">Pending</p>
                </div>
                <div className="flex items-center justify-center">
                  <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="border-neon-orange/50 text-neon-orange hover:bg-neon-orange/10 gap-2">
                        <Banknote className="w-4 h-4" />
                        Withdraw
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-card border-border">
                      <DialogHeader>
                        <DialogTitle className="gradient-text-multi text-xl">Withdraw Funds</DialogTitle>
                      </DialogHeader>
                      <p className="text-muted-foreground text-sm">Available: <span className="text-neon-green font-bold">Rs. {(balance - totalWithdrawn).toLocaleString()}</span></p>
                      <div className="space-y-4 mt-2">
                        <div>
                          <Label>Amount (PKR)</Label>
                          <Input type="number" placeholder="Enter amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
                        </div>
                        <div>
                          <Label>Payment Method</Label>
                          <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
                            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easypaisa">Easypaisa</SelectItem>
                              <SelectItem value="JazzCash">JazzCash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Account Number</Label>
                          <Input placeholder="03XXXXXXXXX" value={withdrawAccount} onChange={(e) => setWithdrawAccount(e.target.value)} />
                        </div>
                        <div>
                          <Label>Account Holder Name</Label>
                          <Input placeholder="Full name" value={withdrawName} onChange={(e) => setWithdrawName(e.target.value)} />
                        </div>
                        <Button onClick={handleWithdraw} disabled={withdrawLoading} className="w-full bg-gradient-to-r from-neon-orange to-neon-yellow text-background">
                          {withdrawLoading ? "Submitting..." : "Submit Withdrawal Request"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Withdrawal History */}
              {withdrawals.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Withdrawal History</h3>
                  <div className="space-y-3">
                    {withdrawals.map((w) => (
                      <div key={w.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-background/50 border border-border gap-2">
                        <div className="flex items-center gap-3">
                          <Banknote className="w-5 h-5 text-neon-orange" />
                          <div>
                            <p className="font-medium text-sm">Rs. {Number(w.amount).toLocaleString()} — {w.method}</p>
                            <p className="text-xs text-muted-foreground">{w.account_name} • {w.account_number}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={w.status === "approved" ? "default" : w.status === "rejected" ? "destructive" : "secondary"}
                            className={w.status === "approved" ? "bg-neon-green/20 text-neon-green border-neon-green/30" : ""}
                          >
                            {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No courses yet</p>
              <p className="text-sm mt-2">Create your first course to get started</p>
            </div>
          ) : !selectedCourse ? (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Card 
                  key={course.id} 
                  className="group cursor-pointer overflow-hidden border-neon-purple/20 hover:border-neon-cyan/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]"
                  onClick={() => openCourseDetail(course)}
                >
                  <div className="relative aspect-video bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 overflow-hidden">
                    {course.image_url ? (
                      <img 
                        src={course.image_url} 
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-neon-purple/50" />
                      </div>
                    )}
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-neon-cyan to-neon-purple text-background font-bold">
                      PKR {course.price.toLocaleString()}
                    </Badge>
                    {course.user_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(course, e)}
                        className="absolute top-3 left-3 bg-background/80 text-destructive hover:text-destructive hover:bg-background"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg text-foreground line-clamp-1 group-hover:text-neon-cyan transition-colors">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <MessageCircle className="w-3 h-3" />
                      <span>Click to view details & reviews</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Full Page Course Detail View */
            <div className="space-y-6">
              {/* Back Button */}
              <Button
                variant="ghost"
                onClick={() => setSelectedCourse(null)}
                className="text-neon-cyan hover:text-neon-cyan/80 hover:bg-neon-cyan/10"
              >
                ← Back to Courses
              </Button>

              {/* Course Header */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* Course Image */}
                <div className="rounded-xl overflow-hidden border border-neon-cyan/20 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
                  {selectedCourse.image_url ? (
                    <img 
                      src={selectedCourse.image_url} 
                      alt={selectedCourse.title}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-80 bg-gradient-to-br from-neon-cyan/20 to-neon-magenta/20 flex items-center justify-center">
                      <BookOpen className="w-20 h-20 text-neon-purple/50" />
                    </div>
                  )}
                </div>

                {/* Course Info */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold gradient-text-multi mb-3">
                      {selectedCourse.title}
                    </h1>
                    {selectedCourse.description && (
                      <p className="text-muted-foreground whitespace-pre-wrap text-lg">
                        {selectedCourse.description}
                      </p>
                    )}
                  </div>

                  {/* Price & Payment Info */}
                  <div className="p-6 rounded-xl bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/30">
                    <div className="text-4xl font-bold text-neon-cyan mb-4">
                      PKR {selectedCourse.price.toLocaleString()}
                    </div>
                    
                    {/* Payment details only visible to course owner */}
                    {isOwner && (selectedCourse.account_name || selectedCourse.account_number) && (
                      <div className="space-y-3 mb-4">
                        <p className="text-muted-foreground font-semibold text-lg">Your Payment Details:</p>
                        {selectedCourse.account_name && (
                          <div className="flex items-center gap-3 text-lg">
                            <UserIcon className="w-5 h-5 text-neon-magenta" />
                            <span>{selectedCourse.account_name}</span>
                          </div>
                        )}
                        {selectedCourse.account_number && (
                          <div className="flex items-center gap-3 text-lg">
                            <CreditCard className="w-5 h-5 text-neon-magenta" />
                            <span className="font-mono">{selectedCourse.account_number}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Button for non-owners */}
                    {!isOwner && (
                      <div className="space-y-4">
                        {!showOrderForm ? (
                          <Button
                            onClick={() => setShowOrderForm(true)}
                            className="w-full bg-gradient-to-r from-neon-orange to-neon-magenta hover:opacity-90 text-lg py-6"
                          >
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Order Now
                          </Button>
                        ) : (
                          <div className="space-y-3 p-4 rounded-lg bg-secondary/30 border border-neon-orange/30">
                            <p className="text-sm text-muted-foreground">
                              Send a message to the publisher to order this course:
                            </p>
                            <Textarea
                              placeholder="Hi, I'm interested in this course. Please share payment details..."
                              value={orderMessage}
                              onChange={(e) => setOrderMessage(e.target.value)}
                              className="border-neon-cyan/30 min-h-[100px]"
                            />
                            <div className="flex gap-2">
                              <Button
                                onClick={submitOrder}
                                disabled={submittingOrder}
                                className="flex-1 bg-gradient-to-r from-neon-cyan to-neon-purple"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                {submittingOrder ? "Sending..." : "Send Order"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setShowOrderForm(false);
                                  setOrderMessage("");
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Course File */}
                  {selectedCourse.file_url && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 text-lg">Course Material</h4>
                      <a
                        href={selectedCourse.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-lg bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors text-lg font-medium"
                      >
                        <Upload className="w-5 h-5" />
                        {selectedCourse.file_name || "Download File"}
                      </a>
                    </div>
                  )}

                  {/* Delete Button for Owner */}
                  {isOwner && (
                    <Button
                      variant="destructive"
                      onClick={(e) => {
                        handleDelete(selectedCourse, e);
                        setSelectedCourse(null);
                      }}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Course
                    </Button>
                  )}
                </div>
              </div>

              {/* Reviews Section */}
              <div className="border-t border-border pt-8">
                <h2 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                  <MessageCircle className="w-7 h-7 text-neon-cyan" />
                  Reviews & Comments
                </h2>

                {/* Add Review Form */}
                <div className="p-6 rounded-xl bg-secondary/30 border border-neon-purple/20 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-muted-foreground font-medium">Your Rating:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="focus:outline-none"
                        >
                          <Star 
                            className={`w-7 h-7 transition-colors ${
                              star <= newRating 
                                ? "fill-neon-orange text-neon-orange" 
                                : "text-muted-foreground hover:text-neon-orange/50"
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Input
                      placeholder="Share your thoughts about this course..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1 border-neon-cyan/30 h-12 text-lg"
                    />
                    <Button 
                      onClick={submitReview} 
                      disabled={submittingReview}
                      className="bg-gradient-to-r from-neon-cyan to-neon-purple px-6 h-12"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>

                {/* Reviews List */}
                {loadingReviews ? (
                  <p className="text-muted-foreground text-center py-8 text-lg">Loading reviews...</p>
                ) : reviews.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8 text-lg">No reviews yet. Be the first to share your thoughts!</p>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="p-5 rounded-xl bg-secondary/20 border border-border hover:border-neon-cyan/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-magenta flex items-center justify-center text-background font-bold">
                              {(review.profiles?.full_name || "A")[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="font-medium text-neon-cyan block">
                                {review.profiles?.full_name || "Anonymous"}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {review.rating && (
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star 
                                    key={star}
                                    className={`w-4 h-4 ${
                                      star <= review.rating! 
                                        ? "fill-neon-orange text-neon-orange" 
                                        : "text-muted-foreground"
                                    }`} 
                                  />
                                ))}
                              </div>
                            )}
                            {review.user_id === user?.id && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteReview(review.id)}
                                className="h-8 w-8 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-foreground">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;