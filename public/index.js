"use strict";

var patt1 = new RegExp("^[a-z0-9]+$", "i");
var patt2 = new RegExp("^[0-9]+$");

function checkInput(i) {
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

function clearInput(i) {
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

    let url = $("#reg").attr("action");
    let account = $("#reg1").val();
    let password = $("#reg2").val();
    let success = true;

    for (let i = 2; i <= 4; i++) {
        success &= checkInput(i);
    }
    if (account.length == 0) {
        $("#err1").html("*Required!");
        return;
    }

    var posting = $.post(url, {
        account: account,
        password: password,
    });

    posting.done(function (data) {
        if (data != "SUCCESS") {
            $("#err1").html("*Account has been registered! QAQ");
        } else if (success) {
            window.alert("Register Success!");
            $(".nav-tabs a:first").tab("show");
            clearInput(1);
        }
    });
}

function login(event) {
    event.preventDefault();

    let url = $("#log").attr("action");
    let account = $("#log1").val();
    let password = $("#log2").val();

    var posting = $.post(url, {
        account: account,
        password: password,
    });

    posting.done(function (data) {
        if (data != "SUCCESS") {
            window.alert("Login Failed! QAQ");
            clearInput(2);
        } else {
            sessionStorage.setItem("account", account);
            sessionStorage.setItem("phone", data);
            window.location.replace("main.html");
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
            clearInput(i);
        });
    }
    
    $("#reg").submit(register);
    $("#log").submit(login);
});