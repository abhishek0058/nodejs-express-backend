$.getJSON(`/purchaseHistory/displayHistory`, result => {
  showPurcheseHistory(result["result"]);
});

showPurcheseHistory = data => {
  var showHistory = `<table class='table table-bordered'>
                    <thead>
                    <th>S No.</th>
                    <th>User Name</th>
                    <th>Mobile number</th>
                    <th>Package Name</th>
                    <th>Amount</th>`;
  $.each(data, (i, item) => {
    showHistory += `<tr>
        <td>${i + 1}</td>
        <td>${item.user_name}</td>
        <td>${item.mobile}</td>
        <td>${item.name}</td>
        <td>${item.amount}</td>
    </tr>`;
  });
  $("#history_puchese").html(showHistory);
};

$(document).ready(() => {
  $.getJSON(`/purchaseHistory/UserPurchesed`, data => {
    $.each(data.result, (i, item) =>
      $("#user").append(
        $("<option>")
          .val(item.user_id)
          .text(item.user_name)
      )
    );
  });
  $(`#user`).change(() => {
    $.getJSON(`/purchaseHistory/displayHistory`, result => {
      var user = result.result.filter(item => item.user_id == $(`#user`).val());
      showPurcheseHistory(user);
    });
  });
});
