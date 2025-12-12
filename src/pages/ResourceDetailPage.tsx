import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { ResourceItem } from '@shared/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowUpRight, ThumbsUp, ThumbsDown, Code, Palette, Rocket, Megaphone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/lib/auth-context';
import { Toaster, toast } from 'sonner';
import { ResourceCard } from '@/components/ResourceCard';
const categoryIcons = {
  Development: <Code className="h-5 w-5 text-blue-500" />,
  Design: <Palette className="h-5 w-5 text-purple-500" />,
  Productivity: <Rocket className="h-5 w-5 text-green-500" />,
  Marketing: <Megaphone className="h-5 w-5 text-orange-500" />,
};
function ResourceDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      <Skeleton className="h-10 w-32 mb-8" />
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-5 w-1/4" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center gap-4 pt-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-12" />
            <Skeleton className="h-12 w-12" />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
export function ResourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: resource, isLoading, error } = useQuery<ResourceItem>({
    queryKey: ['resource', id],
    queryFn: () => api(`/api/resources/${id}`),
    enabled: !!id,
  });
  const { data: relatedResources } = useQuery<{ items: ResourceItem[] }>({
    queryKey: ['related-resources', resource?.category, id],
    queryFn: () => api(`/api/resources?category=${resource?.category}&limit=5`), // Fetch 5 to have 4 if one is the current
    enabled: !!resource,
  });
  const voteMutation = useMutation({
    mutationFn: ({ resourceId, action }: { resourceId: string, action: 'upvote' | 'downvote' }) =>
      api(`/api/resources/${resourceId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      toast.success('Vote counted!');
      queryClient.invalidateQueries({ queryKey: ['resource', id] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    },
    onError: (err) => {
      toast.error('Failed to vote', { description: err.message });
    },
  });
  const handleVote = (action: 'upvote' | 'downvote') => {
    if (!id) return;
    if (isAuthenticated) {
      voteMutation.mutate({ resourceId: id, action });
    } else {
      toast.info('Please log in to vote.');
    }
  };
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors />
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          {isLoading ? (
            <ResourceDetailSkeleton />
          ) : error ? (
            <div className="text-center text-destructive">
              <h2 className="text-2xl font-bold mb-4">Resource Not Found</h2>
              <p>Could not load the requested resource. It might have been deleted.</p>
              <Button onClick={() => navigate('/')} className="mt-6">Go Home</Button>
            </div>
          ) : resource && (
            <div className="max-w-4xl mx-auto">
              <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Card className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {categoryIcons[resource.category]}
                    <span>{resource.category}</span>
                  </div>
                  <CardTitle className="text-3xl md:text-4xl font-bold pt-2">{resource.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-lg text-muted-foreground">{resource.description}</p>
                  <div className="flex items-center gap-4">
                    <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                      <a href={resource.url} target="_blank" rel="noopener noreferrer">
                        Visit Link <ArrowUpRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" onClick={() => handleVote('upvote')} disabled={!isAuthenticated || voteMutation.isPending}><ThumbsUp className="h-5 w-5" /></Button>
                      <span className="font-bold text-lg">{resource.upvotes - resource.downvotes}</span>
                      <Button variant="outline" size="icon" onClick={() => handleVote('downvote')} disabled={!isAuthenticated || voteMutation.isPending}><ThumbsDown className="h-5 w-5" /></Button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${resource.submittedBy}`} />
                      <AvatarFallback>{getInitials(resource.submittedBy)}</AvatarFallback>
                    </Avatar>
                    <span>Submitted {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}</span>
                  </div>
                </CardFooter>
              </Card>
              {relatedResources && relatedResources.items.filter(r => r.id !== id).length > 0 && (
                <div className="mt-16">
                  <h3 className="text-2xl font-bold mb-6">Related Resources</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {relatedResources.items.filter(r => r.id !== id).map(related => (
                      <ResourceCard key={related.id} resource={related} onVote={(resId, action) => voteMutation.mutate({resourceId: resId, action})} isVoting={voteMutation.isPending} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}