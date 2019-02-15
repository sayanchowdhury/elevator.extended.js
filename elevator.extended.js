/*
 * Elevator Extended
 *
 * MIT License
 *
 * Copyright (c) 2019 Sayan Chowdhury
 */

var ElevatorExtended = function(options) {
    // Elements
    var body = null;

    // Scroll vars
    var animation = null;
    var duration = null; // ms
    var floor = null;
    var startTime = null;
    var startPosition = null;
    var endPosition = null;
    var targetElement = null;
    var elevating = false;

    var startCallback;
    var mainAudio;
    var endAudio;
    var floorAudio;
    var endCallback;

    var that = this;

    /*
     * Utils
     */

    // Thanks Mr Penner - http://robertpenner.com/easing/
    function easeInOutQuad(t, b, c, d) {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    }

    function extendParameters(options, defaults) {
        for (var option in defaults) {
            var t =
                options[option] === undefined && typeof option !== "function";
            if (t) {
                options[option] = defaults[option];
            }
        }
        return options;
    }

    function startPlayback(audioElem) {
        return audioElem.play();
    }

    function getVerticalOffset(element) {
        var verticalOffset = 0;
        while (element) {
            verticalOffset += element.offsetTop || 0;
            element = element.offsetParent;
        }

        return verticalOffset;
    }

    function animateLoop(time) {
        if (!startTime) {
            startTime = time;
        }

        var timeSoFar = time - startTime;
        var easedPosition = easeInOutQuad(
            timeSoFar,
            startPosition,
            endPosition - startPosition,
            duration
        );

        window.scrollTo(0, easedPosition);

        if (timeSoFar < duration) {
            animation = requestAnimationFrame(animateLoop);
        } else {
            animationFinished();
        }
    }

    function elevate(event) {
        if (elevating) {
            return;
        }

        floor = event.target.id.replace('button-', '');

        elevating = true;
        startPosition = document.documentElement.scrollTop || body.scrollTop;
        updateEndPosition(floor);

        duration = Math.abs(endPosition - startPosition) * 1.5;

        requestAnimationFrame(animateLoop);

        // Start music!
        if (mainAudio) {
            mainAudio.play();
        }

        floorAudio = new Audio('audio/floor' + floor + '.mp3');
        floorAudio.setAttribute("preload", "true");

        if (startCallback) {
            startCallback();
        }
    };

    function browserMeetsRequirements() {
        return (
            window.requestAnimationFrame &&
            window.Audio &&
            window.addEventListener
        );
    }

    function resetPositions() {
        startTime = null;
        startPosition = null;
        elevating = false;
    }

    function updateEndPosition(floor) {
        var targetElement = document.querySelector('#floor-' + floor);
        endPosition = getVerticalOffset(targetElement);
    }

    function animationFinished() {
        resetPositions();

        // Stop music!
        if (mainAudio) {
            mainAudio.pause();
            mainAudio.currentTime = 0;
        }

        if (endAudio) {
            endAudio.play();
        }

        if (floorAudio) {
            floorAudio.play();
        }

        if (endCallback) {
            endCallback();
        }
    }

    function onWindowBlur() {
        // If animating, go straight to the top. And play no more music.
        if (elevating) {
            cancelAnimationFrame(animation);
            resetPositions();

            if (mainAudio) {
                mainAudio.pause();
                mainAudio.currentTime = 0;
            }

            updateEndPosition();
            window.scrollTo(0, endPosition);
        }
    }

    function bindElevateToElement(element) {
        if (element.addEventListener) {
            element.addEventListener("click", elevate, false);
        } else {
            // Older browsers
            element.attachEvent("onclick", function() {
                updateEndPosition();
                document.documentElement.scrollTop = endPosition;
                document.body.scrollTop = endPosition;
                window.scroll(0, endPosition);
            });
        }
    }

    function init(_options) {
		// Take the stairs instead
		if (!browserMeetsRequirements()) {
			return;
        }

        body = document.body;
        var defaults = {
            duration: undefined,
            mainAudio: false,
            endAudio: false,
            preloadAudio: true,
            loopAudio: true,
            startCallback: null,
            endCallback: null,
            element: null,
            targetElement: null,
            floorAudio: null
        };
        _options = extendParameters(_options, defaults);

        if (_options.floors) {
            for (var floor = 0; floor < _options.floors; floor++) {
                var element = document.querySelector('#button-' + floor);
                bindElevateToElement(element);
            }
        }

        if (_options.duration) {
            customDuration = true;
            duration = _options.duration;
        }

        if (_options.targetElement) {
            targetElement = _options.targetElement;
        }

        if (_options.verticalPadding) {
            verticalPadding = _options.verticalPadding;
        }

        window.addEventListener("blur", onWindowBlur, false);

        // Set main elevator music
        mainAudio = new Audio('audio/elevator.mp3');
        mainAudio.setAttribute("preload", _options.preloadAudio);
        mainAudio.setAttribute("loop", _options.loopAudio);

        // Set ding music
        endAudio = new Audio('audio/ding.mp3');
        endAudio.setAttribute("preload", "true");

        if (_options.floorAudio) {
            endAudio = new Audio(_options.floorAudio);
            endAudio.setAttribute("preload", "true");
        }

        if (_options.endCallback) {
            endCallback = _options.endCallback;
        }

        if (_options.startCallback) {
            startCallback = _options.startCallback;
        }
        
    }

    init(options);
};