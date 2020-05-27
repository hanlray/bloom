/**
 * Created by ray on 1/30/2016.
 */
import 'bootstrap';
import $ from "jquery";
import 'jquery-datetimepicker';
import 'jquery-form';
import './style.scss';

$('#startDate').datetimepicker({format: 'Y-m-d H:i'});

$('#jdQuan').ajaxForm({
    success: function(data){
        var href = '/view/' + data.id;
        $('#jdQuan .alert-success a').attr('href', href);
        $('#jdQuan .alert-success').removeClass('d-none');
    }
});