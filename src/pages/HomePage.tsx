import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ResourceItem } from '@shared/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Link, useSearchParams } from 'react-router-dom';
import { ResourceCard, ResourceSkeleton } from '@/components/ResourceCard';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toaster, toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo } from 'react';
const categories = ['All', 'Development', 'Design', 'Productivity', 'Marketing'];
export function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'new';
  const fetchResources = async ({ pageParam }: { pageParam: string | null }) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (category !== 'All') params.set('category', category);
    if (sort) params.set('sort', sort);
    if (pageParam) params.set('cursor', pageParam);
    params.set('limit', '9');
    const data = await api<{ items: ResourceItem[], next: string | null }>(`/api/resources?${params.toString()}`);
    return data;
  };
  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['resources', query, category, sort],
    queryFn: fetchResources,
    initialPageParam: null,
    getNextPageParam: (lastPage) => lastPage.next,
  });
  const voteMutation = useMutation({
    mutationFn: ({ resourceId, action }: { resourceId: string, action: 'upvote' | 'downvote' }) =>
      api(`/api/resources/${resourceId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      }),
    onSuccess: () => {
      toast.success('Vote counted!');
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['resource'] });
    },
    onError: (err) => {
      toast.error('Failed to vote', { description: err.message });
    },
  });
  const handleVote = (resourceId: string, action: 'upvote' | 'downvote') => {
    voteMutation.mutate({ resourceId, action });
  };
  const resources = useMemo(() => data?.pages.flatMap(page => page.items) ?? [], [data]);
  const handleFilterChange = (key: 'category' | 'sort', value: string) => {
    setSearchParams(prev => {
      if (key === 'category' && value === 'All') {
        prev.delete('category');
      } else {
        prev.set(key, value);
      }
      return prev;
    });
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster richColors />
      <Navbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground"
            >
              Discover & Share Amazing Resources
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground"
            >
              NexusHub is your central station for the best tools, libraries, and articles for developers, designers, and creators.
            </motion.p>
          </div>
          <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-4 mb-8 border-b">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <Tabs value={category} onValueChange={(v) => handleFilterChange('category', v)}>
                <TabsList>
                  {categories.map(cat => (
                    <TabsTrigger key={cat} value={cat}>{cat}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
                <Select value={sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Newest</SelectItem>
                    <SelectItem value="hot">Hottest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="pb-16 md:pb-24 lg:pb-32">
            <AnimatePresence>
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                {isLoading ? (
                  Array.from({ length: 9 }).map((_, i) => <ResourceSkeleton key={i} />)
                ) : error ? (
                  <div className="col-span-full text-center text-destructive">
                    Failed to load resources. Please try again later.
                  </div>
                ) : resources.length > 0 ? (
                  resources.map(resource => (
                    <ResourceCard key={resource.id} resource={resource} onVote={handleVote} isVoting={voteMutation.isPending} />
                  ))
                ) : (
                  <div className="col-span-full text-center text-muted-foreground py-16">
                    <h3 className="text-2xl font-semibold">No resources found</h3>
                    <p className="mt-2">Try adjusting your search or filters.</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            {hasNextPage && (
              <div className="mt-12 text-center">
                <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} size="lg">
                  {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <footer className="border-t">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ at Cloudflare</p>
        </div>
      </footer>
    </div>
  );
}