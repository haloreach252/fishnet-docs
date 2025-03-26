1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)

# Automatic Serializers

Anytime you use a type within a [communication](/docs/manual/general/terminology/communicating) Fish-Networking automatically recognizes you wish to send the type over the network, and will create a serializer for it. You do not need to perform any extra steps for this process, but if you would like to exclude fields from being serialized use _\[System.NonSerialized\]_ above the field.

For example, _Name_ and _Level_ will be sent over the network but not _Victories_.

Copy

    public class PlayerStat
    {
        public string Name;
        public int Level;
        [System.NonSerialized]
        public int Victories;
    }
    
    [ServerRpc]
    public void RpcPlayerStats(PlayerStat stats){}

Fish-Networking is also capable of serializing inherited values. In the type _MonsterStat_ below, _Health, Name, and Level_ will automatically serialize.

Copy

    public class Stat
    {
        public float Health;
    }
    public class MonsterStat : Stat
    {
        public string Name;
        public int Level;
    }

In very rare cases a data type cannot be automatically serialized; a _Sprite_ is a good example of this. It would be very difficult and expensive to serialize the actual image data and send that over the network. Instead, you could store your sprites in a collection and send the collection index, or perhaps you could create a [custom serializer](/docs/manual/guides/custom-serializers-guides).