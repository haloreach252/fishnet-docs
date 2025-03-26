1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# SceneManager

SceneManager handles networking scenes between the server and clients, including updating active scenes, addressable scenes, provide helpful callbacks, and more.

The callbacks within the SceneManager are informative and quite useful, well worth looking into!

## 


Component Settings

Settings _are general settings related to the SceneManager._[](#settings-are-general-settings-related-to-the-scenemanager)

**Scene Processor** determins how scene loads occur. When left empty the default scene processor is used. For more information on scene processing and addressables see [here.](/docs/manual/guides/scene-management/custom-scene-processors/addressables)

**Light Probe Updating** controls how light probes are updated after scenes are loaded.

**Move Client Host Objects** will move objects visible to clientHost to a temporary scene rather than let them be destroyed when a scene is unloaded. Objects are then destroyed next tick by the clientHost. This ensures that server and client side callbacks will work properly on the moved objects.

**Set Active Scene** will allow the SceneManager to pick which scene to set as the active scene when loading and unloading scenes. By default global scenes are used, and if no global scenes then the clients single scene.