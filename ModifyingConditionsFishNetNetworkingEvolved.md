1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Observers](/docs/manual/guides/observers)

# Modifying Conditions

Several conditions may be modified at run-time. What can be modified for each condition may vary. I encourage you to view the [API](https://firstgeargames.com/FishNet/api/api/FishNet.Component.Observing.html) to see what each condition exposes.

To change properties on a condition you must access the condition through the [NetworkObserver](/docs/manual/guides/components/network-observer) component.

Copy

    //Below is an example of modifying the distance requirement
    //on a DistanceCondition. This line of code can be called from
    //any NetworkBehaviour. You may also use nbReference.NetworkObserver...
    base.NetworkObserver.GetObserverCondition<DistanceCondition>().MaximumDistance = 10f;

All conditions can be enabled or disabled. When a condition is disabled it's requirements are ignored, as if the condition does not exist. This can be useful for temporarily disabling condition requirements on objects.

Copy

    //The OwnerOnlyCondition is returned and disabled.
    //This allows all players to see the object, rather than just the owner.
    ObserverCondition c = base.NetworkObject.NetworkObserver.GetObserverCondition<OwnerOnlyCondition>();
    c.SetIsEnabled(false);
    //Even though we are returning ObserverCondition type, it could be casted to
    //OwnerOnlyCondition.