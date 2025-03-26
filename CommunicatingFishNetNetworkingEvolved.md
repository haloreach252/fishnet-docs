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