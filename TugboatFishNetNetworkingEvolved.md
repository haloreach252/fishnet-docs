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