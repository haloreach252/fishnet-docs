1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkTransform

The NetworkTransform synchronizes transform properties across the network.

You may place as many NetworkTransforms as you like on children. A single NetworkTransform will synchronize the object it is on.

## 


Component Settings

Settings _are general settings related to the NetworkTransform._[](#settings-are-general-settings-related-to-the-networktransform)

**Component Configuration** attempts to automatically configure components used to move your object. For example, if you were to use a CharacterController you could change this setting to CharacterController and the CharacterController will be automatically configured based on other NetworkTransform settings. This feature does not change owner smoothing; for example, if you are using a client authoritative rigidbody setting the Component Configuration to rigidbody will not interpolate the rigidbody for owner, but rather configures the rigidbody on non-owners and server so the NetworkTransform can smooth it properly.

**Synchronize Parents** as true will automatically synchronize which objects the transform is attached to.

**Use Network Level of Detail** will allow the configured NetworkTransform to use level of detail, should you have it enabled on the [ServerManager](/docs/manual/guides/components/managers/server-manager).

*   When false:
    
    *   **Send Interval** is shown when use network level of detail is disabled. This value can be increased to send updates less frequently for certain objects. A value of 1 will send every tick, and a value of 2 will send often as every other tick. Send interval may also be set at runtime.
        
    

**Packing** determines the level of packing for each transform property. In some instances you may want more precision; less packing allows this option at the cost of bandwidth.

Smoothing _allows fine tuning of how the NetworkTransform smooths for spectators._[](#smoothing-allows-fine-tuning-of-how-the-networktransform-smooths-for-spectators)

**Interpolation** is how long of a buffer to create when replicating the transform. Larger interpolation values will reduce the chance of jitter should there be network lag in favor of the transform being further in the past.

**Extrapolation (pro feature)** is how long the transform will try to predict movement when new data is expected, but does not arrive. Using a low interpolation value mixed with extrapolation is a great way to get responsive movement without showing network latency.

**Enable Teleport** will reveal and enable the **Teleport Threshold** value.

*   When true:
    
    *   **Teleport Threshold** is how far the transform must travel in a single update to cause a teleport rather than smoothing. Using a value of 0f will teleport every frame.
        
    

Authority _determines who controls who determines sending values, versus receiving and smoothing them._[](#authority-determines-who-controls-who-determines-sending-values-versus-receiving-and-smoothing-them)

**Client Authoritative** as true allows the owning client to make changes to their transform locally, and those changes will be sent to the server and other clients. While false the server must change transforms to have them sent to clients.

*   When false:
    
    *   **Send To Owner** will only be displayed when **Client Authoritative** is false. While **Send To Owner** true the server will also send transform changes to the owner; while false the owner will not get the transform changes by the server. This can be useful for server authoritative movement.
        
    

Synchronizing _determines which transform properties are synchronized and how_[](#synchronizing-determines-which-transform-properties-are-synchronized-and-how)

**Send Interval** determines at most how often in ticks the NetworkTransform may send. A value of 1 indicates the NetworkTransform can send every tick, if there is change. A value of 5 would mean that the NetworkTransform will send at most every 5 ticks, even if there is change between each tick. For example: if using an interval of 5 and the transform changes and sends on tick 100, then changes on 101, the next update will not send until 105.

**Synchronize and Snapping** lets you choose which properties to synchronize. Only changed values will send over the network, but if you do not want a value to update at all you can turn off synchronization for a transform property. Snapping will allow the transform to snap axes rather than smooth them over time. This feature is commonly used for 2D games, such if you wanted to flip the Y axis on rotation immediately.