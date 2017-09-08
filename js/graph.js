
// Collection of utility function that initializes and draws Google charts in the page.
//
//
//
// Copyright: Jerome Nelson - 2012
google.load('visualization', '1.0', {'packages':['corechart']});
google.load('visualization', '1.1', {packages: ['controls']});
google.load('visualization', '1', {packages:['table']});
function drawChart(title, el,data, arr) {
	var chart;
	var chartData;
	var control;
	var _thumblist = [];
	var Constructor = function() {
		// Create the data table.
		chartData = new google.visualization.DataTable();		
		chartData.addColumn('string', 'Attribute');
		chartData.addColumn('number', 'Value');		
		chartData.addColumn('number', title);		

		try {
		chartData.addRows(data);
		} catch(err) {alert(title + ': ' + err);}
		
		// Set chart options
		var options = {
			'title' : title,
			'width' : '100%',
			'height': 300
		};
		
		// Instantiate and draw our chart, passing in some options.
		chart = new google.visualization.PieChart(document.getElementById(el));
		
		// Adding a listener to this event should be done before calling the draw() method, 
		// because otherwise the event might be fired before the listener is set up and 
		// you will not catch it.
		google.visualization.events.addListener(chart, 'ready', function(){
			if(!$('#ul_img_' + el).length)
				$('#' + el).append('<ul id="ul_img_' + el + '" class="ul_img_list"></ul>');
		});
		
		chart.draw(chartData, options);

		google.visualization.events.addListener(chart, 'select', function(){
		    	var selection = chart.getSelection();
		    	var indx;
			for (var i = 0; i < selection.length; i++) {
			      	var item = selection[i];
			      	indx = chartData.getFormattedValue(item.row, 0);
			}
			$('#ul_img_' + el).html('');
			if (indx != undefined) {
				$.each(arr, function(key, value) {
					if( (value.mode==undefined || value.mode=='-999'?'Unknown':value.mode) == indx)
						_thumblist[el] = $('#ul_img_' + el).thumbList({photoList: value.srcs, image_height: '72'});
				});
			}
			else {
				_thumblist[el]._destroy();
				$('#ul_img_' + el).remove();
				$('#' + el).append('<ul id="ul_img_' + el + '" class="ul_img_list"></ul>');
			}
		});
	};Constructor();
};



function drawMine(title, el, arr) {
	var chart;
	var chartData;
	var control;
	var data = [];
	var filters = [];
	
	var Constructor = function() {
		
		initiateData();
		createFilter('flen-filter', 'FocalLength');
		createFilter('iso-filter' , 'ISO');
		createFilter('fnum-filter' , 'FNumber');
		
		createFilter('exp-filter' , 'Exposure');
		createFilter('lens-filter' , 'Lens');
		createFilter('soft-filter' , 'Software');
		createFilter('fnum-filter' , 'FNumber');
		createFilter('exmd-filter', 'ExposureMode');
		createFilter('mmde-filter', 'MeteringMode');		
		createFilter('eprg-filter', 'ExposureProgram');		

		// Create a dashboard
		var dashboard = new google.visualization.Dashboard(document.getElementById('dashboard'));
		
        	// Create a pie chart, passing some options
		var chart = new google.visualization.ChartWrapper({
			'chartType': 'Table',
			'containerId': 'mine_1',
			'options': { 
				'allowHtml': true,
				'title' : title,
				'width' : '100%',  
				'height': '95%'   
			}
		});
		
		dashboard.bind(filters, chart);
		dashboard.draw(chartData);
	};
	
	var parseNumberData = function(val) {
		return val == '-999'? 0 : Number(val);
	};
	
	var parseStringData = function(val) {
		return val == '-999'? 'Unknown' : val;
	};
	
	var initiateData = function() {
		chartData = new google.visualization.DataTable();		
		chartData.addColumn('string', 'Thumbnail');
		chartData.addColumn('number', 'ISO');
		chartData.addColumn('number', 'FNumber');		
		chartData.addColumn('string', 'Exposure');		
		chartData.addColumn('number', 'FocalLength');
		chartData.addColumn('string', 'Model');		
		chartData.addColumn('string', 'Make');		
		chartData.addColumn('string', 'Flash');
		chartData.addColumn('string', 'FlashCompensation');		
		chartData.addColumn('datetime', 'CaptureDate');		
		chartData.addColumn('string', 'Lens');
		chartData.addColumn('string', 'Distance');		
		chartData.addColumn('string', 'Software');		
		chartData.addColumn('string', 'ExposureMode');
		chartData.addColumn('string', 'MeteringMode');		
		chartData.addColumn('string', 'ExposureProgram');		

		try {
			$.each(arr, function(key, value) {
				data.push([
					'<img src="'+ value.thumb +'">',
					parseNumberData(value.iso),
					parseNumberData(value.fstp),
					parseStringData(value.exps),
					parseNumberData(value.flen),
					parseStringData(value.model),
					parseStringData(value.make),
					parseStringData(value.flash),
					parseStringData(value.fcmp),
					value.time,
					parseStringData(value.lens),
					parseStringData(value.dist),
					parseStringData(value.soft),
					parseStringData(value.exmd),
					parseStringData(value.metr),
					parseStringData(value.eprg) 
				]);     
			});
			chartData.addRows(data);
		}                       
		catch(err) {alert(title + ': ' + err);}	
	};

	var createFilter = function(f_el, col) {
		$('#filter-container').append('<li><div id="'+ f_el +'"></div></li>');
		filters.push(
		new google.visualization.ControlWrapper({
			'containerId': f_el,
			'controlType': 'CategoryFilter',
			'options': { 
				'filterColumnLabel': col, 
				'ui': {'allowTyping': false,'allowMultiple': false, 'selectedValuesLayout': 'belowStacked'}
			}
		}));	
	};	

	var createDateFilter = function(f_el, col) {
		filters.push(
		new google.visualization.ControlWrapper({
			'containerId': f_el,
			'controlType': 'ChartRangeFilter',
			'options': { 
				'filterColumnLabel': col, 
				'minRangeSize': 86400000,
				'ui': {	
					'chartType': 'LineChart',
         				'chartOptions': {
           					'chartArea': {'width': '90%'},
           					'hAxis': {'baselineColor': 'none'}
           				}
           			}
			}
		}));	
	};	
	
	Constructor();
};