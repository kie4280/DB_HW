"use strict";

function checkInput(i) {
    // 1: shop, 3: price, 4: amount
    let value = $(`#regs${i}`).val();

    if (value.length == 0) {
        $(`#regs-err${i}`).html("*Required!");
        return false;
    }
    if (i == 3 || i == 4) {
        if (value < 0) {
            $(`#regs-err${i}`).html("*Input a non-negative number");
            return false;
        }
    }
    return true;
}

function clearInput() {
    if (i == 1) {
        $("#shop").empty();
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

        if (data.role == "manager") {
            $("#shop").load("shop1.html");
        } else {
            $("#shop").load("shop2.html", _ => loadShopInfo());
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
        $.each(data.shop, (k1, v1) => {
            $("#table1 > tbody").append("<tr></tr>");
            $.each(v1, (k2, v2) => {
                $("#table1 > tbody tr:last-child").append(`<td>${v2}</td>`);
            });
        });
    });
}

$(document).ready(function () {
    for (let i = 1; i <= 4; i++) {
        $(`#regs${i}`).focus(_ => $(`#regs-err${i}`).html(""));
    }
    for (let i = 1; i <= 2; i++) {
        $(`#tab${i}`).click(_ => clearInput(i));
    }

    $("#tab3").click(logout);
    $("#sho").submit(search);

    loadUserInfo();
});