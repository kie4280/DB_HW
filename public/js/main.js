"use strict";

function clearInput(i) {
  // 1: register shop / my shop, 2: shop list
  if (i == 1) {
    $("#regs").find("input").val("");
    $("#regs").find("select").val("1");
    $("#regs").find("span").html("");

    $("#mys").find("input:not([disabled])").val("");
    $("#mys").find("span").html("");
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

    if (data.isManager) {
      $("#shop").load("shop-info.html", loadShopInfo);
    } else {
      $("#shop").load("shop-form.html", loadShopForm);
    }
  });
}

function loadCity() {
  let posting = $.post("/get-info", { type: "city" });

  posting.done(function (data) {
    $("#sho2").empty().append(`<option value="0" selected>All</option>`);
    $.each(data, function (k, v) {
      $("#sho2").append(`<option value="${k}">${v}</option>`);
    });
  });
}

function logout() {
  let posting = $.post("/logout-user");
  window.location.replace("index.html");
}

function search(event) {
  event.preventDefault();

  $("#sho6 > span").css("display", "inline-block");
  let posting = $.post("/get-info", $("#sho").serialize() + "&type=search");

  posting.done(function (data) {
    $("#sho6 > span").css("display", "inline-block");
    $("#table1 > tbody").empty();
    $.each(data, function (k, v) {
      $("#table1 > tbody").append(
        `<tr id="shop${k}"><td>${v.shop}</td><td>${v.city}</td><td>${v.price}</td><td>${v.amount}</td></tr>`
      );
    });
  });
}

$(document).ready(function () {
  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }

  $("#tab3").click(logout);
  $("#sho").submit(search);

  loadProfile();
  loadCity();
});
