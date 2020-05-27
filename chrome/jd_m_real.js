/**
 * Created by ray on 10/24/13.
 */
(function($){
    function getSocket() {
        if(socket == null) {
            socket = io('http://localhost:8088/api');
            socket.on('captcha', function (data) {
                var src = "data:image/jpg;base64," + data[0];
                $('<form>').submit(function(event){
                    socket.emit('tb-buy/captcha', [$(this).find('.bloomCode').val(), $(this).find('.sessionId').val()]);
                    event.preventDefault();

                    $(this).hide();
                }).append('<img class="bloomCaptcha" src="' + src + '" /><input class="bloomCode" type="text" />' +
                    '<input type="hidden" class="sessionId" value="' + data[1] + '" />'
                ).prependTo($('#bloom-captchaes'));
            });
        }
        return socket;
    }

    var socket;

    $('#cart1').prepend('<div id="bloom-wrap"></div>');
    $('#bloom-wrap').append('<a class="bloom-btn bloom-buynow" >buy</a>');
    $("a.bloom-buynow").click(function(){
        var data = {
            itemId: $("#currentWareId").val()
        };
        var skuId;
        if(skuId) {
            data.skuId = skuId;
        }
        var socket = getSocket();

        socket.emit('jd-buy', {
            params: data
        });
    });

    $(".bloom-buynow").after('<a class="bloom-btn bloom-buylater" >Buy Later</a>');
    $("a.bloom-buylater").click(function(){
        if($('form#bloom-buylater').length) {
            $('form#bloom-buylater').toggle();
            return;
        }
        var price = $('.prod-price .yang-pic-price').text();
        $('#bloom-wrap').prepend('<form id="bloom-buylater" style="margin-bottom:10em;"><input class="price" type="text" value="'+ price +
            '" /><input id="startDate" type="text" /><input type="submit" /></form>');
        jQuery('#startDate').datetimepicker({formatDate: 'Y-m-d'});
        $("form#bloom-buylater").submit(function(event){
            var socket = getSocket();
            var data = {
                params: {
                    itemId: $("#currentWareId").val()
                },
                startDate: $('#startDate').val(),
            };
            var expectedPrice = $(this).find('.price').val();
            if(expectedPrice) data.expectedPrice = expectedPrice;

            socket.emit('jd-buy', data);

            event.preventDefault();
        });
    });

    $('#bloom-wrap').append('<div id="bloom-captchaes"></div>');
})(Zepto);