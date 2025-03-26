1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Object Pooling

Fish-Networking has built-in functionality for Object pooling that will allow the server and client to keep instances of loaded prefabs in memory for later use. This could potentially provide better spawning performance for clients and server.

## 


General

When Despawning [Spawned NetworkObjects](/docs/manual/guides/networkobjects#spawned-networkobject) using FishNet, instead of destroying the object you may just want to disable it and store it to be used again at a later time. This describes what Object Pooling is. FishNet has a default implementation that will allow the objects you have instantiated to be disabled and pooled, instead of being destroyed. This functionality works for clients and server. You can also Pre-warm assets for later use, which is discussed later in this guide.

Reminder that [Scene NetworkObjects](/docs/manual/guides/networkobjects#scene-networkobject) do not get added to the Object Pool and are already disabled instead of destroyed when despawned.

## 


Setup

As mentioned on the [NetworkManager](/docs/manual/guides/components/managers/network-manager) component page, there is an assignable field labeled _ObjectPool__**.**_ You may assign any script which inherits from the **ObjectPool** class. By Default when examining the NetworkManager in the Editor nothing will be assigned to this field, however when you enter play mode the NetworkManager will automatically populate it with the default implementation, and attach the script to the NetworkManager GameObject.

See below for screen captures of the NetworkManager.

![Editor Mode](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FFAFMveSKMK9oml2deH6j%252Fimage.png%3Falt%3Dmedia%26token%3D91c63e9a-affc-402b-97a7-31159d2369b7&width=768&dpr=4&quality=100&sign=2baf6e6d&sv=2)

Editor Mode - Nothing will be assigned, unless you impliment your own Object Pool

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252F8DYAK04Sr5ZcRGer6XOa%252Fimage.png%3Falt%3Dmedia%26token%3D4ab1161b-ab49-42dd-a870-00a07856d079&width=768&dpr=4&quality=100&sign=183d0a6&sv=2)

Play Mode - Default Object Pool Automatically Assigned

By default the object pool is enabled, but your network objects will only use the pool if the default despawn behavior is modified, or through the despawn call. See below for examples to both of these.

### 


Default Despawn Behavior

On the NetworkObject component you can set what the default despawn behavior is for the object where the script is placed. This setting is set to "Destroy" by default, so make sure to switch this over to "Pool" if you want Fish-Networking to automatically use the default object pool.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FmkDIZq8n1iNyw3Bf48wb%252Fimage.png%3Falt%3Dmedia%26token%3D4841e66e-4d90-4a03-b8f3-f383bc2994c5&width=768&dpr=4&quality=100&sign=aadbf67f&sv=2)

### 


Manual Despawn Behavior

You can manually change the despawn behavior through code for specific situations.

Copy

    //When calling Fishnets Despawn from any location you can pass a enum 
    //perameter to deviate from the default behavior.
    ServerManager.Despawn(nob, DespawnType.Pool);

### 


Spawning NetworkObjects

When using the object pool you will want to retrieve NetworkObject from it prior to network spawning them. Doing so will pull from the pool rather than instantiate new objects.

Copy

    //There are many overrides which can a variety of information.
    //You can use GameObjects, NetworkObjects, PrefabIds, CollectionIds,
    //spawn positions, and more.
    NetworkObject nob = NetworkManager.GetPooledInstantiated(...);
    //Spawn normally.
    ServerManager.Spawn(nob);

If you are certain you do not wish to use the object pool on a specific object you can still use the code above and simply set the Default Despawn Type to Destroy on the NetworkObject, or Instantiate and spawn normally.

## 


Pre-Warming the ObjectPool

If you want to manually store Network Objects to the ObjectPool prior to needing them at run-time you may do so through the NetworkManager API.

Here is a very basic implementation of pre-warming the ObjectPool.

Copy

    [SerializeField]
    private NetworkObject _nobPrefab;
    
    private void Start()
    {
        /// <summary>
        /// Instantiates a number of objects and adds them to the pool.
        /// </summary>
        /// <param name="prefab">Prefab to cache.</param>
        /// <param name="count">Quantity to spawn.</param>
        /// <param name="asServer">True if storing prefabs for the server collection.</param>
        InstanceFinder.NetworkManager.CacheObjects(_nobPrefab, 100, IsServer);
    }

## 


Custom Implementation

FishNet allows for the user to implement their own method of object pooling. First create your own class inheriting from the **ObjectPool** class. Place your new class component in your scene, typically directly on the NetworkManager object. Then assign your component to the _ObjectPool_ field on the NetworkManager.