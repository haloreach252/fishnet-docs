1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Visibility

Scene Visibility offers details of using the "Scene Condition" with the ObserverManager, and how to manage Observers in a Scene.

## 


General

You can control if clients become an [**Observer**](/docs/manual/guides/observers) of gameobjects in a scene that they are in. This is possible if you set your [**ObserverManager**](/docs/manual/guides/components/managers/observermanager) to include a **Scene Condition**. The **Scene Condition** ensures that [**NetworkObjects**](/docs/manual/guides/networkobjects) both scene and spawned are only visible to players in the same scene as the object. In most cases you will want to add a [NetworkObserver](/docs/manual/guides/components/network-observer) component, with a scene condition to your networked objects.

When encountering an error about being unable to find a NetworkObject or RPCLink during a scene change, you likely forgot to add the scene condition.

## 


Managing Visibility

### 


Initial Scene Load

When a client is loading into the game for the first time, the first scene/offline scene loaded is done so by the Unity Scene Manager. This means that clients were not automatically added to the scene when connected. Which also means they do not have visibility of that scene.

Once client connects to a host or server, If you use the **PlayerSpawner** component FishNet provided on the NetworkManager, there is logic in that component that will add the client to the default scene on the Player Objects spawn.

If you decided not to use the **PlayerSpawner** Component provided on the NetworkManger in Fishnet, you will have to either have to load a client into a scene using FishNets SceneManager, or call SceneManger.AddOwnerToDefaultScene() on a Object that you gave that client ownership to.

### 


Adding Client Connections To Scenes

*   When Loading a scene globally or by connection, the SceneManager will automatically place that connection into the scene.
    
*   Once added that client will be able to view all NetworkObjects that are apart of that scene.
    
*   You can add Client Connections to Scenes Manually if the scene is already loaded on the client, by using SceneManager.AddConnectionsToScene();
    

Manually adding and removing client connections is recommended for Power Users only.

### 


Removing Client Connections From Scenes

*   When Unloading a scene from a client, the server will automatically remove the client connection from the scene.
    
*   If you are the host, and you unload the hosts client from a scene, it will only remove the host from the scene and the hosts client will lose visibility. See Host Behaviour for [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details.
    
*   You can remove a client manually from a loaded scene, by using SceneManager.RemoveConnectionsFromScene();