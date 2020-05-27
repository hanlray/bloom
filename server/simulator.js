window.simulator = (function(){
    var emitTouchEvent = function(type, element, x, y) {
        var event = document.createEvent('Event'),
        touch = { pageX: x, pageY: y, target: element }
        event.initEvent('touch'+type, true, true)
        event.touches = [touch]
        element.dispatchEvent(event)
    };

    return {
        tap: function(element) {
            emitTouchEvent('start', element, 5, 5);
            emitTouchEvent('end', element, 5, 5);
        },
        click_h5: function(element) {
            var event = new Event('click');
            element.dispatchEvent(event);
        },
        click: function(element){
            var event = document.createEvent('MouseEvents');
            event.initEvent("click", true, true);
            element.dispatchEvent(event);
        },
        input: function(element){
            var event = document.createEvent('Event');
            event.initEvent('input', true, true);
            element.dispatchEvent(event);
        },
        input_h5: function(element){
            var event = new Event('input');
            element.dispatchEvent(event);
        }
    }
})();
