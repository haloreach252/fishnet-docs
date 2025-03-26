1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# Network Collider

The NetworkCollider components are a simple way to use Trigger and Collision callbacks with prediction.

Each component offers callbacks for OnEnter, OnStay, and OnExit, which work even during the prediction cycle. These components are needed because of a limitation in Unity's physics system that affects their OnCollisionEnter and OnCollisionExit methods, causing them to not always be executed.

Fun fact: Fish-Networking is the only framework which provides a solution for using Enter/Exit collider callbacks with prediction!

Due to the complexity of physics with prediction we currently only support these components on primitive shapes: box, cube, sphere, circle, etc.