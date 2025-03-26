1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Custom Serializers](/docs/manual/guides/custom-serializers-guides)

# Interface Serializers

## 


General

Interfaces are very commonly used in most Unity Projects. Since Interfaces are not classes, even if the interface only uses serializable fields, a custom serializer is still needed in order for SyncTypes, and RPCs to serialize them properly over the network.

* * *

## 


Serializing the Interfaces Entire Class

In most cases you will want to interrogate an Interface as what its class type is, and serialize the entire types class over the network. This allows you to interrogate the interface later on the receiving client/server and have the data match what the sender has at the time it was sent as well.

If the Interface is a NetworkBehaviour you might as well send it as one because Serializing them over the network is only sending an ID for the receiving client to look up. Very Little network traffic, and you still get all of the data!

### 


Creating The Writer

Since Interfaces are not classes you must design the writer to be able to interrogate the class the Interface is, and serialize the class over the network. If an interface can be many types of classes, you will need to account for each class the Interface can be.

#### 


Example

Copy

    public static void WriteISomething(this Writer writer, ISomething som)
    {
        if(som is ClassA c1)
        {
            // 1 will be the identifer for the reader that this is a ClassA.
            writer.WriteByte(1); 
            writer.Write(c1);
        }
        else if(som is ClassB c2)
        {
            //2 will be the identifier for the reader that this is a ClassB.
            writer.WriteByte(2)
            writer.Write(c2);
        }
    }  

### 


Creating The Reader

When reading the interface, we have to read the byte that identifies what class the interface actually is first. Then use the reader to read that classes data. Finally casting it as the interface we need.

#### 


Example

Copy

    public static ISomething ReadISomething(this Reader reader)
    {   
        //Gets the byte of what class type we should be reading the next bit of data as.
        byte clsType = reader.ReadByte();
        
        //Remember we assigned 1 to be ClassA.
        if(clsType == 1)
            return reader.Read<ClassA>();
        //And 2 for ClassB.
        else if(clsType == 2)
            return reader.Read<ClassB>();
    
        //Fall through, unhandled. This would be bad.
        return default;
    }

* * *

## 


Serializing Only The Interfaces Properties

Sometimes you may only want to serialize just the Interface properties over the network, just keep in mind that if you cast it as the Type it actually is on the receiving client, the values of fields not apart of the interface will be their default values!

### 


Creating The Writer

You still will have to use an Identifier to send what class the Interface is, but we will not be sending the entire class over the network. Just the Interface Properties.

#### 


Example

Copy

    public interface ISomething
    {
        string Name;
        int Health;
        ushort Level;
    }

Copy

    public static void WriteISomething(this Writer writer, ISomething som)
    {
        //Defining a blank Class Type Indentifier
        byte clsType = 0; //Default
        
        if(som is CustomClass1 cc1)
            writer.WriteByte(1);    
        else if(som is CustomClass2 cc2)
            writer.WriteByte(2);
        //Fall through, indicating unknown type.
        else
            writer.WriteByte(0);
        
        //Remember the order the data is written, is the order it must be read.
        writer.WriteString(som.Name);
        writer.WriteInt32(som.Health);
        writer.WriteUInt16(som.Level);
    }

### 


Creating The Reader

When reading, we will get the class type from the identifier, create a new class, cast the class as the interface, and then assign the custom serialized values to the interface!

#### 


example

Copy

    public static ISomething ReadISomething(this Reader reader)
    {
        /* Getting the Class Type Indentifier.
         * Read all values first. to clear out the
         * reader. */
        byte clsType = reader.ReadByte();
        string name = reader.ReadString();
        int health = reader.ReadInt32();
        ushort level = reader.ReadUInt16();
        
        ISomething som = default;
        //Check to see what class the interface is
        if(clsType == 1)
            som = new CustomClass1();
        else if(clasType == 2)
            som = new CustomClass2();
        
        //Value was not set, so we cannot populate it.
        if(som == default(ISomething))
            return null;
        
        som.Name = name;
        som.Health = health;
        som.Level = level;
        
        return som;
    
    }