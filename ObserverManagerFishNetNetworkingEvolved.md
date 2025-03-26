1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# ObserverManager

ObserverManager assists in controlling what network objects each client may see.

ObserverManager is used to globally customize the observer system. Observer conditions within the ObserverManager will be automatically added to NetworkObjects, unless the [NetworkObserver](/docs/manual/guides/components/network-observer) component is set to ignore the manager.

## 


Component Settings

Settings _are general settings related to the ObserverManager._[](#settings-are-general-settings-related-to-the-observermanager)

**Default Conditions** are conditions which will be added to all NetworkObjects by default.

**Update Host Visibility** will hide renderers on networked objects which are hidden to clientHost. When true all networked objects will be visible to the clientHost even if these objects would normally be despawned for the client.