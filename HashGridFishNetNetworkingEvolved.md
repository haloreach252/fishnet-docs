1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)
9.  [ObserverManager](/docs/manual/guides/components/managers/observermanager)

# HashGrid

HashGrid is required when using the [Grid Condition](/docs/manual/guides/components/network-observer). This component is responsible for managing the grid and providing information to grid objects. While grids are less accurate than using the Distance Condition they do provide better performance. HashGrid must be placed on or beneath the NetworkManager object.

## 


Component Settings

**Grid Axes** are which axes to base the grid on. Whichever axis is excluded will not have it's values considered in calculations. For example, if you are developing a 2D game most likely only XY matters, so you would choose the XY axes.

**Accuracy** determines how close a client's [FirstObject](https://firstgeargames.com/FishNet/api/api/FishNet.Connection.NetworkConnection.html#FishNet_Connection_NetworkConnection_FirstObject) must be in units to be considered in range. Note that accuracy is not as precise as using a Distance Condition.