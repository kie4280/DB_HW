"use strict";

function clearInput(i) {
    // 1: register shop / my shop, 2: shop list
    if (i == 1) {
        if ($("#shop-form").length) {
            $("#regs").find("input").val("");
            $("#regs").find("select").val("1");
            $("#regs").find("span").html("");
        }
        if ($("#shop-info").length) {
            $("#mys").find("span").html("");
        }
    } else {
        $("#sho").find("input:not([type=checkbox])").val("");
        $("#sho").find("input[type=checkbox]").prop("checked", false);
        $("#sho").find("select").val("0");
    }
}

function loadUserInfo() {
    let posting = $.post("/get-info", { type: "user-info" });

    posting.done(function (data) {
        $("#pro1").html(data.account);
        $("#pro2").html(data.phone);

        if (data.role != "manager") {
            $("#shop").load(`${components_path}/shop-form.html`, loadShopForm);
        } else {
            $("#shop").load(`${components_path}/shop-info.html`, loadShopInfo);
        }
    });
}

function logout() {
    let posting = $.post("/logout-user");

    posting.done(function (data) {
        window.location.replace("index.html");
    });
}

function search(event) {
    event.preventDefault();

    let posting = $.post("/get-info", {
        type: "shop-list",
        shop: $("#sho1").val(),
        city: $("#sho2").val(),
        min_price: $("#sho3").val(),
        max_price: $("#sho4").val(),
        amount: $("#sho5").val(),
        checked: $('#sho7').prop("checked"),
    });

    posting.done(function (data) {
        $("#table1 > tbody").empty();
        $.each(data.shop, (k, v) => {
            $("#table1 > tbody").append(`<tr id=shop${k}></tr>`);
            $("#table1 > tbody tr:last-child").append(`<td>${v.shop}</td><td>${v.city}</td><td>${v.price}</td><td>${v.amount}</td>`);
        });
    });
}

$(document).ready(function () {
    for (let i = 1; i <= 2; i++) {
        $(`#tab${i}`).click(_ => clearInput(i));
    }

    $("#tab3").click(logout);
    $("#sho").submit(search);

    loadUserInfo();
});