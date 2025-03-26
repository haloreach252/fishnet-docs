1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# PredictedSpawn

Adding this component to a NetworkObject will allow you to adjust predicted spawning settings for the object. To enable this feature you must also enable predicted spawning within the [ServerManager](/docs/manual/guides/components/managers/server-manager).

The PredictedSpawn component offers several virtual methods to override to customize and validate predicted spawns.

## 


Component Settings

**Allow Spawning** allows clients to predicted spawn the object.

**Allow Despawning** allows clients to predicted despawn the object.

You can implement WritePayload and ReadPayload in your classes which inherit NetworkBehaviour to send data with spawn messages. This can even be used for predicted spawns to the server, and clients!