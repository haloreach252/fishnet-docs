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