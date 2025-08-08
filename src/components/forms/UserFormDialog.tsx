import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { User } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(1, "Phone is required"),
  role: z.enum(["Admin", "PM", "Team Lead", "User"]),
  employeeType: z.enum(["Developer", "Designer", "Marketing", "QA", "Product Manager"]),
  status: z.enum(["Active", "Inactive"]),
  photo: z.string().optional(),
});

type UserFormData = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User;
}

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const { createUser, updateUser } = useData();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState(user?.photo || "");

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      role: user?.role || "User",
      employeeType: user?.employeeType || "Developer",
      status: user?.status || "Active",
      photo: user?.photo || "",
    },
  });

  const onSubmit = (data: UserFormData) => {
    const userData = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      employeeType: data.employeeType,
      status: data.status,
      photo: photoUrl || `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150`,
      joinDate: user?.joinDate || new Date().toISOString().split('T')[0],
    };

    if (user) {
      updateUser(user.id, userData);
      toast({
        title: "Team member updated",
        description: "Team member has been updated successfully.",
      });
    } else {
      createUser(userData);
      toast({
        title: "Team member created",
        description: "Team member has been created successfully.",
      });
    }

    onOpenChange(false);
    form.reset();
    setPhotoUrl("");
  };

  const handlePhotoUpload = () => {
    // Mock photo upload - in a real app, this would upload to a file service
    const mockPhotoUrls = [
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150",
      "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    ];
    
    const randomPhoto = mockPhotoUrls[Math.floor(Math.random() * mockPhotoUrls.length)];
    setPhotoUrl(randomPhoto);
    form.setValue("photo", randomPhoto);
    
    toast({
      title: "Photo uploaded",
      description: "Profile photo has been uploaded successfully.",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Edit Team Member" : "Add New Team Member"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={photoUrl} />
                <AvatarFallback>
                  {form.watch("name") ? form.watch("name").split(' ').map(n => n[0]).join('') : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={handlePhotoUpload}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </Button>
                <p className="text-xs text-muted-foreground">
                  Mock upload - a random photo will be assigned
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter phone number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Admin">Admin</SelectItem>
                        <SelectItem value="PM">Project Manager</SelectItem>
                        <SelectItem value="Team Lead">Team Lead</SelectItem>
                        <SelectItem value="User">User</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="employeeType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Developer">Developer</SelectItem>
                        <SelectItem value="Designer">Designer</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="QA">QA Engineer</SelectItem>
                        <SelectItem value="Product Manager">Product Manager</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-primary to-primary-glow">
                {user ? "Update Member" : "Add Member"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}