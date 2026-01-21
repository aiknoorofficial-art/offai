import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { 
  BookOpen, Upload, Plus, Trash2, DollarSign, Image, 
  CreditCard, User as UserIcon, Star, MessageCircle, Send 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
        fetchCourses();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

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
    const { data, error } = await supabase
      .from("course_reviews")
      .select(`
        *,
        profiles:user_id (full_name)
      `)
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load reviews:", error);
    } else {
      setReviews((data as Review[]) || []);
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
          ) : (
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
          )}
        </div>
      </main>

      {/* Course Detail Modal */}
      <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden border-neon-cyan/30">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="gradient-text-multi text-2xl">{selectedCourse.title}</DialogTitle>
              </DialogHeader>
              
              <ScrollArea className="max-h-[70vh] pr-4">
                <div className="space-y-6">
                  {/* Course Image */}
                  {selectedCourse.image_url && (
                    <div className="rounded-lg overflow-hidden">
                      <img 
                        src={selectedCourse.image_url} 
                        alt={selectedCourse.title}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  )}

                  {/* Price & Payment Info */}
                  <div className="p-4 rounded-lg bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/20">
                    <div className="text-3xl font-bold text-neon-cyan mb-3">
                      PKR {selectedCourse.price.toLocaleString()}
                    </div>
                    {(selectedCourse.account_name || selectedCourse.account_number) && (
                      <div className="space-y-2 text-sm">
                        <p className="text-muted-foreground font-medium">Payment Details:</p>
                        {selectedCourse.account_name && (
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4 text-neon-magenta" />
                            <span>{selectedCourse.account_name}</span>
                          </div>
                        )}
                        {selectedCourse.account_number && (
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-neon-magenta" />
                            <span className="font-mono">{selectedCourse.account_number}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedCourse.description && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Description</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{selectedCourse.description}</p>
                    </div>
                  )}

                  {/* Course File */}
                  {selectedCourse.file_url && (
                    <div>
                      <h4 className="font-semibold text-foreground mb-2">Course Material</h4>
                      <a
                        href={selectedCourse.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple/20 text-neon-purple hover:bg-neon-purple/30 transition-colors"
                      >
                        <Upload className="w-4 h-4" />
                        {selectedCourse.file_name || "Download File"}
                      </a>
                    </div>
                  )}

                  {/* Reviews Section */}
                  <div className="border-t border-border pt-6">
                    <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-neon-cyan" />
                      Reviews & Comments
                    </h4>

                    {/* Add Review Form */}
                    <div className="p-4 rounded-lg bg-secondary/30 border border-neon-purple/20 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-muted-foreground">Rating:</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewRating(star)}
                              className="focus:outline-none"
                            >
                              <Star 
                                className={`w-5 h-5 transition-colors ${
                                  star <= newRating 
                                    ? "fill-neon-orange text-neon-orange" 
                                    : "text-muted-foreground"
                                }`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Share your thoughts..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="flex-1 border-neon-cyan/30"
                        />
                        <Button 
                          onClick={submitReview} 
                          disabled={submittingReview}
                          className="bg-gradient-to-r from-neon-cyan to-neon-purple"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Reviews List */}
                    {loadingReviews ? (
                      <p className="text-muted-foreground text-center py-4">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No reviews yet. Be the first!</p>
                    ) : (
                      <div className="space-y-3">
                        {reviews.map((review) => (
                          <div 
                            key={review.id} 
                            className="p-3 rounded-lg bg-secondary/20 border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neon-cyan">
                                  {review.profiles?.full_name || "Anonymous"}
                                </span>
                                {review.rating && (
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star 
                                        key={star}
                                        className={`w-3 h-3 ${
                                          star <= review.rating! 
                                            ? "fill-neon-orange text-neon-orange" 
                                            : "text-muted-foreground"
                                        }`} 
                                      />
                                    ))}
                                  </div>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {review.user_id === user?.id && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteReview(review.id)}
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-foreground">{review.comment}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Courses;