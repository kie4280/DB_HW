"use strict";

function clearInput(i) {
  // 1: my shop / register shop, 2: shop list
  if (i == 1) {
    $("#mys input:not([disabled])").val("");
    $("#mys label span").html("").parent().hide();
    $("#regs input").val("");
    $("#regs select").val("Taipei");
    $("#regs label span").html("").parent().hide();
  } else {
    $("#sho input:not([type=checkbox])").val("");
    $("#sho input[type=checkbox]").prop("checked", false);
    $("#sho select").val("All");
  }
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

  $("#sho6 span").css("display", "inline-block");
  let posting = $.post("/search-shop", $("#sho").serialize());

  posting.done(function (data) {
    $("#sho6 span").css("display", "none");
    $("#table1").DataTable().clear().rows.add(data).draw();
  });
}

$(document).ready(function () {
  $("#table1").DataTable({
    lengthChange: false,
    searching: false,
    pageLength: 8,
    columns: [
      { data: "shop" },
      { data: "city" },
      { data: "price" },
      { data: "amount" },
    ],
  });

  for (let i = 1; i <= 2; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }

  $("option").val(function (index, value) {
    return $(this).text();
  });

  $("#tab3").click(logout);
  $("#sho").submit(search);
  $("#sho").trigger("submit");
});
