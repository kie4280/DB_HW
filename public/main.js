"use strict";

function loadProfile() {
    let account = sessionStorage.getItem("account");
    let phone = sessionStorage.getItem("phone");

    $("#pro1").html(account);
    $("#pro2").html(phone);
}

function logout() {
    let url = "/logout";
    let account = sessionStorage.getItem("account");

    sessionStorage.clear();

    $.post(url, { account: account });

    window.location.replace("index.html");
}

$(document).ready(function () {
    for (let i = 4; i <= 6; i += 2) {
        $("#mys" + i).click(function () {
            $("#mys" + (i - 1)).prop('disabled', false).focus();
        });
    }
    for (let i = 3; i <= 5; i += 2) {
        $("#mys" + i).blur(function () {
            this.disabled = true;
        });
    }

    // $("#shop1").hide();
    // $("#shop2").show();

    $("#pro1").html("User1");
    $("#pro2").html("0987654321");

    // loadProfile();

    $("#tab3").click(logout);
});