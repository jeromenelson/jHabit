
;function jPicasaApi() {
	var _this = this;
	this.photoList = [];
	this.author = '';
	this.title = '';
	this.profile_pic_url = '';
	this.parseP = function(val) {
		return  (!val || val == null || val == undefined || val == '')? '-999' :  
			(!val.$t || val.$t == null || val.$t == undefined || val.$t == '')? '-999' : val.$t;
	};
	
	this.getImages = function (mode, user, album, imageSize, authKey, callBackSuccess, callBackFail) {
		var api_url =     "http://picasaweb.google.com/data/feed/api/user/jns_user/album/jns_album?alt=json&kind=photo&hl=en_US&imgmax=jns_imagesize&authkey=jns_authkey&callback=?";
		var pic_api_url = "https://picasaweb.google.com/data/feed/api/user/jns_user/album/jns_album/photoid/jns_photo_id?alt=json&authkey=jns_authkey&full-exif=true&callback=?";
		var t,u,pid, author='', counter = 0, photo_element;
		
		_this.photoList.length = 0;
		_this.profile_pic_url = 'https://profiles.google.com/s2/photos/profile/' + user + '?sz=48';
		
		if (mode == 'plus'){
			api_url = api_url.replace('/album/','/albumid/');
			pic_api_url = pic_api_url.replace('/album/','/albumid/');
		}
		api_url = api_url.replace('jns_user', user).replace('jns_album', album).replace('jns_imagesize',imageSize).replace('jns_authkey', authKey);
		
		// To retrieve the complete exif, 2 api calls are mandatory. The first api can get all pictures and its basic EXIFs, the second one
		// is used for granularity. api complexity: O(N)
		$.ajax( { dataType: 'json', timeout : 2000, url: api_url, error: function(){callBackFail();}, success: function(data) {
			_this.album = data.feed.title.$t;
			_this.location = data.feed.gphoto$location.$t;
			_this.author = data.feed.author[0].name.$t;
			
			$.each(data.feed.entry, function(i, element) {
				pid = element["gphoto$id"].$t;
				api_url = pic_api_url.replace('jns_user', user).replace('jns_album', album).replace('jns_photo_id',pid).replace('jns_authkey', authKey);
				$.getJSON( api_url, function(photo_data) {	
					
					if ( $.inArray(element["media$group"]["media$credit"][0].$t, author.split(',')))
						author = author + element["media$group"]["media$credit"][0].$t + ',';
					
					u = element["media$group"]["media$content"][0].url;
					t = u.replace('s'+imageSize,'s300');
					
					photo_element = photo_data.feed["exif$tags"];
					
					//Append to our exif pool
					_this.photoList.push({
						thumb: t,
						url: u, 
						width: element["media$group"]["media$thumbnail"][0].width,
						height: element["media$group"]["media$thumbnail"][0].height,
						twidth: 0, theight: 0, vwidth: 0,
						model: ApiUtil.parseModel(_this.parseP(photo_element["exif$model"])),
						make : ApiUtil.parseMake(_this.parseP(photo_element["exif$make"])),
						fstp : ApiUtil.parseFNumber(_this.parseP(photo_element["exif$fstop"])),
						exps : ApiUtil.parseExposure(_this.parseP(photo_element["exif$exposure"])),
						flash: ApiUtil.parseFlash(_this.parseP(photo_element["exif$flash"])),
						fcmp : ApiUtil.parseFlashComp(_this.parseP(photo_element["exif$FlashCompensation"])),
						flen : ApiUtil.parseFLength(_this.parseP(photo_element["exif$focallength"])),
						iso  : ApiUtil.parseIso(_this.parseP(photo_element["exif$iso"])),
						time : ApiUtil.parseDateTime(_this.parseP(photo_element["exif$time"])),
						lens : ApiUtil.parseLens(_this.parseP(photo_element["exif$Lens"])),
						dist : ApiUtil.parseDistance(_this.parseP(photo_element["exif$distance"])),
						soft : ApiUtil.parseSoftware(_this.parseP(photo_element["exif$Software"])),
						exmd : ApiUtil.parseExpMode(_this.parseP(photo_element["exif$ExposureMode"])),
						metr : ApiUtil.parseMetrMode(_this.parseP(photo_element["exif$MeteringMode"])),
						eprg : ApiUtil.parseExpPrg(_this.parseP(photo_element["exif$ExposureProgram"]))
					});
					//All rows retrieved, return to main. 
					if ( ++counter == data.feed.entry.length ) {
						//_this.author = author.substring(0, author.length-1);
						//_this.author = 
						callBackSuccess();
					}
					
					//Display progress
					ApiUtil.updateProgress(( counter / data.feed.entry.length ) * 100);
				});
			});
		} } );
	};	
};

function jFlickrApi() {
	api_key = '0ae838ddc5ab3ad6e37f1b579fcb7014';
	this.photoList = [];
	this.location = ''; this.author = '';
	
	this.parseF = function(val) {
		return  (!val || val == null || val == undefined || val == '')? '-999' :  
			(!val._content || val._content == null || val._content == undefined || val._content == '')? '-999' : val._content;
	};
	
	this.getFlickrAuthor = function(user, goback) {
		var _this = this, author, api_uri = 'http://api.flickr.com/services/rest/?method=flickr.people.getInfo&api_key=the_api_key&user_id=the_user_id&format=json&jsoncallback=?';
		_this.profile_pic_url='http://flickr.com/buddyicons/'+ user + '.jpg';
		api_uri = api_uri.replace('the_api_key', api_key).replace('the_user_id', user);
		$.ajax( { dataType: 'json', timeout : 2000, url: api_uri, async: true, success: function(data) {
			if(data.person.realname != undefined && data.person.realname._content != '')
				_this.author = data.person.realname._content;
			else if(data.person.username._content != '')
				_this.author = data.person.username._content;
				
			_this.location = data.person.location!=undefined?data.person.location._content:'';
			_this.album = _this.author + '\'s Photostream';
			goback();
		}});
	};
	
	// First api gets the userid, another call to get all pictures IDs. Go through each one and make 2 calls to get EXIF and dimention. 
	// The api for EXIF, returns the data in an array, so one more inner loop to go through each exif and push it into our exif pool. 
	// The calls for the inner loop must be asynch in order to populate the EXIF pool properly. 
	// api Copmlexity O(2 + N*M + N). (N-number of pictures, M-number of exifs)
	this.getFlickrImages = function (flickrUrl, callBackSuccess, callBackFail) {
		var _this = this, user_id='', img_list = {},counter=0, api_uri;
		api_uri = 'http://api.flickr.com/services/rest/?method=flickr.urls.lookupUser&api_key=the_api_key&url=the_flickr_url&format=json&jsoncallback=?';
		api_uri = api_uri.replace('the_api_key', api_key).replace('the_flickr_url', flickrUrl);
		
		$.getJSON(api_uri, function(data){
			if ( data.stat == 'ok') {
				user_id = data.user.id;
				api_uri = 'http://api.flickr.com/services/rest/?format=json&jsoncallback=?&method=flickr.photos.search&per_page=300&api_key=the_api_key&user_id=the_flickr_user&sort=date-taken-desc'
				_this.photoList.length = 0;
				api_uri = api_uri.replace('the_flickr_user', user_id).replace('the_api_key', api_key);
				
				$.getJSON(api_uri, function(data){
					$.each(data.photos.photo, function(i,item){
						var jxhr = [];
						var img_list = {};
						//Async call for exif
						api_uri ='http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=the_api_key&photo_id=the_photo_id&format=json&jsoncallback=?';
						api_uri = api_uri.replace('the_api_key', api_key).replace('the_photo_id', item.id );
						jxhr.push($.getJSON(api_uri, function(meta_data){
							try{$.each(meta_data.photo.exif, function(i,m_item){
								try {switch(m_item.tag) {
									case 'ExposureTime': 
										img_list.exps = ApiUtil.parseExposure(_this.parseF(m_item.raw));
										break;
									case 'FNumber': 
										img_list.fstp = ApiUtil.parseFNumber(_this.parseF(m_item.raw));
										break;
									case 'FocalLength': 
										img_list.flen = ApiUtil.parseFLength(_this.parseF(m_item.raw));
										break;
									case 'ISO': 
										img_list.iso = ApiUtil.parseIso(_this.parseF(m_item.raw));
										break;
									case 'Flash': 
										img_list.flash = ApiUtil.parseFlash(_this.parseF(m_item.raw));
										break;
									case 'Make':
										img_list.make = ApiUtil.parseMake(_this.parseF(m_item.raw));
										break;
									case 'Model':
										img_list.model = ApiUtil.parseModel(_this.parseF(m_item.raw));
										break;
									case 'FlashCompensation':
										img_list.fcmp = ApiUtil.parseFlashComp(_this.parseF(m_item.raw));
										break;
									case 'DateTimeOriginal':
										img_list.time = ApiUtil.parseDateTime(_this.parseF(m_item.raw));
										break;
									case 'Lens':
										img_list.lens = ApiUtil.parseLens(_this.parseF(m_item.raw));
										break;
									case 'ApproximateFocusDistance':
										img_list.dist = ApiUtil.parseDistance(_this.parseF(m_item.raw));
										break;
									case 'Software':
										img_list.soft = ApiUtil.parseSoftware(_this.parseF(m_item.raw));
										break;
									case 'ExposureMode':
										img_list.exmd = ApiUtil.parseExpMode(_this.parseF(m_item.raw));
										break;			
									case 'ExposureProgram':
										img_list.eprg = ApiUtil.parseExpPrg(_this.parseF(m_item.raw));
										break;																								
									case 'MeteringMode':
										img_list.metr = ApiUtil.parseMetrMode(_this.parseF(m_item.raw));
										break;
									case 'OwnerName':
										if ( $.inArray(m_item.raw._content, author.split(',')) == -1 ) {
											if (m_item.raw._content.indexOf('==') == -1 && ApiUtil.containsAllAscii(m_item.raw._content) )
												author = author + m_item.raw._content + ',';
										}
										break;																								
								}}catch(err) {}
							});}catch(err) {}
						}));
						
						//Api for getting thumbnails and dimension 
						api_uri ='http://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=the_api_key&photo_id=the_photo_id&format=json&jsoncallback=?';
						api_uri = api_uri.replace('the_api_key', api_key).replace('the_photo_id', item.id );
						
						//Another asynch call for dimention
						jxhr.push($.getJSON(api_uri, function(meta_data){
							$.each(meta_data.sizes.size, function(i,m_item){
								if (m_item.label == 'Medium') {
									img_list.thumb = m_item.source;
									img_list.width = m_item.width;
									img_list.height = m_item.height;
								}
								if (m_item.label.indexOf('Large') != -1  ) img_list.url = m_item.source;
							});
						}));	
						
						$.when.apply($, jxhr).done(function() {
							_this.photoList.push(img_list);
							if (++counter == data.photos.photo.length) {
								_this.getFlickrAuthor(user_id, callBackSuccess);
								//_this.author = author.substring(0, author.length-1);
								
							}
							ApiUtil.updateProgress( (counter/data.photos.photo.length) * 100.0);
						});
					});
				});				
			}
			else
				callBackFail();
		});

	};
	
};

var ApiUtil = {
	containsAllAscii: function(str) {
    		return  /^[\000-\177]*$/.test(str) ;
	},
	parseExposure: function(val) {
		if (val == '-999') return val;
		if (val.indexOf('.') != -1) {
			//val = val.replace(/[A-Za-z$-]/g, "");	
			//val = jMath.getFraction(val);
		}
		return val;
	},
	parseFNumber: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseFLength: function(val) {
		if (val == '-999') return val;
		val = val.replace(/[A-Za-z$-]/g, "");	
		return val;
	},
	parseIso: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseFlash: function(val) {
		if (val == '-999') 
			val = 'Unknown';
		else if(val == 'true' || val.toLowerCase().indexOf('on') != -1)
			val = 'Flash fired';
		else if(val == 'false' || val.toLowerCase().indexOf('off') != -1 )
			val = 'Flash did not fire';
		else val = 'Unknown'
		return val;
	},
	parseMake: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseModel: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseFlashComp: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseDateTime: function(val) {
		var f_dt = val.split(/[: ]/);
		if (val == '-999') 
			val = new Date(1800,0,1,0,0,0,0);
		else if (!isNaN(val))//For picasa date format
			val = new Date(Number(val));
		else if (f_dt.length >= 6 )  // For Flickr date format
			val = new Date(f_dt[0],f_dt[1],f_dt[2],f_dt[3],f_dt[4],f_dt[5],0);
		else 
			val = new Date(1800,0,1,0,0,0,0);
		return val;
	},
	parseLens: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseDistance: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseSoftware: function(val) {
		if (val == '-999') return val;
		return val;
	},
	parseExpMode: function(val) {
		if (val == '-999') return val;
		else if(val.toLowerCase().indexOf('auto') != -1 || val == '0') val = 'Auto exposure';
		else if(val.toLowerCase().indexOf('manual') != -1 || val == '1') val = 'Manual exposure';
		else if(val.toLowerCase().indexOf('bracket') != -1 || val == '2') val = 'Auto bracket';
		else val = 'Unknown';
		return val;
	},
	parseExpPrg: function(val) {
		if (val == '-999') return val;
		else if(val.toLowerCase().indexOf('manual') != -1 || val == '1') val = 'Manual';
		else if(val.toLowerCase().indexOf('normal') != -1 || val == '2') val = 'Normal program';
		else if(val.toLowerCase().indexOf('aperture') != -1 || val == '3') val = 'Aperture priority';
		else if(val.toLowerCase().indexOf('shutter') != -1 || val == '4') val = 'Shutter priority';
		else if(val.toLowerCase().indexOf('creative') != -1 || val == '5') val = 'Creative program (biased toward depth of field)';
		else if(val.toLowerCase().indexOf('action') != -1 || val == '6') val = 'Action program (biased toward fast shutter speed)';
		else if(val.toLowerCase().indexOf('portrait') != -1 || val == '7') val = 'Portrait mode (for closeup photos with the background out of focus)';
		else if(val.toLowerCase().indexOf('landscape') != -1 || val == '8') val = 'Landscape mode (for landscape photos with the background in focus)';
		else val = 'Unknown';
		return val;
	},
	parseMetrMode: function(val) {
		if (val == '-999') return val;
		else if(val.toLowerCase().indexOf('Unknown') != -1 || val == '0') val = 'Unknown';
		else if(val.toLowerCase().indexOf('average') != -1 || val == '1') val = 'Average';
		else if(val.toLowerCase().indexOf('center-weighted') != -1 || val == '2') val = 'CenterWeightedAverage';
		else if(val.toLowerCase().indexOf('spot') != -1 || val == '3') val = 'Spot';
		else if(val.toLowerCase().indexOf('multi') != -1 || val == '4') val = 'MultiSpot';
		else if(val.toLowerCase().indexOf('pattern') != -1 || val == '5') val = 'Pattern';
		else if(val.toLowerCase().indexOf('partial') != -1 || val == '6') val = 'Partial';
		else val = 'Unknown';
		return val;
	},
	
	
	updateProgress: function(perc) {
		$('#prog-text').text('Loading raw data ...' + perc.toFixed(2) + '%');
		$('#prog-bar').width(perc + '%');
	},
	getURLParameter: function (url, name) {
    		return decodeURI((RegExp(name + '=' + '(.+?)(&|$)').exec(url)||[,null])[1]);
	}
};

var jMath = {
	//http://en.wikipedia.org/wiki/Exposure_value
	exposureValue: function(N,t) {
		return this.logBase2( (N*N)/t );
	},
	
	logBase2: function(val) {
		return Math.log(val) / Math.log(2);
	},
	
	
	// Not used ATM
	// Source copied from http://www.mindspring.com/~alanh/fracs.html
	// Author: Unknown, No license. Free to copy, and provided inline to make it easy to copy.	
	getFraction: function(d) {
		var numerators = [0, 1];
		var denominators = [1, 0];
		
		var maxNumerator = this.getMaxNumerator(d);
		var d2 = d;
		var calcD, prevCalcD = NaN;
		for (var i = 2; i < 1000; i++)  {
			var L2 = Math.floor(d2);
			numerators[i] = L2 * numerators[i-1] + numerators[i-2];
			if (Math.abs(numerators[i]) > maxNumerator) return;
			
			denominators[i] = L2 * denominators[i-1] + denominators[i-2];
			
			calcD = numerators[i] / denominators[i];
			if (calcD == prevCalcD) return;
			
			if( i==3 ) return (Math.abs(numerators[i])+ '/'+ Math.abs(denominators[i]) );
			
			if (calcD == d) return;
			
			prevCalcD = calcD;
			
			d2 = 1/(d2-L2);
		}
		
		return NaN;
	},
	
	getMaxNumerator: function(f)
	{
		try {
		var f2 = null;
		var ixe = f.toString().indexOf("E");
		if (ixe==-1) ixe = f.toString().indexOf("e");
		if (ixe == -1) f2 = f.toString();
		else f2 = f.toString().substring(0, ixe);
		
		var digits = null;
		var ix = f2.toString().indexOf(".");
		if (ix==-1) digits = f2;
		else if (ix==0) digits = f2.substring(1, f2.length);
		else if (ix < f2.length) digits = f2.substring(0, ix) + f2.substring(ix + 1, f2.length);
		
		var L = digits;
		
		var numDigits = L.toString().length;
		var L2 = f;
		var numIntDigits = L2.toString().length;
		if (L2 == 0) numIntDigits = 0;
		var numDigitsPastDecimal = numDigits - numIntDigits;
		
		for (var i=numDigitsPastDecimal; i>0 && L%2==0; i--) L/=2;
		for (var i=numDigitsPastDecimal; i>0 && L%5==0; i--) L/=5;
	}catch(ex){}
		return L;
	}
	
};
