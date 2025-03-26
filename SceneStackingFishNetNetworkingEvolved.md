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