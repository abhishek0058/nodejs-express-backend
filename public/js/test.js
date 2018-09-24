$(document).ready(() => {
		$.ajax('/washing/index.php/user_ctrl/test',
	function(data){
		alert(data)
		console.log(data);
	});
})