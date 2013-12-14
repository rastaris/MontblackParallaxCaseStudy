/* 
 * ----------------------------------------------------------------------------------
 * Parallax Engine by Tiago Reis (rastaris@gmail.com)
 * ----------------------------------------------------------------------------------
 * This Solution Uses a Render Loop (~60fps) (much better than binding scroll events)
 * ----------------------------------------------------------------------------------
 */
 
(function($) {
	

	/*
	 * Vars are defined out off the loop to minimize the use of garbage collector
	 */
	
	// Control Classes
	var parallaxWindowClass = ".parallax-window";
	var parallaxElementClass = ".parallax-element";
	var PARALLAX_ELEMENT_ID_PREFIX = "parallax-element-id-";
	var auxIdClass;
	
	// Parallax Data Attributres
	var PARALLAX_FULL_WIDTH = "data-full-width";
	var PARALLAX_FULL_HEIGHT = "data-full-height";
	var PARALLAX_BG_FILE_WIDTH = "data-bg-img-file-width";
	var PARALLAX_BG_FILE_HEIGHT = "data-bg-img-file-height";

	
	// Register Parallax Windows    		
	var $parallaxRegistry = $(parallaxWindowClass);
	
	// Register for Parallax Elements InitialStates
	var $parallaxElementsInitialStates = new Array();
	
	// Register for Parallax Elements
	var $elementRegistry; 
	
	// Aux Variables
	var i, j, iLen, jLen;
	var prlxWindow, prlxElement, prlxWindowOffset,scrollPosition;
	
	// Animation Variables
	var bottomPositionInBrowserWindow;
	var animationClasses, animationType, animationValue, animationStartInstant, animationEndInstant;
	var initialStateClass, initialStateTop, initialStateLeft, initialStateScaleX, initialStateScaleY;
	var auxClasses, auxStrings, auxInitialState, auxWidth, auxHeight, auxTop, auxLeft, auxCorrection; 
	var k, kLen;
	var previousScrollTop = 0, isAnimatingPageScroll = false; 
	
	// Animation Constants
	var ANIMATION_CLASS_PREFIX = "anim_";
	var INITIAL_STATE_CLASS_PREFIX = "initial_state_";
	var TRANSITION_STRING = "all 1s ease";
	var TRANSITION_FAST_STRING = "all 0s ease";
	
	
	// Element Registration Routine
	for (var i=0; i<$parallaxRegistry.length;i++){
		// The Window 
		var prlxWindow = $parallaxRegistry[i];
		setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
		
		// The Elements
		var prlxElements = $(prlxWindow).children(parallaxElementClass);
		
		for (var j=0; j< prlxElements.length;j++) {
			var prlxElement = prlxElements[j];
			var idNumber = i.toString() + j.toString();
			var idClass = "." + PARALLAX_ELEMENT_ID_PREFIX + idNumber;
			
			// Add Id Class to DOM
			$(prlxElement).addClass(idClass);
			
			// Add Initial State to Register :: TOP_LEFT_WIDTH_HEIGHT
			var top = ($(prlxElement).css("top")).substring(0,$(prlxElement).css("top").length -2 );
			var left = ($(prlxElement).css("left")).substring(0,$(prlxElement).css("left").length -2 );
			$parallaxElementsInitialStates[idNumber] = top + "_" + left + "_" + $(prlxElement).width() + "_" + $(prlxElement).height();
			//alert($parallaxElementsInitialStates[getParallaxElementId($(prlxElement))]);
		}
	}
	
	// Setting Parallax Window Missing Dimension (height or width, accordding to which shall be primarily full)
	function setParallaxWindowMissingDimensionForFullImg(win, anim) {
		// Calculate Height For Full Width Image
		if(coreFunctions.isDefined(win.attr(PARALLAX_FULL_WIDTH))) {
			win.css("background-repeat", "no-repeat");
			
			if(win.attr(PARALLAX_FULL_WIDTH) && win.attr(PARALLAX_BG_FILE_WIDTH) && win.attr(PARALLAX_BG_FILE_HEIGHT)) 
			{
				win.height($(window).innerWidth()*win.attr(PARALLAX_BG_FILE_HEIGHT)/win.attr(PARALLAX_BG_FILE_WIDTH));
				win.width($(window).innerWidth());
			}
		}
		// Calculate Width For Full Height Image
		else if(coreFunctions.isDefined(win.attr(PARALLAX_FULL_HEIGHT))) {
			if(win.attr(PARALLAX_FULL_HEIGHT) && win.attr(PARALLAX_BG_FILE_WIDTH) && win.attr(PARALLAX_BG_FILE_HEIGHT)) {
				win.width($(window).innerHeight() * win.attr(PARALLAX_BG_FILE_WIDTH)/win.attr(PARALLAX_BG_FILE_HEIGHT));
				win.height($(window).innerHeight());
			}
		}
		
	}
	
	
	// Gets the ID that provides access to the initial states
	function getParallaxElementId(el) {
		auxIdClass= el.attr('class');
		if(auxIdClass.indexOf(PARALLAX_ELEMENT_ID_PREFIX)!= -1) {
			auxIdClass= auxIdClass.substring(auxIdClass.indexOf(PARALLAX_ELEMENT_ID_PREFIX));
			auxIdClass= auxIdClass.substring(PARALLAX_ELEMENT_ID_PREFIX.length);
			
			return auxIdClass;
		}
	}
	
	// Resize Function
	$(window).resize(function() {
		// Fix Dimensions For Full Image ParallaxWindows
		for (var i=0; i<$parallaxRegistry.length;i++){
			// The Window 
			var prlxWindow = $parallaxRegistry[i];
			prlxWindow.width($(window).innerWidth());
			setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
		}
	});
	
	// Render Function
	// We will render only on scroll
	// This is because our animation functions take care of smoothness (so no need for 60fps)
	$(window).scroll(function () {
		
		/* I want to animate scroll step
		    $('body').css("transition", TRANSITION_SCROLLBAR_STRING);
		    $('body').css("margin-top", -sT +"px");
		    $('body').on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
				      // Remove the transition property
			   		   $('body').css("transition", "none");
			   		   isAnimatingPageScroll = false;
				    });
		    var strTop = $('body').css("margin-top").toString();
		    //alert(strTop.substring(0,strTop.length-2));
		    $(window).scrollTop(strTop);
		*/
		
		// Loop through Parallax Windows
		for (i=0, iLen=$parallaxRegistry.length; i<iLen; i++) {
			
			// The Window 
			prlxWindow = $parallaxRegistry[i];
			
			// Iterate each Parallax Elment Inside that Window
			 $elementRegistry = $(prlxWindow).children(parallaxElementClass);
			 for (j=0, jLen=$elementRegistry.length; j<jLen; j++) {
				// Animate Element
				prlxElement = $elementRegistry[j];
			    animateParallax($(prlxElement), getAnimationInstant($(prlxWindow)));
			}
		}	
	});	
		
	// GetAnimationInstant
	// The animation span is over when the Parallax window fully leaves the screen OR when the document reaches its end
	// Returns: value >= 0 && value <= 100
	// 0   - parallaxWindow just entered/left the viewport through the BOTTOM (absolute begining of the animation)
	// 100 - parallaxWindow just entered/left the viewport through the TOP (absolute end of the animation)
	function getAnimationInstant(parallaxWindow) {
		// Calculate the position of the parallaxWindow within the browser window
		bottomPositionInBrowserWindow =  parallaxWindow.offset().top + parallaxWindow.height() - window.pageYOffset;
		
		// Document size allows the parallax window to leave the screen
		if( $(document).height() >= parallaxWindow.offset().top + parallaxWindow.height() + window.innerHeight) {
			return 100 - Math.round(bottomPositionInBrowserWindow/(window.innerHeight+parallaxWindow.height())*100);
		}
		// Document size does NOT allow the parallax window to leave the screen
		// Correct Values
		else
		{
			bottomPositionInBrowserWindow =  $(document).height() - window.pageYOffset;

			if (100 - ((bottomPositionInBrowserWindow - window.innerHeight) / parallaxWindow.height()) *100 <0 ) { return 0; }
			else { return Math.round(100 - ((bottomPositionInBrowserWindow - window.innerHeight) / parallaxWindow.height()) *100);}
		}

	}
	
	// Animate Element 
	// Parameter: value >= 0 && value <= 100
	// DOM restriction: elements will only animate if they have one or more animations defined
	function animateParallax(el, value) {
				
		// Get Initial State
		//initialStateClass = el.attr('class').substring(el.attr('class').indexOf(INITIAL_STATE_CLASS_PREFIX));
		auxInitialState = $parallaxElementsInitialStates[getParallaxElementId(el)].split("_");
		// auxInitialState[0] Initial Top
		// auxInitialState[1] Initial Left
		// auxInitialState[2] Initial Width
		// auxInitialState[3] Initial Height
		initialStateTop = parseInt(auxInitialState[0]); 
		initialStateLeft = parseInt(auxInitialState[1]); 
		initialStateScaleX = parseInt(auxInitialState[2]);
		initialStateScaleY = parseInt(auxInitialState[3]);
		
		// Get Animation Details are defined in one or more classes of the element
		// Get all element classes in an array
		auxClasses = el.attr('class').split(" ");
		for(k=0, kLen = auxClasses.length; k < kLen; k++) {
			 // Find Animations
			 if(auxClasses[k].indexOf(ANIMATION_CLASS_PREFIX) != -1) {
				 auxStrings = auxClasses[k].split("_");
				 animationType = auxStrings[1]; 
				 animationValue = parseInt(auxStrings[2]); 
				 animationStartInstant = parseInt(auxStrings[3]);
				 animationEndInstant = parseInt(auxStrings[4]);
				 // Apply Animation
				 animateElement(el,  initialStateTop, initialStateLeft, initialStateScaleX, initialStateScaleY, value, animationType, animationValue, animationStartInstant, animationEndInstant);
				 //alert(animationType + " " + animationValue + " " + animationStartInstant + " " + animationEndInstant);
			 }
			
			
		}

	}
	
	// Animate Function: trials animation and delivers to respective transformation function
	function animateElement(el, initialStateTop, initialStateLeft, initialStateScaleX, initialStateScaleY, animationCurrentInstant, animationType, animationValue, animationStartInstant, animationEndInstant) {
		
		// Trial Animation Type
		switch(animationType) {
		  case "transX":
			 translateX(el, initialStateLeft, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant);
			  break;
		  case "transY":
			 translateY(el, initialStateTop, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant);
			  break;
		  case "scale":
			 scale(el,  initialStateScaleX, initialStateScaleY, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant);
			  break;
		
		}
	}
	
	// Translate XX Transformation
	// CSS Restriction: LEFT must be defined in css class of the element
	function translateX(el,  initialStateLeft, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant) {
		//Limit animation boundaries (with correction o values to make sure animations go from start to end always)
	    auxLeft = initialStateLeft + Math.round((animationCurrentInstant-animationStartInstant)/(animationEndInstant-animationStartInstant)*animationValue);
		
	    if (animationValue <0){
			if(auxLeft > initialStateLeft ) {
				auxLeft = initialStateLeft;
			}
			if(auxLeft < initialStateLeft + animationValue){
				auxLeft = initialStateLeft + animationValue;
			}
		}else{
			if(auxLeft < initialStateLeft ) {
				auxLeft = initialStateLeft;
			}
			if(auxLeft > initialStateLeft + animationValue){
				auxLeft = initialStateLeft + animationValue;
			}
		}
		
	    el.css("transition", TRANSITION_STRING);
	    el.css("left", auxLeft +"px");
	    el.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
		      // Remove the transition property
		      el.css("transition", "none");
		    });
		
	}
	
	// Translate YY Transformation
	// CSS Restriction: TOP must be defined in css class of the element
	function translateY(el,  initialStateTop, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant) {
		//Limit animation boundaries (with correction o values to make sure animations go from start to end always)
		auxTop = initialStateTop + Math.round((animationCurrentInstant-animationStartInstant)/(animationEndInstant-animationStartInstant)*animationValue);	

		if (animationValue <0){
			if(auxTop > initialStateTop ) {
				auxTop = initialStateTop;
			}
			if(auxTop < initialStateTop + animationValue){
				auxTop = initialStateTop + animationValue;
			}
		}else{
			if(auxTop < initialStateTop ) {
				auxTop = initialStateTop;
			}
			if(auxTop > initialStateTop + animationValue){
				auxTop = initialStateTop + animationValue;
			}
		}
		
	    el.css("transition", TRANSITION_STRING);
	    el.css("top", auxTop +"px");
	    el.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
		      // Remove the transition property
		      el.css("transition", "none");
		    });
	}
	
	// Scale Transformation
	// Considers only reductions
	// CSS Restriction 1: WIDTH must be defined in css class of the element
	// CSS Restriction 2: HEIGHT must be defined in css class of the element
	function scale(el,  initialStateScaleX, initialStateScaleY, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant) {
		// Limit animation boundaries (with correction o values to make sure animations go from start to end always)
		auxWidth = initialStateScaleX - initialStateScaleX * Math.round(((animationCurrentInstant-animationStartInstant)/(animationEndInstant-animationStartInstant)*animationValue))/100;
		if (auxWidth > initialStateScaleX) {
			auxWidth = initialStateScaleX;
		}
		else if (auxWidth < initialStateScaleX - initialStateScaleX * animationValue/100){
			auxWidth = initialStateScaleX - initialStateScaleX * animationValue/100;
		}
		
		auxHeight = initialStateScaleY - initialStateScaleY * Math.round(((animationCurrentInstant-animationStartInstant)/(animationEndInstant-animationStartInstant)*animationValue))/100;
		if (auxHeight > initialStateScaleY) {
			auxHeight = initialStateScaleY;
		}
		else if (auxHeight < initialStateScaleY - initialStateScaleY * animationValue/100){
			auxHeight = initialStateScaleY - initialStateScaleY * animationValue/100;
		}
		
		// Apply Transformations
	    el.css("transition", TRANSITION_STRING);
	    el.css("width", auxWidth +"px");
	    el.css("height", auxHeight +"px");
	    el.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
		      // Remove the transition property
		      el.css("transition", "none");
		    });
	}

	// Disable Scroll
	// left: 37, up: 38, right: 39, down: 40,
	// spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
	var keys = [37, 38, 39, 40];

	function preventDefault(e) {
	  e = e || window.event;
	  if (e.preventDefault)
	      e.preventDefault();
	  e.returnValue = false;  
	}

	function keydown(e) {
	    for (var i = keys.length; i--;) {
	        if (e.keyCode === keys[i]) {
	            preventDefault(e);
	            return;
	        }
	    }
	}

	function wheel(e) {
	  preventDefault(e);
	}

	function disable_scroll() {
	  if (window.addEventListener) {
	      window.addEventListener('DOMMouseScroll', wheel, false);
	  }
	  window.onmousewheel = document.onmousewheel = wheel;
	  document.onkeydown = keydown;
	}

	function enable_scroll() {
	    if (window.removeEventListener) {
	        window.removeEventListener('DOMMouseScroll', wheel, false);
	    }
	    window.onmousewheel = document.onmousewheel = document.onkeydown = null;  
	}
	
})(jQuery);