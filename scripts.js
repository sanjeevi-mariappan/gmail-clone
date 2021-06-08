// Client ID and API key from the Developer Console
var CLIENT_ID =
  "134825137166-dp54fo4b02vlp2r3rl57mulach3fngtu.apps.googleusercontent.com";
var API_KEY = "AIzaSyBtCu-aOIP4hurTiuRySOWYxu_7Ee4hKAM";
// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = [
  "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest",
];
var previousPageToken='';
var nextPageToken='';
var labl;
var prams;
var no;

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES =
  "https://mail.google.com/ https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.send";

var sign_in_with_google=document.getElementById('sign-in-with-google');
var sign_out=document.getElementById('sign-out');
var user_id=document.getElementById('user-id');
var page_body=document.getElementById('page-body');
var message_list_body=document.getElementById('message-list-body');
/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
  gapi.load("client:auth2", initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
  gapi.client
    .init({
      apiKey: API_KEY,
      clientId: CLIENT_ID,
      discoveryDocs: DISCOVERY_DOCS,
      scope: SCOPES,
    })
    .then(
      function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        sign_in_with_google.onclick = function handleAuthClick(event) {
          gapi.auth2.getAuthInstance().signIn();
        };
        sign_out.onclick=function handleSignoutClick(event) {
            gapi.auth2.getAuthInstance().signOut();
          };
      },
      function (error) {
        //console.log(JSON.stringify(error, null, 2));
      }
    );
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
 function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    sign_in_with_google.style.display = 'none';
    sign_out.style.display='block';
    user_id.style.display='block';
    page_body.style.display='block';
    getProfile();
    displayRequestedLabel('INBOX',50,'From','Subject');
  } else {
    sign_in_with_google.style.display = 'block';
    sign_out.style.display = 'none';
    user_id.style.display='none';
    page_body.style.display='none';
  }
}


/**
 * Get Username
 */
function getProfile() {
  gapi.client.gmail.users
    .getProfile({
      userId: "me",
    })
    .then(function (response) {
      alert(`You are signed in as ${response.result.emailAddress}`);
      user_id.setAttribute('title',response.result.emailAddress);
    });
}




function createElement(type,id,clslist,text){
  let ele=document.createElement(type);
  ele.setAttribute('id',id);
  clslist.forEach((cls)=>{
    ele.classList.add(cls);
  });
  ele.appendChild(document.createTextNode(text));
  return ele;
}



function createMessagesTableHeader(...fields){
  let thead=document.createElement('thead');
  fields.forEach((field)=>{
    let th=document.createElement('th');
    let txtNode=document.createTextNode(field);
    th.appendChild(txtNode);
    thead.appendChild(th);
  });
  return thead;
}

function appendMessagesToTable(...msgValues){
  let tr=document.createElement('tr');
  msgValues.forEach((msg)=>{
    let td=document.createElement('td');
    let text=document.createTextNode(msg);
    td.appendChild(text);
    tr.appendChild(td);
  })
  return tr;
}

function displayRequestedLabel(label,number,...params) {
  message_list_body.innerHTML='';
  labl=label || labl;
  no=number || no;
  prams=params.length===0?prams:params;
   return gapi.client.gmail.users.messages.list({
    'userId': 'me',
    'labelIds': labl,
    'maxResults': no,
    'nextPageToken':nextPageToken
  }).then(function(response) {
    let msgs=response.result;
    previousPageToken=nextPageToken;
    nextPageToken=response.result.nextPageToken;
    alert(nextPageToken);
    msgs.messages.forEach((msg)=>{
     return  gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': msg.id
      }).then(function(response){
        let out=response.result.payload.headers;
        let mailDt=new Date(out.find((ob)=>{return ob.name==='Date'}).value);
        let tdy=new Date();
        let outDt;
        if(mailDt.getDate()===tdy.getDate())
          outDt=mailDt.toLocaleTimeString();
        else
          outDt=mailDt.toLocaleDateString();
        var paramsres=[];
        prams.forEach((param)=>{
          paramsres.push(out.find((ob)=>{return ob.name===param}).value)
        });
        message_list_body.appendChild(appendMessagesToTable(...paramsres,outDt));
      });
    })
  },
  function(err) { console.error("Execute error", err); })
}

function saveDraft(){
    const form = document.querySelector('form#form-data');
    const obj=Object.values(form).reduce((obj,field) => { obj[field.name] = field.value; return obj }, {});
    gapi.client.gmail.users.drafts.create({
        'userId': 'me',
        'message': {
                'raw': btoa("From: me\r\nTo:" +obj.to_mail  + "\r\nSubject:"+obj.subject_mail + "\r\n\r\n"+obj.body_mail)
              }
    }).execute(function(response){
    $("#compose_mail").modal('hide');
    $("#compose_mail").modal('dispose');
    $('.modal-backdrop').removeClass('modal-backdrop');
    $('.fade').removeClass('fade');
    $('.in').removeClass('in');
    },function(error){console.log('error');});
}

function sendMessage(){
  const form = document.querySelector('form#form-data');
    const obj=Object.values(form).reduce((obj,field) => { obj[field.name] = field.value; return obj }, {});
    gapi.client.gmail.users.messages.send({
        'userId': 'me',
         'resource': {
                'raw': btoa("From: me\r\nTo:" +obj.to_mail  + "\r\nSubject:"+obj.subject_mail + "\r\n\r\n"+obj.body_mail)
              }
    }).execute(function(response){
    $("#compose_mail").modal('hide');
    $("#compose_mail").modal('dispose');
    $('.modal-backdrop').removeClass('modal-backdrop');
    $('.fade').removeClass('fade');
    $('.in').removeClass('in');
    },function(error){console.log(error);});
}
