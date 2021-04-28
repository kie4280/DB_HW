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

function clearInput(i) {
  // 1: register shop / my shop, 2: shop list
  if (i == 1) {
    $("#regs").find("input").val("");
    $("#regs").find("select").val("Taipei");
    $("#regs").find("label > span").html("");

    $("#mys").find("input:not([disabled])").val("");
    $("#mys").find("label > span").html("");
  } else {
    $("#sho").find("input:not([type=checkbox])").val("");
    $("#sho").find("input[type=checkbox]").prop("checked", false);
    $("#sho").find("select").val("All");
  }
}

function register(event) {
  event.preventDefault();

  let success = true;
  for (let i = 1; i <= 4; i++) {
    success &= checkInput(i);
  }
  if (!success) {
    return;
  }

  $("#regs5 > span").css("display", "inline-block");
  let posting = $.post("/register-shop", $("#regs").serialize());

  posting.done(function (data) {
    if (data.status) {
      window.alert("Register Success!");
      window.location.replace("/main");
    } else {
      $("#regs5 > span").css("display", "none");
      $("#regs-err1").html("*Shop name has been used! QAQ");
    }
  });
}

function addClerk() {
  $("#mys6 > span").css("display", "inline-block");
  let posting = $.post("/add-clerk", {
    account: $("#mys5").val(),
  });
  posting.done(function (data) {
    $("#mys6 > span").css("display", "none");
    if (data.status) {
      clearInput(1);
      $("#table2 > tbody").append(
        `<tr id="clerk${data.id}"><td>${data.account}</td><td>${data.phone}</td>
         <td><button type="button" class="btn btn-danger" id="del${data.id}">
         <span class="spinner-border spinner-border-sm"></span>
         Delete</button></td></tr>`
      );
    } else {
      $("#mys-err5").html(data.err);
    }
  });
}

function deleteClerk() {
  $(this).find("span").css("display", "inline-block");
  let posting = $.post("/delete-clerk", {
    account: $(this).parents("tr").find("td:first").html(),
  });
  posting.done(function (data) {
    if (data.status) {
      $(`#clerk${data.id}`).remove();
    }
  });
}

function logout() {
  let posting = $.post("/logout-user");

  posting.done(function (data) {
    if (data.status) {
      window.location.replace("/");
    }
  });
}

function search(event) {
  event.preventDefault();

  $("#sho6 > span").css("display", "inline-block");
  let posting = $.post("/search-shop", $("#sho").serialize());

  posting.done(function (data) {
    clearInput(2);
    $("#sho6 > span").css("display", "none");
    $("#table1 > tbody").empty();
    for (let i = 0; i < data.length; i++) {
      $("#table1 > tbody").append(
        `<tr id="shop${data[i].id}"><td>${data[i].shop}</td><td>${data[i].city}</td>
         <td>${data[i].price}</td><td>${data[i].amount}</td></tr>`
      );
    }
  });
}

$(document).ready(function () {
  for (let i = 2; i <= 4; i += 2) {
    $(`#mys${i}`).click(function () {
      $(`#mys${i - 1}`)
        .prop("disabled", false)
        .focus();
    });
  }
  for (let i = 1; i <= 3; i += 2) {
    $(`#mys${i}`).blur(function () {
      $(`#mys${i}`).prop("disabled", true);
    });
  }
  for (let i = 1; i <= 4; i++) {
    $(`#regs${i}`).focus(function () {
      $(`#regs-err${i}`).html("");
    });
  }
  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }
  $("#mys5").focus(function () {
    $("#mys-err5").html("");
  });
  $("option").val(function (index, value) {
    return $(this).text();
  });
  $("#sho1").val(function (index, value) {
    return value.toLowerCase();
  });

  $("#table2").on("click", "button", deleteClerk);
  $("#mys6").click(addClerk);
  $("#tab3").click(logout);
  $("#regs").submit(register);
  $("#sho").submit(search);
});
