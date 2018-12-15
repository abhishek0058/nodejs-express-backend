$.getJSON(`/package/all`, result => showPackage(result))

showPackage=data=>{ 
console.log(data['result']);

    var package=`<div class="container">
			<div class="row">
				<div class="col-sm-12 col-md-12">
					<div class="page-title">
						<h2 class="lead">Recharge Plane?</h2>
						<p class="sublead" style="font-size:29px;">Cost Per Wash Cycle - Rs.40/-</p>
						<hr>
					</div>
				</div>
            </div>`
            $.each(data['result'],(i,item)=>{
				console.log(item);
				
                if(i===0){ package+='<div class="row">'}
                    package+=`<div class="col-sm-12 col-md-3">
					<div class="panel panel-default panel-pricing wow fadeInDown">
						<header class="panel-heading">
							<h3>${item.name}</h3>
							<div class="price">
								<sup><i class="fa fa-rupee"></i></sup>${item.amount}
							</div>
						</header>
						<div class="panel-body">
							<table class="table">
								<tbody>
									<tr><td>${item.cycles} cycles</td></tr>
								</tbody>
							</table>
						</div>
						<footer class="panel-footer">
							<a href="#" class="btn btn-primary btn-block">ORDER NOW</a>
						</footer>
					</div>
		
				</div>`
				if(i===4){
					i=0;
					package+=`</div></div>`
				}

			})
		$('#package').html(package);
		}