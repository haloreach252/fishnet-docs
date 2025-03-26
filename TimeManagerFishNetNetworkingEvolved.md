1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# TimeManager

TimeManager handles and provides callbacks related to network timing.

## 


Component Settings

Timing _determines frequency of key network activities._[](#timing-determines-frequency-of-key-network-activities)

**Update Order** controls when the TimeManager will invoke its version of Unity callbacks. BeforeTick would be a good option if you wanted to collect input in OnUpdate before the tick occurred.

**Timing Type** controls when data is sent and read. When set to Tick data is only processed on frames which also tick. When Variable is selected data will be sent and read every frame, when available.

**Allow Tick Dropping** will let the client skip ticks when they occur several times over a single frame. This can be useful to prevent the client from running an increasing number of simulations per frame, resulting in more performance loss.

**Maximum Frame Ticks** is shown when Allow Tick Dropping is enabled. This value is the maximum number of ticks that can occur per frame before the client begins dropping ticks to recover performance.

**Tick Rate** is an average of how many times per second the TimeManager will invoke tick events, as well how often data may be sent or received.

**Ping Interval** is how often in seconds a user receives a ping update. A larger ping has a very small chance of server tick synchronization losing accuracy. These changes do not affect prediction.

**Timing Interval** is how many seconds between prediction timing updates. Lower values will result in marginally more accurate timings at the cost of bandwidth.

Physics _determines how physics are handled by the network._[](#physics-determines-how-physics-are-handled-by-the-network)

**Physics Mode** determines how physics are run. _Unity_ will let the engine manage physics. _TimeManager_ simulates physics on ticks. For physics based prediction you must use the _TimeManager_ setting.