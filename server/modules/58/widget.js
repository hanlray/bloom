/**
 * Created by ray on 1/14/2016.
 */
(function($){
    //$('select#image').imagepicker();//should do this in the content script as this script loaded first
    //require('jquery-validation');
    var form = $('#post58');
    form.validate({
        rules: {
            title: {
                minlength: 6,
                maxlength: 30,
                required: true
            },
            description: {
                minlength: 1,
                maxlength: 1000,
                required: true
            }
        },
        highlight: function (element) {
            $(element).closest('.form-group').addClass('has-error');
        },
        unhighlight: function (element) {
            $(element).closest('.form-group').removeClass('has-error');
        },
        errorElement: 'span',
        errorClass: 'help-block',
        errorPlacement: function (error, element) {
            if (element.parent('.input-group').length) {
                error.insertAfter(element.parent());
            } else {
                error.insertAfter(element);
            }
        }
    });
    $('#categories').cascadingDropdown({
        selectBoxes: [
            {
                selector: '.catTop',
                paramName: 'top'
            },
            {
                selector: '.catLevel2',
                requires: ['.catTop'],
                source: '/58/categories'
            }
        ]
    });
    var uuid = require('node-uuid');
    var client = io('/58', {query: 'id=' + uuid.v1()});
    client.on('connect', function(){
        $('button.start').prop('disabled', false);
    });
    client.on('done', function(data){
        $('#status').text('已完成');
    });
    $("button.start").click(function(){
        if(!form.valid()) return;
        client.emit('58-post', {
            title: $('#title').val(),
            description: $('#description').val(),
            price: $('#price').val(),
            category: $('.catTop').val(),
            catLevel2: $('.catLevel2').val(),
            image: $('#image').val()
        });
    });
})(jQuery);