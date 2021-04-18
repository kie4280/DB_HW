"use strict";

function clearInput(i) {
    if (i == 1) {
        // register shop
        if ($("#shop1").length) {
            $("#regs").find("input").val("");
            $("#regs").find("select").val("1");
            $("#regs").find("span").html("");
        }
        // my shop
        if ($("#shop2").length) {
            $("#mys").find("span").html("");
        }
    } else {
        // shop list
        $("#sho").find("input:not([type=checkbox])").val("");
        $("#sho").find("input[type=checkbox]").prop("checked", false);
        $("#sho").find("select").val("0");
    }
}

function loadUserInfo() {
    $("#shop").load("shop2.html", loadShopInfo);
    let posting = $.post("/get-info", { type: "user-info" });

    posting.done(function (data) {
        $("#pro1").html(data.account);
        $("#pro2").html(data.phone);

        if (data.role == "manager") {
            $("#shop").load("shop1.html", loadForm);
        } else {
            $("#shop").load("shop2.html", loadShopInfo);
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
        $.each(data.shop, (k1, v1) => {
            $("#table1 > tbody").append("<tr></tr>");
            $.each(v1, (k2, v2) => {
                $("#table1 > tbody tr:last-child").append(`<td>${v2}</td>`);
            });
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