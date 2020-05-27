/**
 * Created by ray on 1/30/2016.
 */
function start(){
    var data = {
        params: {
            itemId: buyContext.itemId
        }
    };
    if(!buyContext.isBuyNow)  data.startDate =  $('#startDate').val();
    var expectedPrice = $('#price').val();
    if (expectedPrice) data.expectedPrice = expectedPrice;

    client.emit('buy', data);
    $('#status').text('请求已发出，稍等片刻');
}
if(!buyContext.isBuyNow){
    require('jquery-datetimepicker');
    require('jquery-datetimepicker/jquery.datetimepicker.css');
    $('#startDate').datetimepicker({format: 'Y-m-d H:i'});
    $("button.start").click(function () {
        start();
    });
}

var client = io('/jd', {query: 'id='+buyContext.itemId});
client.on('captcha', function (data){
    //var src = "data:image/jpg;base64," + data[1];
    var src = "data:image/jpg;base64," + data;
    $('<form>').submit(function (event){
        client.emit('captcha', $(this).find('.bloomCode').val());
        event.preventDefault();

        $(this).hide();
    }).append('<img class="bloomCaptcha" src="' + src + '" /><input class="bloomCode" type="text" />')
        .prependTo($('#bloom-captchaes'));
});
client.on('status', function(data){
    $('#status').text(data);
});
client.on('done', function(data){
    $('#status').text('已完成');
});
client.on('connect', function (){
    if (!buyContext.isBuyNow)
        $('button.start').prop('disabled', false);
    else start();
});