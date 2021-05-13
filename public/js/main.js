"use strict";

function clearInput(i) {
  // 1: my shop / register shop, 2: shop list
  if (i == 1) {
    $("#sho input:not([type=checkbox])").val("");
    $("#sho input[type=checkbox]").prop("checked", false);
    $("#sho select").val("All");
    $("#table1 input").val(0);
  } else if (i == 2) {
    $("#mys input:not([disabled])").val("");
    $("#mys label span").html("").parent().hide();
    $("#regs input").val("");
    $("#regs select").val("Taipei");
    $("#regs label span").html("").parent().hide();
  } else if (i == 3) {
    $("#mor select").val("All");
  } else {
    $("#sor select").val("All");
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

function searchShop(event) {
  event.preventDefault();

  $("#sho6 span").css("display", "inline-block");
  let posting = $.post("/search-shop", $("#sho").serialize());

  posting.done(function (data) {
    $("#sho6 span").css("display", "none");
    $("#table1").DataTable().clear().rows.add(data).draw();
  });
}

function placeOrder() {
  let tr = $(this).parents("tr");
  let value = parseFloat(tr.find("input").val());

  if (!Number.isInteger(value) || value <= 0) {
    window.alert("Place an order failed!\nInput should be positive integer.");
    tr.find("input").val(0);
    return;
  }

  tr.find("span").css("display", "inline-block");
  let posting = $.post("/place-order", {
    shop: tr.children("td:first").html(),
    amount: value,
  });

  posting.done(function (data) {
    tr.find("span").css("display", "none");
    if (data.status) {
      window.alert("Place an order success!");
    } else {
      window.alert("Place an order failed!\nInsufficient masks!");
    }
    tr.find("input").val(0);
  });
}

function searchMyOrder(event) {
  event.preventDefault();

  $("#mor2 span").css("display", "inline-block");
  let posting = $.post("/search-my-order", $("#mor").serialize());

  posting.done(function (data) {
    $("#mor2 span").css("display", "none");
    $("#table3").DataTable().clear().rows.add(data).draw();
  });
}

$(document).ready(function () {
  $("#table1").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 8,
    columnDefs: [{ orderable: false, targets: 4 }],
    columns: [
      { data: "shop" },
      { data: "city" },
      { data: "price" },
      { data: "amount" },
      {
        data: "form",
        defaultContent: [
          `<div class="form-group">
           <div class="input-group">
           <input type="number" class="form-control" value=0 />
           <div class="input-group-append">
           <button type="button" class="btn btn-primary">
           <span class="spinner-border spinner-border-sm"></span>
           Buy!</button></div></div></div>`,
        ],
      },
    ],
  });

  $("#table3").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 5,
    columnDefs: [
      { orderable: false, targets: 0 },
      { orderable: false, targets: 7 },
    ],
    columns: [
      {
        data: "checkbox",
        defaultContent: [`<input type="checkbox">`],
      },
      { data: "oid" },
      { data: "status" },
      { data: "start" },
      { data: "end" },
      { data: "shop" },
      { data: "total_price" },
      {
        data: "action",
        defaultContent: [
          `<button type="button" class="btn btn-danger">x</button>`,
        ],
      },
    ],
  });

  for (let i = 1; i <= 4; i++) {
    $(`#tab${i}`).click(function () {
      clearInput(i);
    });
  }

  $("option").val(function (index, value) {
    return $(this).text();
  });

  $("#tab5").click(logout);
  $("#sho").submit(searchShop);
  $("#mor").submit(searchMyOrder);
  $("#sho").trigger("submit");
  $("#table1").on("click", "button", placeOrder);
});
