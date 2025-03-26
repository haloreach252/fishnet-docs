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