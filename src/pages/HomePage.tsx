import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { ResourceItem } from '@shared/types';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, Code, Palette, Rocket, Megaphone } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'react-router-dom';
const categoryIcons = {
  Development: <Code className="h-5 w-5" />,
  Design: <Palette className="h-5 w-5" />,
  Productivity: <Rocket className="h-5 w-5" />,
  Marketing: <Megaphone className="h-5 w-5" />,
};
function ResourceCard({ resource }: { resource: ResourceItem }) {
  return (
    <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div>
            <CardTitle className="text-lg">{resource.title}</CardTitle>
            <CardDescription className="flex items-center gap-2 pt-1">
              {categoryIcons[resource.category]}
              {resource.category}
            </CardDescription>
          </div>
          <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
            <ArrowUpRight className="h-5 w-5" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground">{resource.description}</p>
      </CardContent>
      <CardFooter>
        <div className="flex flex-wrap gap-2">
          {resource.tags.map(tag => (
            <Badge key={tag} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
function ResourceSkeleton() {
  return (
    <Card className="flex flex-col h-full">
      <CardHeader>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4 mt-2" />
      </CardHeader>
      <CardContent className="flex-grow space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </CardFooter>
    </Card>
  );
}
export function HomePage() {
  const { data, isLoading, error } = useQuery<{ items: ResourceItem[] }>({
    queryKey: ['resources'],
    queryFn: () => api('/api/resources'),
  });
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32 text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground">
              Discover & Share Amazing Resources
            </h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
              NexusHub is your central station for the best tools, libraries, and articles for developers, designers, and creators.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                <Link to="/dashboard">Submit a Resource</Link>
              </Button>
              <Button size="lg" variant="outline">
                Explore Categories
              </Button>
            </div>
          </div>
          <div className="pb-16 md:pb-24 lg:pb-32">
            <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Latest Submissions</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {Array.from({ length: 6 }).map((_, i) => <ResourceSkeleton key={i} />)}
              </div>
            ) : error ? (
              <div className="text-center text-destructive">
                Failed to load resources. Please try again later.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data?.items.map(resource => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
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