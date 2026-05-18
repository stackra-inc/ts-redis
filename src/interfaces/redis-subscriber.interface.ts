/**
 * Redis Subscriber Interfaces
 *
 * Types for the Redis Pub/Sub subscriber system. These interfaces are
 * tightly coupled — the subscriber emits events defined by the event map,
 * which references the message data types.
 *
 * @module @stackra/ts-redis/interfaces/redis-subscriber
 */

/**
 * Data received when a message is published to a subscribed channel.
 */
interface RedisMessageData<TMessage = unknown> {
  /** The channel the message was published to. */
  channel: string;
  /** The message payload. */
  message: TMessage;
}

/**
 * Data received when a message matches a subscribed pattern.
 */
interface RedisPatternMessageData<TMessage = unknown> {
  /** The pattern that matched. */
  pattern: string;
  /** The actual channel the message was published to. */
  channel: string;
  /** The message payload. */
  message: TMessage;
}

/**
 * Data received when subscription count changes.
 */
interface RedisSubscriptionCountEvent {
  /** The channel or pattern. */
  channel: string;
  /** The current subscription count. */
  count: number;
}

/**
 * Event map for the Redis subscriber.
 */
interface RedisSubscriberEventMap<TMessage = unknown> {
  message: RedisMessageData<TMessage>;
  pmessage: RedisPatternMessageData<TMessage>;
  subscribe: RedisSubscriptionCountEvent;
  unsubscribe: RedisSubscriptionCountEvent;
}

/**
 * Redis subscriber for receiving pub/sub messages.
 *
 * @remarks
 * Subscribers use HTTP streaming to listen for messages published
 * to channels or patterns. Always call `unsubscribe()` when done.
 *
 * @example
 * ```typescript
 * const subscriber = connection.subscribe<string>('chat:room:1');
 *
 * subscriber.on('message', (data) => {
 *   logger.info(`[${data.channel}] ${data.message}`);
 * });
 *
 * await subscriber.unsubscribe();
 * ```
 */
export interface RedisSubscriber<TMessage = unknown> {
  /**
   * Register an event listener.
   *
   * @param type - The event type to listen for
   * @param listener - Callback invoked when the event fires
   */
  on<T extends keyof RedisSubscriberEventMap<TMessage>>(
    type: T,
    listener: (event: RedisSubscriberEventMap<TMessage>[T]) => void,
  ): void;

  /**
   * Remove all registered event listeners.
   */
  removeAllListeners(): void;

  /**
   * Unsubscribe from some or all channels/patterns.
   *
   * @param channels - Specific channels to unsubscribe from. If omitted, unsubscribes from all.
   */
  unsubscribe(channels?: string[]): Promise<void>;

  /**
   * Get the list of currently subscribed channels or patterns.
   *
   * @returns Array of channel/pattern names
   */
  getSubscribedChannels(): string[];
}
