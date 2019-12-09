# topic-serialization library

Streaming Services and event-brokers which support sophisticated
hierarchical topics and subscriptions offer great power and flexibility
to your streaming platform.  Developers often don't leverage those
capabilities though, and their applications or frameworks can be
limited as a result.

This library implements a recommended pattern of abstracting the
topic hierarchy implementation from your code by scoping it inside
a `TopicStrategy` implementation for each event type.  It is a
similar strategy to the Codec strategy of separating out event
serialization/deserialization away from business logic, but applied to
your Streaming platform's topic hierarchy.

This library contains an example serialization implementation for
hierarchical topics and subscriptions using wildcarding.  This is
just an example implementation using reflection to handle arbitrary
POJOs via public getters.
Ideally, real implementations would be targeted to the specific
event-types of your application via custom `TopicStrategy<YourEvent>`
implementations.

The goal is for code that would commonly look something like this:

```java
    Serializer<Order> serializer = new OrderSerializer();
    TopicStrategy<Order> strategy = new OrderTopicStrategy();

    Order order = new Order(333, "shoes", 1.2345, 6789);
    Topic topic = strategy.makeTopic(order);
    Message message serializer.serialize(order);
    eventbus.send(message, topic);
```

## `TopicStrategy<Event>`

The interface for any topic serialization is:

```java
/**
 * Implements a full topic strategy for Event-Driven pub-sub architectures.
 *
 * @param <Event> Event type for translation into topics and subscriptions
 */
public interface TopicStrategy<Event> {
    /**
     * For Publishers: Create a full topic for publication based upon the contents of a event
     * and the underlying topic architecture rules.
     * @param evt Fully-specified event for publication.
     * @return Topic instance matching the topic architecture based upon contents of the evt parameter.
     */
    Topic makeTopic(Event evt);

    /**
     * For Subscribers: Create a full topic-subscription filter for subscription based upon the contents
     * of a request filter and the the underlying topic architecture rules.
     *
     * @param keyBasedFilters subscription filter in key-value pairs; e.g. itemName:
     * @return Subscription filter instance matching the topic architecture based upon contents of the keyBasedFilters parameter.
     */
    Topic makeSubscription(Map<String,String> keyBasedFilters);
}
```

### `Topic makeTopic(Event evt)`

With the generic `TopicStrategy<T>` approach, event producers do
not have to embed topic serialization code within the business
logic. They simply call out to the appropriate strategy implementation:

```java
Order order = createOrderObject( params );
Topic topic = strategy.makeTopic( order );
eventBus.publish( order, topic );
```

### `Topic makeSubscription(Map<String,String> keyBasedFilters)`

Similarly to event producers, event consumers can express their
complex filtering requirements via a common mapping and let the
`TopicStrategy` figure out the correct subscription implementation:

```java
Map<String,String> where = new HashMap<>();
where.put( "orderId", 10 );
Topic subscription = strategy.makeSubscription( where );
eventBus.subscribe( subscription );
```

## Example Topic Hierarchies

The following examples come from real-world applications of this architectural 
pattern.

 `OMS/{instance}/orders/{venue}/{symbol}/{orderID}/{orderState}`
 
 This topic hierarchy comes from equities trading systems. The specific venue, 
 symbol, order-ID and order-state of each order message would be substituted 
 into the topic prototype. This allows other systems to filter on those 
 details to support many different application such as sticky routing, 
 load-balancing, actor-models, etc.
 
 `Stores/{state}/{storeNumber}/Order/{orderId}/{action}`
 
 This example comes from retail stores where store events fan into a core 
 microservices architecture for all back-end capabilities. the rich topic 
 filtering is used to decouple the services and support flexible, agile 
 microservices that can accommodate rapidly changing requirements.
 
 `Location/{latitude}/{longitude}/{vid}`
 
 A security-camera monitoring service uses this topic hierarchy for security 
 events propagated from from remote sensors into real-time analytics for 
 security alerting. The dynamic coordinates in the topic support lightweight 
 geo-spatial routing and filtering without adding heavy content filtering.

## Conclusion

Too many developers do not take advantage of sophisticated hierarchical
topic mechanisms when presented with them, deferring to the limited,
lowest common denominator behavior of static topic strings. I hope
this example is useful to any developers struggling to take advantage
of more powerful streaming capabilities.
