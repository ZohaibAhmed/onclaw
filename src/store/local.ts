import type { StoreAdapter, UserComponent } from "../types";

const STORAGE_KEY = "onclaw:components";

export class LocalStoreAdapter implements StoreAdapter {
  async load(userId: string): Promise<UserComponent[]> {
    try {
      const raw = localStorage.getItem(`${STORAGE_KEY}:${userId}`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async save(component: UserComponent): Promise<void> {
    const all = await this.load(component.userId);
    const idx = all.findIndex((c) => c.id === component.id);
    if (idx >= 0) all[idx] = component;
    else all.push(component);
    localStorage.setItem(
      `${STORAGE_KEY}:${component.userId}`,
      JSON.stringify(all)
    );
  }

  async delete(userId: string, componentId: string): Promise<void> {
    const all = await this.load(userId);
    const filtered = all.filter((c) => c.id !== componentId);
    localStorage.setItem(`${STORAGE_KEY}:${userId}`, JSON.stringify(filtered));
  }
}
