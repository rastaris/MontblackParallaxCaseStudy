/* 
 * ----------------------------------------------------------------------------------
 * Parallax Engine by Tiago Reis (rastaris@gmail.com)
 * ----------------------------------------------------------------------------------
 * No need for render loop (less 60 iterations per second)
 * Responsive
 * Smooth animations with css transitions 
 * ----------------------------------------------------------------------------------
 */
 
(function($) {
	
	/*-----------------------------------------------------------------------------------*/
	/*
	 * 
	 * Constants 
	 * 
	 * 
	 */
	
	// Parallax CSS Classes
	var PARALLAX_WINDOW_CLASS = ".parallax-window";   
	var PARALLAX_ELEMENT_CLASS = ".parallax-element";
	var PARALLAX_ELEMENT_ID_PREFIX = "parallax-element-id-"; //change to data-atribute
	
	// Parallax Data Attributres
	var PARALLAX_FULL_WIDTH = "data-full-width";
	var PARALLAX_FULL_HEIGHT = "data-full-height";
	var PARALLAX_BG_FILE_WIDTH = "data-bg-img-file-width";
	var PARALLAX_BG_FILE_HEIGHT = "data-bg-img-file-height";
	
	// Animation Constants
	var ANIMATION_CLASS_PREFIX = "anim_";
	var INITIAL_STATE_CLASS_PREFIX = "initial_state_";
	var TRANSITION_STRING = "all 1s ease";
	var TRANSITION_FAST_STRING = "all 0.8s ease";
	
	// To Solve Percentage Heighs in Android Browsers
	// Android browsers resize the window when the browser Top bar (URL) disapears
	var ua = navigator.userAgent.toLowerCase();
	var IS_ANDROID = ua.indexOf("android") > -1;
	var DEVICE_ORIENTATION = getCurrentDeviceOrientation(); 
	var DEVICE_ORIENTATION_CHANGED = false;
	var PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT = "data-window-initial-width-portrait";     //SECTION DO IT FOR ALL SECTIONS NOT JUST PARALLAX WINDOWS
	var PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT = "data-window-initial-height-portrait";
	var PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE = "data-window-initial-width-landscape";     //SECTION DO IT FOR ALL SECTIONS NOT JUST PARALLAX WINDOWS
	var PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE = "data-window-initial-height-landscape";
	
	/*-----------------------------------------------------------------------------------*/
	
	/*
	 * 
	 * Vars 
	 * * Defined out off the functions in order to
	 * * to minimize the use of garbage collector
	 * 
	 */
	
	var auxIdClass;
	
	// Register Parallax Windows    		
	var $parallaxRegistry = $(PARALLAX_WINDOW_CLASS);
	
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
	var auxClasses, auxStrings, auxInitialState, auxWidth,auxFinalWidth, auxHeight, auxFinalHeight, auxTop, auxLeft, auxCorrection; 
	var k, kLen;
	var previousScrollTop = 0, isAnimatingPageScroll = false; 
	var iTransitions, iTransitionsLen;
	
	/*-----------------------------------------------------------------------------------*/
	
	/*
	 * 
	 * Parallax Windows and Parallax Element Registration Routine
	 * 
	 */
	
	for (var i=0; i<$parallaxRegistry.length;i++){
		// The Window 
		var prlxWindow = $parallaxRegistry[i];
		
		// Calulate Height for Parallax Windows with Full Width Images in the BG 
		setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
		
		//Store Initial Height and Width of each window (To prevent resizing in Android)
		if (DEVICE_ORIENTATION == "portrait") {
			$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT, $(prlxWindow).width());
			$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT, $(prlxWindow).height());
		}
		else if (DEVICE_ORIENTATION == "landscape") {
			$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE, $(prlxWindow).width());
			$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE, $(prlxWindow).height());
		} 
		
		// The Elements
		var prlxElements = $(prlxWindow).children(PARALLAX_ELEMENT_CLASS);
		
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
		
			    win.css("transition", TRANSITION_FAST_STRING);
			    win.css("height", $(window).innerWidth()*win.attr(PARALLAX_BG_FILE_HEIGHT)/win.attr(PARALLAX_BG_FILE_WIDTH) +"px");
			    win.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
				      // Remove the transition property
				      win.css("transition", "none");
				    });
			    
				//win.height($(window).innerWidth()*win.attr(PARALLAX_BG_FILE_HEIGHT)/win.attr(PARALLAX_BG_FILE_WIDTH));
				//win.width($(window).innerWidth());
			}
		}
		// TODO: //REDO FULL HEIGHT PARADIGM (STILL MAKES SENSE) height(100%) width(100%)
		// Need to force Height Though
		else {
			/*win.children(parallaxElementClass).each(function () {
				alert("sWinWidth:" + $(window).innerWidth() + "PwinW:"  + win.width() + " Element w:" +$(this).width());
				if(win.width() == $(this).width()) {
					$(this).width()
					} 
				});
				*/
				//win.height($(window).innerHeight());
			//}
		}
		
		/*win.css("transition", TRANSITION_FAST_STRING);
	    win.css("width", $(window).innerWidth()+"px");
	    win.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
		      // Remove the transition property
		      win.css("transition", "none");
		    });
		 */
		//win.width($(window).innerWidth());
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
	// This function is mostly dedicated to android browsers ( avoid unwanted document sizes generated by 
	// the browser url Bar (that appears and disapears changing the window size)
	// The one component that is not dedicated to android only, is : setParallaxWindowMissingDimensionForFullImg($(prlxWindow)); 
	// TODO: Clean the code in this function
	// Try not to declare vars inside (because of the garbage collector)
	// not fully solved (when changing orientation with the url bar gone, the dimension % is bigger than when the bar ispresent)
	
	$(window).resize(function() {
		//Has Device Orientation Changed ? 
		DEVICE_ORIENTATION_CHANGED = (DEVICE_ORIENTATION != getCurrentDeviceOrientation());
		//alert(DEVICE_ORIENTATION_CHANGED);
		// Fix Dimensions ParallaxWindows
		for (var i=0; i<$parallaxRegistry.length;i++){
			// The Window 
			var prlxWindow = $parallaxRegistry[i];
			
			//IF ANDROID && DEVICE ORIENTATION DOES NOT CHANGE
			if(IS_ANDROID && !DEVICE_ORIENTATION_CHANGED) {
				// Keep always in the initial state 
				// Prevents abrupt resizes in Android (Generated when the Browser URL bar leaves or enters the screen)
				if (getCurrentDeviceOrientation() == "portrait") {
					$(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT));
					$(prlxWindow).height($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT));
				} else if (getCurrentDeviceOrientation() == "landscape") {
					$(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE));
					$(prlxWindow).height($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE));
				}
				setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
			}
			//IF ANDROID && DEVICE ORIENTATION DOES CHANGE
			else if (IS_ANDROID && DEVICE_ORIENTATION_CHANGED) {
			    // Store Initial Height and Width of each window (To prevent resizing in Android)
				// This Simulates a reload, regarding only the computation of the section sizes
				
				if (getCurrentDeviceOrientation() == "portrait") {
					
					if(!coreFunctions.isDefined($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT))
						&& !coreFunctions.isDefined($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT))) {
						
						$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT, $(window).innerWidth());
					    $(prlxWindow).width($(window).innerWidth());
					    setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
					    $(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT, $(prlxWindow).height());
					    //alert("defining android PORTRAIT initial state")
					}
					else {
						 $(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT));
						 $(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT));
						 setParallaxWindowMissingDimensionForFullImg($(prlxWindow)); // not needed here i believe
						 //alert("applying android PORTRAIT initial state")
					}
				    
				
				}
				else if (getCurrentDeviceOrientation() == "landscape") {
					
					if(!coreFunctions.isDefined($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE))
							&& !coreFunctions.isDefined($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE))) {
							
							$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE, $(window).innerWidth());
						    $(prlxWindow).width($(window).innerWidth());
						    setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
						    $(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE, $(prlxWindow).height());
						    //alert("defining android LANDSCAPE initial state")
						}
						else {
							 $(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE));
							 $(prlxWindow).width($(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE));
							 setParallaxWindowMissingDimensionForFullImg($(prlxWindow)); // not needed here i believe
							 //alert("applying android LANDSCAPE initial state")
						}
					    
					/*$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE, $(window).innerWidth());
				    $(prlxWindow).width($(window).innerWidth());
				    setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
				    $(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE, $(prlxWindow).height());
				    */
				}
			}
			// Making sure FullScreen Elements do not occupy more or less space than they need
			else  { 
				setParallaxWindowMissingDimensionForFullImg($(prlxWindow));
			}
			//prlxWindow.width($(window).innerWidth());
		}
		// After all elements are fixed (if the fix resulted from android and orientation changed)
		if (IS_ANDROID && DEVICE_ORIENTATION_CHANGED) {
			DEVICE_ORIENTATION_CHANGED = false;
			DEVICE_ORIENTATION = getCurrentDeviceOrientation();
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
			 $elementRegistry = $(prlxWindow).children(PARALLAX_ELEMENT_CLASS);
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
			 scaleSmart(el,  initialStateScaleX, initialStateScaleY, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant);
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
	
	
	function scaleSmart(el,  initialStateScaleX, initialStateScaleY, animationCurrentInstant, animationValue, animationStartInstant, animationEndInstant) {
				
			auxWidth= getPropertyValueForPercentageBasedTransformations(initialStateScaleX, animationValue, animationCurrentInstant, animationStartInstant, animationEndInstant);
			auxHeight= getPropertyValueForPercentageBasedTransformations(initialStateScaleY, animationValue, animationCurrentInstant, animationStartInstant, animationEndInstant);
			executeCSSTransition(el,[["width",auxWidth +"px"], ["height", auxHeight +"px"]]);
	}
	
	/*
	 * 
	 * Getting a tranformed value based on a percentage base transformation
	 * -----------------------------------------------------------------------------------------------------------
	 * Corrects and normalizes current instant according to the animation interval defined
	 * currentInstant = 0 means that the Parallax Window just entered the screen
	 * curentInstant = 100 means that the Parallax Window just left the screen or the document reached its end
	 *   
	 */
	
	function getPropertyValueForPercentageBasedTransformations(initialState, animationFinalPercentage, currentInstant, startInstant, endInstant) {
		
		// Calculate Final Value
		var auxFinalValue = initialState * animationFinalPercentage/100;
		var auxPredictedValue = initialState + (auxFinalValue - initialState)/100 * currentInstant;
		
		// Making sure the Animation executes only within the defined interval
		if (currentInstant >= startInstant && currentInstant <= endInstant) {
			// Normalize current instant according to the Animation Interval
			currentInstant = startInstant + (endInstant-startInstant)*(currentInstant/100);
			auxPredictedValue = initialState + (auxFinalValue - initialState)/100 * currentInstant;
		}
		else if (currentInstant < startInstant) {
			auxPredictedValue = initialState;
		}
		else if  (currentInstant > endInstant) {
			auxPredictedValue =  auxFinalValue;
		}
		
		return auxPredictedValue;
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
		executeCSSTransition(el,[["width",auxWidth +"px"], ["height", auxHeight +"px"]]);
				
	   /* el.css("transition", TRANSITION_STRING);
	    el.css("width", auxWidth +"px");
	    el.css("height", auxHeight +"px");
	    el.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
		      // Remove the transition property
		      el.css("transition", "none");
		    });
		 */
	}
	
	
	// Execute CSS Transition
	function executeCSSTransition(el, propertyValuePairArray) {
		  el.css("transition", TRANSITION_STRING);
		  // Aply All transitions
		  for (iTransitions=0, iTransitionsLen= propertyValuePairArray.length; iTransitions < iTransitionsLen; iTransitions++){
			  //alert(propertyValuePairArray[iTransitions][0] +"   -    " + propertyValuePairArray[iTransitions][1]);
			  el.css(propertyValuePairArray[iTransitions][0], propertyValuePairArray[iTransitions][1]);
		  }
		  el.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
			      // Remove the transition property
			      el.css("transition", "none");
		  });
	}

	/*
	 * 
	 * Keyboard
	 * left: 37, up: 38, right: 39, down: 40,
	 * spacebar: 32, pageup: 33, pagedown: 34, end: 35, home: 36
	 * 
	 */
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
	
	/*
	 * 
	 * Device
	 * 
	 */
	
	// Get Device orientation based on the screen size
	function getCurrentDeviceOrientation() {
		//alert("w: " + window.innerWidth + " ::: h:" + window.innerHeight + " ori: " + (window.innerHeight > window.innerWidth));
		return (window.innerHeight > window.innerWidth) ? "portrait" : "landscape";
	}
	
})(jQuery);