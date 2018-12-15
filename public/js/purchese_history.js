var history=[]
$.getJSON(`/purchaseHistory/displayHistory`, result => showPurcheseHistory(result))

showPurcheseHistory=data=>{ 
// console.log(data);

var showHistory = `<table class='table table-bordered'>

                    <thead>
                    <th>S No.</th>
                    <th>User Name</th>
                    <th>Package Name</th>
                    <th>Amount</th>`
    $.each(data['result'],(i,item)=>{
            showHistory +=`<tr>
                        <td>${i+1}</td><td>${item.user_name}</td><td>${item.name}</td><td>${item.amount}</td></tr>`
    })
    $('#history_puchese').html(showHistory);
}
$(document).ready(()=>{
    var result=[]
    $.getJSON(`/user/all`, data =>{
        result=data
        $.each(data.result, (i, item) => $('#user').append($('<option>').val(item.id)
        .text(item.name)))})
        $(`#user`).change(()=>{
           
            console.log(result.result);
            
            const user = result.result.filter(item => item.user_id == $(`#user`).val())
            console.log(user);
            showPurcheseHistory(user)
        })


    })



