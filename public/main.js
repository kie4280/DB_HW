"use strict";

function loadProfile() {
    let url = "/get-info";
    let type = "profile";

    let posting = $.post(url, { type: type });

    posting.done(function (data) {
        $("#pro1").html(data.account);
        $("#pro2").html(data.phone);
    });
}

function logout() {
    let url = "/logout-user";

    let posting = $.post(url);
    
    posting.done(function (data) {
        window.location.replace("index.html");
    });
}

function search(event) {
    event.preventDefault();

    let url = "/get-info";
    let type = "shop";

    let shop = $("#sho1").val();
    let city = $("#sho2").val();
    let min_price = $("#sho3").val();
    let max_price = $("#sho4").val();
    let amount = $("#sho5").val();
    let checked = $('#sho7').prop('checked');

    let posting = $.post(url, {
        type: type,
        shop: shop,
        city: city,
        min_price: min_price,
        max_price: max_price,
        amount: amount,
        checked: checked,
    });
    
    posting.done(function (data) {
        $.each(data, function (k, v) {
            $("#table1 > tbody").append(`<tr><td>${v.shop}</td><td>${v.city}</td><td>${v.price}</td><td>${v.amount}</td></tr>`);
        });
    });
}

$(document).ready(function () {
    for (let i = 4; i <= 6; i += 2) {
        $(`#mys${i}`).click(function () {
            $(`#mys${i - 1}`).prop('disabled', false).focus();
        });
    }
    for (let i = 3; i <= 5; i += 2) {
        $(`#mys${i}`).blur(function () {
            this.disabled = true;
        });
    }

    $("#pro1").html("User1");
    $("#pro2").html("0987654321");

    // loadProfile();

    $("#tab3").click(logout);
    $("#sho").submit(search);
});