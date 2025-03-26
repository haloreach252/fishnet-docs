1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Lag Compensation](/docs/manual/guides/lag-compensation)

# Raycast

Fish-Networking [Pro](/docs/master/pro-projects-and-support) is required for raycast lag compensation. Over-time projectiles may use another approach and do not require Pro. See [Projectiles](/docs/manual/guides/lag-compensation/projectiles) for more information.

This feature can be setup easily in a few steps.

To begin I am entering the ColliderRollbackDemo scene included with Fish-Networking Pro. You do not need to open the scene, but if you wish to follow along visually you may.

## 


Hitboxes

In my scene is an object named EnemySetup. The screen capture below shows two boxes on the 'enemy'. One for the body, and one for the head.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FwInJBzCk5iUuINz69Wia%252F221111-16-36-628.png%3Falt%3Dmedia%26token%3D23d6e0f9-3a90-48af-a9e4-ce7ca3801191&width=768&dpr=4&quality=100&sign=8c33abea&sv=2)

Each hitbox must be on a new object. Generally speaking, the hitbox would be a child of whichever component moves. With an actual humanoid rig, you would probably place the head collider on a child beneath the neck bone.

Notice the 'hitbox' objects are children of the moving component, and only have a collider on them. You may use any collider type.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FOaCiRYcG8o9CE4ivRLE8%252F221111-16-42-162.png%3Falt%3Dmedia%26token%3Ddecadeb7-484e-456b-a7dc-dac571ec97d4&width=768&dpr=4&quality=100&sign=6d54fa15&sv=2)

Next the ColliderRollback script must be added somewhere within your prefab or object. For the sake of simplicity I have mine on the root, with the NetworkObject.

Once added, specify each object you added as a collider within the **Collider Parents** collection.

To make things easier, place the suffix 'Hitbox' on all your hitbox objects. You can then lock the inspector on your ColliderRollback object, search Hitbox, and quickly drag all entries in at once.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FTGBM0plVAQINZ1ye6Bjg%252F221111-16-44-588.png%3Falt%3Dmedia%26token%3Dbf2b8f3e-5d69-4c3f-b024-819a30cb69e8&width=768&dpr=4&quality=100&sign=25b9d6f&sv=2)

You've completed all the steps required for setting up an object.

## 


Rollback Manager

To utilize the lag compensation you must also add the RollbackManager script to your Networkmanager object. We have a section on the [RollbackManager](/docs/manual/guides/components/managers/rollbackmanager-pro-feature) component to understand what each field does. Once you review the component settings we can move onto the code.

## 


Performing a Rollback

The RollbackManager must know how far back in time to place colliders to obtain accurate hit results. When your client is to fire their weapon you will want to gather the current PreciseTick and include it with your Fire RPC.

Copy

    [Client]
    private void Fire()
    {
        //Use LastPacketTick to get the best tick alignment.
        PreciseTick pt = base.TimeManager.GetPreciseTick(TickType.LastPacketTick);
        //Call fire on the server.
        ServerFire(pt);
    }
    
    [ServerRpc]
    private void ServerFire(PreciseTick pt)
    {
        //Rollback using the precise tick sent in.
        //Using Physics for 3d rolback, Physics3D for 2d rolback.
        //Both physics types can be used at once.
        base.RollbackManager.Rollback(pt, RollbackManager.PhysicsType.Physics, base.IsOwner);
        //Perform your raycast normally.
        RaycastHit hit;
        if (Physics.Raycast(transform.position, transform.forward, out hit)) { }
        //Return the colliders to their proper positions.
        base.RollbackManager.Return();
    }