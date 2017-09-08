/*  
	SkyDrive style image gallery
	Author: Jerome Nelson (Optimization + jQuery plugin)
    	Credits: Florian Maul
*/
(function( window, $, undefined ) {
	var $event = $.event, resizeTimeout;
	$event.special.smartresize = {
		setup: function() {
			$(this).bind( "resize", $event.special.smartresize.handler );
		},
		teardown: function() {
			$(this).unbind( "resize", $event.special.smartresize.handler );
		},
		handler: function( event, execAsap ) {
			var context = this, args = arguments; // Save the context
			event.type = "smartresize"; // set correct event type
			if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
			resizeTimeout = setTimeout(function() {
				jQuery.event.handle.apply( context, args );
			}, execAsap === "execAsap"? 0 : 100 );
		}
	};
	
	$.fn.smartresize = function( fn ) {
		return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
	};
	
	
	$.ThumbList = function(options, element) {
		this.$el= $( element ); 
		this.$id = this.$el[0].id;
		this._init( options );
	};
	
	$.ThumbList.defaults = {
		photoList: [],
		image_height: 'auto'
	};
	
	$.ThumbList.prototype = {
		_photoList: [],
		_selectedIndex: 0,
		_init: function(options) {
			var _this = this;
			this.options = $.extend( true, {}, $.ThumbList.defaults, options );
			options.photoList = options.photoList.slice();
			this._createGallery();
			this._initEvents();// initialize the events
		},
		
		_refresh: function() {
			$(window).resize();
			setTimeout(function(){$(window).scroll()}, 1000);
		},
		_destroy: function() {
		},
		
		_initEvents: function() {
			var instance = this;
			instance._refreshGallery();
			instance._loadImagesInViewPort();
			
			$(window).bind('smartresize', function( event ) {
				instance._refreshSlideView();//lab
				setTimeout(function(){
					if(!$('#'+instance.$id).is(':in-viewport'))return;
					instance._refreshGallery();
				},300);
			});
			
			var previous = "";
			$(window).bind("scroll", function(event) {
				instance._loadImagesInViewPort();
			});			
		},
		_loadImagesInViewPort: function() {
			 if(!$('#'+this.$id).is(':in-viewport'))return;
			 $('#'+this.$id+' li:in-viewport').each(function(i,val) {
				var img = $(val).children(':first').children(':first');
				if(img.attr('src')==undefined || img.attr("src") == '')
					img.attr('src',img.data("src"));
			});		
		},
		
		_createGallery: function() {
			var instance = this;
			$.each(instance.options.photoList, function(index, value){
				instance._createImageElement(instance.$el, instance.options.photoList[index], index);
			});
			
			//lab
			instance._initSlideView();
		},
		_refreshGallery: function() {
			var	instance = this, row = [],len = 0, delta,
				pixelsToRemove, thumbHeight,bigger=0, t_w=0,
				item, rItem,marginsOfImage = 2, last=false, maxwidth=0;
				
			if ( instance.options.image_height == 'auto' )
				thumbHeight = $(window).height() /4;
			else
				thumbHeight = instance.options.image_height;
			maxwidth = this.$el.offsetParent().width()-20;
			$.each(instance.options.photoList, function(index, value){
				item = instance.options.photoList[index];

	 			item.vwidth = item.twidth = item.width;
				item.theight = item.height;
				item.vwidth = item.twidth = ((item.twidth/item.theight) * thumbHeight); 
				item.theight = thumbHeight;
				
				if (bigger==0){bigger++;
					t_w = item.twidth = item.twidth * 2;
					item.vwidth = item.vwidth * 2;
					item.theight = item.theight * 2 + marginsOfImage;
				}
				else if (bigger == 2) {bigger++;
					len=t_w;
				}
				row.push(item);
				len += (item.twidth + marginsOfImage*2 );
				
				last = (index == instance.options.photoList.length - 1) && len < maxwidth;
				if(len > maxwidth || last) {
					if(index==0) bigger++;
					
					delta = len - maxwidth;
					for(var i in row) {
						rItem = row[i];
						pixelsToRemove = last? 0 : delta/(row.length);
						rItem.vx = Math.floor(pixelsToRemove / 2);
						rItem.vwidth = rItem.twidth - pixelsToRemove;
						instance._updateImageElement(rItem); 
					}len = 0; row = [];bigger++;
				}
			});
		},

		_createImageElement: function(parent, item, indx) {
			var imageContainer = $('<li class="imageContainer"/>');
			imageContainer.css("width", item.vwidth+"px");
			imageContainer.css("height", item.theight+"px");
			imageContainer.css("overflow", "hidden");
	
			var link = $('<a href2="'+ item.url +'" class="thumblist-img"/>');
			var img = $("<img/>");
			//img.attr("class", 'thumblist-img');
			img.attr("data-src", item.thumb);
			img.attr("title", item.title);
			img.css("width", "" + item.twidth + "px");
			img.css("height", "" + item.theight + "px");
			img.css("margin-left", "" + (item.vx ? (-item.vx) : 0) + "px");
			img.css("margin-top", "" + 0 + "px");
			img.hide();
			this._createLightBox(link, indx);
			link.append(img);
			imageContainer.append(link);
			img.bind("load", function () { $(this).fadeIn(500); });
	
			parent.append(imageContainer);
			item.el = imageContainer;
			return imageContainer;
		},
		_updateImageElement: function(item) {
			var overflow = item.el;
			var img = overflow.find("img:first");
			overflow.css({
				width: item.vwidth + "px", 
				height: item.theight + "px"});
				
			img.css({ marginLeft: (item.vx ? (-item.vx) : 0) + "px", 
				  marginTop: 0 + "px", 
				  width: item.twidth + "px", 
				  height: item.theight + "px"});
		},

		_showSlider: function() {
			$('body').css({
				'overflow-y': 'hidden',
				'overflow-x': 'auto'//,'': '',
			});
			$('#body1').hide();
			$('#body2').show();
		},
		_hideSlider: function() {
			$('body').css({
				'overflow-y': 'auto',
				'overflow-x': 'hidden'//,'': '',
			});
			$('#body2').hide();
			$('#body1').show();
		},		
		//Crazy slider idea
		_slider_settings: {easing: 'easeInOutExpo', onAfter: function(){
			$('#slide-content li:in-viewport').each(function(i, element){
				el = $(element);
				el.children(':first').attr('src', el.data('src'));
			})		
		}},
		_initSlideView: function() {
			var _this=this, pictures = _this.options.photoList,
				slide_h,img_w=0, img_h=0, slide_cont, total_w=0, margin_l = 6;
				
			$('#body2').empty(); 
			$('#body2').append('<a id="slide-left"></a><a id="slide-right"></a><a id="slide-close">close</a><ul id="slide-content"></ul>');
			
			slide_h = $(window).height();
			slide_cont = $('#slide-content');
			
			$.each(pictures, function(i, val){
				slide_cont.append( 
				$('<li/>').attr({
					'data-src': val.url,
					'data-width': val.width,
					'data-height': val.height
				}).append('<img/>')
				);
			});
			this._initSlideEvents();
		},
		_initSlideEvents: function() {
			var _this = this;
			$('#slide-left').click(function(){
				var prev_el = $($('#slide-content li:in-viewport')[0]).prev();
				if(prev_el.length!=0)
				    $(window).scrollTo(prev_el,800, _this._slider_settings);
			});
			
			$('#slide-right').click(function(){
				var next_el = $($('#slide-content li:in-viewport')[0]).next();
    				if(next_el.length!=0)
    				    $(window).scrollTo(next_el,800,_this._slider_settings);
			});
			$('#slide-close').click(function(){
				_this._hideSlider();
			});
		},

		_refreshSlideView: function(indx) {
			var _this = this, slide_h = $(window).height(), margin_l=10, el, _w, _h, scroll2,
			img_w=0, img_h=0,total_w=0, curr_el =  $($('#slide-content li:in-viewport')[0]);
			
			$('#slide-content li>img').each(function(i, element){
				el = $(element); 
				_w = el.parent().data('width');
				_h = el.parent().data('height');
				
				img_w = (( _w / _h ) * slide_h); 
				img_h = slide_h;			
				el.css({
						'width': img_w + 'px',
						'height': img_h + 'px'});
				total_w += img_w + margin_l;
			});
			$('#slide-content').css('width', total_w+'px' );

			if (indx != undefined)
				scroll2 = $($('#slide-content li:nth-child(' + Number(indx + 1) + ')'));
			else {
				//Getting an error while not full screen s
				scroll2 = curr_el;
			}
				
			setTimeout(function(){$(window).scrollTo(scroll2,0,_this._slider_settings);},0);
		},
		
		//Cheesy Light box stuff		
		_createLightBox: function(link, indx) {
			var _this = this;
			var item = _this.options.photoList[indx];
			link.click(function(){
				//_this._showLightBox(item, indx); //LAB
				$('#slide-bg').show();
				_this._refreshSlideView(indx);
				_this._showSlider();
				
			});
		},
		
		_showLightBox: function(item, indx) {
			var _this = this;
			var lb_html = 	'<div class="lb-pgbg"></div><div class="lb-bg"><div class="lb-cont">' + 
					'<table class="lb-tab"><tbody><tr><td><img class="lb-img" src="IMG_URL"></td><td>TABLE_EXIF'+
					'</td></tr></tbody></table> <div class="lb-cntl"> <a class="lb-prev">&lt;</a> ' + 
					' <a class="lb-close">x</a> <a class="lb-next">&gt;</a>  </div><div></div>'; 
			lb_html = lb_html.replace('IMG_URL', item.url).replace('TABLE_EXIF', _this._toString(item));
			$('body').append(lb_html);
			$('.lb-pgbg,.lb-close').click(function(){
				$('.lb-pgbg').remove();
				$('.lb-bg').remove();
			});
			
			if(indx == 0) $('.lb-prev').hide();
			if(indx == _this.options.photoList.length - 1) $('.lb-next').hide();
			
			$('.lb-next').click(function(){
				item = _this.options.photoList[indx+1];
				jHabitUtil.closeLb();
				_this._showLightBox(item, indx+1);
			});				
			
			$('.lb-prev').click(function(){
				item = _this.options.photoList[indx-1];
				jHabitUtil.closeLb();
				_this._showLightBox(item, indx-1);
			});				
			
			
			$('.lb-bg').hide();
			_this._preload(item.url);
			_this._selectedIndex = indx;		
		},
		
		//Credit: Manuel Ignacio L�pez Quintero
		_preload: function(url){
			var image = new Image();
			var _this = this;
			if(typeof image.addEventListener == 'function')
				image.addEventListener("load",  function(){_this._postLoad();}, false);
			else
				image.attachEvent("onload", function(){_this._postLoad();}, false);
			image.src = url;
		},
		
		_postLoad: function() {
			var _this = this;
			$('.lb-bg').show();
			$('.lb-cont').width( $('.lb-tab').width() + 'px' );
			

		},
		_toString: function(item) {
			
			for(var k in item) {item[k] = item[k]=='-999' ? 'Unknown' : item[k];}
			
			
			var out = '<table class="exif-dat">';
			out += '<tr class="exif-row"><td class="exif-key">Link</td><td class="exif-val"><a target="_blank" href="' +  item.thumb + '">thumb</a> | <a target="_blank" href="' + item.url + '">url</a></td></tr>';
			
			out += '<tr class="exif-row"><td class="exif-key">Time</td><td class="exif-val">' + item.time + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Model</td><td class="exif-val">' + item.model + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Aperture</td><td class="exif-val">' + item.fstp + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Exposure</td><td class="exif-val">' + item.exps + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Flash</td><td class="exif-val">' + item.flash + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Flash Compensation</td><td class="exif-val">' + item.fcmp + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Focal Length</td><td class="exif-val">' + item.flen + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Film Speed</td><td class="exif-val">' + item.iso + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Lens</td><td class="exif-val">' + item.lens + '</td></tr>';
			
			out += '<tr class="exif-row"><td class="exif-key">Distance</td><td class="exif-val">' + item.dist + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Software</td><td class="exif-val">' + item.soft + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Exposure Mode</td><td class="exif-val">' + item.exmd + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Metering Mode</td><td class="exif-val">' + item.metr + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Exposure Program</td><td class="exif-val">' + item.eprg + '</td></tr>';
			out += '<tr class="exif-row"><td class="exif-key">Orientation</td><td class="exif-val">' + item.orin + '</td></tr>';
			
			//for(var k in item) {out += '<tr class="exif-row"><td class="exif-key">' + k + '</td><td class="exif-val">' + item[k] + '</td></tr>';}
			out += '</table>';
			return out;
		}
	};
	
	$.fn.thumbList = function( options ) {
		return new $.ThumbList( options, this );
	};
	
})(window, jQuery);