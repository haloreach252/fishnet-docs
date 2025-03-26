1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkObject

This component is attached automatically anytime a script which inherits from NetworkBehaviour is added to your object.

## 


Component Settings

**Settings** _are general settings related to the NetworkObject._[](#settings-are-general-settings-related-to-the-networkobject)

**Is Networked** indicates if an object should always be considered a networked object. When false the object will not initialize as networked. This may be useful if you have objects that you sometimes want to only run locally, and other times spawn over the network. Anytime an object is spawned using ServerManager.Spawn _Is Networked_ automatically becomes true for that instantiated copy.

**Is Spawnable** should be marked if the object can spawn at runtime; this is generally false for scene prefabs you do not need to instantiate. While true this object's prefab will be added to DefaultPrefabObjects.

**Is Global** when true will make the NetworkObject known to all clients at all times, the object will also be added to the Don't Destroy on Load scene. This setting will have no effect on scene objects, but for instantiated objects it may be set in the prefab or changed at run-time immediately after instantiating the object.

**Initialize Order** determines the order in which NetworkObjects spawned in the same tick will run their initialization callbacks. A lower value will have higher priority and execute first. The default value is 0 and negative values are allowed.

**Prevent Despawn On Disconnect** will ensure the object will not be destroyed or despawned when the owning client disconnects.

**Default Despawn Type** is the default behavior when despawning the object. Objects are typically destroyed when despawned, but this can be set to other values, such as _Pool_, to save performance.

Prediction are values only enabled when using Prediction 2.[](#prediction-are-values-only-enabled-when-using-prediction-2)

**Enable Prediction** should be used to set whether the object is making use of prediction or not. Enabling this will make available the following settings.

**Prediction Type** is to determine if you are using rigidbodies or not for the predicted object. For example, if you were updating your transform with a CharacterController component this would be set to _Other_. If you were using rigidbodies you would choose _Rigidbody_ or _Rigidbody2D_.

**Enable State Forwarding** is used to forward the replicate and reconcile states to all clients. This is ideal for games where you want all clients and server to run the same inputs. Disabling this setting will cause prediction to only be used on the owner; you will then have to synchronize to spectators using other means, such as a NetworkTransform or custom script.

**Graphical Object** is the object which holds the graphics for your predicted object. When using client-side prediction all predicted objects must have their graphics as a child of the predicted object. For example, if your rigidbody and collider are on the root object, the graphics must remain beneath the root and set as the graphical object.

*   **Detach Graphical Object when t**rue will detach and re-attach the graphical object at runtime when the client initializes/de-initializes the item. This can resolve camera jitter or be helpful objects child of the graphical which do not handle reconiliation well, such as certain animation rigs. Transform is detached after OnStartClient, and reattached before OnStopClient.
    

*   **Interpolation** is how many ticks to interpolate the graphics on client owned objects. A setting as low as 1 can usually be sufficient to smooth over the frames between ticks.
    

*   **Enable Teleport** will allow the graphical object to teleport to it's actual position – also known as the root position – if the position changes are drastic. Ideally you will not need this setting, but it's an available option should you desire to use it.
    
    *   **Teleport Threshold** is shown while teleporting is enabled. If the graphical object's position is this many units away from the actual position, then the graphical object will teleport to the actual position.