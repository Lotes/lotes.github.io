---
layout: post
title: Growing BSP trees in Excel
---
Currently I have to fight with an idea of an Excel templating language. My goal is to provide features like variables, scopes, file inclusion, conditional templating and template loops.

The user of this language places the template commands similiar to PHP by writing `<# command...; #>` into a cell. There are two types of commands: the growing ones and the not growing ones.

The not growing type describes its content in one cell and generates content for only one cell. Example: <# CONCAT("Invoice ", name) #> would generate "Invoice XYZ", when name had the value "XYZ". One string, one cell.

IMAGE

The simplest growing command is <# INCLUDE("part.xlsx") #>. Imagine that "part.xslx" is an Excel with 3 rows and 2 columns. One cell becomes to six cells - eaaasy... but how would you insert the new columns and rows? Assuming that the content always expands to the right and down, there are 2 ways:

1. Expand rows, then columns.

  IMAGE + DESCRIPTION

2. Expand columns, then rows.

  IMAGE + DESCRIPTION

Two cases, big difference. The way the Excel sheet is splitted and expanded, brought me to the idea of a BSP tree, where the leaves (the single rooms of the whole space) can grow.

...