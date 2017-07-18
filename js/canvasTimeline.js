var CanvasTimeline = function () {

	const TOTAL_SECTIONS = 10;
	const CANVAS_HEIGHT = 30;
	const DATA_POINT_RADIUS = 6;
	const DATA_POINT_WIDTH = 9;
	const DATA_POINT_HEIGHT = 15;
	
	const DATA_POINT_MERGE_SENSIBILITY = 10;
	
	const TIMELINE_MARGIN = {
		top: 10,
		left: 0,
		right: 0,
		bottom: 10
	};
	
	const TEXT_STYLE = {
        font : '12px Arial',
        fillColor : 'white'
    }
	
	const TEAMS = [
		'HOME',
		'AWAY'
	]

	//Mock data for visualization
	var mockData = [{
		team: 'HOME',
		time: 428
	}, {
		team: 'AWAY',
		time: 799
	}, {
		team: 'AWAY',
		time: 2244
	}, {
		team: 'AWAY',
		time: 810
	}, {
		team: 'HOME',
		time: 170
	}, {
		team: 'HOME',
		time: 220
	}]

	var canvas, ctx, parentNodeWidth, parentPaddingLeft, parentPaddingRight, parentMarginLeft, parentMarginRight, adjustedWidth, xInc, xPos, yPos, periodToPixel, periodLength, groupedAdjusted, reMappedObjArray, reMappedGroupedObjArray, intersectionCount, intersectionSum, intersectionAvg, tempFiltered, team, textX, textY, addActionBtn, timeInput, teamSelect, adjustForSquareCenter;

	function init(lengthOfPeriodInSeconds, canvasID = 'timeline') {
		periodLength = lengthOfPeriodInSeconds;

		canvas = document.getElementById(canvasID);
		ctx = canvas.getContext('2d');

		adjustedWidth = calculateAdjustedWidth();
		canvas.setAttribute('width', adjustedWidth);
		canvas.setAttribute('height', CANVAS_HEIGHT);
		renderTimeline(adjustedWidth);
		renderActions(adjustedWidth);

		window.addEventListener('resize', reSize, false);
		
		//Event listener for the UI button
		addActionBtn = document.getElementById('addActionBtn')
		addActionBtn.addEventListener('click', addActionEvent, false);
	}

	function addAction(timeInSeconds, team) {
		if (typeof team == 'number') {
			team = TEAMS[team];
		}
		
		mockData.push({
			team: team,
			time: timeInSeconds
		});
		renderTimeline(adjustedWidth);
		renderActions(adjustedWidth);
	}
	
	reSize = function (event) {
		adjustedWidth = calculateAdjustedWidth();
		canvas.setAttribute('width', adjustedWidth);
		renderTimeline(adjustedWidth);
		renderActions(adjustedWidth);
	};
	
	addActionEvent = function (event) {
		timeInput = document.getElementById('timeInput').value;
		teamSelect = parseInt(document.getElementById('teamSelect').value);

		if (timeInput > 0 && timeInput <= periodLength && !isNaN(teamSelect)) {
			addAction(timeInput, teamSelect);
		}
	}

	calculateAdjustedWidth = function () {
		//Get parentNode width and adjust for padding/margin
		parentNodeWidth = canvas.parentNode.clientWidth;
		parentPaddingLeft = window.getComputedStyle(canvas.parentNode, null).getPropertyValue('padding-left').match(/\d+/);;
		parentPaddingRight = window.getComputedStyle(canvas.parentNode, null).getPropertyValue('padding-right').match(/\d+/);;
		parentMarginLeft = window.getComputedStyle(canvas.parentNode, null).getPropertyValue('margin-left').match(/\d+/);;
		parentMarginRight = window.getComputedStyle(canvas.parentNode, null).getPropertyValue('margin-right').match(/\d+/);;

		adjustedWidth = parentNodeWidth - (parentPaddingLeft ? parentPaddingLeft : 0) - (parentPaddingRight ? parentPaddingRight : 0) - (parentMarginLeft ? parentMarginLeft : 0) - (parentMarginRight ? parentMarginRight : 0);

		return adjustedWidth;
	}

	drawLineHorizontal = function (pt, strokeS) {
		ctx.strokeStyle = (strokeS == null) ? 'black' : strokeS;
		ctx.lineWidth = 1;
		ctx.beginPath();
		ctx.moveTo(pt.x, pt.y);
		ctx.lineTo(pt.x2, pt.y2);
		ctx.stroke();
		ctx.closePath();
	};

	drawLinesHorizontal = function (width) {

		xInc = width / TOTAL_SECTIONS;
		xPos = 0;

		for (i = 0; i < TOTAL_SECTIONS - 1; i++) {
			xPos += xInc;
			//draw horizontal lines
			drawLineHorizontal({
				x: xPos,
				y: TIMELINE_MARGIN.top + 2,
				x2: xPos,
				y2: (CANVAS_HEIGHT - TIMELINE_MARGIN.bottom - 2)
			}, '#221f1f');
		}
	}

	drawBackground = function (width) {
		ctx.fillStyle = '#d3d3d3';
		ctx.fillRect(TIMELINE_MARGIN.left, TIMELINE_MARGIN.top, width - TIMELINE_MARGIN.left, CANVAS_HEIGHT - TIMELINE_MARGIN.top - TIMELINE_MARGIN.bottom);
	}

	drawAction = function (team, yPos, count) {
		if (team === 'AWAY') {
			ctx.fillStyle = 'rgba(237, 88, 88, 0.92)';
			xPos = 0;
		}
		if (team === 'HOME') {
			ctx.fillStyle = 'rgba(105, 183, 206, 0.92)';
			xPos = 15;
		}
		if (count === 1) {
			ctx.beginPath();
			ctx.moveTo(yPos + DATA_POINT_RADIUS, xPos);
			ctx.lineTo(yPos + DATA_POINT_WIDTH - DATA_POINT_RADIUS, xPos);
			ctx.quadraticCurveTo(yPos + DATA_POINT_WIDTH, xPos, yPos + DATA_POINT_WIDTH, xPos + DATA_POINT_RADIUS);
			ctx.lineTo(yPos + DATA_POINT_WIDTH, xPos + DATA_POINT_HEIGHT - DATA_POINT_RADIUS);
			ctx.quadraticCurveTo(yPos + DATA_POINT_WIDTH, xPos + DATA_POINT_HEIGHT, yPos + DATA_POINT_WIDTH - DATA_POINT_RADIUS, xPos + DATA_POINT_HEIGHT);
			ctx.lineTo(yPos + DATA_POINT_RADIUS, xPos + DATA_POINT_HEIGHT);
			ctx.quadraticCurveTo(yPos, xPos + DATA_POINT_HEIGHT, yPos, xPos + DATA_POINT_HEIGHT - DATA_POINT_RADIUS);
			ctx.lineTo(yPos, xPos + DATA_POINT_RADIUS);
			ctx.quadraticCurveTo(yPos, xPos, yPos + DATA_POINT_RADIUS, xPos);
			ctx.closePath();
			ctx.fill();
		} else {
			//Adjust for square centering
			adjustForSquareCenter = (DATA_POINT_HEIGHT - DATA_POINT_WIDTH) / 2
			
			ctx.fillRect(yPos - adjustForSquareCenter, xPos, DATA_POINT_HEIGHT, DATA_POINT_HEIGHT);
        
        	ctx.textBaseline = "middle";
        	ctx.font = TEXT_STYLE.font;
        	ctx.fillStyle = TEXT_STYLE.fillColor;

        	textX = yPos - adjustForSquareCenter + DATA_POINT_HEIGHT / 2 - ctx.measureText(String(count)).width / 2;
        	textY = xPos + DATA_POINT_HEIGHT / 2;
        	ctx.fillText(String(count), textX, textY);
		}
	}

	renderActions = function (width) {
		//calculate period to pixel ratio
		periodToPixel = width / periodLength;
		groupedAdjusted = groupBasedOnProximity(width);
		for (i = 0; i < groupedAdjusted.length; i++) {
			drawAction(groupedAdjusted[i].team, groupedAdjusted[i].time, groupedAdjusted[i].count);
		}
	}

	renderTimeline = function (width) {
		drawBackground(width);
		drawLinesHorizontal(width);
	}

	groupBasedOnProximity = function (width) {
		periodToPixel = width / periodLength;

		reMappedObjArray = [];
		reMappedGroupedObjArray = [];

		//recalculate every item to match current periodToPixel ratio
		for (i = 0; i < mockData.length; i++) {
			reMappedObjArray.push({
				team: mockData[i].team,
				time: mockData[i].time * periodToPixel
			});
		}

		//check if any datapoint intersect and group. (based on DATA_POINT_WIDTH)
		reMappedGroupedObjArray = filterIntersecting(reMappedObjArray);

		return reMappedGroupedObjArray;
	}

	filterIntersecting = function (arr) {

		tempFiltered = [];

		for (i = 0; i < arr.length; i++) {

			intersectionSum = 0;
			intersectionAvg = 0;
			intersectionCount = 0;
			team = arr[i].team;

			for (j = 0; j < arr.length; j++) {

				if (Math.abs(arr[i].time - arr[j].time) <= DATA_POINT_MERGE_SENSIBILITY && team === arr[j].team) {

					intersectionSum += arr[j].time;
					intersectionCount++;
				}
			}

			intersectionAvg = intersectionSum / intersectionCount;
			if (intersectionAvg != 0) {
				tempFiltered.push({
					team: team,
					time: intersectionAvg,
					count: intersectionCount
				});
			} else {
				tempFiltered.push(arr[i]);
				arr.splice(i, 1);
				i--;
			}
		}

		return tempFiltered;
	}

	//return PUBLIC MEMBERS
	return {
		init: init,
		addAction: addAction
	};
};
