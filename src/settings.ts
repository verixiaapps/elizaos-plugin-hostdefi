import type { IAgentRuntime } from '@elizaos/core';

export function getSetting(runtime: IAgentRuntime, name: string): string | undefined {
  const getter = (runtime as { getSetting?: (k: string) => string | undefined }).getSetting;
  const v = getter?.call(runtime, name) ?? process.env[name];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}
