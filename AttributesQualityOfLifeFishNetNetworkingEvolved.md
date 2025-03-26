1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Attributes, Quality of Life

There are a variety of attributes which add functionality to speed up development time.

## 


Client

Placing a Client attribute above a method ensures that the method cannot be called unless the local client is active. There are are additional properties which may be added to the attribute for additional functionality.

Copy

     /* The server does not need to play VFX; only
     * play VFX if the client is active.
     * 
     * If this method were called with no client active
     * a warning through be printed. You can change the logging type
     * using the Logging property. 
     * 
     * It's also possible to allow only the owner of the
     * object to call the method by setting RequireOwnership
     * to true; this value is false by default. */
     [Client(Logging = LoggingType.Off, RequireOwnership = true)]
     private void PlayVFX() { }

## 


Server

The Server attribute provides similar features of the Client varient, except will not allow the method to run if the server is not active.

Copy

    /* The server would validate hit results
     * from a client.
     * 
     * Like the Client attribute a warning will be
     * thrown if this is called while the serveris not active.
     * The warning can be changed or disabled by adjusting
     * the Logging property. */
    [Server(Logging = LoggingType.Off)]
    private void ValidateHit() { }

## 


NonSerialized

This attribute is part of the System namespace, and may be used to prevent a field from being serialized over the network when using your own types. It's important to remember that placing NonSerialized over a field will also prevent it from showing in the inspector, nor working for other serializers such as JsonUtility.

Copy

    public class PlayerStats
    {
        public float Health;
        public float MoveSpeed;
        /* In this example ControllerIndex is only used
         * for local multiplayer. This data does not need to be sent
         * over the network so it's been marked with NonSerialized. */
        [System.NonSerialized]
        public int ControllerIndex;
    }