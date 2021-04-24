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
  if (!checkInput(1)) {
    return;
  }

  $("#regs5 > span").css("display", "inline-block");
  let posting = $.post("/register-shop", $("#regs").serialize());

  posting.done(function (data) {
    $("#regs5 > span").css("display", "none");
    if (!data.status) {
      $("#regs-err1").html("*Shop name has been used! QAQ");
    } else if (success) {
      window.alert("Register Success!");
      $("#shop").empty().load("shop-info.html", loadShopInfo);
    }
  });
}

function loadShop() {
  let posting = $.post("/get-info", { type: "shop" });

  posting.done(function (data) {
    $("#mys1").html(data.shop);
    $("#mys2").html(data.city);
    $("#mys3").val(data.price);
    $("#mys5").val(data.amount);
  });
}

function loadClerk() {
  let posting = $.post("/get-info", {
    type: "clerk",
    account: $("#mys7").val(),
  });

  posting.done(function (data) {
    $("#table2 > tbody").empty();
    $.each(data, function (k, v) {
      $("#table2 > tbody").append(
        `<tr id="clerk${k}"><td>${v.account}</td><td>${v.phone}</td>
         <td><button type="button" class="btn btn-danger" id="del${k}">Delete</button></td></tr>`
      );
    });
  });
}

function deleteClerk() {
  let btn = $(this);

  let posting = $.post("/delete-clerk", {
    account: btn.parents("tr").find("td:first"),
  });

  posting.done(function (data) {
    btn.parents("tr").remove();
  });
}

function loadShopForm() {
  for (let i = 1; i <= 4; i++) {
    $(`#regs${i}`).focus(function () {
      $(`#regs-err${i}`).html("");
    });
  }

  $("#regs").submit(register);
}

function loadShopInfo() {
  for (let i = 4; i <= 6; i += 2) {
    $(`#mys${i}`).click(function () {
      $(`#mys${i - 1}`)
        .prop("disabled", false)
        .focus();
    });
  }
  for (let i = 3; i <= 5; i += 2) {
    $(`#mys${i}`).blur(function () {
      $(`#mys${i}`).prop("disabled", true);
    });
  }

  $("#table2").on("click", "td button", deleteClerk);
  $("#mys8").click(loadClerk);

  loadShop();
  loadClerk();
}
