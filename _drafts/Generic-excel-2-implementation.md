---
layout: post
title: Generic Excel II - Implementation
---

In my previous article I described a data structure that shall enable me to
define Excel templates, that can grow arbitrarly in width and height.

IMAGE where cells are selected in the first frames, evaluated in a second phase, made bigger in the third phase and filled in the last phase.

In the animation above are shown four phases demonstrating the idea of generic Excel:

* parse the document for content, styles and commands
* evaluate commands, creating sub documents
* expand the cells with content bigger than the specified space
* fill the document with content, styles and sub documents

Step 3 is the tricky one, the rest is straight-forward. How shall the document grow? Where to move to existing content? The solution to me are binary partition tree where the leaves can grow by expanding the leaf and its surrounding nodes.

## Binary partition trees

A binary partition tree is a binary tree, where all nodes describe a partition of a space. Inner nodes define a hyperplane that divides the nodes space into two halfspaces (the two children of the current inner node). Leaves are the final partitions.

### Example

Let `Z`, the set of all whole numbers, be the space. The following tree divides this space first at zero and then at 100.

```
      0
     / \
     A  100
        / \
       B   C


A = (-inf, 0)
B = [0, 100)
C = [100,+inf)
```

For two or more dimensions you can switch the dimension axis after each cut.

## Let the tree grow!

Now imagine that the upper example want acquire more space for leaf B - say 20 units to the right. You will have to move C by 20 units and add 20 to the upper limit of B.

### Limitations