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