1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Ownership

Ownership is a term you will see and use very frequently throughout your development with Fish-Net. There can be only one owner, and ownership dictates which client has control over an object. It's important to know that an object does not always have an owner, and that ownership changes must be completed by the server.

When a client owns an object they are considered the rightful user to take actions on the object, such as moving a character or using a weapon on that character. You might also want to give a client temporary ownership over world objects, such as using a turret in your scene.

There are several ways to give ownership to a client. The first is spawning an object with a specific connection, or client, as the owner. There is an example below, but you may also see [Spawning and Despawning](/docs/manual/guides/spawning) for more information on this.

## 


Spawning With Ownership

Copy

    Gameobject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, ownerConnection);

## 


Changing Or Adding Ownership

If an object is already spawned you may give or take ownership for that object at anytime. The example below shows how to give ownership to a connection. Previous owners will be replaced with the newOwner. Both the previous and new owner, as well the server can receive a callback indicating that the owner status has changed. See [NetworkBehaviour Callbacks](/docs/manual/guides/network-behaviour-guides) for more details.

Copy

    networkObject.GiveOwnership(newOwnerConnection);

## 


Removing Ownership

You can also remove ownership from a client on any object at any time.

Copy

    networkObject.RemoveOwnership();

As mentioned an owner is a client, commonly one that has control over an object. You can verify that you own an object by using the _IsOwner_ property in your script. Your script must inherit from [NetworkBehaviour](/docs/manual/guides/components/network-behaviour-components) to use this. Here's a demonstration of only moving a character if the client is an owner of the object.

Copy

    private void Update()
    {
        if (base.IsOwner)
        {
            float hor = Input.GetAxisRaw("Horizontal");
            float ver = Input.GetAxisRaw("Vertical");
            transform.position += new Vector3(hor, 0f, ver);
        }
    }

The above code will only move the transform if the client has ownership. Commonly when paired with [Network Transform](/docs/manual/guides/components/network-transform) and Client Authoritative, this will relay that movement to the server, and the server will send it to other clients.

## 


Checking Ownership

Ownership can be checked a variety of ways. These can all be checked on the NetworkObject or a NetworkBehaviour.

Copy

    //Is true if the local client owns the object.
    base.IsOwner;
    //Returns the current owner NetworkConnection.
    //This can be accessible on clients even if they do not own the object
    //so long as ServerManager.ShareIds is enabled. Sharing Ids has absolutely no
    //security risk.
    base.Owner;
    //True if the local client owns the object, or if
    //is the server and there is no owner.
    base.IsController