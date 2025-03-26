1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Unloading Scenes

## 


General

Unloading scenes is the same as loading scenes, except to call Unload rather than Load. Scenes can be unloaded by connection, or globally. When unloaded globally scenes will be unloaded for all players. When unloading by connection only the connections specified will unload the scenes.

## 


Unloading Scenes

### 


Global Scenes

*   **Global Scenes** can be unloaded by calling UnloadGlobalScenes() in the SceneManager.
    
*   You cannot unload a global scene with UnloadConnectionScenes() method.
    

Copy

    SceneUnloadData sud = new SceneUnloadData("Town");
    base.NetworkManager.SceneManager.UnloadGlobalScenes(sud);

### 


Connection Scenes

**Connection Scenes** follow the same principle, but has a few method overloads. You can unload scenes for a single connection, multiple connections at once, or unload scenes on the server.

*   The Server will only Unload a connection scene on itself, if all connections have been unloaded from that scene.
    
*   If you wish to unload a scene and all connections, get all the connections in the scene and call unload with those connections. SceneManager.SceneConnections holds all online scenes and the connections in them.
    
*   If you wish to keep a scene loaded on server when unloading all Connections See [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching).
    

Copy

    SceneUnloadData sud = new SceneUnloadData(new string[] { "Main", "Additive") });
    
    //Unload scenes for a single connection.
    NetworkConnection conn = base.Owner;
    base.NetworkManager.SceneManager.UnloadConnectionScenes(conn, sud);
    
    //Unload scenes for several connections at once.
    NetworkConnection[] conns = new NetworkConnection[] { connA, connB };
    base.NetworkManager.SceneManager.UnloadConnectionScenes(conns, sud);
    
    //Unload scenes only on the server.
    //that you don't want all players in.
    base.NetworkManager.SceneManager.UnloadConnectionScenes(sud);

## 


Advanced Info

### 


Behind the "Scenes"

The [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) Class has very detailed XML comments on how the unload process works in detail, if you need to troubleshoot the scene unload process, these comments will help you understand the flow of how a scene loads.

### 


Events

Make sure to check out the [**Scene Events**](/docs/manual/guides/scene-management/scene-events) that you can subscribe to to give better control over your game.