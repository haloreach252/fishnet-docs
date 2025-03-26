1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkObserver

NetworkObserver uses conditions to determine if a client qualifies to be an observer of an object; any number of conditions may be used. The NetworkObserver component can be used to override the [ObserverManager](/docs/manual/guides/components/managers/observermanager), or add additional conditions onto the object which NetworkObserver is added.

## 


Conditions

There are several included conditions, which may be used together. ObserverCondition may also be inherited from to make your own conditions. When all conditions are true, the object will become visible to the client.

Each condition must be created as a scriptable object, and dropped into the Network Observer component.

**Distance Condition** is true if clients are within specified distance of the object.

**Grid Condition** is similar to DistanceCondition and is true if clients are within specified distance of the object. GridCondition is less accurate but more performant. This condition requires you to place a HashGrid on or beneath your NetworkManager object.

**Scene Condition** is true if the client shares any scenes with the object.

**Match Condition** is true when players or objects share the same match. Both owned and non-owned objects can be added to matches. Objects or players not added to matches will have their data synchronized with everyone, unless prevented by another condition. See the [MatchCondition api](https://firstgeargames.com/FishNet/api/api/FishNet.Component.Observing.MatchCondition.html) for more information on usage.

**Owner Only Condition** is true when a player owns the object. An owner condition will make an object only visible to the owner. If there is no owner, the object will not be visible to any clients.

**Host Only Condition** is true when the player is clientHost. Any connection which is not clientHost will fail this condition.

## 


Component Settings

**Override Type** is used to change how the NetworkObserver component uses the ObserverManager settings. _Add Missing_ will add any conditions from the ObserverManager which are not already on the NetworkObserver. _UseManager_ replaces conditions with those from the manager. _Ignore Manager_ will keep the NetworkObserver conditions, ignoring the ObserverManager entirely.

**Update Host Visibility** will change the visibility of renderers for clientHost when server objects are not visible to the client. If you wish to enable and disable other aspects during a visibility change consider using the NetworkObject.OnHostVisibilityUpdated event.

**Observer Conditions** are which conditions to use.