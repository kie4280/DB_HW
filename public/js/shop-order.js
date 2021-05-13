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
        data: "action",
        defaultContent: [
          `<button type="button" class="btn btn-success">Done</button>
           <button type="button" class="btn btn-danger">x</button>`,
        ],
      },
    ],
  });
});
