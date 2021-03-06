// Editor extends viewer
function Editor(viewer,controller) {
	this.isEditing = false;
	var _viewer = viewer;
	var _controller = controller;
	var _editMode = -1; // -1 default, 0 Polygon, 1 Rectangle, 2 Border, 3 Line
	var _tempPathIsSegment;
	var _tempPath;
	var _tempPoint;
	var _this = this;
	this.mouseregions = {TOP:0,BOTTOM:1,LEFT:2,RIGHT:3,MIDDLE:4,OUTSIDE:5};

	this.addRegion = function(region){
		this.drawPath(region, true, {type: 'region'});
	}

	this.addLine = function(line){
		_this.drawPathLine(line);
	}

	this.removeLine = function(lineID){
		this.removeSegment(lineID);
	}

	this.removeRegion = function(regionID){
		this.removeSegment(regionID);
	}

	this.startCreatePolygon = function(doSegment) {
		if(_this.isEditing === false){
			_editMode = 0;
			_this.isEditing = true;
			_tempPathIsSegment = doSegment;
			document.body.style.cursor = "copy";

			var tool = new paper.Tool();
			tool.activate();
			tool.onMouseMove = function(event) {
				if(_tempPath){
					_tempPath.removeSegment(_tempPath.segments.length - 1);
					_tempPath.add(_this.getPointInBounds(event.point, _this.getBoundaries()));
				}
			}

			tool.onMouseDown = function(event) {
				if(_this.isEditing === true){
					var canvasPoint = _this.getPointInBounds(event.point, _this.getBoundaries());

					if (!_tempPath) {
						// Start path
						_tempPath = new paper.Path();
						_tempPath.add(new paper.Point(canvasPoint)); //Add Point for mouse movement
						_tempPath.fillColor = 'grey';
						_tempPath.opacity = 0.3;
						_tempPath.closed = false;
						_tempPath.selected = true;

						// circle to end the path
						var endCircle = new paper.Path.Circle(canvasPoint, 5);
						endCircle.strokeColor = 'black';
						endCircle.fillColor = 'grey';
						endCircle.opacity = 0.5;
						endCircle.onMouseDown = function(event) {
							_this.endCreatePolygon();
							this.remove();
						}
					}
					_tempPath.add(new paper.Point(canvasPoint));
				}else{
					this.remove();
				}
			}
		}
	}

	this.endCreatePolygon = function() {
		if(_this.isEditing){
			_this.isEditing = false;
			if(_tempPath != null){
				_tempPath.closed = true;
				_tempPath.selected = false;
				if(_tempPathIsSegment){
					_controller.callbackNewFixedSegment(convertPointsPathToSegment(_tempPath,false));
				}else{
					_controller.callbackNewRegion(convertPointsPathToSegment(_tempPath,true));
				}
				_tempPath.remove();
				_tempPath = null;
			}
			document.body.style.cursor = "auto";
		}
	}

	this.startCreateRectangle = function(doSegment) {
		if(_this.isEditing === false){
			_editMode = 1;
			_this.isEditing = true;
			_tempPathIsSegment = doSegment;
			document.body.style.cursor = "copy";

			var tool = new paper.Tool();
			tool.activate();
			tool.onMouseDown = function(event) {
				if(_this.isEditing === true){
					var canvasPoint = _this.getPointInBounds(event.point, _this.getBoundaries());

					if (!_tempPath) {
						// Start path
						_tempPoint = new paper.Point(canvasPoint);
						_tempPath = new paper.Path();
						_tempPath.add(_tempPoint); //Add Point for mouse movement
						_tempPath.fillColor = 'grey';
						_tempPath.opacity = 0.3;
						_tempPath.closed = true;
						_tempPath.selected = true;

						tool.onMouseMove = function(event) {
							if(_this.isEditing === true){
								if (_tempPath) {
									var point = _this.getPointInBounds(event.point, _this.getBoundaries());
									var rectangle = new paper.Path.Rectangle(_tempPoint, point);

									_tempPath.segments = rectangle.segments;
								}
							}
						}
					}else{
						_this.endCreateRectangle();
						this.remove();
					}
				}else{
					this.remove();
				}
			}
		}
	}

	this.endCreateRectangle = function() {
		if(_this.isEditing){
			_this.isEditing = false;
			if(_tempPath != null){
				_tempPath.closed = true;
				_tempPath.selected = false;
				if(_tempPathIsSegment){
					_controller.callbackNewFixedSegment(convertPointsPathToSegment(_tempPath,false));
				}else{
					_controller.callbackNewRegion(convertPointsPathToSegment(_tempPath,true));
				}
				_tempPath.remove();
				_tempPath = null;
			}
			document.body.style.cursor = "auto";
		}
	}

	this.startCreateLine = function() {
		if(_this.isEditing === false){
			_editMode = 3;
			_this.isEditing = true;
			document.body.style.cursor = "copy";

			var tool = new paper.Tool();
			tool.activate();
			tool.onMouseMove = function(event) {
				if(_tempPath){
					_tempPath.removeSegment(_tempPath.segments.length - 1);
					_tempPath.add(_this.getPointInBounds(event.point, _this.getBoundaries()));
				}
			}

			tool.onMouseDown = function(event) {
				if(_this.isEditing === true){
					var canvasPoint = _this.getPointInBounds(event.point, _this.getBoundaries());

					if (!_tempPath) {
						// Start path
						_tempPath = new paper.Path();
						_tempPath.add(new paper.Point(canvasPoint)); //Add Point for mouse movement
						_tempPath.strokeColor = new paper.Color(0,0,0);
						_tempPath.closed = false;
						_tempPath.selected = true;
					}
					_tempPath.add(new paper.Point(canvasPoint));
				}else{
					this.remove();
				}
			}
		}
	}

	this.endCreateLine = function() {
		if(_this.isEditing){
			_this.isEditing = false;

			if(_tempPath != null){
				_tempPath.closed = false;
				_tempPath.selected = false;
				_controller.callbackNewCut(convertPointsPathToSegment(_tempPath,false));

				_tempPath.remove();
				_tempPath = null;
			}
			document.body.style.cursor = "auto";
		}
	}

	this.startCreateBorder = function(doSegment) {
		if(_this.isEditing === false){
			_this.isEditing = true;
			_editMode = 2;
			_tempPathIsSegment = doSegment;

			var tool = new paper.Tool();
			tool.activate();

			if (!_tempPath) {
				// Start path
				_tempPath = new paper.Path();
				_tempPath.fillColor = 'grey';
				_tempPath.opacity = 0.5;
				_tempPath.closed = true;
				//_tempPath.selected = true;

				tool.onMouseMove = function(event) {
					if(_this.isEditing === true){
						if (_tempPath) {
							var mouseregion = _this.getMouseRegion(event.point);
							var boundaries = _viewer.getBoundaries();

							switch(mouseregion){
							case _this.mouseregions.LEFT:
								document.body.style.cursor = "col-resize";

								var topleft = new paper.Point(boundaries.left,boundaries.top);
								var bottommouse = new paper.Point(event.point.x, boundaries.bottom);
								var rectangle = new paper.Path.Rectangle(topleft, bottommouse);

								_tempPath.segments = rectangle.segments;
								break;
							case _this.mouseregions.RIGHT:
								document.body.style.cursor = "col-resize";

								var topright = new paper.Point(boundaries.right,boundaries.top);
								var bottommouse = new paper.Point(event.point.x, boundaries.bottom);
								var rectangle = new paper.Path.Rectangle(topright, bottommouse);

								_tempPath.segments = rectangle.segments;
								break;
							case _this.mouseregions.TOP:
								document.body.style.cursor = "row-resize";

								var topleft = new paper.Point(boundaries.left,boundaries.top);
								var mouseright = new paper.Point(boundaries.right, event.point.y);
								var rectangle = new paper.Path.Rectangle(topleft, mouseright);

								_tempPath.segments = rectangle.segments;
								break;
							case _this.mouseregions.BOTTOM:
								document.body.style.cursor = "row-resize";

								var bottomleft = new paper.Point(boundaries.left,boundaries.bottom);
								var mouseright = new paper.Point(boundaries.right, event.point.y);
								var rectangle = new paper.Path.Rectangle(bottomleft, mouseright);

								_tempPath.segments = rectangle.segments;
								break;
							case _this.mouseregions.MIDDLE:
							default:
								_tempPath.removeSegments();
								document.body.style.cursor = "copy";
								break;
							}
						}
					}
				}
				tool.onMouseDown = function(event) {
					if(_tempPath){
						_this.endCreateBorder();
						this.remove();
					}
				}
			}
		}
	}

	this.endCreateBorder = function() {
		if(_this.isEditing){
			_this.isEditing = false;

			if(_tempPath != null){
				if(_tempPathIsSegment){
					_controller.callbackNewFixedSegment(convertPointsPathToSegment(_tempPath,false));
				}else{
					_controller.callbackNewRegion(convertPointsPathToSegment(_tempPath,true));
				}

				_tempPath.remove();
				_tempPath = null;
			}
			document.body.style.cursor = "auto";
		}
	}

	this.getMouseRegion = function(mousepos){
		var bounds = _viewer.getBoundaries();
		var width = bounds.width;
		var height = bounds.height;
		var percentarea = 0.4;

		var leftmin = bounds.left;
		var leftmax = leftmin + (width*percentarea);

		var rightmax = bounds.right;
		var rightmin = rightmax- (width*percentarea);

		var topmin = bounds.top;
		var topmax = topmin + (height*percentarea);

		var bottommax = bounds.bottom;
		var bottommin = bottommax - (height*percentarea);
		if(mousepos.x < leftmin || mousepos.x > rightmax || mousepos.y < topmin || mousepos.y > bottommax){
			return this.mouseregions.OUTSIDE;
		}else{
			//Get Mouse position/region
			if(mousepos.x > leftmin && mousepos.x < leftmax){
				return this.mouseregions.LEFT;
			}else if(mousepos.x > rightmin && mousepos.x < rightmax){
				return this.mouseregions.RIGHT;
			}else if(mousepos.y > topmin && mousepos.y < topmax){
				return this.mouseregions.TOP;
			}else if(mousepos.y > bottommin && mousepos.y < bottommax){
				return this.mouseregions.BOTTOM;
			}else{
				return this.mouseregions.MIDDLE;
			}
		}
	}

	this.endEditing = function(){
		if(_this.isEditing){
			switch(_editMode){
				case 0:
					_this.endCreatePolygon();
					break;
				case 1:
					_this.endCreateRectangle();
					break;
				case 2:
					_this.endCreateBorder();
					break;
				case 3:
					_this.endCreateLine();
					break;
				default:
					break;
			}
		}
	}

	this.getPointInBounds = function(point, bounds){
		if(!bounds.contains(point)){
			var boundPoint = point;
			if(point.x < bounds.left){
				boundPoint.x = bounds.left;
			}else if(point.x > bounds.right){
				boundPoint.x = bounds.right;
			}
			if(point.y < bounds.top){
				boundPoint.y = bounds.top;
			}else if(point.y > bounds.bottom){
				boundPoint.y = bounds.bottom;
			}

			return boundPoint;
		}else{
			return point;
		}
	}

	// Private Helper methods
	var convertPointsPathToSegment = function(path,isRelative){
		var points = [];
		for(var pointItr = 0, pointMax = path.segments.length; pointItr < pointMax; pointItr++){
			var point = path.segments[pointItr].point;
			if(isRelative){
				points.push(getPercentPointFromCanvas(point.x, point.y));
			}else{
				points.push(getPointFromCanvas(point.x, point.y));
			}
		}
		return points;
	}

	var getPointFromCanvas = function(canvasX, canvasY){
		var canvasPoint = _this.getPointInBounds(new paper.Point(canvasX, canvasY), _this.getBoundaries());
		var imagePosition = _this.getBoundaries();
		var x = (canvasPoint.x - imagePosition.x) / _this.getZoom();
		var y = (canvasPoint.y - imagePosition.y) / _this.getZoom();

		return {"x":x,"y":y};
	}

	var getPercentPointFromCanvas = function(canvasX, canvasY){
		var canvasPoint = _this.getPointInBounds(new paper.Point(canvasX, canvasY), _this.getBoundaries());
		var imagePosition = _this.getBoundaries();
		var x = (canvasPoint.x - imagePosition.x) / imagePosition.width;
		var y = (canvasPoint.y - imagePosition.y) / imagePosition.height;

		return {"x":x,"y":y};
	}

	this.getPointInBounds = function(point, bounds){
		if(!bounds.contains(point)){
			var boundPoint = point;
			if(point.x < bounds.left){
				boundPoint.x = bounds.left;
			}else if(point.x > bounds.right){
				boundPoint.x = bounds.right;
			}
			if(point.y < bounds.top){
				boundPoint.y = bounds.top;
			}else if(point.y > bounds.bottom){
				boundPoint.y = bounds.bottom;
			}

			return boundPoint;
		}else{
			return point;
		}
	}

	//***Inherintent functions***
	this.setImage = function(id){
		_viewer.setImage(id);
	}
	this.addSegment = function(segment){
		_viewer.addSegment(segment);
	}
	this.clear = function() {
		_viewer.clear();
	}
	this.updateSegment = function(segment) {
		_viewer.updateSegment(segment);
	}
	this.removeSegment = function(id){
		_viewer.removeSegment(id);
	}
	this.highlightSegment = function(id, doHighlight) {
		_viewer.highlightSegment(id, doHighlight);
	}
	this.hideSegment = function(id,doHide){
		_viewer.hideSegment(id, doHide);
	}
	this.selectSegment = function(id, doSelect) {
		_viewer.selectSegment(id, doSelect);
	}
	this.getBoundaries = function(){
		return _viewer.getBoundaries();
	}
	this.center = function() {
		_viewer.center();
	}
	this.getZoom = function(){
		return _viewer.getZoom();
	}
	this.setZoom = function(zoomfactor,paper) {
		_viewer.setZoom(zoomfactor,paper);
	}
	this.zoomIn = function(zoomfactor,paper) {
		_viewer.zoomIn(zoomfactor,paper);
	}
	this.zoomOut = function(zoomfactor,paper) {
		_viewer.zoomOut(zoomfactor,paper);
	}
	this.zoomFit = function() {
		_viewer.zoomFit();
	}
	this.movePoint = function(delta) {
		if(!_this.isEditing){
			_viewer.movePoint(delta);
		}
	}
	this.move = function(x, y) {
		if(!_this.isEditing){
			_viewer.move(x, y);
		}
	}
	this.getColor = function(segmentType){
		return _viewer.getColor(segmentType);
	}
	//Protected functions
	this.drawPath = function(segment, doFill, info){
		_viewer.drawPath(segment, doFill, info);
	}
	this.drawPathLine = function(segment){
		_viewer.drawPathLine(segment);
	}
	this.getImageCanvas = function(){
		return _viewer.getImageCanvas();
	}
}
