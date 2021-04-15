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
    loadProfile();

    $("#tab3").click(logout);
});