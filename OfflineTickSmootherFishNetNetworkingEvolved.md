1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)
9.  [Tick Smoothers](/docs/manual/guides/components/utilities/tick-smoothers)

# OfflineTickSmoother

The OfflineTickSmoother initializes it's settings using InstanceFinder and can be placed beneath objects which are not networked.

## 


Component Settings

**Misc settings are general settings which do not fit into a category**[](#misc-settings-are-general-settings-which-do-not-fit-into-a-category)

**Automatically Initialize** when true will configure this smoother in Awake using InstanceFinder to listen to network callbacks. When false, you must manually call the Initialize method on this component.

Since a non-networked object cannot be owned there is only one set of smoothing settings, compared to NetworkTickSmoother which can have unique settings if Owner or Spectator.

The remaining settings and uses on this component are exactly the same as the NetworkTickSmoother. Please review the [NetworkTickSmoother](/docs/manual/guides/components/utilities/tick-smoothers/networkticksmoother) documentation for further explanation of usage.