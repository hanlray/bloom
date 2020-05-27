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
                ).prependTo($('.bloom-captchaes'));
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

    var getPrice = function() {
        return app.getPage('detail').view.detailModel.data.skuModel.skus[getSkuId()]._price;
    }

    if($('.dt-pro').length) {
        $('div.dgsc-ft').after('<div id="bloom-wrap" class="dgsc-ft">' +
            '<a class="c-btn-orgn bloom-btn bloom-buynow">Buy Now</a>' +
            '<a class="c-btn-orgn bloom-btn bloom-buylater" >Buy later</a>' +
            '<div class="bloom-captchaes"></div>'
        );
        $("a.bloom-buynow").click(function () {
            var data = {
                itemId: app.getPage('detail').view.detailModel.id
            };

            var skuId = getSkuId();
            if (skuId) {
                data.skuId = skuId;
            }
            var socket = getSocket();

            socket.emit('tb-buy', {
                params: data
            });
        });

        //$("div.bloom-buy-wrap").after('<div class="dgsc-ft bloom-buylater-row"></div>');
        //$('div.bloom-buylater-row').after('<div id="bloom-captchaes"></div>');

        $("a.bloom-buylater").click(function () {
            if ($('.buylater-form').length) {
                $('.buylater-form').toggle();
                return;
            }
            $(this).after('<form class="buylater-form"><input class="startdate" type="text" />' +
                '<input type="checkbox" class="is-checkprice" value="true" /><input class="price" type="text" disabled value="'+ getPrice() + '"/>' +
                '<label><input type="checkbox" class="is-pay" value="true" />Is Pay?</label>' +
                '<input type="submit" /></form>');
            $('#bloom-wrap .is-checkprice').change(function(){
                if($(this).prop('checked')){
                    $('#bloom-wrap .price').removeAttr('disabled');
                }else {
                    $('#bloom-wrap .price').attr('disabled', 'disabled');
                }
            });
            jQuery('#bloom-wrap .startdate').datetimepicker();
            $(".buylater-form").submit(function (event) {
                var socket = getSocket();
                var params = {
                    itemId: getItemId(),
                };
                var skuId = getSkuId();
                if (skuId) params.skuId = skuId;

                var data = {
                    params: params,
                    startDate: $('#bloom-wrap .startdate').val(),
                    isPay: $('#bloom-wrap .is-pay').prop('checked')
                };
                if($(this).find('.is-checkprice').prop('checked')) {
                    var expectedPrice = $(this).find('.price').val();
                    if (expectedPrice) data.expectedPrice = expectedPrice;
                }

                socket.emit('tb-buy', data);

                event.preventDefault();
            });
        });
    }
})(Zepto);