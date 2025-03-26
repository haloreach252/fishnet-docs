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