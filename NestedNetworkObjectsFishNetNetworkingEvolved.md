1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Nested NetworkObjects

When a NetworkObject is beneath another NetworkObject it is considered nested. Fish-Networking allows you to nest NetworkObjects both in the scene and prefabs.

While spawning a root NetworkObject any active nested NetworkObjects will also be spawned. The nested NetworkObjects will experience the same callbacks as root, and share the same information such as IsOwner.

You may also have nested NetworkObjects deactivated in the scene or prefab and spawn them later.

When a nested NetworkObject is spawned after the root has already been spawned, the owner information is not automatically assumed the same as the root. You must specify if a client should gain ownership while calling Spawn.

Between instantiating the prefab and spawning the root NetworkObject you may make changes to nested NetworkObjects. This includes SyncTypes, and even the active state of the object. These changes are automatically synchronized when the root is spawned.

For example, if my prefab looks like this:

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FxtRFU2TxyM84L49zmadm%252F220801-15-12-145.png%3Falt%3Dmedia%26token%3D7a1b4ffe-59e9-48a3-9bbd-5f97a81a3135&width=768&dpr=4&quality=100&sign=dcc33f65&sv=2)

But I change the activate state of _NestedNob_ to disabled before server spawning as such:

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FaJQPkHgU4RSeFzY3pRwF%252F220801-15-13-264.png%3Falt%3Dmedia%26token%3D111fa11e-b908-4c4b-bffb-6852b45cc4ea&width=768&dpr=4&quality=100&sign=82c28c9b&sv=2)

RootNob will be spawned over the network with NestedNob disabled / not spawned.

Copy

    //An example of changing the enabled state for NestedNob.
    public GameObject MyPrefab;
    
    private void SpawnPrefab()
    {
        GameObject go = Instantiate(MyPrefab);
        GameObject nestedNob = go.transform.GetChild(0);
        nestedNob.SetActive(false);
        //MyPrefab will spawn with NestedNob disabled for server and all clients
        //until you spawn it at a later time.
        base.Spawn(go);
    }

Nested NetworkObjects may be spawned and despawned but they should not be detached. This feature is being examined for a future update.

There is an exception for nested scene NetworkObjects; they may be detached.