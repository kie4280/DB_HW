"use strict";

function clearInput(i) {
  // 1: home, 2: shop, 3: my order, 4: shop order
  switch (i) {
    case 1:
      $("#sho input:not([type=checkbox])").val("");
      $("#sho input[type=checkbox]").prop("checked", false);
      $("#sho select").val("All");
      $("#table1 input").val(0);
      break;
    case 2:
      $("#mys input:not([disabled])").val("");
      $("#mys label span").html("").parent().hide();
      $("#regs input").val("");
      $("#regs select").val("Taipei");
      $("#regs label span").html("").parent().hide();
      break;
    case 3:
      $("#mor select").val("All");
      break;
    case 4:
      $("#sor select").val("All");
      break;
    default:
      break;
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
    shop: tr.children("td:first-child").html(),
    amount: value,
  });

  posting.done(function (data) {
    if (data.status) {
      window.alert("Place an order success!");
      window.location.replace("/main");
    } else {
      window.alert("Place an order failed!\nInsufficient masks!");
      tr.find("span").css("display", "none");
      tr.find("input").val(0);
    }
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

function cancelOrder() {
  let tr = $(this).parents("tr");

  tr.find("button:last-child span").css("display", "inline-block");
  let posting = $.post("/cancel-order", {
    oid: new Array(tr.children("td:nth-child(2)").html()),
  });

  posting.done(function (data) {
    if (!data.status) {
      window.alert("Cancel order failed!");
    } else {
      window.location.replace("/main");
    }
  });
}

function cancelSelectedOrder() {
  let table = $(this).parents(".tab-pane").find("table");
  let array = [];

  for (let i = 1; i <= table.find("tbody tr").length; i++) {
    let tr = table.find(`tbody tr:nth-child(${i})`);
    if (tr.find("td:first-child input").prop("checked")) {
      tr.find("button:last-child span").css("display", "inline-block");
      array.push(tr.children("td:nth-child(2)").html());
    }
  }

  let posting = $.post("/cancel-order", { oid: array });
  posting.done(function (data) {
    if (!data.status) {
      window.alert("Cancel selected order failed!");
    } else {
      window.location.replace("/main");
    }
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
      { data: "name" },
      { data: "city" },
      { data: "price" },
      { data: "amount" },
      {
        data: "form",
        render: function (data, type, row, meta) {
          return `<div class="form-group">
          <div class="input-group">
          <input type="number" class="form-control" value=0 />
          <div class="input-group-append">
          <button type="button" class="btn btn-primary">
          <span class="spinner-border spinner-border-sm"></span>
          Buy</button></div></div></div>`;
        },
      },
    ],
  });

  $("#table3").DataTable({
    lengthChange: false,
    searching: false,
    autoWidth: false,
    pageLength: 4,
    order: [[1, "asc"]],
    columnDefs: [{ orderable: false, targets: [0, 7] }],
    columns: [
      {
        data: "checkbox",
        render: function (data, type, row, meta) {
          if (row.status == "Not finished") {
            return `<input type="checkbox">`;
          }
          return "";
        },
      },
      { data: "oid" },
      { data: "status" },
      { data: "start" },
      { data: "end" },
      { data: "shop" },
      { data: "total_price" },
      {
        data: "button",
        render: function (data, type, row, meta) {
          if (row.status == "Not finished") {
            return `<button type="button" class="btn btn-danger">
            <span class="spinner-border spinner-border-sm"></span>
            Cancel</button>`;
          }
          return "";
        },
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
  $("#mor3").click(cancelSelectedOrder);

  $("#table1").on("click", "button", placeOrder);
  $("#table3").on("click", "button", cancelOrder);

  $("#sho").trigger("submit");
  $("#mor").trigger("submit");
});
