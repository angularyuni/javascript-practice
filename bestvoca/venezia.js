var Venezia = function() {
	this.vocas = function() {
		var vocaLists = null;
		$.ajax({
			url: 'vocas.txt',
			dataType:'text',
			async: false,
			error: function(request, textStatus, errorThrown){
				console.log("request : " + request + ", textStatus : " + textStatus + " ,errorThrown : " + errorThrown);
			},
			success : function( data ) {
				vocaLists = eval("({"+data+"})");
			}
		});
		return vocaLists;
	};

	this.size = function() {
		var size = 0;
		for(var voca in this.vocas()) {
			size++;
		}
		return size;
	};

	this.vocasArr = function() {
		var arr = [];
		for(var voca in this.vocas()) {
			arr.push(voca);
		}
		return arr;
	};
	
	this.vocasRandomArr = function() {
		var arr = this.vocasArr();
		var randomArr = [];
		for (var i = 0, srcLength = arr.length; i < srcLength; i+=1) {
			var randomNumber = Math.floor(Math.random() * this.size());
			var randomVoca = arr[randomNumber];
			var add = true;
			for (var j = 0, tarLength = randomArr.length; j < tarLength; j+=1) {
				if(randomArr[j] === randomVoca) {
					add = false;
					i-=1;
					break;
				}				 
			}
			if (add) {
				randomArr[i] = randomVoca;
			}
		}
		return randomArr;
	};
}






