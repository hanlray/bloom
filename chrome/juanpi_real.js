/**
 * Created by ray on 8/14/2015.
 */
(function($){
    var socket;

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

    function getItemId() {
        return app.getPage('detail').view.detailModel.id
    }

    function getSkuId() {
        return app.getPage('detail').view.detailModel.skuId;
    }

    $('div.buy_btn').append('<div class="clear bloom-buynow-wrap"><a class="fr bloom-btn bloom-buynow" >Buy Now</a></div>');
    $("a.bloom-buynow").click(function(){
        var data = {
            itemId: $('#div_favorite').attr('data-id')
        };

        var socket = getSocket();

        socket.emit('juanpi-buy', {
            params: data
        });
    });

    $("div.bloom-buy-wrap").after('<div class="dgsc-ft bloom-buylater-row"><a class="c-btn-orgn bloom-btn bloom-buylater" >Buy later</a></div>');
    $('div.bloom-buylater-row').after('<div id="bloom-captchaes"></div>');

    $("a.bloom-buylater").click(function(){
        if($('#bloomBuyLater').length) {
            $('#bloomBuyLater').toggle();
            return;
        }
        $(this).after('<form id="bloomBuyLater"><input id="startDate" type="text" /><input type="submit" /></form>');
        $('#startDate').intimidatetime();
        $("form#bloomBuyLater").submit(function(event){
            var socket = getSocket();
            var data = {
                itemId: getItemId(),
            };
            var skuId = getSkuId();
            if(skuId) data.skuId = skuId;

            socket.emit('tb-buy', {
                params: data,
                startDate: $('#startDate').val()
            });

            event.preventDefault();
        });
    });
})(Zepto);