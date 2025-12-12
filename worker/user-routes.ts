import { Hono } from "hono";
import type { Context } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ResourceEntity } from "./entities";
import { ok, isStr } from './core-utils';
import type { User, ResourceItem } from "@shared/types";
const bad = (c: Context, error: string, status: number = 400) => c.json({ success: false, error }, status);
const notFound = (c: Context, error = 'not found') => c.json({ success: false, error }, 404);
async function getAuthenticatedUser(c: any): Promise<string | null> {
  const authHeader = c.req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.replace('Bearer ', '');
  if (!await new UserEntity(c.env, token).exists()) {
    return null;
  }
  return token;
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
  // AUTHENTICATION
  app.post('/api/auth/register', async (c) => {
    const { name, email, password } = await c.req.json<Partial<User>>();
    if (!isStr(name) || !isStr(email) || !isStr(password)) {
      return bad(c, 'Name, email, and password are required.');
    }
    const existingUser = await UserEntity.findByEmail(c.env, email);
    if (existingUser) {
      return bad(c, 'A user with this email already exists.');
    }
    const newUser: User = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: password, // In a real app, hash this!
    };
    await UserEntity.create(c.env, newUser);
    const { password: _, ...userClientData } = newUser;
    return ok(c, {
      token: newUser.id, // Mock token
      user: userClientData,
    });
  });
  app.post('/api/auth/login', async (c) => {
    const { email, password } = await c.req.json<{ email?: string; password?: string }>();
    if (!isStr(email) || !isStr(password)) {
      return bad(c, 'Email and password are required.');
    }
    const user = await UserEntity.findByEmail(c.env, email);
    if (!user || user.password !== password) { // Plain text password check for demo
      return bad(c, 'Invalid credentials.');
    }
    const { password: _, ...userClientData } = user;
    return ok(c, {
      token: user.id, // Mock token
      user: userClientData,
    });
  });
  // RESOURCES
  app.get('/api/resources', async (c) => {
    await ResourceEntity.ensureSeed(c.env);
    const cursor = c.req.query('cursor');
    const limit = c.req.query('limit');
    const submittedBy = c.req.query('submittedBy');
    const category = c.req.query('category');
    const q = c.req.query('q');
    const sort = c.req.query('sort');
    const page = await ResourceEntity.list(c.env, null, 1000); // Fetch all for filtering/sorting, not ideal for production
    let items = page.items;
    // Filtering
    if (submittedBy) items = items.filter(r => r.submittedBy === submittedBy);
    if (category) items = items.filter(r => r.category === category);
    if (q) {
      const lowerQ = q.toLowerCase();
      items = items.filter(r => 
        r.title.toLowerCase().includes(lowerQ) ||
        r.description.toLowerCase().includes(lowerQ) ||
        r.url.toLowerCase().includes(lowerQ) ||
        r.tags.some(t => t.toLowerCase().includes(lowerQ))
      );
    }
    // Sorting
    if (sort === 'hot') {
      const now = Date.now();
      // Simple hot sort: score based on votes and recency
      items.sort((a, b) => {
        const scoreA = (a.upvotes - a.downvotes) + (a.createdAt - now) / (1000 * 60 * 60 * 24 * 7); // decay over a week
        const scoreB = (b.upvotes - b.downvotes) + (b.createdAt - now) / (1000 * 60 * 60 * 24 * 7);
        return scoreB - scoreA;
      });
    } else { // Default to 'new'
      items.sort((a, b) => b.createdAt - a.createdAt);
    }
    // Pagination
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const startIndex = cursor ? items.findIndex(item => item.id === cursor) + 1 : 0;
    const paginatedItems = items.slice(startIndex, startIndex + limitNum);
    const nextCursor = items.length > startIndex + limitNum ? items[startIndex + limitNum -1].id : null;
    return ok(c, { items: paginatedItems, next: nextCursor });
  });
  app.get('/api/resources/:id', async (c) => {
    const id = c.req.param('id');
    if (!isStr(id)) return bad(c, 'Invalid ID');
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!await resourceEntity.exists()) {
      return notFound(c, 'Resource not found');
    }
    const resource = await resourceEntity.getState();
    return ok(c, resource);
  });
  app.post('/api/resources', async (c) => {
    const userId = await getAuthenticatedUser(c);
    if (!userId) return bad(c, 'Unauthorized', 401);
    const body = await c.req.json<Partial<ResourceItem>>();
    if (!isStr(body.title) || !isStr(body.url) || !isStr(body.description) || !isStr(body.category)) {
      return bad(c, 'Title, URL, description, and category are required.');
    }
    const newResource: ResourceItem = {
      id: crypto.randomUUID(),
      title: body.title,
      url: body.url,
      description: body.description,
      category: body.category,
      tags: body.tags || [],
      submittedBy: userId,
      createdAt: Date.now(),
      upvotes: 0,
      downvotes: 0,
    };
    const created = await ResourceEntity.create(c.env, newResource);
    return ok(c, created);
  });
  app.put('/api/resources/:id', async (c) => {
    const userId = await getAuthenticatedUser(c);
    if (!userId) return bad(c, 'Unauthorized', 401);
    const id = c.req.param('id');
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!await resourceEntity.exists()) {
      return notFound(c, 'Resource not found');
    }
    const resource = await resourceEntity.getState();
    if (resource.submittedBy !== userId) {
      return bad(c, 'Forbidden: You do not own this resource.', 403);
    }
    const updates = await c.req.json<Partial<Pick<ResourceItem, 'title' | 'description' | 'url' | 'category' | 'tags'>>>();
    await resourceEntity.patch(updates);
    const updatedResource = await resourceEntity.getState();
    return ok(c, updatedResource);
  });
  app.delete('/api/resources/:id', async (c) => {
    const userId = await getAuthenticatedUser(c);
    if (!userId) return bad(c, 'Unauthorized', 401);
    const id = c.req.param('id');
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!await resourceEntity.exists()) {
      return notFound(c, 'Resource not found');
    }
    const resource = await resourceEntity.getState();
    if (resource.submittedBy !== userId) {
      return bad(c, 'Forbidden: You do not own this resource.', 403);
    }
    await ResourceEntity.delete(c.env, id);
    return ok(c, { deleted: true, id });
  });
  app.post('/api/resources/:id/vote', async (c) => {
    const userId = await getAuthenticatedUser(c);
    if (!userId) return bad(c, 'Unauthorized', 401);
    const id = c.req.param('id');
    const { action } = await c.req.json<{ action?: 'upvote' | 'downvote' }>();
    if (action !== 'upvote' && action !== 'downvote') {
      return bad(c, 'Invalid vote action.');
    }
    const resourceEntity = new ResourceEntity(c.env, id);
    if (!await resourceEntity.exists()) {
      return notFound(c, 'Resource not found');
    }
    const key = action === 'upvote' ? 'upvotes' : 'downvotes';
    await resourceEntity.mutate(resource => ({
      ...resource,
      [key]: resource[key] + 1,
    }));
    const updatedResource = await resourceEntity.getState();
    return ok(c, updatedResource);
  });
  // Ensure seeds are available on first load
  app.get('/api/init', async (c) => {
    await UserEntity.ensureSeed(c.env);
    await ResourceEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
}