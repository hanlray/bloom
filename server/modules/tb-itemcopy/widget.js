/**
 * Created by ray on 1/30/2016.
 */

var client = io({query: 'id=' + bloomContext.id});
client.on('info', function(info){
    $('#console').append('<div class="info">' + info + '</div>');
});
client.on('captcha', function (data){
    //var src = "data:image/jpg;base64," + data[1];
    var src = "data:image/jpg;base64," + data;
    $('<form>').submit(function (event){
        client.emit('captcha', $(this).find('.bloomCode').val());
        event.preventDefault();
    }).append('<img class="bloomCaptcha" src="' + src + '" /><input class="bloomCode" type="text" />')
        .appendTo('#console');
});
client.on('smsCode', function(){
    $('<form>').submit(function (event){
        client.emit('smsCode', $(this).find('.smsCode').val());
        event.preventDefault();
    }).append('<input class="smsCode" type="text" />')
        .appendTo('#console');    
});