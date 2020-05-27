/**
 * Created by ray on 8/14/2015.
 */
KISSY.use('core', function(S){
    var $ = S.Node.all;
    var socket;

    function getSocket() {
        if(socket == null) {
            socket = io('http://localhost:8088');
            socket.on('captcha', function (data) {
                var src = "data:image/jpg;base64," + data[0];
                S.Node('<form>').on('submit', function(event){
                    socket.emit('tmall-buy/captcha', [S.Node(this).one('.bloomCode').val(), S.Node(this).one('.sessionId').val()]);
                    event.halt();

                    S.Node(this).hide();
                }).append('<img class="bloomCaptcha" src="' + src + '" /><input class="bloomCode" type="text" />' +
                    '<input type="hidden" class="sessionId" value="' + data[1] + '" />'
                ).prependTo($('#bloom-captchaes'));
            });
        }
        return socket;
    }

    function getSkuId() {
        return app.product.get('state').skuId;
    }

    var getPrice = function() {
        return app.getPage('detail').view.detailModel.data.skuModel.skus[getSkuId()]._price;
    };

    var insertForm = function(formHtml) {
        $('#bloom-wrap').prepend(formHtml);
    };

    if(S.one('#s-decision-wrapper')) {
        $('div.dgsc-ft').after('<div id="bloom-wrap"><div class="dgsc-ft bloom-buy-wrap">' +
            '<a class="c-btn-orgn bloom-btn bloom-buy" >Buy Now</a></div></div>');
        $("a.bloom-buy").click(function () {
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

        $("div.bloom-buy-wrap").after('<div class="dgsc-ft bloom-buylater-row"><a class="c-btn-orgn bloom-btn bloom-buylater" >Buy Later</a></div>');

        insertForm = function(formHtml){
            $('#bloom-wrap').append(formHtml);
        };
    } else {
        S.DOM.prepend(S.DOM.create('<div id="bloom-wrap"><div id="bloom-captchaes"></div>' +
            '<div class="action-bar mui-flex bloom-buy-row">' +
            '<button class="cell bloom-buy-btn bloom-buynow">Buy Now</button>' +
            '<button class="cell bloom-buy-btn bloom-buylater">' +
            'Buy Later</button></div></div>'), S.DOM.get('#s-actionBar-container'));
        $(".bloom-buynow").on('click', function () {
            var data = {
                itemId: app.product.get('state').id
            };

            var skuId = getSkuId();
            if (skuId) {
                data.skuId = skuId;
            }
            var socket = getSocket();

            socket.emit('tmall-buy', {
                params: data
            });
        });
        getPrice = function() {
            return $('#s-price .mui-price-integer').text();
        }
    }
    $(".bloom-buylater").on('click', function () {
        if(S.one('form#bloom-buylater')) {
            $('form#bloom-buylater').toggle();
            return;
        }

        insertForm('<form id="bloom-buylater" style="margin-bottom:10em;">' +
            '<input class="price" type="text" value="'+ getPrice() +
            '" /><input id="startDate" type="text" />' +
            '<label><input type="checkbox" class="isPay" value="true" />Is Pay?</label><input type="submit" /></form>');
        jQuery('#startDate').datetimepicker();
        $("form#bloom-buylater").on('submit', function(event){
            var params = {
                itemId: app.product.get('state').id
            };

            var skuId = getSkuId();
            if (skuId) {
                params.skuId = skuId;
            }
            var socket = getSocket();
            var data = {
                params: params,
                startDate: $('#startDate').val(),
                isPay: (S.Node(this).one('.isPay').val() === 'true')
            };
            var expectedPrice = S.Node(this).one('.price').val();
            if(expectedPrice) data.expectedPrice = expectedPrice;

            socket.emit('tmall-buy', data);
            event.preventDefault();
        });
    });
});