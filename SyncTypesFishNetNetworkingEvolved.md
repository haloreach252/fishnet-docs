1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# SyncTypes

Like [remote procedure calls](/docs/manual/guides/remote-procedure-calls), SyncTypes are another type of [communication](/docs/manual/general/terminology/communicating). These are fields which automatically synchronize over the network to clients when the server changes them. There are a variety of SyncTypes available: SyncVar, SyncDictionary, SyncList, custom SyncTypes, and more.

When changes are made to a SyncType, only the changes are sent. For example, if you have a SyncList of 10 values and add another, only the just added entry will be sent.

SyncTypes will also [automatically generate serializers](/docs/manual/guides/automatic-serializers-guides) for custom types.

Any changes made to SyncTypes in Awake will be performed on server and client without requiring synchronization. This is a great opportunity to add to lists or dictionaries. If you wish values to be synchronized after initializing use OnStartServer.

Setting a SendRate of 0f will allow SyncTypes to send changes every network tick.

## 


ClientHost Limitations

There is a small limitation with all SyncTypes when running both the client and server in a single build.

While as clientHost, the previous value, when applicable, in callbacks will be the current value if the asServer parameter is false. This is mostly noticed in SyncVars, note the example below.

Copy

    //This example assumes you are acting as clientHost.
    //We will imagine previous value was 10, and next is 20.
    private void _mySyncVar_OnChange(int prev, int next, bool asServer)
    {
        //If asServer if true then the prev value will correctly be 10,
        //with the next being 20.
        
        //If asServer is false then the prev value will be 20, as well the
        //next being 20. This is because the value has already been changed
        //on the server, and the previous value is no longer stored.
        
        DoSomething(prev, next);
    }

There is a fairly simple way to accommodate this scenario if you plan on using clientHost in your game.

Copy

    //This example assumes you are acting as clientHost.
    //We will imagine previous value was 10, and next is 20.
    private void _mySyncVar_OnChange(int prev, int next, bool asServer)
    {
        //Only run the logic using the previous value if being called
        //with asServer true, or if only the client is started.
        if (asServer || base.IsClientOnlyStarted)
            DoSomething(prev, next);
    }