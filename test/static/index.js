"use strict";

var patt1 = new RegExp("^[a-z0-9]+$", "i");
var patt2 = new RegExp("^[0-9]+$");

function check(i) {
    let value = $("#reg" + i).val();

    if (value.length == 0) {
        $("#err" + i).html("*Required!");
        return false;
    }
    switch (i) {
        case 2:
            if (!patt1.test(value)) {
                $("#err2").html("*Invalid format (only upper/lower-case character and number are allowed)");
                return false;
            }
            break;
        case 3:
            if (value != $("#reg2").val()) {
                $("#err3").html("*Password mismatch");
                return false;
            }
            break;
        case 4:
            if (!patt2.test(value)) {
                $("#err4").html("*Invalid format (only number are allowed)");
                return false;
            }
            break;
    }
    return true;
}

function clear(i) {
    switch (i) {
        case 1:
            for (let j = 1; j <= 4; j++) {
                $("#reg" + j).val("");
                $("#err" + j).html("");
            }
            break;
        case 2:
            for (let j = 1; j <= 2; j++) {
                $("#log" + j).val("");
            }
            break;
    }
}

function register(event) {
    event.preventDefault();

    let value = $("#reg1").val();
    let url = $(this).attr("action");
    let success = true;

    for (let i = 2; i <= 4; i++) {
        success &= check(i);
    }
    if (value.length == 0) {
        $("#err1").html("*Required!");
        return;
    }

    var posting = $.post(url, { type: "register", account: value });

    posting.done(function (data) {
        if (data != "SUCCESS") {
            $("#err1").html("*Account has been registered! QAQ");
        } else if (success) {
            $(".nav-tabs a:first").tab("show");
            clear(2);
        }
    });
}

$(document).ready(function () {
    for (let i = 1; i <= 4; i++) {
        $("#reg" + i).focus(function () {
            $("#err" + i).html("");
        });
    }
    for (let i = 1; i <= 2; i++) {
        $("tab" + i).click(function () {
            clear(i);
        });
    }
    $("#reg").submit(register);
});