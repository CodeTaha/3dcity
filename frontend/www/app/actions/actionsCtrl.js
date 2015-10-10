
angular.module('civis.youpower.actions').controller('ActionsCtrl', ActionsCtrl);


/* The controller that's shared over all the action states.
-----------------------------------------------------------*/
function ActionsCtrl($scope, $state, $ionicPopup, $filter, Actions, User, $translate, pendingInvites) {

	$scope.currentUser.pendingHouseholdInvites = pendingInvites.pendingHouseholdInvites;
	$scope.loadHouseholdsDetails($scope.currentUser.pendingHouseholdInvites); 
	$scope.currentUser.pendingCommunityInvites = pendingInvites.pendingCommunityInvites;


	//for recommending actions (look at the length of inProgess actions)
	$scope.preferredNumberOfActions = 3; //inProgress
	$scope.maxNumberOfActions = 6; //inProgress

	//$scope.variable = 'Hello <strong>World!</strong>'; 

	//for showing items at UI since the lists can be quite long
	$scope.sNr = 2;
	$scope.maxNumberShow = { 
		inProgress: $scope.sNr, 
		pending: $scope.sNr, 
		done: $scope.sNr 
	};


	//how long a routine action can be deemed completed
	$scope.routineActionDuration = 3; //+weeks

	
	$scope.comments = []; // save comments of actions 
	$scope.nrToLoad = 20; // number of comments to load each time  
	$scope.moreComments = {}; //a set of boolen indicates whether an action has more comments to load


	$scope.actionsByType = function(type){

		var orderBy = $filter('orderBy'); 

		if (type == 'current') {
			return $filter('orderBy')(_.toArray($scope.currentUser.actions.inProgress),'-startedDate[startedDate.length-1]'); 
		} 
		if (type == 'pending') {
			return $filter('orderBy')(_.toArray($scope.currentUser.actions.pending), 'postponedDate[postponedDate.length-1]');
		}
		if (type == 'completed') {
			return $filter('orderBy')(_.toArray($scope.currentUser.actions.done), '-latestDate');
		}
	}



	//get the suggested actions from the backend 
	$scope.loadSuggestedActions = function(){

		$scope.idx = -1;
		$scope.lastActionUsed = true; 
		$scope.suggestedActions = []; 
		
		Actions.query().$promise.then(function(data) {

			$scope.suggestedActions = data; 

			console.log("load suggested tips");
			console.log($scope.suggestedActions);

			$scope.loadActionDetails($scope.suggestedActions); 
		});
	};

	$scope.loadSuggestedActions(); 

	$scope.addDays = function(days){

		var date = new Date(); 

		if (days && _.isNumber(days)){
			date.setDate(date.getDate() + days);
		}

		console.log(date);

		return date; 
	}

	$scope.showMore = function(type){
		$scope.maxNumberShow[type] += $scope.sNr; 
		if ($scope.maxNumberShow[type] > _.size($scope.currentUser.actions[type]))
			$scope.maxNumberShow[type] = _.size($scope.currentUser.actions[type]);
	}

	$scope.showLess = function(type){
		$scope.maxNumberShow[type]  -= $scope.sNr;
		if ($scope.maxNumberShow[type] < $scope.sNr)
			$scope.maxNumberShow[type] = $scope.sNr;
	}

	$scope.alertNoRehearseActions = function(){

		var title = "";
		var temp = "";

		if ($scope.isNotToRehearse()) {
			title = $translate.instant("Change_Setting"); 
			temp = "<span translate>ACTION_REHEARSAL_OPTIONS</span>"
		}else{
			title = $translate.instant("No_Action_to_Rehearse");
			temp = "<span translate>NO_ACTION_TO_REHEARSE</span>" + " <i class='ion-happy-outline'></i>"
		}

		var alertPopup = $ionicPopup.alert({
			title: "<span class='text-medium-large'>"+ title + "</span>", 
			template: "<span class='text-medium'>" + temp + "</span>",
			//okText: "Yes",
			okType: "button-dark"
		});

		alertPopup.then(function(res) {
			$scope.gotoYourActions(); 
		});
	};


	//recommend actions from the local user action list 
	//recommend the actions that are 'oldest' (ordered by the field latestDate)
	$scope.rehearseActions = function(){

		var actions = []; 

		if ($scope.currentUser.profile.toRehearse.done){
			actions = actions.concat(_.toArray($scope.currentUser.actions.done));
		}
		if ($scope.currentUser.profile.toRehearse.declined){
			actions = actions.concat(_.toArray($scope.currentUser.actions.declined));
		}
		if ($scope.currentUser.profile.toRehearse.na){
			actions = actions.concat(_.toArray($scope.currentUser.actions.na));
		}

		if (actions.length == 0){
			//nothing to show 
			$scope.alertNoRehearseActions();
		}else{
			//sort and put into the suggestion list
			actions = $filter('orderBy')(actions, 'latestDate');

			if (actions.length > $scope.preferredNumberOfActions){
				actios = actions.slice(0, $scope.preferredNumberOfActions);
			}

			console.log(actions);
			$scope.idx = -1;
			$scope.lastActionUsed = true; 
			$scope.suggestedActions = actions; 
			$scope.loadActionDetails($scope.suggestedActions); 
			$scope.showNextTip(); 
		}
	}

	$scope.askChangeRehearseSetting = function() { 

		var title = $scope.salut();

		var alertPopup = $ionicPopup.confirm({
			title: "<span class='text-medium-large'>" + title + "</span>", 
			template: "<span class='text-medium' translate>NO_MORE_ACTIONS_SETTING</span>",
			okText: $translate.instant("Yes"),
			cancelText: $translate.instant("Not_now"),
			okType: "button-dark"
		});
		alertPopup.then(function(res) {
			if (res) {
				$scope.gotoSettings(); 
			}else{
				$scope.gotoYourActions(); 
			}
		}); 
	}
	

	$scope.askRehearse = function() { 

		var title = $scope.salut();

		var alertPopup = $ionicPopup.confirm({
			title: "<span class='text-medium-large'>" + title + "</span>", 
			template: "<span class='text-medium'>NO_MORE_ACTIONS_REHEARSE</span>",
			okText: $translate.instant("Yes"),
			cancelText: $translate.instant("Not_now"),
			okType: "button-dark"
		});

		alertPopup.then(function(res) { 
			if (res){
				$scope.toRehearseSelectAll();
				$scope.rehearseActions(); 
			}else{
				$scope.toRehearseDeselectAll();
				$scope.gotoYourActions(); 
			}
		}); 
	}

	$scope.checkRehearse = function(){ 
		if ($scope.isToRehearse()){
			$scope.rehearseActions(); 
		}else if ($scope.isNotToRehearse()) {
			$scope.askChangeRehearseSetting(); 
		}else{
			$scope.askRehearse();
		}
	}; 


	$scope.askConfirmation = function(){

		var title = $scope.salut();

		var alertPopup = $ionicPopup.confirm({
			title: "<span class='text-medium-large'>" + title + "</span>", 
			scope: $scope, 
			template: "<span class='text-medium' translate translate-values=\"{number: '{{numberOfCurrentActions}}'}\">ASK_ADD_MORE</span>",
			okText: "Not now",
			cancelText: "Add more",
			okType: "button-dark"
		});

		alertPopup.then(function(res) {
			if(res) {
				// do nothing 
			}else{
				$scope.showNextTip(); 
			}
		});
	};


	$scope.alertTooManyActions = function(){

		var title = $scope.salut();

		var alertPopup = $ionicPopup.alert({
			title: "<span class='text-medium-large'>" + title + "</span>", 
			scope: $scope, 
			template: "<span class='text-medium' translate translate-values=\"{number: '{{numberOfCurrentActions}}'}\">NO_ADD_MORE</span>"+ " <i class='ion-happy-outline'>",
			//okText: "Yes",
			okType: "button-dark"
		});

		alertPopup.then(function(res) {
			$scope.gotoYourActions(); 
		});
	};

	/*	Checks the user's current number of actions first. 
		(1) No new action will be shown if the user already has too many (maxNumberOfActions) actions in progress 
		(2) Shows a new tip when the user does not have enough (preferredNumberOfActions) actions or when the user confirms to add more. 
		*/
		$scope.addActions = function(){

			$scope.numberOfCurrentActions = _.size($scope.currentUser.actions.inProgress); 

			if ($scope.numberOfCurrentActions < $scope.preferredNumberOfActions)
			{
				$scope.showNextTip();
			}else if ($scope.numberOfCurrentActions > $scope.maxNumberOfActions - 1 )
			{
				$scope.alertTooManyActions(); 
			}else{
				$scope.askConfirmation(); 
			}		
		};

		$scope.showNextTip = function(){

			if ($scope.lastActionUsed){
				$scope.idx++;
				$scope.lastActionUsed = false; 
			}

			if (_.size($scope.suggestedActions) > $scope.idx){

				$state.go('main.actions.action', {id:$scope.suggestedActions[$scope.idx]._id});

			}else{
				$scope.checkRehearse(); 
			}
		};


		$scope.setSuggestedActionStateWithPreload = function(actionId, actionState, date){

			$scope.lastActionUsed = true; 

			User.actionState({actionId: actionId}, {state: actionState, postponed: date}).$promise.then(function(data){

				console.log(data); 
				$scope.currentUser.actions = data; 

				$scope.numberOfCurrentActions = _.size($scope.currentUser.actions.inProgress); 

  			/*
  				Pre-load new suggested actions if the used action is the last suggested action.
  				This has to be called after the change of action state. 
  				*/
  				if ( ! (_.size($scope.suggestedActions) > $scope.idx + 1) ){
  					$scope.loadSuggestedActions(); 
  				}
  			});

		};

		$scope.postActionState = function(actionId, actionState, date){

			User.actionState({actionId: actionId}, {state: actionState, postponed: date}).$promise.then(function(data){

				console.log(data); 
				$scope.currentUser.actions = data; 

				$scope.numberOfCurrentActions = _.size($scope.currentUser.actions.inProgress); 
			});
		};


	/*/
		load comments of all actions in the user's actions lists
		actions: an object of a collection of objects of lists of actions
		/*/
		$scope.loadAllComments = function(actions){

		//actionType in {declined, done, inProgress, na, pending}
		for (var actionType in actions) {
			if (actions.hasOwnProperty(actionType)) {
				$scope.loadCommentsOfActions(actions[actionType]);
			}
		}
	}

	/*/
		actions: an object of a collection of indivudual action objects 
		/*/
		$scope.loadCommentsOfActions = function(actions){
			for (var key in actions) {
				if (actions.hasOwnProperty(key)) {
					$scope.loadCommentsByActionId(actions[key]._id); 
				}
			}
		}

	//initial load of comments, load 20 comments 
	$scope.loadCommentsByActionId = function(actionId){

		Actions.getComments({actionId: actionId, limit: $scope.nrToLoad, skip: 0}).$promise.then(function(data){

			$scope.comments = $scope.comments.concat(data);

			console.log("load comments");
			console.log(data); 

			if (data.length >= $scope.nrToLoad){
				$scope.setHasMoreComments(actionId);
			}else{
				$scope.setNoMoreComments(actionId);
			}

			data.forEach(function(comment) {
				//load user picture
			    //console.log(comment);
			});
		});
	}

	$scope.addMoreComments = function(comments){
		$scope.comments = $scope.comments.concat(comments);
	}

	$scope.setNoMoreComments = function(actionId){
		$scope.moreComments[actionId] = false; 
	}
	$scope.setHasMoreComments = function(actionId){
		$scope.moreComments[actionId] = true; 
	}
	$scope.hasMoreComments = function(actionId){
		if ($scope.moreComments[actionId] === undefined){
			return true; 
		}else return $scope.moreComments[actionId]; 
	}


	$scope.reloadActions = function() {

	    for (var actionId in $scope.actions) {

			Actions.getActionById({id:actionId}).$promise.then(function(data){
				
				$scope.actions[data._id] = data;

				console.log("reload action details");
				// console.log($scope.actions); 

				// Stop the ion-refresher from spinning
				// does not need to wait untill the last one gets loaded
				// Reload (just for change language) can be done at the background 
				$scope.$broadcast('scroll.refreshComplete'); 
			});
		}
	      
	};

	$scope.loadActionDetails($scope.currentUser.actions.inProgress);
	$scope.loadActionDetails($scope.currentUser.actions.pending);
	$scope.loadActionDetails($scope.currentUser.actions.done);

	$scope.loadHouseholdProfile($scope.currentUser.householdId);

  // which households invited the current user to join?
  $scope.loadHouseholdsDetails($scope.currentUser.pendingHouseholdInvites);

}

