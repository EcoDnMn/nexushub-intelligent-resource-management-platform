# NexusHub - Intelligent Resource Management Platform

[![Deploy to Cloudflare]([cloudflarebutton])](https://workers.cloudflare.com)

NexusHub is a sophisticated, full-stack resource aggregation platform designed to serve as a centralized station for sharing, discovering, and managing digital resources (links, documentation, tools, libraries). It transforms static directories into a dynamic, user-driven ecosystem.

## Features

- **User Authentication**: Complete registration and login flow with persistent storage.
- **Dynamic Resource Database**: Real-time CRUD operations powered by Cloudflare Durable Objects.
- **Interactive Dashboard**: Personalized management of submissions, favorites, and engagement tracking.
- **Public Resource Feed**: Filterable, searchable grid of resources with categories and tags.
- **Categorization & Tagging**: Organized into categories like Dev, Design, Marketing.
- **Voting System**: Upvote/downvote to curate top content.
- **Responsive Design**: Beautiful, mobile-first UI with smooth interactions.
- **Real-time Persistence**: Low-latency data storage and updates.

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Zustand
- **Backend**: Hono (Cloudflare Workers), Cloudflare Durable Objects (persistent storage)
- **UI/UX**: Lucide React icons, Sonner toasts, Class Variance Authority
- **Forms & Validation**: React Hook Form, Zod
- **Build Tools**: Vite, Bun, TypeScript
- **Deployment**: Cloudflare Workers & Pages

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (package manager)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (for deployment)

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd nexushub-resource-station
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to view the app.

## Development

- **Frontend**: Runs on Vite with hot reload. Edit `src/` files and see changes instantly.
- **Backend**: Cloudflare Worker with Hono routes in `worker/user-routes.ts`. Uses Durable Objects for storage.
- **API Endpoints**: Available at `/api/*` (e.g., `/api/users`, `/api/resources`).
- **Type Safety**: Shared types in `shared/types.ts`. Run `bun cf-typegen` to regenerate Worker types.
- **Linting**: `bun lint`
- **Build**: `bun build`

Key directories:
- `src/pages/`: React pages and routes.
- `src/components/ui/`: shadcn/ui components.
- `worker/entities.ts`: Define storage entities (extend `IndexedEntity`).
- `worker/user-routes.ts`: Add custom API routes.

**Do not modify**:
- `worker/core-utils.ts`
- `wrangler.jsonc`
- `worker/index.ts`

## Usage Examples

### Frontend API Calls
```tsx
import { api } from '@/lib/api-client';
import type { User } from '@shared/types';

// Fetch users
const users = await api<User[]>('/api/users');

// Create user
const newUser = await api<User>('/api/users', {
  method: 'POST',
  body: JSON.stringify({ name: 'John Doe' })
});
```

### Adding Entities
In `worker/entities.ts`:
```ts
export class ResourceEntity extends IndexedEntity<Resource> {
  static readonly entityName = 'resource';
  static readonly indexName = 'resources';
  static readonly initialState: Resource = { id: '', url: '', title: '' };
}
```

### Routes
In `worker/user-routes.ts`:
```ts
app.post('/api/resources', async (c) => {
  const resource = await c.req.json<Resource>();
  return ok(c, await ResourceEntity.create(c.env, resource));
});
```

## Deployment

1. **Login to Cloudflare**:
   ```bash
   wrangler login
   ```

2. **Deploy**:
   ```bash
   bun deploy
   ```

   This builds the frontend and deploys the Worker + assets to Cloudflare Pages.

[![Deploy to Cloudflare]([cloudflarebutton])](https://workers.cloudflare.com)

**Custom Domain**: Configure in Cloudflare Dashboard after deployment.

**Environment Variables**: None required (Durable Objects handle storage).

## Architecture

- **Client**: React app with React Query for data fetching.
- **API**: Hono routes proxy to Durable Object entities.
- **Storage**: Single `GlobalDurableObject` for all entities (users, resources).
- **Data Flow**: `Client → Worker Routes → Entity → Durable Object`.

## Contributing

1. Fork and clone.
2. `bun install`
3. Make changes.
4. `bun lint`
5. Test locally: `bun dev`
6. Submit PR.

## License

MIT License. See [LICENSE](LICENSE) for details.

## Support

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- File issues on GitHub.

Built with ❤️ for rapid, scalable resource management.