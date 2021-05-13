"use strict";

function searchShopOrder(event) {
  event.preventDefault();

  $("#sor3 span").css("display", "inline-block");
  let posting = $.post("/search-shop-order", $("#sor").serialize());

  posting.done(function (data) {
    $("#sor3 span").css("display", "none");
    $("#table4").DataTable().clear().rows.add(data).draw();
  });
}

function finishOrder() {
  let tr = $(this).parents("tr");

  tr.find("button:first-child span").css("display", "inline-block");
  let posting = $.post("/finish-order", {
    oid: tr.children("td:nth-child(2)").html(),
  });

  posting.done(function (data) {
    tr.find("button:first-child span").css("display", "none");
    tr.children("td:nth-child(3)").html("Finished");
    tr.children("td:last-child").empty();
  });
}

function cancelOrder() {
  let tr = $(this).parents("tr");

  tr.find("button:last-child span").css("display", "inline-block");
  let posting = $.post("/finish-order", {
    oid: tr.children("td:nth-child(2)").html(),
  });

  posting.done(function (data) {
    tr.find("button:last-child span").css("display", "none");
    tr.children("td:nth-child(3)").html("Cancelled");
    tr.children("td:last-child").empty();
  });
}

$(document).ready(function () {
  $("#table4").DataTable({
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
        render: function (data, type, row, meta) {
          return `<input type="checkbox">`;
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
            return `<button type="button" class="btn btn-success">
            <span class="spinner-border spinner-border-sm"></span>
            Done</button>
            <button type="button" class="btn btn-danger">
            <span class="spinner-border spinner-border-sm"></span>
            Cancel</button>`;
          }
          return "";
        },
      },
    ],
  });

  $("#sor").submit(searchShopOrder);
  $("#sor").trigger("submit");
  $("#table4").on("click", "button:first-child", finishOrder);
  $("#table4").on("click", "button:last-child", cancelOrder);
});
