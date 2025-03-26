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