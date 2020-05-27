var client = io({query: 'module=jd&id='+id});
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