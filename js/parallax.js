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
	/*-----------------------------------------------------------------------------------*/
	
	// Parallax CSS Classes
	var PARALLAX_CLASS_WINDOW = ".parallax-window";   
	var PARALLAX_CLASS_ELEMENT = ".parallax-element";
	var PARALLAX_CLASS_ELEMENT_ID_PREFIX = "parallax-element-id-"; //change to data-atribute
	
	// Parallax Data Attributres
	var PARALLAX_DATA_WINDOW_BG_IMG_FULL_WIDTH = "data-full-width";
	var PARALLAX_DATA_WINDOW_BG_IMG_FULL_HEIGHT = "data-full-height";
	var PARALLAX_DATA_WINDOW_BG_FILE_WIDTH = "data-bg-img-file-width";
	var PARALLAX_DATA_WINDOW_BG_FILE_HEIGHT = "data-bg-img-file-height";
	
	// Animation Constants
	var ANIMATION_DATA = "data-animations";
	var ANIMATION_TRANSITION = "all 1s ease";
	var ANIMATION_TRANSITION_FAST = "all 0.8s ease";
	
	
	// To Solve Percentage Heighs in Android Browsers
	// Android browsers resize the window when the browser Top bar (URL) disapears
	var ua = navigator.userAgent.toLowerCase();
	var DEVICE_IS_ANDROID = ua.indexOf("android") > -1;
	var DEVICE_ORIENTATION = getCurrentDeviceOrientation(); 
	var DEVICE_ORIENTATION_CHANGED = false;
	var PARALLAX_WINDOW_INITIAL_WIDTH = "data-window-initial-width";
	var PARALLAX_WINDOW_INITIAL_HEIGHT = "data-window-initial-height";
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
	/*-----------------------------------------------------------------------------------*/
	
	var auxIdClass;
	
	// Register Parallax Windows    		
	var $parallaxRegistry = $(PARALLAX_CLASS_WINDOW);
	
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
	var auxClasses, auxStrings, auxAnimationInitialStates, auxWidth,auxFinalWidth, auxHeight, auxFinalHeight, auxTop, auxLeft, auxCorrection; 
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

		// Register initial size of the window
		$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH, $(prlxWindow).width());
		$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT, $(prlxWindow).height());
		
		
		
		// To prevent resizing in Android (fixes glich when $(window).innerHeight() changes due to the url bar showing or not)
		if(DEVICE_IS_ANDROID) {
			//Store Initial Height and Width of each window 
			if (DEVICE_ORIENTATION == "portrait") {
				$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_PORTRAIT, $(prlxWindow).width());
				$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_PORTRAIT, $(prlxWindow).height());
			}
			else if (DEVICE_ORIENTATION == "landscape") {
				$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_WIDTH_LANDSCAPE, $(prlxWindow).width());
				$(prlxWindow).attr(PARALLAX_WINDOW_INITIAL_HEIGHT_LANDSCAPE, $(prlxWindow).height());
			} 
		}
		
		// The Elements
		var prlxElements = $(prlxWindow).children(PARALLAX_CLASS_ELEMENT);
		
		for (var j=0; j< prlxElements.length;j++) {
			var prlxElement = $(prlxElements[j]);
			var idNumber = i.toString() + j.toString();
			var idClass = "." + PARALLAX_CLASS_ELEMENT_ID_PREFIX + idNumber;
			
			// Add Id Class to DOM
			prlxElement.addClass(idClass);
			
			// Store Initial States for each property that is animated in the element
			$parallaxElementsInitialStates[idNumber] = new Array();
			var elementAnimations = getAllAnimationsForElement(prlxElement);
			
			if(coreFunctions.isDefined(elementAnimations)) {
				for (var k=0; k < elementAnimations.length; k++) {
					var animationParameters = getAnimationDefinitionValues(elementAnimations[k]);
					// TODO: TRIAL THE UNITY (PX,EM,WHATEVER, and Store it) r
					// At the moment the engine will assume the unit is always PX
					$parallaxElementsInitialStates[idNumber][k] = [ animationParameters.cssProperty, prlxElement.css(animationParameters.cssProperty).substr(0,prlxElement.css(animationParameters.cssProperty).length-2)];
					//alert($parallaxElementsInitialStates[idNumber][k][0] + " " + $parallaxElementsInitialStates[idNumber][k][1]);
				}
			}
		}
	}
	
	// Setting Parallax Window Missing Dimension (height or width, accordding to which shall be primarily full)
	function setParallaxWindowMissingDimensionForFullImg(win, anim) {
		// Calculate Height For Full Width Image
		if(coreFunctions.isDefined(win.attr(PARALLAX_DATA_WINDOW_BG_IMG_FULL_WIDTH))) {
			win.css("background-repeat", "no-repeat");
			
			if(win.attr(PARALLAX_DATA_WINDOW_BG_IMG_FULL_WIDTH) && win.attr(PARALLAX_DATA_WINDOW_BG_FILE_WIDTH) && win.attr(PARALLAX_DATA_WINDOW_BG_FILE_HEIGHT)) 
			{
			    win.css("transition", ANIMATION_TRANSITION_FAST);
			    win.css("height", $(window).innerWidth()*win.attr(PARALLAX_DATA_WINDOW_BG_FILE_HEIGHT)/win.attr(PARALLAX_DATA_WINDOW_BG_FILE_WIDTH) +"px");
			    win.on("webkitTransitionEnd transitionend msTransitionEnd oTransitionEnd", function(){
				      // Remove the transition property
				      win.css("transition", "none");
				    });
			}
		}
		// TODO: //REDO FULL HEIGHT PARADIGM (STILL MAKES SENSE- Especialy for phones in portrait) height(100%) width(100%)
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
		if(auxIdClass.indexOf(PARALLAX_CLASS_ELEMENT_ID_PREFIX)!= -1) {
			auxIdClass= auxIdClass.substring(auxIdClass.indexOf(PARALLAX_CLASS_ELEMENT_ID_PREFIX));
			auxIdClass= auxIdClass.substring(PARALLAX_CLASS_ELEMENT_ID_PREFIX.length);
			
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
			if(DEVICE_IS_ANDROID && !DEVICE_ORIENTATION_CHANGED) {
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
			else if (DEVICE_IS_ANDROID && DEVICE_ORIENTATION_CHANGED) {
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
		if (DEVICE_IS_ANDROID && DEVICE_ORIENTATION_CHANGED) {
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
			 $elementRegistry = $(prlxWindow).children(PARALLAX_CLASS_ELEMENT);
			 for (j=0, jLen=$elementRegistry.length; j<jLen; j++) {
				// Animate Element
				prlxElement = $elementRegistry[j];
			    animateParallax($(prlxElement), getAnimationInstant($(prlxWindow)));
			}
		}	
	});	
		
	// GetAnimationInstant
	// The animation span is over when the Parallax window fully leaves the screen OR when the document reaches its end/beginning
	// Returns: value >= 0 && value <= 100
	// 0   - parallaxWindow just entered/left the viewport through the BOTTOM (absolute begining of the animation)
	// 100 - parallaxWindow just entered/left the viewport through the TOP (absolute end of the animation)
	function getAnimationInstant(parallaxWindow) {
		// Calculate the position of the parallaxWindow within the browser window
		bottomPositionInBrowserWindow =  parallaxWindow.offset().top + parallaxWindow.height() - window.pageYOffset;
		
		// Document size allows the parallax window to leave the screen
		// Through the top and bottom
		// Condittion: The following 2
		// Animation Time is Normalized by default 
		// [0..100] corresponds to [0..100]

		// TODO: WRITE CODE AND TEST 
		
		// Document size allows the parallax window to leave the screen		
		// Through the top 
		// Condition: if( $(document).height() >= parallaxWindow.offset().top + parallaxWindow.height() + window.innerHeight)
		// Animation Time Should be Normalized
		// [x..100] corresponds to [0..100]

		// TODO: WRITE CODE AND TEST
		
		// Document size allows the parallax window to leave the screen
		// Through the bottom  
		// Condition:
		// Animation Time Should be Normalized
		// [0..x] corresponds to [0..100]
		
		// TODO: WRITE CODE AND TEST
		
		// Document size does not allow the parallax window to leave the screen
		// Condition:
		// Animation Time Should be Normalized
		// [x..y] corresponds to [0..100]
		
		// TODO: WRITE CODE AND TEST
		
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
	function animateParallax(el, currentInstant) {
				
		// Get Initial State Set
		var animationInitialStates = $parallaxElementsInitialStates[getParallaxElementId(el)];
		var animationSetString = el.attr(ANIMATION_DATA);
		
		if (coreFunctions.isDefined(animationInitialStates) && coreFunctions.isDefined(animationSetString)){
			var animationSet = animationSetString.split(";");
			animateElement(el, currentInstant, animationInitialStates, animationSet);
		}
	}
	
	// Get All Animations For a Particular Element
	function getAllAnimationsForElement(el) {
		
		var animationSetString = el.attr(ANIMATION_DATA);
		if (coreFunctions.isDefined(animationSetString)) {
			return animationSetString.split(";");
		}
	}
	
	// Get Animation Definition Values
	// Animation Format: (css property, percentageValue[0..infinity], startInstant[0..100], endInstant[0..100]
	function getAnimationDefinitionValues(animation) {
		
		animation = animation.substr(1, animation.length -2);
		var animation_parameters = animation.split(",");		
		return { 
			   "cssProperty": animation_parameters[0], 
			   "percentageValue": parseInt(animation_parameters[1]), 
			   "startInstant" : parseInt(animation_parameters[2]),  
			   "endInstant" : parseInt(animation_parameters[3]),
			   "reference" : animation_parameters[4]
		}; 
		
	}
	
	
	/*
	 *
	 * Animate a css property of an element
	 * Animation Format: (css property, percentageValue[0..infinity], startInstant[0..100], endInstant[0..100]
	 * 
	 */
	
	function animateElement(el, currentInstant, initialStates, animationSet) {
		
		var elementAnimationsArray = new Array();
		// Go Through Each Animation
		for (var i =0; i< initialStates.length; i++) {
			//alert(auxAnimationInitialStates[i].toString());
			var initialState = [initialStates[i][0], initialStates[i][1]];
			var animation = getAnimationDefinitionValues(animationSet[i]);
			
			/*
			 * According to the type off css property select
			 * getPropertyValue with one of the references (SELF, PARENT-HEIGHT, PARENT-WIDTH);
			 * 
			 */
			
			var auxValue = getPropertyValueForPercentageBasedTransformations(el, initialState[1], currentInstant, animation.percentageValue, animation.startInstant, animation.endInstant, animation.reference);
			elementAnimationsArray[i] = [animation.cssProperty , auxValue + "px"];

		}
		
		//var auxValue= getPropertyValueForPercentageBasedTransformations(initialState, percentageValue, currentInstant, startInstant, endInstant);
		executeCSSTransition(el, elementAnimationsArray);
	}

	/*
	 * 
	 * Getting a tranformed value based on a percentage base transformation (REFERING TO SELF, PARENT-HEIGHT, PARENT-WIDTH)
	 * -----------------------------------------------------------------------------------------------------------
	 * Corrects and normalizes current instant according to the animation interval defined
	 * currentInstant = 0 means that the Parallax Window just entered the screen
	 * curentInstant = 100 means that the Parallax Window just left the screen or the document reached its end
	 *   
	 */
	
	function getPropertyValueForPercentageBasedTransformations(el, initialState, currentInstant, animationFinalPercentage, startInstant, endInstant, referenceDimension) {
		var auxFinalValue; 
		var auxPredictedValue; 
		var initialStateInt = parseInt(initialState);
		
		// Making sure the Animation executes only within the defined interval
		if (currentInstant >= startInstant && currentInstant <= endInstant) {
			// Normalize current instant according to the Animation Interval
			currentInstant = startInstant + (endInstant-startInstant)*(currentInstant/100);
		}
		
		alert(referenceDimension);
		
		switch(referenceDimension) {
		
			case "self":
				auxFinalValue = initialStateInt * animationFinalPercentage/100;
				auxPredictedValue = initialStateInt + (auxFinalValue - initialStateInt)/100 * parseInt(currentInstant);
				auxPredictedValue = applyIntervalCorrection(currentInstant,initialStateInt,startInstant,endInstant, auxPredictedValue, auxFinalValue);
				break;
				
			case "parent_width":
				auxFinalValue = initialStateInt  + parseInt(el.parent().attr(PARALLAX_WINDOW_INITIAL_WIDTH)) * animationFinalPercentage/100;
				alert(auxFinalValue);
				auxPredictedValue = initialStateInt + (auxFinalValue - initialStateInt)/100 * currentInstant;
				auxPredictedValue = applyIntervalCorrection(currentInstant,initialStateInt, startInstant,endInstant, auxPredictedValue, auxFinalValue);
				break;
			
			case "parent_height":
				auxFinalValue = initialStateInt + parseInt(el.parent().attr(PARALLAX_WINDOW_INITIAL_HEIGHT)) * animationFinalPercentage/100;
				auxPredictedValue = initialStateInt + (auxFinalValue - initialStateInt)/100 * currentInstant;
				auxPredictedValue = applyIntervalCorrection(currentInstant,initialStateInt,startInstant,endInstant, auxPredictedValue, auxFinalValue);
				break;
			
			default: //self
				auxFinalValue = initialStateInt * animationFinalPercentage/100;
				auxPredictedValue = initialStateInt + (auxFinalValue - initialStateInt)/100 * currentInstant;
				auxPredictedValue = applyIntervalCorrection(currentInstant,initialStateInt,startInstant,endInstant, auxPredictedValue, auxFinalValue);
				break;
		
		}
		
		return auxPredictedValue;
	}
	
	function applyIntervalCorrection(currentInstant,initialStateInt,startInstant,endInstant, auxPredictedValue, auxFinalValue) {
		
		if (currentInstant < startInstant) {
			return initialStateInt;
		}
		else if  (currentInstant > endInstant) {
			return auxFinalValue;
		}
		
		return auxPredictedValue;
	}
	
	// Execute CSS Transition
	function executeCSSTransition(el, propertyValuePairArray) {
		  el.css("transition", ANIMATION_TRANSITION);
		  // Aply All transitions
		  for (iTransitions=0, iTransitionsLen= propertyValuePairArray.length; iTransitions < iTransitionsLen; iTransitions++){
			//  alert(propertyValuePairArray[iTransitions][0] +"   -    " + propertyValuePairArray[iTransitions][1]);
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