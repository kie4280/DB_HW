"use strict";

function checkInput(i) {
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

function clearInput(i) {
    if (i == 1) {
        $("#regs").find("input").val("");
        $("#regs").find("select").val("1");
    } else {
        $("#sho").find("input:not([type=checkbox])").val("");
        $("#sho").find("input[type=checkbox]").prop("checked", false);
        $("#sho").find("select").val("0");
    }
}

function loadProfile() {
    let posting = $.post("/get-info", { type: "profile" });

    posting.done(function (data) {
        $("#pro1").html(data.account);
        $("#pro2").html(data.phone);
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
        type: "/shop",
        shop: $("#sho1").val(),
        city: $("#sho2").val(),
        min_price: $("#sho3").val(),
        max_price: $("#sho4").val(),
        amount: $("#sho5").val(),
        checked: $('#sho7').prop("checked"),
    });

    posting.done(function (data) {
        $.each(data, (k1, v1) => {
            $("#table1 > tbody").append("<tr></tr>");
            $.each(v1, (k2, v2) => {
                $("#table1 > tbody tr:last-child").append(`<td>${v2}</td>`);
            });
        });
    });
}

$(document).ready(function () {
    for (let i = 3; i <= 5; i += 2) {
        $(`#mys${i + 1}`).click(_ => $(`#mys${i}`).prop('disabled', false).focus());
        $(`#mys${i}`).blur(_ => $(`#mys${i}`).prop('disabled', true));
    }
    for (let i = 1; i <= 4; i++) {
        $(`#regs${i}`).focus(_ => $(`#regs-err${i}`).html(""));
    };

    $("#tab1").click(_ => clearInput(1));
    $("#tab2").click(_ => clearInput(2));

    $("#pro1").html("User1");
    $("#pro2").html("0987654321");

    // loadProfile();

    $("#tab3").click(logout);
    $("#sho").submit(search);
});