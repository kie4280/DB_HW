"use strict";

var patt1 = new RegExp("/^[a-z0-9]+$/", "i");
var patt2 = new RegExp("/[0-9]+/");

$(document).ready(function () {
    for (let i = 1; i <= 4; i++) {
        $("#reg" + i).focus(function () {
            $("#err" + i).html("");
        });
    }

    $("#reg").submit(function (e) {
        e.preventDefault();

        if (!patt1.test($("#reg2").val())) {
            $("#err2").html("*Invalid format (only upper/lower-case character and number are allowed)");
        }
        if ($("#reg3").val() != $("reg2").val()) {
            $("#err3").html("*Password mismatch");
        }
        if (!patt2.test($("#reg4").val())) {
            $("#err4").html("*Invalid format (only number are allowed)");
        }
        
        for (let i = 1; i <= 4; i++) {
            if ($("#reg" + i).val().length == 0) {
                $("#err" + i).html("*Required!");
            }
        }
    });
});