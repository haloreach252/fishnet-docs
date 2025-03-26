1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)

# ColliderRollback

ColliderRollback allows an objects colliders to be rolled back for lag compensation.

Settings _are general settings related to ColliderRollback._[](#settings-are-general-settings-related-to-colliderrollback)

**Bounding Box** configures how a bounding box is added to the object. When set to Disabled a bounding box will not be added. Additional settings are displayed when not set to Disabled.

*   **Physics Type** is which type of physics you plan on rolling back, and determines if a Physics collider is added, or Physics2D collider.
    
*   **Bounding Box Size** determines how large of a bounding box to add. Typically a value three times larger than the world space of your object is sufficient. For example, if your object is a Vector3.one cube, this value would Vector3(3f, 3f, 3f). If an object is exceptionally fast moving consider making this larger.
    

**Collider Parents** are transforms you wish to send back in time when performing a rollback. For best results put your hitboxes on their own transform, which is a child of the object the hitbox is for. A setup example is provided as a demo within FishNet\\Demos\\ColliderRollback.