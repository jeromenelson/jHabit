
// 
//
//Copyright: Jerome Nelson - 2012
//
// TODO:
//	>> plugin destroy not working or not coded?
//	>> Error: problem with lens info on other people's gallery
//	>> Error: check no exif on flickr..
//	>>
//	>>
//	>>
//	>> User / Copyrights [DONE]
//	>> text: Write restriction on Picasa.. [DONE]
//	>> Load flickr user [DONE]
//	>> url errors from flickr and picasa [DONE]
//	>> URL param to automatically load exif [DONE]
//	>> Recent searches using cookie [DONE]
//	>> Google Analytics [DONE]
//	>> AI habbit page [DONE]
//	>> Data mining page [PROGRESS]
//	>> Google plus support [DONE]
//	>> Full screen gallery or LightBox? [DONE]
//	>> Alternate style layout [DONE]
//	>> Change OO [DONE]
//	>> Loading..[DONE]
//	>> Drop down instead of tab [DONE]
//	>> Auto resize iFrame [CANCEL]
//	>> Different graph type? [CANCEL]
//	>> check for no exif data and gray out menus that don't have exifs [CANCEL]
$(function() {	
	$('#profile-header').hide();
	$('#prog-bg').hide();
	$('.exp-coll').hide();
	$('.info-el').hide();
	$('.main-content').hide();
	$('#pic_url').focus();
	
	var jh = new jHabit();
	var list = new cookieList("urls");
	list.init();
	if ( list.items().length != 0)
		$('#pic_url').val(list.items()[list.items().length-1]);
	
	$('#pic_url').keyup(function(){
		var inp = $('#pic_url').val().toLowerCase();
		if ( inp.indexOf('flickr.com') != -1 ) 
			$('#api-type').attr('class','api-flickr');
		else if ( inp.indexOf('picasaweb.google.com') != -1 ) 
			$('#api-type').attr('class','api-picasa');
		else if ( inp.indexOf('plus.google.com') != -1 ) 
			$('#api-type').attr('class','api-gplus');
		else
			$('#api-type').attr('class','');
	});
	
	$('#api-type').click(function(){
		var uri = $('#pic_url').val();
		if ( uri.substring(0,4) != 'http' ) uri = 'http://' + uri;
		window.open(uri, '_blank');
	});
	
	$('#btn_okay').click(function(){
		list.add($('#pic_url').val());
		$('#prog-bg').show();
		$('#prog-text').text('Please wait...');
		$('#prog-bar').width('0px');
		
		$('.stats').remove();
		$('.tab-button-panel').empty();
		jh.go($('#pic_url').val());	

	});

	$("body").mouseup(function(e){
		if(e.target.id != 'url-list') {
			$('#url-list').removeClass('rotate');
			$("#drop-down").slideUp();
		}
		if(e.target.id != 'info-cont') { 
			$('#info-cont').hide();
			$('#info-bg').hide();

		}
	});
	
	$(document).keyup(function(e){
	    	if(e.keyCode === 27) {
				$('.lb-pgbg').remove();
				$('.lb-bg').remove();
				$('#drop-down').slideUp();
				$('#url-list').removeClass('rotate');
				$('.info-el').hide();
				$('#slide-bg').hide();
	        }
	});
	
	$('#url-list').click(function(){
		if(  $('#url-list').hasClass('rotate') ) {
			$('#url-list').removeClass('rotate');
			$('#drop-down').hide();
		}
		else { 
			$('#url-list').addClass('rotate');
			$('#drop-down').hide().slideDown(500);
		}
	});
	
	$('.dd-tr').click(function(){
		$('#pic_url').val($(this).text());
		$('#drop-down').hide();
		$('#url-list').removeClass('rotate');
		$('#pic_url').trigger('keyup');
	});
	
	$('#info').click(function(){
		var info = $('#info-cont');
		if( info.html().length == 0 )
			loadHtml('data/info.html',info);
			
		$('.info-el').show();
	});
	$('.header-bottom').click(function(){
		if ($('.header').css('top')=='-80px')
			jh.showHeader();
		else
			jh.hideHeader();
	});
	
	$('#show-gallery').click(function(){
		$('#exif-content').hide();
		$('#gallery-content').show();
		
		$(this).css('opacity','1');
		$('#show-stats').css('opacity','0.07');
		jh.thumb_list_cntl._refresh();
	});
	
	$('#show-stats').click(function(){
		$('#exif-content').show();
		$('#gallery-content').hide();
		
		$(this).css('opacity','1');
		$('#show-gallery').css('opacity','0.07');
	});	
	
	var urlParam = ApiUtil.getURLParameter(window.location,'url');
	if(urlParam!='null') {
		$('#pic_url').val(urlParam);
		$('#btn_okay').click();
	}
	else {
		$('#pic_url').val('https://picasaweb.google.com/111674152392321836320/Public');
		//$('#pic_url').val('www.flickr.com/photos/samphraim/');
	}
	$('#pic_url').trigger('keyup');

	function loadHtml(file, el){
		$.ajax({
			async: false,
			url: file,
			dataType: "text",
			success: function(data) {el.append(data);}
		});
	}

	
});
	
	
function jHabit() {
	var _this = this;
	var api_data, ret;
	this.thumb_list_cntl = null;
	//Parse the input URI and get necessary data for the API call
	this.go = function(url) {
			var x = url;
			if( x.indexOf('picasaweb.google.com') != -1) {
				x = x.substring(x.indexOf('.com/') + 5, x.length).split('/');
				var usr = x[0];
				var alb = x[1].split('?')[0]; 
				var key = ApiUtil.getURLParameter(x[1], 'authkey');
				
				api_data = (new jPicasaApi());
				api_data.getImages( 'picasa', usr, alb, '1600', key, function(){afterImageRepositoryLoad()}, function(){urlLoadError()});
			}
			else if( x.indexOf('plus.google.com') != -1) {
				x = x.replace('/u/0','');
				x = x.substring(x.indexOf('.com/photos/') + 12, x.length).split('/');
				var usr = x[0];
				var alb = x[2].split('?')[0]; 
				var key = ApiUtil.getURLParameter(x[2], 'authkey');
				key = 'Gv1sRg' + key;
				api_data = (new jPicasaApi());
				api_data.getImages('plus', usr, alb, '1600', key, function(){afterImageRepositoryLoad()}, function(){urlLoadError()});		
			}
			else if( x.indexOf('flickr.com') != -1) {
				api_data = new jFlickrApi();
				api_data.getFlickrImages(url, function(){afterImageRepositoryLoad()}, function(){urlLoadError()});				
				
			}
	};
	
	var urlLoadError = function() {
		alert('Could not retrive exif, please check the url');
		$('#info-bg').hide();
		$('#prog-bg').hide();
		$('#exif-content').empty();
		$('.exp-coll').hide();
	};
	
	this.hideHeader = function() {
		$('.header').animate({'top': '-80px'}, 'slow');
	};
	
	this.showHeader = function() {
		$('.header').animate({'top': '0px'}, 'slow', function(){
			$('.header').show();
		});		
	};
	
	var afterImageRepositoryLoad = function () {
		var arr = api_data.photoList;
		$('#ul_img_gallery').empty();
		$('#gallery-content').hide();
		_this.thumb_list_cntl = $('#ul_img_gallery').thumbList({photoList: arr, image_height: 'auto'});
		
		performDateMine(arr);
		$('#prog-bg').hide();
		$('#exif-content').empty();
		$('.exp-coll').show();
		
		$('#exif-content').show();
		$('#exif-content').append('<div class="exp-coll"><a id="expand-all" title="Expand all"></a><a id="collapse-all" title="Collapse all"></a><br></div');

		
		
		printStats(getStats(arr, 'iso' , 'number'), 'Exposure.ISO', 'chart_iso');
		printStats(getStats(arr, 'exps', 'string'), 'Exposure.Shutter Speed', 'chart_exps');
		printStats(getStats(arr, 'exmd', 'string'), 'Exposure.Mode', 'chart_exmd');
		printStats(getStats(arr, 'eprg', 'string'), 'Exposure.Program', 'chart_eprg');
		printStats(getStats(arr, 'metr', 'string'), 'Exposure.Metering Mode', 'chart_metr');

		printStats(getStats(arr, 'fstp', 'number'), 'Focal.F-Stop', 'chart_fstp');
		printStats(getStats(arr, 'flen', 'number'), 'Focal.Length', 'chart_flen');
		printStats(getStats(arr, 'dist', 'number'), 'Focal.Distance', 'chart_dist');

		printStats(performStyleAnalysis(arr), 'Misc.AI Analysis', 'chart_test');
		drawChartMine(arr);

		printStats(getStats(arr, 'lens', 'string'), 'Model.Lens', 'chart_lens');
		printStats(getStats(arr, 'soft', 'string'), 'Model.Software', 'chart_soft');
		printStats(getStats(arr, 'model', 'string'), 'Model.Camera Model', 'chart_model');

		printStats(getStats(arr, 'month', 'string'), 'Date-Time.Month', 'chart_mnth');
		printStats(getStats(arr, 'timeofday', 'string'), 'Date-Time.Time of Day', 'chart_tod');
		printStats(getStats(arr, 'season', 'string'), 'Date-Time.Season', 'chart_seas');
		printStats(getStats(arr, 'year', 'string'), 'Date-Time.Year', 'chart_year');
		printStats(getStats(arr, 'day', 'string'), 'Date-Time.Day of Week', 'chart_day');
		printStats(getStats(arr, 'mm-yy', 'string'), 'Date-Time.Month-Year', 'chart_ddmm');

		printStats(getStats(arr, 'flash', 'string'), 'Strobe.Flash Fired', 'chart_flash');
		printStats(getStats(arr, 'fcmp', 'string'), 'Strobe.Flash Compensation', 'chart_fcmp');
		
		
		$("a.trigger").click(function () {
		   $(this).next().animate({
			  height: 'toggle', opacity: 'toggle'
			}, "slow");
			$(this).toggleClass("opened");
			return false;
		});	
		
		$('#expand-all').click(function(){
			$("a.trigger").next().fadeIn(1000);
			$("a.trigger").addClass("opened");
		});

		$('#collapse-all').click(function(){
			$("a.trigger").next().fadeOut(200);
			$("a.trigger").removeClass("opened");
		});
		
		var mode = ApiUtil.getURLParameter(window.location,'mode');
		if( mode == 'gallery') {
			$('#show-gallery').trigger('click');
		}
		
		setTimeout(function(){_this.hideHeader()}, 1000);		
	};
	
	var performStyleAnalysis = function(arr) {
		var iso, flash, fstp, flen, exps, eprg;
		var indoor=0, longExp=0, landscape=0, studio=0, architect=0, action= 0, others=0;
		var 	out=[], arr_indoor=[], arr_longExp=[], arr_landscape=[], 
			arr_studio=[], arr_architect=[], arr_action=[], arr_others=[],
			arr_tele=[], arr_bokeh = [], arr_outdoor = [];
		$.each(arr, function(key,value){
			iso = Number(value['iso']);
			fstp = Number(value['fstp']);
			flash = String(value['flash']);
			flen = Number(value['flen']);
			
			exps = eval(value['exps']);
			
			eprg = value['eprg'];
			if(flash.toLowerCase().indexOf('did not')!=-1) flash = 0;
			else if(flash.toLowerCase().indexOf('flash fired')!=-1) flash = 1;
			else flash = -999;
			
			//Ignore the unknowns
			if(isNaN(iso) || iso == -999 || isNaN(fstp) || fstp == -999 || isNaN(flen) || flen == -999 || flash == -999)
				arr_others.push(value);
			if ( jMath.exposureValue(fstp, exps) <= 8 && flash==0 ) arr_indoor.push(value);
			if ( jMath.exposureValue(fstp, exps) >= 12 && iso<=400 && flash==0 ) arr_outdoor.push(value);
			if ( exps >= 2 ) arr_longExp.push(value);
			if ( flen>=135 && exps <= (1/1000) ) arr_action.push(value);
			if ( iso<400 && flash==0 && fstp >= 8 && flen <= 24) arr_landscape.push(value);
			if ( iso <= 200 && exps <= (1/60) && flash==1 ) arr_studio.push(value);
			if ( flen >= 135) arr_tele.push(value);
			if ( (flen<=50 && fstp < 2 )||(flen >= 135 && fstp <= 4) || (flen>=200 && fstp <=6.7) ) arr_bokeh.push(value);
			//else {arr_others.push(value);}
		});
		
		out.push({mode: 'Clasical Lowlight', freq: arr_indoor.length, srcs: arr_indoor, perc: (arr_indoor.length/arr.length) * 100});
		out.push({mode: 'Long Exposure', freq: arr_longExp.length, srcs: arr_longExp, perc: (arr_longExp.length/arr.length) * 100});
		out.push({mode: 'Action', freq: arr_action.length, srcs: arr_action, perc: (arr_action.length/arr.length) * 100});
		out.push({mode: 'Landscape', freq: arr_landscape.length, srcs: arr_landscape, perc: (arr_landscape.length/arr.length) * 100});
		out.push({mode: 'Studio Style', freq: arr_studio.length, srcs: arr_studio, perc: (arr_studio.length/arr.length) * 100});
		out.push({mode: 'Teleporto', freq: arr_tele.length, srcs: arr_tele, perc: (arr_tele.length/arr.length) * 100});
		out.push({mode: 'Bokehlicious', freq: arr_bokeh.length, srcs: arr_bokeh, perc: (arr_bokeh.length/arr.length) * 100});		
		//out.push({mode: 'Others', freq: arr_others.length, srcs: arr_others, perc: (arr_others.length/arr.length) * 100});
		out.push({mode: 'Outdoor/Travel', freq: arr_outdoor.length, srcs: arr_outdoor, perc: (arr_outdoor.length/arr.length) * 100});
		
		out.sort(function(a,b) {
			//if( a.mode == 'Others' || b.mode == 'Others') return -1;
			if (a.freq == b.freq) return 0;
			if (a.freq > b.freq) return -1
			else return 1;
		});
		setHeaders(out);
		return out;
		
	};
	
	var setHeaders = function(out){
		var 	m_greet = ['Howdy', 'Whats up', 'How is it going', 'Welcome', 'Hello', 'Hello', 'Greetings', 'Bonjour'],
			m_appreciate = ['fabulous', 'top drawer', 'top class','crazy good','impressive','stunning','astonishing','exciting',' brilliant',' dazzling','number one', 'first-class','sensational','lovely','striking','phenomenal', 'fantastic', 'outstanding', 'remarkable'],
			m_skill = ['composure', 'technique', 'style', 'approach', 'skill', 'touch', 'tactic', 'execution', 'pattern'],
			ai_message='<br><span id="ai-message">', ai_message_s = 'Your THE_SKILL for ',profile_header='';		
		profile_header = '<span class="title">' + api_data.album + '</span><br>';
		if ( api_data.location != undefined  && $.trim(api_data.location).length != 0 )
			profile_header += '' + api_data.location + '<br>';
		$('#profile-info').empty();
		$('#profile-pic').attr('src', api_data.profile_pic_url);
		$('#profile-info').append(profile_header);
		
		if(out[0].freq > 0) {
			$.each(out, function(index,value){
				if(index == 0)
					ai_message += '<br>THE_GREETINGS THE_AUTHOR!! According to our analysis, you are a THE_APPRICIATE_1 ' + value.mode.toLowerCase() + ' photographer. ';
				else if(index != 0 && value.freq > 0) 
					ai_message_s += value.mode.toLowerCase() + ', '
			});
			if(ai_message_s.length > 19) ai_message = ai_message + ai_message_s.substring(0,ai_message_s.length-2) + ' are THE_APPRICIATE_2.';			
		} else ai_message = '';
		
		ai_message = ai_message
			.replace('THE_GREETINGS', getRandom(m_greet))
			.replace('THE_AUTHOR', api_data.author)
			.replace('THE_SKILL',getRandom(m_skill))
			.replace('THE_APPRICIATE_1',getRandom(m_appreciate))
			.replace('THE_APPRICIATE_2',getRandom(m_appreciate));
			
		$('.exp-coll').after(ai_message + '</span><br><br>');
		$('#profile-header').show();
		$('#show-stats').css('opacity', '1');
		$('#show-gallery').css('opacity', '0.07');	
		
	};
	
	var getRandom = function(arr) {
		return arr[Math.floor(Math.random()*arr.length)];
	};
	
	var performDateMine = function(arr) {
		var monthNames = [ 'January', 'February', 'March', 'April', 'May', 'June',
		    'July', 'August', 'September', 'October', 'November', 'December' ];
		var dayNames = ['Sunday','Monday', 'Tuesday', 'Wenesday', 'Thursday', 'Friday', 'Saturday'];
		var val, mon, hrs;
		$.each(arr, function(key,value){
			val = value['time'];
			
			if ( val == undefined || val.getFullYear() == '1800' ) {
				value['month'] = 'Unknown';
				value['mm-yy'] = 'Unknown'	
				value['year'] = 'Unknown'
				value['day'] = 'Unknown'
				value['season'] = 'Unknown'
				value['timeofday'] = 'Unknown'
				return true; //continue;
			}
						
			mon = val.getMonth();
			hrs = val.getUTCHours();

			value['month'] = monthNames[mon];
			value['mm-yy'] = val.getFullYear() + '-' + monthNames[value['time'].getMonth()];
			value['year'] = '' + val.getFullYear();
			value['day'] = dayNames[val.getDay()];
			
			switch(mon) {
				case 11: case 0: case 1:
					value['season'] = 'Winter';
					break;
				case 2: case 3: case 4:
					value['season'] = 'Spring';
					break;
				case 5: case 6: case 7:
					value['season'] = 'Summer';
					break;
				case 8: case 9: case 10:
					value['season'] = 'Fall';
					break;
			}
			
			if (hrs > 3 && hrs <= 7) value['timeofday'] = 'Early Morning';
			else if(hrs > 7 && hrs <=11) value['timeofday'] = 'Morning';
			else if(hrs > 11 && hrs <=12) value['timeofday'] = 'Noon';
			else if(hrs > 12 && hrs <=16) value['timeofday'] = 'Afternoon';
			else if(hrs > 16 && hrs <=18) value['timeofday'] = 'Evening';
			else if(hrs > 18 && hrs <=22) value['timeofday'] = 'Night';
			else if( (hrs > 22 && hrs <=23) || (hrs > 0 && hrs <=3) ) value['timeofday'] = 'Mid night';
		});
		
		
	};
	
	//Calculate the number of occrance of each exif data
	var getStats = function (arr, indx, typ) {
		var out = [], a = [], i=0, old_val = ''; var objPhotos = [];
		//$.each(photoList,function(key,value){a.push(value[indx]); }); a.sort();
		arr.sort(function(a,b){
		
			var x = (!a[indx] || a[indx] == undefined || a[indx] == null) ? '-999' : a[indx];
			var y = (!b[indx] || b[indx] == undefined || b[indx] == null) ? '-999' : b[indx];
		
			if ( typ == 'number')
			{
				if (parseFloat(x) == parseFloat(y)) { return 0; }
				if (parseFloat(x) > parseFloat(y))return 1;else return -1;
			}
			else
			{
				x = ('' + x).toLowerCase();
				y = ('' + y).toLowerCase(); 
				return ((x < y) ? -1 : ((x > y) ? 1 : 0));
			}
		});
		
		var t;
		$.each(arr,function(key,value){
			if (key == 0)
				old_val = value[indx];
			else if (old_val != value[indx]) {
				t = {};
				t.mode = old_val;
				t.freq = i;
				t.srcs = objPhotos;
				t.perc = ((i/arr.length)*100).toFixed(2); //Calculate percentage - not used atm 
				out.push(t); 
				
				i = 0; //Reset the counter
				objPhotos = []; //Create a new array.
				old_val = value[indx];
			}
			objPhotos.push(value);i++;
			if(key == arr.length - 1 ) {
				t = {};
				t.mode = old_val;
				t.freq = i;
				t.srcs = objPhotos;
				t.perc = ((i/arr.length)*100).toFixed(2); //Calculate percentage - not used atm 
				out.push(t); 
			}
		});
		
	
		return out;
	};
	
	//Send the data to Google chart and render in the screen
	var printStats = function (arr, title, el) {
		var data = [];
		$.each(arr, function(key, value) {
			data.push([
				value.mode == '-999' || value.mode == undefined? 'Unknown' : value.mode,
				Number(value.freq),
				Number(value.mode)
			]);
		}); 
		add2Tree(el, title);
		new drawChart(title.split('.')[1], el, data, arr);
	};	
	
	var drawChartMine = function(arr) {
		add2Tree('chart_mine', 'Misc.Playground');
		$('#chart_mine').append('<div id="dashboard"><ul id="filter-container"></ul><div id="mine_1"></div></div> ');
		new drawMine('The Mine', 'chart_mine_1', arr);	
	};

};

var add2Tree = function(el, title) {
	var p=title.split('.')[0], c=title.split('.')[1];
	
	//check if parent exists else add
	var cont = $('#exif-content a:contains("' + p + '")');
	if( cont.length == 0) {
		$('#exif-content').append('<a class="trigger">'+ p +'</a>');
		$('#exif-content').append('<ul class="level1"></ul><div style="clear:both"></div>');
		cont = $('.level1:last');
	}
	else
		cont = cont.next();
	
	cont.append('<li><a class="trigger">'+ c +'</a><ul class="level2"></ul><div style="clear:both"></div></li>');
	$('.level2:last').append('<li><div class="stats" id="'+ el +'"></div></li>');
			
	
};

//Credit: almog.ori(stackoverflow.com)
var cookieList = function(cookieName) {
	var options = { expires: 7 };  
	var cookie = $.cookie(cookieName);
	var items = cookie ? cookie.split(' ') : new Array();
	return {
		init: function() {
			var el = $('#drop-down');
			$.each(items, function(key, value){
				el.append('<div class="dd-tr">' + value + '</div>');
			});
		},
		add: function(val) {
		    var indx = $.inArray(val, items); 
		    if(indx==-1)  {
			    items.push(val);
			    $.cookie(cookieName, items.join(' '), options);
			    $('#drop-down').append('<div class="dd-tr">' + val + '</div>');
		    }
		},
		remove: function (val) {
			var indx = $.inArray(val, items); 
			if(indx!=-1) items.splice(indx, 1);
			$.cookie(cookieName, items.join(' '), options);
		},
		clear: function() {
		    items = null;
		    $.cookie(cookieName, null);
		},
		items: function() {
		    return items;
		}
	}
}