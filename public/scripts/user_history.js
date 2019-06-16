let users = [];

function fillDropDown() {
    $.getJSON('/hostel/all', (response) => {
        $.each(response.result, (i, item) => {
            $('#hostel').append($('<option>').val(item.id).text(`${item.name} - ${item.cityname}`));
        })
    });
}

$(document).ready(() => {
    fillDropDown();

    $('#hostel').change((event) => {
        event.target.value != "" ? fetchUserData(event.target.value) : alert("Please select a Hostel");
    });

    $('#search').keyup((event) => {
        const value = event.target.value;
        const filteredUsers = users.filter(user => {
            const { name, mobile, email } = user;
            return (name.includes(value) || mobile.includes(value) || email.includes(value));
        });
        makeUsersList(filteredUsers);
    });
})


function fetchUserData(hostelId) {
    $.getJSON(`/hostel/usersList/${hostelId}`, response => {
        users = response.users;
        makeUsersList(users);
    });
}

function makeUsersList (users) {
    let list = `<table class="table table-primary">
        <thead>
            <tr>
                <th>S no</th>
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Action</th>
            </tr>
        </thead><tbody>`;
    $.each(users, (index, user) => {
        list += `<tr>
            <td>${index+1}</td>
            <td>${user.name}</td>
            <td>${user.mobile}</td>
            <td>${user.email}</td>
            <td>
                <button class="btn btn-primary" onClick=showReport(${user.id})>
                    See report
                </button>
            </td>
        </tr>`
    });
    list += `</tbody></table>`
    $('#result').html(list);
}

function goBack() {
    const value = $('#hostel').val();
    fetchUserData(value);
}

function showReport (userId) {
    $.getJSON(`/userReports/userHistory/${userId}`, response => {
      const { cycleHistory, purchaseHistory, user } = response;
      if(!response || !user) {
          alert('Error for this user');
          return null;
      }
      console.log('user -> ', user);
      let table = `<table class="table table-bordered table-responsive">`;

      // user section
      table += `<tbody>`;
      table += `<tr><td colspan="3">
            <button class="btn btn-primary" onclick="goBack()">Go back</button>
        </td></tr>`;
      table += `<tr><th colspan="3">User details</th></tr>`;
      table += `<tr><td>${user.name}</td><td>${user.mobile}</td><td>${user.email}</td></tr>`;
      table += `</tbody>`;
      // purchase History
      table += `<tbody>`;
      table += `<tr><th colspan="3">Purchase history</th></tr>`;
      table += `<tr><th>Name</th><th>Amount</th><th>Email</th></tr>`;
      $.each(purchaseHistory, (index, item) => {
        table += `<tr><td>${item.name}</td><td>${item.amount}</td><td>${item.date}</td></tr>`;
      });
      table += `</tbody>`;

      // Cycle Use History
      table += `<tbody>`;
      table += `<tr><th colspan="2">Cycle use history</th></tr>`;
      table += `<tr><th>Sno</th><th>Machine channel</th><th>date</th></tr>`;
      $.each(cycleHistory, (index, item) => {
        table += `<tr><td>${index+1}</td><td>${item.channel}</td><td>${item.date}</td></tr>`;
      });
      table += `</tbody></table>`;

      $("#result").html(table);
    });
}