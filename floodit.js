var HEIGHT = 12;
var WIDTH = 12;
var COLORS = ["red","green","blue","yellow","pink","purple"];

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
      ctx.fillStyle = COLORS[row[y]];
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
    fill(strategy());
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

function getFilledCoordinates(sx,sy) {
  var color = board[sx][sy];
  var coords = {};
  coords.length = 0;
  var tried = {}
  function mapper(x,y) {
    if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) {
      return;
    }
    var coord = x+","+y;
    if (tried[coord]) {
      return;
    }
    tried[coord] = true;
    if (board[x][y] == color) {
      coords[coord] = true;
      coords.length += 1;
    } else {
      return;
    }
    mapper(x-1,y);
    mapper(x+1,y);
    mapper(x,y+1);
    mapper(x,y-1);
  }
  mapper(sx,sy);
  return coords;
}

function getEdgeCoordinates(sx,sy) {
  var color = board[sx][sy];
  var coords = {};
  coords.length = 0;
  var tried = {}
  function mapper(x,y) {
    if (x<0 || y<0 || x>=WIDTH || y>=HEIGHT) {
      return;
    }
    var coord = x+","+y;
    if (tried[coord]) {
      return;
    }
    tried[coord] = true;
    if (board[x][y] != color) {
      coords[coord] = true;
      coords.length += 1;
      return;
    }
    mapper(x-1,y);
    mapper(x+1,y);
    mapper(x,y+1);
    mapper(x,y-1);
  }
  mapper(sx,sy);
  return coords;
}

function prominent() {
  var startColor = board[0][0];
  var colorProminence = newFilledArray(COLORS.length, 0);
  var edgeCoords = getEdgeCoordinates(0,0);
  for (coord in edgeCoords) {
    var parts = coord.split(",");
    var x = parts[0];
    var y = parts[1];
    colorProminence[board[x][y]] += 1;
  }
  return maxIndex(colorProminence);
}

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
  var startBoard = copyBoard(board);
  var area = newFilledArray(COLORS.length, 0);
  for (i in COLORS) {
    if (i != board[0][0]) {
      flood(0,0,board[0][0],i);
      area[i] = getFilledCoordinates(0,0).length;
    }
    board = copyBoard(startBoard);
  }
  return maxIndex(area); 
}

strategies = ["inOrder", "random", "prominent", "biggestBang"]

function displayStrategies() {
  var bdiv = $("#ai");
  for (i in strategies) {
    var strategy = strategies[i];
    bdiv.append($("<button onclick='playStrategy(" + strategy + ")'>" + strategy + "</button>"));
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
