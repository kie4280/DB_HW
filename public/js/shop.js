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

function register(event) {
    event.preventDefault();

    let success = true;
    for (let i = 3; i <= 4; i++) {
        success &= checkInput(i);
    }
    if (!checkInput(1)) { return; }

    let data = $("#regs").serialize();
    let posting = $.post("/register-shop", data);

    posting.done(function (data) {
        if (!data.status) {
            $("#regs-err1").html("*Shop name has been used! QAQ");
        } else if (success) {
            window.alert("Register Success!");
            $("#shop").empty().load("shop-info.html", loadShopInfo);
        }
    });
}

function loadShopForm() {
    for (let i = 1; i <= 4; i++) {
        $(`#regs${i}`).focus(_ => $(`#regs-err${i}`).html(""));
    }

    $("#regs").submit(register);
}

function loadShopInfo() {
    let posting = $.post("/get-info", { type: "shop-info" });

    posting.done(function (data) {
        $("#mys1").html(data.shop);
        $("#mys2").html(data.city);
        $("#mys3").val(data.price);
        $("#mys5").val(data.amount);

        $.each(data.clerk, (k, v) => {
            let row = `<td>${v.account}</td><td>${v.phone}</td>`;
            let btn = `<td><button type="button" class="btn btn-danger" id="del${k}">Delete</button></td>`;
            $("#table2 > tbody").append(`<tr id="clerk${k}">${row}${btn}</tr>`);
        });
    });

    for (let i = 4; i <= 6; i += 2) {
        $(`#mys${i}`).click(_ => $(`#mys${i - 1}`).prop('disabled', false).focus());
    }
    for (let i = 3; i <= 5; i += 2) {
        $(`#mys${i}`).blur(_ => $(`#mys${i}`).prop('disabled', true));
    }
}