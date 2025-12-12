import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, Code, Megaphone, Palette, Rocket, ThumbsDown, ThumbsUp } from 'lucide-react';
import type { ResourceItem } from '@shared/types';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Skeleton } from "@/components/ui/skeleton";
const categoryIcons: Record<ResourceItem['category'], React.ReactNode> = {
  Development: <Code className="h-5 w-5" />,
  Design: <Palette className="h-5 w-5" />,
  Productivity: <Rocket className="h-5 w-5" />,
  Marketing: <Megaphone className="h-5 w-5" />,
};
type ResourceCardProps = {
  resource: ResourceItem;
  onVote: (resourceId: string, action: 'upvote' | 'downvote') => void;
  isVoting: boolean;
};
export function ResourceCard({ resource, onVote, isVoting }: ResourceCardProps) {
  const { isAuthenticated } = useAuth();
  const handleVote = (action: 'upvote' | 'downvote') => {
    if (isAuthenticated) {
      onVote(resource.id, action);
    } else {
      // In a real app, you might show a toast or modal to prompt login.
      alert('Please log in to vote.');
    }
  };
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="h-full"
    >
      <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border">
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <Link to={`/resource/${resource.id}`} className="space-y-1.5">
              <CardTitle className="text-lg group-hover:text-primary">{resource.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 pt-1">
                {categoryIcons[resource.category]}
                {resource.category}
              </CardDescription>
            </Link>
            <Button variant="ghost" size="icon" asChild>
              <a href={resource.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${resource.title}`}>
                <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
              </a>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-3">{resource.description}</p>
        </CardContent>
        <CardFooter className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {resource.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote('upvote')}
              disabled={!isAuthenticated || isVoting}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-green-500"
            >
              <ThumbsUp className="h-4 w-4" />
              <span className="text-xs font-semibold">{resource.upvotes}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleVote('downvote')}
              disabled={!isAuthenticated || isVoting}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500"
            >
              <ThumbsDown className="h-4 w-4" />
              <span className="text-xs font-semibold">{resource.downvotes}</span>
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
export function ResourceSkeleton() {
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
        <CardFooter className="flex justify-between items-center">
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
            </div>
        </CardFooter>
      </Card>
    );
  }