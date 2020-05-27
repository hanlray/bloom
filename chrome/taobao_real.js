/**
 * Created by ray on 8/14/2015.
 */
(function($){
    var socket;

    function getSkuId() {
        var skuFlag = Hub.config.get('sku').skuFlag;
        var valItemInfo = Hub.config.get('sku').valItemInfo;
        if(skuFlag && valItemInfo.skuMap) {
            return valItemInfo.skuMap[skuFlag];
        }
        return null;
    }

    if($('#J_juValid').length > 0) {
        $('#J_juValid').css('overflow', 'visible');
        $('#J_juValid').append("<a class=\"bloom-btn bloomBuy\" >buy</a>");
        $("a.bloomBuy").click(function(){
            //var selected = jQuery(".J_TSaleProp .tb-selected").attr("data-value");
            var data = {
                itemId: $("#LineZing").attr("itemid")
            };

            var skuId = getSkuId();
            if(skuId) {
                data.skuId = skuId;
            }
            var socket = getSocket();

            socket.emit('tb-buy', {
                module: 'taobao',
                params: data
            });
        });
    }

    $("#J_isku").after("<div><a class=\"bloom-btn bloomBuyLater\" >Buy later</a></div>");
    $('a.bloomBuyLater').after('<div id="bloom-captchaes"></div>');

    function getSocket() {
        if(socket == null) {
            socket = io('http://localhost:8088');
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
    $("a.bloomBuyLater").click(function(){
        if($('#bloomBuyLater').length) {
            $('#bloomBuyLater').toggle();
            return;
        }
        $(this).after('<form id="bloomBuyLater"><input id="startDate" type="text" /><input type="submit" /></form>');
        $('#startDate').intimidatetime();
        $("form#bloomBuyLater").submit(function(event){
            var socket = getSocket();
            var data = {
                itemId: $("#LineZing").attr("itemid"),
                startDate: $('#startDate').val()
            };
            var skuId = getSkuId();
            if(skuId) data.skuId = skuId;


            socket.emit('tb-buy', data);

            event.preventDefault();
        });
    });
})(jQuery);