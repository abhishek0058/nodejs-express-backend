
$('#city_div').hide();
$('#hostel_div').hide();
$('#college_div').hide();
$('#btn_div').hide();



$(document).ready(function(){

  $.getJSON('/washing/index.php/State_ctrl/displayallJSON',function(data){
	$.each(data,function(i,item){
	     $('#state').append($('<option>').val(item.state).text(item.state));
	});
	});

$('#state').change(function(){
$('#hostel_div').hide();
$('#college_div').hide();
$('#btn_div').hide();
	$.getJSON('/washing/index.php/City_ctrl/displaybystateJSON',{state:$('#state').val()},function(data){
	$('#city').empty();
	$.each(data,function(i,item){
	     $('#city').append($('<option>').val(item.id).text(item.city));
	});
	$('#city_div').show();
	});	
});

$('#city').change(function(){
$('#btn_div').hide();	
$('#hostel_div').hide();
	$.getJSON('/washing/index.php/College_ctrl/displaybyidJSON',{city:$(this).val()},function(data){
		$('#college').empty();
		$('#college').append($('<option>').val(0).text("--SELECT COLLEGE --"));
	$.each(data,function(i,item){
	     $('#college').append($('<option>').val(item.name).text(item.name));
	});
	$('#college_div').show();
	});
});

$('#college').change(function(){
$('#btn_div').hide();
	$.getJSON('/washing/index.php/Hostel_ctrl/displaybyidJSON',{college:$(this).val()},function(data){
		$('#hostel').empty();
		$('#hostel').append($('<option>').val(0).text("-- SELECT HOSTEL --"));
	$.each(data,function(i,item){
	    $('#hostel').append($('<option>').val(item.id).text(item.name));
	});
	$('#hostel_div').show();
	});
})

$('#hostel').change(function(){
	$('#btn_div').show();
})


$('#done').click(function(){

window.location.href="/washing/index.php/User_ctrl/show_home?city="+$('#city option[value="'+$(city).val()+'"]').text()+"&college="+$('#college option[value="'+$(college).val()+'"]').text()+"&hostel="+$('#hostel option[value="'+$(hostel).val()+'"]').text();
})
})