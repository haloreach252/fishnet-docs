1.  [Manual](/docs/manual)
3.  [Guides](/docs/manual/guides)
5.  [Components](/docs/manual/guides/components)
7.  [Prediction](/docs/manual/guides/components/prediction)

# OfflineRigidbody

When using predictions, especially physics prediction, the client will often re-simulate physics to make corrections. You generally want to add an OfflineRigidbody component to prevent non-networked objects from simulating multiple times during a correction.

## 


Component Settings

**Rigidbody Type** is to specify if the offline object uses a rigidbody3d, or 2d.

**Get In Children** should be enabled if you have child rigidbodies. Keeping this disabled when child rigidbodies are not present will save a very small amount of performance.

## 


Combining Smoothers

There is a fair chance you will want to have the graphical object on your rigidbodies smoothed between ticks. There are a variety of components to accomplish this; see them on the [Utilities](/docs/manual/guides/components/utilities) page.