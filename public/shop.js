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

function loadForm() {
    for (let i = 1; i <= 4; i++) {
        $(`#regs${i}`).focus(_ => $(`#regs-err${i}`).html(""));
    }
}

function loadShopInfo() {
    let posting = $.post("/get-info", { type: "shop-info" });

    posting.done(function (data) {
        $("#mys1").html(data.shop);
        $("#mys2").html(data.city);
        $("#mys3").val(data.price);
        $("#mys5").val(data.amount);

        $.each(data.clerk, (k1, v1) => {
            $("#table2 > tbody").append(`<tr id="clerk${k1}"></tr>`);
            $.each(v1, (k2, v2) => {
                $("#table2 > tbody tr:last-child").append(`<td>${v2}</td>`);
            });
            $("#table2 > tbody tr:last-child").append(`<td><button type="button" class="btn btn-danger" id="del${k1}">Delete</button></td>`);
        });
    });

    for (let i = 4; i <= 6; i += 2) {
        $(`#mys${i}`).click(_ => $(`#mys${i - 1}`).prop('disabled', false).focus());
    }
    for (let i = 3; i <= 5; i += 2) {
        $(`#mys${i}`).blur(_ => $(`#mys${i}`).prop('disabled', true));
    }
}