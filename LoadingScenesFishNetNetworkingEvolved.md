1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Loading Scenes

Loading Scenes Video Guide

## 


General

This guide will go over how to setup and load new scenes, how to load into existing scenes, how to replace scenes, and advanced info on what happens behind the "scenes" during a load.

Loading Scenes globally or by connection will add the specified clients connection as an [**Observer**](/docs/manual/guides/observers) to the scenes if utilizing the [**ObserverManagers**](/docs/manual/guides/components/managers/observermanager) Scene Condition, so globally will add all clients as Observers, and by connection will only add the connections specified. - See [**Scene Visibility**](/docs/manual/guides/scene-management/scene-visibility) for more info.

In the Examples below, all SceneManager calls are done inside a NetworkBehaviour class, that is why you can get reference to SceneManager by doing base.SceneManager. If you would like a reference outside of a NetworkBehaviour consider using FishNets [**InstanceFinder**](/docs/manual/guides/instancefinder-guides).SceneManager.

Setup[](#setup)

Before calling the SceneManagers Load Scene functions you will need to setup the load data to tell the [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) how you want it to handle the scene load.

### 


SceneLookupData

[**SceneLookupData**](/docs/manual/guides/scene-management/scene-data/scenelookupdata) is the class used to specify what scene you want the [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) to load. You will not create the lookup data manually and instead use the SceneLoadData constructors that will create the SceneLookupData automatically.

### 


SceneLoadData

When loading a scene in any way, you must pass in an instance of a [**SceneLoadData**](/docs/manual/guides/components/managers/scenemanager) [](/docs/manual/guides/scene-management/scene-data/sceneloaddata)class into the load methods. This class provides the scene manager all of the info it needs to load the scene or scenes properly.

The constructors available for [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata) will automatically create the [**SceneLookupData**](/docs/manual/guides/scene-management/scene-data/scenelookupdata) needed for the SceneManager to handle if you are loading a new scene, or an existing instance of one.

Loading New Scenes[](#loading-new-scenes)

Scenes can be loaded globally or by a collection of client connections.

Loading new Scenes can only be done by Name, you cannot use Handle or Scene References.

### 


Global Scenes

*   Global Scenes can be loaded by calling LoadGlobalScenes() in the SceneManager.
    
*   When loaded globally, scenes will be loaded for all current, and future clients.
    

Copy

    SceneLoadData sld = new SceneLoadData("Town");
    base.SceneManager.LoadGlobalScenes(sld);

### 


Connection Scenes

Connection Scenes follow the same principle, but has a few method overloads.

*   You can load scenes for a single connection, multiple connections at once, or load scenes only on the server in preparation for connections.
    
*   When loading by connection only the connections specified will load the scenes.
    
*   You can add additional connections into a scene at any time.
    

Copy

    SceneLoadData sld = new SceneLoadData("Main");
    
    //Load scenes for a single connection.
    NetworkConnection conn = base.Owner;
    base.SceneManager.LoadConnectionScenes(conn, sld);
    
    //Load scenes for several connections at once.
    NetworkConnection[] conns = new NetworkConnection[] { connA, connB };
    base.SceneManager.LoadConnectionScenes(conns, sld);
    
    //Load scenes only on the server. This can be used to preload scenes
    //that you don't want all players in.
    base.SceneManager.LoadConnectionScenes(sld); 

### 


Loading Multiple Scenes

*   Whether loading globally or by connection, you can load more than one scene in a single method call.
    
*   When loading multiple scenes in one call, the NetworkObjects you put into [**Moved NetworkObjects**](/docs/manual/guides/scene-management/scene-data/sceneloaddata#movednetworkobjects) will be moved to the first valid scene in the list of scenes you tried to load. See Persisting NetworkObjects for more info about keeping NetworkObjects across scenes.
    

Copy

    //Loading Multiple Connections into Multiple Scenes
    string[] scenesToLoad = new string[] {"Main", "Additive"};
    NetworkConnection[] conns = new NetworkConnection[] {connA, connB,connC}
    
    SceneLoadData sld = new SceneLoadData(scenesToLoad);
    base.SceneManager.LoadConnectionScenes(conns, sld);

Loading Existing Scenes[](#loading-existing-scenes)

If the scene is already loaded on the server, and you want to load clients into that instance of the scene. Most likely you will want to lookup that scene by scene reference, or handle to make sure you are getting the exact scene you need.

If you load the scene by name, it will load the connections into the first scene found with that name. If you are utilizing [**Scene Stacking**](/docs/manual/guides/scene-management/scene-stacking), then there may be multiple scenes loaded with the same name. So be alert when loading into existing scenes by name.

You can load clients into scenes that have no other clients in them if you are utilizing [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) **-** the ability to keep a scene loaded with its current state on the server when all clients leave the scene.

### 


Getting References to a Loaded Scene

Here are a few ways to get reference to the scenes that you already loaded using FishNet's **SceneManager**.

#### 


By Event:

Copy

    // Manage your own collection of SceneRefernces/Handles
    // Customize how you want to manage you scene references so its easy
    // for you to find them later.
    List<Scene> ScenesLoaded = new();
    
    public void OnEnable()
    {
        InstanceFinder.SceneManager.OnLoadEnd += RegisterScenes;
    }
    
    public void RegisterScenes(SceneLoadEndEventArgs args)
    {
        //Only Register on Server
        if (!obj.QueueData.AsServer) return;
        
        //if you know you only loaded one scene you could just grab index [0]
        foreach(var scene in args.loadedScenes)
        {
            ScenesLoaded.Add(scene);
        }
    }
    
    public void OnDisable()
    {
        InstanceFinder.SceneManager.OnLoadEnd -= RegisterScene;
    }

#### 


By Connection:

Copy

    //NetworkConnections have a list of Scenes they are currently in. 
    int clientToLookup;
    InstanceFinder.ServerManger.Clients[clientToLookup].Scenes;

#### 


By SceneManager.SceneConnnections:

Copy

    // SceneManager Keeps a Dictionary of All Connection Scenes as the Key
    // and the client connections that are in that scene as the value.
    NetworkConnection conn;
    Scene sceneNeeded;
    
    //Get the scene you need with foreach or use Linq to filter your conditions.
    foreach(var pair in SceneManager.SceneConnections)'
    {
        if(pair.Value.Contains(conn))
        {
            sceneNeeded = pair.Key;
        }
    }

### 


Using Reference to Load Into Existing Instance

Use the methods above to get the reference or handle of a scene, and use that reference or handle to load a client into an existing scene.

Copy

    scene sceneReference;
    NetworkConnection[] conns = new(){connA,connB};
    
    //by reference
    SceneLoadData sld = new(sceneReference);
    base.SceneManager.LoadConnectionScenes(conns,sld);
    
    //by handle
    SceneLoadData sld = new(sceneReference.handle);
    base.SceneManager.LoadConnectionScenes(conns,sld);

Replacing Scenes[](#replacing-scenes)

Fishnet gives the ability to replace scenes that are already loaded on the clients with the new requested scenes to load.

To Replace Scenes you will set the ReplaceScene Option in the SceneLoadData

Replaced scenes will be unloaded before the new scenes are loaded.

Replacing Scenes by Default will replace scenes on both the server and clients. If you would like the server to keep the scene loaded and only replace the scene on the clients - see [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details.

### 


Replace None:

This is the default method when loading, it will ignore the replace options and load the scene in normally.

### 


Replace All:

This will replace all scenes currently loaded in unity, even ones not managed by FishNet's SceneManager.

Copy

    //Replace All Option.
    SceneLoadData sld = new SceneLoadData("DungeonScene");
    sld.ReplaceScenes = ReplaceOption.All;
    
    //This will replace all Scenes loaded by FishNet or outside of FishNet like Unity,
    //and load "DungeonScene"
    SceneManager.LoadGlobalScenes(sld);

### 


Replace Online Only:

This will replace only scenes managed by the SceneManager in FishNet.

Copy

    //Replace Online Only Option.
    SceneLoadData sld = new SceneLoadData("DungeonScene");
    sld.ReplaceScenes = ReplaceOption.OnlineOnly;
    
    //This will replace only scenes managed by the SceneManager in FishNet.
    SceneManager.LoadGlobalScenes(sld);

Advanced Info[](#advanced-info)

### 


Behind the "Scenes"

The [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) Class has very detailed XML comments on how the load process works in detail, if you need to troubleshoot the scene load process, these comments will help you understand the flow of how a scene loads.

### 


Events

Make sure to check out the [**Scene Events**](/docs/manual/guides/scene-management/scene-events) that you can subscribe to to give better control over your game.