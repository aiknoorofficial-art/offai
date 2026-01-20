import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import { BookOpen, Upload, Plus, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  created_at: string;
}

const Courses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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

    try {
      // Upload file if selected
      if (file && user) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("courses")
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from("courses")
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileName = file.name;
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
        });

      if (insertError) {
        throw insertError;
      }

      toast.success("Course created successfully!");
      setTitle("");
      setDescription("");
      setPrice("");
      setFile(null);
      setIsDialogOpen(false);
      fetchCourses();
    } catch (error: any) {
      toast.error(error.message || "Failed to create course");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (course: Course) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      // Delete file from storage if exists
      if (course.file_url && user) {
        const filePath = course.file_url.split("/courses/")[1];
        if (filePath) {
          await supabase.storage.from("courses").remove([filePath]);
        }
      }

      // Delete course record
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

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs sm:text-sm mb-4">
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                Courses
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground text-glow">
                Upload Courses
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mt-2">
                Create and manage your courses with pricing
              </p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 w-full sm:w-auto">
                  <Plus className="w-4 h-4" />
                  New Course
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                  <DialogDescription>
                    Add a title, description, price, and upload your course file.
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
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your course..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">Price (PKR) *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="file">Course File</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        id="file"
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept="video/*,application/pdf,.zip,.rar"
                      />
                      <label htmlFor="file" className="cursor-pointer">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        {file ? (
                          <p className="text-sm text-foreground">{file.name}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Click to upload video, PDF, or archive
                          </p>
                        )}
                      </label>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={uploading}>
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
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              {courses.map((course) => (
                <Card key={course.id} className="box-glow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        {course.description && (
                          <CardDescription className="mt-1">
                            {course.description}
                          </CardDescription>
                        )}
                      </div>
                      {course.user_id === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(course)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        PKR {course.price.toLocaleString()}
                      </span>
                      {course.file_url && (
                        <a
                          href={course.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          View File
                        </a>
                      )}
                    </div>
                    {course.file_name && (
                      <p className="text-xs text-muted-foreground mt-2">
                        File: {course.file_name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Courses;
