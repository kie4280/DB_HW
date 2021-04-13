"use strict";

var patt1 = new RegExp("^[a-z0-9]+$", "i");
var patt2 = new RegExp("^[0-9]+$");

var check = function (i, url) {
    let value = $("#reg" + i).val();

    if (value.length == 0) {
        $("#err" + i).html("*Required!");
        return false;
    }

    switch (i) {
        case 1:
            let res;

            $.ajax({
                type: "POST",
                url: url,
                async: false,
                data: { account: value },
                success: function (data) {
                    res = data;
                }
            });

            if (res != "SUCCESS") {
                $("#err1").html("*Account has been registered! QAQ");
                return false;
            }
            break;
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

$(document).ready(function () {
    for (let i = 1; i <= 4; i++) {
        $("#reg" + i).focus(function () {
            $("#err" + i).html("");
        });
    }

    $("#reg").submit(function (e) {
        let url = $(this).attr("action");
        let success = true;

        for (let i = 1; i <= 4; i++) {
            success &= check(i, url);
        }

        if (success) {
            $(".nav-tabs a:first").tab("show");
            for (let i = 1; i <= 4; i++) {
                $("#reg" + i).val("");
            }
        }

        e.preventDefault();
    });
});