var cycle=[]
 $.getJSON(`/machineReports/cycle_use_json`,  result =>  cycle.push(result['result']))
 $(document).ready(()=>{
     $.getJSON(`/purchaseHistory/UserPurchesed`, data => {
       
        $.each(data.result, (i, item) => $('#user').append($('<option>').val(item.user_id)
        .text(item.user_name)))
    })
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
  console.log(item.user);
  
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
            $.getJSON(`/machineReports/cycle_use_json`, result => {
                $(`#user`).change(() => {                    
                var user= result.result.filter(item => item.userid == $(`#user`).val())
                console.log(user);
                showAll(user)
            })
        })
    })