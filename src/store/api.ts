import type { StoreAdapter, UserComponent } from "../types";

/** Remote persistence adapter — backs to any API */
export class APIStoreAdapter implements StoreAdapter {
  constructor(
    private baseUrl: string,
    private headers: Record<string, string> = {}
  ) {}

  async load(userId: string): Promise<UserComponent[]> {
    const res = await fetch(`${this.baseUrl}/components?userId=${userId}`, {
      headers: this.headers,
    });
    if (!res.ok) throw new Error(`Failed to load components: ${res.status}`);
    return res.json();
  }

  async save(component: UserComponent): Promise<void> {
    await fetch(`${this.baseUrl}/components`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...this.headers },
      body: JSON.stringify(component),
    });
  }

  async delete(userId: string, componentId: string): Promise<void> {
    await fetch(`${this.baseUrl}/components/${componentId}?userId=${userId}`, {
      method: "DELETE",
      headers: this.headers,
    });
  }
}
