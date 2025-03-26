1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# RollbackManager (Pro Feature)

RollbackManager contains configurations and optimizations for how colliders are sent back in time when using lag compensation.

The RollbackManager must be added and configured properly for lag compensation to function properly. Objects you wish to rollback must contain the [ColliderRollback](/docs/manual/guides/components/colliderrollback) script on them.

## 


Component Settings

Settings _are general settings related to the RollbackManager._[](#settings-are-general-settings-related-to-the-rollbackmanager)

**Bounding Box Layer** when specified is the layer to first test against before rolling back colliders. When a layer is specified a collider will be added to your ColliderRollback objects; because of this, be sure to use a layer which has no physics intersections and is not used for anything else.

**Maximum Rollback Time** is the maxium time colliders may rollback. Using a value of 1f would allow colliders to rollback at most one second in the past, which is a very reasonable amount of time given typical player latencies are less than 100ms.

**Interpolation** is the amount of interpolation you are using on your NetworkTransform components. If you are using rigidbodies with PredictedObject this would be the Spectator Interpolation value.