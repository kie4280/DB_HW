"use strict";

function loadProfile() {
    $("#pro1").html(sessionStorage.getItem("account"));
    $("#pro2").html(sessionStorage.getItem("phone"));
}

$(document).ready(function () {
    $("#pro1").html("User1");
    $("#pro2").html("0987654321");
    loadProfile();
});