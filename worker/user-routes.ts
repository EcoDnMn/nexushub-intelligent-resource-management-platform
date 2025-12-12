import { Hono } from "hono";
import type { Env } from './core-utils';
import { UserEntity, ResourceEntity } from "./entities";
import { ok, bad, notFound, isStr } from './core-utils';
import type { User } from "@shared/types";
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
    const cq = c.req.query('cursor');
    const lq = c.req.query('limit');
    const page = await ResourceEntity.list(c.env, cq ?? null, lq ? Math.max(1, (Number(lq) | 0)) : undefined);
    return ok(c, page);
  });
  // Ensure seeds are available on first load
  app.get('/api/init', async (c) => {
    await UserEntity.ensureSeed(c.env);
    await ResourceEntity.ensureSeed(c.env);
    return ok(c, { seeded: true });
  });
}