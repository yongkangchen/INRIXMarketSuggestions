function showAlert(msg, type){
	const alertPlaceholder = document.getElementById('liveAlertPlaceholder');
	const alert = (message, type) => {
	  const wrapper = document.createElement('div');
	  wrapper.innerHTML = [
	    `<div class="alert alert-${type} alert-dismissible" role="alert">`,
	    `   <div>${message}</div>`,
	    '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
	    '</div>'
	  ].join('');

	  alertPlaceholder.append(wrapper);
	}

	alert(msg, type);

	// $("#liveAlertPlaceholder").fadeTo(2000, 500).slideUp(500, function(){
	//     $("#liveAlertPlaceholder").slideUp(500);
	// });
}

function parseLoc(data){
	if(config.isJava){
		return [data.latitude, data.longitude, data.count];				
	}
	return data.split("|");
}

function getName(data){
	return data.address;
}

function showList(res, type){
	res = res[type] || []
	// console.log("type", res.length);

	// ajaxGet("", 

	var datas = [];
	if(!config.isJava){
		for(var i = 0; i < res.length; i++){
			if(!getName(res[i])){
				var loc = parseLoc(res[i]);
				datas.push({coordinates: loc[0] + "," + loc[1]});
			}
		}
	}

	whenAjax("https://api.radar.io/v1/geocode/reverse", datas, function(names) {
		// console.log("whenAjax: ", names);
		var parent = $("#accordion-" + type);
		var nodes = parent.children();
		for(var i = 0; i < res.length; i++){
			var node = nodes[i];
			// console.log(type, node);
			if(!node){
				var first = $(nodes[0]);
				node = first.clone();
				node.appendTo(parent);
			}
			node = $(node);
			var name = "unknow";
			if(config.isJava){
				name = res[i].address;
			}
			else if(names[0] && names[0].addresses.length > 0){
				name = names.shift().addresses[0];
				name = name.addressLabel || name.display_name;
			}

			$(".container > .row > .top", node).show();
			$(".container > .row > .top > .value", node).text(i + 1);
			$(".container > .row > .info > .row > .name", node).text(name);
			$(".container > .row > .info > .row > .count > .value", node).text(parseLoc(res[i]).pop() || 0);
			$(".container > .row > .info > .row > .count", node).show();
			// names
			node.show();
		}

		for(var i = res.length; i < 10; i++){
			var node = nodes[i];
			if(node){
				$(node).hide()
			}
		}

		if(res.length == 0){
			var node = $(nodes[0]);
			$(".container > .row > .top", node).hide();
			$(".container > .row > .info > .row > .name", node).text("no data");
			$(".container > .row > .info > .row > .count", node).hide();
			node.show();
		}
	});
}

function doAjax(url, data, type, processData, onSuccess){
	$("#ajaxLoading").removeClass('d-none');
	$.ajax({
	  url: url,
	  data: data,
	  headers: {Authorization: "prj_live_pk_025bfe39a181442148fb92c4b3f8b441ec74fee6"},
	  // beforeSend: function (xhr) {
	  //   xhr.setRequestHeader(
	  //     'User-Agent',
	  //     'ID of your APP/service/website/etc. v0.1'
	  //   )
	  // },
	  dataType: "json",
	  contentType: "application/json; charset=utf-8",
	  processData: processData,
	  type: type,
	  async: true,
	  crossDomain: true
	}).done(function (res) {
	  $("#ajaxLoading").addClass('d-none');
	  onSuccess(res);
	}).fail(function (error) {
	  $("#ajaxLoading").addClass('d-none');
	  showAlert("request error: " + error, "danger");
	  console.error(error);
	})
}

function ajaxPost(url, data, onSuccess){
	doAjax(url, data, "POST", false, onSuccess);
}

function ajaxGet(url, data, onSuccess){
	doAjax(url, data, "GET", true, onSuccess);
}

function whenAjax(url, datas, onSuccess){
	$("#ajaxLoading").removeClass('d-none');

	var requests = datas.map(function(data) {
	    return $.ajax({
		  url: url,
		  data: data,
		  headers: {Authorization: "prj_live_pk_025bfe39a181442148fb92c4b3f8b441ec74fee6"},
		  dataType: "json",
		  // contentType: "application/json; charset=utf-8",
		  type: "GET",
		  // processData: false,
		  async: true,
		  crossDomain: true
		});
	});

	$.when.apply(this, requests).then(function() {
		$("#ajaxLoading").addClass('d-none');
		// console.log("arguments", )
		var args = [];
		for(var i = 0; i < arguments.length; i++){
			args.push(arguments[i][0]);
		}
		onSuccess(args);
	}, function(error){
		$("#ajaxLoading").addClass('d-none');
		showAlert("request error: " + error, "danger");
		console.error(error);
	});
}

function queryGeoloc(address, lat, lon){
	ajaxPost(config.visitCountAPI, JSON.stringify({address: address, latitude: lat, longitude: lon}), function(res){
		res = res.data || res;
		var count = 0;

		if(res.from){
			var first = res.from.shift();
			if(first){
				count = parseInt(parseLoc(first).pop()) || 0
			}
		}

		if(res.to){
			var first = res.to.shift();
			if(first){
				count = parseInt(parseLoc(first).pop()) || 0
			}	
		}

		$("#address").text(address);
		$("#totalCount").text(count);
		showList(res, "from");
		showList(res, "to");
		$("#result").show();
	});
}

function search(address, onSuccess){
	ajaxGet("https://api.radar.io/v1/geocode/forward", {
		query: address,
		format: "geocodejson"
	}, function(res){
		if(res.addresses.length == 0){
		  	showAlert("invalid address: " + address, "danger");
		  	console.log("invalid address");
		  	return;
	    }
	  	// console.log(res);
	  	var coordinates = res.addresses[0];
	  	// console.log(coordinates);

	  	var lat = parseFloat(parseFloat(coordinates.latitude).toFixed(3))
			var lon = parseFloat(parseFloat(coordinates.longitude).toFixed(3))

	  	onSuccess(address, lat, lon);
	  	// onSuccess(address, 37.77, -122.411);//TODO: test
	})
}