1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# NetworkManager

NetworkManager is an essential component for running the client and server. It acts as a bridge between core components and configuring your network.

Although this component manages the network, itself should not be a networked object, and must not contain a Network Object component on the same object, or as a parent of.

## 


Component Settings

**Settings** _are basic settings related to the NetworkManager._[](#settings-are-basic-settings-related-to-the-networkmanager)

**Run In Background** allows the application to run in the background when true. Running in the background is often essential for clients, and especially for server.

**Don't Destroy On Load** will ensure the Network Manager persist between scene changes. If you are using only one Network Manager it's best to leave this true.

**Persistence** specifies how to behave when multiple NetworkManagers are spawned at once.

Logging c_ontrols how network logging is configured._[](#logging-controls-how-network-logging-is-configured)

**Logging** lets you specify what actions to log for builds, editor, and headless. When the field is not populated default logging settings are used. To make a custom logging settings open your create menu -> Fish-Networking -> Logging -> Logging Configuration.

Prefabs _is for network prefab settings._[](#prefabs-is-for-network-prefab-settings)

**Spawnable Prefabs** dictates which prefabs collection to use for networked objects. By default this field is automatically set to DefaultPrefabObjects; you can however make your own PrefabObjects class with customized rules and applications.

**Object Pool** is which object pooling script to use. When not set DefaultObjectPool is added automatically. You may inherit from ObjectPool to create your own.

**Refresh Default Prefabs** while true will refresh the DefaultPrefabCollection every time play mode is entered. This is generally not needed as true, but can be useful if your prefab collection is regularly becoming corrupted through symlinks.