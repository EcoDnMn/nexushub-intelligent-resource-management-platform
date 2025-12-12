import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ResourceItem } from '@shared/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, Trash2, Edit, Eye } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters.'),
  url: z.string().url('Please enter a valid URL.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  category: z.enum(['Development', 'Design', 'Productivity', 'Marketing']),
  tags: z.string().refine(val => val.split(',').every(tag => tag.trim().length > 0), {
    message: 'Tags must be a comma-separated list of words.',
  }).optional().or(z.literal('')),
});
type ResourceFormValues = z.infer<typeof resourceSchema>;
function ResourceForm({ resource, onFinished }: { resource?: ResourceItem, onFinished: () => void }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const form = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: resource?.title || '',
      url: resource?.url || '',
      description: resource?.description || '',
      category: resource?.category || 'Development',
      tags: resource?.tags?.join(', ') || '',
    },
  });
  const mutation = useMutation({
    mutationFn: (data: ResourceItem) => {
      const apiPath = resource ? `/api/resources/${resource.id}` : '/api/resources';
      const method = resource ? 'PUT' : 'POST';
      return api(apiPath, { method, body: JSON.stringify(data) });
    },
    onSuccess: () => {
      toast.success(`Resource ${resource ? 'updated' : 'created'} successfully!`);
      queryClient.invalidateQueries({ queryKey: ['my-resources', user?.id] });
      onFinished();
    },
    onError: (error) => {
      toast.error(`Failed to ${resource ? 'update' : 'create'} resource`, { description: error.message });
    },
  });
  const onSubmit = (values: ResourceFormValues) => {
    const tagsArray = values.tags ? values.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [];
    mutation.mutate({ ...values, tags: tagsArray } as ResourceItem);
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="url" render={({ field }) => (
          <FormItem><FormLabel>URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem><FormLabel>Category</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
              <SelectContent>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Productivity">Productivity</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="tags" render={({ field }) => (
          <FormItem><FormLabel>Tags (comma-separated)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="ghost">Cancel</Button></DialogClose>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save Resource'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
export function DashboardPage() {
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const navigate = useNavigate();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<ResourceItem | undefined>(undefined);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isAuthLoading, navigate]);
  const { data, isLoading: areResourcesLoading, error } = useQuery<{ items: ResourceItem[] }>({
    queryKey: ['my-resources', user?.id],
    queryFn: () => api(`/api/resources?submittedBy=${user?.id}`),
    enabled: !!user?.id,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api(`/api/resources/${id}`, { method: 'DELETE' }),
    onSuccess: (data: { id: string }) => {
      toast.success('Resource deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['my-resources', user?.id] });
    },
    onError: (error) => {
      toast.error('Failed to delete resource', { description: error.message });
    },
  });
  if (isAuthLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">My Dashboard</h1>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingResource(undefined)}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Submit Resource
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingResource ? 'Edit Resource' : 'Submit a New Resource'}</DialogTitle>
                  <DialogDescription>Fill in the details below to share a resource with the community.</DialogDescription>
                </DialogHeader>
                <ResourceForm resource={editingResource} onFinished={() => setFormOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>My Submissions</CardTitle>
              <CardDescription>A list of resources you have submitted.</CardDescription>
            </CardHeader>
            <CardContent>
              {areResourcesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : error ? (
                <div className="text-center text-destructive py-8">Failed to load your resources.</div>
              ) : data?.items.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">You haven't submitted any resources yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Category</TableHead>
                      <TableHead className="hidden sm:table-cell">Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.items.map((resource) => (
                      <TableRow key={resource.id}>
                        <TableCell className="font-medium">{resource.title}</TableCell>
                        <TableCell className="hidden md:table-cell">{resource.category}</TableCell>
                        <TableCell className="hidden sm:table-cell">{format(new Date(resource.createdAt), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate(`/resource/${resource.id}`)}><Eye className="mr-2 h-4 w-4" /> View</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => { setEditingResource(resource); setFormOpen(true); }}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem className="text-red-500" onClick={() => deleteMutation.mutate(resource.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}