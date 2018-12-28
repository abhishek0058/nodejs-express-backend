var cycle=[]
 $.getJSON(`/machineReports/cycle_use_json`, async result => await cycle.push(result['result']))
 $(document).ready(()=>{
showAll=cycle=>{
    var thead=''
     thead += `<table class='table table-bordered'>
            <thead>
            <th>S. No</th>
            <th>Cycle ID</th>
            <th>Used By</th>
            <th>Used on</th>
            </thead>`

var tbody=`<tbody>`
$.each(cycle,(i,item)=>{
  
    tbody+=`<tr>
        <td>${i+1}</td>
        <td>${item.id}</td>
        <td>${item.user}</td>
        <td>${new Date(item.date).toLocaleString()}</td>
        </tr>`
})
var table=`${thead+tbody}</tbody></table>`
$('#result').html(table);
}
showAll(cycle[0]);
})

 
 