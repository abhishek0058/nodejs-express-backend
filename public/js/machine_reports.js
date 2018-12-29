var machine=[]
 $.getJSON(`/machineReports/machine_status_json`, result=> machine.push(result['result']))
 $(document).ready(()=>{
showAll=machine=>{
    var thead=''
     thead += `<table class='table table-bordered'>
            <thead>
            <th>S. No</th>
            <th>Washing Machine ID</th>
            <th>Washing Machine Name</th>
            <th>Washing Machine in City </th>
            <th>Washing Machine in Hostel</th>
            <th>Running Status</th>
            <th>Channel</th>
            <th>Activator User</th></tr></thead>`

var tbody=`<tbody>`
$.each(machine,(i,item)=>{
    var user=(item.user===NULL)?'':item.user
    tbody+=`<tr>
        <td>${i+1}</td>
        <td>${item.id}</td>
        <td>${item.name}</td>
        <td>${item.city}</td>
        <td>${item.hostel}</td>
        <td>${item.status}</td>
        <td>${item.channel}</td>
        <td>${user}</td>
        </tr>`
})
var table=`${thead+tbody}</tbody></table>`
$('#result').html(table);
}
showAll(machine[0]);
})

 
 