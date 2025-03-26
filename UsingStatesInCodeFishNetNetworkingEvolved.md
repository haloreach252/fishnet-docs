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