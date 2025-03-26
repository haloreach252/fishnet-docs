1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Spawning and Despawning

For objects to exist over the network they must have a NetworkObject component on them, and **must be spawned using the server**. To spawn an object it must first be instantiated, and then passed into a Spawn method. There are a variety of Spawn methods to access for your convenience, all of which provide the same outcome.

Networked addressable prefabs must be registered with the NetworkManager differently. See [Addressables](/docs/manual/guides/addressables) guide for more information on this.

**Spawning Without an Owner** is done by passing in _null_ for the owner, or simply leaving the argument out.

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, null);

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go);

**Spawning With Ownership**

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, ownerConnection);

You may also access the spawn method within any script that inherits NetworkBehaviour, or by accessing the NetworkObject.

Copy

    GameObject go = Instantiate(_yourPrefab);
    base.Spawn(go, ownerConnection); //networkBehaviour.
    //or
    networkObject.Spawn(go, ownerConnection); //referencing a NetworkObject.

**Despawning** can be accessed the same ways as spawning. Through a NetworkBehaviour script, a reference NetworkObject, or through the ServerManager directly.

Copy

    base.Despawn(); //networkBehaviour. Despawns the NetworkObject.
    networkObject.Despawn(); //referencing a NetworkObject.
    InstanceFinder.ServerManager.Despawn(gameObject); //through ServerManager.

When despawning you may also choose to pool the object rather than destroy it. There are optional parameters available to change this behavior.

Copy

    base.Despawn(DespawnType.Pool); //pools the object instead of destroying it.

You can check if an object is spawned at anytime using the _IsSpawned_ property within NetworkBehaviour, or NetworkObject.

**Scene Objects** are spawned and despawned like instantiated objects, except you pass in the reference of the already instantiated/placed scene object. A scene object becomes disabled rather than destroyed when despawned.