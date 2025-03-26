1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)

# Tick Smoothers

These components smooths a child graphical object over frames between each network tick. These are useful for prediction and smoothing graphics on larger physics steps.

You may put multiple tick smoother components beneath an object if you have several different graphical pieces in your hierarchy you want smoothed. A good example of this is a vehicle where the wheels move independently of the vehicle body.

The smoother will be placed on the graphical object you wish to smooth; this object must not be the same as the target, nor higher in the hierarchy of the target; being a child of the target is fine.

Tick Smoothers are only used by clients. These components will not function when only the server is started.