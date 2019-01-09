//   Copyright (C) 2019
//   Matthias P. Braendli, matthias.braendli@mpb.li
//
//    http://www.opendigitalradio.org
//
//   This file is part of ODR-DabMod.
//
//   ODR-DabMod is free software: you can redistribute it and/or modify
//   it under the terms of the GNU General Public License as
//   published by the Free Software Foundation, either version 3 of the
//   License, or (at your option) any later version.
//
//   ODR-DabMod is distributed in the hope that it will be useful,
//   but WITHOUT ANY WARRANTY; without even the implied warranty of
//   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//   GNU General Public License for more details.
//
//   You should have received a copy of the GNU General Public License
//   along with ODR-DabMod.  If not, see <http://www.gnu.org/licenses/>.
//

function apiRequestChain(uri, get_data, success_callback, fail_callback) {
    $.ajax({
        type: "GET",
        url: uri,
        data: get_data,
        contentType: 'application/json',
        dataType: 'json',

        error: function(data) {
            console.log("GET " + JSON.stringify(get_data) + " error: " + data.responseText);
            fail_callback(data.responseText);
        },
        success: function(data) {
            console.log("GET " + JSON.stringify(get_data) + " success: " + JSON.stringify(data));
            if (data.status == 'ok') {
                success_callback(data.data);
            }
            else {
                fail_callback(data.data);
            }
        },
    });
}

function mark_pending(id) {
    document.getElementById(id).className = "glyphicon glyphicon-refresh glyphicon-refresh-animate";
}

function mark_ok(id, comment) {
    document.getElementById(id).className = "glyphicon glyphicon-ok";

    if (comment) {
        document.getElementById(id + "_comment").innerHTML = comment;
    }
}

function mark_fail(id, reason) {
    var el = document.getElementById(id);
    el.className = "glyphicon glyphicon-remove";
    el.style.color = "#FF3333";

    document.getElementById(id + "_comment").innerHTML = reason;

    var overall = document.getElementById("overall_state");
    overall.style.color = "#FF8833";
    overall.className = "glyphicon glyphicon-alert";
}

function check_rc() {
    mark_pending('is_rc_ok');
    apiRequestChain("/api/parameter",
        {controllable: 'sdr', param: 'freq'},
        function(data) {
            mark_ok('is_rc_ok');
            check_modulating(0);
        },
        function(data) {
            mark_fail('is_rc_ok', JSON.parse(data)['reason']);
        });
}

function check_modulating(last_num_frames) {
    mark_pending('is_modulating');
    apiRequestChain("/api/parameter",
        {controllable: 'sdr', param: 'frames'},
        function(data) {
            if (data > 0) {
                if (last_num_frames == 0) {
                    setTimeout(function() { check_modulating(data); }, 200);
                }
                else {
                    if (data == last_num_frames) {
                        mark_fail('is_modulating', "Frame counter not incrementing: " + data);
                    }
                    else {
                        mark_ok('is_modulating', "Number of frames modulated: " + data);
                        check_dpdce_running();
                    }
                }
            }
            else {
                mark_fail('is_modulating', 'number of frames is 0');
            }
        },
        function(data) {
            mark_fail('is_modulating', data);
        });
}

function check_dpdce_running() {
    mark_pending('is_dpdce_running');
    apiRequestChain("/api/dpd_results",
        {controllable: 'sdr', param: 'frames'},
        function(data) {
            mark_ok('is_dpdce_running', "State: " + data['state']);
            mark_ok('overall_state');
        },
        function(data) {
            mark_fail('is_dpdce_running', JSON.parse(data)['reason']);
        });
}

$(function(){
    setTimeout(check_rc, 20);
});


// ToolTip init
$(function(){
    $('[data-toggle="tooltip"]').tooltip();
});
