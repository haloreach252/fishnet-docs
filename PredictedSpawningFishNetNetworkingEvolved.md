1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Predicted Spawning

Predicted spawning an object allows a client to spawn an object locally and begin using networked features immediately, including RPCs.

Currently predicted spawns cannot be nested during the spawning process. We are looking to remove this limitation throughout the development of version 4.

The term predicted spawning also means predicted despawning, where the client may despawn the object locally while awaiting for a server response.

### 


Global Settings

By default predicted spawning is disabled. To enable predicted spawning you must adjust settings on your ServerManager. If you do not already have a ServerManager then you must add one to your NetworkManager object to change settings.

The enabled state of this feature can be set by checking **Allow Predicted Spawning** on the ServerManager. You may also adjust the **Reserved Object Ids** value. To learn more of these visit the [ServerManager component](/docs/manual/guides/components/managers/server-manager) section.

### 


Settings Per Object

Even with predicted spawning enabled globally NetworkObjects must be set to also allow predicted spawning or despawning. This ensures that only the objects you specify may use this feature, allows you to limit predicted spawning the capabilities for the object, and lets you use custom code to further validate or control predicted spawning.

For prefabs or scene objects you wish to allow predicted spawning on add the [PredictedSpawn component](/docs/manual/guides/components/prediction/predictedspawn) to them.

You can inherit the PredictedSpawn component for overrides to customize predicted spawning.

### 


Using Predicted Spawning

Once enabled globally and per your desired objects predicted spawning and despawning may be used on clients as though they were the server. All of the same spawn and despawn methods work, including even specifying who may own the object when spawned.