<---
layout: post
title: Generic Excel I - Data structure
---

<script type="text/javascript" src="{{"/assets/js/d3.v4.min.js"|absolute_url}}"></script>
<script type="text/javascript" src="{{"/assets/posts/growing-bsp-trees/script.js"|absolute_url}}"></script>

Currently I have to fight with an idea of an Excel templating language. My goal is to provide features like variables, scopes, file inclusion, conditional templating and template loops.

The user of this language places the template commands similiar to PHP by writing `<# command...; #>` into a cell. There are two types of commands: the growing ones and the not growing ones.

The not growing type describes its content in one cell and generates content for only one cell. Example: <# CONCAT("Invoice ", name) #> would generate "Invoice XYZ", when name had the value "XYZ". One string, one cell.

![Non-expanding content]({{"/assets/posts/growing-bsp-trees/non-expanding.PNG"|absolute_url}})

The simplest growing command is <# INCLUDE("part.xlsx") #>. Imagine that `part.xslx` is an Excel with 3 rows and 2 columns. One cell becomes to six cells - eaaasy... but how would you insert the new columns and rows? Assuming that the content always expands to the right and down, there are 2 ways:

1. Expand rows, then columns.

    First, divide the sheet horizontally between row 2 and 3 - fill in 2 new rows as requested. Then, take the upper sheet part and divide it between column B and C by filling in 1 fresh column. Note that the lower part of the sheet is not affected (Otherwise templating would become a mess...).

    Legend:

      * &epsilon; stands for new cells without content.
      * X stands for generated content.

![Expanding content bottom then right]({{"/assets/posts/growing-bsp-trees/expanding-bottom-right.PNG"|absolute_url}})



2. Expand columns, then rows.


![Expanding content, right then bottom]({{"/assets/posts/growing-bsp-trees/expanding-right-bottom.PNG"|absolute_url}})

Two cases, big difference. The way the Excel sheet is splitted and expanded, brought me to the idea of a BSP tree, where the leaves (the single rooms of the whole space) can grow.

The lesson learned in these cutting examples is, that I will expand the rows first, then the columns. The reason is, that the most reports, I know, are growing from top to the bottom and then left to the right (like someone is writing a book).

## The data structure

The structure is a binary space partition tree whose leaves can grow.

### Example

As example, let use the cut table from above and transform it to a BSP tree:

<div id="cut"></div>
<script type="text/javascript">
  var tree = new Tree();
  tree.MakeExpandable(new Range(2, 2, 3, 4));
  embedTree(tree, '#cut', 10, 10);
</script>

Legend:

* Prefix `H` stands for `horizontal node`. These nodes are black.
* Prefix `V` stands for `vertical node`. These nodes are white.
* Inner node are `cutters`. Their suffix describes a row (for horizontal nodes) or a column (for vertical nodes).
* Leaf nodes describe the Excel range that is defined in parenthesis.
* `+` stands for positive infinity and `-` for negative infinity.

### Operations

#### Use case
The user is confronted with following situation: He has an Excel template with several sheets. Each sheet has a set of cells with or without expanding template commands. The user can identify these cells. Now, he would like to build up the tree by *inserting expanding cells*. After filling the tree with these information, every cell commands have to be evaluated. This is the point where certain *cells get expanded*. After every expansion has fulfilled, the user wants *to query*, where every original cell has landed in the resulting state of a sheet (to copy styles and content).

So here are the public operations of the tree:

* `make_range_expandable(range): range_handle`
* `expand_range(range_handle, width, height)`
* `query_cell(address): (address, bool)`, where the bool says wether only the style has to be copied or also the content

#### Initial state and constraints

We are operating on a Excel sheet. So we can not expand to the left or to the top. Only to the right and to the bottom. So the structure is already filled with three nodes:

<div id="here"></div>
<script type="text/javascript">
  var tree = new Tree();
  embedTree(tree, '#here', 10, 10);
</script>

Take it as convention, that we always start the tree with these nodes. So, the first node we are addressing as **root will always be the node created through `H(A1:++)`**.

Another convention (actually it is a constraint) is, that the tree has to be build from top to bottom and from left to the right. So, `A1, B1, D1, B2, C3` is allowed and `A1, C3, B1` is forbidden.

### To be continued...

In the next posts I will show an implementation of this data structure...
