1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Observers

An observer is a client which can see an object, and use communications for the object. You may control which clients can observe an object by using the [NetworkObserver](/docs/manual/guides/components/network-observer) and/or [ObserverManager](/docs/manual/guides/components/managers/observermanager) components.

If a client is not an observer of an object then the object will not active, and the client will not receive network messages or callbacks for that object. Should the object be a [scene object](/docs/manual/general/terminology/miscellaneous#scene-object) then it will remain disabled on the client until they become an observer of it. If the object is [instantiated](/docs/manual/general/terminology/miscellaneous#instantiated-object) then the client will simply not instantiate the object until after becoming an observer.

The observer system is designed to work out of the box for new developers. When it comes time to customize how clients observe objects, the observer system additionally offers a large amount of flexibility, keeping in mind there are many condition types, and that you may also create your own.

Fish-Networking comes with a NetworkManager prefab which contains the recommended minimum components to begin working on a new project. Within that prefab is the [ObserverManager](/docs/manual/guides/components/managers/observermanager) with an included [Scene Condition](/docs/manual/guides/components/network-observer#component-settings). If you have not familiarized yourself with the ObserverManager and condition types please do so now using the links above.

A common problem new developers encounter is scene objects not being enabled for clients. This occurs when the client is not considered part of the scene where the object resides, and the scene condition is preventing that object from spawning for the client. The NetworkManager prefab contains a PlayerSpawner script which adds the player to the current scene, which would make the clients an observer for objects in that scene; this also requires a player object to be spawned. Should you have made your own NetworkManager object or removed the PlayerSpawner script you will also need to add the client to the scene you wish the client to be an observer of.

When encountering such an issue you may of course also remove the ObserverManager or scene condition from the ObserverManager, but this is not recommended as objects in other scenes will attempt to spawn for clients which do not occupy such scenes. Alternatively, you may add the client to the scene where the objects reside; there's a variety of ways to accomplish this.

Under the assumption you removed the PlayerSpawner and/or are not using _SceneManager.AddOwnerToDefaultScene_, then you must load the client into the scene using the SceneManager. Clients are only considered networked into scenes when those scenes are loaded using the SceneManager. Clients may become part of a scene by loading a scene globally, or loading a scene for a specific client(connection). See the [SceneManager](/docs/manual/guides/scene-management) section for more information on how to manage networked client scenes as well understand the difference between global and connection scenes.