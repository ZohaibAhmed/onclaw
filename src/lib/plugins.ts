import type { OnClawPlugin, SlotConfig } from "../types";

/**
 * Run all plugin beforeGenerate hooks in sequence.
 * Each plugin can transform the prompt.
 */
export async function runBeforeGenerate(
  plugins: OnClawPlugin[],
  ctx: {
    prompt: string;
    slotId: string;
    slotConfig?: SlotConfig;
    existingCode?: string;
  }
): Promise<string> {
  let prompt = ctx.prompt;
  for (const plugin of plugins) {
    if (plugin.beforeGenerate) {
      prompt = await plugin.beforeGenerate({ ...ctx, prompt });
    }
  }
  return prompt;
}

/**
 * Run all plugin afterGenerate hooks in sequence.
 * Each plugin can transform the generated code.
 */
export async function runAfterGenerate(
  plugins: OnClawPlugin[],
  ctx: { code: string; prompt: string; slotId: string }
): Promise<string> {
  let code = ctx.code;
  for (const plugin of plugins) {
    if (plugin.afterGenerate) {
      code = await plugin.afterGenerate({ ...ctx, code });
    }
  }
  return code;
}

/**
 * Run all plugin validate hooks.
 * Returns the first validation error, or null if all pass.
 */
export async function runValidate(
  plugins: OnClawPlugin[],
  ctx: { code: string; slotId: string }
): Promise<string | null> {
  for (const plugin of plugins) {
    if (plugin.validate) {
      const error = await plugin.validate(ctx);
      if (error) return `[${plugin.name}] ${error}`;
    }
  }
  return null;
}

/**
 * Apply all plugin wrapComponent hooks to a component.
 */
export function runWrapComponent(
  plugins: OnClawPlugin[],
  Component: React.ComponentType<Record<string, unknown>>,
  slotId: string
): React.ComponentType<Record<string, unknown>> {
  let Wrapped = Component;
  for (const plugin of plugins) {
    if (plugin.wrapComponent) {
      Wrapped = plugin.wrapComponent(Wrapped, slotId);
    }
  }
  return Wrapped;
}
