1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)
7.  [Scene Data](/docs/manual/guides/scene-management/scene-data)

# SceneUnloadData

The Data Class needed for the SceneManager to know how to handle unloading a scene.

## 


General

When unloading scenes information on what to unload is constructed within the SceneUnloadData class. SceneUnloadData is very similar to SceneLoadData. The API for SceneUnloadData can be found [here](https://firstgeargames.com/FishNet/api/docs/FishNet.Managing.Scened.SceneUnloadData.html).

## 


Default Values

Copy

    //Default Values
    SceneUnloadData sud = new SceneUnloadData()
       {
        SceneLookupDatas = new SceneLookupData[0],
        Params = new UnloadParams()
        {
            ServerParams = new object[0],
            ClientParams = new byte[0]
        },
        Options = new UnloadOptions()
        {
            Mode = ServerUnloadMode.UnloadUnused,
            Addressables = false
        }
    };

SceneLookupDatas[](#scenelookupdatas)

This Array is populated with the scenes you want to unload, depending on the parameters you pass into the SceneUnloadData when constructed.

See [**Unloading Scenes**](/docs/manual/guides/scene-management/unloading-scenes) for examples.

Params[](#params)

Params are an optional way to assign data to your scene loads/unloads. This data will be available within [**Scene Events**](/docs/manual/guides/scene-management/scene-events), Information used in Params can be useful for storing information about the scene load/unload and referencing it later when the scene load/unload completes.

### 


ServerParams

_ServerParams_ are only included on the server side, and are not networked. It is an array of objects, meaning you can send anything you want. However when accessing the Params through event args, you will have to cast the object to the data you want.

### 


ClientParams

_ClientParams_ is a byte array which may contain anything, and will be sent to clients when they receive the load scene instructions. Clients can access the _ClientParams_ within the scene change events.

Options[](#options)

Like with Options in loading, the UnloadOptions offer additional settings when unloading.

### 


Mode

These values will override the AutomaticallyUnload Option that was used when loaded the scene. If you set _AutomaticallyUnload_ to false but specified _ServerUnloadModes.UnloadUnused_ then the scene would be unloaded when emptied.

#### 


ServerUnloadModes.UnloadUnused

*   This is the default setting which will only unload a scene which is no longer used.
    

#### 


ServerUnloadModes.KeepUnused

*   This option will keep the scene loaded on the server if all clients have been removed. See [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details