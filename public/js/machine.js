let Hostels = []

$('#cityid').change(() => {
    $('#hostelid').empty();
    $.each(Hostels, (i, item) => $('#hostelid').append($('<option>').val(item.id).text(item.name)))
})

$('#result').on('click', '.edit', e => {
         var id = e.target.attributes[0].value
         var cycle_time= $('#cycle_time').val()
    console.log(cycle_time);
    
    $.get(`/machine/change_cycle/${id}/${cycle_time}`, data => refresh())
})
$('#result').on('click', '.change', e => {
    confirm('')
    data={
         id : e.target.attributes[0].value,
        city : e.target.attributes[1].value,
        hostel : e.target.attributes[2].value,
        machine : e.target.attributes[3].value,
        channel : e.target.attributes[4].value,
        cycle_time : e.target.attributes[5].value
    }
    $('#result thead').append(add(data))
   
    
})
add=data=>{console.log(data);

return (`<tr><td>${data.id}</td><td>${data.city}</td><td>${data.hostel}</td><td>${data.machine}</td><td>${data.channel}</td><td><input type=number style='width:50px' class=form-controll id=cycle_time value=${data.cycle_time}></td><td><button id=${data.id} class='edit btn btn-success'>Change</button></td></tr>`)
}

function refresh() {
    $.getJSON(`/city/all`, data => $.each(data.result, (i, item) => $('#cityid').append($('<option>').val(item.id)
        .text(item.name))))
    $.getJSON('/hostel/all', data => Hostels = data.result);
    $.getJSON('/machine/all', data => makeTable(data.result))
}

function makeTable(data) {
    let table =
        "<thead><th>ID</th><th>City</th><th>Hostel</th><th>Machine name</th><th>Channel</th><th>Cycle Time</th><th>Edit</th></thead>"
    $.each(data, (i, item) => {
        table +=
            `<tr><td>${item.id}</td>
                    <td>${item.cityname}</td>
                    <td>${item.hostelname}</td>
                    <td>${item.name}</td>
                    <td>${item.channel}</td>
                    <td>${item.cycle_time}</td>
                    <td><button id=${item.id} city=${item.cityname} hostelname=${item.hostelname} machine_name="${item.name}" channel=${item.channel} cycle_time=${item.cycle_time} class='change btn btn-warning'>Edit</button></td>
                    </tr>`
    })
    table += "</table>"
    $('#result').html(table)
}
$('#cityid').change(()=>{
        $.getJSON('/machine/all', data => {
          var result=data.filter(item=>item.cityid===$('#cityid').val())  
          makeTable(result)
        })        
})
$('#hostelid').change(() => {
    $.getJSON('/machine/all', data => {
        var result = data.filter(item => item.cityid === $('#hostelid').val())
        makeTable(result)
    })
})

refresh()