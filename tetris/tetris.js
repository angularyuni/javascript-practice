

function Enum() {
    for (var i in arguments) {
        this[arguments[i]] = i;
    }
}

var MoveType = new Enum('DOWN', 'LEFT', 'RIGHT', 'TURN', 'DROP');
var DisplayType = new Enum('HIDE','SHOW','DROP');

var Class = {
    create: function() {
        return function() {
            this.initialize.apply(this, arguments);
        }
    }
}

var JMLIM = JMLIM || {};

JMLIM.namespace = function (ns_string) {
		var parts = ns_string.split("."),
			parent = JMLIM,
			i;
		
		if(parts[0] === "JMLIM") {
			parts = parts.slice(1);
		}

		for(i = 0; i < parts.length; i += 1) {
			if(typeof parent[parts[i]] === "undefined" ) {
				parent[parts[i]] = {};
			}

			parent = parent[parts[i]];
		}

		return parent;
};


var TETRIS = JMLIM.namespace("JMLIM.TETRIS");

TETRIS.GameService = Class.create();
TETRIS.Block = Class.create();

var GameService = TETRIS.GameService;
var Block = TETRIS.Block;

GameService.prototype = {
	initialize : function() {
		var that = this;
		
		this.minPosition = {};
		this.maxPosition = {};
		
		this.maxPosition.rowIndex = 0;
		this.maxPosition.colIndex = 0;

		this.minPosition.rowIndex = 0;
		this.minPosition.colIndex = 0;
		
		this.accumulationScore = 0;

		this.blockReset();

		jQuery("body").keyup(function(event) {
			if(event.keyCode == 37) {
				if(that.currentBlockMinPosition.colIndex > 0) { 
					that.ctrlBlock(MoveType.LEFT);
				}
			} else if(event.keyCode == 39) {
				if(that.currentBlockMaxPosition.colIndex < that.maxPosition.colIndex - 1) {
					that.ctrlBlock(MoveType.RIGHT);
				}
			} else if(event.keyCode == 38) {
				that.ctrlBlock(MoveType.TURN);
			}
		});
	},
	
	createMap : function(maxRowIndex, maxColIndex) {
		var newRow = [];
		this.maxPosition.rowIndex = maxRowIndex;
		this.maxPosition.colIndex = maxColIndex;
		for(var rowIndex = 0; rowIndex < maxRowIndex; rowIndex++) {
			var newCol = [];
			for(var colIndex = 0; colIndex < maxColIndex; colIndex++) {
				newCol[colIndex] = "<td class='col_" + colIndex + "'></td>";
			}
			newRow[rowIndex] = "<tr class='row_"+ rowIndex +"'>";
			newRow[rowIndex] += newCol.join("");
			newRow[rowIndex] += "</tr>";
		}
		jQuery("#tetris").append(newRow.join(""));
	},

	blockReset : function() {
		this.removeDroppedBlock();

		this.selectedBlock = null;
		this.blockPosition = {};

		this.currentBlockMinPosition = {};
		this.currentBlockMaxPosition = {};

		this.blockPosition.top = -1;
		this.blockPosition.left = -1;

		this.currentBlockMinPosition.rowIndex = 0; 
		this.currentBlockMinPosition.colIndex = 0;

		this.currentBlockMaxPosition.rowIndex = 0;
		this.currentBlockMaxPosition.colIndex = 0;

		this.orderNum = 0;
	},

	next : function() {
		this.selectedBlock = this.randomSelectedBlock();
		var that = this;

		this.interval = window.setInterval(function() {
			that.ctrlBlock(MoveType.DOWN);
		},200);
	},
	
	enableMoveDown: function() {
		return this.enableMove(MoveType.DOWN);
	},

	enableMoveLeft: function() {
		return this.enableMove(MoveType.LEFT);
	},

	enableMoveRight: function() {
		return this.enableMove(MoveType.RIGHT);
	},

	enableMove: function(type) {	
		var right = 0;
		var down = 0;

		var maxRowIndex = this.maxPosition.rowIndex;
		var minColIndex = this.minPosition.colIndex;
		var maxColIndex = this.maxPosition.colIndex;

		var mapElement = jQuery("#tetris tbody");
		var position = this.determineBlockPosition();
		
		var enabled = true;

		switch(type)
		{
		case MoveType.DOWN:
			down = 1;
			break;
		case MoveType.LEFT:
			right = -1;
			break;
		case MoveType.RIGHT:
			right = 1;
			break;
		case MoveType.TURN:
			break;
		case MoveType.DROP:
			break;
		default:
		}

		for (var index in position) {
			var currentRow = mapElement.find("tr:eq(" + (position[index].top + down) + ")");
			if(currentRow) {
				var currentCol = currentRow.find("td:eq(" + (position[index].left + right) +")");
				if( currentCol ) {

					switch(type)
					{
					case MoveType.DOWN:
						if(position[index].top + down >= maxRowIndex) {
							enabled = false;
							return enabled;
						}		
						break;
					case MoveType.LEFT:
						if( position[index].left <= minColIndex) {
							enabled = false;
							return enabled;
						}
						break;
					case MoveType.RIGHT:
						if(position[index].left >= maxColIndex - 1) {
							enabled = false;
							return enabled;
						}
						break;
					case MoveType.TURN:
						var adjustLeftPosition = 0;
						if( maxColIndex <= position[index].left ) {
							adjustLeftPosition = maxColIndex - position[index].left - 1;
							this.blockPosition.left += adjustLeftPosition;
						}
						
						if( minColIndex > position[index].left ) {
							adjustLeftPosition = minColIndex - position[index].left;
							this.blockPosition.left += adjustLeftPosition;
						}
						break;
					default:
					}

					var blockClass = currentCol.attr("class");
					if( blockClass ) {
						if( blockClass.indexOf("dropped") != -1) {
							enabled = false;
						}
					}
				}
			}
		}

		return enabled;
	},

	ctrlBlock : function(type) {
		var mapElement = jQuery("#tetris tbody");

		var position = this.determineBlockPosition();
		this.displayBlock(position, DisplayType.HIDE);

		switch(type)
		{
		case MoveType.DOWN:
			if(this.enableMoveDown()) {
				this.blockPosition.top += 1;
			} else {
				this.ctrlBlock(MoveType.DROP);
				window.clearInterval(this.interval);
				this.blockReset();
				this.next();
				return;
			}
			break;
		case MoveType.LEFT:
			if(this.enableMoveLeft()) {
				this.blockPosition.left -= 1;
			}
			break;
		case MoveType.RIGHT:
			if(this.enableMoveRight()) {
				this.blockPosition.left += 1;
			}
			break;
		case MoveType.TURN:
			this.turnBlock();
			break;
		case MoveType.DROP:
			this.displayBlock(position, DisplayType.DROP);
			return;
			break;
		default:
		}

		position = this.determineBlockPosition();
		this.displayBlock(position, DisplayType.SHOW);
    },

	displayBlock: function(position, type) {
		var mapElement = jQuery("#tetris tbody");
		var currentBlock = this.selectedBlock[this.orderNum];
		var name = currentBlock.name;
		for (var index in position) {
			var blockLocation = mapElement.find("tr:eq("+position[index].top+")").find("td:eq("+position[index].left+")");
			
			switch(type)
			{
			case DisplayType.SHOW:
				blockLocation.addClass("dropping").addClass(name);
				break;
			case DisplayType.HIDE:
				blockLocation.removeClass("dropping").removeClass(name);
				break;
			case DisplayType.DROP:
				blockLocation.addClass("dropped").addClass(name);
				break;
			default:
			}
		}
		
	},

	turnBlock: function() {
		var prevNum = this.orderNum;
		this.orderNum++;

		if(this.selectedBlock.length <= this.orderNum) {
			this.orderNum = 0;
		}
		
		if(!this.enableMove(MoveType.TURN)) {
			this.orderNum = prevNum;
		}
	},
	
	removeDroppedBlock: function() {
		var mapElement = jQuery("#tetris tbody");
		var maxRowIndex = this.maxPosition.rowIndex;
		var maxColIndex = this.maxPosition.colIndex;

		var removeRowIndexes = [];
		for(var rowIndex = maxRowIndex - 1; rowIndex >= 0; rowIndex -= 1) {
			var rowElement = mapElement.find("tr:eq("+ rowIndex +")");
			if(rowElement) {
				var oneRowDroppedBlockCount = 0;
				for(var colIndex = 0; colIndex < maxColIndex; colIndex++) {
					var colElement = rowElement.find("td:eq(" + colIndex + ")");
					if(colElement) {
						var blockClass = colElement.attr("class");
						if( blockClass ) {
							if( blockClass.indexOf("dropped") != -1 ) {
								//console.log(oneRowDroppedBlockCount);
								oneRowDroppedBlockCount += 1;
							}
						}
					}
				}
				
				if(oneRowDroppedBlockCount) {
					if( oneRowDroppedBlockCount >= maxColIndex ) {
						rowElement.find("td").removeAttr("class");
						removeRowIndexes.push(rowIndex);
					}
				} else {
					break;
				}
			}
		}

		for(var index = 0, length = removeRowIndexes.length; index < length; index++) {
			var fillRowIndex = removeRowIndexes[index] + index;

			for(var rowIndex = fillRowIndex; rowIndex >= 1; rowIndex -= 1) {
				var prevRowIndex = rowIndex - 1;
				var fillRowElement = mapElement.find("tr:eq("+ rowIndex +")");
				var prevRowElement = mapElement.find("tr:eq("+ prevRowIndex +")");
				
				if(prevRowElement && fillRowElement) {
					for(var colIndex = 0; colIndex < maxColIndex; colIndex++) {
						var prevColElement = prevRowElement.find("td:eq("+colIndex+")");
						var fillColElement = fillRowElement.find("td:eq("+colIndex+")");
						
						var prevColBlockClass = prevColElement.attr("class");
						var fillColBlockClass = fillColElement.removeAttr("class");
						if( prevColBlockClass ) {
							if( prevColBlockClass.indexOf("dropped") != -1) {
								fillColElement.addClass(prevColBlockClass);
							}
						}
					}
				}
			}
		}
	},

	determineBlockPosition : function() {
		var mapElement = jQuery("#tetris tbody");
		var firstRowColumns = mapElement.find("tr:eq(0) td");
		
		var maxColIndex = jQuery(firstRowColumns).size();
		var maxRowIndex = mapElement.find("tr").size();
		
		if(this.blockPosition.left == -1) {
			this.blockPosition.left = Math.floor(maxColIndex / 2);
		}

		if(this.blockPosition.top == -1) {
			this.blockPosition.top = 0;
		}

		var standardTop = this.blockPosition.top;
		var standardLeft = this.blockPosition.left;

		var selectedBlock = this.selectedBlock[this.orderNum];
		
		var oneTop = selectedBlock.one.top + standardTop;
		var oneLeft = selectedBlock.one.left + standardLeft;

		var twoTop = selectedBlock.two.top + standardTop;
		var twoLeft = selectedBlock.two.left + standardLeft;

		var threeTop = selectedBlock.three.top + standardTop;
		var threeLeft = selectedBlock.three.left + standardLeft;

		var fourTop = selectedBlock.four.top + standardTop;
		var fourLeft = selectedBlock.four.left + standardLeft;

		var blockTopPositions = [oneTop, twoTop, threeTop, fourTop];
		var blockLeftPositions = [oneLeft, twoLeft, threeLeft, fourLeft];
		
		this.currentBlockMaxPosition.rowIndex = Math.max(oneTop, twoTop, threeTop, fourTop);
		this.currentBlockMinPosition.rowIndex = Math.min(oneTop, twoTop, threeTop, fourTop);

		this.currentBlockMaxPosition.colIndex = Math.max(oneLeft, twoLeft, threeLeft, fourLeft);		
		this.currentBlockMinPosition.colIndex = Math.min(oneLeft, twoLeft, threeLeft, fourLeft);		

		var block = new Block();

		return block.currentBlockPosition(selectedBlock.name,oneTop + "," + oneLeft,
							twoTop + "," + twoLeft,
							threeTop + "," + threeLeft,
							fourTop + "," + fourLeft);
	},

	randomSelectedBlock : function() {
		var block = new Block();
		var blocks = block.getBlocks();
		var randomNumber = Math.floor(Math.random() * blocks.length);
		return blocks[randomNumber];
		
	}
};


Block.prototype = {
	initialize : function() {
	},
	currentBlockPosition : function(name, one, two, three, four) {
		return {
			name: name,
			one: {
				top: Number(one.split(",")[0]),
				left: Number(one.split(",")[1])
			},
			two: {
				top: Number(two.split(",")[0]),
				left: Number(two.split(",")[1])
			},
			three: {
				top: Number(three.split(",")[0]),
				left: Number(three.split(",")[1])
			},
			four : {
				top: Number(four.split(",")[0]),
				left: Number(four.split(",")[1])
			}
		}
	},

	I : function() {
		return [
			this.currentBlockPosition("I","0,-1", "0,0", "0,1", "0,2"),
			this.currentBlockPosition("I","-1,0", "0,0", "1,0", "2,0")
		];
	},
	
	J : function() {
		return [
			this.currentBlockPosition("J","1,-1", "0,-1", "1,0", "1,1"),
			this.currentBlockPosition("J","1,-1", "1,0", "0,0", "-1,0"),
			this.currentBlockPosition("J","0,-1", "0,0", "1,1", "0,1"),
			this.currentBlockPosition("J","1,-1", "0,-1", "-1,-1", "-1,0")
		]
	},
	
	L : function() {
		return [
			this.currentBlockPosition("L","1,-1", "1,0", "1,1", "0,1"),
			this.currentBlockPosition("L","1,-1", "0,-1", "-1,-1", "1,0"),
			this.currentBlockPosition("L","1,-1", "0,-1", "0,0", "0,1"),
			this.currentBlockPosition("L","-1,0", "1,1", "0,1", "-1,1")
		];
	},
	
	O : function() {
		return [
			this.currentBlockPosition("O","0,-1", "1,-1", "0,0", "1,0")
		];
	},
	
	S : function() {
		return [
			this.currentBlockPosition("S","1,-1", "0,0", "1,0", "0,1"),
			this.currentBlockPosition("S","0,-1", "-1,-1", "1,0", "0,0")
		];
	},
	
	T : function() {
		return [
			this.currentBlockPosition("T","1,-1", "1,0", "0,0", "1,1"),
			this.currentBlockPosition("T","0,0", "1,1", "0,1", "-1,1"),
			this.currentBlockPosition("T","0,-1", "1,0", "0,0", "0,1"),
			this.currentBlockPosition("T","1,-1", "0,-1", "-1,-1", "0,0")
		];
	},
	
	Z : function() {
		return [
			this.currentBlockPosition("Z","0,-1", "0,0", "1,0", "1,1"),
			this.currentBlockPosition("Z","1,-1", "0,-1", "0,0", "-1,0")
		];
	},
	
	getBlocks : function() {
		return [this.I(),this.J(),this.L(),this.O(),this.S(),this.T(),this.Z()];
	}
}

jQuery(document).ready(function() {
	var tetris = new GameService();
	tetris.createMap(15,9);
	tetris.next();
});