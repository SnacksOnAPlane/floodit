var HEIGHT = 12;
var WIDTH = 12;
var COLORS = ["red","green","blue","yellow","pink","purple"];

function drawMarking(x,y,c) {
  var canvas = $("canvas")[0];
  var ctx = canvas.getContext("2d");
  var squareWidth = canvas.width / board.length;
  var squareHeight = canvas.height / board[0].length;
  ctx.fillStyle = "black";
  ctx.fillText(c,x*squareWidth,(y+1)*squareHeight);
}

function Point(x,y) {
  this.x = x;
  this.y = y;
  this.toString = function() {
    return x+","+y;
  }
  this.distanceFrom = function(p2) {
    assert(p2 instanceof Point);
    return Math.abs(p2.x-this.x) + Math.abs(p2.y-this.y);
  }
  this.mark = function(c) {
    var pt = this;
    setTimeout(function() {
        drawMarking(pt.x,pt.y,c);
        }, 100);
  }
}

function PointsList() {
  var _list = {};
  var _size = 0;
  this.add = function(pt) {
    assert(pt instanceof Point);
    _list[pt.toString()] = pt;
    _size += 1;
  };
  this.addList = function(ptlist) {
    assert(ptlist instanceof PointsList);
    for (pt in ptlist.list) {
      this.add(ptlist.list[pt]);
    }
  }
  this.contains = function(pt) {
    assert(pt instanceof Point);
    return pt.toString() in _list;
  }
  this.size = function() {
    return _size;
  }
  this.mark = function(c) {
    for (i in _list) {
      _list[i].mark(c);
    }
  }
  this.list = _list;
}

function Blob(points) {
  assert(points instanceof PointsList);
  assert(points.size() > 0);
  this.points = points;
  this.size = this.points.size();
  this.mark = this.points.mark;
  this.toString = function() {
    return "Blob (" + this.size + "): " + this.points.list;
  }
}

function BlobPoint(blob, point) {
  this.blob = blob;
  this.point = point;
}

var ORIGIN = new Point(0,0);

function getRandomColor() {
  return Math.floor(Math.random() * COLORS.length);
}

function createBoard() {
  var board = [];
  for (var x=0; x<WIDTH; x++) {
    var row = [];
    for (var y=0; y<HEIGHT; y++) {
      row[y] = getRandomColor();
    }
    board[x] = row;
  }
  return board;
}

function copyBoard(srcBoard) {
  return $.extend(true, [], srcBoard);
}

function displayBoard() {
  var canvas = $("canvas")[0];
  var ctx = canvas.getContext("2d");
  var squareWidth = canvas.width / board.length;
  var squareHeight = canvas.height / board[0].length;
  for (var x=0; x<board.length; x++) {
    var row = board[x];
    for (var y=0; y<row.length; y++) {
      if (row[y] == -1) {
        ctx.fillStyle = "white";
      } else {
        ctx.fillStyle = COLORS[row[y]];
      }
      ctx.fillRect(x*squareWidth, y*squareHeight, (x+1)*squareWidth, (y+1)*squareHeight);
    }
  }
}

function flood(x,y,oldColor,newColor) {
  if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) {
    return;
  }
  if (board[x][y] == oldColor) {
    board[x][y] = newColor;
    flood(x-1,y,oldColor,newColor);
    flood(x+1,y,oldColor,newColor);
    flood(x,y+1,oldColor,newColor);
    flood(x,y-1,oldColor,newColor);
  }
}

function fill(num) {
  console.log("fill(" + num + ")");
  if (board[0][0] == num) {
    return;
  }
  var moves = $("#moves");
  moves.text(parseInt(moves.text()) + 1);
  lastBoards.push(copyBoard(board));
  flood(0,0,board[0][0],num);
  displayBoard();
}

function inOrder() {
  var next = board[0][0] + 1;
  if (next >= COLORS.length) {
    next = 0;
  }
  return next;
}

function won() {
  var fillColor = board[0][0];
  for (var x=0; x<WIDTH; x++) {
    for (var y=0; y<HEIGHT; y++) {
      if (board[x][y] != fillColor) {
        return false;
      }
    }
  }
  return true;
}

function newFilledArray(length, val) {
    var array = [];
    for (var i = 0; i < length; i++) {
        array[i] = val;
    }
    return array;
}

function playStrategy(strategy) {
  if (!won()) {
    var playNext = strategy();
    if (playNext == -1) {
      return;
    }
    fill(playNext);
    if ($("input[value='oneper']").is(":checked")) {
      return;
    }
    ai = setTimeout(function() { playStrategy(strategy); }, 100);
  }
}

random = getRandomColor;

function maxIndex(arr) {
  var maxVal = 0;
  var maxIdx = 0;
  for (i in arr) {
    var val = arr[i];
    if (val > maxVal) {
      maxVal = val;
      maxIdx = i;
    }
  }
  return maxIdx;
}

function getFilledCoordinates(startPoint) {
  assert(startPoint instanceof Point);
  var color = board[startPoint.x][startPoint.y];
  var coords = new PointsList();
  var tried = new PointsList();
  function mapper(point) {
    var x = point.x;
    var y = point.y;
    if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) {
      return;
    }
    if (tried.contains(point)) {
      return;
    }
    tried.add(point);
    if (board[x][y] == color) {
      coords.add(point);
    } else {
      return;
    }
    mapper(new Point(x-1,y));
    mapper(new Point(x+1,y));
    mapper(new Point(x,y+1));
    mapper(new Point(x,y-1));
  }
  mapper(startPoint);
  assert(coords.size() > 0);
  return coords;
}

/*
 * Given a point, returns a pointslist of its edge coordinates
 */
function getEdgeCoordinates(startPoint) {
  assert(startPoint instanceof Point);
  var color = board[startPoint.x][startPoint.y];
  var coords = new PointsList();
  var tried = new PointsList();
  function mapper(point) {
    var x = point.x;
    var y = point.y;
    if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) {
      return;
    }
    if (tried.contains(point)) {
      return;
    }
    tried.add(point);
    if (board[x][y] != color) {
      coords.add(point);
      return;
    }
    mapper(new Point(x-1,y));
    mapper(new Point(x+1,y));
    mapper(new Point(x,y+1));
    mapper(new Point(x,y-1));
  }
  mapper(startPoint);
  return coords;
}

function prominent() {
  var startColor = board[0][0];
  var colorProminence = newFilledArray(COLORS.length, 0);
  var edgeCoords = getEdgeCoordinates(ORIGIN);
  for (i in edgeCoords.list) {
    var point = edgeCoords.list[i];
    colorProminence[board[point.x][point.y]] += 1;
  }
  return maxIndex(colorProminence);
}
prominent.description = "Looks at the border of the current flooded area and picks the color that is most common.";

function getNumColors() {
  var colorProminence = newFilledArray(COLORS.length, 0);
  for (var x=0; x<WIDTH; x++) {
    for (var y=0; y<HEIGHT; y++) {
      colorProminence[board[x][y]] += 1;
    }
  }
  return colorProminence;
}

/*
 * finds which color gets you the longest contiguous area
 */
function biggestBang() {
  console.log("biggestBang");
  var startBoard = copyBoard(board);
  var area = newFilledArray(COLORS.length, 0);
  for (i in COLORS) {
    if (i != board[0][0]) {
      flood(0,0,board[0][0],i);
      area[i] = getFilledCoordinates(ORIGIN).size();
    }
    board = copyBoard(startBoard);
  }
  return maxIndex(area); 
}
biggestBang.description = "Finds which color gets you the largest contiguous area, and plays it";

function diagonal() {
  var startColor = board[0][0];
  var x=0;
  var y=0;
  while (y<HEIGHT && board[x][y] == startColor) {
    x++;
    if (x>=WIDTH || board[x][y] != startColor) {
      break;
    }
    y++;
  }
  if (y>=HEIGHT || x>=WIDTH) {
    return -1;
  }
  return board[x][y];
}

function AssertException(message) { this.message = message; }
AssertException.prototype.toString = function () {
  return 'AssertException: ' + this.message;
}

function assert(exp, message) {
  if (!exp) {
    throw new AssertException(message);
  }
}

function getBlobs() {
  // finds largest contigous unfilled area on board
  var filled = getFilledCoordinates(ORIGIN);
  var blobs = [];
  var removables = new PointsList();
  for (var x=0; x<WIDTH; x++) {
    for (var y=0; y<HEIGHT; y++) {
      var point = new Point(x,y);
      if (!(filled.contains(point)) && !(removables.contains(point))) {
        var fillData = getFilledCoordinates(point);
        blobs.push(new Blob(fillData));
        removables.addList(fillData);
      }
    }
  }
  return blobs;
}

function findLargeBlobs(lowerLimit) {
  console.log("findLargeBlobs " + lowerLimit);
  var retme = [];
  var blobs = getBlobs();
  for (i in blobs) {
    var blob = blobs[i];
    if (blob.size >= lowerLimit) {
      blob.mark(blob.size);
      retme.push(blob);
    }
  }
  return retme;
}

function expandFloodedByOne() {
  var color = board[0][0];
  var edges = getEdgeCoordinates(ORIGIN);
  for (i in edges.list) {
    var point = edges.list[i];
    board[point.x][point.y] = color;
  }
  return edges;
}

function getTouchedBlobPoint(edges, blobs) {
  var bestBlobPoint = null;
  for (i in edges.list) {
    var point = edges.list[i];
    for (j in blobs) {
      var blob = blobs[j];
      if (blob.points.contains(point)) {
        if ((bestBlobPoint == null) ||
            (blob.size > bestBlobPoint.blob.size)){
          bestBlobPoint = new BlobPoint(blob, point);
        }
      }
    }
  }
  return bestBlobPoint;
}

function tunnelTowards(point) {
  assert(point instanceof Point);
  console.log("tunnel towards " + point.toString());
  var edges = getEdgeCoordinates(ORIGIN);
  var shortestDistance = 100;
  var closestPoint = null;
  for (i in edges.list) {
    var edgePoint = edges.list[i];
    var distance = point.distanceFrom(edgePoint);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      closestPoint = edgePoint;
    }
  }
  point.mark("T");
  closestPoint.mark("C");
  return board[closestPoint.x][closestPoint.y];
}

function largeAreas2() {
  var b1 = copyBoard(board);
  var largeBlobs = findLargeBlobs(3);
  var bestBlobPoint = null;
  var bestSize = 0;
  // always explore to 3...discount for distance
  flood(0,0,board[0][0],-1);
  for (var i=0;i<3;i++) {
    var outerEdges = expandFloodedByOne();
    var touchedBlobPoint = getTouchedBlobPoint(outerEdges, largeBlobs);
    if (touchedBlobPoint != null) {
      var size = touchedBlobPoint.blob.size - i;
      console.log("size: " + size);
      if (size > bestSize) {
        bestBlobPoint = touchedBlobPoint;
        bestSize = size;
      }
    }
  }
  board = copyBoard(b1);
  if (bestBlobPoint != null) {
    return tunnelTowards(bestBlobPoint.point);
  }
  return biggestBang();
}

function largeAreas() {
  var b1 = copyBoard(board);
  var largeBlobs = findLargeBlobs(3);
  for (var i=0;i<3;i++) {
    var outerEdges = expandFloodedByOne();
    var touchedBlobPoint = getTouchedBlobPoint(outerEdges, largeBlobs);
    if (touchedBlobPoint != null) {
      board = copyBoard(b1);
      return tunnelTowards(touchedBlobPoint.point);
    }
  }
  board = copyBoard(b1);
  return biggestBang();
}

function switchBoards(times, orig, temp) {
  if (times % 2) {
    board = temp;
  } else {
    board = orig;
  }
  displayBoard();
  if (times == 0) {
    return;
  }
  setTimeout(function() {switchBoards(times-1, orig, temp)}, 300);
}

function floodWhite(blob) {
  assert(blob instanceof Blob);
  var points = blob.points.list;
  for (i in points) {
    var point = points[i];
    board[point.x][point.y] = -1;
  }
}

function edger() {
  var edges = getEdgeCoordinates(ORIGIN);
  return -1;
}

function expander() {
  var moves = $("#moves");
  moves.text(parseInt(moves.text()) + 1);
  lastBoards.push(copyBoard(board));
  expandFloodedByOne();
  displayBoard();
  return -1;
}

strategies = [edger, expander, prominent, biggestBang, diagonal, largeAreas, largeAreas2]

function displayStrategies() {
  var bdiv = $("#ai");
  for (i in strategies) {
    var strategy = strategies[i];
    var button = $("<button onclick='playStrategy(" + strategy.name + ")'>" + strategy.name + "</button>");
    if (strategy.description) button.attr("title",strategy.description);
    bdiv.append(button);
  }
}

function displayButtons(colors) {
  var bdiv = $("#buttons").css("padding-top","10px");
  var buttonTemplate = $("<button />");
  var width = $("canvas")[0].width / colors.length;
  for (num in colors) {
    var color = colors[num];
    var button = buttonTemplate.clone();
    button.css({"background-color":color,"width":width,"height":width}).attr("num",num);
    button.click(function() {fill($(this).attr("num"));});
    bdiv.append(button);
  }
}

function stop() {
  clearTimeout(ai);
}

function reset() {
  stop();
  var moves = $("#moves");
  moves.text(0);
  board = copyBoard(origBoard);
  displayBoard();
}

var board;
var lastBoards; // for undo
var ai;

function undo() {
  if (lastBoards.length > 0) {
    board = copyBoard(lastBoards.pop());
    displayBoard();
    var moves = $("#moves");
    moves.text(parseInt(moves.text()) - 1);
  }
}

function newBoard() {
  stop();
  lastBoards = new Array();
  var moves = $("#moves");
  moves.text(0);
  board = createBoard();
  origBoard = copyBoard(board);
  displayBoard();
}

function loadit() {
  newBoard();
  displayButtons(COLORS);
  displayStrategies();
}

$(document).ready(loadit);
