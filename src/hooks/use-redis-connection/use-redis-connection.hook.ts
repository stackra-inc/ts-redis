/**
 * useRedisConnection Hook
 *
 * Get a specific Redis connection by name.
 * Returns a Promise — use with useEffect or React Suspense.
 *
 * @module hooks/use-redis-connection
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useInject } from "@stackra/ts-container/react";
import { RedisManager } from "@/services/redis-manager.service";
import type { RedisConnection } from "@stackra/contracts";

/**
 * Hook to get a specific Redis connection.
 *
 * @param name - Connection name (uses default if omitted)
 * @returns A Promise resolving to the RedisConnection
 *
 * @example
 * ```typescript
 * function CacheStatus() {
 *   const [connected, setConnected] = useState(false);
 *   const connectionPromise = useRedisConnection('cache');
 *
 *   useEffect(() => {
 *     connectionPromise.then(conn => {
 *       setConnected(true);
 *     });
 *   }, [connectionPromise]);
 *
 *   return <div>Connected: {String(connected)}</div>;
 * }
 * ```
 */
export function useRedisConnection(name?: string): Promise<RedisConnection> {
  const redis = useInject<RedisManager>(RedisManager as any);
  return redis.connection(name);
}
