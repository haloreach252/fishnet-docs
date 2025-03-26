1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# InstanceFinder

There is a lot of useful information you can get from NetworkBehaviours but there may be some cases that your script does not inherit from NetworkBehaviour. This is where InstanceFinder can help you out.

InstanceFinder provides you quick access to commonly needed references or information. Some examples are: SceneManager, IsClient, TimeManager, and [more](https://firstgeargames.com/FishNet/api/api/FishNet.InstanceFinder.html#properties).

Copy

    public class MyButton : MonoBehaviour
    {
        public Image ButtonImage;
        
        /* It wouldn't make sense to update the UI
        * color on the server since it will have
        * no graphical interface. To save performance
        * we're only going to update color if client.
        * However, since this is a MonoBehaviour class
        * you do not have access to base.IsClient.
        * Instead the InstanceFinder may be used. */
        private void SetColor(Color c)
        {
            if (InstanceFinder.IsClientStarted)
                ButtonImage.color = c;
        }
    }