require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
const Range = require('./Range');
const CellAddress = require('./CellAddress');

class BoundingBox {
  constructor(leftInclusive, topInclusive, rightExclusive, bottomExclusive){
      if (leftInclusive > rightExclusive) throw new Error("Left limit must be less or equal to right limit.");
      if (topInclusive > bottomExclusive) throw new Error("Top limit must be less or equal to bottom limit.");
      this.Left = leftInclusive;
      this.Top = topInclusive;
      this.Right = rightExclusive;
      this.Bottom = bottomExclusive;
  }

  get IsEmpty() {
    return this.Left == this.Right || this.Top == this.Bottom;
  }

  get Width() {
    return this.Left === -Infinity || this.Left === Infinity || this.Right === Infinity || this.Right === -Infinity  ? Infinity : this.Right - this.Left;
  }

  get Height() {
    return this.Top === -Infinity || this.Top === Infinity || this.Bottom === -Infinity || this.Bottom === Infinity  ? Infinity : this.Bottom - this.Top;
  }

  Clone() {
    return new BoundingBox(this.Left, this.Top, this.Right, this.Bottom);
  }

  ContainsCellAddress(other) {
    if(!(other instanceof CellAddress))
      throw new Error('Only CellAddress is accepted!');
    return other.Column >= this.Left
        && other.Column < this.Right
        && other.Row >= this.Top
        && other.Row < this.Bottom;
  }

  ContainsRange(other) {
      if(!(other instanceof Range))
        throw new Error('Only Range is accepted!');
      return other.Left >= this.Left
          && other.Right < this.Right
          && other.Top >= this.Top
          && other.Bottom < this.Bottom;
  }

  SplitHorizontallyAt(lastRow){
      if (lastRow >= this.Top && lastRow <= this.Bottom)
      {
          return [
            new BoundingBox(this.Left, this.Top, this.Right, lastRow),
            new BoundingBox(this.Left, lastRow, this.Right, this.Bottom)
          ];
      }
      else
          throw new Error("The parameter has to lie between the top-bottom bounds.");
  }

  SplitVerticallyAt(lastColumn){
      if (lastColumn >= this.Left && lastColumn <= this.Right)
      {
        return [
          new BoundingBox(this.Left, this.Top, lastColumn, this.Bottom),
          new BoundingBox(lastColumn, this.Top, this.Right, this.Bottom)
        ];
      }
      else
      {
        throw new Error("The parameter has to lie between the left-right bounds.");
      }
  }

  ToString(){
      return "[" + this.Left + ";" + this.Top + "]:[" + this.Right + ";" + this.Bottom + "]";
  }
}

module.exports = BoundingBox;

},{"./CellAddress":2,"./Range":9}],2:[function(require,module,exports){
class CellAddress {
  constructor(column, row) {
    this.Column = column;
    this.Row = row;
  }
}

module.exports = CellAddress;

},{}],3:[function(require,module,exports){
const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';

class CellInfo {
    constructor(destinationAddress, sourceAddress, copyStyleOnly) {
      this.source = sourceAddress;
      this.destination = destinationAddress;
      this.styleOnly = copyStyleOnly;
    }

    get text() {
      return ALPHABET[this.source.Column]+this.source.Row+(this.styleOnly ? '*' : '');
    }
}

module.exports = CellInfo;

},{}],4:[function(require,module,exports){
const NodeType = require('./NodeType');
const Node = require('./Node');
const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CellInfo = require('./CellInfo');
const CellAddress = require('./CellAddress');

class CutNode extends Node {
  constructor(type, bbox, sliceAt, childA, childB) {
    super(type, bbox);
    this.SliceAt = sliceAt;
    this.Children = [childA, childB];
    childA.Parent = this;
    childB.Parent = this;
  }

  GetCellInfo(cellAddress) {
    //if(!this.BoundingBox.ContainsCellAddress(cellAddress))
      //throw new Error('Query is out of bounds!');
    if(this.NodeType === NodeType.Horizontal)
      return (cellAddress.Row < this.SliceAt ? this.Children[0] : this.Children[1]).GetCellInfo(cellAddress);
    else
      return (cellAddress.Column < this.SliceAt ? this.Children[0] : this.Children[1]).GetCellInfo(cellAddress);
  }

  MakeExpandable(range) {
    const self = this;
    var found = null;
    [0, 1].forEach(function(id) {
      if (found == null && self.Children[id].BoundingBox.ContainsRange(range)) {
        found = self.Children[id].MakeExpandable(range);
      }
    });
    if(found == null)
      throw new Error('ErrorMessage_NotInRange');
    return found;
  }

  get text() {
    return (this.NodeType === NodeType.Horizontal ? 'H'+this.SliceAt : 'V'+ALPHABET[this.SliceAt]);
  }

  OnParentRequestsResize(nodeType, deltaW, deltaH) {
    super.OnParentRequestsResize(nodeType, deltaW);
    this.Children[0].OnParentRequestsResize(nodeType, deltaW, deltaH);
    this.Children[1].OnParentRequestsResize(nodeType, deltaW, deltaH);
  }

  OnChildRequestsResize(sender, deltaW, deltaH) {
    if(this.Parent)
      this.Parent.OnChildRequestsResize(this, deltaW, deltaH);
    let neighbour;
    if(sender === this.Children[0]) {
      neighbour = this.Children[1];
      if(this.NodeType === NodeType.Horizontal) {
        this.SliceAt += deltaH;
        this.BoundingBox.Right += deltaW;
        neighbour.BoundingBox.Top += deltaH;
        neighbour.BoundingBox.Bottom += deltaH;
      } else {
        this.SliceAt += deltaW;
        this.BoundingBox.Bottom += deltaH;
        neighbour.BoundingBox.Left += deltaW;
        neighbour.BoundingBox.Right += deltaW;
      }
    } else {
      neighbour = this.Children[0];
      if(this.NodeType === NodeType.Horizontal) {
        this.BoundingBox.Right += deltaW;
        this.BoundingBox.Bottom += deltaH;
      } else {
        this.BoundingBox.Bottom += deltaH;
        this.BoundingBox.Right += deltaW;
      }
    }
    neighbour.OnParentRequestsResize(this.NodeType, deltaW, deltaH);
  }
}

module.exports = CutNode;

},{"./CellAddress":2,"./CellInfo":3,"./Node":7,"./NodeType":8}],5:[function(require,module,exports){
const Tree = require('./Tree');
const NodeType = require('./NodeType');
const CutNode = require('./CutNode');
const LeafNode = require('./LeafNode');
const BoundingBox = require('./BoundingBox');
const Range = require('./Range');
const CellAddress = require('./CellAddress');

const SCALE_FACTOR = 20;
const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';

const Direction = { //N+2=S, E+2=W
  North: 0,
  South: 2,
  East: 1,
  West: 3,
  goLeft: function(dir) { return (dir-1)%4; },
  goRight: function(dir) { return (dir+1)%4; },
  isLeftFrom: function(me, other) { return Direction.goLeft(me) === other; },
  isRightFrom: function(me, other) { return Direction.goRight(me) === other; },
};

class GridView {
  constructor() {}

  RenderTo(selector, tree, boundingBox) {
    this.GlobalBoundingBox = boundingBox || new BoundingBox(0, 0, 20, 20);
    const node2Svg = new Map();
    let w = this.GlobalBoundingBox.Right * SCALE_FACTOR;
    let h = this.GlobalBoundingBox.Bottom * SCALE_FACTOR;
    this.svg = d3.select(selector)
      .append('svg')
      .attr('width', w)
      .attr('height', h)
        .append('g');
    this.RenderGrid(w, h);
    this.RenderCells(tree.root);
    this.RenderTree(node2Svg, tree.root, Direction.East);
    return node2Svg;
  }

  TransformPoint(pt) {
    return [(pt[0] < this.GlobalBoundingBox.Left ? this.GlobalBoundingBox.Left : pt[0] > this.GlobalBoundingBox.Right ? this.GlobalBoundingBox.Right : pt[0]),
           (pt[1] < this.GlobalBoundingBox.Top ? this.GlobalBoundingBox.Top : pt[1] > this.GlobalBoundingBox.Bottom ? this.GlobalBoundingBox.Bottom : pt[1])];
  }

  RenderGrid(w, h) {
    for(var ww = 0, index = 0; ww<w; ww+=SCALE_FACTOR, index++) {
      this.svg.append('text')
        .attr('x', ww+4 )
        .attr('y', 12)
        .attr('fill', 'black')
        .text(ALPHABET[index]);
      this.svg.append('line')
        .attr('x1', ww)
        .attr('x2', ww)
        .attr('y1', 0)
        .attr('y2', h)
        .attr('stroke', 'gray');
    }

    for(var hh = 0, index = 0; hh<h; hh+=SCALE_FACTOR, index++) {
      if(index > 0)
        this.svg.append('text')
          .attr('x', 6 )
          .attr('y', hh+16)
          .attr('fill', 'black')
          .text(index);
      this.svg.append('line')
        .attr('x1', 0)
        .attr('x2', w)
        .attr('y1', hh)
        .attr('y2', hh)
        .attr('stroke', 'silver');
    }
  }

  RenderCells(root) {
    for(var row = 1; row < this.GlobalBoundingBox.Bottom; row++) {
      for(var column = 1; column < this.GlobalBoundingBox.Right; column++) {
        const info = root.GetCellInfo(new CellAddress(column, row));
        this.svg.append('text')
          .attr('x', column * SCALE_FACTOR + 4)
          .attr('y', (1+row) * SCALE_FACTOR - 4)
          .style('fill', 'gray')
          .style('font-size', '8px')
          .text(info.text);
      }
    }
  }

  Arrow(a, dir, length) {
    var b, x, y, rotation;
    switch(dir) {
      case Direction.North:
        x = (a[0]);
        y = length === Infinity ? -Infinity : (a[1])-(length);
        rotation = 180;
        break;
      case Direction.South:
        x = (a[0]);
        y = length === Infinity ? Infinity : (a[1])+(length);
        rotation = 0;
        break;
      case Direction.East:
        x = length === Infinity ? Infinity : (a[0])+(length);
        y = (a[1]);
        rotation = 270;
        break;
      case Direction.West:
        x = length === Infinity ? -Infinity : (a[0])-(length);
        y = (a[1]);
        rotation = 90;
        break;
    }
    b = this.TransformPoint([x, y]);
    a = this.TransformPoint(a);
    b[0] *= SCALE_FACTOR;
    b[1] *= SCALE_FACTOR;
    a[0] *= SCALE_FACTOR;
    a[1] *= SCALE_FACTOR;
    return this.svg.append('line')
      .style('stroke-dasharray', '6, 6')
      .style('stroke-width', '3px')
      .style('stroke', 'black')
      .attr('x1', a[0])
      .attr('x2', b[0])
      .attr('y1', a[1])
      .attr('y2', b[1])
      ;
  }

  RenderTree(node2Svg, node, direction) {
    if(node instanceof LeafNode) {
      const pt = this.TransformPoint([node.BoundingBox.Left, node.BoundingBox.Top]);
      const width = (node.BoundingBox.Width === Infinity ? -pt[0] + this.GlobalBoundingBox.Right : node.BoundingBox.Width) * SCALE_FACTOR;
      const height = (node.BoundingBox.Height === Infinity ? -pt[1] + this.GlobalBoundingBox.Bottom : node.BoundingBox.Height) * SCALE_FACTOR;
      if(node.BoundingBox.Left === -Infinity || node.BoundingBox.Top === -Infinity)
        return;
      let svgNode = this.svg.append('rect')
        .attr('fill', 'rgba(180,180,180,0.05)')
        .attr('x', pt[0]*SCALE_FACTOR)
        .attr('y', pt[1]*SCALE_FACTOR)
        .attr('width', width)
        .attr('height', height);
      node2Svg.set(node, svgNode);
    } else {
      this.RenderTree(node2Svg, node.Children[0], node.NodeType === NodeType.Horizontal ? Direction.North : Direction.West);
      this.RenderTree(node2Svg, node.Children[1], node.NodeType === NodeType.Horizontal ? Direction.South : Direction.East);

      var a;
      if(node.NodeType === NodeType.Vertical) {
  	    a = [node.SliceAt, direction === Direction.North ? node.BoundingBox.Bottom : node.BoundingBox.Top];
        let svgNode = this.Arrow(a, direction, node.BoundingBox.Height);
        node2Svg.set(node, svgNode);
      } else {
  	    a = [direction === Direction.West ? node.BoundingBox.Right : node.BoundingBox.Left, node.SliceAt]
        let svgNode = this.Arrow(a, direction, node.BoundingBox.Width);
        node2Svg.set(node, svgNode);
      }
    }
  }
}

module.exports = GridView;

},{"./BoundingBox":1,"./CellAddress":2,"./CutNode":4,"./LeafNode":6,"./NodeType":8,"./Range":9,"./Tree":10}],6:[function(require,module,exports){
const CutNode = require('./CutNode');
const Node = require('./Node');
const NodeType = require('./NodeType');
const CellAddress = require('./CellAddress');
const CellInfo = require('./CellInfo');

class LeafNode extends Node {
  constructor(type, bbox, isExpandable) {
    super(type, bbox);
    this.OriginalBBox = bbox.Clone();
    this.IsExpandable = isExpandable;
  }

  GetCellInfo(cellAddress) {
    if(!this.BoundingBox.ContainsCellAddress(cellAddress))
      throw new Error('Query is out of bounds!');
    let column = cellAddress.Column - this.BoundingBox.Left + this.OriginalBBox.Left;
    let row = cellAddress.Row - this.BoundingBox.Top + this.OriginalBBox.Top;
    const styleOnly = column >= this.OriginalBBox.Right || row >= this.OriginalBBox.Bottom;
    if(styleOnly) {
      if(column >= this.OriginalBBox.Right)
        column = this.OriginalBBox.Right - 1;
      if(row >= this.OriginalBBox.Bottom)
        row = this.OriginalBBox.Bottom - 1;
    }
    return new CellInfo(cellAddress, new CellAddress(column, row), styleOnly);
  }

  ExpandTo(width, height) {
    if (!this.IsExpandable) throw new Error("Not allowed, because not expandable!");
    if (width < 0) throw new Error("Width must not be negative!");
    if (height < 0) throw new Error("Height must not be negative!");

    var deltaW = width - this.BoundingBox.Width;
    var deltaH = height - this.BoundingBox.Height;
    if (deltaW < 0 || deltaH < 0) throw new Error("You can only enlarge a leaf node!");

    this.Parent.OnChildRequestsResize(this, deltaW, deltaH);
    this.BoundingBox.Right += deltaW;
    this.BoundingBox.Bottom += deltaH;
  }

  SliceRange(parentNodeType, parentBBox, sliceAts) {
    if(sliceAts.length <= 0)
      throw new Error('At least one slice is required!');
    let currentSlice = sliceAts[0].slice;
    let currentFlag = sliceAts[0].flag;
    sliceAts = sliceAts.slice(1);

    //slice space
    let lhsBBox, rhsBBox, lhs, rhs;
    if(parentNodeType === NodeType.Vertical)
      [lhsBBox, rhsBBox] = parentBBox.SplitVerticallyAt(currentSlice);
    else
      [lhsBBox, rhsBBox] = parentBBox.SplitHorizontallyAt(currentSlice);

    //create children
    let result;
    if(sliceAts.length === 0) {
      lhs = new LeafNode(1-parentNodeType, lhsBBox, currentFlag);
      rhs = new LeafNode(1-parentNodeType, rhsBBox, !currentFlag);
      result = currentFlag ? lhs : rhs;
    } else {
      if(currentFlag) {
        [lhs, result] = this.SliceRange(1-parentNodeType, lhsBBox, sliceAts);
        rhs = new LeafNode(1-parentNodeType, rhsBBox, false);
      } else {
        lhs =  new LeafNode(1-parentNodeType, lhsBBox, false);
        [rhs, result] = this.SliceRange(1-parentNodeType, rhsBBox, sliceAts);
      }
    }

    return [new CutNode(parentNodeType, parentBBox, currentSlice, lhs, rhs), result];
  }

  MakeExpandable(range) {
      if (this.IsExpandable)
          throw new Error('I already am an expander!');

      var result = null;
      var replacement;
      if (this.NodeType == NodeType.Vertical)
        [replacement, result] = this.SliceRange(this.NodeType, this.BoundingBox, [
          { slice: this.BoundingBox.Left, flag: false},
          { slice: range.Bottom + 1, flag: true},
          { slice: range.Right + 1, flag: true},
          { slice: range.Top, flag: false},
          { slice: range.Left, flag: false},
        ]);
      else
        [replacement, result] = this.SliceRange(this.NodeType, this.BoundingBox, [
          { slice: range.Bottom + 1, flag: true},
          { slice: range.Right + 1, flag: true},
          { slice: range.Top, flag: false},
          { slice: range.Left, flag: false}
        ]);

      replacement.Parent = this.Parent;
      if(this.Parent != null)
          [0, 1].forEach(id =>
          {
              var siblings = this.Parent.Children;
              if (siblings[id] == this)
                  siblings[id] = replacement;
          })
      this.Parent = null;
      return result;
  }
}

module.exports = LeafNode;

},{"./CellAddress":2,"./CellInfo":3,"./CutNode":4,"./Node":7,"./NodeType":8}],7:[function(require,module,exports){
const NodeType = require('./NodeType');
const ALPHABET = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CellAddress = require('./CellAddress');

class Node {
  constructor(type, bbox) {
    this.NodeType = type;
    this.BoundingBox = bbox;
    this.Parent = null;
  }

  GetCellInfo(cellAddress) {
    throw new Error('Implement me for sub classes!');
  }

  OnParentRequestsResize(nodeType, deltaW, deltaH) {
    if(this.Parent.NodeType !== nodeType)
      return;
    if(this.NodeType === NodeType.Horizontal) {
      this.BoundingBox.Bottom += deltaH;
    } else {
      this.BoundingBox.Right += deltaW;
    }
  }

  get text() {
    function ts(num) {
      if(num === Infinity)
        return '+';
      if(num === -Infinity)
        return '-';
      return num.toString();
    }
    function ts2(num) {
      if(num === Infinity)
        return '+';
      if(num === -Infinity)
        return '-';
      return ALPHABET[num];
    }
    const prefix = this.NodeType === NodeType.Vertical ? 'V' : 'H';
    const left = ts2(this.BoundingBox.Left);
    const top = ts(this.BoundingBox.Top);
    const right = ts2(this.BoundingBox.Right);
    const bottom = ts(this.BoundingBox.Bottom);
    return prefix + '('+left+top+':'+right+bottom+')';
  }
}

module.exports = Node;

},{"./CellAddress":2,"./NodeType":8}],8:[function(require,module,exports){
const NodeType = {
  Horizontal: 0,
  Vertical: 1
};

module.exports = NodeType;

},{}],9:[function(require,module,exports){
class Range {
  constructor(left, top, right, bottom) {
      if (left > right) throw new Error("Left limit must be less or equal to right limit.");
      if (top > bottom) throw new Error("Top limit must be less or equal to bottom limit.");
      this.Left = left;
      this.Top = top;
      this.Bottom = bottom;
      this.Right = right;
  }
  get Width() { return this.Right-this.Left+1; }
  get Height() { return this.Bottom-this.Top+1; }
}

module.exports = Range;

},{}],10:[function(require,module,exports){
const BoundingBox = require('./BoundingBox');
const CutNode = require('./CutNode');
const LeafNode = require('./LeafNode');
const NodeType = require('./NodeType');

class Tree {
  constructor() {
      const atRow = 1;
      const atColumn = 1;
      var leftRange, topRange, rightRange, bottomRange;
      var everything = new BoundingBox(-Infinity,-Infinity,+Infinity,+Infinity);
      var [topRange, bottomRange] = everything.SplitHorizontallyAt(atRow);
      var [leftRange, rightRange] = bottomRange.SplitVerticallyAt(atColumn);
      var leftChild = new LeafNode(NodeType.Horizontal, leftRange, false);
      var rightChild = new LeafNode(NodeType.Horizontal, rightRange, false);
      var bottomNode = new CutNode(NodeType.Vertical, bottomRange, atColumn, leftChild, rightChild);
      var topChild = new LeafNode(NodeType.Vertical, topRange, false);
      this.root = new CutNode(NodeType.Horizontal, everything, atRow, topChild, bottomNode);
  }

  MakeExpandable(range) {
      return this.root.MakeExpandable(range);
  }

  Print() {
      this.root.Print();
  }
}

module.exports = Tree;

},{"./BoundingBox":1,"./CutNode":4,"./LeafNode":6,"./NodeType":8}],11:[function(require,module,exports){
const Tree = require('./Tree');
const NodeType = require('./NodeType');
const CutNode = require('./CutNode');
const LeafNode = require('./LeafNode');
const BoundingBox = require('./BoundingBox');
const Range = require('./Range');

const LAYER_HEIGHT = 40;

class TreeView {
  RenderTo(selector, tree) {
    const node2Svg = new Map();
    let w = 1000;
    let h = 400;
    var viewPort = d3.select(selector)
      .append('svg');
    this.svg = viewPort
      .attr('width', w)
      .attr('height', h)
      .append('g');
    this.left = 0;
    this.height = 0;
    this.RenderNode(node2Svg, tree.root, 0);
    viewPort.attr('width', this.left+10);
    viewPort.attr('height', this.height);
    return node2Svg;
  }

  RenderNode(node2Svg, node, depth) {
    if(node instanceof CutNode) {
      var lhs = this.left;
      let [middle, h] = this.RenderNode(node2Svg, node.Children[0], depth+1);
      var rhs = this.left;
      this.svg.append('line')
        .attr('x1', rhs)
        .attr('y1', (depth)*LAYER_HEIGHT+h)
        .attr('x2', middle)
        .attr('y2', (depth+1)*LAYER_HEIGHT)
        .style('stroke', 'black')
        ;
    }

    const text = node.text;
    const type = node.NodeType;
    let g = this.svg.append('g');
    let textNode = g.append('text')
      .attr('text-anchor', 'left')
      .attr('x', 0)
      .attr('y', 0)
      .attr('fill', type === NodeType.Horizontal ? 'white' : 'black')
      .text(text);
    let bbox = textNode.node().getBBox();
    textNode.attr('y', -bbox.y).attr('font-size', 11);
    g.attr('transform', 'translate('+(this.left+3)+','+(depth*LAYER_HEIGHT)+')');
    this.height = Math.max(this.height, (depth+1)*LAYER_HEIGHT);
    g.insert('rect', 'text')
      .attr('x', -2)
      .attr('y', 2)
      .attr('width', bbox.width)
      .attr('height', bbox.height)
      .style('fill', type !== NodeType.Horizontal ? 'white' : 'black')
      .style('stroke', type === NodeType.Horizontal ? 'white' : 'black');
    let svgNode = g.append('rect')
      .attr('x', -2)
      .attr('y', 2)
      .attr('width', bbox.width)
      .attr('height', bbox.height)
      .attr('fill', 'rgba(0,0,0,0.01)')
      .attr('stroke', 'rgba(0,0,0,0.01)')
      ;
    node2Svg.set(node, svgNode);
    let middle = this.left + bbox.width/2;
    this.left += bbox.width;

    if(node instanceof CutNode) {
      var lhs = this.left;
      let [middle, h] = this.RenderNode(node2Svg, node.Children[1], depth+1);
      var rhs = this.left;
      this.svg.append('line')
        .attr('x1', lhs)
        .attr('y1', (depth)*LAYER_HEIGHT+h)
        .attr('x2', middle)
        .attr('y2', (depth+1)*LAYER_HEIGHT)
        .style('stroke', 'black')
        ;
    }

    return [middle, bbox.height];
  }
}

module.exports = TreeView;

},{"./BoundingBox":1,"./CutNode":4,"./LeafNode":6,"./NodeType":8,"./Range":9,"./Tree":10}],12:[function(require,module,exports){
const Tree = require('./Tree');
const Range = require('./Range');
const GridView = require('./GridView');
const TreeView = require('./TreeView');
const LeafNode = require('./LeafNode');
const BoundingBox = require('./BoundingBox');


function installMouse(views) {
  views.forEach(view => {
    for (var [key, value] of view) {
      value.on('mouseenter', (x => (function() {
        enableNode(views, x);
      }))(key))
      value.on('mouseleave', (x => (function() {
        disableNode(views, x);
      }))(key))
    }
  });
}

function enableNode(views, node) {
  views.forEach(view => {
    try{
      view.get(node).style(node instanceof LeafNode ? 'fill' : 'stroke', node instanceof LeafNode ? 'rgba(255,0,0,0.3)' : 'red');
    } catch(e) {}
  });
}

function disableNode(views, node) {
  views.forEach(view => {
    try{
      view.get(node).style(node instanceof LeafNode ? 'fill' : 'stroke', node instanceof LeafNode ? 'rgba(180,180,180,0.1)' : 'black');
    } catch(e) {}
  });
}

function onLoad(load) {
	if(window.addEventListener){
	  window.addEventListener('load', load);
	}else{
	  window.attachEvent('onload', load);
	}
}

function htmlDecode(input){
  var e = document.createElement('div');
  e.innerHTML = input;
  // handle case of empty input
  return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

var id = 0;
window.Tree = Tree;
window.Range = Range;
window.embedTree = function(tree, selector, w, h) {
  onLoad(() => {
    const tableRow = d3.select(selector).append('table').append('tr');

    const id1 = 'bsp'+(id++);
    tableRow.append('td').attr('id', id1);
    const gridView = new GridView();
    const view1 = gridView.RenderTo('#'+id1, tree, new BoundingBox(0, 0, w, h));

    tableRow.append('td').text(htmlDecode('&rarr;'));

    const id2 = 'bsp'+(id++);
    tableRow.append('td').attr('id', id2);
    const treeView = new TreeView();
    const view2 = treeView.RenderTo('#'+id2, tree);

    installMouse([view1, view2]);
  });
}

},{"./BoundingBox":1,"./GridView":5,"./LeafNode":6,"./Range":9,"./Tree":10,"./TreeView":11}]},{},[1,2,3,4,5,6,12,7,8,9,10,11]);
