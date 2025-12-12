import { IndexedEntity, Index } from "./core-utils";
import type { User, ResourceItem } from "@shared/types";
import { MOCK_USERS, MOCK_RESOURCES } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "", email: "", password: "" };
  static seedData = MOCK_USERS;
  static async findByEmail(env: Env, email: string): Promise<User | null> {
    // In a real app, you'd have a secondary index for this.
    // For this demo, we'll iterate through all users. This is inefficient but works for small scale.
    const userIndex = new Index<string>(env, this.indexName);
    const userIds = await userIndex.list();
    for (const id of userIds) {
      const user = await new UserEntity(env, id).getState();
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return user;
      }
    }
    return null;
  }
}
// RESOURCE ENTITY
export class ResourceEntity extends IndexedEntity<ResourceItem> {
  static readonly entityName = "resource";
  static readonly indexName = "resources";
  static readonly initialState: ResourceItem = {
    id: "",
    title: "",
    description: "",
    url: "",
    category: "Development",
    tags: [],
    submittedBy: "",
    createdAt: 0,
    upvotes: 0,
    downvotes: 0,
  };
  static seedData = MOCK_RESOURCES;
}