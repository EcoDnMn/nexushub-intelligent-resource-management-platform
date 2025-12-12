import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ResourceEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { User, ResourceItem } from "@shared/types";
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
    const page = await ResourceEntity.list(c.env, cursor ?? null, limit ? Math.max(1, (Number(limit) | 0)) : undefined);
    let filteredItems = page.items;
    if (submittedBy) {
      filteredItems = filteredItems.filter(r => r.submittedBy === submittedBy);
    }
    if (category) {
      filteredItems = filteredItems.filter(r => r.category === category);
    }
    return ok(c, { ...page, items: filteredItems });
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
  // Ensure seeds are available on first load
  app.get('/api/init', async (c) => {
    await UserEntity.ensureSeed(c.env);
    await ResourceEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
}