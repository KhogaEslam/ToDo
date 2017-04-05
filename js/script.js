var currentUserID = 1;
var itemsList = "";
/*Initialize Database Object*/
var db = openDatabase("ToDo", "1.0", "Description", 1*1024*1024);
/* User Object */
var User = {
  /*Create Table*/
  createTable: function(){
    db.transaction(function(tx){
      tx.executeSql("CREATE TABLE IF NOT EXISTS User (id INTEGER PRIMARY KEY  AUTOINCREMENT, username TEXT NOT NULL, password TEXT NOT NULL) ");
    });
  },
  registerUser: function(username,password){
    db.transaction(function(tx){
      tx.executeSql("INSERT INTO User (username, password) VALUES (?,?)",[username,password],
                function (tx, result) {
                    console.log("INSERT INTO User Query Success");
                },
                function (tx, error) {
                    console.log("INSERT INTO User Query Error: " + error.message);
                });
    });
  },
  retrieveUser: function(name, password){
    return new Promise(function(resolve, reject) {
      db.transaction(function(tx){
        tx.executeSql("SELECT * FROM User WHERE username = ? and password = ?",[name,password,],function(tx,res){
          if(res){
            if (!res.rows.length) {
              resolve({status:'error',data:'No User in database'});
            }
            else {
              resolve({status:'success',data:res.rows});
            }
          }
          else{
            reject({status:'conError',data:'Connection Error !'});
          }
        });
      });
    });
  },
};
User.createTable();
User.registerUser("user","12345");
/* End User Object */
////////////////////////////////////////////////////////////////////////////////
/* Item Object */
var Item = {
  /*Create Table*/
  createTable: function(){
    db.transaction(function(tx){
      tx.executeSql("CREATE TABLE IF NOT EXISTS Item (id  INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, desc TEXT, isComp, addDate  DATE DEFAULT (datetime('now','localtime')), userId INTEGER NOT NULL, FOREIGN KEY (userId) REFERENCES User (id)) ");
    });
  },
  insertItem: function(myItem){
    //console.log(myItem['name'], myItem['desc'], myItem['isComp'], myItem['userId']);
    return new Promise(function(resolve, reject) {
      db.transaction(function(tx){
        tx.executeSql("INSERT INTO Item (name,desc,isComp,userId) VALUES (?,?,?,?)",[myItem['name'], myItem['desc'], myItem['isComp'], myItem['userId']],
                  function (tx, result) {
          if(result){
              resolve({status:'success',data: result});
          }
          else{
            reject({status:'conError',data:'Connection Error !'});
          }
        });
      });
    });
  },
  updateItem: function(id,myItem){
    db.transaction(function(tx){
      tx.executeSql("UPDATE Item SET name = ? , desc = ? , isComp = ? WHERE id = ?",[myItem['name'], myItem['desc'], myItem['isComp'], id],
                function (tx, result) {
                    console.log("UPDATE Item Query Success");
                },
                function (tx, error) {
                    console.log("UPDATE Item Query Error: " + error.message);
                });
    },
    function (error) {
        console.log("UPDATE Item Transaction Error: " + error.message);
    },
    function () {
        console.log("UPDATE Item Transaction Success");
    });
  },
  deleteItem: function(id){
    db.transaction(function(tx){
      tx.executeSql("DELETE FROM Item WHERE id = ?",[id, ],
                function (tx, result) {
                    console.log("DELETE FROM Item Query Success");
                },
                function (tx, error) {
                    console.log("DELETE FROM Item Query Error: " + error.message);
                });
    },
    function (error) {

        console.log("DELETE FROM Item Transaction Error: " + error.message);
    },
    function () {
        console.log("DELETE FROM Item Transaction Success");
    });
  },
  updateItemStatus: function(myItem,id){
    db.transaction(function(tx){
      tx.executeSql("UPDATE Item SET isComp = ? WHERE id = ?",[myItem['isComp'], id, ],
                function (tx, result) {
                    console.log("UPDATE Item Query Success");
                },
                function (tx, error) {
                    console.log("UPDATE Item Query Error: " + error.message);
                });
    },
    function (error) {

        console.log("UPDATE Item Transaction Error: " + error.message);
    },
    function () {
        console.log("UPDATE Item Transaction Success");
    });
  },
  retrieveItem: function(id){
    return new Promise(function(resolve, reject) {
      db.transaction(function(tx){
        tx.executeSql("SELECT * FROM Item WHERE id = ?",[id, ],function(tx,res){
          if(res){
            if (!res.rows.length) {
              resolve({status:'error',data:'No Items in database'});
            }
            else {
              resolve({status:'success',data:res.rows});
            }
          }
          else{
            reject({status:'conError',data:'Connection Error !'});
          }
        });
      });
    });
  },
  retrieveItems: function(uid){
      return new Promise(function(resolve, reject) {
        db.transaction(function(tx){
          tx.executeSql("SELECT * FROM Item WHERE userId = ?",[uid,],function(tx,res){
            if(res){
              if (!res.rows.length) {
                resolve({status:'error',data:'No Items in database'});
              }
              else {
                resolve({status:'success',data:res.rows});
              }
            }
            else{
              reject({status:'conError',data:'Connection Error !'});
            }
          });
        });
    });
  },
};
Item.createTable();
/* End Item Object */

////////////////////////////////////////////////////////////////////////////////
/* Prepare Items To Appear */
function prepareUserItems(uid){
  Item.retrieveItems(uid).then(function(result) {
    if(result.status == 'success'){
      itemsList = result.data;
      renderItems(itemsList);
    }
    else {
        var errMsg = document.querySelector('#errMsg');
        errMsg.innerHTML += "<center><p><h1><strong>"+result.data+"</strong></h1></p></center>";
    }
  }, function(err) {
    Error(err.data)
    var errMsg = document.querySelector('#errMsg');
    errMsg.innerHTML += "<center><p>"+result.data+"</p></center>";
  });
}

/* End Prepare Items To Appear */
////////////////////////////////////////////////////////////////////////////////

function renderItems(Items){
  var comp = document.querySelector('#comp');
  var ncomp = document.querySelector('#ncomp');
  for (var i = 0; i < Items.length; i++) {
    //console.log(Items[i]);
    if(Items[i]['isComp'] == "true"){
      $('<div class="todoItem isComp"></div>')
      .data( 'isComp', Items[i]['isComp'] )
      .attr( 'id', Items[i]['id'] )
      .append('<h3 id="itemName">'+Items[i]['name']+'</h3>'+'<p id="itemDesc">'+Items[i]['desc']+'</p>'+' :: <span>'+Items[i]['addDate']+'</span><a id="deleteItem" class="glyphicon glyphicon-trash"></a> <p><center><a id="itemDetails">Details</a></center></p>')
      .appendTo( '#comp' )
      .draggable( {
        containment: '#content',
        stack: '#comp div',
        cursor: 'move',
        revert: true
      } )
      .droppable( {
        accept: '#ncomp div',
        drop: handleItemDrop
      } )
      .css({'margin':'auto','margin-top': '300px'})
      .animate({'margin-top': '5px'}, 1000);

      // comp.innerHTML += '<div ondragstart="dragstart(event)" draggable="true"\
      // id="'+Items[i]['id']+'"><h1>'+Items[i]['name']+'</h1>\
      // <p>'+Items[i]['desc']+'</p>\
      // <button id="update">Update</button>\
      // <button id="delete">Delete</button>\
      // </div>';
    }
    else{
      $('<div class="todoItem isNComp"></div>')
      .data( 'isComp', Items[i]['isComp'] )
      .attr( 'id', Items[i]['id'] )
      .append('<h3 id="itemName">'+Items[i]['name']+'</h3>'+'<p id="itemDesc">'+Items[i]['desc']+'</p>'+' :: <span>'+Items[i]['addDate']+'</span> <a id="deleteItem" class="glyphicon glyphicon-trash"></a> <p><center><a id="itemDetails">Details</a></center></p>')
      .appendTo( '#ncomp' )
      .draggable( {
        containment: '#content',
        stack: '#ncomp div',
        cursor: 'move',
        revert: true
      } )
      .droppable( {
        accept: '#comp div',
        drop: handleItemDrop
      } )
      .css({'margin':'auto','margin-top': '300px'})
      .animate({'margin-top': '5px'}, 1000);
      // ncomp.innerHTML += '<div ondragstart="dragstart(event)" draggable="true"\
      // id="'+Items[i]['id']+'"><h1>'+Items[i]['name']+'</h1>\
      // <p>'+Items[i]['desc']+'</p>\
      // <button id="update">Update</button>\
      // <button id="delete">Delete</button>\
      // </div>';
    }
  }
}

////////////////////////////////////////////////////////////////////////////////

function handleItemDrop( event, ui ) {
  var dropPlace = $(this).data( 'isComp' );
  var dropped = ui.draggable.data( 'isComp' );
  var id = ui.draggable[0]['id'];
  //console.log(dropPlace, dropped, id,ui.draggable);
  if ( (dropPlace == 'true' && dropped == 'false') ) {
    //console.log("cond: ",dropPlace, dropped);
    $('#comp').append(ui.draggable);
    ui.draggable.data( 'isComp',"true" );
    ui.draggable.attr( 'class', "todoItem isComp" );
    Item.updateItemStatus({'isComp':true},id);
    // $('#comp').empty();
    // $('#ncomp').empty();
    // prepareUserItems(currentUserID);
  }
  else if( dropPlace == 'false' && dropped == 'true' ){
    $('#ncomp').append(ui.draggable);
    ui.draggable.data( 'isComp',"false" );
    ui.draggable.attr( 'class', "todoItem isNComp" );
    Item.updateItemStatus({'isComp':false},id);
    // $('#comp').empty();
    // $('#ncomp').empty();
    // prepareUserItems(currentUserID);
  }
}

$(document).ready(function(){
  var currentItemId = "NULL!";
  $("#ncomp")
  .data( 'isComp', 'false' )
  .droppable( {
    accept: '#comp div',
    drop: handleItemDrop
  } );
  $("#comp")
  .data( 'isComp', 'true' )
  .droppable( {
    accept: '#ncomp div',
    drop: handleItemDrop
  } );

  $("#loginForm").submit(function(e){
    e.preventDefault();
    var formData= $("#loginForm").serializeArray();
    var userData={};
    //console.log("Form Data:",formData);
    for (var i = 0; i < formData.length; i++) {
      userData[formData[i].name] = formData[i].value
    }
    //userData['userId'] = currentUserID;
    //console.log("newItem Data:",userData);

    var username = $("#Username").val();
    var password = $("#Password").val();
    // Checking for blank fields.
    if( username ==''){
      $('#Username').css("border","2px solid red");
      $('#Username').css("box-shadow","0 0 3px red");
    }
    if( password ==''){
      $('#Password').css("border","2px solid red");
      $('#Password').css("box-shadow","0 0 3px red");
    }
    if( username =='' && password ==''){
      $('#Username,#Password').css("border","2px solid red");
      $('#Username,#Password').css("box-shadow","0 0 3px red");
    }else {
      User.retrieveUser(username,password).then(function(result) {
        if(result.status == 'success'){
          var user = result.data;
          //console.log("User Data:",user);
          $('.hiddenContents').toggle();
          $('.loginForm').toggle();
          currentUserID = user[0]['id']
          prepareUserItems(currentUserID);
        }
        else {
            var errMsg = $('#errMsgLogin');
            errMsg.html("<center><h4>Error!</h4><p>Invalid User Name Or Password</p></center>");
            //console.log(result.data, errMsg);
            $('.popUpLogin').slideDown();
        }
      }, function(err) {
        Error(err.data)
        var errMsg = $('#errMsgLogin');
        errMsg.html("<center><p>"+result.data+"</p></center>");
        //console.log(result.data, errMsg);
        $('.popUpLogin').slideDown();
      });
    }
  });

  $('.popUpLogin').on('click', function(e) {
    $('.popUpLogin').slideUp();
  });

  $("#logout").on('click', function(e) {
    e.preventDefault();
    $('#comp').empty();
    $('#ncomp').empty();
    $('.hiddenContents').toggle();
    $('.loginForm').toggle();
  });

  $('body').on('click','#deleteItem',function(e){
    //console.log($(this).parent().attr('id'));
    //add delete from db
    var itemId = $(this).parent().attr('id');
    Item.deleteItem(itemId);
    $(this).parent().remove();
  });

  $("#addForm").submit(function(e){
    e.preventDefault();
    var formData= $("#addForm").serializeArray();
    var newItem={};
    //console.log("Form Data:",formData);
    for (var i = 0; i < formData.length; i++) {
      newItem[formData[i].name] = formData[i].value
    }
    newItem['userId'] = currentUserID;
    //console.log("newItem Data:",newItem);

    Item.insertItem(newItem).then(function(result) {
      if(result.status == 'success'){
        id = result.data.insertId;
        //console.log(id);
        if(newItem['isComp'] == 'true'){
          $('<div class="todoItem isComp"></div>')
          .data( 'isComp', 'true' )
          .attr( 'id', id )
          .append('<h3>'+newItem['name']+'</h3>'+'<p>'+newItem['desc']+'</p>'+' :: <span>'+(new Date())+'</span></span> <a id="deleteItem" class="glyphicon glyphicon-trash"></a> <p><center><a id="itemDetails">Details</a></center></p>')
          .appendTo( '#comp' )
          .draggable( {
            containment: '#content',
            stack: '#comp div',
            cursor: 'move',
            revert: true
          } )
          .droppable( {
            accept: '#ncomp div',
            drop: handleItemDrop
          } )
          .css({'margin':'auto','margin-top': '300px'})
          .animate({'margin-top': '5px'}, 1000);
          // $('#comp').append('<div ondragstart="dragstart(event)" draggable="true" id="'+newItem['name']+'"><h1>'+newItem['desc']+'</h1>\
          // <button id="update">Update</button>\
          // <button id="delete">Delete</button>\
          // </div>');
        }
        else{
          $('<div class="todoItem isNComp"></div>')
          .data( 'isComp', 'false' )
          .attr( 'id', id )
          .append('<h3>'+newItem['name']+'</h3>'+'<p>'+newItem['desc']+'</p>'+' :: <span>'+(new Date())+'</span></span> <a id="deleteItem" class="glyphicon glyphicon-trash"></a> <p><center><a id="itemDetails">Details</a></center></p>')
          .appendTo( '#ncomp' )
          .draggable( {
            containment: '#content',
            stack: '#ncomp div',
            cursor: 'move',
            revert: true
          } )
          .droppable( {
            accept: '#comp div',
            drop: handleItemDrop
          } )
          .css({'margin':'auto','margin-top': '300px'})
          .animate({'margin-top': '5px'}, 1000);
          // $('#ncomp').append('<div ondragstart="dragstart(event)" draggable="true" id="'+newItem['name']+'"><h1>'+newItem['desc']+'</h1>\
          // <button id="update">Update</button>\
          // <button id="delete">Delete</button>\
          // </div>');
        }
      }
      else {
          var errMsg = $('#errMsgLogin');
          errMsg.html("<center><h4>Error!</h4><p>Invalid User Name Or Password</p></center>");
          //console.log(result.data, errMsg);
          $('.popUpLogin').slideDown();
      }
    }, function(err) {
      Error(err.data)
      var errMsg = $('#errMsgLogin');
      errMsg.html("<center><p>"+result.data+"</p></center>");
      //console.log(result.data, errMsg);
      $('.popUpLogin').slideDown();
    });

    $('.popUp').slideUp();
    $('.addForm').toggle('show');
  });

  /////////////////////////////////
  $(".cancel").on('click', function(e) {
    e.preventDefault();
    $('.popUp').slideUp();
    $('.addForm').toggle('show');
  });

  $('body').on('click','#cancelUpdate',function(e){
    e.preventDefault();
    $('#comp').empty();
    $('#ncomp').empty();
    prepareUserItems(currentUserID);
  });
  /////////////////////////////////
  $('.addForm').on('click', function(e) {
    e.preventDefault();
    $('.popUp').slideDown();
    $(this).toggle('hide');
  });

  /////////////////////////////////

  $('body').on('click','#delete',function(e){
    var itemId = e.target.parentElement.id;
    Item.deleteItem(itemId);
    $(this).parent().remove();

  });
  //////////////////////////////////

  $('body').on('dblclick','.todoItem',function(e){
    e.preventDefault();
    var itemId = $(this)[0].id;
    currentItemId = itemId;
    //console.log("item id",itemId);
    var itemName = $(this).find("#itemName").text();
    var itemDesc = $(this).find("#itemDesc").text();
    var itemStatus = $(this).data('isComp');
    /*
    // Item.retrieveItem(itemId).then(function(result) {
    //   //console.log(result.data[0]);
    //   if(result.status == 'success'){
    //     item = result.data[0];
    //     console.log(item);
    //   }
    //   else {
    //       var errMsg = document.querySelector('#errMsg');
    //       errMsg.innerHTML += "<center><p><h1><strong>"+result.data+"</strong></h1></p></center>";
    //   }
    // }, function(err) {
    //   Error(err.data)
    //   var errMsg = document.querySelector('#errMsg');
    //   errMsg.innerHTML += "<center><p>"+result.data+"</p></center>";
    // });
    */
    //console.log(itemStatus);

    var newUpdate = '<form id="updateItemForm">\
                      <input type="text" name="name" placeholder="Enter Note Title" value="'+itemName+'">\
                      <input type="text" name="desc" placeholder="Enter Note Details" value="'+itemDesc+'">\
                      <select name="isComp">';
    if(itemStatus == "true"){
      newUpdate += '<option selected value="true">Completed</option>\
      <option value="false">Not Completed</option>';
    }
    else {
      newUpdate += '<option value="true">Completed</option>\
      <option selected value="false">Not Completed</option>';
    }
    newUpdate +=
                      '</select>\
                      <button id="updateFormItem">Update Note</button>\
                      <button id="cancelUpdate">Cancel</button>\
                    </form>';
    $(this).html(newUpdate);
  });
////////////////////////////////////////////////////////////////////////////////
  $('body').on('click','#updateFormItem',function(e){
    e.preventDefault();
    //console.log(e);
    var itemId = currentItemId;
    //console.log(itemId);
    var formData= $("#updateItemForm").serializeArray();
    var newItem={};
    for (var i = 0; i < formData.length; i++) {
      newItem[formData[i].name] = formData[i].value
    }
    var itemId = e.target.parentElement.parentElement.id;
    Item.updateItem(itemId,newItem);

    $('#comp').empty();
    $('#ncomp').empty();
    prepareUserItems(currentUserID);

  });
});

////////////////////////////////////////////////////////////////////////////////
/* Drag and Drop Functions */
// function dragstart(e) {
//   e.dataTransfer.setData("eleid",e.target.id)
//   console.log(e);
// }
// function dragover(e){
//   e.preventDefault();
// }
// function drop(e){
//   e.preventDefault();
//   var id = e.dataTransfer.getData("eleid");
//   var item = document.getElementById(id);
//   if(e.target.id == 'comp' || e.target.id == 'ncomp'){
//     e.target.appendChild(item);
//   }
//   else{
//     if(e.target.parentElement.id == 'comp' || e.target.parentElement.id == 'ncomp'){
//       e.target.parentElement.appendChild(item);
//     }
//     else if (e.target.parentElement.parentElement.id == 'comp' || e.target.parentElement.parentElement.id == 'ncomp') {
//       e.target.parentElement.parentElement.appendChild(item);
//     }
//   }
//   if(e.srcElement.id == "comp"){
//     Item.updateItemStatus({'isComp':true},id);
//   }
//   else{
//     Item.updateItemStatus({'isComp':false},id);
//   }
// }
/* End Drag and Drop Functions */
////////////////////////////////////////////////////////////////////////////////
