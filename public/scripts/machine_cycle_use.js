var data = [];

function fillDropDown() {
    $.getJSON('/machine/get-channels', (response) => {
        $.each(response.result, (i, item) => {
            $('#channel').append($('<option>').val(item.channel).text(`${item.channel} - ${item.hostel}`));
        })
    });
}

function getData (channel, type) {
    $.getJSON(`/machineReports/machine-full-report/${type}/${channel}`, (response) => {
        console.log(response.result);
        let table = `<table class="table">
            <thead>
                <tr>
                    <th>Sno</th>
                    <th>Name</th>
                    <th>Mobile</th>
                    <th>Date</th>
                </tr>
            </thead>
            <tbody>
        `
        $.each(response.result, (i, item) => {
            table += `
                <tr>
                    <td>${i+1}</td>
                    <td>${item.name}</td>
                    <td>${item.mobile}</td>
                    <td>${item.date}</td>
                </tr>
            `
        });
        table += `</tbody></table>`;
        $('#result').html(table);
    })
}

$(document).ready(() => {
    $('#submit').click(() => {
        const channel = document.getElementById('channel').value;
        if(channel == "") alert("Please select a machine");
        const type = document.getElementById('type').value;
        if(type == "") alert("Please select a duration");
        getData(channel, type);
    })
})


fillDropDown();