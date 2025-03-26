1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Offline Rigidbodies

In some cases you will want the player to be able to interact with non-networked rigidbodies; these require a special component.

While prediction is in use, if you have a rigidbody object in your game that is not synchronized with the network it must contain an OfflineRigidbody component. Please review the [OfflineRigidbody component page](/docs/manual/guides/components/prediction/offlinerigidbody) for more information on it's uses.