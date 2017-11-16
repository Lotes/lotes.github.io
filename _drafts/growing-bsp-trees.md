---
layout: post
title: Growing BSP trees in Excel
---
Currently I have to fight with an idea of an Excel templating language. My goal is to provide features like variables, scopes, file inclusion, conditional templating and template loops.

The user of this language places the template commands similiar to PHP by writing `<# command...; #>` into a cell. There are two types of commands: the growing ones and the not growing ones.

The not growing type describes its content in one cell and generates content for only one cell. Example: <# CONCAT("Invoice ", name) #> would generate "Invoice XYZ", when name had the value "XYZ". One string, one cell.

<table cellpadding="0" cellspacing="0" border="0">
<tr>
<td>

| |A|B|C|
|-|-|-|-|
|1| | | |
|2| |<# CON... #>| |
|3| | | |

</td>
<td>
&rarr;
</td>
<td>

| |A|B|C|
|-|-|-|-|
|1| | | |
|2| |Invoice XYZ| |
|3| | | |

</td>
</tr>
</table>


The simplest growing command is <# INCLUDE("part.xlsx") #>. Imagine that "part.xslx" is an Excel with 3 rows and 2 columns. One cell becomes to six cells - eaaasy... but how would you insert the new columns and rows? Assuming that the content always expands to the right and down, there are 2 ways:

1. Expand rows, then columns.

    First, divide the sheet horizontally between row 2 and 3 - fill in 2 new rows as requested. Then, take the upper sheet part and divide it between column B and C by filling in 1 fresh column. Note that the lower part of the sheet is not affected (Otherwise templating would become a mess...).

    Legend:

      * &epsilon; stands for new cells without content.
      * X stands for generated content.

    <table cellpadding="0" cellspacing="0" border="0">
    <tr>
    <td>

    | |A|B|C|D|
    |-|-|-|-|-|
    |1| | | | |
    |2| |<# INCLUDE... #>|C2| |
    |3| |B3|C3| |
    |4| | | | |
    |5| | | | |

    </td>
    <td>
    1. push rows to the bottom<br/>&rarr;
    </td>
    <td>

    | |A|B|C|D|
    |-|-|-|-|-|
    |1| | | | |
    |2| |X|C2| |
    |3|&epsilon;|X|&epsilon;|&epsilon;|
    |4|&epsilon;|X|&epsilon;|&epsilon;|
    |&#x2702;|&rArr;|&rArr;|&rArr;|&rArr;|
    |5| |B3|C3| |

    </td>
    <td>
    2. push columns to the right<br/>&rarr;
    </td>
    <td>

    | |A|B|C|&#x2702;|D|E|
    |-|-|-|-|-|-|-|
    |1| | |&epsilon;|&dArr;| | |
    |2| |X|X|&dArr;|C2||
    |3|&epsilon;|X|X|&dArr;|&epsilon;|&epsilon;|
    |4|&epsilon;|X|X|&dArr;|&epsilon;|&epsilon;|
    |&#x2702;|&rArr;|&rArr;|&rArr;|&rArr;|&rArr;|&rArr;|
    |5| |B3|C3| | | |

    </td>
    </tr>
    </table>




2. Expand columns, then rows.

    <table cellpadding="0" cellspacing="0" border="0">
    <tr>
    <td>

    | |A|B|C|D|
    |-|-|-|-|-|
    |1| | | | |
    |2| |<# INCLUDE... #>|C2| |
    |3| |B3|C3| |
    |4| | | | |
    |5| | | | |

    </td>
    <td>
    1. push columns to the right<br/>&rarr;
    </td>
    <td>

    | |A|B|C|&#x2702;|D|
    |-|-|-|-|-|-|
    |1| | |&epsilon;|&dArr;| |
    |2| |X|X|&dArr;|C2|
    |3| |B3|&epsilon;|&dArr;|C3|
    |4| | |&epsilon;|&dArr;| |
    |5| | |&epsilon;|&dArr;| |

    </td>
    <td>
    3. push rows to the bottom<br/>&rarr;
    </td>
    <td>

    | |A|B|C|&#x2702;|D|
    |-|-|-|-|-|-|
    |1| | |&epsilon;|&dArr;| |
    |2| |X|X|&dArr;|C2|
    |3|&epsilon;|X|X|&dArr;|C3|
    |4|&epsilon;|X|X|&dArr;| |
    |&#x2702;|&rArr;|&rArr;|&rArr;|&dArr;| |
    |5| |B3|&epsilon;|&dArr;| |

    </td>
    </tr>
    </table>

Two cases, big difference. The way the Excel sheet is splitted and expanded, brought me to the idea of a BSP tree, where the leaves (the single rooms of the whole space) can grow.

The lesson learned in these cutting examples is, that I will expand the rows first, then the columns. The reason is, that the most reports, I know, are growing from top to the bottom and then left to the right (like someone is writing a book).

## The data structure

The structure consists of four concrete classes: two for horizontal and two for vertical cuts of an Excel sheet. One is the inner node (the cut) and the other is the leaf (the used cells).

### Example

As example, let's use the cut table from above and transform it to a BSP tree:

<table cellpadding="0" cellspacing="0" border="0">
<tr>
<td>

| |A|B|C|&#x2702;|D|E|
|-|-|-|-|-|-|-|
|1| | |&epsilon;|&dArr;| | |
|2| |X|X|&dArr;|C2||
|3|&epsilon;|X|X|&dArr;|&epsilon;|&epsilon;|
|4|&epsilon;|X|X|&dArr;|&epsilon;|&epsilon;|
|&#x2702;|&rArr;|&rArr;|&rArr;|&rArr;|&rArr;|&rArr;|
|5| |B3|C3| | | |

</td>
<td>
&rarr;
</td>
<td>
![Cutting tree]({{"/assets/posts/growing-bsp-trees/cutting-tree.png" | absolute_url}})
</td>
</tr>
</table>

Legend:

* Prefix `H` stands for `horizontal node`. These nodes are black.
* Prefix `V` stands for `vertical node`. These nodes are white.
* Inner node are `cutters`. Their suffix describes a row (for horizontal nodes) or a column (for vertical nodes).
* Leaf nodes describe the Excel range that is defined in parenthesis. `A1:C4` selects 3 times 4 cells. `A5:__` selects everything under row 4 (`_` stands for infinity).

### Operations

#### Use case
The user is confronted with following situation: He has an Excel template with several sheets. Each sheet has a set of cells with or without expanding template commands. The user can identify these cells. Now, he would like to build up the tree by *annotating style and content information* and by *inserting expanding cells*. After filling the tree with the sheet information, every cell commands have to be evaluated. This is the point where certain *cells get expanded*. After every expansion has fulfilled, the user wants *to query*, where every original cell has landed in the resulting state of a sheet (to copy styles and content).

So here are the public operations of the tree:

* make_range_expandable(range): range_handle
* expand_range(handle, width, height)
* annotate_cell(address, annotation)
* get_cell(address): cell_information

#### Operation: make_range_expandable

```python
make_range_expandable(range): range_handle {
  if this is leaf:
    if range not in bbox:
      raise error
    endif
    replace this with (*1)
    return this.handle
  else:
    if range in child1.bbox:
      return child1.make_range_expandable(range)
    else if range in child2.bbox:
      return child2.make_range_expandable(range)
    else:
      raise error
    endif
  endif
}
```
*1) IMAGE

**Constraint**: Two cutting nodes MUST NEVER cross each other! (but one expander could be entirely in another one!)
