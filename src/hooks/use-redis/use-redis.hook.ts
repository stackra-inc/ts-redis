/**
 * useRedis Hook
 *
 * Access the RedisManager in React components.
 *
 * @module hooks/use-redis
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInject } from "@stackra/ts-container/react";
import { RedisManager } from "@/services/redis-manager.service";

/**
 * Hook to access the RedisManager in React components.
 *
 * @returns The RedisManager instance
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const redis = useRedis();
 *
 *   useEffect(() => {
 *     redis.connection('cache').then(conn => conn.get('key'));
 *   }, []);
 * }
 * ```
 */
export function useRedis(): RedisManager {
  return useInject(RedisManager as any);
}
