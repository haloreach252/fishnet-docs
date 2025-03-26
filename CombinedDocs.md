# FishNet Documentation



---

# A P I Fish Net Networking Evolved

1.  [Manual](/docs/manual)

# API

Fish-Networking API can be found [here](https://firstgeargames.com/FishNet/api/api/index.html).


---

# Addressables Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)
7.  [Custom Scene Processors](/docs/manual/guides/scene-management/custom-scene-processors)

# Addressables

This guide assumes you know how to load and unload addressable scenes without Fish-Networking. Below describes how to use your addressables scene logic with the Fish-Networking SceneManager.

There are a variety of ways to load and unload addressable scenes; because of this you are provided an easy way to create your own logic for accessing addressables. To begin using addressables with the SceneManager create a new script, and inherit from **DefaultSceneProcessor**.

LoadOptions and UnloadOptions have an addressables boolean you may utilize to know if your scene change is using addressables.

The DefaultSceneProcessor script inherits from SceneProcessorBase to implement the default scene changing functionality. Your custom script inherits from DefaultSceneProcessor because often only some of the logic needs to be changed, and this allows you to only override the differences.

As mentioned what you need to modify may vary, but most developers find themselves overriding the following methods.

Copy

    public abstract void BeginLoadAsync(string sceneName, LoadSceneParameters parameters);
    public abstract void BeginUnloadAsync(Scene scene);
    public abstract bool IsPercentComplete();
    public abstract float GetPercentComplete();
    public abstract IEnumerator AsyncsIsDone();

Each method contains XML documentation to provide you a better description.

After you have completed your implementation of DefaultSceneProcessor add your newly created component to your NetworkManager object.

If the _SceneManager_ component is not added to the NetworkManager object yet, add that as well. Drag your DefaultSceneProcessor implementation into the _SceneProcessor_ field on the SceneManager.

You are all set now! Whenever Fish-Networking loads or unloads a scene your processor will be used and you can control the logic.


---

# Advanced Controls Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)

# Advanced Controls

This guide supplements the basic prediction guide by showing how to introduce more complexities to your controls.

Be sure to review the previous guides in this section before reviewing this page.

## 


Guide Goal

Implementing additional features into your prediction is much like you would code in a single player game, only remembering to reconcile anything that could de-synchronize the prediction.

In this guide a psuedo ground check before a jump will be added, as well a sprint function.

## 


Sprinting and Ground Checks

First the ReplicateData needs to be updated to contain our sprint action, which will rely on a stamina mechanic. Not much changed other than we added the Sprint boolean and set it using the constructor.

Copy

    public struct ReplicateData : IReplicateData
    {
        public bool Jump;
        public bool Sprint;
        public float Horizontal;
        public float Vertical;
        public ReplicateData(bool jump, bool sprint, float horizontal, float vertical) : this()
        {
            Jump = jump;
            Sprint = sprint;
            Horizontal = horizontal;
            Vertical = vertical;
        }
    
        private uint _tick;
        public void Dispose() { }
        public uint GetTick() => _tick;
        public void SetTick(uint value) => _tick = value;
    }

After updating the ReplicateData we need to poll for the sprint key when creating the data, like you would in most games.

We are re-using methods from our previous guides so much of this should be familiar.

Copy

    private ReplicateData CreateReplicateData()
    {
        if (!base.IsOwner)
            return default;
    
        //Build the replicate data with all inputs which affect the prediction.
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
    
        /* Sprint if left shift is held.
        * You do not necessarily have to perform security checks here.
        * For example, it was mentioned sprint will rely on stamina, we
        * are not checking the stamina requirement here. You certainly could
        * as a precaution but this is only building the replicate data, not where
        * the data is actually executed, which is where we want
        * the check. */
        bool sprint = Input.GetKeyDown(KeyCode.LeftShift);
        
        ReplicateData md = new ReplicateData(_jump, sprint, horizontal, vertical);
        _jump = false;
    
        return md;
    }

Declare a stamina float in your class.

Copy

    //Current stamina for the player.
    private float _stamina;

Now use our new Sprint bool and stamina field to apply sprinting within the replicate method.

Copy

    [Replicate]
    private void RunInputs(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {
        float delta = (float)base.TimeManager.TickDelta;
        //Regenerate stamina at 3f per second.
        _stamina += (3f * delta);
        //How much it cost to use sprint per delta.
        //This causes sprint to use stamina twice as fast
        //as the stamina recharges.
        float sprintCost = (6f * delta);
        Vector3 forces = new Vector3(data.Horizontal, 0f, data.Vertical) * _moveRate;
        //If sprint is held and enough stamina exist then multiple forces.
        if (data.Sprint && _stamina >= sprintCost)
        {    
            //Reduce stamina by cost.
            _stamina -= sprintCost;
            //Increase forces by 30%.
            forces *= 1.3f;
        }
        
    
        /* You should check for any changes in replicate like we do
        * with stamina. Recall how it was said checking stamina when
        * gathering the inputs is not so important, but doign so in the replicate
        * is what grants server authority, as well makes prediction function
        * properly with corrections and rollbacks. */
        
        /* Now check if to jump. IsGrounded() does not exist, we're going to
        * pretend it uses a raycast or overlap to check. */
        if (data.Jump && IsGrounded())
        {
            Vector3 jmpFrc = (Vector3.up * _jumpForce);
           PredictionRigidbody.AddForce(jmpFrc, ForceMode.Impulse);
        }
        
        //Rest of the code remains the same.
    }

If a value can affect your prediction do not store it outside the replicate method, unless you are also reconciling the value. An exception applies if you are setting the value inside your replicate method.

This is a very important detail to remember, and is discussed further below.

Reconciling only a rigidbody state is very simple.

Copy

    [Reconcile]
    private void ReconcileState(ReconcileData data, Channel channel = Channel.Unreliable)
    {
        //Call reconcile on your PredictionRigidbody field passing in
        //values from data.
        PredictionRigidbody.Reconcile(data.PredictionRigidbody);
    }

If you are using multiple rigidbodies you at the very least need to reconcile their states as well. You can do so quickly by adding a RigidbodyState for each rigidbody to your reconcile.

If you are also applying forces to these rigidbodies be sure to use PredictionRigidbody with them, and reconcile the PredictionRigidbody instead of RigidbodyState.

## 


Changes To Reconcile

Because objects can reconcile to previous states it's fundamental to also reconcile any values stored outside the replicate method. Imagine if you had 10f stamina, enough to sprint, and did so successfully on the server and owner. After your sprint you only had 1f stamina, not enough to sprint further.

If you were to reconcile without resetting stamina to it's previous values then you would still be at 1f stamina after reconciling. Your replayed inputs, which previously allowed the sprint, would not sprint because you now lacked the needed stamina. In result of this, you would have a de-synchronization which would most likely be seen as jitter.

Including more variables in your prediction is fortunately easy enough. All you have to do is update your reconcile to include states or your new values or variables.

Added to our ReconcileData structure is a Stamina float.

Copy

    public struct ReconcileData : IReconcileData
    {
        public PredictionRigidbody PredictionRigidbody;
        public float Stamina;
        
        public ReconcileData(PredictionRigidbody pr, float stamina) : this()
        {
            PredictionRigidbody = pr;
            Stamina = stamina;
        }
    
        private uint _tick;
        public void Dispose() { }
        public uint GetTick() => _tick;
        public void SetTick(uint value) => _tick = value;
    }

Then of course we must include the current value of stamina within our created reconcile data.

Copy

    public override void CreateReconcile()
    {
        ReconcileData rd = new ReconcileData(PredictionRigidbody, _stamina);
        ReconcileState(rd);
    }

Very last you must utilize the new reconcile data to reset the stamina state.

Copy

    [Reconcile]
    private void ReconcileState(ReconcileData data, Channel channel = Channel.Unreliable)
    {
        PredictionRigidbody.Reconcile(data.PredictionRigidbody);
        _stamina = data.Stamina;
    }

With minor additions to the code you now have an authoritative ground check as well a stamina driven sprint. Just like that, tic-tac-toe, a winner.


---

# Attributes Quality Of Life Fish Net Networking Evolved

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


---

# Authenticator Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# Authenticator

Authenticators are an additional layer of security. A client must pass the authenticator in order to communicate with the game server.

Authenticator logic can be fully customized by inheriting from the _**Authenticator**_ script, and placing your created authenticator within the [Server Manager component](/docs/manual/guides/components/managers/server-manager).


---

# Automatic Serializers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Automatic Serializers

Anytime you use a type within a [communication](/docs/manual/general/terminology/communicating) Fish-Networking automatically recognizes you wish to send the type over the network, and will create a serializer for it. You do not need to perform any extra steps for this process, but if you would like to exclude fields from being serialized use _\[System.NonSerialized\]_ above the field.

For example, _Name_ and _Level_ will be sent over the network but not _Victories_.

Copy

    public class PlayerStat
    {
        public string Name;
        public int Level;
        [System.NonSerialized]
        public int Victories;
    }
    
    [ServerRpc]
    public void RpcPlayerStats(PlayerStat stats){}

Fish-Networking is also capable of serializing inherited values. In the type _MonsterStat_ below, _Health, Name, and Level_ will automatically serialize.

Copy

    public class Stat
    {
        public float Health;
    }
    public class MonsterStat : Stat
    {
        public string Name;
        public int Level;
    }

In very rare cases a data type cannot be automatically serialized; a _Sprite_ is a good example of this. It would be very difficult and expensive to serialize the actual image data and send that over the network. Instead, you could store your sprites in a collection and send the collection index, or perhaps you could create a [custom serializer](/docs/manual/guides/custom-serializers-guides).


---

# Bandwidth Display Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)

# BandwidthDisplay

Using this component in combination with the [Statistics Manager](/docs/manual/guides/components/managers/statisticsmanager) will show bandwidth being used by Fish-Networking.

## 


Component Settings

**Color** is which color to display results as.

**Placement** is what part of the screen to display results.

**Show Outgoing** will display bandwidth used by sending data when checked.

**Show Incoming** will display bandwidth received when checked.


---

# Broadcast Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# Broadcast

Broadcasts allow you to send messages to one or more objects without them requiring a NetworkObject component. This could be useful for communicating between objects which are not necessarily networked, such as a chat system.

Like Remote Procedure Calls, broadcasts may be sent reliably or unreliably. Data using broadcasts can be sent from either from the client to the server, or server to client(s). Serializers are automatically generated for Broadcasts as well.

Broadcasts must be structures, and implement _IBroadcast_. Below demonstrates what values a chat broadcast may possibly contain.

Copy

    public struct ChatBroadcast : IBroadcast
    {
        public string Username;
        public string Message;
        public Color FontColor;
    }

Since broadcasts are not linked to objects they must be sent using the ServerManager, or ClientManager. When sending to the server you will send using ClientManager, and when sending to clients, use ServerManager.

Here is an example of sending a chat message from a client to the server.

Copy

    public void OnKeyDown_Enter(string text)
    {
        //Client won't send their username, server will already know it.
        ChatBroadcast msg = new ChatBroadcast()
        {
            Message = text,
            FontColor = Color.white
        };
        
        InstanceFinder.ClientManager.Broadcast(msg);
    }

Sending from the server to client(s) is done very much the same but you are presented with more options. For a complete list of options I encourage you to view the [API](https://firstgeargames.com/FishNet/api/api/FishNet.Managing.Server.ServerManager.html#methods). Here is an example of sending a broadcast to all clients which have visibility of a specific client. This establishes the idea that clientA sends a chat message to the server, and the server relays it to other clients which can see clientA. In this example clientA would also get the broadcast.

Copy

    //When receiving broadcast on the server which connection
    //sent the broadcast will always be available.
    public void OnChatBroadcast(NetworkConnection conn, ChatBroadcast msg, Channel channel)
    {
        //For the sake of simplicity we are using observers
        //on conn's first object.
        NetworkObject nob = conn.FirstObject;
        
        //The FirstObject can be null if the client
        //does not have any objects spawned.
        if (nob == null)
            return;
            
        //Populate the username field in the received msg.
        //Let us assume GetClientUsername actually does something.
        msg.Username = GetClientUsername(conn);
            
        //If you were to view the available Broadcast methods
        //you will find we are using the one with this signature...
        //NetworkObject nob, T message, bool requireAuthenticated = true, Channel channel = Channel.Reliable)
        //
        //This will send the message to all Observers on nob,
        //and require those observers to be authenticated with the server.
        InstanceFinder.ServerManager.Broadcast(nob, msg, true);
    }

Given broadcasts are not automatically received on the object they are sent from you must specify what scripts, or objects can receive a broadcast. As mentioned previously, this allows you to receive broadcast on non-networked objects, but also enables you to receive the same broadcast on multiple objects.

While our example only utilizes one object, this feature could be useful for changing a large number of conditions in your game at once, such as turning off or on lights without having to make them each a networked object.

Listening for a broadcast is much like using events. Below demonstrates how the client will listen for data from the server.

Copy

    private void OnEnable()
    {
        //Begins listening for any ChatBroadcast from the server.
        //When one is received the OnChatBroadcast method will be
        //called with the broadcast data.
        InstanceFinder.ClientManager.RegisterBroadcast<ChatBroadcast>(OnChatBroadcast);
    }
    
    //When receiving on clients broadcast callbacks will only have
    //the message. In a future release they will also include the
    //channel they came in on.
    private void OnChatBroadcast(ChatBroadcast msg, Channel channel)
    {
        //Pretend to print to a chat window.
        Chat.Print(msg.Username, msg.Message, msg.FontColor);
    }
    
    private void OnDisable()
    {
        //Like with events it is VERY important to unregister broadcasts
        //When the object is being destroyed(in this case disabled), or when
        //you no longer wish to receive the broadcasts on that object.
        InstanceFinder.ClientManager.UnregisterBroadcast<ChatBroadcast>(OnChatBroadcast);
    }

As a reminder, a receiving method on the server was demonstrated above. The method signature looked like this.

Copy

    public void OnChatBroadcast(NetworkConnection conn, ChatBroadcast msg)

With that in mind, let's see how the server can listen for broadcasts from clients.

Copy

    private void OnEnable()
    {
        //Registering for the server is exactly the same as for clients.
        //Note there is an optional parameter not shown, requireAuthentication.
        //The value of requireAuthentication is default to true.
        //Should a client send this broadcast without being authenticated
        //the server would kick them.
        InstanceFinder.ServerManager.RegisterBroadcast<ChatBroadcast>(OnChatBroadcast);
    }
    
    private void OnDisable()
    {
        //There are no differences in unregistering.
        InstanceFinder.ServerManager.UnregisterBroadcast<ChatBroadcast>(OnChatBrodcast);
    }

If you would like to view a working example of using Broadcast view the **PasswordAuthentictor.cs** file within the examples folder.


---

# Client Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# ClientManager

ClientManager provides settings unique to clients.

## 


Component Settings

Settings _are general settings related to the ClientManager._[](#settings-are-general-settings-related-to-the-clientmanager)

**Remote Server Timeout** decides if the client should disconnect when the server seems unresponsive. This feature can be set to disabled, work in development and releases, or only releases.

*   **Timeout** is how long the server must be unresponsive before they are kicked.
    

**Change Frame Rate** while true will change the frame rate limitation when acting as server only.

*   **Frame Rate** is the frame rate to use while only the client is active. When both server and client are active the higher of the two frame rates will be used.


---

# Collider Rollback Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# ColliderRollback

ColliderRollback allows an objects colliders to be rolled back for lag compensation.

Settings _are general settings related to ColliderRollback._[](#settings-are-general-settings-related-to-colliderrollback)

**Bounding Box** configures how a bounding box is added to the object. When set to Disabled a bounding box will not be added. Additional settings are displayed when not set to Disabled.

*   **Physics Type** is which type of physics you plan on rolling back, and determines if a Physics collider is added, or Physics2D collider.
    
*   **Bounding Box Size** determines how large of a bounding box to add. Typically a value three times larger than the world space of your object is sufficient. For example, if your object is a Vector3.one cube, this value would Vector3(3f, 3f, 3f). If an object is exceptionally fast moving consider making this larger.
    

**Collider Parents** are transforms you wish to send back in time when performing a rollback. For best results put your hitboxes on their own transform, which is a child of the object the hitbox is for. A setup example is provided as a demo within FishNet\\Demos\\ColliderRollback.


---

# Communicating Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)
5.  [Terminology](/docs/manual/general/terminology)

# Communicating

There are a variety of ways to send communications between server and clients.

Below are several terms you will become familiar with when wanting to send data.

## 


SyncTypes

SyncTypes reside on objects and are data driven variables or collections. SyncTypes send at adjustable intervals. When a SyncType is modified on an object the changes are automatically sent from the server to clients. Clients will receive the changes locally on the same object. A great example is a health variable. You may update the health variable as a player takes damage, and the new values will be sent to clients.

## 


Broadcasts

Unlike states, broadcasts are not object bound. Broadcasts can be used for any number of tasks but more commonly preferred for communicating data groups between server and clients. Broadcasts can be received and sent from anywhere in your code.

## 


Remote Procedure Calls

Remote Procedure Calls(RPCs) are another object bound communication type. While SyncTypes are used to synchronize variables, RPCs allow you to run logic on server and clients. RPCs are not limited to an interval like states, RPCs are sent immediately.

## 


Channel

Two channels are supported, Reliable and Unreliable. Data sent reliably is guaranteed to arrive and be processed in the order it was sent. Unreliable sends use less bandwidth but can infrequently arrive out of order, or not at all.

## 


Eventual Consistency

Some features of Fish-Networking internally use eventual consistency; an example of this are unreliable SyncVars or the NetworkTransform component. These features use the unreliable channel to send datas to consume less bandwidth and provide better performance, but you can still use them knowing that even if data is dropped or arrives out of order the features will eventually resolve the desynchronizations automatically.


---

# Configuring Network Object Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Configuring NetworkObject

Setting up the NetworkObject inspector for prediction is mandatory for using prediction methods in scripts belonging to the NetworkObject.

All of the current options for the NetworkObject inspector are shown below. There are many but many will not be seen depending on your setup, and most are just there to provide you more fine-tuning for your game or setup.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252F8IWfdQkXqyEocN98osSc%252Fimage.png%3Falt%3Dmedia%26token%3D35dc1756-dca6-436f-816e-4204c3fd38af&width=768&dpr=4&quality=100&sign=c7bafd6c&sv=2)

To begin you must first choose to Enable Prediction. Next you will set the Prediction Type. If you are using a rigidbody or rigidbody2D set the prediction type accordingly. Other is used for non-physics such as character controllers.

## 


State Forwarding

State forwarding will allow the same inputs to run on all clients as they do on the server. This can be useful if you want all clients and server to run the same input based logic, similar to if the client or server owns the object. State forwarding is more CPU intensive as it means a state buffer must be kept, and the object must reconcile to make corrections as well re-run past states.

Even with the overhead state forwarding is often the most preferred approach because of the fact you do gain the ability to run code identical to how the client and server ran it, resulting in a more reliable simulation and potentially easier coding approach.

When state forwarding is disabled only the owner and server will run the inputs, and only the owner will keep the buffer for objects they own. This also means you must forward any information to clients that is essential to them displaying actions on non-owned objects, such as using a NetworkAnimator to now relay animations, or using RPCs to send gun fire audio. Movement is also not forwarded, so you may want to attach a NetworkTransform and specify it within the NetworkTransform field. Specifying the NetworkTransform will simply try to configure it to prediction based on your other NetworkObject inspector settings. If you are finding this is causing issues you can simply leave the field empty.

## 


Graphical Object

This is the object which holds your graphics for the NetworkObject. By graphics, this means anything which holds visual representation that you would likely want smoothed between ticks, as well corrections from any potential de-synchronizations. It's very much worth mentioning you can leave this field empty and you will lose view additional options, such as Smoothing.

When using a graphical object it's very important to remember that you do not want any components on or beneath it that could negatively be affected by smoothing, such as a capsule to move your player. During a network tick prediction methods will run, and the TimeManager.TickDelta is used as the frame delta. Think of this as the same as if you were creating a client-authoritative physics controller while using FixedUpdate to move. Even as client-authoratitive, if you were to smooth the root the distance traveled during the FixedUpdate then your root would be in a different spot than where the physics engine left it. In result the movement and collision system wouldn't behave quite right. With all of that said, typically your colliders and triggers which affect gameplay or transforming the NetworkObject should be on the same GameObject as your NetworkObject. Or at the very least, not within the graphical object.

To understand more what this does read the component information [here](/docs/manual/guides/components/network-object). Detaching the graphical object is a supplemental feature which might be useful depending on your setup. The default is keeping the graphical a child, where it is. When this is true the graphical object rolls back to it's transform properties after the tick, then smooths to the transform properties it was after the tick. This is done so you can run lower tick rates and have smooth transform updates rather than everything stepping to whatever your tick rate delta is.

However, keeping the graphical object attached could be problematic for certain animation setups, or even cameras. Third party assets often do not expect transforms to teleport back and then be smooth to their destination over time, and in result you might see some funky outcomes of this action. Cameras as well can display what appears to be stuttering or jitter of your graphical object, even though it's completely fine. By detaching the graphical object it is no longer rolled back after the tick, and it simply exists in world space moving towards the proper goal over the duration of a tick. In most scenarios detaching would likely be better but there is always a chance it's not right for you, hence the default of staying attached.

## 


Smoothing

The smoothing options are only present when a graphical object is set. Most of these settings are explained well on the same NetworkObject component information page linked above.

There are certain cases where you may want to customize smoothing to control what is actually smoothed, versus what you want to control yourself. That's where the smoothed properties come in. You will notice there is a smoothed properties for if you are the owner of the object, or a spectator(not owner). In a number of cases we've seen developers wanting to self smooth things such as rotation while letting FishNet handle the position and scale. In such a scenario you would just untick rotation from the smoothed properties.

Changing the smoothing has absolutely no affect on the prediction itself, at least it shouldn't assuming you utilized the previous notes of graphical object.

Adaptive Interpolation under Spectator options determines the level of interpolation on spectated objects. Setting this to lower values ultimately means less interpolation, and in result a larger chance that a de-synchronization will be more apparent from a visual stand point. A higher value of course means more interpolation, and much less chance of seeing the effects of a de-synchronization. Whichever you use for this keep your game type in mind, or just play around with the settings under some latency until you see what you like. The adaptive interpolation API is also exposed letting you tweak it at runtime, and we have components that do just this to help you get that perfect feel for your game.


---

# Configuring Prediction Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Configuring PredictionManager

The PredictionManager is responsible for global prediction settings, and other prediction related information.

You do not necessarily even need to add it to your NetworkManager object, but doing so does offer you to alter default settings.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FfPHU2oCmQX0TjiB0W022%252Fimage.png%3Falt%3Dmedia%26token%3D2211e67f-2df5-4434-9c63-81fea39b4768&width=768&dpr=4&quality=100&sign=1acf20d9&sv=2)

## 


Interpolation

Depending on your game type you may want to adjust the default client and server interpolation. The tooltips provide helpful information, but in short more interpolation means more resilience against network instability at the cost of larger delays between running actions.

Having more interpolation also means reducing the chances of data having to predict data when it is expected to be known. There's a variety of ways to know if data is confirmed, predicted, or in the future; this topic is covered later.

Client interpolation indicates how many ticks inputs from the server(and other clients) are held before they are run.

For casual games an interpolation of 2-3 may be desired to drastically improve the likeliness inputs will always be available to run. This will of course add on a delay to when those inputs are run, so perhaps for fast paced games a value of 1 would be better.

Server interpolation is much the same but typically should be a lower value. This is how much of a buffer the server tries to hold for inputs, resulting in the server not running them after a number of ticks equal to the specified interpolation.

## 


Excessive Replicate Dropping

Typically speaking the server will never have more than it's Server Interpolation +/- 1 in queue. However, there is a chance if the client is having network issues and is sending inputs in burst the queue could for example go from 0 to 5, if 5 of clients inputs came through at once.

When the server queued inputs exceed the maximum it will begin to drop old values. This protects the server against an allocation attack and also prevents cheating by the client trying to send extra inputs.

You may disable dropping of excessive replicates but this opens your game up to cheating, as multiple replicates will be run per tick on the server to consume extras. There is still a generous hard-coded value of the maximum amount of replicates which may be queued up hidden to you; this is to protect from allocation attacks.


---

# Configuring Time Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Configuring TimeManager

Very little of the TimeManager has to be configured for prediction.

When using prediction it is essential that Fish-Networkings timing system is used. By default Unity's timing is used, but this can be changed on the TimeManager component.

Add the TimeManager component to your NetworkManager if it does not already exist.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FKx9CjQrnffjWsdK1u8g2%252Fimage.png%3Falt%3Dmedia%26token%3D7da036d3-43f2-4c0d-9597-3f3bbc1d85e5&width=768&dpr=4&quality=100&sign=ab4bfcfe&sv=2)

Once added change the Physics Mode to **Time Manager**, and you are done.


---

# Controlling An Object Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)

# Controlling An Object

Learn how to create a predicted object that the owner or server can control.

## 


Data Structures

Implementing prediction is done by creating a replicate and reconcile method, and making calls to the methods accordingly.

Your replicate method will take inputs you wish to run on the owner, server, and other clients if using state forwarding. This would be any input needed for your controller such as jumping, sprinting, movement direction, and could even include other mechanics such as holding a fire button.

The reconcile method takes a state of the object after a replicate is performed. This state is used to make corrections in the chance of de-synchronizations. For example, you may send back health, velocity, transform position and rotation, so on.

It's also worth mentioning if you are going to allocate in your structures it could be beneficial to utilize the Dispose callback, which will run as the data is being discarded.

Here are the two structures containing basic mechanics for a rigidbody.

Copy

    public struct ReplicateData : IReplicateData
    {
        public bool Jump;
        public float Horizontal;
        public float Vertical;
        public ReplicateData(bool jump, float horizontal, float vertical) : this()
        {
            Jump = jump;
            Horizontal = horizontal;
            Vertical = vertical;
        }
    
        private uint _tick;
        public void Dispose() { }
        public uint GetTick() => _tick;
        public void SetTick(uint value) => _tick = value;
    }
    
    public struct ReconcileData : IReconcileData
    {
        //PredictionRigidbody is used to synchronize rigidbody states
        //and forces. This could be done manually but the PredictionRigidbody
        //type makes this process considerably easier. Velocities, kinematic state,
        //transform properties, pending velocities and more are automatically
        //handled with PredictionRigidbody.
        public PredictionRigidbody PredictionRigidbody;
        
        public ReconcileData(PredictionRigidbody pr) : this()
        {
            PredictionRigidbody = pr;
        }
    
        private uint _tick;
        public void Dispose() { }
        public uint GetTick() => _tick;
        public void SetTick(uint value) => _tick = value;
    }
    

Learn more about using [PredictionRigidbody](/docs/manual/guides/prediction/predictionrigidbody).

## 


Preparing To Call Prediction Methods

Typically speaking you would want to run your replicate(or inputs) during OnTick. When you send the reconcile depends on if you are using physics bodies or not.

When using physics bodies, such as a rigidbody, you would send the reconcile during OnPostTick because you want to send the state after the physics have simulated your replicate inputs. See the [TimeManager API](https://firstgeargames.com/FishNet/api/api/FishNet.Managing.Timing.TimeManager.html#FishNet_Managing_Timing_TimeManager_OnPostTick) for more details on tick and physics event callbacks.

Non-physics controllers can also send in OnTick, since they do not need to wait for a physics simulation to have the correct outcome after running inputs.

The code below shows which callbacks and API to use for a rigidbody setup.

You may need to modify move and jump forces depending on the shape, drag, and mass of your rigidbody.

Copy

    //How much force to add to the rigidbody for jumps.
    [SerializeField]
    private float _jumpForce = 8f;
    //How much force to add to the rigidbody for normal movements.
    [SerializeField]
    private float _moveForce = 15f;
    //PredictionRigidbody is set within OnStart/StopNetwork to use our
    //caching system. You could simply initialize a new instance in the field
    //but for increased performance using the cache is demonstrated.
    public PredictionRigidbody PredictionRigidbody;
    //True if to jump next replicate.
    private bool _jump;
    
    private void Awake()
    {
        PredictionRigidbody = ObjectCaches<PredictionRigidbody>.Retrieve();
        PredictionRigidbody.Initialize(GetComponent<Rigidbody>());
    }
    private void OnDestroy()
    {
        ObjectCaches<PredictionRigidbody>.StoreAndDefault(ref PredictionRigidbody);
    }
    public override void OnStartNetwork()
    {
        base.TimeManager.OnTick += TimeManager_OnTick;
        base.TimeManager.OnPostTick += TimeManager_OnPostTick;
    }
    
    public override void OnStopNetwork()
    {
        base.TimeManager.OnTick -= TimeManager_OnTick;
        base.TimeManager.OnPostTick -= TimeManager_OnPostTick;
    }

## 


Calling Prediction Methods

For our described demo, below is how you would gather input for your replicate and reconcile methods.

Update is used to gather inputs which are only fired for a single frame. Ticks do not occur every frame, but rather at the interval of your TickDelta, much like FixedUpdate works. While the code below only uses Update for single frame inputs there is nothing stopping you from using it for held inputs as well.

Copy

    private void Update()
    {
        if (base.IsOwner)
        {
            if (Input.GetKeyDown(KeyCode.Space))
                _jump = true;
        }
    }

OnTick will now be used to build our replicate data. A separate method of 'CreateReplicateData' is not needed to create the data but is done to organize our code better.

When attempting to create the replicate data we return with default if not the owner of the object. Server receives and runs inputs from the owner so it does not need to create datas, and when clients do not own an object they will get the input for it from the server, as forwarded by other clients if using state forwarding. When not using state forwarding default should still be used in this scenario, but clients will not run replicates on non-owned objects. You can also run inputs on the server if there is no owner; using base.HasAuthority would probably be best for this. See [Checking Ownership](/docs/manual/guides/ownership#checking-ownership) for more information.

Copy

    private void TimeManager_OnTick()
    {
        RunInputs(CreateReplicateData());
    }
    
    private ReplicateData CreateReplicateData()
    {
        if (!base.IsOwner)
            return default;
    
        //Build the replicate data with all inputs which affect the prediction.
        float horizontal = Input.GetAxisRaw("Horizontal");
        float vertical = Input.GetAxisRaw("Vertical");
        ReplicateData md = new ReplicateData(_jump, horizontal, vertical);
        _jump = false;
    
        return md;
    }

Now implement your replicate method. The name may be anything but the parameters shown are required. The first is what we pass in, the remainder are set at runtime. Although, you absolutely may change the default channel used in the parameter or even at runtime.

For example, it could be beneficial to send an input as reliable if you absolutely want to ensure it's not dropped due to network issues.

Copy

    [Replicate]
    private void RunInputs(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {
        /* ReplicateState is set based on if the data is new, being replayed, ect.
        * Visit the ReplicationState enum for more information on what each value
        * indicates. At the end of this guide a more advanced use of state will
        * be demonstrated. */
        
        //Be sure to always apply and set velocties using PredictionRigidbody
        //and never on the rigidbody itself; this includes if also accessing from
        //another script.
        Vector3 forces = new Vector3(data.Horizontal, 0f, data.Vertical) * _moveRate;
        PredictionRigidbody.AddForce(forces);
    
        if (data.Jump)
        {
            Vector3 jmpFrc = new Vector3(0f, _jumpForce, 0f);
            PredictionRigidbody.AddForce(jmpFrc, ForceMode.Impulse);
        }
        //Add gravity to make the object fall faster. This is of course
        //entirely optional.
        PredictionRigidbody.AddForce(Physics.gravity * 3f);
        //Simulate the added forces.
        //Typically you call this at the end of your replicate. Calling
        //Simulate is ultimately telling the PredictionRigidbody to iterate
        //the forces we added above.
        PredictionRigidbody.Simulate();
    }

On non-owned objects a number of replicates will arrive as ReplicateState Created, but will contain default values. This is our PredictionManager.RedundancyCount feature working.

This is normal and indicates that the client or server had gracefully stopped sending states as there is no new data to send. This can be useful if you are [Predicting States.](/docs/manual/guides/prediction/creating-code/understanding-replicatestate/predicting-states-in-code)

Now the reconcile must be sent to clients to perform corrections. Only the server will actually send the reconcile but be sure to call CreateReconcile no matter if client, server, owner or not; this is to future proof an upcoming feature. Unlike our CreateReplicateData method, using CreateReconcile is not optional.

Copy

    private void TimeManager_OnPostTick()
    {
        CreateReconcile();
    }
    
    //Create the reconcile data here and call your reconcile method.
    public override void CreateReconcile()
    {
        //We must send back the state of the rigidbody. Using your
        //PredictionRigidbody field in the reconcile data is an easy
        //way to accomplish this. More advanced states may require other
        //values to be sent; this will be covered later on.
        ReconcileData rd = new ReconcileData(PredictionRigidbody);
        //Like with the replicate you could specify a channel here, though
        //it's unlikely you ever would with a reconcile.
        ReconcileState(rd);
    }
    

Reconciling only a rigidbody state is very simple.

Copy

    [Reconcile]
    private void ReconcileState(ReconcileData data, Channel channel = Channel.Unreliable)
    {
        //Call reconcile on your PredictionRigidbody field passing in
        //values from data.
        PredictionRigidbody.Reconcile(data.PredictionRigidbody);
    }


---

# Creating Code Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Creating Code

This guide provides examples of creating prediction code, understanding important aspects of the code, and leveraging it to your game.

[Controlling An Object](/docs/manual/guides/prediction/creating-code/controlling-an-object)[Non-Controlled Object](/docs/manual/guides/prediction/creating-code/non-controlled-object)[Understanding ReplicateState](/docs/manual/guides/prediction/creating-code/understanding-replicatestate)[Advanced Controls](/docs/manual/guides/prediction/creating-code/advanced-controls)


---

# Custom Comparers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Custom Comparers

Fish-Networking generates comparers for prediction data to perform internal optimizations, but on occasion certain types cannot have comparers automatically generated.

You may see an error in the console about a type requiring a custom comparer. For example, generics and arrays specifically must have a custom comparer provided.

Copy

    /* For example, this will create an error stating
    * byte[] needs a custom comparer. */
    public struct MoveData : IReplicateData
    {
        public Vector2 MoveDirection;
        public byte[] CustomData;
        //rest omitted..
    }

While a comparer could be made automatically for the type byte\[\], we still require you to create your own as we may not know exactly how you want to compare these types. The code below compares byte arrays by iterating every byte to check for mismatches. Given how often prediction data sends, this could potentially burden the processor.

Copy

    [CustomComparer]
    public static bool CompareByteArray(byte[] a, byte[] b)
    {
        bool aNull = (a is null);
        bool bNull = (b is null);
        //Both are null.
        if (aNull && bNull)
            return true;
        //One is null, other is not.
        if (aNull != bNull)
            return false;
        //Not same lengths, cannot match.
        if (a.Length != b.Length)
            return false;
    ​
        //Both not null and same length, compare bytes.
        int length = a.Length;
        for (int i = 0; i < length; i++)
        {
            //Differs.
            if (a[i] != b[i])
                return false;
        }
    ​
        //Fall through, if here everything matches.
        return true;
    }

The above code is a working example of how to create a custom comparer, but it may not be the most ideal comparer for your needs; this is why we require you to make your own comparer for such types.

Creating your own comparer is simple. Make a new static method with any name and boolean as the return type. Decorate the method with the **\[CustomComparer\]** attribute. There must also be two parameters, each being the type you want to compare. The method logic can contain whichever code you like


---

# Custom Conditions Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Observers](/docs/manual/guides/observers)

# Custom Conditions

Sometimes you may have unique requirements for an observer condition. When this is the case you can easily create your own ObserverCondition. The code below comments on how to create your own condition.

Copy

    //The example below does not have many practical uses
    //but it shows the bare minimum needed to create a custom condition.
    //This condition makes an object only visible if the connections
    //ClientId mathes the serialized value, _id.
    
    //Make a new class which inherits from ObserverCondition.
    //ObserverCondition is a scriptable object, so also create an asset
    //menu to create a new scriptable object of your condition.
    [CreateAssetMenu(menuName = "FishNet/Observers/ClientId Condition", fileName = "New ClientId Condition")]
    public class ClientIdCondition : ObserverCondition
    {
        /// <summary>
        /// ClientId a connection must be to pass the condition.
        /// </summary>
        [Tooltip("ClientId a connection must be to pass the condition.")]
        [SerializeField]
        private int _id = 0;
    
        private void Awake()
        {
            //Awake can be optionally used to initialize values based on serialized
            //data. The source file of DistanceCondition is a good example
            //of where Awake may be used.
        }
        
        /// <summary>
        /// Returns if the object which this condition resides should be visible to connection.
        /// </summary>
        /// <param name="connection">Connection which the condition is being checked for.</param>
        /// <param name="currentlyAdded">True if the connection currently has visibility of this object.</param>
        /// <param name="notProcessed">True if the condition was not processed. This can be used to skip processing for performance. While output as true this condition result assumes the previous ConditionMet value.</param>
        public override bool ConditionMet(NetworkConnection connection, bool currentlyAdded, out bool notProcessed)
        {
            notProcessed = false;
    
            //When true is returned it means the connection meets
            //the condition requirements. When false, the
            //connection does not and will not see the object.
    
            //Will return true if connection Id matches _id.
            return (connection.ClientId == _id);
        }
    
        /// <summary>
        /// Type of condition this is. Certain types are handled different, such as Timed which are checked for changes at timed intervals.
        /// </summary>
        /// <returns></returns>
        /* Since clientId does not change a normal condition type will work.
        * See API on ObserverConditionType for more information on what each
        * type does. */
        public override ObserverConditionType GetConditionType() => ObserverConditionType.Normal;
    }
    

You can get an idea of the flexibility of a condition by exploring the source of other premade conditions.


---

# Custom Scene Processors Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Custom Scene Processors

You can create a custom scene processor to handle how a scene is loaded/unloaded.

## 


General

See Sub Pages

### 


[Addressables](/docs/manual/guides/scene-management/custom-scene-processors/addressables)


---

# Custom Serializers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Custom Serializers

Custom serializers are useful where an automatic serializer may not be possible, or where you want data to be serialized in a specific manner.

When creating a custom serializer there are a few important things to remember. When you follow the proper steps your custom serializer will be found and used by Fish-Networking. Your custom serializers can also override automatic serializers, but not included ones.

*   Your method must be static, and within a static class.
    
*   Writing method names must begin with _Write_.
    
*   Reading method names must begin with _Read_.
    
*   The first parameter must be _this Writer_ for writers, and _this Reader_ for readers.
    
*   Data must be read in the same order it is written.
    

Although _Vector2_ is already supported, the example below uses a Vector2 for simplicity sake.

Copy

    //Write each axis of a Vector2.
    public static void WriteVector2(this Writer writer, Vector2 value)
    {
        writer.WriteSingle(value.x);
        writer.WriteSingle(value.y);
    }
    
    //Read and return a Vector2.
    public static Vector2 ReadVector2(this Reader reader)
    {
        return new Vector2()
        {
            x = reader.ReadSingle(),
            y = reader.ReadSingle()
        };
    }

Custom serializers are more commonly used for conditional situations where what you write may change depending on the data values. Here is a more complex example where certain data is only written when it's needed.

Copy

    /* This is the type we are going to write.
    * We will save data and populate default values
    * by not writing energy/energy regeneration if
    * the enemy does not have energy. */
    public struct Enemy
    {
        public bool HasEnergy;
        public float Health;
        public float Energy;
        public float EnergyRegeneration;
    }
    
    public static void WriteEnemy(this Writer writer, Enemy value)
    {
        writer.WriteBoolean(value.HasEnergy);
        writer.WriteSingle(value.Health);
        
        //Only need to write energy and energy regeneration if HasEnergy is true.
        if (value.HasEnergy)
        {
            writer.WriteSingle(value.Energy);
            writer.WriteSingle(value.EnergyRenegeration);
        }
    }
    
    public static Enemy ReadEnemy(this Reader reader)
    {
        Enemy e = new Enemy();
        e.HasEnergy = reader.ReadBoolean();
        e.Health = reader.ReadSingle();
        
        //If there is energy also read energy values.
        if (e.HasEnergy)
        {
            e.Energy = reader.ReadSingle();
            e.EnergyRenegeration = reader.ReadSingle();
        }
    
        return e;
    }

Often when creating a custom serializer you want to use it across your entire project, and all assemblies. Without taking any action further your custom serializer would **only be used on the assembly it is written.** Presumably, that's probably not what you want.

But making a custom serializer work across all assemblies is very simple. Simply add the \[UseGlobalCustomSerializer\] attribute of the type your custom serializer is for, and done!

Example:

Copy

    [UseGlobalCustomSerializer]
    public struct Enemy
    {
        public bool HasEnergy;
        public float Health;
        public float Energy;
        public float EnergyRegeneration;
    }


---

# Custom Sync Type Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# Custom SyncType

With a customized SynType you can decide how and what data to synchronize, and make optimizations as you see fit.

For example: if you have a data container with many variables you probably don't want to send the entire container when you change it, as a SyncVar would. By making a custom SyncType you can customize the behavior entirely; this is how other SyncType work.

Copy

    /* If one of these values change you
    * probably don't want to send the
    * entire container. A custom SyncType
    * is perfect for only sending what is changed. */
    [System.Serializable]
    public struct MyContainer
    {
        public int LeftArmHealth;
        public int RightArmHealth;
        public int LeftLegHealth;
        public int RightLeftHealth;            
    }

Custom SyncTypes follow the same rules as other SyncTypes. Internally other SyncTypes inherit from SyncBase, and your type must as well. In addition, you must implement the _ICustomSync_ interface.

Copy

    public class SyncMyContainer : SyncBase, ICustomSync
    {
        /* If you intend to serialize your type
        * as a whole at any point in your custom
        * SyncType and would like the automatic
        * serializers to include it then use
        * GetSerializedType() to return the type.
        * In this case, the type is MyContainer.
        * If you do not need a serializer generated
        * you may return null. */
        public object GetSerializedType() => typeof(MyContainer);
    }
    
    public class YourClass
    {
        private readonly SyncMyContainer _myContainer = new();
    }

Given how flexible a custom SyncType may be there is not a one-size fits all example. You may view several custom examples within your FishNet import under FishNet/Example/All/CustomSyncType.


---

# Customizing Behavior Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# Customizing Behavior

There are settings and attributes unique to SyncTypes which allow various ways of customizing your SyncType.

### 


SyncTypeSettings

[SyncTypeSettings](https://firstgeargames.com/FishNet/api/api/FishNet.Object.Synchronizing.SyncTypeSettings.html) can be initialized with any SyncType to define the default settings of your SyncType.

Copy

    //Custom settings are optional.
    //This is an example of declaring a SyncVar without custom settings.
    private readonly SyncVar<int> _myInt = new();
    
    //Each SyncType has a different constructor to take settings.
    //Here is an example for SyncVars. This will demonstrate how to use
    //the unreliable channel for SyncVars, and send the value upon any change.
    //There are many different ways to create SyncTypeSettings; you can even
    //make a const settings and initialize with that!
    private readonly SyncVar<int> _myInt = new(new SyncTypeSettings(0f, Channel.Unreliable));

Settings can also be changed at runtime. This can be very useful to change behavior based on your game mechanics and needs, or to even slow down send rate as your player count grows.

Copy

    //This example shows in Awake but this code
    //can be used literally anywhere.
    private void Awake()
    {
        //You can change all settings at once.
        _myInt.UpdateSettings(new SyncTypeSettings(....);
    
            //Or update only specific things, such as SendRate.
        //Change send rate to once per second.
        _myInt.UpdateSendRate(1f);
    }

### 


Showing In The Inspector

SyncTypes can also be shown in the inspector.

You must first make sure your type is marked as serializable if a container; this is a Unity requirement.

Copy

    //SyncTypes can be virtually any data type. This example
    //shows a container to demonstrate the serializable attribute.
    [System.Serializable]
    public struct MyType { }

Next the SyncType must not use the 'readonly' indicator. We require the readonly indicator by default to emphasis you should not initialize your SyncType at runtime.

Below is an example of what **NOT** to do.

Copy

    private SyncVar<int> _myInt = new();
    
    private void Awake()
    {
        //This would result in errors at runtime.
    
        //Do not make a SyncType into a new instance
        _myInt = new();
        //Do not set a SyncType to another instance.
        _myInt = _someOtherDeclaredSyncVar.
    }

The code above will actually prevent compilation in the editor as our code generators will detect you did not include the readonly indicator. To remove the readonly indicator you must also add the [AllowMutableSyncType](https://firstgeargames.com/FishNet/api/api/FishNet.CodeGenerating.AllowMutableSyncTypeAttribute.html) above your SyncType.

Copy

    //This will work and show your SyncType in the inspector!
    [AllowMutableSyncType]
    [SerializeField] //Be sure to serializeField if not public.
    private SyncVar<int> _myInt = new();


---

# Default Scene Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)

# DefaultScene

This component will automatically change between online and offline scenes depending on server and client connective state. When a connection is started the online scene is loaded, and when disconnected offline is loaded. This component must be placed on or beneath your NetworkManager.

## 


Component Settings

**Enable Global Scenes** will load the scenes as global when enabled, or as connection when not. For more information on the differences see [Scene Loading](/docs/manual/guides/scene-management/loading-scenes).

**Start In Offline** will load the server and clients into the offline scene when the game starts.

**Offline Scene** is the scene to load when offline.

**Online Scene** is the scene to load when online.

**Replace Scenes** can be set to replace all loaded scenes, or just online scenes with the Online or Offline scene. For more information see loading [Scene Loading - replacing scenes](/docs/manual/guides/scene-management/loading-scenes).


---

# Feature Comparison Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)

# Feature Comparison

For a more exact feature comparison of various networking solutions please see this [comparison chart](https://docs.google.com/spreadsheets/d/1Bj5uLdnxZYlJykBg3Qd9BNOtvE8sp1ZQ4EgX1sI0RFA/edit#gid=233715429).

Performance and reliability are very important to us, but so is including great features to make your experience easier, and better. The last thing we want to do is create limitations; we support all features Mirror does, and then some.

Below is a comparison of unique and enhanced features, with more to come.

## 


Features unique to Fish-Networking

> **Update Stability**
> 
> Other solutions do not guarantee that their API will not change between releases, making it difficult and dangerous to update for fixes or features. Fish-Networking prides itself on it's [No-Break Promise](/docs#no-break-promise), ensuring updates do not require alteration of user code, keeping you on-top with the best to offer.

> **Built-in Addressables Support**
> 
> Unlike other networking solutions, Fish-Networking has addressables support included within core features. Addressable scenes are easily implemented with our network SceneManager, and addressable prefabs are supported as well.

> **Network Balancing**
> 
> NetworkManagers are the center of your network environment. They contain other managers, and handle communications between the client and server. Fish-Networking allows an infinite number of NetworkManagers, allowing clients at once to connect to multiple different servers, to have each handle certain tasks or worlds. Various NetworkManagers may also be used to fit different game modes, transports, platforms, and a number of other tasks.

> **Local Remote Calls**
> 
> Fish-Networking allows remote calls to run not only on their intended destination, but also on the caller as well. Typically you would have to copy logic into multiple methods to accomplish such a task, but Fish-Networking allows it to be done in one method. This drastically reduces potential errors in code, lines of code, and improves ease of use.

> **Multi-purpose Remote Calls**
> 
> Target and Observers remote calls can be used interchangeable, in the same method. This allows you to use a single method to send data to one client or multiple clients. Like _**Local Remote Calls**_, this creates a more reliable code-base and improves the user experience.

> **Buffered Remote Calls**
> 
> Often the last value of a remote call must be sent to newly joined clients. Fish-Networking is one of few solutions that offer this ability.

> **Client-side Prediction**
> 
> Client-side prediction primarily focuses on ensuring players in your game cannot cheat a variety of movement types. This feature is an absolute must for any competitive game.
> 
> Fish-Networking is the only free solution to provide built-in client-side prediction with only a few lines of code. Also, included are a variety of components for desynhronization smoothing, and rigidbody prediction.

> **Lag Compensation (pro feature)**
> 
> Another very important feature for precision based gaming is lag compensation. This is the act of rolling back colliders in time to where a client had seen them; this ensures accurate hit registration. This technique is applicable to several genre types but is most commonly seen in shooter games.

> **Automatic Code Stripping (pro feature)**
> 
> Code stripping helps protect your game server by removing sensitive logic that the player should not be aware of. Far as we know, Fish-Networking is the only solution with the ability to remove server code from clients, and client code from the server.

> **Large Packet Handling**
> 
> In some scenarios you may need to send large amounts of data either to the client or server. Tests show Fish-Networking was able to effectively send anywhere from a few, to a few hundred megabytes over the network. Other solutions such as Mirror and even Fusion throw errors on the same job.

> **Reliable Order of Operations**
> 
> Race conditions are possibly the worst kind of problems to solve, and it's especially frustrating when those race conditions are caused by someone else's software. Competitors such as Mirror have shown to have a variety of race conditions, such as networked objects referencing one-another before they actually exist.
> 
> Fish-Networking ensures references cannot go missing, and that the reliability of operations and callbacks are consistent in all scenarios.

> **Child Network Components**
> 
> Child Network Components allow for easier design and better code organization by using components such as Network Objects or Network Behaviours on child objects. Mirror for example requires all networked components to be placed on the root object, which could quickly clutter your work flow.

> **Custom SyncTypes**
> 
> Custom SyncTypes allow you to create logic on how something may be updated over the network. For example: SyncVars, SyncList, SyncDictionaries are all custom SyncTypes included within Fish-Networking. If you would prefer a more hands-on/tailored experience you may create your own Custom SyncType using the exposed framework.

> **Dual Projects**
> 
> Fish-Networking has limited support for dual projects. We recommend using a single project and utilize server defines along with our **automatic code stripping** feature.

> **Single, Additive, Stacked Scene Management**
> 
> Scene management is essential for offline and online games. While other solutions such as Mirror, Fusion, and Netcode are limited to basic single scene management out of the box, Fish-Networking provides built-in logic to control seperation of clients through single, additive, and even stacked scenes. This is a powerful tool for world streaming, dungeon instances, lobbys and more.

> **Automatic Prefab Detection**
> 
> Networking solutions such as Mirror require you to specify and organize networked object prefabs. This is a time consuming task which often requires dragging every prefab into a collection, or looking up prefabs by string before you may spawn them over the network. Fish-Networking strongly believes in ease-of-use, and part of that is having your networked prefabs automatically detected by our framework. Changes made to networked objects are automatically known and configured by Fish-Networking without requiring additional steps form the user.

> **Built-in, or Custom Object Pool**
> 
> Included is the ability to automatically reset and pool network objects. Objects can be set to pool at runtime, or be pre-configured on the NetworkObject. Pooled objects automatically have their network values reset, including all SyncTypes on the object.
> 
> Fish-Networking comes with a basic object pool but fully supports any object pool of your choice.

> **Zero Hotpath Allocations**
> 
> Allocations can massively affect both server and client performance. While Mirror and Netcode allocate garbage regularly, Fish-Networking does not, ensuring better scalability and all-around performance.

> **Offline Networked Objects**
> 
> In some instances an object may need to only exist locally, rather than over the network, and sometimes both. Fish-Networking allows users to default objects to being local only so that the objects network functionality is unused. In addition, these objects are intelligently synchronized over the network when the user shows such intent.

## 


Features which do more in Fish-Networking

> **Serializables**
> 
> Fish-Networking supports more object types to be serialized than any other free solution. Dictionaries, scriptable objects, nullables and more can be automatically serialized in Fish-Networking. Solutions which have existed longer, such as Mirror, still require manual serialization of many types which Fish-Networking handles automatically.

> **Area of Interest System**
> 
> Area of interest, often called AOI, controls which clients receive what information. AOI not only can prevent cheating by disallowing information clients get, but also drastically improve bandwidth and performance of the server by not sending unnecessary information to clients. Both Fish-Networking and Mirror support AOI, however in Mirror you may only use one AOI system at a time. For example, you can separate clients by scenes in Mirror, but you cannot also separate them by distance at the same time. In result if you have a larger world players will see each other at all times. Fish-Networking not only streamlines setting up the AOI system but allows multiple conditions to run at once, which would resolve the just mentioned Mirror problem. Fish-Networking's AOI system can also be easily customized with your own logic.

> **Reliable and Unreliable Remote Calls**
> 
> Several networking solutions support reliable and unreliable remote calls, but Fish-Networking simplifies the process for users. In Mirror if you wish to have a remote call which can send both reliable and unreliable you must duplicate your logic into multiple methods, one for reliable and one for unreliable. Fish-Networking again saves on lines of code and risk of error by allowing a single remote call method to run both reliably and unreliably. You can change the reliability effortlessly at runtime as well.

> **SyncType Flexibility**
> 
> [SyncTypes](/docs/manual/guides/synchronizing) are another very common feature found in just about every high level library. However, very few solutions offer flexibility on how SyncTypes can be configured. Mirror for example can only send SyncTypes reliably, cannot adjust the interval per SyncType, has limited callbacks, and cannot control who receives the values of each SyncType. Fish-Networking on the other hand may send reliable or unreliable with eventual consistency. SyncType intervals can be different for each SyncType. Callbacks can occur on both the server and client. Each SyncType can be specified to go to only the owner, or all clients.

> **Tick Based**
> 
> Tick based timings allow accurate simulation for client-side prediction, smooth transform replication, and a lot more. Fish-Networking has a strong and efficient tick based core to provide a smoother experience for both the developer and their players. Older networking solutions such as Mirror are not tick based, which results in sloppy simulations as well the inability to create a proper client-side prediction system.

> **Broadcasts and Messages**
> 
> Fish-Networking supports broadcasts, interchangeably called messages. Broadcasts and messages are data which can be sent over the network without requiring a networked object receiver. These are useful for objects which you don't want networked but would still like to be able to communicate with, such as a door in your scene. Fish-Networking enhances this communication type by allowing multiple objects to utilize the same message. For example, in Fish-Networking all your scene doors could listen to the same message for updates; Mirror on the other hand only one door could listen to updates while you would have to create additional broadcast or message types for every single added door.

> **Original**
> 
> Mirror, Netcode, and several other networking solutions are based off from previous works, some which are deprecated. Fish-Networking is made original from the ground up, with no prior solution's limitations to bog it down.

> **Anti-Singleton Design**
> 
> Most networking solutions, even newer ones such as Netcode, use a singleton design pattern. Fish-Networking does not utilize singleton classes for it's managers, but still provides an easy way to access networking data from anywhere.

> **XML Documentation**
> 
> An often unconsidered part of any project are the XML comments for it's API. Netcode, Mirror, and even Unity's official API have several parts which are not fully commented internally nor through the XML. Fish-Networking provides complete XML coverage with well thought-out descriptions to make developing easier without constantly have to jump through the source code or visit external sources.


---

# Frequently Asked Questions F A Q Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Frequently Asked Questions (FAQ)

Discover frequently asked questions and their answers.

## 


Miscellaneous

How do I send some initial data to the server as soon as I connect and before my player spawns?[](#how-do-i-send-some-initial-data-to-the-server-as-soon-as-i-connect-and-before-my-player-spawns)

Broadcast are generally the best choice for sending data without a player object. Many developers trade this data in a custom [authenticator](/docs/manual/guides/components/authenticator) class, which allows data to be sent before the client initializes anything at all for the network. See our PasswordAuthenticator script for an example of doing this.

Another approach is to use a custom player spawner instead of our PlayerSpawner. You may send broadcasts back and forward freely, and only spawn your player when you feel is right. See [broadcasts](/docs/manual/guides/synchronizing/broadcast) for more information on this feature.

Why can I see my player object but not control it?[](#why-can-i-see-my-player-object-but-not-control-it)

Most often when this occurs you actually are able to control your player, but you simply do not see them because your game could be using the incorrect camera. This is seen when more than one player spawns, and the player prefab has a live camera beneath them.

To resolve this issue simply use one camera in the scene and take over it as needed, or disable the camera on your player prefab and only enable it if you own the object.

How do I update to a new or Pro version of Fish-Networking?[](#how-do-i-update-to-a-new-or-pro-version-of-fish-networking)

You can install Fish-Networking free over Pro, and Pro over free without any issues. Just download free or Pro and import normally. See our [Pro section](/docs/master/pro-projects-and-support) for information on downloading Pro.

If you import a new version of Fish-Networking and there are immediately compile errors, delete your FishNet folder then import the latest version again.

## 


Hosting and Connectivity

How do I make rooms in Fish-Networking?[](#how-do-i-make-rooms-in-fish-networking)

There are several ways to make rooms within Fish-Networking.

You can use a third party service which creates individual server instances, each acting as their own. There are several services which provide this, an example of one is [Edgegap](/docs/manual/server-hosting/edgegap-official-partner).

Another option is to have a single Fish-Networking instance manage rooms in a single build. This reduces the complexity of a third party service but requires you to develop with [stacked scenes](/docs/manual/guides/scene-management/scene-stacking) in mind. Our project [Lobby and Worlds](/docs/master/pro-projects-and-support#projects) accomplishes this, and is available to supporters.

While stacked scenes aren't necessarily difficult, and support for them are built-into Fish-Networking, there are still some Unity limitations around them. An example being, not all physics API are available in stacked scenes. See [Physics Scenes](https://docs.unity3d.com/ScriptReference/PhysicsScene.html) for more information; there is also PhysicsScene2D.

Why are my Meta Quest/mobile players not immediately disconnecting when they close the game?[](#why-are-my-meta-quest-mobile-players-not-immediately-disconnecting-when-they-close-the-game)

Mobile apps don't typically close like a normal application. Instead, mobile apps are suspended so that you may "re-open" them quickly.

Clients will likely disconnect if the game remains in the background for longer than the timeout settings on your Client/ServerManager.

Often you can utilize the Unity callback OnApplicationPause in mobile games to tell the ClientManager to disconnect.

How can I have p2p (player hosted) games without paying for dedicated servers?[](#how-can-i-have-p2p-player-hosted-games-without-paying-for-dedicated-servers)

A large variety of third party services allow you to host p2p games. Steam and EOS are the two most common ones, but plenty are available. We support both Steam and EOS.

Why don't my games connect when I press server on one device and client on another even on a LAN?[](#why-dont-my-games-connect-when-i-press-server-on-one-device-and-client-on-another-even-on-a-lan)

When trying to connect to your IP directly you must allow connections through your firewall. Be sure to adjust your firewall to allow the port used by your game.

You can also join/create LAN games without changing your firewall by using our [Fish-Networking Discovery addon](/docs/manual/general/add-ons/fish-network-discovery).

## 


Missing Or Hidden Objects.

Why are the (mesh/sprite/etc.) renderers on my object disabled on the clientHost?[](#why-are-the-mesh-sprite-etc.-renderers-on-my-object-disabled-on-the-clienthost)

By default when the clientHost is not an observer of an object the renders for the object are disabled. This is to simulate as if the object is not spawned for the clientHost, though it of course is as the server is still using the object.

You may disable this feature by changing a setting on the [ObserverManager](/docs/manual/guides/components/managers/observermanager). It's also possible to disable this per [NetworkObject](/docs/manual/guides/components/network-object).

You can also utilize [NetworkObject events](https://firstgeargames.com/FishNet/api/api/FishNet.Object.NetworkObject.html#events) to manually update renderers.

Why are my objects in the scene disabled?[](#why-are-my-objects-in-the-scene-disabled)

**First most, check the console for any Fish-Networking warnings or errors.**

Scene objects become disabled when the client is not an observer of the scene. Our [observer system](/docs/manual/guides/observers) controls what objects clients can see, spawn, and transmit.

The most common reason a client is not an observer of the scene is because the server has not added the client to the scene. This can be done manually if you know the client has the scene loaded, using a Fish-Networking SceneManager reference, and calling AddConnectionToScene. EG: sceneManager.AddConnectionToScene(yourClient).

You may just as well use our automated system but telling the SceneManager to load the scene for the client. See [this page](/docs/manual/guides/scene-management/loading-scenes) for more information on that.

If you are starting entering play mode with only one scene you may be manually spawning the player but not adding to starting scene. See our PlayerSpawner script within your Fish-Networking installation for an example of how to instantiate player prefabs, and add clients to scenes.

Why can my client not see objects?[](#why-can-my-client-not-see-objects)

Related: Why are my objects in the scene disabled?

Related: Why are the mesh/sprite/etc. renderers on my object disabled on the clientHost?

If a client is not an observer of an object then the server does not spawn the object for the client. See our [observers guide](/docs/manual/guides/observers) for more information.

## 


SyncTypes (SyncVar, SyncList, etc.).

Why are my SyncTypes not syncing on other devices when I change it on the owner client?[](#why-are-my-synctypes-not-syncing-on-other-devices-when-i-change-it-on-the-owner-client)

Clients may update SyncTypes locally, but they are not synchronized over the network; only the server may synchronize SyncTypes. Typically, clients will send a Remote Procedure Call to the server indicating it wants to update something, and the server complies. See these guides for more information: [Remote Procedure Calls](/docs/manual/guides/remote-procedure-calls), [SyncTypes](/docs/manual/guides/synchronizing).

Why do I receive remote procedure calls before SyncType updates?[](#why-do-i-receive-remote-procedure-calls-before-synctype-updates)

SyncTimes run on intervals, defaulted to every 100ms if the SyncType has changed; the interval may be changed on the [ServerManager](/docs/manual/guides/components/managers/server-manager).

However, even if the interval is met, SyncTypes always synchronize after remote procedure calls (RPC), even if you set them before calling the RPC. You can change SyncTypes to synchronize first on a per SyncType basis using [SyncTypeSettings](https://firstgeargames.com/FishNet/api/api/FishNet.Object.Synchronizing.SyncTypeSettings.html). Review also [SyncTypes guide](/docs/manual/guides/synchronizing) thoroughly for updating a SyncTypes settings.

## 


Remote Procedure Calls (RPCs).

How do I know who sent a ServerRpc, should I pass in the LocalConnection each time as an argument?[](#how-do-i-know-who-sent-a-serverrpc-should-i-pass-in-the-localconnection-each-time-as-an-argument)

By default only clients which own the objects may send a ServerRpc. You may bypass this restriction by setting 'RequireOwnership' to false in the ServerRpc attribute. If you've not bypassed this restriction, the sender will always be owner.

The [ServerRpc guide](/docs/manual/guides/remote-procedure-calls#serverrpc) shows how to set RequireOwnership, as well how to know which spectator might be sending the RPC. You will notice in the guide a NetworkConnection is specified at the end of the RPC parameters. You do not pass in a connection when sending the ServerRpc, it's set automatically when you receive the RPC call.

## 


Errors and Warnings

Why do I get the warning: "Cannot spawn object because server is not active and predicted spawning is not enabled."?[](#why-do-i-get-the-warning-cannot-spawn-object-because-server-is-not-active-and-predicted-spawning-is)

Typically only the server may spawn networked objects. You will see this warning if you try to network spawn an object on a client, while predicted spawning is not enabled.

Predicted spawning must be turned on in the [ServerManager](/docs/manual/guides/components/managers/server-manager). See also the [PredictedSpawn component](/docs/manual/guides/components/prediction/predictedspawn).

Why do I get a NullReferenceException in SyncBase when an object spawns?[](#why-do-i-get-a-nullreferenceexception-in-syncbase-when-an-object-spawns)

Most likely you are seeing this error because your SyncType does not have an initializer. When declaring SyncTypes they must be readOnly and initialized.

For example: `private readonly SyncVar<int> _mySv = new();` You can view more information about SyncTypes [here](/docs/manual/guides/synchronizing).

Why do I get the warning: "Cannot complete action because client is not active."?[](#why-do-i-get-the-warning-cannot-complete-action-because-client-is-not-active)

You will see this warning if the client is not started. It's also possible to see this warning if you are trying to communicate with the server such as using a ServerRpc before the object is initialized for the client. See NetworkBehaviour [API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.NetworkBehaviour.html) and [callback order](/docs/manual/guides/network-behaviour-guides#callbacks) for more information on this.

It's also possible you have a method decorated with the '\[Client\]' attribute, such as if you want a method to only run on clients. This will cause the warning, even if your intents are to not have the client connected. If this is true, you may set LoggingType to Off within the Client attribute.

Why do I get the warning: "Cannot complete action because server is not active."?[](#why-do-i-get-the-warning-cannot-complete-action-because-server-is-not-active)

You will see this warning if the server is not started. It's also possible to see this warning if you are trying to communicate with a client such as using a Target or ObserversRpc before the object is initialized for the server. See NetworkBehaviour [API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.NetworkBehaviour.html) and [callback order](/docs/manual/guides/network-behaviour-guides#callbacks) for more information on this.

It's also possible you have a method decorated with the '\[Server\]' attribute, such as if you want a method to only run on server. This will cause the warning, even if your intents are to not have the server running. If this is true, you may set LoggingType to Off within the Server attribute.

Why do I get this error? "SceneId of 4013929391 not found in SceneObjects."?[](#why-do-i-get-this-error-sceneid-of-4013929391-not-found-in-sceneobjects)

You will see this error if the server thinks your client is in scene, when the client does not have the scene loaded. Using a SceneCondition on the [ObserverManager](/docs/manual/guides/components/managers/observermanager) will typically resolve this problem.

If you are already using a SceneCondition and are certain the correct scenes are being loaded then open the scenes which you are having problems with, and use the Fish-Networking menu to Rebuild SceneIds.

You can also troubleshoot this further by adding the DebugManager component to your NetworkManager and enable Write Scene Object Details. The next time you see the error it will also print the scene and object name the spawn or message was intended for.

In very rare cases this is a bug. If you've tried all the troubleshooting steps above without success consider reaching us on our [Discord](/docs#external-links) for help.

Why do I get this error? "'System.Void System.ParamArrayAttribute::.ctor()' is declared in another module and needs to be imported"?[](#why-do-i-get-this-error-system.void-system.paramarrayattribute-.ctor-is-declared-in-another-module-a)

On very rare occasion you may encounter this error after making a change to your script. This is a Unity bug that we have no way to resolve internally. The exact cause is unknown, but we know it's related to Unity caching something improperly in a script.

There are a few work-arounds that have worked consistently; most commonly adding a new empty method with a parameter (try without as well) and saving the script will resolve the issue. At some point the Unity cache will fix itself, and the empty method can later be removed.

Clearing the library cache seems to have no benefits of resolving this error. The only success we've seen besides the work around is moving everything to a completely new project. Because creating a new project is so much work it's recommended to use the work-around.

## 


Objects

What does the message "AssetPathHash is not set for GameObject ..." mean?[](#what-does-the-message-assetpathhash-is-not-set-for-gameobject-...-mean)

There unfortunately is not any definitive cause of this error. Usually restarting Unity will resolve the problem.

This message can also be seen when a NetworkObject is a prefab which is unable to save changes. If your object is a prefab check to make sure there are no missing scripts, or anything else preventing saving of the prefab.

If issues persist please reach us on our [Discord](/docs#external-links).

How do I get the player game object?[](#how-do-i-get-the-player-game-object)

You can get a list of all objects owned by a connection by using conn.Objects.

If you want to grab the first object spawned for a connection use conn.FirstObject. You can set the FirstObject at runtime if you have a preference to the 'FirstObject'.

If you want to know what objects you own as a client you can grab your own connection under clientManager.Connection.

How can I make the player spawner spawn my player when I load the lobby into the game scene instead of immediately?[](#how-can-i-make-the-player-spawner-spawn-my-player-when-i-load-the-lobby-into-the-game-scene-instead)

This is done by writing a custom player spawner. You can use our PlayerSpawner as an example, but instead of spawning immediately only spawn after a client has been added to a scene.

A good place to start is using the [ClientPresenceChangeEnd callback](/docs/manual/guides/scene-management#scene-events) to know when the client has entered the scene and has visibility of objects within it.

How do I get an object from its NetworkObject Id?[](#how-do-i-get-an-object-from-its-networkobject-id)

In most cases you do not need to pass around a NetworkObject Id. The recommended approach, if sending over the network, is to send the NetworkObject reference itself. This automatically efficiently sends the NetworkObject information, and returns the proper object on the other end.

Should you have reasons to use the Id specifically you can look up spawned objects within the serverManager.Objects.Spawned collection, or clientManager.Objects.Spawned if client only. Note: these collections will likely be consolidated in a later release.

## 


Performance

How many CCU (concurrent users) can Fish-Networking have?[](#how-many-ccu-concurrent-users-can-fish-networking-have)

Our framework does not have any CCU limitations. How many players you are able to host on a single server varies greatly depending upon your server hardware, game mechanics, and your coding efficiency.

Several Fish-Networking games have achieved 500+ CCU, and thousands of NetworkObjects.

Can you use sharding (world splitting) in Fish-Networking?[](#can-you-use-sharding-world-splitting-in-fish-networking)

Fish-Networking does not take any special actions to support nor restrict sharding. Some users experienced success with custom implementations of world sharding, but we do not officially support this feature.

With how powerful servers have become world sharding is rarely needed, and generally we discourage against it.


---

# Hash Grid Fish Net Networking Evolved

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


---

# Inheritance Serializers Fish Net Networking Evolved

# Inheritance Serializers

Another frequently asked question is how to handle serialization for classes which are inherited by multiple other classes. These are often used to allow RPCs to use the base class as a parameter, while permitting other inheriting types to be used as arguments. This approach is similar to Interface serializers

##

Class Example

Here is an example of a class you want to serialize, and two other types which inherit it.

```csharp
public class Item : ItemBase
{
    public string ItemName;
}

public class Weapon : Item
{
    public int Damage;
}

public class Currency : Item
{
    public byte StackSize;
}

//This is a wrapper to prevent endless loops in
//your serializer. Why this is used is explained
//further down.
public abstract class ItemBase {}
```

Using an RPC which can take all of the types above might look something like this.

```csharp
public void DoThing()
{
    Weapon wp = new Weapon()
    {
        Itemname = "Dagger",
        Damage = 50,
    };
    ObsSendItem(wp);
}

[ObserversRpc]
private void ObsSendItem(ItemBase ib)
{
    //You could check for other types or just convert it without checks
    //if you know it will be Weapon.
    //EG: Weapon wp = (Weapon)ib;
    if (ib is Weapon wp)
        Debug.Log($"Recv: Item name {wp.ItemName}, damage value {wp.Damage}.");
}
```

###

Creating The Writer

Since you are accepting ItemBase through your RPC you must handle the different possibilities of what is being sent. Below is a serializer which does just that.

When using this approach it is very important that you check for the child-most types first.

For example: Weapon is before Item, and so is Currency, so those two are checked first. Just as if you had Melee : Weapon, then Melee would be before Weapon, and so on.

```csharp
public static void WriteItembase(this Writer writer, ItemBase ib)
{
    if (ib is Weapon wp)
    {
        // 1 will be the identifer for the reader that this is Weapon.
        writer.WriteByte(1);
        writer.Write(wp);
    }
    else if (ib is Currency cc)
    {
        writer.WriteByte(2);
        writer.Write(cc);
    }
    else if (ib is Item it)
    {
        writer.WriteByte(3);
        writer.Write(it);
    }
}

public static ItemBase ReadItembase(this Reader reader)
{
    byte clsType = reader.ReadByte();
    //These are still in order like the write method, for
    //readability, but since we are using a clsType indicator
    //the type is known so we can just compare against the clsType.
    if (clsType == 1)
        return reader.Read<Weapon>();
    else if (clsType == 2)
        return reader.Read<Currency>();
    else if (clsType == 1)
        return reader.Read<Item>();
    //Unhandled, this would probably result in read errors.
    else
        return null;
}
```

You can still create custom serializers for individual classes in addition to encapsulating ones as shown! If for example you had a custom serializer for Currency then using the code above would use your serializer for Currency rather than the one Fish-Networking generates.

Finally, disclosing why we made the ItemBase class. The sole purpose of ItemBase is to prevent an endless loop in the reader. Imagine if we were able to return only Item, and we were also using that as our base. Your reader might look like this...

```csharp
public static Item ReadItem(this Reader reader)
    {
        byte clsType = reader.ReadByte();
        //These are still in order like the write method, for
        //readability, but since we are using a clsType indicator
        //the type is known so we can just compare against the clsType.
        if (clsType == 1)
            return reader.Read<Weapon>();
        else if (clsType == 2)
            return reader.Read<Currency>();
        else if (clsType == 3)
            return reader.Read<Item>();
        //Unhandled, this would probably result in read errors.
        else
            return null;
    }
```

The line _return reader.Read<Item>();_ is the problem. By calling read on the same type as the serializer you would in result call the ReadItem method again, and then the line _return reader.Read<Item>();_ and then ReadItem again, and then, well you get the idea.

Having a base class, in our case ItemBase, which cannot be returned ensures no endless loop.


---

# Instance Finder Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# InstanceFinder

There is a lot of useful information you can get from NetworkBehaviours but there may be some cases that your script does not inherit from NetworkBehaviour. This is where InstanceFinder can help you out.

InstanceFinder provides you quick access to commonly needed references or information. Some examples are: SceneManager, IsClient, TimeManager, and [more](https://firstgeargames.com/FishNet/api/api/FishNet.InstanceFinder.html#properties).

Copy

    public class MyButton : MonoBehaviour
    {
        public Image ButtonImage;
        
        /* It wouldn't make sense to update the UI
        * color on the server since it will have
        * no graphical interface. To save performance
        * we're only going to update color if client.
        * However, since this is a MonoBehaviour class
        * you do not have access to base.IsClient.
        * Instead the InstanceFinder may be used. */
        private void SetColor(Color c)
        {
            if (InstanceFinder.IsClientStarted)
                ButtonImage.color = c;
        }
    }


---

# Interface Serializers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Custom Serializers](/docs/manual/guides/custom-serializers-guides)

# Interface Serializers

## 


General

Interfaces are very commonly used in most Unity Projects. Since Interfaces are not classes, even if the interface only uses serializable fields, a custom serializer is still needed in order for SyncTypes, and RPCs to serialize them properly over the network.

* * *

## 


Serializing the Interfaces Entire Class

In most cases you will want to interrogate an Interface as what its class type is, and serialize the entire types class over the network. This allows you to interrogate the interface later on the receiving client/server and have the data match what the sender has at the time it was sent as well.

If the Interface is a NetworkBehaviour you might as well send it as one because Serializing them over the network is only sending an ID for the receiving client to look up. Very Little network traffic, and you still get all of the data!

### 


Creating The Writer

Since Interfaces are not classes you must design the writer to be able to interrogate the class the Interface is, and serialize the class over the network. If an interface can be many types of classes, you will need to account for each class the Interface can be.

#### 


Example

Copy

    public static void WriteISomething(this Writer writer, ISomething som)
    {
        if(som is ClassA c1)
        {
            // 1 will be the identifer for the reader that this is a ClassA.
            writer.WriteByte(1); 
            writer.Write(c1);
        }
        else if(som is ClassB c2)
        {
            //2 will be the identifier for the reader that this is a ClassB.
            writer.WriteByte(2)
            writer.Write(c2);
        }
    }  

### 


Creating The Reader

When reading the interface, we have to read the byte that identifies what class the interface actually is first. Then use the reader to read that classes data. Finally casting it as the interface we need.

#### 


Example

Copy

    public static ISomething ReadISomething(this Reader reader)
    {   
        //Gets the byte of what class type we should be reading the next bit of data as.
        byte clsType = reader.ReadByte();
        
        //Remember we assigned 1 to be ClassA.
        if(clsType == 1)
            return reader.Read<ClassA>();
        //And 2 for ClassB.
        else if(clsType == 2)
            return reader.Read<ClassB>();
    
        //Fall through, unhandled. This would be bad.
        return default;
    }

* * *

## 


Serializing Only The Interfaces Properties

Sometimes you may only want to serialize just the Interface properties over the network, just keep in mind that if you cast it as the Type it actually is on the receiving client, the values of fields not apart of the interface will be their default values!

### 


Creating The Writer

You still will have to use an Identifier to send what class the Interface is, but we will not be sending the entire class over the network. Just the Interface Properties.

#### 


Example

Copy

    public interface ISomething
    {
        string Name;
        int Health;
        ushort Level;
    }

Copy

    public static void WriteISomething(this Writer writer, ISomething som)
    {
        //Defining a blank Class Type Indentifier
        byte clsType = 0; //Default
        
        if(som is CustomClass1 cc1)
            writer.WriteByte(1);    
        else if(som is CustomClass2 cc2)
            writer.WriteByte(2);
        //Fall through, indicating unknown type.
        else
            writer.WriteByte(0);
        
        //Remember the order the data is written, is the order it must be read.
        writer.WriteString(som.Name);
        writer.WriteInt32(som.Health);
        writer.WriteUInt16(som.Level);
    }

### 


Creating The Reader

When reading, we will get the class type from the identifier, create a new class, cast the class as the interface, and then assign the custom serialized values to the interface!

#### 


example

Copy

    public static ISomething ReadISomething(this Reader reader)
    {
        /* Getting the Class Type Indentifier.
         * Read all values first. to clear out the
         * reader. */
        byte clsType = reader.ReadByte();
        string name = reader.ReadString();
        int health = reader.ReadInt32();
        ushort level = reader.ReadUInt16();
        
        ISomething som = default;
        //Check to see what class the interface is
        if(clsType == 1)
            som = new CustomClass1();
        else if(clasType == 2)
            som = new CustomClass2();
        
        //Value was not set, so we cannot populate it.
        if(som == default(ISomething))
            return null;
        
        som.Name = name;
        som.Health = health;
        som.Level = level;
        
        return som;
    
    }


---

# Intermediate Layer Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)
9.  [TransportManager](/docs/manual/guides/components/managers/transportmanager)

# IntermediateLayer

The IntermediateLayer is a pass-through for data in and out. This feature can be used to encrypt data, inject headers, and more.

Using the IntermediateLayer is simple as overriding two methods, one for when data is sent and one for when data is received.

Below is an example included with FishNet which demonstrates using a Caesar cipher to encrypt data.

You can find this example in the Demos folder, file name **IntermediateLayerCipher.cs**.

Copy

    using FishNet.Managing.Transporting;
    using System;
    
    namespace FishNet.Example.IntermediateLayers
    {
        /* Below is an example of creating a basic Caesar Cipher.
         * Bytes are modified by a set value of CIPHER_KEY, and then
         * the original src ArraySegment is returned.
         * 
         * It's very important to only iterate the bytes provided
         * as the segment. For example, if the ArraySegment contains
         * 1000 bytes but the Offset is 3 and Count is 5 then you should
         * only iterate bytes on index 3, 4, 5, 6, 7. The code below
         * shows one way of properly doing so.
         * 
         * If you are to change the byte array reference, size, or segment
         * count be sure to return a new ArraySegment with the new values.
         * For example, if your Offset was 0 and count was 10 but after
         * encrypting data the Offset was still 0 and count 15 you would
         * return new ArraySegment<byte>(theArray, 0, 15); */
        public class IntermediateLayerCipher : IntermediateLayer
        {
            private const byte CIPHER_KEY = 5;
            //Decipher incoming data.
            public override ArraySegment<byte> HandleIncoming(ArraySegment<byte> src, bool fromServer)
            {
                byte[] arr = src.Array;
                int length = src.Count;
                int offset = src.Offset;
    
                for (int i = src.Offset; i < (offset + length); i++)
                {
                    short next = (short)(arr[i] - CIPHER_KEY);
                    if (next < 0)
                        next += 256;
                    arr[i] = (byte)next;
                }
    
                return src;
            }
            //Cipher outgoing data.
            public override ArraySegment<byte> HandleOutgoing(ArraySegment<byte> src, bool toServer)
            {
                byte[] arr = src.Array;
                int length = src.Count;
                int offset = src.Offset;
    
                for (int i = offset; i < (offset + length); i++)
                {
                    short next = (short)(arr[i] + CIPHER_KEY);
                    if (next > byte.MaxValue)
                        next -= 256;
                    arr[i] = (byte)next;
                }
    
                return src;
            }
    
        }
    }

In some cases you may need to inject headers into data sent, such as if you are validating each packet with an authorization key.

If such is the case it may be wise to reserve a number of bytes needed for your header. You can do this by calling SetMTUReserve() on your TransportManager. Here is an example of doing such.

Copy

    public class MyIntermediateLayer : IntermediateLayer
    {
        public override void InitializeOnce(TransportManager manager)
        {
            base.InitializeOnce(manager);
            const int bytesForMyHeader = 10;
            manager.SetMTUReserve(bytesForMyHeader);
        }
        //...rest omitted


---

# Interpolations Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Interpolations

Both the PredictionManager and NetworkObject have interpolation values, but with separate objectives

PredictionManager interpolation is not the same as NetworkObject interpolation.

Interpolation on the PredictionManager holds a number of states in queue as interpolation while NetworkObject interpolation handles graphical smoothing after running states.

A prediction interpolation of 0, be it client or server setting, means that states would be run soon as they are received. Most games will not use 0 interpolation as it's generally best to have at least 1 state in queue to compensate for latency. For every 1 interpolation added is like adding latency to when spectated states are run, equal to (interpolation \* TickDelta).

For smoothing graphical objects beneath your NetworkObject see [NetworkTickSmoother](/docs/manual/guides/components/utilities/tick-smoothers/networkticksmoother). This component allows you to configure how the object is interpolated for owner and spectators.

Under the scenario your TickSmoother graphical had a set spectator interpolation of 2 and your PredictionManager an interpolation of 1, the spectated graphical object would take 2 ticks to get to it's goal after the PredictionManager ran the state 1 interpolation later than receiving it.


---

# Introduction Fish Net Networking Evolved

# Introduction

## 


Overview

Fish-Networking(Fish-Net) is an original free versatile networking solution for Unity([https://unity.com/](https://unity.com/)), built from the ground up, offering more features than any other free solution.

Fish-Net is server authoritative by design by allowing the use of dedicated servers, but does permit users to act as server and client, for faster development and testing.

Any kind of network topology is supported through the Transport system. Transports can use a variety of technologies to allow communications between server, client, and even third parties.

High-level API allows you to quickly access the ability to synchronize states, logic, objects, and more, without needing to get your hands dirty. We also believe in providing the best experience possible; you may additionally utilize low-level functionality via included events or inheritance.

## 


No-break Promise

Developing projects can take a lot of time, and updating your networking solution along the way is often inevitable. Fish-Networking promises to not release any breaking API or behavior changes between major versions. Major releases will occur no more frequent than every six months, unless **absolutely necessary**.

When breaks do occur we will do our best to keep the changes simple. We also have our [Break Solutions](/docs/manual/general/changelog/major-version-update-solutions) section which will describe planned breaks, the next major release, and how to remedy breaks for each version.

## 


Long-Term Support

Fish-Networking is the only solution to offer free LTS. We will be using a unique but effective approach at creating LTS releases. Rather than the standard expectations of being locked into a version for long-term support, FishNet is providing what we refer to as 'Release' and 'Development' switches. Any version of Fish-Networking which ends in R supports switching between Release and Development features, for example: 3.10.7R.

With Fish-Networking Long-Term support does not mean being stuck on older versions! Whenever a change or new feature becomes available public you may disabled it at anytime. Disabling an upcoming change will suspend the changes and allow FishNet to operate on the proven stable version of the same feature. This allows you to stay on the latest releases to get the latest tech and bug fixes without worrying about each update breaking your project.

To toggle between beta features simply use the Fish-Networking menu in engine, choose Beta, and turn on or off each feature to your liking.

## 


External Links

GitHub: [https://github.com/FirstGearGames/FishNet/](https://github.com/FirstGearGames/FishNet/)

Asset Store: [https://assetstore.unity.com/packages/tools/network/fish-net-networking-evolved-207815](https://assetstore.unity.com/packages/tools/network/fish-net-networking-evolved-207815)

Community Discord: [https://discord.gg/Ta9HgDh4Hj](https://discord.gg/Ta9HgDh4Hj)

## 


Add-ons

There are several add-ons to aid you through your development. Add-ons may be anything from third-party assets to internal plugins.

Add-ons: [https://fish-networking.gitbook.io/docs/manual/general/addons](https://fish-networking.gitbook.io/docs/manual/general/addons)

## 


Need more documentation?

Documentation is especially important to newcomers, and we understand this. As Fish-Networking developers it can at times be difficult to know what is expected or lacking for beginners. If you find a topic unclear, or not covered well enough, please visit our [GitHub Issues](https://github.com/FirstGearGames/FishNet/issues) and create a new issue requesting improvements.


---

# Lag Compensation Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Lag Compensation

Lag compensation, also known as collider rollback, is the act of placing colliders back in time on the server to provide accurate raycast hit detection regardless of client latency.


---

# Loading Scenes Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Loading Scenes

Loading Scenes Video Guide

## 


General

This guide will go over how to setup and load new scenes, how to load into existing scenes, how to replace scenes, and advanced info on what happens behind the "scenes" during a load.

Loading Scenes globally or by connection will add the specified clients connection as an [**Observer**](/docs/manual/guides/observers) to the scenes if utilizing the [**ObserverManagers**](/docs/manual/guides/components/managers/observermanager) Scene Condition, so globally will add all clients as Observers, and by connection will only add the connections specified. - See [**Scene Visibility**](/docs/manual/guides/scene-management/scene-visibility) for more info.

In the Examples below, all SceneManager calls are done inside a NetworkBehaviour class, that is why you can get reference to SceneManager by doing base.SceneManager. If you would like a reference outside of a NetworkBehaviour consider using FishNets [**InstanceFinder**](/docs/manual/guides/instancefinder-guides).SceneManager.

Setup[](#setup)

Before calling the SceneManagers Load Scene functions you will need to setup the load data to tell the [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) how you want it to handle the scene load.

### 


SceneLookupData

[**SceneLookupData**](/docs/manual/guides/scene-management/scene-data/scenelookupdata) is the class used to specify what scene you want the [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) to load. You will not create the lookup data manually and instead use the SceneLoadData constructors that will create the SceneLookupData automatically.

### 


SceneLoadData

When loading a scene in any way, you must pass in an instance of a [**SceneLoadData**](/docs/manual/guides/components/managers/scenemanager) [](/docs/manual/guides/scene-management/scene-data/sceneloaddata)class into the load methods. This class provides the scene manager all of the info it needs to load the scene or scenes properly.

The constructors available for [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata) will automatically create the [**SceneLookupData**](/docs/manual/guides/scene-management/scene-data/scenelookupdata) needed for the SceneManager to handle if you are loading a new scene, or an existing instance of one.

Loading New Scenes[](#loading-new-scenes)

Scenes can be loaded globally or by a collection of client connections.

Loading new Scenes can only be done by Name, you cannot use Handle or Scene References.

### 


Global Scenes

*   Global Scenes can be loaded by calling LoadGlobalScenes() in the SceneManager.
    
*   When loaded globally, scenes will be loaded for all current, and future clients.
    

Copy

    SceneLoadData sld = new SceneLoadData("Town");
    base.SceneManager.LoadGlobalScenes(sld);

### 


Connection Scenes

Connection Scenes follow the same principle, but has a few method overloads.

*   You can load scenes for a single connection, multiple connections at once, or load scenes only on the server in preparation for connections.
    
*   When loading by connection only the connections specified will load the scenes.
    
*   You can add additional connections into a scene at any time.
    

Copy

    SceneLoadData sld = new SceneLoadData("Main");
    
    //Load scenes for a single connection.
    NetworkConnection conn = base.Owner;
    base.SceneManager.LoadConnectionScenes(conn, sld);
    
    //Load scenes for several connections at once.
    NetworkConnection[] conns = new NetworkConnection[] { connA, connB };
    base.SceneManager.LoadConnectionScenes(conns, sld);
    
    //Load scenes only on the server. This can be used to preload scenes
    //that you don't want all players in.
    base.SceneManager.LoadConnectionScenes(sld); 

### 


Loading Multiple Scenes

*   Whether loading globally or by connection, you can load more than one scene in a single method call.
    
*   When loading multiple scenes in one call, the NetworkObjects you put into [**Moved NetworkObjects**](/docs/manual/guides/scene-management/scene-data/sceneloaddata#movednetworkobjects) will be moved to the first valid scene in the list of scenes you tried to load. See Persisting NetworkObjects for more info about keeping NetworkObjects across scenes.
    

Copy

    //Loading Multiple Connections into Multiple Scenes
    string[] scenesToLoad = new string[] {"Main", "Additive"};
    NetworkConnection[] conns = new NetworkConnection[] {connA, connB,connC}
    
    SceneLoadData sld = new SceneLoadData(scenesToLoad);
    base.SceneManager.LoadConnectionScenes(conns, sld);

Loading Existing Scenes[](#loading-existing-scenes)

If the scene is already loaded on the server, and you want to load clients into that instance of the scene. Most likely you will want to lookup that scene by scene reference, or handle to make sure you are getting the exact scene you need.

If you load the scene by name, it will load the connections into the first scene found with that name. If you are utilizing [**Scene Stacking**](/docs/manual/guides/scene-management/scene-stacking), then there may be multiple scenes loaded with the same name. So be alert when loading into existing scenes by name.

You can load clients into scenes that have no other clients in them if you are utilizing [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) **-** the ability to keep a scene loaded with its current state on the server when all clients leave the scene.

### 


Getting References to a Loaded Scene

Here are a few ways to get reference to the scenes that you already loaded using FishNet's **SceneManager**.

#### 


By Event:

Copy

    // Manage your own collection of SceneRefernces/Handles
    // Customize how you want to manage you scene references so its easy
    // for you to find them later.
    List<Scene> ScenesLoaded = new();
    
    public void OnEnable()
    {
        InstanceFinder.SceneManager.OnLoadEnd += RegisterScenes;
    }
    
    public void RegisterScenes(SceneLoadEndEventArgs args)
    {
        //Only Register on Server
        if (!obj.QueueData.AsServer) return;
        
        //if you know you only loaded one scene you could just grab index [0]
        foreach(var scene in args.loadedScenes)
        {
            ScenesLoaded.Add(scene);
        }
    }
    
    public void OnDisable()
    {
        InstanceFinder.SceneManager.OnLoadEnd -= RegisterScene;
    }

#### 


By Connection:

Copy

    //NetworkConnections have a list of Scenes they are currently in. 
    int clientToLookup;
    InstanceFinder.ServerManger.Clients[clientToLookup].Scenes;

#### 


By SceneManager.SceneConnnections:

Copy

    // SceneManager Keeps a Dictionary of All Connection Scenes as the Key
    // and the client connections that are in that scene as the value.
    NetworkConnection conn;
    Scene sceneNeeded;
    
    //Get the scene you need with foreach or use Linq to filter your conditions.
    foreach(var pair in SceneManager.SceneConnections)'
    {
        if(pair.Value.Contains(conn))
        {
            sceneNeeded = pair.Key;
        }
    }

### 


Using Reference to Load Into Existing Instance

Use the methods above to get the reference or handle of a scene, and use that reference or handle to load a client into an existing scene.

Copy

    scene sceneReference;
    NetworkConnection[] conns = new(){connA,connB};
    
    //by reference
    SceneLoadData sld = new(sceneReference);
    base.SceneManager.LoadConnectionScenes(conns,sld);
    
    //by handle
    SceneLoadData sld = new(sceneReference.handle);
    base.SceneManager.LoadConnectionScenes(conns,sld);

Replacing Scenes[](#replacing-scenes)

Fishnet gives the ability to replace scenes that are already loaded on the clients with the new requested scenes to load.

To Replace Scenes you will set the ReplaceScene Option in the SceneLoadData

Replaced scenes will be unloaded before the new scenes are loaded.

Replacing Scenes by Default will replace scenes on both the server and clients. If you would like the server to keep the scene loaded and only replace the scene on the clients - see [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details.

### 


Replace None:

This is the default method when loading, it will ignore the replace options and load the scene in normally.

### 


Replace All:

This will replace all scenes currently loaded in unity, even ones not managed by FishNet's SceneManager.

Copy

    //Replace All Option.
    SceneLoadData sld = new SceneLoadData("DungeonScene");
    sld.ReplaceScenes = ReplaceOption.All;
    
    //This will replace all Scenes loaded by FishNet or outside of FishNet like Unity,
    //and load "DungeonScene"
    SceneManager.LoadGlobalScenes(sld);

### 


Replace Online Only:

This will replace only scenes managed by the SceneManager in FishNet.

Copy

    //Replace Online Only Option.
    SceneLoadData sld = new SceneLoadData("DungeonScene");
    sld.ReplaceScenes = ReplaceOption.OnlineOnly;
    
    //This will replace only scenes managed by the SceneManager in FishNet.
    SceneManager.LoadGlobalScenes(sld);

Advanced Info[](#advanced-info)

### 


Behind the "Scenes"

The [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) Class has very detailed XML comments on how the load process works in detail, if you need to troubleshoot the scene load process, these comments will help you understand the flow of how a scene loads.

### 


Events

Make sure to check out the [**Scene Events**](/docs/manual/guides/scene-management/scene-events) that you can subscribe to to give better control over your game.


---

# Miscellaneous Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)
5.  [Terminology](/docs/manual/general/terminology)

# Miscellaneous

There are a several terms which you may encounter that do not fit into a specific category.

## 


Scene Object

A scene object is an object which is placed in a scene's hierarchy during edit-time. Scene objects are objects which may be spawned over the network, but do not require instantiating as they are already placed in the scene.

## 


Instantiated Object

An instantiated object is an object which was instantiated at run-time, and is not a scene object. For example, Instantiate(yourPrefab).

## 


Predicted Object

An object which utilizes the prediction system. Predicted features generally run on the client and server at the same time to allow real-time gameplay interactions. These types of behaviors require more work but a proper prediction setup will prevent cheating.

## 


Client Authoritative

Often means an object is controlled by the client and results are sent to the server without validation. Client authortative coding is easier to understand but may allow players to cheat more easily. An example of this is a NetworkTransform component with Client Authoritative set to true; the client controls the object locally and the server updates to client's values.

## 


Server Authoritative

Values are controlled or verified by the server, such as SyncTypes. Predicted objects are server authoritative.


---

# Modifying Conditions Fish Net Networking Evolved

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


---

# Nested Network Objects Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Nested NetworkObjects

When a NetworkObject is beneath another NetworkObject it is considered nested. Fish-Networking allows you to nest NetworkObjects both in the scene and prefabs.

While spawning a root NetworkObject any active nested NetworkObjects will also be spawned. The nested NetworkObjects will experience the same callbacks as root, and share the same information such as IsOwner.

You may also have nested NetworkObjects deactivated in the scene or prefab and spawn them later.

When a nested NetworkObject is spawned after the root has already been spawned, the owner information is not automatically assumed the same as the root. You must specify if a client should gain ownership while calling Spawn.

Between instantiating the prefab and spawning the root NetworkObject you may make changes to nested NetworkObjects. This includes SyncTypes, and even the active state of the object. These changes are automatically synchronized when the root is spawned.

For example, if my prefab looks like this:

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FxtRFU2TxyM84L49zmadm%252F220801-15-12-145.png%3Falt%3Dmedia%26token%3D7a1b4ffe-59e9-48a3-9bbd-5f97a81a3135&width=768&dpr=4&quality=100&sign=dcc33f65&sv=2)

But I change the activate state of _NestedNob_ to disabled before server spawning as such:

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FaJQPkHgU4RSeFzY3pRwF%252F220801-15-13-264.png%3Falt%3Dmedia%26token%3D111fa11e-b908-4c4b-bffb-6852b45cc4ea&width=768&dpr=4&quality=100&sign=82c28c9b&sv=2)

RootNob will be spawned over the network with NestedNob disabled / not spawned.

Copy

    //An example of changing the enabled state for NestedNob.
    public GameObject MyPrefab;
    
    private void SpawnPrefab()
    {
        GameObject go = Instantiate(MyPrefab);
        GameObject nestedNob = go.transform.GetChild(0);
        nestedNob.SetActive(false);
        //MyPrefab will spawn with NestedNob disabled for server and all clients
        //until you spawn it at a later time.
        base.Spawn(go);
    }

Nested NetworkObjects may be spawned and despawned but they should not be detached. This feature is being examined for a future update.

There is an exception for nested scene NetworkObjects; they may be detached.


---

# Network Animator Fish Net Networking Evolved

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


---

# Network Behaviour Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# NetworkBehaviour

NetworkBehaviours are a fundamental part of networking which allow you to easily synchronize data and access network related information.

When inheriting from [NetworkBehaviours](/docs/manual/guides/components/network-behaviour-components) you are indicating that your script will utilize the network in some way. Once a NetworkBehaviour script is added to an object the NetworkObject component will automatically be attached.

NetworkBehaviours are essential for [Remote Procedure Calls](/docs/manual/guides/remote-procedure-calls), [Synchronizing](/docs/manual/guides/synchronizing), and having access to vital network information.

## 


Properties

There are several public properties available within NetworkBehaviour, many of which you will use regularly. Most of the properties are only available after the object has been initialized. See the [callbacks](/docs/manual/guides/network-behaviour-guides#server-and-host-1) section for more information on initialization.

Commonly used properties are:

*   **IsClientInitialized** will be true if acting as a client and object is network initialized.
    
*   **IsServerInitialized** will be true if acting as the server and object is network initialized.
    
*   **IsOwner** is true if you are a client, and the owner of the object.
    
*   **HasAuthority** is true if you are the owner, or if server and there is no owner.
    

To view all properties please visit the [NetworkBehaviour API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.NetworkBehaviour.html#properties).

When accessing a NetworkBehaviour property or method consider using the 'base' keyword to show your intentions.

For example, base.IsOwner

## 


Callbacks

You do not need to include the base.XYZ() calls when implementing callbacks.

Like Properties, there are a large number of available methods. The methods you will be using commonly are known as callbacks. If you are interested in all available methods view the [methods section under API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.NetworkBehaviour.html#methods).

Most callbacks have a server and client version, and each has great potential. To use a callback you must inherit from NetworkBehaviour and override the callback you wish to use.

Copy

    //Example of implementing an override.
    public override void OnStartServer()
    {
        //This is run when the server initializes the object.
    }

The execution order of spawn related callbacks is constant, but some callbacks may occur at any time. Included is a chart to help you remember callback order.

Unity Awake and OnEnable callbacks will always occur before any network activity.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252F69o1EmiTTB6axRWq8STY%252Fnb%2520cycle.jpg%3Falt%3Dmedia%26token%3D9bcfee28-609c-4a3c-863b-0a26c1227611&width=768&dpr=4&quality=100&sign=5608bf24&sv=2)

Created by Winterbolt

To begin we will cover the server side callbacks.

#### 


**OnStartNetwork:**

In some instances you will need to initialize for both server and client. You can save some code and time by using OnStartNetwork instead of the OnStart for Client and Server. It's important to remember that OnStartNetwork will only call once, even if you are clientHost.

Copy

    public override void OnStartNetwork()
    {
        /* If you wish to check for ownership inside
        * this method do not use base.IsOwner, use
        * the code below instead. This difference exist
        * to support a clientHost condition. */
        if (base.Owner.IsLocalClient)
            SetupCamera();
    }

#### 


**OnStartServer:**

Copy

    public override void OnStartServer()
    {
        /* This callback is performed first. It occurs
        * when the object is initialized on the server.
        * Once called Owner, ObjectId, and much more are
        * already set.
        * OnStartServer is best used for initializing
        * server aspects of your script, such as getting
        * components only the server would need.
        * It can also be useful for setting values based on
        * the current state of your game. If you change synchronized
        * values within this method, such as SyncTypes,
        * those changes will be delivered to clients
        * when this object spawns for them.
        * Eg: perhaps you want to set a players name, which is
        * a SyncVar. You can do that here and it will be set
        * for clients when the object spawns on their side. */
        
        /* When using OnStartServer keep in mind that observers have
        * not yet been built for this object. If you were to send an ObserversRpc
        * for example it would not be delivered to any clients. You can however
        * still use an ObserversRpc and set BufferLast to true if you wish
        * clients to get it when the object is spawned for them. Another option
        * is to use OnSpawnServer, displayed below, and send a TargetRpc to the
        * connection which the object is spawning. */
    }

When clientHost base.IsOwner will not return true, even with the owner set. This is because IsOwner is a client-side check, and the client has not yet initialized the object.

When you need to check 'IsOwner' on OnStartServer use **base.Owner.IsLocalClient**.

#### 


**OnOwnershipServer:**

Copy

    public override void OnOwnershipServer(NetworkConnection prevOwner)
    {
        /* This is received when the server is giving ownership
        * to a client. If a client is gaining
        * ownership when the object is spawned OnOwnershipServer
        * will be called immediately after OnStartServer. prevOwner
        * is the connection which just lost ownership. If ownership is changed
        * at runtime this callback also occurs. */
    }

#### 


**OnSpawnServer:**

Copy

    public override void OnSpawnServer(NetworkConnection connection)
    {
        /* This callback occurs after a spawn message for this
        * object has been sent out to a client. For example: if
        * this object will be visible to five clients, then this
        * callback will occur five times, where the connection
        * parameter will be for each client. 
        * Primarily you will use this callback to send
        * tailored communications to the client
        * the object is being spawned for. */
    }

#### 


**OnDespawnServer:**

Copy

    public override void OnDespawnServer(NetworkConnection connection)
    {
        /* OnDespawnServer is similar to OnSpawnServer, except this is
        * called right before an object is despawned for a client.
        * This method can be used to send information to the client
        * before they receive the despawn message. You may even
        * send object orientated communications for this object
        * such as SyncTypes, and RPCs. */
    }

When the server despawns a NetworkObject any pending synchronize changes will be sent out with the despawn message. This ensures clients will get the latest data, even if timed, before the object is despawned for them.

#### 


**OnStopServer:**

Copy

    public override void OnStopServer()
    {
        /* This is the last callback for server side.
        * OnStopServer will be called immediately before
        * the object is deinitialized. At this time it is
        * too late to send communications specific to this
        * object for clients.
        * This callback may be used for any number of things but
        * could be useful for resetting synchronized values
        * such as SyncTypes when a scene object is despawned. */
    }

Next are the client callbacks. These callbacks will always occur after the server callbacks, even when acting as host. For example, a callback sequence might look like this: OnStartServer, OnOwnershipServer, OnSpawnServer, OnStartClient, OnOwnershipClient.

For the most part client callbacks are the same as the server ones, except they occur only if the client connection is started. Only key differences will be included in the descriptions of each callback.

#### 


**OnStartClient:**

Copy

    public override void OnStartClient()
    {
        /* This is called on each client when the object
        * becomes visible to them. Networked values such as
        * Owner, ObjectId, and SyncTypes will already be
        * synchronized prior to this callback. */
    }

Any buffered remote procedure calls will occur immediately after OnStartClient.

If you are coming from Mirror instead of using OnLocalPlayer use OnStartClient with a base.IsOwner check.

#### 


**OnOwnershipClient:**

Copy

    public override void OnOwnershipClient(NetworkConnection prevOwner)
    {
        /* Current owner can be found by using base.Owner. prevOwner
        * contains the connection which lost ownership. Value will be
        * -1 if there was no previous owner. */
    }

#### 


**OnStopClient:**

Copy

    public override void OnStopClient()
    {
        /* Like the server variant this is called right
        * before the object is deinitialized. It is too
        * late to send communications to the server
        * for this object after this callback has occurred. */
    }

#### 


**OnStopNetwork:**

Like OnStartNetwork, this method can be used to save lines of code when needing to deinitialize for both server and client stop. OnStopNetwork will also only be called once even when clientHost.

Copy

    public override void OnStopNetwork()
    {
        /* This will call after OnStopServer
        * and OnStopClient. */
    }


---

# Network Collider Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# Network Collider

The NetworkCollider components are a simple way to use Trigger and Collision callbacks with prediction.

Each component offers callbacks for OnEnter, OnStay, and OnExit, which work even during the prediction cycle. These components are needed because of a limitation in Unity's physics system that affects their OnCollisionEnter and OnCollisionExit methods, causing them to not always be executed.

Fun fact: Fish-Networking is the only framework which provides a solution for using Enter/Exit collider callbacks with prediction!

Due to the complexity of physics with prediction we currently only support these components on primitive shapes: box, cube, sphere, circle, etc.


---

# Network Collision Fish Net Networking Evolved

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


---

# Network Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# NetworkManager

NetworkManager is an essential component for running the client and server. It acts as a bridge between core components and configuring your network.

Although this component manages the network, itself should not be a networked object, and must not contain a Network Object component on the same object, or as a parent of.

## 


Component Settings

**Settings** _are basic settings related to the NetworkManager._[](#settings-are-basic-settings-related-to-the-networkmanager)

**Run In Background** allows the application to run in the background when true. Running in the background is often essential for clients, and especially for server.

**Don't Destroy On Load** will ensure the Network Manager persist between scene changes. If you are using only one Network Manager it's best to leave this true.

**Persistence** specifies how to behave when multiple NetworkManagers are spawned at once.

Logging c_ontrols how network logging is configured._[](#logging-controls-how-network-logging-is-configured)

**Logging** lets you specify what actions to log for builds, editor, and headless. When the field is not populated default logging settings are used. To make a custom logging settings open your create menu -> Fish-Networking -> Logging -> Logging Configuration.

Prefabs _is for network prefab settings._[](#prefabs-is-for-network-prefab-settings)

**Spawnable Prefabs** dictates which prefabs collection to use for networked objects. By default this field is automatically set to DefaultPrefabObjects; you can however make your own PrefabObjects class with customized rules and applications.

**Object Pool** is which object pooling script to use. When not set DefaultObjectPool is added automatically. You may inherit from ObjectPool to create your own.

**Refresh Default Prefabs** while true will refresh the DefaultPrefabCollection every time play mode is entered. This is generally not needed as true, but can be useful if your prefab collection is regularly becoming corrupted through symlinks.


---

# Network Object Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkObject

This component is attached automatically anytime a script which inherits from NetworkBehaviour is added to your object.

## 


Component Settings

**Settings** _are general settings related to the NetworkObject._[](#settings-are-general-settings-related-to-the-networkobject)

**Is Networked** indicates if an object should always be considered a networked object. When false the object will not initialize as networked. This may be useful if you have objects that you sometimes want to only run locally, and other times spawn over the network. Anytime an object is spawned using ServerManager.Spawn _Is Networked_ automatically becomes true for that instantiated copy.

**Is Spawnable** should be marked if the object can spawn at runtime; this is generally false for scene prefabs you do not need to instantiate. While true this object's prefab will be added to DefaultPrefabObjects.

**Is Global** when true will make the NetworkObject known to all clients at all times, the object will also be added to the Don't Destroy on Load scene. This setting will have no effect on scene objects, but for instantiated objects it may be set in the prefab or changed at run-time immediately after instantiating the object.

**Initialize Order** determines the order in which NetworkObjects spawned in the same tick will run their initialization callbacks. A lower value will have higher priority and execute first. The default value is 0 and negative values are allowed.

**Prevent Despawn On Disconnect** will ensure the object will not be destroyed or despawned when the owning client disconnects.

**Default Despawn Type** is the default behavior when despawning the object. Objects are typically destroyed when despawned, but this can be set to other values, such as _Pool_, to save performance.

Prediction are values only enabled when using Prediction 2.[](#prediction-are-values-only-enabled-when-using-prediction-2)

**Enable Prediction** should be used to set whether the object is making use of prediction or not. Enabling this will make available the following settings.

**Prediction Type** is to determine if you are using rigidbodies or not for the predicted object. For example, if you were updating your transform with a CharacterController component this would be set to _Other_. If you were using rigidbodies you would choose _Rigidbody_ or _Rigidbody2D_.

**Enable State Forwarding** is used to forward the replicate and reconcile states to all clients. This is ideal for games where you want all clients and server to run the same inputs. Disabling this setting will cause prediction to only be used on the owner; you will then have to synchronize to spectators using other means, such as a NetworkTransform or custom script.

**Graphical Object** is the object which holds the graphics for your predicted object. When using client-side prediction all predicted objects must have their graphics as a child of the predicted object. For example, if your rigidbody and collider are on the root object, the graphics must remain beneath the root and set as the graphical object.

*   **Detach Graphical Object when t**rue will detach and re-attach the graphical object at runtime when the client initializes/de-initializes the item. This can resolve camera jitter or be helpful objects child of the graphical which do not handle reconiliation well, such as certain animation rigs. Transform is detached after OnStartClient, and reattached before OnStopClient.
    

*   **Interpolation** is how many ticks to interpolate the graphics on client owned objects. A setting as low as 1 can usually be sufficient to smooth over the frames between ticks.
    

*   **Enable Teleport** will allow the graphical object to teleport to it's actual position – also known as the root position – if the position changes are drastic. Ideally you will not need this setting, but it's an available option should you desire to use it.
    
    *   **Teleport Threshold** is shown while teleporting is enabled. If the graphical object's position is this many units away from the actual position, then the graphical object will teleport to the actual position.


---

# Network Objects Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# NetworkObjects

Details on the different types of NetworkObjects that will be referenced throughout the guides.

## 


NetworkObject

Any GameObject with a **NetworkObject** component on it will be considered a "NetworkObject" in these guides going forward. Review the **NetworkObject** component Page for details on the various settings for a **NetworkObject.**

When you are to add a [**NetworkBehaviour**](/docs/manual/guides/components/network-behaviour-components) component to your prefabs or scene objects the NetworkBehaviour will search for a NetworkObject component on the same object, or within parent objects. If a NetworkObject is not found then one will be added automatically to the top-most object.

## 


Spawned NetworkObject

NetworkObjects that are Instantiated and Spawned using ther ServerManager.Spawn() method will be considered a "Spawned NetworkObject". "IsSpawned" Property will be marked True internally on the NetworkObject Component.

## 


Scene NetworkObject

Any **NetworkObject** that exists as part of the Scene aka - never instantiated/spawned into the scene, will be considered a "**Scene NetworkObject**" in these guides going forward. "IsSceneObject" property will be marked true on the attached **NetworkObject** component internally.

## 


Global NetworkObject

Any **NetworkObject** with their bool "IsGlobal" marked "true" either in the inspector or with code will be considered a "**GlobalNetworkObject**" in the guides going forward.

**GlobalNetworkObjects** will automatically be put into the ("DontDestroyOnLoad") scene when instantiated on the server, and when spawned on the clients.

Scene objects cannot be marked as global. All global objects must be instantiated and spawned.

## 


Nested NetworkObject

Any **NetworkObject** that are a child of another **NetworkObject** will considered a "**Nested NetworkObject**" in these guides going forward. "IsNested" property will be marked true on the attached **NetworkObject** component internally.


---

# Network Observer Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkObserver

NetworkObserver uses conditions to determine if a client qualifies to be an observer of an object; any number of conditions may be used. The NetworkObserver component can be used to override the [ObserverManager](/docs/manual/guides/components/managers/observermanager), or add additional conditions onto the object which NetworkObserver is added.

## 


Conditions

There are several included conditions, which may be used together. ObserverCondition may also be inherited from to make your own conditions. When all conditions are true, the object will become visible to the client.

Each condition must be created as a scriptable object, and dropped into the Network Observer component.

**Distance Condition** is true if clients are within specified distance of the object.

**Grid Condition** is similar to DistanceCondition and is true if clients are within specified distance of the object. GridCondition is less accurate but more performant. This condition requires you to place a HashGrid on or beneath your NetworkManager object.

**Scene Condition** is true if the client shares any scenes with the object.

**Match Condition** is true when players or objects share the same match. Both owned and non-owned objects can be added to matches. Objects or players not added to matches will have their data synchronized with everyone, unless prevented by another condition. See the [MatchCondition api](https://firstgeargames.com/FishNet/api/api/FishNet.Component.Observing.MatchCondition.html) for more information on usage.

**Owner Only Condition** is true when a player owns the object. An owner condition will make an object only visible to the owner. If there is no owner, the object will not be visible to any clients.

**Host Only Condition** is true when the player is clientHost. Any connection which is not clientHost will fail this condition.

## 


Component Settings

**Override Type** is used to change how the NetworkObserver component uses the ObserverManager settings. _Add Missing_ will add any conditions from the ObserverManager which are not already on the NetworkObserver. _UseManager_ replaces conditions with those from the manager. _Ignore Manager_ will keep the NetworkObserver conditions, ignoring the ObserverManager entirely.

**Update Host Visibility** will change the visibility of renderers for clientHost when server objects are not visible to the client. If you wish to enable and disable other aspects during a visibility change consider using the NetworkObject.OnHostVisibilityUpdated event.

**Observer Conditions** are which conditions to use.


---

# Network Tick Smoother Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)
9.  [Tick Smoothers](/docs/manual/guides/components/utilities/tick-smoothers)

# NetworkTickSmoother

The NetworkTickSmoother initializes it's settings using NetworkBehaviour callbacks, and may only be placed below a NetworkObject.

## 


Component Settings

Initialization settings are essential to the component working.[](#initialization-settings-are-essential-to-the-component-working)

**Target Transform** is the transform you want to follow. This is commonly the NetworkObject but may be other nested NetworkBehaviours when using multiple smoothers beneath a single NetworkObject.

**Detach On Start** when true will unparent the object which the smoother is attached, placing it as root in world space. Detach is commonly used when the smoothed object is a camera target, given cameras do not handle rollback or larger tick steps well.

**Attach On Stop** when true will reparent the graphical object when the network stop callbacks occur on the object, as detach will unparent on network start callbacks. Typically you want to reattach graphical objects. If the Target Transform is destroyed while detached the object the smoother is attached to will also destroy itself.

*   **Enable Teleport** will allow the graphical object to teleport to it's actual position – also known as the root position – if the position changes are drastic. Ideally you will not need this setting, but it's an available option should you desire to use it.
    
    *   **Teleport Threshold** is shown while teleporting is enabled. If the graphical object's position is this many units away from the actual position, then the graphical object will teleport to the actual position.
        
    

**Owner Smoothing determines how the object is smoothed for the owner.**[](#owner-smoothing-determines-how-the-object-is-smoothed-for-the-owner)

*   **Enable Teleport** will allow the graphical object to teleport to it's actual position – also known as the root position – if the position changes are drastic. Ideally you will not need this setting, but it's an available option should you desire to use it.
    
    *   **Teleport Threshold** is shown while teleporting is enabled. If the graphical object's position is this many units away from the actual position, then the graphical object will teleport to the actual position.
        
    
*   **Adaptive Interpolation** when not set off will increase the interpolation amount as the local client's latency becomes higher. Low settings of adaptive interpolation will increase the interpolation at lower amounts, while high of course increases interpolation more. When Adaptive Interpolation is set off a flat amount of interpolation is used at all times. Flat interpolation is often used in competitive or reaction based games to keep the interpolation consistent for all players. Flat interpolation is also necessary for accurate collider rollback, given our collider rollback system needs to know the amount of interpolation a client sees to provide accurate raycast hit results. Adaptive interpolation is best used with casual games where you want the absolute smoothed experiences regardless of local client latency.
    
    *   **Interpolation Value** is displayed when Adaptive Interpolation is off. This is a flat amount of interpolation that does not increase when the local client's latency does.
        
    
*   **Smoothed Properties** determines which properties of the transform will be smoothed. If smoothing is not set for a specific property then that particular value will persist in the same world space at all times. For example, if you uncheck Position from Smoothed Properties and move the root, the object which this component sits will never move in space, unless you of course move it manually.
    

Spectator smoothing settings are the same as Owner settings. When you are the owner of the object Owner settings will be used, and Spectator settings when not the owner.

## 


Scale Smoothing

Scale behaves a little differently when smoothed. Since nested objects use a localScale they will not change with the parent scale, and thus cannot be easily interpolated.

If you wish to smooth scale transitions then **Detach** (and optionally **Reattach**) must be enabled in the initialization settings so that the smoothed object does not have it's global(lossy) scale modified by Unity when the target transform or any higher transform has it's scale changed.

## 


Runtime

There are several public APIs available for changing the smoother settings at runtime. An example of some are changing adaptive interpolation type, interpolation value, teleporting the smoothed object, and more.

Please review our [API](/docs/manual/api) for all runtime settings.


---

# Network Transform Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# NetworkTransform

The NetworkTransform synchronizes transform properties across the network.

You may place as many NetworkTransforms as you like on children. A single NetworkTransform will synchronize the object it is on.

## 


Component Settings

Settings _are general settings related to the NetworkTransform._[](#settings-are-general-settings-related-to-the-networktransform)

**Component Configuration** attempts to automatically configure components used to move your object. For example, if you were to use a CharacterController you could change this setting to CharacterController and the CharacterController will be automatically configured based on other NetworkTransform settings. This feature does not change owner smoothing; for example, if you are using a client authoritative rigidbody setting the Component Configuration to rigidbody will not interpolate the rigidbody for owner, but rather configures the rigidbody on non-owners and server so the NetworkTransform can smooth it properly.

**Synchronize Parents** as true will automatically synchronize which objects the transform is attached to.

**Use Network Level of Detail** will allow the configured NetworkTransform to use level of detail, should you have it enabled on the [ServerManager](/docs/manual/guides/components/managers/server-manager).

*   When false:
    
    *   **Send Interval** is shown when use network level of detail is disabled. This value can be increased to send updates less frequently for certain objects. A value of 1 will send every tick, and a value of 2 will send often as every other tick. Send interval may also be set at runtime.
        
    

**Packing** determines the level of packing for each transform property. In some instances you may want more precision; less packing allows this option at the cost of bandwidth.

Smoothing _allows fine tuning of how the NetworkTransform smooths for spectators._[](#smoothing-allows-fine-tuning-of-how-the-networktransform-smooths-for-spectators)

**Interpolation** is how long of a buffer to create when replicating the transform. Larger interpolation values will reduce the chance of jitter should there be network lag in favor of the transform being further in the past.

**Extrapolation (pro feature)** is how long the transform will try to predict movement when new data is expected, but does not arrive. Using a low interpolation value mixed with extrapolation is a great way to get responsive movement without showing network latency.

**Enable Teleport** will reveal and enable the **Teleport Threshold** value.

*   When true:
    
    *   **Teleport Threshold** is how far the transform must travel in a single update to cause a teleport rather than smoothing. Using a value of 0f will teleport every frame.
        
    

Authority _determines who controls who determines sending values, versus receiving and smoothing them._[](#authority-determines-who-controls-who-determines-sending-values-versus-receiving-and-smoothing-them)

**Client Authoritative** as true allows the owning client to make changes to their transform locally, and those changes will be sent to the server and other clients. While false the server must change transforms to have them sent to clients.

*   When false:
    
    *   **Send To Owner** will only be displayed when **Client Authoritative** is false. While **Send To Owner** true the server will also send transform changes to the owner; while false the owner will not get the transform changes by the server. This can be useful for server authoritative movement.
        
    

Synchronizing _determines which transform properties are synchronized and how_[](#synchronizing-determines-which-transform-properties-are-synchronized-and-how)

**Send Interval** determines at most how often in ticks the NetworkTransform may send. A value of 1 indicates the NetworkTransform can send every tick, if there is change. A value of 5 would mean that the NetworkTransform will send at most every 5 ticks, even if there is change between each tick. For example: if using an interval of 5 and the transform changes and sends on tick 100, then changes on 101, the next update will not send until 105.

**Synchronize and Snapping** lets you choose which properties to synchronize. Only changed values will send over the network, but if you do not want a value to update at all you can turn off synchronization for a transform property. Snapping will allow the transform to snap axes rather than smooth them over time. This feature is commonly used for 2D games, such if you wanted to flip the Y axis on rotation immediately.


---

# Network Trigger Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)
9.  [Network Collider](/docs/manual/guides/components/prediction/network-collider)

# NetworkTrigger

NetworkTrigger is used to execute trigger events for use with prediction.

**Settings** _are general settings related to the component._[](#settings-are-general-settings-related-to-the-component)

**Maximum Simultaneous Hits** is the maximum number of simultaneous hits that the component will check for. You can use this field to customize how many overlapping colliders the component should be able to detect. It should be noted that having too large of a value will decrease its performance. In most cases, the default value of 16 suffices.

**History Duration** determines how long collision history is retained. Lower values optimize memory usage slightly, but may lead to the collision records becoming out of sync on clients with excessively high latency.

**Additional Size** determines the distance in units by which collision traces are extended. This extension helps prevent missed overlaps when colliders do not intersect sufficiently. Depending on the scale used in your game you may want to raise or lower this value.


---

# Non Controlled Object Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)

# Non-Controlled Object

A very simple script for keeping non-controlled objects in synchronization with the prediction system.

Many games will require physics bodies to be networked, even if not controlled by players or the server. These objects can also work along-side the new state system by adding a basic prediction script on them.

It's worth noting that you can also 'control' non-owned objects on the server by using base.HasAuthority. This was discussed previously [here](/docs/manual/guides/prediction/creating-code/controlling-an-object).

## 


Sample Script

Below is a full example script to synchronize a non-controlled rigidbody. Since the rigidbody is only reactive, input polling is not needed. Otherwise you'll find the data structures are near identical to the ones where we took input.

It is strongly recommended to review the [controlling objects](/docs/manual/guides/prediction/creating-code/controlling-an-object) guide for additional notes in understanding the code below.

Copy

    public class RigidbodySync : NetworkBehaviour
    {
        //Replicate structure.
        public struct ReplicateData : IReplicateData
        {
            //The uint isn't used but Unity C# version does not
            //allow parameter-less constructors we something
            //must be set as a parameter.
            public ReplicateData(uint unused) : this() {}
            private uint _tick;
            public void Dispose() { }
            public uint GetTick() => _tick;
            public void SetTick(uint value) => _tick = value;
        }
        //Reconcile structure.
        public struct ReconcileData : IReconcileData
        {
            public PredictionRigidbody PredictionRigidbody;
            
            public ReconcileData(PredictionRigidbody pr) : this()
            {
                PredictionRigidbody = pr;
            }
        
            private uint _tick;
            public void Dispose() { }
            public uint GetTick() => _tick;
            public void SetTick(uint value) => _tick = value;
        }
    
        //Forces are not applied in this example but you
        //could definitely still apply forces to the PredictionRigidbody
        //even with no controller, such as if you wanted to bump it
        //with a player.
        private PredictionRigidbody PredictionRigidbody;
        
        private void Awake()
        {
            PredictionRigidbody = ObjectCaches<PredictionRigidbody>.Retrieve();
            PredictionRigidbody.Initialize(GetComponent<Rigidbody>());
        }
        private void OnDestroy()
        {
            ObjectCaches<PredictionRigidbody>.StoreAndDefault(ref PredictionRigidbody);
        }
    
        //In this example we do not need to use OnTick, only OnPostTick.
        //Because input is not processed on this object you only
        //need to pass in default for RunInputs, which can safely
        //be done in OnPostTick.
        public override void OnStartNetwork()
        {
            base.TimeManager.OnPostTick += TimeManager_OnPostTick;
        }
    
        public override void OnStopNetwork()
        {
            base.TimeManager.OnPostTick -= TimeManager_OnPostTick;
        }
    
        private void TimeManager_OnPostTick()
        {
            RunInputs(default);
            CreateReconcile();
        }
    
        [Replicate]
        private void RunInputs(ReplicateData md, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
        {
            //If this object is free-moving and uncontrolled then there is no logic.
            //Just let physics do it's thing.	
        }
    
        //Create the reconcile data here and call your reconcile method.
        public override void CreateReconcile()
        {
            ReconcileData rd = new ReconcileData(PredictionRigidbody);
            ReconcileState(rd);
        }
    
        [Reconcile]
        private void ReconcileState(ReconcileData data, Channel channel = Channel.Unreliable)
        {
            //Call reconcile on your PredictionRigidbody field passing in
            //values from data.
            PredictionRigidbody.Reconcile(data.PredictionRigidbody);
        }
    }


---

# Object Pooling Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Object Pooling

Fish-Networking has built-in functionality for Object pooling that will allow the server and client to keep instances of loaded prefabs in memory for later use. This could potentially provide better spawning performance for clients and server.

## 


General

When Despawning [Spawned NetworkObjects](/docs/manual/guides/networkobjects#spawned-networkobject) using FishNet, instead of destroying the object you may just want to disable it and store it to be used again at a later time. This describes what Object Pooling is. FishNet has a default implementation that will allow the objects you have instantiated to be disabled and pooled, instead of being destroyed. This functionality works for clients and server. You can also Pre-warm assets for later use, which is discussed later in this guide.

Reminder that [Scene NetworkObjects](/docs/manual/guides/networkobjects#scene-networkobject) do not get added to the Object Pool and are already disabled instead of destroyed when despawned.

## 


Setup

As mentioned on the [NetworkManager](/docs/manual/guides/components/managers/network-manager) component page, there is an assignable field labeled _ObjectPool__**.**_ You may assign any script which inherits from the **ObjectPool** class. By Default when examining the NetworkManager in the Editor nothing will be assigned to this field, however when you enter play mode the NetworkManager will automatically populate it with the default implementation, and attach the script to the NetworkManager GameObject.

See below for screen captures of the NetworkManager.

![Editor Mode](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FFAFMveSKMK9oml2deH6j%252Fimage.png%3Falt%3Dmedia%26token%3D91c63e9a-affc-402b-97a7-31159d2369b7&width=768&dpr=4&quality=100&sign=2baf6e6d&sv=2)

Editor Mode - Nothing will be assigned, unless you impliment your own Object Pool

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252F8DYAK04Sr5ZcRGer6XOa%252Fimage.png%3Falt%3Dmedia%26token%3D4ab1161b-ab49-42dd-a870-00a07856d079&width=768&dpr=4&quality=100&sign=183d0a6&sv=2)

Play Mode - Default Object Pool Automatically Assigned

By default the object pool is enabled, but your network objects will only use the pool if the default despawn behavior is modified, or through the despawn call. See below for examples to both of these.

### 


Default Despawn Behavior

On the NetworkObject component you can set what the default despawn behavior is for the object where the script is placed. This setting is set to "Destroy" by default, so make sure to switch this over to "Pool" if you want Fish-Networking to automatically use the default object pool.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FmkDIZq8n1iNyw3Bf48wb%252Fimage.png%3Falt%3Dmedia%26token%3D4841e66e-4d90-4a03-b8f3-f383bc2994c5&width=768&dpr=4&quality=100&sign=aadbf67f&sv=2)

### 


Manual Despawn Behavior

You can manually change the despawn behavior through code for specific situations.

Copy

    //When calling Fishnets Despawn from any location you can pass a enum 
    //perameter to deviate from the default behavior.
    ServerManager.Despawn(nob, DespawnType.Pool);

### 


Spawning NetworkObjects

When using the object pool you will want to retrieve NetworkObject from it prior to network spawning them. Doing so will pull from the pool rather than instantiate new objects.

Copy

    //There are many overrides which can a variety of information.
    //You can use GameObjects, NetworkObjects, PrefabIds, CollectionIds,
    //spawn positions, and more.
    NetworkObject nob = NetworkManager.GetPooledInstantiated(...);
    //Spawn normally.
    ServerManager.Spawn(nob);

If you are certain you do not wish to use the object pool on a specific object you can still use the code above and simply set the Default Despawn Type to Destroy on the NetworkObject, or Instantiate and spawn normally.

## 


Pre-Warming the ObjectPool

If you want to manually store Network Objects to the ObjectPool prior to needing them at run-time you may do so through the NetworkManager API.

Here is a very basic implementation of pre-warming the ObjectPool.

Copy

    [SerializeField]
    private NetworkObject _nobPrefab;
    
    private void Start()
    {
        /// <summary>
        /// Instantiates a number of objects and adds them to the pool.
        /// </summary>
        /// <param name="prefab">Prefab to cache.</param>
        /// <param name="count">Quantity to spawn.</param>
        /// <param name="asServer">True if storing prefabs for the server collection.</param>
        InstanceFinder.NetworkManager.CacheObjects(_nobPrefab, 100, IsServer);
    }

## 


Custom Implementation

FishNet allows for the user to implement their own method of object pooling. First create your own class inheriting from the **ObjectPool** class. Place your new class component in your scene, typically directly on the NetworkManager object. Then assign your component to the _ObjectPool_ field on the NetworkManager.


---

# Observer Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# ObserverManager

ObserverManager assists in controlling what network objects each client may see.

ObserverManager is used to globally customize the observer system. Observer conditions within the ObserverManager will be automatically added to NetworkObjects, unless the [NetworkObserver](/docs/manual/guides/components/network-observer) component is set to ignore the manager.

## 


Component Settings

Settings _are general settings related to the ObserverManager._[](#settings-are-general-settings-related-to-the-observermanager)

**Default Conditions** are conditions which will be added to all NetworkObjects by default.

**Update Host Visibility** will hide renderers on networked objects which are hidden to clientHost. When true all networked objects will be visible to the clientHost even if these objects would normally be despawned for the client.


---

# Observers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Observers

An observer is a client which can see an object, and use communications for the object. You may control which clients can observe an object by using the [NetworkObserver](/docs/manual/guides/components/network-observer) and/or [ObserverManager](/docs/manual/guides/components/managers/observermanager) components.

If a client is not an observer of an object then the object will not active, and the client will not receive network messages or callbacks for that object. Should the object be a [scene object](/docs/manual/general/terminology/miscellaneous#scene-object) then it will remain disabled on the client until they become an observer of it. If the object is [instantiated](/docs/manual/general/terminology/miscellaneous#instantiated-object) then the client will simply not instantiate the object until after becoming an observer.

The observer system is designed to work out of the box for new developers. When it comes time to customize how clients observe objects, the observer system additionally offers a large amount of flexibility, keeping in mind there are many condition types, and that you may also create your own.

Fish-Networking comes with a NetworkManager prefab which contains the recommended minimum components to begin working on a new project. Within that prefab is the [ObserverManager](/docs/manual/guides/components/managers/observermanager) with an included [Scene Condition](/docs/manual/guides/components/network-observer#component-settings). If you have not familiarized yourself with the ObserverManager and condition types please do so now using the links above.

A common problem new developers encounter is scene objects not being enabled for clients. This occurs when the client is not considered part of the scene where the object resides, and the scene condition is preventing that object from spawning for the client. The NetworkManager prefab contains a PlayerSpawner script which adds the player to the current scene, which would make the clients an observer for objects in that scene; this also requires a player object to be spawned. Should you have made your own NetworkManager object or removed the PlayerSpawner script you will also need to add the client to the scene you wish the client to be an observer of.

When encountering such an issue you may of course also remove the ObserverManager or scene condition from the ObserverManager, but this is not recommended as objects in other scenes will attempt to spawn for clients which do not occupy such scenes. Alternatively, you may add the client to the scene where the objects reside; there's a variety of ways to accomplish this.

Under the assumption you removed the PlayerSpawner and/or are not using _SceneManager.AddOwnerToDefaultScene_, then you must load the client into the scene using the SceneManager. Clients are only considered networked into scenes when those scenes are loaded using the SceneManager. Clients may become part of a scene by loading a scene globally, or loading a scene for a specific client(connection). See the [SceneManager](/docs/manual/guides/scene-management) section for more information on how to manage networked client scenes as well understand the difference between global and connection scenes.


---

# Offline Rigidbodies Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Offline Rigidbodies

In some cases you will want the player to be able to interact with non-networked rigidbodies; these require a special component.

While prediction is in use, if you have a rigidbody object in your game that is not synchronized with the network it must contain an OfflineRigidbody component. Please review the [OfflineRigidbody component page](/docs/manual/guides/components/prediction/offlinerigidbody) for more information on it's uses.


---

# Offline Rigidbody Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# OfflineRigidbody

When using predictions, especially physics prediction, the client will often re-simulate physics to make corrections. You generally want to add an OfflineRigidbody component to prevent non-networked objects from simulating multiple times during a correction.

## 


Component Settings

**Rigidbody Type** is to specify if the offline object uses a rigidbody3d, or 2d.

**Get In Children** should be enabled if you have child rigidbodies. Keeping this disabled when child rigidbodies are not present will save a very small amount of performance.

## 


Combining Smoothers

There is a fair chance you will want to have the graphical object on your rigidbodies smoothed between ticks. There are a variety of components to accomplish this; see them on the [Utilities](/docs/manual/guides/components/utilities) page.


---

# Offline Tick Smoother Fish Net Networking Evolved

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


---

# Ownership Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Ownership

Ownership is a term you will see and use very frequently throughout your development with Fish-Net. There can be only one owner, and ownership dictates which client has control over an object. It's important to know that an object does not always have an owner, and that ownership changes must be completed by the server.

When a client owns an object they are considered the rightful user to take actions on the object, such as moving a character or using a weapon on that character. You might also want to give a client temporary ownership over world objects, such as using a turret in your scene.

There are several ways to give ownership to a client. The first is spawning an object with a specific connection, or client, as the owner. There is an example below, but you may also see [Spawning and Despawning](/docs/manual/guides/spawning) for more information on this.

## 


Spawning With Ownership

Copy

    Gameobject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, ownerConnection);

## 


Changing Or Adding Ownership

If an object is already spawned you may give or take ownership for that object at anytime. The example below shows how to give ownership to a connection. Previous owners will be replaced with the newOwner. Both the previous and new owner, as well the server can receive a callback indicating that the owner status has changed. See [NetworkBehaviour Callbacks](/docs/manual/guides/network-behaviour-guides) for more details.

Copy

    networkObject.GiveOwnership(newOwnerConnection);

## 


Removing Ownership

You can also remove ownership from a client on any object at any time.

Copy

    networkObject.RemoveOwnership();

As mentioned an owner is a client, commonly one that has control over an object. You can verify that you own an object by using the _IsOwner_ property in your script. Your script must inherit from [NetworkBehaviour](/docs/manual/guides/components/network-behaviour-components) to use this. Here's a demonstration of only moving a character if the client is an owner of the object.

Copy

    private void Update()
    {
        if (base.IsOwner)
        {
            float hor = Input.GetAxisRaw("Horizontal");
            float ver = Input.GetAxisRaw("Vertical");
            transform.position += new Vector3(hor, 0f, ver);
        }
    }

The above code will only move the transform if the client has ownership. Commonly when paired with [Network Transform](/docs/manual/guides/components/network-transform) and Client Authoritative, this will relay that movement to the server, and the server will send it to other clients.

## 


Checking Ownership

Ownership can be checked a variety of ways. These can all be checked on the NetworkObject or a NetworkBehaviour.

Copy

    //Is true if the local client owns the object.
    base.IsOwner;
    //Returns the current owner NetworkConnection.
    //This can be accessible on clients even if they do not own the object
    //so long as ServerManager.ShareIds is enabled. Sharing Ids has absolutely no
    //security risk.
    base.Owner;
    //True if the local client owns the object, or if
    //is the server and there is no owner.
    base.IsController


---

# Performance Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)

# Performance

Prior to Fish-Networking we developed assets for other solutions, such as Mirror Networking. These assets have proven to perform 4 times faster, and use little as 13% the bandwidth of Mirror's internal components. Unfortunately, third party assets can only go so far. This is strongly in part why Fish-Networking was made.

Fish-Networking has been designed with performance and bandwidth in mind. Features are regularly benchmarked for client and server performance, as well bandwidth consumption; these metrics are important while deploying. Better performance allows your project to run on cheaper hardware, and enables a higher concurrent user count. By using less bandwidth Fish-Networking reduces your server bills.

## 


Bandwidth

**Networked Objects (moving)**

In most games moving objects will contribute the majority of used bandwidth. Fish-Networking's bandwidth consumption competes aggressively against modern paid solutions, and does better than any other free solution.

**Remote Procedure Calls**

Remote procedure calls, shortened to RPCs, are commonly placed second in bandwidth consumption. RPCs are used to communicate between the server and client. Fish-Networking uses only two bytes per RPC, while other free solutions use a minimum of 23 bytes.

## 


CPU

Another very important aspect is how well the networking solution scales. A better scaling solution ensures it will run on less expensive hardware, and get you closer to your MMO goals.

#### 


Network Object Count (idle)

It's not uncommon for frameworks to lose performance as more networked objects are spawned. Fish-Networking retains nearly 100% of it's performance regardless of how many objects are spawned.

#### 


Concurrent Users

Fish-Networking retains a large amount of performance with hundreds of users updating every tick. Other networking solutions have shown to slow down drastically as more concurrent users join the server.

**Client Experience**

With more objects, users, or activity even clients can be affected by a poorly designed networking solution. Fish-Networking has scored roughly 70% more frames per second on clients than other free solutions, such as Mirror.


---

# Persisting Network Objects Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Persisting NetworkObjects

This page will go over details on the options available to users for persisting NetworkObjects across scene loading and unloading

## 


General

The options available to users to keep **NetworkObjects** persisting across scenes depends on the type of NetworkObject.

## 


Spawned NetworkObjects

[**Spawned NetworkObjects**](/docs/manual/guides/networkobjects#spawnednetworkobject) that do not fall into the other categories below can persist between scenes by moving them while loading into the next scene. The [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata) that is passed into the Load Method of the SceneManager has an array that you can populate with all of the Spawned NetworkObjects you want to send to the new loaded scene.

The SceneManager will handle the objects correctly for you and also flag a Debug if you try to send a GameObject that is not allowed.

If you load Multiple Scenes in one method call, and you are moving network objects using SceneLoadData. The moved networkobjects will move into the first valid scene requested.

#### 


Example

Copy

    // Just Create an array of NetworkObjects 
    // that are not a Scene, Global or Nested NetworkObjects.
    NetworkObject[] objectsToMove = new NetworkObject[] { object1, object2, object3 }
    
    // Assign this array to the SceneLoadData before you Load a Scene.
    SceneLoadData sld = new SceneLoadData("NewScene");
    sld.MovedNetworkObjects = objectsToMove;
    
    // Fishnet will handle the rest after loading!
    SceneManager.LoadGlobalScenes(sld);

## 


Scene NetworkObjects

[**Scene NetworkObjects**](/docs/manual/guides/networkobjects#scenenetworkobject) currently cannot persist across scenes, it is a [**limitation**](/docs/manual/guides/technical-limitations) with the way Unity and Fishnet was designed. You can not mark them as Global, or put them into "DontDestroyOnLoad" scene. If you would like a Scene NetworkObject to persist across scenes it is recommended to remove them and use the other options available on this page.

## 


Global NetworkObjects

**G**[**lobal NetworkObjects**](/docs/manual/guides/networkobjects#globalnetworkobject) work similar to how a normal GameObject would when put into the "DontDestroyOnLoad"(DDOL) scene. When loading and unloading scenes, **Global NetworkObjects** will stay in the (DDOL) scene on both the server and client persisting their state. No extra steps needed.

To make a NetworkObject global just mark the IsGlobal Boolean "true" on the NetworkObject component.

Clients typically are always an observer of the DDOL scene, so global objects may make more sense for Manager type GameObjects, instead of gameobjects that have meshes, but you are not limited to this.

## 


Nested NetworkObjects

Unity will not allow [**Nested GameObjects**](/docs/manual/guides/spawning/nested-networkobjects) to be moved into other scenes. However! Fishnet will automatically detect if you are trying to send a NestedNetworkObject and send the root of the object instead!


---

# Ping Display Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)

# PingDisplay

PingDisplay will show your local client's current ping, otherwise known as latency.

## 


Component Settings

**Color** is which color to use for the displayed text.

**Placement** indicates which part of the screen to display the ping.

**Hide Tick Rate** will remove tick rate latency from the ping results.


---

# Predicted Owner Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# PredictedOwner

PredictedOwner allows clients to immediately simulate ownership on an object without waiting for the server response. This overcomes delays from client latency, allowing for a seamless transition of ownership.

Placing this component on an object enables this feature for that network object.

## 


Component Settings

**Allow Take Ownership** enables this component to work when true. This setting can be changed at runtime.


---

# Predicted Spawn Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# PredictedSpawn

Adding this component to a NetworkObject will allow you to adjust predicted spawning settings for the object. To enable this feature you must also enable predicted spawning within the [ServerManager](/docs/manual/guides/components/managers/server-manager).

The PredictedSpawn component offers several virtual methods to override to customize and validate predicted spawns.

## 


Component Settings

**Allow Spawning** allows clients to predicted spawn the object.

**Allow Despawning** allows clients to predicted despawn the object.

You can implement WritePayload and ReadPayload in your classes which inherit NetworkBehaviour to send data with spawn messages. This can even be used for predicted spawns to the server, and clients!


---

# Predicted Spawning Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Spawning and Despawning](/docs/manual/guides/spawning)

# Predicted Spawning

Predicted spawning an object allows a client to spawn an object locally and begin using networked features immediately, including RPCs.

Currently predicted spawns cannot be nested during the spawning process. We are looking to remove this limitation throughout the development of version 4.

The term predicted spawning also means predicted despawning, where the client may despawn the object locally while awaiting for a server response.

### 


Global Settings

By default predicted spawning is disabled. To enable predicted spawning you must adjust settings on your ServerManager. If you do not already have a ServerManager then you must add one to your NetworkManager object to change settings.

The enabled state of this feature can be set by checking **Allow Predicted Spawning** on the ServerManager. You may also adjust the **Reserved Object Ids** value. To learn more of these visit the [ServerManager component](/docs/manual/guides/components/managers/server-manager) section.

### 


Settings Per Object

Even with predicted spawning enabled globally NetworkObjects must be set to also allow predicted spawning or despawning. This ensures that only the objects you specify may use this feature, allows you to limit predicted spawning the capabilities for the object, and lets you use custom code to further validate or control predicted spawning.

For prefabs or scene objects you wish to allow predicted spawning on add the [PredictedSpawn component](/docs/manual/guides/components/prediction/predictedspawn) to them.

You can inherit the PredictedSpawn component for overrides to customize predicted spawning.

### 


Using Predicted Spawning

Once enabled globally and per your desired objects predicted spawning and despawning may be used on clients as though they were the server. All of the same spawn and despawn methods work, including even specifying who may own the object when spawned.


---

# Predicting States In Code Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)
9.  [Understanding ReplicateState](/docs/manual/guides/prediction/creating-code/understanding-replicatestate)

# Predicting States In Code

Due to the unpredictability of the Internet inputs may drop or arrive late. Predicting states is a simple way to compensate for these events.

If your game is fast-paced and reaction based, even if not using physics, predicting states can be useful to _predict_ the next inputs you'll get from the server before you actually get them.

Both the server and client can predict inputs.

The server may predict inputs to accommodate for clients with unreliable connections.

Clients would predict inputs on objects they do not own, or as we often call them "spectated objects".

By predicting inputs you can place objects in the future of where you know them to be, and even make them entirely real-time with the client. Keep in mind however, when predicting the future, if you guess wrong there will be a de-synchronization which may be seen as jitter when it's corrected in a reconcile.

Below is an example of a simple replicate method.

Copy

    //What data does is irrelevant in this example.
    //We're only interested in how to predict a future state.
    [Replicate]
    private void RunInputs(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    { 
        float delta = (float)base.TimeManager.TickDelta;
        transform.position += new Vector3(data.Horizontal, 0f, data.Vertical) * _moveRate * delta;
    }

Before we go any further you must first understand what each ReplicateState is. These change based on if input is known, replaying inputs or not, and more. You can check out the [ReplicateState API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.ReplicateState.html) which will explain thoroughly. You can also find this information right in the source of FishNet.

If you've read through ReplicateState and do not fully understand them please continue reading as they become more clear as this guide progresses. You can also visit us on Discord for questions!

Covered in the ReplicateStates API: CurrentCreated will only be seen on clients if they own the object. When inputs are received on spectated objects clients run them in the reconcile, which will have the state ReplayedCreated. Clients will also see ReplayedFuture and CurrentFuture on spectated objects.

A state ending in 'Future' essentially means input has not been received yet, and these are the states you could predict.

Let's assume your game has a likeliness that players will move in the same direction regularly enough. If a player was holding forward for three ticks the input would look like this...

Copy

    (data.Vertical == 1)
    (data.Vertical == 1)
    (data.Vertical == 1)

But what if one of the inputs didn't arrive, or arrived late? The chances of inputs not arriving at all are pretty slim, but arriving late due to network variance is extremely common. If perhaps an input did arrive late the values may appear as something of this sort...

Copy

    (data.Vertical == 1)
    (data.Vertical == 1)
    (data.Vertical == 0) //Didn't arrive here, but will arrive late next tick.
    (data.Vertical == 1) //This was meant to arrive the tick before, but arrived late.

Because of this interruption the player may seem to move forward twice, pause, then forward again. Realistically to help cover this up you will have interpolation on your graphicalObject as shown under the prediction settings for [NetworkObject.](/docs/manual/guides/components/network-object) The [PredictionManager](/docs/manual/guides/components/prediction) also offers QueuedInputs which can give you even more of a buffer. For the sake of this guide though we're going to pretend both of those didn't get the job done, and you need to account for the late input.

Below is a simple way to track and use known inputs to create predicted ones.

Copy

    private ReplicateData _lastCreatedInput = default;
    
    [Replicate]
    private void RunInputs(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    { 
        //If inputs are not known. You could predict
        //all the way into CurrentFuture, which would be
        //real-time with the client. Though the more you predict
        //in the future the more you are likely to mispredict.
        if (state.IsFuture())
        {
            uint lastCreatedTick = _lastCreatedInput.GetTick();
            //If it's only been 2 ticks since the last created
            //input then run the logic below.
            //This essentially means if the last created tick
            //was 100, this logic would run if the future tick was 102
            //or less. This is an example of a basic approach to only
            //predict a certain number of inputs.
            uint thisTick = data.GetTick();
            if ((data.GetTick() - lastCreatedTick) <= 2)
            {
                //We do not necessarily want to predict all states.
                //For example, it probably wouldn't make sense to predict
                //multiple jumps in a row. In this example only the movement
                //inputs are predicted.
                data.Vertical = _lastCreatedInput.Vertical;
            }
        }
        //If created data then set as lastCreatedInput.
        else if (state == ReplicateState.ReplayedCreated)
        {
            //If ReplicateData contains fields which could generate garbage you
            //probably want to dispose of the lastCreatedInput
            //before replacing it. This step is optional.
            _lastCreatedInput.Dispose();
            //Assign newest value as last.
            _lastCreatedInput = data;
        }
        
        float delta = (float)base.TimeManager.TickDelta;
        transform.position += new Vector3(data.Horizontal, 0f, data.Vertical) * _moveRate * delta;
    }

If your ReplicateData allocates do not forget to dispose of the lastCreatedInput when the network is stopped.


---

# Prediction Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Prediction

Prediction is the act of server-authoritative actions while allowing clients to move in real-time without delay.

[What Is Client-Side Prediction](/docs/manual/guides/prediction/what-is-client-side-prediction)[Configuring PredictionManager](/docs/manual/guides/prediction/configuring-predictionmanager)[Configuring TimeManager](/docs/manual/guides/prediction/configuring-timemanager)[Configuring NetworkObject](/docs/manual/guides/prediction/configuring-networkobject)[Offline Rigidbodies](/docs/manual/guides/prediction/offline-rigidbodies)[Interpolations](/docs/manual/guides/prediction/interpolations)[Creating Code](/docs/manual/guides/prediction/creating-code)[Custom Comparers](/docs/manual/guides/prediction/custom-comparers)[PredictionRigidbody](/docs/manual/guides/prediction/predictionrigidbody)[Using NetworkColliders](/docs/manual/guides/prediction/using-networkcolliders)


---

# Prediction Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# PredictionManager

PredictionManager provides states, callbacks, and settings to fine tuning prediction for your game type.

## 


Component Settings

Client _are settings which only affect the client._[](#client-are-settings-which-only-affect-the-client)

**Client Interpolation** is how many states to try and hold in a buffer before running them on clients. Larger values add resilience against network issues at the cost of running states later.

Server _are settings which only affect the server._[](#server-are-settings-which-only-affect-the-server)

**Server Interpolation** is how many states to try and hold in a buffer before running them on the server. Larger values add resilience against network issues at the cost of running states later.

**Drop Excessive Replicates** will discard replicate datas received from clients and server after the cached count exceeds a certain value. When false multiple datas will be consumed per tick to clear the cache quicker.

*   **Maximum Server Replicates** is shown when the above value is true. This value indicates the maximum number of replicates which the server will cache from client before dropping old ones. Generally, cached replicates will never significantly exceed **Queued Inputs**.


---

# Prediction Rigidbody Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# PredictionRigidbody

This class provides accurate simulations and re-simulations when applying outside forces, most commonly through collisions.

Using PredictionRigidbody is very straight forward. In short, you move from applying force changes to the rigidbody onto the PredictionRigidbody instance instead.

View the [Creating Code](/docs/manual/guides/prediction/creating-code) guide for using PredictionRigidbody in your replicate and reconcile methods.

## 


Using Outside The Script

As mentioned above you should always apply forces to the PredictionRigidbody component rather than the Rigidbody directly. Our first guides demonstrate how to do this within the replicate method, as well how to reconcile using the PredictionRigidbody, but do not show how to add forces from outside scripts, such as a bumper in your game.

There is virtually no complexity to adding outside forces other than remembering to add them again, to the PredictionRigidbody and not the Rigidbody.

The example below is what it might look like if using a trigger on a world object to repel the player.

For triggers and collisions to work properly with prediction you must use our NetworkTrigger/NetworkCollision components. Otherwise, due to a Unity limitation, such interactions would not work. You can learn more about those components here.

Fun fact: Fish-Networking is the only framework that has the ability to simulate Enter/Exit events with prediction; not even Fusion does this!

Copy

    private void NetworkTrigger_OnEnter(Collider other)
    {
        //Add upward impulse when hitting this trigger.
        if (other.TryGetComponent<RigidbodyPlayer>(out rbPlayer))
            rbPlayer.PredictionRigidbody.AddForce(Vector3.up, ForceMode.Impulse);
        //Do not call Simulate on the PredictionRigidbody here. That should only be done
        //within the replicate method.
    }

There is a fair chance a number of controllers will want to set velocities directly as well. PredictionRigidbody does support this. We encourage you to review the [PredictionRigidbody API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.Prediction.PredictionRigidbody.html#methods) for all available functionality.

Our last example demonstrates setting velocities directly.

You would still call PredictionRigidbody.Simulate() regardless of how velocities are set.

Copy

    float horizontal = data.Horizontal;
    Vector3 velocity = new Vector3(data.Horizontal, 0f, 0f) * _moveRate;
    PredictionRigidbody.Velocity(velocity);


---

# Pro Projects And Support Fish Net Networking Evolved

1.  [Introduction](/docs)

# Pro, Projects, and Support

Learn how to access a variety of enhancements for your Fish-Networking experience. We aim to provide reasonable pricing ranging from smaller indie developers to large studios.

## 


Purchasing

There are a variety of ways to purchase Pro and Projects.

At this time Projects are ONLY available through purchase on GitHub (preferred) or Patreon. Projects will be submitted to the asset store soon.

Pro can be bought from the asset store, as well through GitHub or Patreon.

When buying through the asset store you are gaining lifetime updates to only what you purchased. For example: if you purchased Fish-Networking Pro on the asset store, this does not automatically provide you with Projects.

When obtaining Pro through GitHub (preferred) or Patreon you will have access to both Pro and Projects.

There are several ways to purchase depending on what you are interested in.

You can make a one-time payment of $10, and $1/month for updates.

Lifetime updates to both Pro and Projects can be obtained by making a one-time payment of $60. This option offers extra perks.

You may also gain lifetime updates by contributing $60 over time.

Lifetime updates to projects only is also available after contributing $35.

[Support tiers](/docs/master/pro-projects-and-support#support-tier-options) are offered exclusively through GitHub.

**This also includes business support tiers.**

Purchase links:

*   [GitHub](https://github.com/sponsors/FirstGearGames).
    
*   [Unity Asset Store](https://assetstore.unity.com/publishers/46529).
    
*   [Patreon](https://www.patreon.com/firstgeargames).
    

## 


After Purchasing

Access Pro and Projects on our [website](https://firstgeargames.com).

While a supporter on any tier you have access to claim a Discord _FirstGearGames Supporter_ role to show off your support for the project; Priority Support tiers provide additional roles.

After unlocking projects you may immediately downgrade to the Updates Only tier to receive project updates at a much lower monthly cost.

Do not forget to claim your role on our Discord server!

GitHub Instructions: log into your downloads on our website. After logging in you will be shown a temporary Id above downloads. Copy this Id and direct message our Discord bot Sharky with it.

Patreon Instructions: [https://support.patreon.com/hc/en-us/articles/212052266-Get-my-Discord-role.](https://support.patreon.com/hc/en-us/articles/212052266-Get-my-Discord-role.)

## 


Pro

Some features are only available in Fish-Networking Pro.

All business [support tiers](/docs/master/pro-projects-and-support#support-tier-options) also grant a complimentary lifetime Pro license.

We have an extremely flexible sharing license for Fish-Networking Pro, allowing teams and classrooms to work on a single purchase. You can view that license [here](https://github.com/FirstGearGames/FishNet/blob/main/LICENSE.md).

#### 


Features For Pro:

> **Lag Compensation**
> 
> Another very important feature for precision based gaming is lag compensation. This is the act of rolling back colliders in time to where a client had seen them; this ensures accurate hit registration. This technique is applicable to several genre types but is most commonly seen in shooter games

> **Automatic Code Stripping**
> 
> Code stripping helps protect your game server by removing sensitive logic that the player should not be aware of. Far as we know, Fish-Networking is the only solution with the ability to remove server code from clients, and client code from the server.

> **Network Level of Detail**
> 
> Level of Detail determines how often the server sends updates to clients. With level of detail enabled moving objects can expect to use up to 95% LESS bandwidth. Other aspects of Fish-Networking benefit marginally from network level of detail as well.

> **Extrapolation, NetworkTransform**
> 
> When enabled the NetworkTransform will extrapolate as necessary to create a smoother experience for unstable connections.

> **Synchronized Parameters, NetworkAnimator**
> 
> Customize which parameters are synchronized over the network on the NetworkAnimator.

> **Yak**
> 
> [Yak](/docs/manual/guides/components/transports/yak-pro-feature) is a transport which provides an entirely offline experience using your multiplayer code. When combined with Multipass (available to free users), you may run your game offline or online.

## 


Projects

Projects are completed Unity projects which act as a template or learning opportunity.

> **Lobby and Worlds**
> 
> Lobby and Worlds is designed to use a single server for a lobby containing your players, as well create games on the same server using rooms created by your players. Each room is isolated from other players, both visually and in network traffic.
> 
> Many aspects of the lobby can be customized to your needs. Lobby and Worlds allows you to design your game normally in it's own scenes, while the project takes care of everything else.
> 
> Features include:
> 
> *   Loading any number of game scenes, multiple times; think dungeon instances!
>     
> *   Sign in system.
>     
> *   Lobby to create and join rooms.
>     
> *   Join rooms after start, optional.
>     
> *   Password rooms.
>     
> *   Ready up system, optional.
>     
> *   Kick players.
>     
> *   Player limits.
>     
> *   Customizable lobby logic and demo game.
>     

FPS Land is not yet available for Fish-Networking V4. We are in the process of rewriting FPS Land to better take advantage of newer FishNet features.

Upon release, FPS Land V4 will be available to anyone that joined Pro tier from January 31st 2024 and onward, even if you are not currently a Pro subscriber.

FPS Land for Fish-Networking V3 is still available for download.

> **FPS Land**
> 
> This project is a full server authoritative demo on how you may get started on creating a FPS game with Fish-Networking.
> 
> Key points are:
> 
> *   Full server authoritative: movement, sound, firing, reloading, animations, ect.
>     
> *   Four weapon types: rifle, pistol, knife, and grenades.
>     
> *   Lag compensation for weapons such as rifles.
>     
> *   Lag compensation projectiles, such as grenades.
>     
> *   Picked up items.
>     
> *   Movement modifiers from weapon weight and walking.
>     
> *   Pet friendly goats.
>     

## 


Support Tier Options

> **Free Tier Support**
> 
> *   Discord: Multiple channels of support, with support provided by our community and helpers.
>     
> *   Unity Forum: support provided by our community and helpers.
>     
> *   Website(s): Documentation, Guides, and Videos available from our Team and Community
>     

> **Priority Tier Support**
> 
> *   Everything in Free Tier.
>     
> *   Discord: Additional access to post in our Priority Support channel. This channel uses threads to keep each question individualized and sorted. The questions asked in Priority Support are prioritized by our helpers.
>     
> *   Projects: Access to projects that are completed Unity projects which act as a template or learning opportunity.
>     
> *   There are multiple priority tier options. Support quality is equal for all tiers. Priority tiers 2+ receive enhanced visibility within our Discord community to show off your support.
>     

> **Business Support**
> 
> *   Everything in Free Tier
>     
> *   Everything in Priority Tier
>     
> *   Additional Enterprise Features, please view our monthly tiers on [GitHub](https://github.com/sponsors/FirstGearGames) to see what we offer per tier. For more information you may also email firstgeargames@gmail.com, or contact firstgeargames on Discord.
>


---

# Projectiles Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Lag Compensation](/docs/manual/guides/lag-compensation)

# Projectiles

Projectiles which move over time can have lag hidden by accelerating the projectiles for the server and spectators, while allowing the firing client to show the projectile immediately.

Another bonus to this approach is you are not networking the projectile movement each tick, which saves tremendously on bandwidth and performance.

Here is an example of what this guide will cover. Notice how even though the client has a 220ms ping the projectile is still aligned on the server. Other clients would align the projectile as well with the same guide code.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FWUPMU6gWIXgRaOPQOQdF%252FPredictedProjectile_00.gif%3Falt%3Dmedia%26token%3D063abec5-e7cf-4d62-81fd-8f6ff9d3ef46&width=768&dpr=4&quality=100&sign=844053aa&sv=2)

First the local client, or owning client, fires the projectile. The projectile is spawned locally, then the client tells the server to also fire the projectile. The MAX\_PASSED\_TIME constant is covered in the next code snippet.

Copy

    /// <summary>
    /// Projectile to spawn.
    /// </summary>
    [Tooltip("Projectile to spawn.")]
    [SerializeField]
    private PredictedProjectile _projectile;
    /// <summary>
    /// Maximum amount of passed time a projectile may have.
    /// This ensures really laggy players won't be able to disrupt
    /// other players by having the projectile speed up beyond
    /// reason on their screens.
    /// </summary>
    private const float MAX_PASSED_TIME = 0.3f;
    
    /// <summary>
    /// Local client fires weapon.
    /// </summary>
    private void ClientFire()
    {
        Vector3 position = transform.position;
        Vector3 direction = transform.forward;
    
        /* Spawn locally with 0f passed time.
         * Since this is the firing client
         * they do not need to accelerate/catch up
         * the projectile. */
        SpawnProjectile(position, direction, 0f);
        //Ask server to also fire passing in current Tick.
        ServerFire(position, direction, base.TimeManager.Tick);
    }
    
    /// <summary>
    /// Spawns a projectile locally.
    /// </summary>
    private void SpawnProjectile(Vector3 position, Vector3 direction, float passedTime)
    {
        PredictedProjectile pp = Instantiate(_projectile, position, Quaternion.identity);
        pp.Initialize(direction, passedTime);
    }#

When the server receives the fire request it will calculate how long it took the client to send the fire message using the provided tick. Later on the projectile will be accelerated based on this time passed.

After the _passedTime_ is calculated, spawn the projectile on the server, then tell spectators to also spawn the projectile; spectators being other clients.

Copy

    /// <summary>
    /// Fires on the server.
    /// </summary>
    /// <param name="position">Position to spawn projectile.</param>
    /// <param name="direction">Direction to move projectile.</param>
    /// <param name="tick">Tick when projectile was spawned on client.</param>
    [ServerRpc]
    private void ServerFire(Vector3 position, Vector3 direction, uint tick)
    {
        /* You may want to validate position and direction here.
         * How this is done depends largely upon your game so it
         * won't be covered in this guide. */
    
        //Get passed time. Note the false for allow negative values.
        float passedTime = (float)base.TimeManager.TimePassed(tick, false);
        /* Cap passed time at half of constant value for the server.
         * In our example max passed time is 300ms, so server value
         * would be max 150ms. This means if it took a client longer
         * than 150ms to send the rpc to the server, the time would
         * be capped to 150ms. This might sound restrictive, but that would
         * mean the client would have roughly a 300ms ping; we do not want
         * to punish other players because a laggy client is firing. */
        passedTime = Mathf.Min(MAX_PASSED_TIME / 2f, passedTime);
    
        //Spawn on the server.
        SpawnProjectile(position, direction, passedTime);
        //Tell other clients to spawn the projectile.
        ObserversFire(position, direction, tick);
    }

Observers use the same technique to calculate the passed time and spawn the projectile. There are a few small things to note.

First, this RPC is sent to everyone but the owner. The owner does not need to receive the RPC because it already spawned the projectile locally.

Second, the passed time calculation is not limited by half. This is to support the maximum possible passed time. This is not a requirement, but is recommended.

Copy

    /// <summary>
    /// Fires on all clients but owner.
    /// </summary>
    [ObserversRpc(IncludeOwner = false)]
    private void ObserversFire(Vector3 position, Vector3 direction, uint tick)
    {
        //Like on server get the time passed and cap it. Note the false for allow negative values.
        float passedTime = (float)base.TimeManager.TimePassed(tick, false);
        passedTime = Mathf.Min(MAX_PASSED_TIME, passedTime);
    
        //Spawn the projectile locally.
        SpawnProjectile(position, direction, passedTime);
    }

With the projectile spawned all that's left is showing how to use the calculated passed time. You likely noticed the **SpawnProjectile** method was initializing the projectile with some values. Here's what that looks like:

Copy

    /// <summary>
    /// Direction to travel.
    /// </summary>
    private Vector3 _direction;
    /// <summary>
    /// Distance remaining to catch up. This is calculated from a passed time and move rate.
    /// </summary>
    private float _passedTime = 0f;
    /// <summary>
    /// In this example the projectile moves at a flat rate of 5f.
    /// </summary>
    private const float MOVE_RATE = 5f;
    
    /// <summary>
    /// Initializes this projectile.
    /// </summary>
    /// <param name="direction">Direction to travel.</param>
    /// <param name="passedTime">How far in time this projectile is behind te prediction.</param>
    public void Initialize(Vector3 direction, float passedTime)
    {
        _direction = direction;
        _passedTime = passedTime;
    }

After initializing with the specified passed time and direction all that's left to accelerate the projectile is a move method. The provided example is a very basic implementation of a move method, while also applying the acceleration.

If there is passed time to apply then additional delta is added using the _passedTimeDelta_ variable.

The percentage applied when assigning the _step_ variable decides how fast your projectile will catch up to the predicted value. In this code I am using 8% of the passed time per Move call. Higher values will result in the projectile catching up faster.

Copy

    /// <summary>
    /// Move the projectile each frame. This would be called from Update.
    /// </summary>
    private void Move()
    {
        //Frame delta, nothing unusual here.
        float delta = Time.deltaTime;
    
        //See if to add on additional delta to consume passed time.
        float passedTimeDelta = 0f;
        if (_passedTime > 0f)
        {
            /* Rather than use a flat catch up rate the
             * extra delta will be based on how much passed time
             * remains. This means the projectile will accelerate
             * faster at the beginning and slower at the end.
             * If a flat rate was used then the projectile
             * would accelerate at a constant rate, then abruptly
             * change to normal move rate. This is similar to using
             * a smooth damp. */
    
            /* Apply 8% of the step per frame. You can adjust
             * this number to whatever feels good. */
            float step = (_passedTime * 0.08f);
            _passedTime -= step;
    
            /* If the remaining time is less than half a delta then
             * just append it onto the step. The change won't be noticeable. */
            if (_passedTime <= (delta / 2f))
            {
                step += _passedTime;
                _passedTime = 0f;
            }
            passedTimeDelta = step;
        }
    
        //Move the projectile using moverate, delta, and passed time delta.
        transform.position += _direction * (MOVE_RATE * (delta + passedTimeDelta));
    }

Very last, keep in mind these projectiles are fired locally and are not networked. Because of this you may want to perform different actions based on if client or server. The code below demonstrates what a collision event might look like.

Copy

    /// <summary>
    /// Handles collision events.
    /// </summary>
    private void OnCollisionEnter(Collision collision)
    {
        /* These projectiles are instantiated locally, as in,
         * they are not networked. Because of this there is a very
         * small chance the occasional projectile may not align with
         * 100% accuracy. But, the differences are generally
         * insignifcant and will not affect gameplay. */
    
        //If client show visual effects, play impact audio.
        if (InstanceFinder.IsClient)
        {
            //Show VFX.
            //Play Audio.
        }
        //If server check to damage hit objects.
        if (InstanceFinder.IsServer)
        {
            PlayerShip ps = collision.gameObject.GetComponent<PlayerShip>();
            /* If a player ship was hit then remove 50 health.
             * The health value can be synchronized however you like,
             * such as a syncvar. */
            if (ps != null)
                ps.Health -= 50f;
        }
    
        //Destroy projectile (probably pool it instead).
        Destroy(gameObject);
    }


---

# Raycast Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Lag Compensation](/docs/manual/guides/lag-compensation)

# Raycast

Fish-Networking [Pro](/docs/master/pro-projects-and-support) is required for raycast lag compensation. Over-time projectiles may use another approach and do not require Pro. See [Projectiles](/docs/manual/guides/lag-compensation/projectiles) for more information.

This feature can be setup easily in a few steps.

To begin I am entering the ColliderRollbackDemo scene included with Fish-Networking Pro. You do not need to open the scene, but if you wish to follow along visually you may.

## 


Hitboxes

In my scene is an object named EnemySetup. The screen capture below shows two boxes on the 'enemy'. One for the body, and one for the head.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FwInJBzCk5iUuINz69Wia%252F221111-16-36-628.png%3Falt%3Dmedia%26token%3D23d6e0f9-3a90-48af-a9e4-ce7ca3801191&width=768&dpr=4&quality=100&sign=8c33abea&sv=2)

Each hitbox must be on a new object. Generally speaking, the hitbox would be a child of whichever component moves. With an actual humanoid rig, you would probably place the head collider on a child beneath the neck bone.

Notice the 'hitbox' objects are children of the moving component, and only have a collider on them. You may use any collider type.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FOaCiRYcG8o9CE4ivRLE8%252F221111-16-42-162.png%3Falt%3Dmedia%26token%3Ddecadeb7-484e-456b-a7dc-dac571ec97d4&width=768&dpr=4&quality=100&sign=6d54fa15&sv=2)

Next the ColliderRollback script must be added somewhere within your prefab or object. For the sake of simplicity I have mine on the root, with the NetworkObject.

Once added, specify each object you added as a collider within the **Collider Parents** collection.

To make things easier, place the suffix 'Hitbox' on all your hitbox objects. You can then lock the inspector on your ColliderRollback object, search Hitbox, and quickly drag all entries in at once.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FTGBM0plVAQINZ1ye6Bjg%252F221111-16-44-588.png%3Falt%3Dmedia%26token%3Dbf2b8f3e-5d69-4c3f-b024-819a30cb69e8&width=768&dpr=4&quality=100&sign=25b9d6f&sv=2)

You've completed all the steps required for setting up an object.

## 


Rollback Manager

To utilize the lag compensation you must also add the RollbackManager script to your Networkmanager object. We have a section on the [RollbackManager](/docs/manual/guides/components/managers/rollbackmanager-pro-feature) component to understand what each field does. Once you review the component settings we can move onto the code.

## 


Performing a Rollback

The RollbackManager must know how far back in time to place colliders to obtain accurate hit results. When your client is to fire their weapon you will want to gather the current PreciseTick and include it with your Fire RPC.

Copy

    [Client]
    private void Fire()
    {
        //Use LastPacketTick to get the best tick alignment.
        PreciseTick pt = base.TimeManager.GetPreciseTick(TickType.LastPacketTick);
        //Call fire on the server.
        ServerFire(pt);
    }
    
    [ServerRpc]
    private void ServerFire(PreciseTick pt)
    {
        //Rollback using the precise tick sent in.
        //Using Physics for 3d rolback, Physics3D for 2d rolback.
        //Both physics types can be used at once.
        base.RollbackManager.Rollback(pt, RollbackManager.PhysicsType.Physics, base.IsOwner);
        //Perform your raycast normally.
        RaycastHit hit;
        if (Physics.Raycast(transform.position, transform.forward, out hit)) { }
        //Return the colliders to their proper positions.
        base.RollbackManager.Return();
    }


---

# Remote Procedure Calls Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Remote Procedure Calls

Remote Procedure Calls(RPCs) are a type of [communication](/docs/manual/general/terminology/communicating#server-and-host-2) that are received on the same object they are sent from. The three types of RPCs are ServerRpc, ObserversRpc, and TargetRpc. RPCs are easy to use and are just like calling another method. Since Remote Procedure Calls are object bound, they must be called on scripts which inherit from [NetworkBehaviour](/docs/manual/guides/components/network-behaviour-components).

Fish-Net will [generate serializers](/docs/manual/guides/automatic-serializers-guides) for your types automatically, including arrays and lists. In rare cases Fish-Net may not be able to create a serializer for you. When this occurs you must create a [custom serializer](/docs/manual/guides/automatic-serializers-guides).

Remote Procedure Call methods do not need to have prefixes as shown in the examples, but it's good practice to use them to keep your intentions known.

## 


ServerRpc

A ServerRpc allows a client to run logic on the server. The client calls a ServerRpc method, and the data to execute that method is sent to the server. To use a ServerRpc the client must be active, and the method must have a _ServerRpc_ attribute.

Copy

    private void Update()
    {
        //If owner and space bar is pressed.
        if (base.IsOwner && Input.GetKeyDown(KeyCode.Space))
            RpcSendChat("Hello world, from owner!");        
    }
    
    [ServerRpc]
    private void RpcSendChat(string msg)
    {
        Debug.Log($"Received {msg} on the server.");
    }

By default only the [owner](/docs/manual/guides/ownership) of an object may send a ServerRpc. It is however possible to allow ServerRpcs to be called by any client, owner or not. This is done by setting RequireOwnership to false in the _ServerRpc_ attribute. You may optionally know which connection is calling the RPC by using a NetworkConnection type with a null default as the last parameter. The NetworkConnection parameter will automatically be populated with whichever client is calling the ServerRpc; you do not need to specify the connection.

Copy

    [ServerRpc(RequireOwnership = false)]
    private void RpcSendChat(string msg, NetworkConnection conn = null)
    {
        Debug.Log($"Received {msg} on the server from connection {conn.ClientId}.");
    }

## 


ObserversRpc

ObserversRpc allows the server to run logic on clients. Only observing clients will get and run the logic. Observers are set by using the [Network Observer](/docs/manual/guides/components/network-observer) component. To use ObserversRpc add the _ObserversRpc_ attribute to a method.

Copy

    private void FixedUpdate()
    {
        RpcSetNumber(Time.frameCount);
    }
    
    [ObserversRpc]
    private void RpcSetNumber(int next)
    {
        Debug.Log($"Received number {next} from the server.");
    }

In some instances you might want the owner of an object to ignore received ObserversRpc. To accomplish this set ExcludeOwner to true on the _ObserversRpc_ attribute.

Copy

    [ObserversRpc(ExcludeOwner = true)]
    private void RpcSetNumber(int next)
    {
        //This won't run on owner.
        Debug.Log($"Received number {next} from the server.");
    }

You may also have the latest values sent through an ObserversRpc also automatically send to new clients. This can be useful for values that only change through RPCs. Doing so is done by setting BufferLast to true on the _ObserversRpc_ attribute. The example below will not send to owner, and will also update new joining clients.

Copy

    [ObserversRpc(ExcludeOwner = true, BufferLast = true)]
    private void RpcSetNumber(int next)
    {
        //This won't run on owner and will send to new clients.
        Debug.Log($"Received number {next} from the server.");
    }

## 


TargetRpc

Lastly is TargetRpc. This RPC is used to run logic on a specific client. You can implement this feature by adding the _TargetRpc_ attribute. When sending a TargetRpc the first parameter of your method must always be a NetworkConnection; this is the connection the data goes to.

Copy

    private void UpdateOwnersAmmo()
    {
        /* Even though this example passes in owner, you can send to
        * any connection that is an observer. */
        RpcSetAmmo(base.Owner, 10);
    }
    
    [TargetRpc]
    private void RpcSetAmmo(NetworkConnection conn, int newAmmo)
    {
        //This might be something you only want the owner to be aware of.
        _myAmmo = newAmmo;
    }

## 


Multi-Purpose Rpc

It is possible to have a single method be both a TargetRpc, as well an ObserversRpc. This can be very useful if you sometimes want to send a RPC to all observers, or a single individual. A chat message could be an example of this.

Copy

    [ObserversRpc][TargetRpc]
    private void DisplayChat(NetworkConnection target, string sender, string message)
    {
        Debug.Log($"{sender}: {message}."); //Display a message from sender.
    }
    
    [Server]
    private void SendChatMessage()
    {
        //Send to only the owner.
        DisplayChat(base.Owner, "Bob", "Hello world");
        //Send to everyone.
        DisplayChat(null, "Bob", "Hello world");
    }

## 


Channels

Remote procedure calls can be sent as **reliable or unreliable**. To utilize this feature add a _Channel_ type as the last parameter to your RPC. You may also use your added Channel parameter to know which Channel the data arrived on.

Copy

    private bool _reliable;
    private void FixedUpdate()
    {
        //Reliable or unreliable can be switched at runtime!
        _reliable = !_reliable;
        
        Channel channel = (_reliable) ? Channel.Reliable : Channel.Unreliable;
        RpcTest("Anything", channel);
    }
    
    /* This example uses ServerRpc, but any RPC will work.
    * Although this example shows a default value for the channel,
    * you do not need to include it. */
    [ServerRpc]
    private void RpcTest(string txt, Channel channel = Channel.Reliable)
    {
        if (channel == Channel.Reliable)
            Debug.Log("Message received! I never doubted you.");
        else if (channel == Channel.Unreliable)
            Debug.Log($"Glad you got here, I wasn't sure you'd make it.");
    }

If your RPC is a ServerRpc and you are using a NetworkConnection with a null default as the last parameter then the Channel parameter must be added second to last, just before the NetworkConnection parameter.

Copy

    /* Example of using Channel with a ServerRpc that
    * also provides the calling connection. */
    [ServerRpc(RequireOwnership = false)]
    private void RpcTest(string txt, Channel channel = Channel.Reliable, NetworkConnection sender = null)
    {
        Debug.Log($"Received on channel {channel} from {sender.ClientId}.");
    }

## 


RunLocally

All RPC types may use the RunLocally field within the RPC attribute. When RunLocally is true the method will send, but also run on the calling side. For example, if a client calls a ServerRpc with RunLocally true, the ServerRpc will be put in the clients buffer to send, then the client will run the method logic locally.

Copy

    //Keeping in mind all RPC types can use RunLocally.
    [ServerRpc(RunLocally = true)]
    private void RpcTest()
    {
        //This debug will print on the server and the client calling the RPC.
        Debug.Log("Rpc Test!");
    }

Only transports which support unreliable messages may send RPCs as unreliable. If you attempt to send a RPC as unreliable when the transport does not support it the RPC will default to reliable.

## 


DataLength

If you have intentions to send very large amounts of data you may specify the maximum potential size of your data in the RPC attribute. Doing so will use a reserved serializer to prevent resizing and allocations, increasing performance. Every RPC type supports this feature.

Copy

    //This implies we know the data will never be larger than 3500 bytes.
    //If the data is larger then a resize will occur resulting in garbage collection.
    [ServerRpc(DataLength = 3500)]
    private void ServerSendBytes(byte[] data) {}


---

# Rollback Manager Pro Feature Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# RollbackManager (Pro Feature)

RollbackManager contains configurations and optimizations for how colliders are sent back in time when using lag compensation.

The RollbackManager must be added and configured properly for lag compensation to function properly. Objects you wish to rollback must contain the [ColliderRollback](/docs/manual/guides/components/colliderrollback) script on them.

## 


Component Settings

Settings _are general settings related to the RollbackManager._[](#settings-are-general-settings-related-to-the-rollbackmanager)

**Bounding Box Layer** when specified is the layer to first test against before rolling back colliders. When a layer is specified a collider will be added to your ColliderRollback objects; because of this, be sure to use a layer which has no physics intersections and is not used for anything else.

**Maximum Rollback Time** is the maxium time colliders may rollback. Using a value of 1f would allow colliders to rollback at most one second in the past, which is a very reasonable amount of time given typical player latencies are less than 100ms.

**Interpolation** is the amount of interpolation you are using on your NetworkTransform components. If you are using rigidbodies with PredictedObject this would be the Spectator Interpolation value.


---

# Scene Caching Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Caching

Scene Caching is the ability for the Server to keep a scene loaded when either all clients have unloaded that scene, or stopped observing that scene.

## 


General

When loading a scene you can specify in the SceneLoadData whether to AutomaticallyUnload the scene when all Clients unload or leave the scene as an observer. When Unloading the Scene you can override the AutomaticallyUnload options by setting the ServerUnloadMode.

## 


Examples

Copy

    //When Loading Scenes.
    SceneLoadData sld = new SceneLoadData("MainScene");
    sld.Options.AutomaticallyUnload = false;
    
    //When Manually Unloading Scenes.
    //Whatever you set the ServerUnloadMode to here will override the AutomaticallyUnload
    //setting you used when loading the scene earlier.
    SceneUnloadData sud = new SceneUnloadData("MainScene");
    sud.Options.Mode = ServerUnloadMode.KeepUnused;

## 


Host Behaviour

In situations where the Hosts Server needs to keep a scene loaded, but the Hosts Client was requested to unload that scene. Instead of unloading, the Hosts Client will be removed from the scene using the observer system updating the Clients [**Scene Visibility**](/docs/manual/guides/scene-management/scene-visibility). As Host, the Server and Client share the same instance of loaded Scenes and Game Objects. If it were to actually unload a scene from the Host Client, it would also unload on the server.

A **Scene Condition** must be set in the **ObserverManager** for you to utilize the ability to have the server keep a scene loaded, and the hosts client not see the objects in that scene.

This usually means that every GameObject with a mesh will have to have a NetworkObject attached if you want the Host Client not to visualize the scene.


---

# Scene Data Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Data

Scene Data is the data types used that the user will interface with when using the SceneManager.

SceneLoadData Video Guide

## 


General

See Sub-Pages below for the different Scene Data Classes.

*   [**SceneLookupData**](/docs/manual/guides/scene-management/scene-data/scenelookupdata)
    
*   [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata)
    
*   [**SceneUnloadData**](/docs/manual/guides/scene-management/scene-data/sceneunloaddata)


---

# Scene Events Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Events

Scene Events Video Guide

## 


General

There are a variety of events within SceneManager to help with your development. The order in which events invoke are reliable.

This diagram represents which order events can be expected to run. You may also find this diagram within your Fish-Networking import under Example/All/SceneManager.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FcRb0yh0EAm1L28aTfrqP%252FSceneManager%2520Event%2520Diagram.png%3Falt%3Dmedia%26token%3D45da5b38-8bd4-492e-9450-dbb1923d3831&width=768&dpr=4&quality=100&sign=c1f76dcc&sv=2)

SceneManager Event Order

Notice that client and server process queues and events exactly the same. OnClientPresence change is a special exception, as discussed below.

## 


Events

### 


OnClientLoadedStartScenes

This event calls every time a client loads the starting scenes for the first time. The start scenes would be any global scenes you have set, or if no global scenes are set then the scene you are entering play into. The PlayerSpawner.cs example demonstrates usage of the **OnClientLoadedStartScenes** event. Included is the connecion, or client which loaded the scenes, and a boolean indicating true if the callback is on the server side or false if on the client side.

The NetworkConnection class also has a similar event **OnLoadedStartScenes** if you'd like to know when only a specific connection has loaded the start scenes.

### 


OnQueueStart, OnQueueEnd

**OnQueueStart** and **OnQueueEnd** are called when a scene change queue occurs. **Start** will only call if a scene has succesfully begun to load or unload. The queue may process any number of scene events. For example: if a scene is told to unload while a load is still in progress, then the unload will be placed in the queue. **OnQueueEnd** will invoke after both the load and unload have completed.

### 


OnLoadStart, OnUnloadStart

**OnLoadStart** and **OnUnloadStart** occur before a queue entry is processed. These will call for every entry in a queue. For example: if you call SceneManager.LoadGlobalScenes() twice in a row, **OnQueueStart** will invoke once, and OnLoadStart will invoke twice. **OnLoadStart** will be called when a scene load begins, and **OnUnloadStart** when an unload begins.

Both the Load and Unload events contain a structure which has a field labeled _QueueData._ _QueueData_ holds information about the queue entry. The provided data is exposed for your convenience.

### 


OnLoadPercentChange

Only available when loading scenes is the **OnLoadPercentChange** event. This event contains information about what percentage of your scenes have loaded for the queue entry. Like the Start events, _QueueData_ is provided. You will also be supplied a float _Percent_, indicating the total progress of your scene load. This can be useful to show loading screens, or perform a variety of initialization tasks.

### 


OnLoadEnd

The **OnLoadEnd** event is called after all scenes for the queue entry have been loaded. This event will only invoke after the scenes have fully loaded, and after the active scene has been set if applicable. Like the **OnLoadStart** event _QueueData_ is provided. Additionally, _LoadedScenes_ and _SkippedSceneNames. LoadedScenes_ provides Scene references to which scenes were loaded. _SkippedSceneNames_ contains strings of scenes which were not loaded; this generally occurs if the scene is already loaded.

### 


OnUnloadEnd

After scene unloading has occurred **OnUnloadEnd** is invoked. This event contains _QueueData_, and _UnloadedSceneHandles_. As before _QueueData_ contains information about the queue entry. _UnloadSceneHandles_ is a collection occupied with the handles of which scenes were unloaded.

### 


OnClientPresenceChangeStart, OnClientPresenceChangeEnd

These two events are only available on the server and indicate when a client is being added to a scene, or being removed from a scene. Both events are only invoked after the client has fully loaded or unloaded the scene. The **Start** variant is invoked before the [observer](/docs/manual/guides/components/network-observer) status has been updated for the client, and **End** after being updated. To clarify, if a client joins a scene **OnClientPresentStart** will call before the client has visibility of any networked content in the scene, and **OnClientPresentEnd** after the client has gained visibility.

Both events contain the same structure which has the following information: _Scene_, _Connection,_ and _Added._ _Scene_ is which scene the client is being added or removed from. _Connection_ is the NetworkConnection for the client. Lastly, _Added_ will be true if being added to the scene, or false is being removed.


---

# Scene Load Data Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)
7.  [Scene Data](/docs/manual/guides/scene-management/scene-data)

# SceneLoadData

The Data Class needed for the SceneManager to know how to handle loading a scene.

## 


General

Loading scenes of all types depend upon SceneLoadData. The SceneLoadData class contains information about what scenes to load, how to load them, which objects to move to new scenes, and more. You can view the SceneLoadData API [here](https://firstgeargames.com/FishNet/api/api/FishNet.Managing.Scened.SceneLoadData.html).

## 


Default Values

Copy

    //Default Values
    SceneLoadData sld = new SceneLoadData()
    {
        PreferredActiveScene = null,
        SceneLookupDatas = new SceneLookupData[0],
        MovedNetworkObjects = new NetworkObject[0],
        ReplaceScenes = ReplaceOption.None,
        Params = new LoadParams()
        {
            ServerParams = new object[0],
            ClientParams = new byte[0]
        },
        Options = new LoadOptions()
        {
            AutomaticallyUnload = true,
            AllowStacking = false,
            LocalPhysics = LocalPhysicsMode.None,
            ReloadScenes = false, //Obsolete, Comming Soon.
            Addressables = false
        }
    };

PreferredActiveScene[](#preferredactivescene)

Preferred Active Scene will allow you to choose what scene will be active on the server and client. Currently this sets both client and server to the SceneLookupData provided.

If left with the default value of null, the first valid scene loaded will become the ActiveScene.

SceneLookupDatas[](#scenelookupdatas)

This Array is populated with scenes you would like to load, depending on the parameters you pass into the SceneLoadData when constructed.

See [**Loading Scenes**](/docs/manual/guides/scene-management/loading-scenes) for examples.

MovedNetworkObjects[](#movednetworkobjects)

NetworkObjects can be moved when loading new scenes, such as if you want to move a player to a different scene as you load the new scene. You may include an array of NetworkObjects to move to the new scenes. NetworkObjects within this array will be moved to the first scene specified in SceneLookupData. See [**Persisting NetworkObjects**](/docs/manual/guides/scene-management/persisting-networkobjects) for more details on what type of NetworkObjects you are allowed to move.

ReplaceScenes[](#replacescenes)

Like the Unity SceneManager when loading a single scene, ReplaceScenes allows you to replace currently loaded scenes with new ones. There are a variety of options to use. See [**Replacing Scenes**](/docs/manual/guides/scene-management/loading-scenes#replacing-scenes) Section of Loading Scenes guide for more details and examples.

Params[](#params)

Params are an optional way to assign data to your scene loads/unloads. This data will be available within [**Scene Events**](/docs/manual/guides/scene-management/scene-events), Information used in Params can be useful for storing information about the scene load/unload and referencing it later when the scene load/unload completes.

### 


ServerParams

_ServerParams_ are only included on the server side, and are not networked. It is an array of objects, meaning you can send anything you want. However when accessing the Params through event args, you will have to cast the object to the data you want.

### 


ClientParams

_ClientParams_ is a byte array which may contain anything, and will be sent to clients when they receive the load scene instructions. Clients can access the _ClientParams_ within the scene change events.

Options[](#options)

You may further enhance how you load/unload scenes with Options.

### 


AutomaticallyUnload

*   When _set to_ true scenes will be unloaded automatically on the server when there are no more connections present. This is the default behaviour.
    
*   When set to false the scene will remain if connections leave the scene unexpected, such as being disconnected.
    
*   However, discussed in UnloadSceneData, this behavior can be overriden using the UnloadOptions of UnloadSceneData.
    
*   Only scenes loaded for connections will be automatically unloaded when emptied.
    
*   Global scenes can only be unloaded using ReplaceScenes or by calling unload on them.
    

### 


AllowStacking

*   When _AllowStacking_ remains false the SceneManager will not stack scenes in your SceneLoadDatas.
    
*   If true then scenes can be stacked (loaded multiple times).
    
*   In the SceneLookupData section it was mentioned that if a Scene reference or handle is specified then the SceneManager will favor loading a scene using a scene handle. When you would like to load connections into the same stacked scene over multiple load calls, you will populate your SceneLookupDatas by Scene reference or handle.
    
*   See [**Scene Stacking**](/docs/manual/guides/scene-management/scene-stacking) for more detail and examples
    

### 


LocalPhysics

*   [_LocalPhysics_](https://docs.unity3d.com/ScriptReference/SceneManagement.LocalPhysicsMode.html) is a Unity property that lets you determine how physics are simulated in your scenes.
    
*   Generally if you are stacking scenes you will want to set a LocalPhysics mode so that stacked scenes do not collide with each other.
    

### 


Addressables

*   _Addressables_ is only used as a reference and performs no additional functionality.
    
*   You may set this value to know if a scene is loading using addressables, without having to create Params.


---

# Scene Lookup Data Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)
7.  [Scene Data](/docs/manual/guides/scene-management/scene-data)

# SceneLookupData

SceneLookupData is how the server determines to load clients into a new instance of a Scene, or load a client into a scene that the server already has loaded.

## 


General

When Creating [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata) or [**SceneUnloadData**](/docs/manual/guides/scene-management/scene-data/sceneunloaddata) there are provided constructors that automatically create SceneLookupData for you. Most likely you will be using these constructors and will not be creating a separate SceneLookupData.

When you specify a scene by reference, or handle, the SceneManager will prefer to lookup that scene using the scene handle. This is important information when [**Scene Stacking**](/docs/manual/guides/scene-management/scene-stacking). Looking up a scene by handle will place connections in the scene specified, but when using scene names, the server will create a new scene instance for the specified connections and place them into that scene. The described behavior only applies when loading scenes over multiple Load calls; such as if you call LoadConnectionScene twice, each with it's own connection.

## 


Default Values

Copy

            //SceneLookupData Default values
            SceneLookupData slud = new SceneLookupData()
            { 
                //If Handle is greater than 0 then it will ignore Name and use Handle
                //to look up the scene.
                Handle = 0,
                //If Handle is set to 0, then Name is used to lookup the scene instead.
                Name = null 
            }; 

See [**Loading Scenes**](/docs/manual/guides/scene-management/loading-scenes) and [**Unloading Scenes**](/docs/manual/guides/scene-management/unloading-scenes) for implementation.


---

# Scene Management Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Scene Management

Fish-Networking comes with a powerful scene manager tool that enables you to synchronize networked scenes with minimal effort.

## 


General

The [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) Component has many scene features to support your multiplayer needs. The links below will take you to the different guides for each feature that the [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) has to offer.

Visit the [**API**](https://firstgeargames.com/FishNet/api/api/FishNet.Managing.Scened.SceneManager.html) to see the public items exposed to the user in the SceneManager.

## 


Sub Pages

### 


[Scene Events](/docs/manual/guides/scene-management/scene-events)

"Scene Events" are the Invoked Events that happen along the loading and unloading method.

### 


[Scene Data](/docs/manual/guides/scene-management/scene-data)

The Data Classes that are needed for the the various features to function.

### 


[Loading Scenes](/docs/manual/guides/scene-management/loading-scenes)

Information on how to "load" scenes and the options available to the user while loading.

### 


[Unloading Scenes](/docs/manual/guides/scene-management/unloading-scenes)

Information on how to "unload" scenes and the options available to the user while Unloading.

### 


[Scene Stacking](/docs/manual/guides/scene-management/scene-stacking)

"Scene Stacking" is the ability for server or host to load multiple instances of a scene at once, usually with different observers in each scene.

### 


[Scene Caching](/docs/manual/guides/scene-management/scene-caching)

"Scene Caching" is the ability for the Server to keep a scene loaded when either all clients have unloaded that scene, or stopped observing that scene.

### 


[Scene Visibility](/docs/manual/guides/scene-management/scene-visibility)

"Scene Visibility" guide offers details of using the "Scene Condition" with the [**ObserverManager**](/docs/manual/guides/components/managers/observermanager), and how to manage Observers in a Scene.

### 


[Persisting NetworkObjects](/docs/manual/guides/scene-management/persisting-networkobjects)

"Persisting NetworkObjects" is the ability to keep a network objects state when loading and unloading scenes.

### 


[Custom Scene Processors](/docs/manual/guides/scene-management/custom-scene-processors)

Fishnet has the ability for users to create their own Custom Scene Processor for loading and unloading scenes. Using Addressables for example, would need a Custom Scene Processor created.


---

# Scene Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# SceneManager

SceneManager handles networking scenes between the server and clients, including updating active scenes, addressable scenes, provide helpful callbacks, and more.

The callbacks within the SceneManager are informative and quite useful, well worth looking into!

## 


Component Settings

Settings _are general settings related to the SceneManager._[](#settings-are-general-settings-related-to-the-scenemanager)

**Scene Processor** determins how scene loads occur. When left empty the default scene processor is used. For more information on scene processing and addressables see [here.](/docs/manual/guides/scene-management/custom-scene-processors/addressables)

**Light Probe Updating** controls how light probes are updated after scenes are loaded.

**Move Client Host Objects** will move objects visible to clientHost to a temporary scene rather than let them be destroyed when a scene is unloaded. Objects are then destroyed next tick by the clientHost. This ensures that server and client side callbacks will work properly on the moved objects.

**Set Active Scene** will allow the SceneManager to pick which scene to set as the active scene when loading and unloading scenes. By default global scenes are used, and if no global scenes then the clients single scene.


---

# Scene Stacking Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Stacking

Scene Stacking is the ability for server or host to load multiple instances of the same scene at once, usually with different clients/observers in each scene.

## 


General

A good example of stacking scenes is having dungeon instances on a single server. If two clients went into the same dungeon, each client will load their own copy of that dungeon and have individual GameObjects, and state for those scenes. The Server however has two instances of that scene loaded at once. The Server having those two instances of the same scene loaded is called "Scene Stacking" Stacked scenes typically have different Clients observing each instance of the scene.

## 


Stacking Scenes

### 


Loading Into New Stacked Scene

*   To stack scenes you must set _AllowStacking_ to true in your SceneLoadData's [**Options**](/docs/manual/guides/scene-management/scene-data/sceneloaddata#options-1).
    
*   To create a new instance of a stacked scene the SceneLookupData must be populated by using the scene name. There is more information on this in the [SceneLookupData](/docs/manual/guides/scene-management/scene-data/scenelookupdata) section.
    
*   Global Scenes cannot be stacked!
    

Copy

    //Stacking a new Scene
    //Select Connections to load into new stacked scene.
    NetworkConnection[] conns = new NetworkConnection[]{connA,ConnB};
    
    //You must use the scene name to stack scenes!
    SceneLoadData sld = new SceneLoadData("DungeonScene");
    
    //Set AllowStacking Option to true.
    sld.Options.AllowStacking = true;
    
    //Decide if you want seperate Physics for the scene.
    sld.Options.LocalPhysics = LocalPhysicsMode.Physics3D;
    
    //load the Scene via connections, you cannot stack global scenes.
    base.SceneManager.LoadConnectionScene(conns,sld);

### 


Loading Into Existing Stacked Scene

*   If you were to load two connections into a scene by Scene reference or handle they will be added to the same scene, regardless if _AllowStacking_ is true or not.
    

This is identical to the examples given in the Loading Scenes Guide, on how to load into existing scenes. Review it [**here**](/docs/manual/guides/scene-management/loading-scenes#loading-existing-scenes).

## 


Separating Physics

You may want to separate physics while stacking scenes. This ensures that the stacked scenes physics do not interact with each other. You will want to set the LocalPhysics option in the [**SceneLoadData**](/docs/manual/guides/scene-management/scene-data/sceneloaddata)**.**

#### 


**LocalPhysicsMode.None**

This is the Default Option, Scene Physics will collide with other scenes in this state.

#### 


**LocalPhysicsMode.Physics2D**

A local 2D physics Scene will be created and owned by the Scene.

#### 


LocalPhysicsMode.Physics3D

A local 3D physics Scene will be created and owned by the Scene.

If you are to use separate physics scenes and you want to also simulate physics within them you must do so manually; this is intentional design.

Below is a script which you can place in your stacked physics scenes to also simulate physics along with the default physics scenes.

Copy

    using FishNet.Object;
    using System.Collections.Generic;
    using UnityEngine;
    
    /// <summary>
    /// Synchronizes scene physics if not the default physics scene.
    /// </summary>
    public class PhysicsSceneSync : NetworkBehaviour
    {
        /// <summary>
        /// True to synchronize physics 2d.
        /// </summary>
        [SerializeField]
        private bool _synchronizePhysics2D;
        /// <summary>
        /// True to synchronize physics 3d.
        /// </summary>
        [SerializeField]
        private bool _synchronizePhysics;
        /// <summary>
        /// Scenes which have physics handled by this script.
        /// </summary>
        private static HashSet<int> _synchronizedScenes = new HashSet<int>();
    
        public override void OnStartNetwork()
        {
            /* If scene is already synchronized do not take action.
             * This means the script was added twice to the same scene. */
            int sceneHandle = gameObject.scene.handle;
            if (_synchronizedScenes.Contains(sceneHandle))
                return;
    
            /* Set to synchronize the scene if either 2d or 3d
             * physics scene differ from the defaults. */
            _synchronizePhysics = (gameObject.scene.GetPhysicsScene() != Physics.defaultPhysicsScene);
            _synchronizePhysics2D = (gameObject.scene.GetPhysicsScene2D() != Physics2D.defaultPhysicsScene);
    
            /* If to synchronize 2d or 3d manually then
             * register to pre physics simulation. */
            if (_synchronizePhysics || _synchronizePhysics2D)
            {
                _synchronizedScenes.Add(sceneHandle);
                base.TimeManager.OnPrePhysicsSimulation += TimeManager_OnPrePhysicsSimulation;
            }
        }
    
        public override void OnStopNetwork()
        {
            //Check to unsubscribe.
            if (_synchronizePhysics || _synchronizePhysics2D)
            {
                _synchronizedScenes.Remove(gameObject.scene.handle);
                base.TimeManager.OnPrePhysicsSimulation -= TimeManager_OnPrePhysicsSimulation;
            }
        }
    
        private void TimeManager_OnPrePhysicsSimulation(float delta)
        {
            /* If to simulate physics then do so on this objects
             * physics scene. If you know the object is not going to change
             * scenes you can cache the physics scenes
             * rather than look them up each time. */
            if (_synchronizePhysics)
                gameObject.scene.GetPhysicsScene().Simulate(delta);
            if (_synchronizePhysics2D)
                gameObject.scene.GetPhysicsScene2D().Simulate(delta);
        }
    
    }


---

# Scene Unload Data Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)
7.  [Scene Data](/docs/manual/guides/scene-management/scene-data)

# SceneUnloadData

The Data Class needed for the SceneManager to know how to handle unloading a scene.

## 


General

When unloading scenes information on what to unload is constructed within the SceneUnloadData class. SceneUnloadData is very similar to SceneLoadData. The API for SceneUnloadData can be found [here](https://firstgeargames.com/FishNet/api/docs/FishNet.Managing.Scened.SceneUnloadData.html).

## 


Default Values

Copy

    //Default Values
    SceneUnloadData sud = new SceneUnloadData()
       {
        SceneLookupDatas = new SceneLookupData[0],
        Params = new UnloadParams()
        {
            ServerParams = new object[0],
            ClientParams = new byte[0]
        },
        Options = new UnloadOptions()
        {
            Mode = ServerUnloadMode.UnloadUnused,
            Addressables = false
        }
    };

SceneLookupDatas[](#scenelookupdatas)

This Array is populated with the scenes you want to unload, depending on the parameters you pass into the SceneUnloadData when constructed.

See [**Unloading Scenes**](/docs/manual/guides/scene-management/unloading-scenes) for examples.

Params[](#params)

Params are an optional way to assign data to your scene loads/unloads. This data will be available within [**Scene Events**](/docs/manual/guides/scene-management/scene-events), Information used in Params can be useful for storing information about the scene load/unload and referencing it later when the scene load/unload completes.

### 


ServerParams

_ServerParams_ are only included on the server side, and are not networked. It is an array of objects, meaning you can send anything you want. However when accessing the Params through event args, you will have to cast the object to the data you want.

### 


ClientParams

_ClientParams_ is a byte array which may contain anything, and will be sent to clients when they receive the load scene instructions. Clients can access the _ClientParams_ within the scene change events.

Options[](#options)

Like with Options in loading, the UnloadOptions offer additional settings when unloading.

### 


Mode

These values will override the AutomaticallyUnload Option that was used when loaded the scene. If you set _AutomaticallyUnload_ to false but specified _ServerUnloadModes.UnloadUnused_ then the scene would be unloaded when emptied.

#### 


ServerUnloadModes.UnloadUnused

*   This is the default setting which will only unload a scene which is no longer used.
    

#### 


ServerUnloadModes.KeepUnused

*   This option will keep the scene loaded on the server if all clients have been removed. See [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details


---

# Scene Visibility Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Scene Visibility

Scene Visibility offers details of using the "Scene Condition" with the ObserverManager, and how to manage Observers in a Scene.

## 


General

You can control if clients become an [**Observer**](/docs/manual/guides/observers) of gameobjects in a scene that they are in. This is possible if you set your [**ObserverManager**](/docs/manual/guides/components/managers/observermanager) to include a **Scene Condition**. The **Scene Condition** ensures that [**NetworkObjects**](/docs/manual/guides/networkobjects) both scene and spawned are only visible to players in the same scene as the object. In most cases you will want to add a [NetworkObserver](/docs/manual/guides/components/network-observer) component, with a scene condition to your networked objects.

When encountering an error about being unable to find a NetworkObject or RPCLink during a scene change, you likely forgot to add the scene condition.

## 


Managing Visibility

### 


Initial Scene Load

When a client is loading into the game for the first time, the first scene/offline scene loaded is done so by the Unity Scene Manager. This means that clients were not automatically added to the scene when connected. Which also means they do not have visibility of that scene.

Once client connects to a host or server, If you use the **PlayerSpawner** component FishNet provided on the NetworkManager, there is logic in that component that will add the client to the default scene on the Player Objects spawn.

If you decided not to use the **PlayerSpawner** Component provided on the NetworkManger in Fishnet, you will have to either have to load a client into a scene using FishNets SceneManager, or call SceneManger.AddOwnerToDefaultScene() on a Object that you gave that client ownership to.

### 


Adding Client Connections To Scenes

*   When Loading a scene globally or by connection, the SceneManager will automatically place that connection into the scene.
    
*   Once added that client will be able to view all NetworkObjects that are apart of that scene.
    
*   You can add Client Connections to Scenes Manually if the scene is already loaded on the client, by using SceneManager.AddConnectionsToScene();
    

Manually adding and removing client connections is recommended for Power Users only.

### 


Removing Client Connections From Scenes

*   When Unloading a scene from a client, the server will automatically remove the client connection from the scene.
    
*   If you are the host, and you unload the hosts client from a scene, it will only remove the host from the scene and the hosts client will lose visibility. See Host Behaviour for [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching) for more details.
    
*   You can remove a client manually from a loaded scene, by using SceneManager.RemoveConnectionsFromScene();


---

# Server Client Host Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)
5.  [Terminology](/docs/manual/general/terminology)

# Server, Client, Host

## 


Ownership and Controller

Ownership is when a specific client 'owns' the object, while controller is whichever entity controls the object. By our terms, only a client can own an object, but server or client may be controller.

When a client owns an object they are the 'controller' and are able to send [remote procedure calls](/docs/manual/guides/remote-procedure-calls) without disabling authority checks, among other tasks such as generating prediction data.

A controller is the server if the object is not owned by any client, but again, the client becomes the controller when they own the object.

## 


Server

Server is an instance of your project which clients connect to. A server allows clients to interact with each other and will often be responsible for important aspects of your game such as score keeping, world spawning, and more.

#### 


Local Server

When a server is started the build or instance running the server is referred to as the local server.

#### 


Remote Client

A remote client is a term only applicable when running as the server. A remote client is a player connection established with the server. It's possible for a remote client to be the same as a local client. The main difference is the local client refers to the player-side logic while a remote client refers to the server's connection with the client.

## 


Client

A client connects to the server, whether the server be local or online. A client is the player for your game. A client experiences the game-play while the server synchronizes data between clients.

#### 


Local Client

Local client refers to the client controlling their game. If you join the server as a player, you are the local client.

#### 


Remote Server

When the local client connects to a server, they are connecting to a remote server. It's possible the remote server is also the local server if the client is running as host.

## 


Host

When behaving as a host you are both the client and the server. An individual can become host without having to compile additional executables, nor having to provide any special access to their computer. Host is ideal for speedy development.


---

# Server Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# ServerManager

ServerManager handles validation of clients and a variety of settings only applicable to the server.

## 


Component Settings

Settings _are general settings related to the ServerManager._[](#settings-are-general-settings-related-to-the-servermanager)

**SyncType Rate** is the default send rate for SyncTypes. 0f will send updates every tick. This value can be overridden for individual SyncTypes.

**Spawn Packing** determin es how well transform properties will be packed when being sent in a spawn message. If transforms spawn marginally off reducing the packing may help.

**Change Frame Rate** while true will change the frame rate limitation when acting as server only.

*   **Frame Rate** is the frame rate to use while only the server is active. When both server and client are active the higher of the two frame rates will be used.
    

**Start On Headless** will automatically start the server when executing server builds.

Connections _are settings related to each client connection._[](#connections-are-settings-related-to-each-client-connection)

**Remote Client Timeout** decides if the server should disconnect clients which seem unresponsive. This feature can be set to disabled, work in development and releases, or only releases.

*   **Timeout** is how long the client must be unresponsive before they are kicked.
    

**Share Ids** while true, enables clients to be aware of other clients in game and objects owned by other clients. Objects owned by other clients are only known if they are available to the local client, such as through the observer system. Client Ids are not sensitive information but leaving this option enable will use additional bandwidth.

Security _are settings related to server security._[](#security-are-settings-related-to-server-security)

**Authenticator** is where you specify which [authenticator](/docs/manual/guides/components/authenticator) to use. When left empty clients may join the server without specialized authentication.

**Allow Predicted Spawning** lets prefabs and scene objects be setup to use [Predicted Spawning](/docs/manual/guides/spawning/predicted-spawning). You can use this setting to enable or disable predicted spawning without having to change the settings for every object. This value may also be set at runtime. If changing at runtime be certain to also change on the client; otherwise they could be kicked for trying to use a disabled feature.

*   **Reserved Object Ids** is the number of ObjectIds to reserve per client for predicted spawning. Clients will start out with the specified number of Ids and receive new ones as the server validates their predicted spawning requests. For example: if this value was set to 15 and a client with a 100ms ping sent 3 predicted spawns in one tick then they would have only 12 predicted spawns left to use until the server responded with 3 new Ids, which would be approximately 50ms later.


---

# Spawning And Despawning Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Spawning and Despawning

For objects to exist over the network they must have a NetworkObject component on them, and **must be spawned using the server**. To spawn an object it must first be instantiated, and then passed into a Spawn method. There are a variety of Spawn methods to access for your convenience, all of which provide the same outcome.

Networked addressable prefabs must be registered with the NetworkManager differently. See [Addressables](/docs/manual/guides/addressables) guide for more information on this.

**Spawning Without an Owner** is done by passing in _null_ for the owner, or simply leaving the argument out.

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, null);

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go);

**Spawning With Ownership**

Copy

    GameObject go = Instantiate(_yourPrefab);
    InstanceFinder.ServerManager.Spawn(go, ownerConnection);

You may also access the spawn method within any script that inherits NetworkBehaviour, or by accessing the NetworkObject.

Copy

    GameObject go = Instantiate(_yourPrefab);
    base.Spawn(go, ownerConnection); //networkBehaviour.
    //or
    networkObject.Spawn(go, ownerConnection); //referencing a NetworkObject.

**Despawning** can be accessed the same ways as spawning. Through a NetworkBehaviour script, a reference NetworkObject, or through the ServerManager directly.

Copy

    base.Despawn(); //networkBehaviour. Despawns the NetworkObject.
    networkObject.Despawn(); //referencing a NetworkObject.
    InstanceFinder.ServerManager.Despawn(gameObject); //through ServerManager.

When despawning you may also choose to pool the object rather than destroy it. There are optional parameters available to change this behavior.

Copy

    base.Despawn(DespawnType.Pool); //pools the object instead of destroying it.

You can check if an object is spawned at anytime using the _IsSpawned_ property within NetworkBehaviour, or NetworkObject.

**Scene Objects** are spawned and despawned like instantiated objects, except you pass in the reference of the already instantiated/placed scene object. A scene object becomes disabled rather than destroyed when despawned.


---

# States Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Lag Compensation](/docs/manual/guides/lag-compensation)

# States

States sometimes need to be synchronized between clients and server to prevent desynchronization. This is generally only true when using client-side prediction. However, it is possible this guide could be used outside prediction so please keep that in mind when reading.

Ideally when using prediction the client should run all states locally as they would normally occur, just like the server. For example, if you were to drive a ship into the wall and want to apply a slow, the client and server would apply the state immediately when hitting the wall. In such a scenario the states would most likely exist in the replicate and reconcile data. However, there are cases when only a server is aware of a state, and if the server applies the state before the client does a desynchronization will occur. If this is the design you are intending, consider reworking your logic so clients and server run the same simulation instead; otherwise, continue reading!

A common state that requires synchronizing as example given is something that would impact movement. In this guide I'll be demonstrating on how to apply an EMP.

Since only the server is aware when the state is applied we will perform a check on the server, using the _base.IsServer_ check. When the condition is satisfied as by our pretend _ApplyEmp()_ method a RPC is sent.

Copy

    
    private void TimeManager_OnTick()
    {
        /* We're going to pretend there is
         * some logic here which happens only on the
         * server resulting in applying a EMP. 
         *
         * The EMP is set to apply 50ms in the future.
         * However many ticks used are up to you. The goal is
         * to give clients a chance to get the emp tick
         * before that tick actually runs on their end. 
         * This will have clients all run the EMP at roughly
         * the same time, keeping in mind there is sometimes a
         * small margin of error of 1 tick. */
        if (base.IsServer && ApplyEMP())
        {
            uint futureTicks = base.TimeManager.TimeToTicks(0.05f, TickRounding.RoundUp);
            ObserversSetEMPTick(base.TimeManager.LocalTick + futureTicks);
        }
    
    }
    
    //RunLocally is used to the server also sets the emp tick.
    [ObserversRpc(RunLocally = true)]
    private void ObserversSetEMPTick(uint serverTick)
    {
        //Converts the server EMP tick to local tick for this client.
        _empStartTick = base.TimeManager.TickToLocalTick(serverTick);
        //Set end tick. In our example the EMP will last 1 second.
        _empEndTick = _empStartTick + base.TimeManager.TimeToTicks(1f, TickRounding.RoundUp);
    }

When the RPC is received two fields are set, a tick when to start the EMP and when to end it.

Next in our replicate method if the clients or servers LocalTick is within that EMP duration we prevent any further motor movement. As mentioned this example uses prediction but you could apply this to an Update loop as well if not using prediction.

Copy

    //Tick when to start emp.
    private uint _empStartTick = uint.MaxValue;
    //Tick when to end emp.
    private uint _empEndTick = uint.MaxValue;
    
    /* This is an example of a replicate data excluding the extra
     * parameters, given they have no context in this example. */
    [Replicate]
    private void Replicate(MotorData md)
    {
        uint localTick = base.TimeManager.LocalTick;
        /* If localTick is between EMP range then return.
         * It's important to not reset the emp values because
         * we want these to be the same during replays. If you reset
         * values soon as the condition of exiting emp was satisfied
         * then emp would not be properly set during a replay. 
         *
         * Note that this logic runs on the server and owner,
         * and if using prediction v2 can run on other clients
         * as well. */
        if (localTick >= _empStartTick && localTick <= _empEndTick)
        {
            /* Since under emp exit method early
            * to not process MotorData. In this example
             * we are using an EMP state, therefor the motor
             * will not work. You'll adjust this to whatever
             * your game needs. */
            return;
        }
    
        //Normal motor logic here. 
    }

Just like that the client is set to apply the EMP marginally in the future, and as will the server. Yes, this does create a very small delay on when the EMP or state begins but this is often considered acceptable to maintain a reliable simulation. In addition, also as said before, ideally the client will be running the same simulation as the server at all times which would let you avoid this sort of setup.


---

# Statistics Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# StatisticsManager

StatisticManager provides statics about Fish-Networking for a variety of tasks, including monitoring network traffic.

## 


Component Settings

Settings _are general settings related to the StatisticsManager._[](#settings-are-general-settings-related-to-the-statisticsmanager)

**Network Traffic** can be used to gain basic information about how much network traffic your game is using. These values must be enabled for the [BandwidthDisplay](/docs/manual/guides/components/utilities/bandwidthdisplay) component to function.

*   **Update Interval** is how often network traffic related operations occur, such as invoking update events.
    
*   **Update Client** will invoke client traffic updates when enabled.
    
*   **Update Server** will invoke server traffic updates when enabled.


---

# Sync Dictionary Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncDictionary

SyncDictionary is an easy way to keep a Dictionary collection automatically synchronized over the network.

SyncDictionary supports all the functionality a normal dictionary would, just as SyncList supports List abilities.

Callbacks for SyncDictionary are similar to SyncList. And like other synchronization types changes are set immediately before the callback occurs.

Copy

    private readonly SyncDictionary<NetworkConnection, string> _playerNames = new();
        
    private void Awake()
    {
        _playerNames.OnChange += _playerNames_OnChange;
    }
    
    //SyncDictionaries also include the asServer parameter.
    private void _playerNames_OnChange(SyncDictionaryOperation op,
        NetworkConnection key, string value, bool asServer)
    {
        /* Key will be provided for
        * Add, Remove, and Set. */     
        switch (op)
        {
            //Adds key with value.
            case SyncDictionaryOperation.Add:
                break;
            //Removes key.
            case SyncDictionaryOperation.Remove:
                break;
            //Sets key to a new value.
            case SyncDictionaryOperation.Set:
                break;
            //Clears the dictionary.
            case SyncDictionaryOperation.Clear:
                break;
            //Like SyncList, indicates all operations are complete.
            case SyncDictionaryOperation.Complete:
                break;
        }
    }

If you are using this SyncType with a container, such as a class or structure, and want to modify values within that container, you must set the value dirty. See the example below.

Copy

    [System.Serializable]
    private struct MyContainer
    {
        public string PlayerName;
        public int Level;
    }
    
    private readonly SyncDictionary<int, MyContainer> _containers = new();
    
    private void Awake()
    {
        MyContainer mc = new MyContainer
        {
            Level = 5
        };
        _containers[2] = mc;
    }
    
    [Server]
    private void ModifyContainer()
    {
        MyContainer mc = _containers[2];
        //This will change the value locally but it will not synchronize to clients.
        mc.Level = 10;
        //You may re-apply the value to the dictionary.
        _containers[2] = mc;
        //Or set dirty on the value or key. Using the key is often more performant.
        _containers.Dirty(2);
    }


---

# Sync Hash Set Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncHashSet

SyncHashSet is an easy way to keep a HashSet collection automatically synchronized over the network.

Callbacks for SyncHashSet are similar to SyncList. And like other synchronization types changes are set immediately before the callback occurs.

Copy

    private readonly SyncHashSet<int> _myCollection = new SyncHashSet<int>();
    
    private void Awake()
    {
        _myCollection.OnChange += _myCollection_OnChange;
    }
    
    private void FixedUpdate()
    {
        //You can modify a synchashset as you would any other hashset.
        _myCollection.Add(Time.frameCount);
    }
    
    /* Like SyncVars the callback offers an asServer option
     * to indicate if the callback is occurring on the server
     * or the client. As SyncVars do, changes have already been
     * made to the collection before the callback occurs. */
    private void _myCollection_OnChange(SyncHashSetOperation op, int item, bool asServer)
    {
        switch (op)
        {
            /* An object was added to the hashset. Item is
             * is the added object. */
            case SyncHashSetOperation.Add:
                break;
            /* An object has been removed from the hashset. Item
             * is the removed object. */
            case SyncHashSetOperation.Remove:
                break;
            /* The hashset has been cleared. 
             * Item will be default. */
            case SyncHashSetOperation.Clear:
                break;
            /* An entry in the hashset has been updated. 
             * When this occurs the item is removed
             * and added. Item will be the new value.
             * Item will likely need a custom comparer
             * for this to function properly. */
            case SyncHashSetOperation.Update:
                break;            
            /* When complete calls all changes have been
            * made to the collection. You may use this
            * to refresh information in relation to
            * the changes, rather than doing so
            * after every entry change. All values are
            * default for this operation. */
            case SyncHashSetOperation.Complete:
                break;
        }
    }
    

If you are using this SyncType with a container, such as a class or structure, and want to modify values within that container, you must set the value dirty. See the example below.

Copy

    [System.Serializable]
    private struct MyContainer
    {
        public string PlayerName;
        public int Level;
    }
    
    private readonly SyncHashSet<MyContainer> _containers = new();
    private MyContainer _containerReference = new();
    
    private void Awake()
    {
        _containerReference.Level = 5;
        _containers.Add(_containerReference);
    }
    
    [Server]
    private void ModifyPlayer()
    {
        
        //This will change the value locally but it will not synchronize to clients.
        _containerReference.Level = 10;
        //The value must be set dirty to force a synchronization.
        _containers.Dirty(_containerReference);
    }


---

# Sync List Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncList

SyncList is an easy way to keep a List collection automatically synchronized over the network.

Using a SyncList is done the same as with a normal List.

Network callbacks on SyncList do have a little more information than SyncVars. Other non-SyncVar SyncTypes also have their own unique callbacks. The example below demonstrates a SyncList callback.

Copy

    private readonly SyncList<int> _myCollection = new();
    
    private void Awake()
    {
        /* Listening to SyncList callbacks are a
        * little different from SyncVars. */
        _myCollection.OnChange += _myCollection_OnChange;
    }
    private void Update()
    {
        //You can modify a synclist as you would any other list.
        _myCollection.Add(10);
        _myCollection.RemoveAt(0);
        //ect.
    }
    
    /* Like SyncVars the callback offers an asServer option
     * to indicate if the callback is occurring on the server
     * or the client. As SyncVars do, changes have already been
     * made to the collection before the callback occurs. */
    private void _myCollection_OnChange(SyncListOperation op, int index,
        int oldItem, int newItem, bool asServer)
    {
        switch (op)
        {
            /* An object was added to the list. Index
            * will be where it was added, which will be the end
            * of the list, while newItem is the value added. */
            case SyncListOperation.Add:
                break;
            /* An object was removed from the list. Index
            * is from where the object was removed. oldItem
            * will contain the removed item. */
            case SyncListOperation.RemoveAt:
                break;
            /* An object was inserted into the list. Index
            * is where the obejct was inserted. newItem
            * contains the item inserted. */
            case SyncListOperation.Insert:
                break;
            /* An object replaced another. Index
            * is where the object was replaced. oldItem
            * is the item that was replaced, while
            * newItem is the item which now has it's place. */
            case SyncListOperation.Set:
                break;
            /* All objects have been cleared. Index, oldValue,
            * and newValue are default. */
            case SyncListOperation.Clear:
                break;
            /* When complete calls all changes have been
            * made to the collection. You may use this
            * to refresh information in relation to
            * the list changes, rather than doing so
            * after every entry change. Like Clear
            * Index, oldItem, and newItem are all default. */
            case SyncListOperation.Complete:
                break;
        }
    }

If you are using this SyncType with a container, such as a class, and want to modify values within that container, you must set the value dirty. See the example below.

Copy

    private class MyClass
    {
        public string PlayerName;
        public int Level;
    }
    
    private readonly SyncList<MyClass> _players = new SyncList<MyClass>();
    
    //Call dirty on an index after modifying an entries field to force a synchronize. 
    [Server] 
    private void ModifyPlayer()
    {
        _players[0].Level = 10;
        //Dirty the 0 index.
        _players.Dirty(0);
    }

Structures cannot have their values modified when they reside within a collection. You must instead create a local variable for the collection index you wish to modify, change values on the local copy, then set the local copy back into the collection

Copy

    /* . */
    [System.Serializable]
    private struct MyStruct
    {
        public string PlayerName;
        public int Level;
    }
    
    private readonly SyncList<MyStruct> _players = new();
    
    [Server] 
    private void ModifyPlayer()
    {
        MyStruct ms = _players[0];
        ms.Level = 10;
        _players[0] = ms;
    }


---

# Sync Stopwatch Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncStopwatch

SyncStopwatch provides an efficient way to synchronize a stopwatch between server and clients.

Like SyncTimer, SyncStopwatch only updates state changes such as start or stopping, rather than each individual delta change.

Copy

    private readonly SyncStopwatch _timePassed = new()

Making changes to the timer is very simple, and like other SyncTypes must be done on the server.

Copy

    //All of the actions below are automatically synchronized.
    
    /* Starts the stopwatch while optionally sending a stop
     * message first if stopwatch was already running.
     * If the stopwatch was previously running the time passed
     * would be reset. */
    /* This would invoke callbacks indicating a stopwatch
     * had stopped, then started again. */
    _timePassed.StartStopwatch(true);
    /* Pauses the stopwatch and optionally sends the current
     * timer value as it is on the server. */
    _timePassed.PauseStopwatch(false);
    //Unpauses the current stopwatch.
    _timePassed.UnpauseStopwatch();
    /* Ends the Stopwatch while optionally sends the
    * current value to clients, as it was during the stop. */
    _timePassed.StopStopwatch(false);

Updating and reading the timer value is much like you would a normal float value.

Copy

    private void Update()
    {
        /* Like SyncTimer, SyncStopwatch must be updated
         * with a delta on both server and client. Do not
         * update the delta twice if clientHost. You can update
         * the delta anywhere in your code. */
        _timePassed.Update(Time.deltaTime);
    
        //Access the current time passed.
        Debug.Log(_timePassed.Elapsed);
        /* You may also see if the stopwatch is paused before
         * accessing elapsed. */
        if (!_timePassedPaused)
            Debug.Log(_timePassed.Elapsed);
    }

Like other SyncTypes, you can subscribe to change events for the SyncStopwatch.

Copy

    private void Awake()
    {
        _timePassed.OnChange += _timePassed_OnChange;
    }
    
    private void OnDestroy()
    {
        _timePassed.OnChange -= _timePassed_OnChange;
    }
    
    private void _timePassed_OnChange(SyncStopwatchOperation op, float prev, bool asServer)
    {
        /* Like all SyncType callbacks, asServer is true if the callback
         * is occuring on the server side, false if on the client side. */
    
        //Operations can be used to be notified of changes to the timer.
        //This is much like other SyncTypes.
        //Here is an example of performing logic only if starting or stopping.
        if (op == SyncStopwatchOperation.Start || op == SyncStopwatchOperation.Stop)
        {
            //Do logic.
        }
        
        /* prev, our float, indicates the value of the stopwatch prior to
         * the operation. Remember that you can get current value using
         * _timePassed.Elapsed */
    }


---

# Sync Timer Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncTimer

SyncTimer provides an efficient way to synchronize a timer between server and clients.

Unlike SyncVars, a SyncTimer only updates state changes such as start or stopping, rather than each individual delta change.

SyncTimer is a [Custom SyncType](/docs/manual/guides/synchronizing/custom-synctype), and is declared like any other SyncType.

Copy

    private readonly SyncTimer _timeRemaining = new SyncTimer();

Making changes to the timer is very simple, and like other SyncTypes must be done on the server.

Copy

    //All of the actions below are automatically synchronized.
    
    /* Starts the timer with 5 seconds on it.
     * 
     * The optional boolean argument will also send
     * a stop event before starting a new timer, only if
     * the previous timer is still running.
     * 
     * EG: if a timer was started with 5 seconds and
     * you start a new timer with 2 seconds remaining
     * a StopTimer will be sent with the remaining time
     * of 2 seconds before the timer is started again at
     * 5 seconds. */
    _timeRemaining.StartTimer(5f, true);
    /* Pauses the timer and optionally sends the current
     * timer value as it is on the server. */
    _timeRemaining.PauseTimer(false);
    //Unpauses the current timer.
    _timeRemaining.UnpauseTimer();
    /* Stops the timer early and optionally sends the
    * current timer value as it is on the server. */
    _timeRemaining.StopTimer(false);

Updating and reading the timer value is much like you would a normal float value.

Copy

    private void Update()
    {
        /* Timers must be updated both on the server
         * and clients. This only needs
         * to be done on either/or if clientHost. The timer
         * may be updated in any method. */
        _timeRemaining.Update(); 
    
        /* Access the current time remaining. This is how
         * you can utilize the current timer value. When a timer
         * is complete the remaining value will be 0f. */
        Debug.Log(_timeRemaining.Remaining);
        /* You may also see if the timer is paused before
         * accessing time remaining. */
        if (!_timeRemaining.Paused)
            Debug.Log(_timeRemaining.Remaining);
    }

Like other SyncTypes, you can subscribe to change events for the SyncTimer.

Copy

    private void Awake()
    {
        _timeRemaining.OnChange += _timeRemaining_OnChange;
    }
    
    private void OnDestroy()
    {
        _timeRemaining.OnChange -= _timeRemaining_OnChange;
    }
    
    private void _timeRemaining_OnChange(SyncTimerOperation op, float prev, float next, bool asServer)
    {
        /* Like all SyncType callbacks, asServer is true if the callback
         * is occuring on the server side, false if on the client side. */
    
        //Operations can be used to be notified of changes to the timer.
    
        //Timer has been started with initial values.
        if (op == SyncTimerOperation.Start)
            Debug.Log($"The timer was started with {next} seconds.");
        //Timer has been paused.
        else if (op == SyncTimerOperation.Pause)
            Debug.Log($"The timer was paused.");
        //Timer has been paused and latest server values were sent. 
        else if (op == SyncTimerOperation.PauseUpdated)
            Debug.Log($"The timer was paused and remaining time has been updated to {next} seconds.");
        //Timer was unpaused.
        else if (op == SyncTimerOperation.Unpause)
            Debug.Log($"The timer was unpaused.");
        //Timer has been manually stopped.
        else if (op == SyncTimerOperation.Stop)
            Debug.Log($"The timer has been stopped and is no longer running.");
        /* Timer has been manually stopped.
         * 
         * When StopUpdated is called Previous will contain the remaining time
         * prior to being stopped as it is locally. Next will contain the remaining
         * time prior to being stopped as it was on the server. These values
         * often align but the information is provided for your potential needs. 
         *
         * When the server starts a new timer while one is already active, and chooses
         * to also send a stop update using the StartTimer(float,bool) option, a
         * StopUpdated is also sent to know previous timer values before starting a new timer. */
        else if (op == SyncTimerOperation.StopUpdated)
            Debug.Log($"The timer has been stopped and is no longer running. The timer was stopped at value {next} before stopping, and the previous value was {prev}");
        //A timer has reached 0f.
        else if (op == SyncTimerOperation.Finished)
            Debug.Log($"The timer has completed!");
        //Complete occurs after all change events are processed.
        else if (op == SyncTimerOperation.Complete)
            Debug.Log("All timer callbacks have completed for this tick.");
    }


---

# Sync Types Fish Net Networking Evolved

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


---

# Sync Var Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [SyncTypes](/docs/manual/guides/synchronizing)

# SyncVar

SyncVars are the most simple way to automatically synchronize a single variable over the network.

SyncVars are used to synchronize a single field. Your field can be virtually anything: a value type, struct, or class. To utilize a SyncVar you must implement your type as a SyncVar class

Copy

    public class YourClass : NetworkBehaviour
    {
        private readonly SyncVar<float> _health = new SyncVar<float>();
    }
    /* Any time _health is changed on the server the
    * new value will be sent to clients. */

SyncTypes can also be customized with additional options by using the UpdateSettings method within your declared SyncTypes, or using the initializer of your SyncType. These options include being notified when the value changes, changing how often the SyncType will synchronize, and more. You can view a full list of SyncVar properties which may be changed by viewing the [API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.Synchronizing.SyncVarAttribute.html#fields).

Below is a demonstration on sending SyncTypes at a longer interval of at most every 1f, and being notified of when the value changes.

Copy

    private readonly SyncVar<float> _health = new SyncVar<float>(new SyncTypeSettings(1f);
        
    private void Awake()
    {
        _health.OnChange += on_health;
    }
    
    //This is called when _health changes, for server and clients.
    private void on_health(float prev, float next, bool asServer)
    {
        /* Each callback for SyncVars must contain a parameter
        * for the previous value, the next value, and asServer.
        * The previous value will contain the value before the
        * change, while next contains the value after the change.
        * By the time the callback occurs the next value had
        * already been set to the field, eg: _health.
        * asServer indicates if the callback is occurring on the
        * server or on the client. Sometimes you may want to run
        * logic only on the server, or client. The asServer
        * allows you to make this distinction. */
    }

Another common request is achieving client-side SyncVar values. This may be achieved by using a ServerRpc.

When modifying SyncVars using client-side, a RPC is sent with every set. If your SyncVar value will change frequently consider limiting how often you set the value client-side to reduce bandwidth usage.

In a future release we are planning to make all SyncTypes have client-authoritative properties where this work-around will not be needed.

Copy

    //A typical server-side SyncVar.
    public readonly SyncVar<string> Name = new SyncVar<string>();
    //Create a ServerRpc to allow owner to update the value on the server.
    [ServerRpc] private void SetName(string value) => Name.Value = value;

When using client-side SyncVars you may want to consider ExcludeOwner in the SyncVar ReadPermissions to prevent owners from receiving their own updates. In addition, using WritePermission.ClientUnsynchronized will allow the client to set the value locally. Lastly, RunLocally as true in the ServerRpc will execute the RPC code on both the sender(client) and the server.

Using ExcludeOwner as the SyncVar ReadPermissions, and ClientUnsynchronized in the WritePermissions. . In the example below we also set RunLocally to true for the ServerRpc so that the calling client also sets the value locally.

Copy

    //Attributes shown in previous examples can stack but they were removed
    //here for simplicity.
    private readonly SyncVar<string> Name = new SyncVar<string>(new SyncTypeSettings(WritePermission.ClientUnsynchronized, ReadPermission.ExcludeOwner));
    //Create a ServerRpc to allow owner to update the value on the server.
    [ServerRpc(RunLocally = true)] private void SetName(string value) => Name.Value = value;


---

# Technical Limitations Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Technical Limitations

Limitation is not a word we like to use in Fish-Networking but unfortunately there are a few technical blocks with Unity, or restrictions in place for performance reasons. These limitations are considered reasonably acceptable and may never be resolved.

Networked Scene Objects[](#networked-scene-objects)

When a scene object is networked they may behave differently.

A networked scene object will be disabled when a scene loads, and will not activate until the client or server is started. For clients specifically networked scene objects will only activate when the server is sure the client has loaded the scene; this is done automatically through the Fish-Networking scene manager.

Our [SceneManager](/docs/manual/guides/components/managers/scenemanager) allows instantiated networked objects to be moved between scenes, but networked scene objects may not. Unity cannot know a scene objects details without the scene being loaded first, so trying to spawn a scene object without the client having the scene loaded would result in errors.

Due to the movement restrictions just mentioned, networked scene objects may not be marked DontDestroyOnLoad, nor can the NetworkObject.IsGlobal feature be used. Both of these would place the scene object in a new scene, causing errors.

When a networked scene object is despawned it is always disabled, rather than destroyed. This is so you may spawn it at a later time. Manually destroying a scene object on the server is possible and would simply result in it never being spawned on clients.

Nested NetworkObjects and NetworkBehaviours[](#nested-networkobjects-and-networkbehaviours)

NetworkObjects which are nested on a prefab may not be unparented at runtime.

Root NetworkObjects may have their parent updated at runtime.

PredictedSpawn[](#predictedspawn)

Predicted spawns currently cannot be spawned as nested.

Predicted spawns are currently not aligned with prediction interpolation.


---

# Tick Smoothers Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Utilities](/docs/manual/guides/components/utilities)

# Tick Smoothers

These components smooths a child graphical object over frames between each network tick. These are useful for prediction and smoothing graphics on larger physics steps.

You may put multiple tick smoother components beneath an object if you have several different graphical pieces in your hierarchy you want smoothed. A good example of this is a vehicle where the wheels move independently of the vehicle body.

The smoother will be placed on the graphical object you wish to smooth; this object must not be the same as the target, nor higher in the hierarchy of the target; being a child of the target is fine.

Tick Smoothers are only used by clients. These components will not function when only the server is started.


---

# Time Manager Fish Net Networking Evolved

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


---

# Transport Manager Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Managers](/docs/manual/guides/components/managers)

# TransportManager

TransportManager handles talking to the transports as well sending, receiving, and even customizing packets on the fly.

If you want to modify network data such as for encryption, or use any one of our number of transports, you will want to add this component to your scene NetworkManager object.

* * *

## 


Component Settings

Settings _are general settings related to the TransportManager._[](#settings-are-general-settings-related-to-the-transportmanager)

**Transport: I**ndicates which transport to use. When left empty the default transport ([Tugboat](/docs/manual/guides/components/transports/tugboat)) is used, or the first transport manually added to the object which the TransportManager resides.

**Intermediate Layer:** To specify a custom intermediate layer to use.

**Latency Simulator:** Allows you to simulate a variety of latency scenarios on any transport.

*   **Settings:** Universal settings for the Latency Simulator.
    
    *   **Enabled:** Toggles the enabled state of the simulator.
        
    *   **Simulate Host:** When enabled will also simulate latency for clientHost.
        
    *   **Latency:** Is the amount of latency to simulate in milliseconds.
        
    
*   **Unreliable:** Features only used for unreliable packets.
    
    *   **Out Of Order:** The percentage chance to send an out of order packet.
        
    *   **Packet Loss:** The chance to drop a packet.


---

# Transports Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)

# Transports

Transports control how data is sent, received, and handled over the network. Fish-Net uses events internally to plug into transport messages. Although it be unlikely you would need to access such messages, they are available to you for your development as well.

There are several transports already available.

*   [Tugboat](/docs/manual/guides/components/transports/tugboat) (LiteNetLib).
    
*   [Bayou](/docs/manual/guides/components/transports/bayou) (WebGL).
    
*   [Yak](/docs/manual/guides/components/transports/yak-pro-feature) (For offline gameplay).
    
*   [Multipass](/docs/manual/guides/components/transports/multipass) (Multi-transport support).
    
*   [FishySteamworks](/docs/manual/guides/components/transports/fishysteamworks) (Steamworks.Net).
    
*   [FishyFacepunch](/docs/manual/guides/components/transports/fishyfacepunch-steam) (Facepunch for Steam).
    
*   [Fish-Networking-Discovery](/docs/manual/general/add-ons/fish-network-discovery) (LAN discovery).
    
*   [Epic Online Services \[EOS\]](/docs/manual/guides/components/transports/fishyeos-epic-online-services).
    
*   [FishyUTP](/docs/manual/guides/components/transports/fishyunitytransport) (Unity Transport -> improved by ooonush)
    
*   [FishyRealtime](https://github.com/REIO7200/FishyRealtime) (Photon Realtime).
    
*   [FishyWebRTC](https://github.com/cakeslice/FishyWebRTC) (WebRTC).
    
*   [CanoeWebRTC](https://github.com/gmrodriguez124/CanoeWebRTC) (WebRTC).
    

#### 


Legacy

*   [FishyUTP](https://github.com/matthewshirley/FishyUTP) (Unity Transport -> Legacy).


---

# Tugboat Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Transports](/docs/manual/guides/components/transports)

# Tugboat

## 


General

Tugboat uses LiteNetLib to support reliable and unreliable messages. This is the default transport for Fish-Networking.

* * *

## 


Compatibility

System

Supported?

Windows

Fully Supported

MacOS

Fully Supported

IOS

Fully Supported

Android

Fully Supported

Linux

Fully Supported

Xbox

Fully Supported

PlayStation

Fully Supported

Nintendo

Fully Supported

* * *

## 


How to Install

Tugboat is the default transport of FishNet! Which means it comes with FishNet by default when Importing FishNet from your favorite source.

The [Transport Manager](/docs/manual/guides/components/managers/transportmanager) will automatically make this the default transport at runtime, if you did not add any other Transport to the Network Manager Game Object.

* * *

## 


Component Settings

Settings _are general settings for Tugboat._[](#settings-are-general-settings-for-tugboat)

**Dont Route** forces sockets to send data directly to the network adapter interface without routing through other services such as routers. This is often only needed when working with multiple network adapters.

Channels _are settings related to channels, such as reliable and unreliable._[](#channels-are-settings-related-to-channels-such-as-reliable-and-unreliable)

**Unreliable MTU** is the largest size an unreliable packet may be. When a single outbound data exceeds this value it is sent reliably. Smaller unreliable datas will be automatically split over multiple unreliable sends.

Server _are settings used by the server._[](#server-are-settings-used-by-the-server)

**IPv4 Bind Address** is which address to bind the server to. If set and IPv4 is not available this will cause a socket error upon server start.

**Enable IPv6** enables IPv6 binding when available. In some cases you may want this disabled if you have an IPv6 interface you do not want used.

*   **IPv6 Bind Address** is which address to bind the server to. If set and IPv6 is not available this will cause a socket error upon server start.
    

**Port** is which port the server will listen on. This is also the port clients will connect to. In some instances you may need to change this at runtime using TransportManager.SetPort().

**Maximum Clients** is the maximum active clients allowed before the transport begins to deny connections.

Client _are settings used by the client._[](#client-are-settings-used-by-the-client)

**Client Address** is which address to connect to. This is typically your server address. Localhost is set as default for local testing.


---

# Understanding Replicate State Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)

# Understanding ReplicateState

Being familiar with what each state means will help you fine-tune your gameplay on spectated objects.

If you need a refresher on what each state means see our [API](https://firstgeargames.com/FishNet/api/api/FishNet.Object.ReplicateState.html) or simply navigate to the ReplicateState enum in your code editor.

Each state is a flag value; a replicate state may contain multiple flags. There are numerous extensions you may use to check if a state contains certain values.

You can view all built-in state extensions within the ReplicateState file.

## 


Invalid

An invalid ReplicateState should never occur. This would imply internally Fish-Networking failed to properly set the state.

## 


Ticked

Server and clients use this flag. This flag will be set if the data tick has run outside a reconcile, such as from user code within OnTick . Ticked can exist during a replay/reconcile, but only if the data had first run outside the replay/reconcile.

## 


Replayed

Only clients will use this flag. The replayed flag is set if data is being run during a reconcile.

The server is always considered right and never has to correct data, so it never reconciles or replays inputs

## 


Created

Server and client use this flag. A created flag indicates that the data was created by controller, such as owner or the server if no owner. The created flag will not be present if the controller has not sent updates, such as if they are not taking any action.

## 


State Examples

Below are examples of some possible states and what they mean.

Copy

    //You will see this value if the data is being replayed, it previously ran outside the
    //reconcile, and data is created by controller.
    state = (ReplicateState.Replayed | ReplicateState.Ticked | ReplicateState.Created);
    //When the state is only Replayed then the data is not Created, and the tick on data
    //has not occurred outside the reconcile yet. This is what we often refer to as a
    //future state.
    state = ReplicateState.Replayed;
    //When a state is Ticked only it indicates that the data is being run outside a
    //reconcile, and that the controller has not sent data for this particular tick.
    state = ReplicateState.Ticked;

For more possible flag examples see the state extensions (the ReplicateState file).


---

# Unity Compatibility Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)

# Unity Compatibility

## 


Unity 6

All features work, fully supported.

## 


Unity 2023.2+

All features work, fully supported.

## 


Unity 2022.3+

All features work, fully supported.

## 


Unity 2021.3+

All features work, fully supported.

## 


Unity 2020 and Earlier

Not supported.


---

# Unloading Scenes Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Scene Management](/docs/manual/guides/scene-management)

# Unloading Scenes

## 


General

Unloading scenes is the same as loading scenes, except to call Unload rather than Load. Scenes can be unloaded by connection, or globally. When unloaded globally scenes will be unloaded for all players. When unloading by connection only the connections specified will unload the scenes.

## 


Unloading Scenes

### 


Global Scenes

*   **Global Scenes** can be unloaded by calling UnloadGlobalScenes() in the SceneManager.
    
*   You cannot unload a global scene with UnloadConnectionScenes() method.
    

Copy

    SceneUnloadData sud = new SceneUnloadData("Town");
    base.NetworkManager.SceneManager.UnloadGlobalScenes(sud);

### 


Connection Scenes

**Connection Scenes** follow the same principle, but has a few method overloads. You can unload scenes for a single connection, multiple connections at once, or unload scenes on the server.

*   The Server will only Unload a connection scene on itself, if all connections have been unloaded from that scene.
    
*   If you wish to unload a scene and all connections, get all the connections in the scene and call unload with those connections. SceneManager.SceneConnections holds all online scenes and the connections in them.
    
*   If you wish to keep a scene loaded on server when unloading all Connections See [**Scene Caching**](/docs/manual/guides/scene-management/scene-caching).
    

Copy

    SceneUnloadData sud = new SceneUnloadData(new string[] { "Main", "Additive") });
    
    //Unload scenes for a single connection.
    NetworkConnection conn = base.Owner;
    base.NetworkManager.SceneManager.UnloadConnectionScenes(conn, sud);
    
    //Unload scenes for several connections at once.
    NetworkConnection[] conns = new NetworkConnection[] { connA, connB };
    base.NetworkManager.SceneManager.UnloadConnectionScenes(conns, sud);
    
    //Unload scenes only on the server.
    //that you don't want all players in.
    base.NetworkManager.SceneManager.UnloadConnectionScenes(sud);

## 


Advanced Info

### 


Behind the "Scenes"

The [**SceneManager**](/docs/manual/guides/components/managers/scenemanager) Class has very detailed XML comments on how the unload process works in detail, if you need to troubleshoot the scene unload process, these comments will help you understand the flow of how a scene loads.

### 


Events

Make sure to check out the [**Scene Events**](/docs/manual/guides/scene-management/scene-events) that you can subscribe to to give better control over your game.


---

# Upgrading To Fish Networking Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [General](/docs/manual/general)

# Upgrading To Fish-Networking

Moving to Fish-Networking will vary depending on which previous networking solution you are coming from. With other solutions changing their API so regularly it may be difficult to keep transition information up to date but we will try our best.

If you encounter any questions we welcome you on our Discord at [https://discord.gg/NqzSEqR](https://discord.gg/NqzSEqR), where our helpful community can get you started.

## 


Leaving Mirror Networking

More information will be added as it becomes available.

Always backup before making large changes. Having another copy of your project to reference during the upgrade is a great idea!

Majority of these changes can be done by using quick replace within your IDE!

**Mirror example conversion video:**

[**https://www.youtube.com/watch?v=ZhEMh5RjEjs**](https://www.youtube.com/watch?v=ZhEMh5RjEjs)

**Upgrade tool:**

An upgrade tool is provided to help transition from Mirror to Fish-Net. The tool will replace several Mirror components with the like ones for Fish-Net. Note that while the components will be replaced the settings of your components will not be preserved. For best results keep a copy of your original project for reference until switching over.

Currently supported components are:

*   NetworkIdentity
    
*   NetworkProximityChecker
    
*   NetworkTransform/Child
    
*   NetworkAnimator
    
*   NetworkSceneChecker
    

Additional components from FirstGearGames Mirror Assets/Projects are supported:

*   FlexNetworkTransform/Child
    
*   FastProximityChecker
    
*   FlexNetworkAnimator
    
*   FlexSceneChecker
    

The upgrade tool requires scripting defines to function. These defines should be removed after running the upgrade tool.

MIRROR - for Mirror components.

FGG\_ASSETS - for FirstGearGames assets.

FGG\_PROJECTS - for FirstGearGames projects.

Before running the upgrade tool you will likely need to remove a few files. If using FirstGearGames Mirror assets or projects, delete any of the demo folders included for those assets and projects.

In addition, any scripts requiring component NetworkIdentity will need to have the declaring line removed.

Copy

    //Replace the following with an empty string.
    [RequireComponent(typeof(NetworkIdentity))]
    
    //The hotkey in Visual Studio is Ctrl + Shift + H.

**Component changes:**

Mirror

Fish-Networking

Notes

Interest Management

[ObserverManager](/docs/manual/guides/components/managers/observermanager) see also: [NetworkObserver](/docs/manual/guides/components/network-observer)

_Both support multiple conditions_

NetworkIdentity

NetworkObject

Changing out components can be a tedious task. Save time by using Window -> Fish-Networking -> Upgrading -> From Mirror -> Replace Components. This will swap out most components for you.

Mirror and Fish-Networking must be within your project to run the operation mentioned. Afterwards you may remove Mirror.

**NetworkBehaviour property renames:**

Each IsServer, IsClient, etc option has two varieties: Initialized and Started.

Initialized means the object has been marked as ready for network use by the side (eg: client or server). Started means the client or server socket is connected, but does not mean the object has been initialized for network use yet.

When converting from Mirror you will most likely want to use Initialized.

Mirror

Fish-Networking

Notes

hasAuthority

IsOwner

_isLocalPlayer removed, use IsOwner instead._

isClient

IsClientInitialized

isClientOnly

IsClientOnlyInitialized

isServer

IsServerInitialized

isServerOnly

IsServerOnlyInitialized

connectionToClient

Owner

_Can be used on client._

connectionToServer

LocalConnection

netId

ObjectId

**NetworkBehaviour callbacks:** callbacks such as OnStartClient for the most part are the same in Fish-Networking. Some of the callbacks do provide additional information which is not available within Mirror's callbacks. There are also several new callbacks to use. For a complete guide on using Fish-Networking callbacks click [here](https://fish-networking.gitbook.io/docs/manual/guides/network-behaviour-guides#callbacks).

**Remote Procedure Call renames:** see [Remote Procedure Calls](/docs/manual/guides/remote-procedure-calls) for enhanced features and usage related to RPCs.

Mirror

Fish-Networking

Notes

\[Command\]

\[ServerRpc\]

\[TargetRpc\]

\[TargetRpc\]

_First parameter must be a NetworkConnection_

\[ClientRpc\]

\[ObserversRpc\]

RPCs within Fish-Networking has many advantages over Mirror; see [Remote Procedure Calls](/docs/manual/guides/remote-procedure-calls) for more information.

Mirror uses several singletons while Fish-Networking uses an anti-singleton design. There are still easy ways to access similar features. All of the same access can be returned from the NetworkObject component, as well by using [InstanceFinder](/docs/manual/guides/instancefinder-guides).

**Manager renames:** all of these may also be found within the NetworkManager.

Mirror

Fish-Networking

Notes

NetworkManager

NetworkManager

_Unchanged._

NetworkServer

ServerManager

NetworkClient

ClientManager

TransportManager

_Fish-Networking only._

TimeManager

_Fish-Networking only._

SceneManager

_Fish-Networking only._

**Switching from Mirror.NetworkManager:** the NetworkManager in Mirror features several overrides for state changes, such as when clients connect, disconnect, server start or stop, scene changes, and more.

Fish-Networking instead uses sealed managers with events. To mimic the NetworkManager of Mirror create a new MonoBehaviour and place it on your NetworkManager object. Instead of using overrides subscribe to your needed events from each appropriate Fish-Networking manager.

Copy

    //Mirror example.
    //Called when a remote client connects.
    public override OnServerConnect(NetworkConnectionToClient conn) {}
    
    //FishNet example.
    //Called when a remote client state changes.
    networkManager.ServerManager.OnRemoteConnectionState += YourCallback;

Mirror

Fish-Networking

ServerChangeScene

OnServerChangeScene

OnServerSceneChanged

ClientChangeScene

OnClientChangeScene

OnClientSceneChanged

SceneManager.OnLoadEnd

SceneManager.OnClientPresenceChangeEnd

See [SceneManager](/docs/manual/guides/scene-management) guide for more information.

OnServerReady

SceneManager.OnClientLoadedStartScenes

OnServerConnect

OnServerDisconnect

Servermanager.OnRemoteConnectionState

OnServerAddPlayer

OnClientNotReady

OnStartHost

OnStopHost

Not needed.

OnStartServer

OnStopServer

OnServerError

ServerManager.OnServerConnectionState

OnStartClient

OnStopClient

OnClientConnect

OnClientDisconnect

OnClientError

ClientManager.OnClientConnectionState


---

# Using Network Colliders Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# Using NetworkColliders

Using each NetworkCollider component is the same, and can be used very similar to Unity callbacks.

When using client-side prediction the NetworkCollider components are designed to accurately dispatch Enter, Stay, and Exit callbacks for collisions and triggers.

All events have the same name across each component: NetworkCollider, NetworkCollider2D, NetworkTrigger, and NetworkTrigger2D. What is returned in each event naturally will vary, depending on which component you use. For example, the NetworkCollision component will return _Collider_ for what was intersected, while NetworkCollision2D will return _Collider2D._

Our OnStay callback does not return _Collision_ as you would expect with the Unity version. Due to Unity limitations we are unable to provide a Collision callback without hotpath allocations.

If you require Collision to be returned please use the Unity OnStay callback instead; this will function properly with prediction.

## 


Callbacks

**OnEnter** is invoked when this collider has entered the bounds of another collider.

**OnStay** is invoked when this collider remains in contact with another.

**OnExit** is invoked when this collider has exited the bounds of another collider.

Keep in mind each callback description varies if you are using Collsion, Trigger, or their 2D counterparts. None-the-less, they behave just like Unity callbacks.

## 


Usage

This example script is placed on the player object. Our script demonstrates subscribing to all three events and using the `OnEnter` event to play a sound, as well applying forces to 'this' player.

Copy

    //We are assuming this script inherits NetworkBehaviour.
    [SerializeField]
    private AudioSource _hitSound;
    
    private NetworkCollision _networkCollision;
    
    private void Awake()
    {
        //Get the NetworkCollision component placed on this object.
        //You can place the component anywhere you would normally
        //use Unity collider callbacks!
        _networkCollision = GetComponent<NetworkCollision>();
        // Subscribe to the desired collision event
        _networkCollision.OnEnter += NetworkCollisionEnter;
        _networkCollision.OnStay += NetworkCollisionStay;
        _networkCollision.OnExit += NetworkCollisionExit;
    }
    
    private void OnDestroy()
    {
        //Since the NetworkCollider is placed on the same object as
        //this script we do not need to unsubscribe; the callbacks
        //will be destroyed with the object.
        //
        //But if your NetworkCollider resides on another object you
        //likely will want to unsubscribe to your events as well as shown.
        if (_networkCollision != null)
        {
            _networkCollision.OnEnter -= NetworkCollisionEnter;
            _networkCollision.OnStay -= NetworkCollisionStay;
            _networkCollision.OnExit -= NetworkCollisionExit;
        }
    }
    
    private void NetworkCollisionEnter(Collider other)
    {
        //Only play the sound effect when not currently reconciling.
        //If you were to play the sound also during reconcilations
        //the audio would execute each reconcile, each tick, until the
        //player was no longer reconciling into the collider.
        if (!base.PredictionManager.IsReconciling)
            _hitSound.Play();
            
        //Always apply velocity to this player on enter, even if reconciling.
        PlayerMover pm = GetComponent<PlayerMover>();
        //For this example we are pushing away from the other object.
        Vector3 dir = (transform.position - other.gameObject.transform).normalized;
        pm.PredictionRigidbody.AddForce(dir * 50f, ForceMode.Impulse);
    }
    
    private void NetworkCollisionStay(Collider other)
    {
        // Handle collision stay logic
    }
    
    private void NetworkCollisionExit(Collider other)
    {
        // Handle collision exit logic (e.g., deactivate visual effects)
    }

You may be wondering what is PredictionRigidbody and why did we apply forces to that instead of the Rigidbody directly. PredictionRigidbody(and 2D) is a mandatory but still simple way to apply forces to predicted rigidbodies. You can learn more about it's usage [here](/docs/manual/guides/prediction/predictionrigidbody).


---

# Using Ownership To Read Values Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Ownership](/docs/manual/guides/ownership)

# Using Ownership To Read Values

Learn how to store values for clients and read them on unlinked objects by reading owner information.

This guide requires Share Ids to be enabled on the ServerManager for clients to read values. Share Ids is enabled by default, and does not reveal any sensitive information to clients.

We are going to demonstrate how to assign a display name to each client, and display that name on player objects.

This guide assumes you already have a NetworkManager object in your scene.

## 


PlayerNames

First make a new script on an empty scene object and name it PlayerNames; this script needs to inherit NetworkBehaviour.

After adding the script to your scene object a NetworkObject component will automatically be added to the same object. On the NetworkObject enable 'Is Global', make this object a prefab, then delete it from your scene.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FejvQA8N0NO0svDf7WRzz%252Fimage.png%3Falt%3Dmedia%26token%3Df3202a88-a29a-4e84-83df-96f41e7889b2&width=768&dpr=4&quality=100&sign=b130723e&sv=2)

Notice that on the NetworkObject we also set the Initialize Order to -128. Doing so ensures that this NetworkObject will initialize before any other object does, which promises the OnStart callbacks will execute before other scripts. This step is most likely not needed, but given this is more-or-less a managing script for player names giving it execution priority is good practice.

We are now going to populate the PlayerNames script with the following code.

Copy

    using System;
    using FishNet.Connection;
    using FishNet.Object;
    using FishNet.Object.Synchronizing;
    using FishNet.Transporting;
    using Random = UnityEngine.Random;
    
    public class PlayerNames : NetworkBehaviour
    {
        /* Since this is a syncType it will automatically be synchronized to clients
         * whenever it updates, and when clients spawn this object! */
        
        /// <summary>
        /// Called when a player name is updated.
        /// </summary>
        public event Action<NetworkConnection, string> OnPlayerNameChanged;
        
        /// <summary>
        /// Names of all connected clients.
        /// </summary>
        public readonly SyncDictionary<NetworkConnection, string> Names = new();
    
        private void Awake()
        {
            Names.OnChange += NamesOnOnChange;
        }
    
        public override void OnStartNetwork()
        {
            //Register this to the NetworkManager so it can be found easily by any script!
            base.NetworkManager.RegisterInstance(this);
        }
    
        public override void OnStartServer()
        {
            base.ServerManager.OnRemoteConnectionState += ServerManagerOnOnRemoteConnectionState;
        }
    
        public override void OnStopServer() 
        {
            base.ServerManager.OnRemoteConnectionState -= ServerManagerOnOnRemoteConnectionState;
        }
    
        public override void OnStopNetwork()
        {
            //Unregister to clean up.
            if (base.NetworkManager != null)
                base.NetworkManager.UnregisterInstance<PlayerNames>();
        }
    
        private void ServerManagerOnOnRemoteConnectionState(NetworkConnection conn, RemoteConnectionStateArgs args)
        {
            //If disconnecting remove from the dictionary.
            if (args.ConnectionState == RemoteConnectionState.Stopped) 
            {
                Names.Remove(conn);
            }
            //If connecting then add.
            else if (args.ConnectionState == RemoteConnectionState.Started)
            {
                /* When a player connects assign them a random number
                 * as their name. */
                
                //Another cog in the machine.
                string randomName = Random.Range(1000, 999999).ToString();
                Names.Add(conn, randomName);
            }
        }
        
        /// <summary>
        /// Calls whenever the _names collection updates.
        /// </summary>
        private void NamesOnOnChange(SyncDictionaryOperation op, NetworkConnection key, string value, bool asserver)
        {
            //If an add or modify then invoke.
            if (op == SyncDictionaryOperation.Add || op == SyncDictionaryOperation.Set)
                OnPlayerNameChanged?.Invoke(key, value);
        }
        
        /// <summary>
        /// Allows a client to call this RPC, updating their name.
        /// </summary>
        [ServerRpc(RequireOwnership = false)]
        public void ServerSetName(string newName, NetworkConnection caller = null)
        {
            //Caller will never be null; the server will assign it automatically when a client calls this since RequireOwnership is false.
            // ReSharper disable once AssignNullToNotNullAttribute
            Names[caller] = newName;
        }
    }
    

The above code snippet will give players a random name when they connect, and allow clients to change their name by calling the SetName RPC.

## 


Automatically Spawning PlayerNames

After you have made the prefab select your scene NetworkManager, make a child object named ServerSpawner, and add the script ServerSpawner. You may place this script anywhere in your scene or game, but for simplicity sake we're going to nest it beneath the NetworkManager. After you add the script, insert your newly created PlayerNames prefab into the 'Network Objects' field and ensure Automatically Spawn is enabled.

![](https://fish-networking.gitbook.io/~gitbook/image?url=https%3A%2F%2F1328095063-files.gitbook.io%2F%7E%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252F-MheH2hMo3djr9VSyxTE%252Fuploads%252FoA9QWI4sah6ON9TbPoEH%252Fimage.png%3Falt%3Dmedia%26token%3D18926bbd-a1cf-477e-b539-0029911b3896&width=768&dpr=4&quality=100&sign=d89c3564&sv=2)

## 


Displaying Player Names

Next we are going to make a very simple script which changes the text value on a TextMeshPro component. This is a very simple example which might go on the players character. You could use similar scripts for chat names, and more.

Make a new script named CharacterName. Add the following:

Copy

    using FishNet.Connection;
    using FishNet.Object;
    using TMPro;
    using UnityEngine;
    
    public class CharacterName : NetworkBehaviour
    {
    
        /// <summary>
        /// Text box used to display the name of this character.
        /// </summary>
        [Tooltip("Text box used to display the name of this character.")]
        [SerializeField]
        private TextMeshProUGUI _text;
    
        //Cached value for unsubscribing to save a little perf.
        private PlayerNames _playerNames;
        
        public override void OnStartClient() 
        {
            //If owner is not set then do not get the name, as this does not belong to a client.
            if (!base.Owner.IsValid)
                return;
            
            //Get the PlayerNames instance to read this characters name(the player name).
            _playerNames = base.NetworkManager.GetInstance<PlayerNames>();
    
            //If cannot be found exit method; this shouldn't ever happen.
            if (!_playerNames.Names.TryGetValue(base.Owner, out string theName))
                return;
    
            _text.text = theName;
    
            //Also listen for updates for
            _playerNames.OnPlayerNameChanged += PlayerNamesOnOnPlayerNameChanged;
        }
        
        public override void OnStopClient() 
        {
            //Unsubscribe from events to clean up.
            if (_playerNames != null)
                _playerNames.OnPlayerNameChanged -= PlayerNamesOnOnPlayerNameChanged;
        }
        
        
        /// <summary>
        /// Called when a player name changes after initially being set, or when added for the first time.
        /// </summary>
        private void PlayerNamesOnOnPlayerNameChanged(NetworkConnection conn, string theName)
        {
            //If the name being changed is not for this owner then do not update anything.
            if (conn != base.Owner)
                return;
    
            //Set new name.
            _text.text = theName;
        }
    
    }

Now when an object spawns containing the script above, the \_text field will be updated to the owners player name. In addition, if the owner changes their name at any time, the text will be updated again.

Notice how we make use of NetworkManager.Register, Unregister, and GetInstance in this guide. This is a very useful feature for accessing global networked scripts.


---

# Using States In Code Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)
7.  [Creating Code](/docs/manual/guides/prediction/creating-code)
9.  [Understanding ReplicateState](/docs/manual/guides/prediction/creating-code/understanding-replicatestate)

# Using States In Code

Understanding how to use states will greatly improve your experience when writing code for your replicate method.

## 


Future States

You will see the term 'in the future' or 'future state' used frequently when working with prediction. When in the future it's not possible to know the data from the controller, which is why we call it the _future_. When using client-prediction, as a client you are always moving in real-time, before even knowing the servers current state. Due to this, you will not know other clients or server states until they are forwarded to you, and during that time of unknowing we consider the object to be in the future.

The future this is where you gain the opportunity to predict future input from the controller. Or, you can simply prevent future movement entirely; uses vary depending on your needs. We'll cover this more later on this page.

You will never be in the future on objects you controller, given you only replay inputs up to what you created and never beyond.

## 


The Created Flag

When a state is not created the data will be default. This often catches a lot of developers off guard as they might expect to see continual input from the controller, such as if the controller is always holding a movement key.

A common use case is updating the objects animator only when data is known.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {
        //Left/right movement.
        float horizontal = data.Horizontal;
        
        //Only update the animator if data is created. Do not update the animator
        //if not created as this will cause the animator to switch between having input
        //and a default value.
        if (state.ContainsCreated())
            _myAnimator.SetFloat("Horizontal", horizontal);
    }

If you are using State Order -> Inserted on the PredictionManager then Created will only ever be set on spectated objects during a reconcile. Since states on spectated obejcts are inserted into the replicate history they will run during reconciles rather than outside of reconciles. See the [PredictionManager guide](/docs/manual/guides/components/managers/predictionmanager) for more information on State Orders.

## 


Ticked

As mentioned before Ticked indicates the data has run outside a reconcile. Also described, the state can be Ticked as well Replayed, which means it ran outside a reconcile previously but is currently running again during a replay/reconcile.

Ticked and not replayed can often be used to perform one-time actions, such as showing visual effects, such as jumping. You probably wouldn't want to play jump audio when the jump first occurs, as well every time the input replays during a reconcile.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {
        if (data.Jump)
        {
            DoJump();
            //If ticked and not replayed then also play jump audio.
            if (state.ContainsTicked() && !state.ContainsReplayed())
                PlayJumpAudio();
        }
    }

## 


Preventing Future State Logic and Movement

The replayed state is most commonly used to predict the future, or limit as opposition, limit the future.

Limiting future velocities is where the replayed flag is typically used the most. This keeps the object out of future prediction, which can limit real-time reflection of the object, but also prevents excessive corrections or movement snapping.

Below is a pretty basic example showing jumping and moving, without going too into depth of move rates. On a spectated object without any future checks, during a replay the object will jump and then continue to snap upward as you replay into the future (beyond data you could possibly know due to latency).

This behavior can be difficult to explain, but is easy to see. Try our character controller prediction demo with and without an IsFuture check.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {
        //Exit the method early to prevent going into the future, which would
        //result in the controller snapping upward very fast when replaying a jump.
        if (state.IsFuture())
            return;
            
        //Set vertical velocity to jump up.
        if (data.Jump)
            _verticalVelocity = 10f;
    
        //Only add vertical movement for this example.
        //Realistically, you would have x and z movement as well.
        Vector3 movement = new(0f, _verticalVelocity, 0f);
        //Reduce vertical velocity to begin falling, but prevent it from going too low.
        _verticalVelocity -= (float)base.TimeManager.TickDelta;
        _verticalVelocity = Mathf.Max(_verticalVelocity, -5f);
    
        _characterController.Move(movement);
    }

The example above shows a very easy implementation of preventing future movement on a character controller, but rigidbodies are a little different. With rigidbodies, even if you exit the method early preventing additional added velocities, the rigidbody still carries existing velocities; this is because physics simulates with every tick, replayed or not, regardless of if replicate runs.

Here's an example **without** preventing future movement on a rigidbody.

The code below shows use of [PredictionRigidbody](/docs/manual/guides/prediction/predictionrigidbody). You do not need to understand how the component works to understand this example.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {       
        float horizontal = data.Horizontal;
    
        Vector3 movement = new(horizontal, 0f, 0f);
    
        _predictionRigidbody.AddVelocity(movement);
        _predictionRigidbody.Simulate();
        
        //Nothing in this code prevents the rigidbody from moving into the future.
    }

Preventing future movement on rigidbodies is a few more lines of code, but still pretty easy. We're going to use the RigidbodyPauser reference on the NetworkObject to pause the rigidbody when in the future. The RigidbodyPauser is a lesser known part of our NetworkObject [API](/docs/manual/api) and is used almost exclusively for prediction.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {   
        //Only the client would need to pause to prevent future movement,
        //and only on objects they do not own (objects they are spectating).
        bool canChangePause = !base.IsOwner && !base.IsServerStarted;
        //If in the future do not process any logic and pause the rigidbody.
        //If not in the future, then unpause the rigidbody.
        //There are no negative side-effects of calling pause or unpause when
        //when the RigidbodyPauser is already in the same state.
        if (state.IsFuture()
        {
            //This will prevent the rigidbody from moving by
            //making it kinematic. Pausing a rigidbody does also mean
            //objects can potentially pass through it. Another approach
            //will be shown in the next example.
            if (canChangePause)
                base.NetworkObject.RigidbodyPauser.Pause();
        }
        else
        {
            //When not future, unpause. This allows the object to move
            //again. Unpausing will restore velocities as they were
            //prior to pausing.
            if (canChangePause)
                base.NetworkObject.RigidbodyPauser.Unpause();
                
            float horizontal = data.Horizontal;
        
            Vector3 movement = new(horizontal, 0f, 0f);
        
            _predictionRigidbody.AddVelocity(movement);
            _predictionRigidbody.Simulate();
        }
    }

As explained in the example above pausing a rigidbody can cause objects to pass-through it; this is due to the pauser making the rigidbody kinematic.

Here's a different technique which instead simply zeros out velocities when in the future. In most cases this new code snippet is most ideal, but it's good to have an understanding that both are available.

Copy

    [Replicate]
    private void MovePlayer(ReplicateData data, ReplicateState state = ReplicateState.Invalid, Channel channel = Channel.Unreliable)
    {   
        //If in the future then simply zero out velocities
        //and exit the method to prevent checking any input logic.
        //Using this approach will allow objects to still collide with
        //the rigidbody.
        if (state.IsFuture())
        {
            _myPredictionRigidbody.Velocity(Vector3.Zero);
            _myPredictionRigidbody.AngularVelocity(Vector3.Zero);
            return;
        }
        
        float horizontal = data.Horizontal;
        
        Vector3 movement = new(horizontal, 0f, 0f);
        
        _predictionRigidbody.AddVelocity(movement);
        _predictionRigidbody.Simulate();
    }


---

# What Is Client Side Prediction Fish Net Networking Evolved

1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Prediction](/docs/manual/guides/prediction)

# What Is Client-Side Prediction

Client-Side Prediction allows clients to perform actions in real-time while maintaining server authority.

Client-side prediction is a technique used to move in real-time on clients, providing responsiveness actions, while also ensuring such actions cannot be cheated. From here out, we will refer to client-side prediction as CSP.

During your development you may also hear the term 'server authoritative movement'. CSP is a form of server authoritative movement, but they are not the same.

As mentioned CSP allows the client to move in real-time while also ensuring they cannot cheat. Some server authoritative movements will ensure the client cannot cheat, but does so by moving on the server only and relaying the results to clients. While both work, the latter of moving on the server and then relaying will result in the client to have a delay based on their latency.

Having such a delay would be unfair to those with higher latency, and could ruin the experience for players if your game is expected to have responsive movement. This is why having CSP built into Fish-Networking is so great!
