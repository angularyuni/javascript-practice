var animals = [ 'bear', 'cat', 'chicken', 'monkey', 'mouse', 'pig', 'rabbit' ];
var Class = {
	create : function() {
		return function() {
			this.initialize.apply(this, arguments);
		};
	}
};

var JMLIM = JMLIM || {};

JMLIM.namespace = function(ns_string) {
	var parts = ns_string.split("."), parent = JMLIM, i;

	if (parts[0] === "JMLIM") {
		parts = parts.slice(1);
	}

	for (i = 0; i < parts.length; i += 1) {
		if (typeof parent[parts[i]] === "undefined") {
			parent[parts[i]] = {};
		}

		parent = parent[parts[i]];
	}

	return parent;
};

var ANIPANG = JMLIM.namespace("JMLIM.ANIPANG");

ANIPANG.GameService = Class.create();
ANIPANG.ScoreBoard = Class.create();
ANIPANG.TimeProgressbar = Class.create();

var GameService = ANIPANG.GameService;
var ScoreBoard = ANIPANG.ScoreBoard;
var TimeProgressbar = ANIPANG.TimeProgressbar;

GameService.prototype = {
	initialize : function() {
		this.gameService = this;
		this.maxRowIndex = 7;
		this.maxColIndex = 7;
		this.anipangMap = jQuery("#anipang");
		this.startGame();
	},
	startGame : function() {
		this.timeProgressbar = new TimeProgressbar();
		this.timeProgressbar.timerStart();

		this.createMap();
		this.createAnimal();
	},
	endGame : function() {

	},
	createMap : function() {
		var row = [];
		var col = [];
		for (var rowIndex = 0; rowIndex < this.maxRowIndex; rowIndex += 1) {
			for (var colIndex = 0; colIndex < this.maxColIndex; colIndex += 1) {
				col[colIndex] = "<td class='column col_" + colIndex + "'>";
				col[colIndex] += "</td>";
			}

			row[rowIndex] = "<tr class='row row_" + rowIndex + "'>";
			row[rowIndex] += col.join("");
			row[rowIndex] += "</tr>";
		}

		this.anipangMap.append(row.join(""));
	},
	createAnimal : function() {
		var anipangMap = this.anipangMap;

		for (var rowIndex = 0; rowIndex < this.maxRowIndex; rowIndex += 1) {
			var rowQuery = anipangMap.find(".row_" + rowIndex);
			for (var colIndex = 0; colIndex < this.maxColIndex; colIndex += 1) {
				var colQuery = rowQuery.find(".col_" + colIndex);
				var randomIndex = Math.floor(Math.random() * 7);
				var animalName = animals[randomIndex];
				var animal = "<div id='" + animalName + "' class='animal "
						+ animalName + "'>";
				animal += "</div>";
				colQuery.append(animal);
			}
		}

		this.planExplodeHorizontal(anipangMap);
		this.planExplodeVertical(anipangMap);
		if (anipangMap.find(".pang").size() > 0) {
			anipangMap.find(".animal").remove();
			this.createAnimal();
			return false;
		}

		this.madePossibleMove(anipangMap);
		return true;
	},
	planExplodeHorizontal : function(anipangMap) {
		var planExplode = false;
		for (var rowIndex = 0; rowIndex < this.maxRowIndex; rowIndex += 1) {
			var rowQuery = anipangMap.find(".row_" + rowIndex);
			for (var colIndex = 0; colIndex < this.maxColIndex; colIndex += 1) {
				var colQuery = rowQuery.find(".col_" + colIndex);
				var prevQuery = null;
				var nextQuery = null;

				while (true) {
					prevQuery = colQuery.prev();
					var animalId = colQuery.find(".animal").attr("id");
					var prevAnimalId = prevQuery.find(".animal").attr("id");
					if (animalId == prevAnimalId) {
						colQuery = prevQuery;
					} else {
						break;
					}
				}

				// next
				var count = 1;
				while (true) {
					nextQuery = colQuery.next();
					var animalId = colQuery.find(".animal").attr("id");
					var nextAnimalId = nextQuery.find(".animal").attr("id");
					if (animalId == nextAnimalId) {
						count++;
						colQuery = nextQuery;
					} else {
						break;
					}
				}

				if (count >= 3) {
					for (var ind = 0; ind < count; ind += 1) {
						colQuery.find(".animal").addClass("pang");
						colQuery = colQuery.prev();
					}
					planExplode = true;
				}
			}
		}

		return planExplode;
	},
	planExplodeVertical : function(anipangMap) {
		var planExplode = false;
		for (var rowIndex = 0; rowIndex < this.maxRowIndex; rowIndex += 1) {
			var rowQuery = anipangMap.find(".row_" + rowIndex);
			for (var colIndex = 0; colIndex < this.maxColIndex; colIndex += 1) {
				var colQuery = rowQuery.find(".col_" + colIndex);

				var prevQuery = null;
				var nextQuery = null;

				while (true) {
					prevQuery = colQuery.parent().prev();
					var animalId = colQuery.find(".animal").attr("id");
					var prevAnimalId = prevQuery.find(".col_" + colIndex).find(
							".animal").attr("id");
					if (animalId == prevAnimalId) {
						colQuery = prevQuery.find(".col_" + colIndex);
					} else {
						break;
					}
				}

				var count = 1;
				while (true) {
					nextQuery = colQuery.parent().next();
					var animalId = colQuery.find(".animal").attr("id");
					var nextAnimalId = nextQuery.find(".col_" + colIndex).find(
							".animal").attr("id");
					if (animalId == nextAnimalId) {
						count++;
						colQuery = nextQuery.find(".col_" + colIndex);
					} else {
						break;
					}
				}

				if (count >= 3) {
					for (var ind = 0; ind < count; ind += 1) {
						colQuery.find(".animal").addClass("pang");
						colQuery = colQuery.parent().prev().find(
								".col_" + colIndex);
					}
					planExplode = true;
				}
			}
		}

		return planExplode;
	},
	madePossibleMove : function(anipangMap) {
		var that = this;
		jQuery(".animal").draggable({
			containment : "#anipang",
			revert : "invalid"
		});

		jQuery("#anipang td.column").droppable(
				{
					accept : ".animal",
					drop : function(event, ui) {
						var sourceColumn = ui.draggable.parent();
						var targetColumn = jQuery(this);

						var sourceRow = sourceColumn.parent();
						var targetRow = targetColumn.parent();

						var targetAnimal = targetColumn.find(".animal");
						var sourceAnimal = sourceColumn.find(".animal");
						sourceAnimal.css("left", "0px").css("top", "0px");

						var validRowInd = Math.abs(sourceRow.index()
								- targetRow.index());
						var validColInd = Math.abs(sourceColumn.index()
								- targetColumn.index());

						var moveValid = ((validRowInd + validColInd) == 1);

						if (moveValid) {
							targetColumn.append(sourceAnimal);
							sourceColumn.append(targetAnimal);

							var planExplodeHorizontal = that
									.planExplodeHorizontal(anipangMap);
							var planExplodeVertical = that
									.planExplodeVertical(anipangMap);
							if (planExplodeHorizontal || planExplodeVertical) {
								that.removeAnimal();
							} else {
								targetColumn.append(targetAnimal);
								sourceColumn.append(sourceAnimal);
							}
						}
					}
				});
	},
	removeAnimal : function() {
		var anipangMap = this.anipangMap;
		var pang = anipangMap.find(".pang");
		var that = this;
		var callback = function() {
			pang.remove();

			that.dropAnimal();
			that.fillAnimal();

			var planExplodeHorizontal = that.planExplodeHorizontal(anipangMap);
			var planExplodeVertical = that.planExplodeVertical(anipangMap);

			if (planExplodeHorizontal || planExplodeVertical) {
				that.removeAnimal();
			}

			that.madePossibleMove(anipangMap);
		};

		pang.effect("blind", {}, 500, callback);

	},
	dropAnimal : function() {
		var anipangMap = this.anipangMap;
		var targetColIndexes = [];
		var targetMaxRowIndex = 0;

		anipangMap.find(".row .column").each(function() {
			var column = jQuery(this);
			var row = column.parent();
			if (column.find(".animal").size() == 0) {
				targetColIndexes.push(column.index());
				if (targetMaxRowIndex < row.index()) {
					targetMaxRowIndex = row.index();
				}
			}
		});

		targetColIndexes = jQuery.unique(targetColIndexes);

		for (var rowIndex = targetMaxRowIndex - 1; rowIndex >= 0; rowIndex -= 1) {
			for (var colIndex = 0, length = targetColIndexes.length; colIndex < length; colIndex += 1) {
				var targetColIndex = targetColIndexes[colIndex];

				var dropColumn = anipangMap.find(".row").eq(rowIndex).find(
						".column").eq(targetColIndex);
				var drop = dropColumn.find(".animal");

				for (var targetRowIndex = rowIndex; targetRowIndex <= targetMaxRowIndex; targetRowIndex += 1) {
					var targetColumn = anipangMap.find(".row").eq(
							targetRowIndex).find(".column").eq(targetColIndex);
					var target = targetColumn.find(".animal");
					if (target.size() == 0) {
						targetColumn.append(drop);
					}
				}
			}
		}
	},
	fillAnimal : function() {
		var anipangMap = this.anipangMap;
		var fillTargetColumn = anipangMap.find(".column").filter(function() {
			return jQuery(this).find(".animal").size() == 0;
		});

		fillTargetColumn.each(function() {
			var randomIndex = Math.floor(Math.random() * 7);
			var animalName = animals[randomIndex];
			var animal = "<div id='" + animalName + "' class='animal "
					+ animalName + "'>";
			animal += "</div>";
			jQuery(this).append(animal);
		});
	}
};

TimeProgressbar.prototype = {
	initialize : function() {
		this.progressbar = jQuery("#progressbar");
		this.progressbar.progressbar({
			value : 100
		});
	},
	timerStart : function() {
		var that = this;
		var progressbar = this.progressbar;
		var progress = function() {
			var val = progressbar.progressbar("value");
			progressbar.progressbar("value", val - 1);
			if (val > 1) {
				window.setTimeout(progress, 100);
			} else {
				that.timerEnd();
			}
		}
		window.setTimeout(progress, 3000);
	},
	timerEnd : function() {
		jQuery.jAlert('게임을 종료합니다.', '', function(result) {
		}, {
			show : 'explode'
		});
	}
};

ScoreBoard.prototype = {
	initialize : function() {
	}
};

jQuery(document).ready(function() {
	jQuery.jConfirm('게임을 시작합니다', '', function(result) {
		var anipang = new GameService();
	}, {
		show : 'explode'
	});
});