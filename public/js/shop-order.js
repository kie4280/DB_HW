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
        defaultContent: [`<input type="checkbox">`],
      },
      { data: "oid" },
      { data: "status" },
      { data: "start" },
      { data: "end" },
      { data: "shop" },
      { data: "total_price" },
      {
        data: "button",
        defaultContent: [
          `<button type="button" class="btn btn-success">Done</button>
           <button type="button" class="btn btn-danger">x</button>`,
        ],
      },
    ],
  });

  $("#sor").submit(searchShopOrder);
});
