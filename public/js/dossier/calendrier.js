document.addEventListener("DOMContentLoaded", function() {


	( function($) {
		$.fn.afficheCalendar = function(idComm,emplacement) {
			//alert(emplacement);
			var calendar = $('#calendar').fullCalendar( {
				header: {
					left: 'prev,next today',
					center: 'title',
					right: 'month,agendaWeek,agendaDay'
				},
				columnFormat : {
					month: 'dddd',
					week: 'dddd dd',
					day: 'dddd dd MMMM yyyy'
				},
				defaultView: 'month',
				timeFormat:'H:mm{ - H:mm}',
				axisFormat: 'H(:mm)',
				slotMinutes: 5, //Permet d'afficher un interval de 10 minutes au lieu de 30 par défaut
				selectHelper: true,
				firstDay: 1,
				weekends: false,
				monthNames : ['Janvier','F\u00e9vrier','Mars','Avril','Mai','Juin','Juillet','Ao\u00fbt','Septembre','Octobre','Novembre','D\u00e9cembre'],
				monthAbbrevs : ['Jan','Fev','Mar','Avr','Mai','Juin','Juil','Aout','Sep','Oct','Nov','Dec'],
				dayNames : ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'],
				dayNamesShort : ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],
				lazyFetching: false, //permet de ne pas réafficher les évenements en cache
				minTime: 8,
				maxTime: 19,
				editable: true,
				disableResizing: false,
				selectable: true,
				droppable: false,
				theme: true,
				aspectRatio: 2,
				events: function(start, end, callback) {
					$.ajax({
						url: '/calendrier-des-commissions/recupevenement?start='+start.getTime()+"&end="+end.getTime(),
						data: {
							format: 'json',
							idComm: idComm,
						},
						success: function( result ) {
							var events = [];
							for( var x in result["items"] ) {
								var colorCal;
								switch(result["items"][x]["className"]){
									case "display-1":
										colorCal = "#3A87AD";
									break;
									case "display-2":
										colorCal = "#468847";
									break;
									case "display-3":
										colorCal = "#F89406";
									break;
								}
								events.push({
									id: result["items"][x]["id"],
									title: result["items"][x]["title"],
									start: result["items"][x]["start"],
									end: result["items"][x]["end"],
									allDay: result["items"][x]["allDay"],
									//url: result["items"][x]["url"],
									color: colorCal
								});
							}
							callback(events);
							return false;
						}
					});
				},
				//Lorsque l'on selectionne une ou plusieurs dates on ouvre la boite de dialogue correspondante
				select: function(start, end, allDay) {
					var dateSelected = new Date(start);
					// On empêche la selection d'un samedi ou d'un dimanche
					if( dateSelected.getDay() != 6 && dateSelected.getDay() != 0) {
						// Boite de dialogue en ajoutant en callback le traitement du formulaire
						my_dialog("/calendrier-des-commissions/dialogcomm", "do=newComm&idComm="+idComm+"&dateD="+start+"&dateF="+end, function() {	
							$("#dialogComm").dialog("option", "buttons", {
								'Enregistrer dans le calendrier': function() {
									// Lors de la validation de la boite de dialogue
									$.ajax({
										data: $("#formDateComm").serialize() + "&idComm=" + idComm,
										url: "/calendrier-des-commissions/adddates",
										type:"POST",
										success: function(affichageResultat) {
											//En cas de succes il faut inserer tous les évenements dans le calendrier et la BD
											//Récupération du Json et affichage de celui-ci
											var rez = eval("("+affichageResultat+")");
											for( var i in rez ) {
												calendar.fullCalendar('renderEvent',{
													id: rez[i]['id'],
													title: rez[i]['title'],
													className: rez[i]['className'],
													start: rez[i]['start'],
													end: rez[i]['end'],
													allDay: false,
													//url: "/calendrier-des-commissions/view/id="+rez[i]['id']												
													url: "/commission/id/"+rez[i]['id']												
												});
											}
											$("#calendar").fullCalendar('refetchEvents');
											$("#dialogComm").dialog('close').html('');
											
										}
									});
								},
								'Fermer la fenêtre d\'édition': function() {

									$("#dialogComm").dialog('close').html('');
								}
							});
						});
					}
				},
				eventClick: function( event, jsEvent, view ) {
					//Action qui se réalise lorsque l'on clique sur un évenement existant du calendrier
					//-> Dans le cadre du calendrier cela ouvre une boite de dialogue
					//-> Dans le cas d'un dossier cela permet de renseigner la date de passage en commission
					if(emplacement == 'calendrierComm'){
						my_dialog("/calendrier-des-commissions/dialogcomm", "idComm="+idComm+"&idDateComm="+event.id+"&do=edit");
					}else if(emplacement == 'dossier'){
						//Lorsque l'on clique sur une commission la date s'ajoute automatiquement dans l'input en dessous
						//alert(event.id);
						$("#ID_AFFECTATION_DOSSIER").val(event.id);

						var date = new Date(event.end);
						dd = date.getUTCDate();
						mm = date.getUTCMonth()+1;
						aa = date.getUTCFullYear();
						if(dd<10)
							dd='0'+dd						
						if(mm<10)
							mm='0'+mm
						
						$("#DATECOMM_INPUT").val(dd+"/"+mm+"/"+aa);
						$(".hideCalendar").click();

					}	
					return false;
				},
				eventDrop: function( event, dayDelta, minuteDelta, allDay, revertFunc, jsEvent, ui, view ) {
					//Lorsque l'on déplace un élément
					var tabDateSelect = event.end;
					tabDateSelect = tabDateSelect.toString();
					tabDateSplited = tabDateSelect.split(" ");

					if(tabDateSplited[0] == "Sun" || tabDateSplited[0] == "Sat"){
						$("#calendar").fullCalendar('refetchEvents');
					}else{
						//alert("idComm="+event.id+"&debut="+event.start+"&fin="+event.end);
						$.ajax({
							data: "idComm="+event.id+"&debut="+event.start+"&fin="+event.end,
							url: "/calendrier-des-commissions/deplacecommissiondate",
							type:"POST",
							success: function(affichageResultat){
								//$("#calendar").html(affichageResultat);
							},
						});
						
					}
				},
				eventResize: function( event, jsEvent, ui, view ) {
				
					//heure de fin change uniquement fonctionne uniquement sur la vue semaine et jour. Pas sur mois
					var view = $("#calendar").fullCalendar('getView');
					var vueInfo = view.title;
					vueInfo = vueInfo.split(" ");
					if(vueInfo.length == 2){
						//permet d'empecher la modification en mode mois (Ajouter message d'indication si besoin)
						$("#calendar").fullCalendar('refetchEvents');
						return false;
					}
					$.ajax({
						data: "idComm="+event.id+"&fin="+event.end,
						url: "/calendrier-des-commissions/resizecommissiondate",
						type:"POST",
					});
				}
				
				
			});	
		};
	})(jQuery);

	// Selection de la commission
	$("#commissionSelect").change(function() {
		$("#infosCom").html("<input type='hidden' name='commissionId' id='commissionId' value='" + $(this).find("option:selected").val() + "' />");
		$("#aff_calendar").button( "option", "disabled", false );
		$("#ordre_jour").button( "option", "disabled", false );
		$("#calendar").html('').afficheCalendar($("#commissionId").attr('value'),'calendrierComm');
	});
	

	// Dialogue standard
	function my_dialog( url, data, callback ) {
		// Récupération du contenu de la boite de dialogue
		
		$.ajax({
			data: data,
			url: url,
			type:"POST",
			success: function( result ) {
			
				$("#dialogComm").html( result );
				
				// On créé la boite de dialogue
				$("#dialogComm").dialog({
					resizable: false,
					height: 800,
					width: 1200,
					modal: true,
					buttons: {
						'Afficher l\'ordre du jour': function() {
							window.location.replace("./calendrier-des-commissions/gestionodj/dateCommId/"+$("#dateClick").val());								
						},
						'Fermer la fenêtre d\'édition': function() {
							$("#dialogComm").dialog('close').html('');
						}
					}
				});
				
				if( callback )
					callback();
			}
		});
	}

	
	$(".edition").live('click',function(){
		//Gére la modification des champs
		$("#dialogComm").buttonHide();
		var tabDo = $(this).attr('id').split('_');
		var data;
		//alert(tabDo[1]);
		switch(tabDo[1]){
			case "libelleCom":
			case "typeCom":
				data = "idDateComm="+$("#dateCommission").val()+"&do="+tabDo[1];
				//alert('');
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#div_"+tabDo[1]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						//alert(affichageResultat);
						$("#div_"+tabDo[1]).html(affichageResultat);
						return false;
					},
					error: function(){
						return false;
					}
				});
			break;
			case "dateComm":
				data = "idDateComm="+tabDo[2]+"&do="+tabDo[1];
				if(tabDo.length == 4 && tabDo[3] == 'First'){
					data += "&first=1";
				}						
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#ligne_"+tabDo[2]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#ligne_"+tabDo[2]).html(affichageResultat);
						return false;
					},
					error: function(){
						return false;
					}
				});
			break;
		}
		return false;
	});

	//Valide la modification du champ (avec update DB)
	$(".validation").live('click',function(){
		var tabDo = $(this).attr('id').split('_');
		var data;
		switch(tabDo[1]){
			case "libelleCom":
				data = $("#value_"+tabDo[1]).val();
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: "idDateComm="+$("#dateCommission").val()+"&do=valid_"+tabDo[1]+"&data="+data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#div_"+tabDo[1]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#div_"+tabDo[1]).html(affichageResultat);
						$("#calendar").fullCalendar('refetchEvents');
						return false;
					},
					error: function(){
						return false;
					}
				});
			break;
			case "dateCom":
				data = "&date="+$("#date_"+tabDo[2]).val()+"&hd="+$("#D_"+tabDo[2]).val()+"&hf="+$("#F_"+tabDo[2]).val();
				if($("#first").val() == 1)
					data += "&first=1";
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: "idDateComm="+tabDo[2]+"&do=valid_"+tabDo[1]+data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						//alert("#ligne_"+tabDo[2]);
						$("#ligne_"+tabDo[2]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#ligne_"+tabDo[2]).html(affichageResultat);
						$("#calendar").fullCalendar('refetchEvents');
						return false;
					},
					error: function(){
						return false;
					}
				});
			break;
			case "typeCom":
				data = $("#value_"+tabDo[1]).val();
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: "typeSelect="+$("#typeCom").val()+"&do=valid_"+tabDo[1]+"&idDateComm="+$("#dateCommission").val(),
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#div_"+tabDo[1]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#div_"+tabDo[1]).html(affichageResultat);
						$("#calendar").fullCalendar('refetchEvents');
						return false;
					},
					error: function(){
						return false;
					}
				});
			break;
		}
		$("#dialogComm").buttonShow();
		return false;			
	});

	$(".annulation").live('click',function(){
		var tabDo = $(this).attr('id').split('_');
		var data;
		switch(tabDo[1]){
			case "libelleCom": 
			case "typeCom":
				data = "do=annule_"+tabDo[1]+"&idDateComm="+$("#dateCommission").val();
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#div_"+tabDo[1]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#div_"+tabDo[1]).html(affichageResultat);
					},
					error: function(){
						return false;
					}
				});			
			break;
			case "dateCom": 
				data = "do=annule_"+tabDo[1]+"&idDateComm="+tabDo[2];
				if($("#first").val() == 1)
					data += "&first=1";
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: data,
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#ligne_"+tabDo[2]).html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						$("#ligne_"+tabDo[2]).html(affichageResultat);
					},
					error: function(){
						return false;
					}
				});			
			break;
		}
		$("#dialogComm").buttonShow();
		return false;
	}); //fin .annulation click

	//permet de modifier la date par défaut à laquelle sont reliés toutes les autres dates
	$(".dateDefaut").live('click',function(){
		var tabId = $(this).attr('id').split('_');
		var id=tabId[2];
		var data = "do=makeDefaut&idDateComm="+id;
		$.ajax({
			//Récupération du contenu boite de dialogue
			data: data,
			url: "/calendrier-des-commissions/dialogcomm",
			type:"POST",
			beforeSend: function(){
				//$("#ligne_"+tabDo[2]).html("<img src='/images/template/load/load.gif' alt='chargement' title='loading'/>");
			},
			success: function(affichageResultat){
				$.ajax({
					//Récupération du contenu boite de dialogue
					data: "idComm="+$("#commissionId").val()+"&idDateComm="+id+"&do=edit",
					url: "/calendrier-des-commissions/dialogcomm",
					type:"POST",
					beforeSend: function(){
						$("#dialogComm").html("<img src='/images/load.gif' />");
					},
					success: function(affichageResultat){
						//alert("idComm="+$("#commissionId").val()+"&idDateComm="+id+"&do=edit");
						$("#dialogComm").html(affichageResultat);
						$("body").css('overflow','hidden');
						$("#dialogComm").dialog({
							resizable: false,
							height: 800,
							width: 1200,
							buttons: {
								'Fermer la fenêtre d\'édition': function() {
									$(this).dialog('close');
									$("#dialogComm").html('');
								}
							},
							close: function(event, ui){
								$("body").css('overflow','auto');
							}
						});
					},
					error: function(){
						return false;
					}
				});
			},
			error: function(){
				return false;
			}
		});
		return false;
	});//fin #dateDefaut 

	//Permet la suppression de date(s)
	$(".suppression").live('click',function(){
		//permet de supprimer une date dans les cas d'une édition et d'une création
		if($("#dateCommission").val()){
			//Dans le cas d'une édition supprime dans la base et raffraichi le calendrier
			var tabDo = $(this).attr('id').split('_');
			data = "do=supp_dateCom&idDateComm="+tabDo[2];
			if(tabDo[2] == $("#dateCommission").val()){
				//alert($("#listeDates").first("ul[id^=ligne_]").attr('id'));
				//alert($("#listeDates ul:first").next("ul").attr('id'));
			}
			$.ajax({
				data: data,
				url: "/calendrier-des-commissions/dialogcomm",
				type:"POST",
				beforeSend: function(){
					//Voir pour faire autrement cars il faut detecter avant de cacher la ligne s'il s'agit d'une date père ou non.
				},
				success: function(affichageResultat){
					//alert(affichageResultat);
					if(affichageResultat == ''){
						alert('Il est impossible de supprimer cette date. D\'autres dates sont liées à celle-ci.\nUtilisez le bouton prévu à cet effet afin d\'affecter une autre date principale à la commission');
					}else{
						$("#listeDates").countLigne('supp','edit');
						$("#ligne_"+tabDo[2]).fadeOut().remove();
						$("#calendar").fullCalendar('refetchEvents');							
					}						
				},
				error: function(){
					return false;
				}
			});			
		}else{
			//Dans le cas d'une création on retire simplement la ligne
			$(this).parent().parent().fadeOut().remove();
			$("#listeDates").countLigne('supp','new');
		}
		//compter le nombre de ligne pour autoriser ou non la périodicité
		return false;
	});
	
});
		
	