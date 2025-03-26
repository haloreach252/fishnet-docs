1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkAnimator

NetworkAnimator synchronizes animations across the network.

The NetworkAnimator will automatically synchronize animation changes across the network.

This component does not align with our Client-Side prediction API. You may still use the NetworkAnimator with prediction but the animations likely be updated slightly before the prediction state runs.

You may place as many NetworkAnimators as you like on children or root. When an animator is not specified on the Animator field the first one on the same object is used.

## 


Component Settings

Settings are general settings related to the NetworkAnimator.[](#settings-are-general-settings-related-to-the-networkanimator)

**Animator** field indicates which Animator to synchronize over the network. The referenced animator can be anywhere on the object. You may also change the Animator at runtime using Network Animator API.

**Interpolation** is how many ticks of interpolation. Like the [NetworkTransform](/docs/manual/guides/components/network-transform), the animator will be this number of ticks behind before iterating data. To use tick alignment with a NetworkTransform, use the same value of interpolation as on the NetworkTransform.

**Smooth Floats** will ensure floats are moved over time on those receiving animator updates. This is commonly left true to allow blending between animation trees.

**Client Authoritative** as true allows the owning client to make changes to their animations locally, and those changes will be sent to the server and other clients. While false the server must change animations to have them sent to clients.

**Send To Owner** will only be displayed when _**Client Authoritative**_ is false. While _**Synchronize To Owner**_ is true the server will also send animation changes to the object owner; while false the owner will not get the animation changes by the server. This can be useful if you want to run animations locally in real time on owning clients.

**Synchronized Parameters (pro feature)** allows only specified parameters to be synchronized over the network. This can be useful if some parameters should only be used for the local client, or do not neccesarily need to be networked.

## 


Runtime

The NetworkAnimator will detect values, layer weights, and speed changes automatically, and synchronize these changes efficiently.

However, most projects also depend on using crossfade, play, and other common Animator APIs.

To synchronize these actions over the network you will simply call each desired method on your NetworkAnimator reference.

Copy

    //This will perform Play on your animator, and synchronize the
    //action over the network.
    _myNetworkAnimator.Play(stringOrHash);

There are several more common methods in our NetworkAnimator component that you will want to use. To see all methods you're encouraged to view our [API](/docs/manual/api) or simply open the NetworkAnimator source file.

Here are some examples of commonly used methods.

Copy

    _myNetworkAnimator.SetTriger(...)
    _myNetworkAnimator.ResetTriger(...)
    _myNetworkAnimator.CrossFade(...)

Other less commonly used actions are **SetController** and **SetAnimator.** You are encouraged to review the API on these when using, or even the XML when calling the method.