/**
 * Created by ray on 10/24/13.
 */
(function($){
    $('.summary-first').after('<div id="bloom-wrap"></div>');
    $('#bloom-wrap').append('<a class=\"bloom-btn bloomBuy\" >buy</a>');
    $("a.bloomBuy").click(function(){
        var data = {
            skuId: $(".preview-info .follow").attr("data-id")
        };

        var socket = io('https://localhost:8088/jd', {query: 'id=' + uuidv1()});

        socket.emit('buy', data);
        socket.on('done', function(){
            $('#bloom-status').text('已完成');
        });
    });

    $(".bloomBuy").after("<a class=\"bloom-btn bloomBuyLater\" >Buy later</a>");
    $('a.bloomBuyLater').after('<div id="bloom-captchaes"></div>');
    $('#bloom-captchaes').after('<div id="bloom-status"></div>');

    function getSocket() {
        if(socket == null) {
            socket = io('https://localhost:8088/jd');
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
        var price = $('#jd-price').text().substr(1);
        $(this).after('<form id="bloomBuyLater"><input id="price" type="text" value="'+ price +
            '" /><input id="startDate" type="text" /><input type="submit" /></form>');
        $('#startDate').intimidatetime();
        $("form#bloomBuyLater").submit(function(event){
            var socket = getSocket();
            var data = {
                itemId: $("#choose-btn-coll").attr("data-id"),
                startDate: $('#startDate').val(),
                expectedPrice: $('expectedPrice').val()
            };
            socket.emit('buy-jd', data);

            event.preventDefault();
        });
    });
})(jQuery);