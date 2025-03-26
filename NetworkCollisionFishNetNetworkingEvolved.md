1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)
9.  [Network Collider](/docs/manual/guides/components/prediction/network-collider)

# NetworkCollision

NetworkCollision is used to execute collision events for use with prediction.

**Settings** _are general settings related to the component._[](#settings-are-general-settings-related-to-the-component)

**Maximum Simultaneous Hits** is the maximum number of simultaneous hits that the component will check for. You can use this field to customize how many overlapping colliders the component should be able to detect. It should be noted that having too large of a value will decrease its performance. In most cases, the default value of 16 suffices.

**History Duration** determines how long collision history is retained. Lower values optimize memory usage slightly, but may lead to the collision records becoming out of sync on clients with excessively high latency.

**Additional Size** determines the distance in units by which collision traces are extended. This extension helps prevent missed overlaps when colliders do not intersect sufficiently. Depending on the scale used in your game you may want to raise or lower this value.