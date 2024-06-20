'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0',
    '#e63aec', '#883030', '#255a5c', '#a3a514'
];

function connect(event) {
    var str = document.querySelector('#name').value.trim();
    username = str[0].toUpperCase() + str.slice(1);

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);

    if(message.type === 'JOIN' || message.type === 'LEAVE') {
        var infoTemplate = document.querySelector('#info-template');
        var newMessage = infoTemplate.cloneNode(true);
        newMessage.classList.remove('hidden');
        newMessage.classList.add('event-message');

        if(message.type === 'JOIN')
            newMessage.querySelector('.content').textContent = message.sender + ' joined!';
        else
            newMessage.querySelector('.content').textContent = message.sender + ' left!';
    }
    else {

        var messageTemplate = document.querySelector('#chat-message-template');
        var newMessage = messageTemplate.cloneNode(true);
        newMessage.classList.remove('hidden');
        newMessage.classList.add('chat-message');

        var avatarElement = newMessage.querySelector('.avatar');
        var usernameElement = newMessage.querySelector('.username');
        var contentElement = newMessage.querySelector('.content');
        var timeElement = newMessage.querySelector('.time-date');

        var avatarColor = getAvatarColor(message.sender);

        avatarElement.textContent = message.sender[0];
        avatarElement.style.backgroundColor = avatarColor;
        usernameElement.textContent = message.sender;
        usernameElement.style.color = avatarColor;
        contentElement.textContent = message.content;
        timeElement.textContent = getCurrentTime();
    }

    messageArea.appendChild(newMessage);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

function getCurrentTime(){
    var now = new Date();
    var hours = now.getHours();
    var minutes = now.getMinutes();
    var ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;

    var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var month = months[now.getMonth()];
    var day = now.getDate();

    var formattedTimeDate = hours + ':' + minutes + ' ' + ampm + ' | ' + day + ' ' + month;
    return formattedTimeDate;
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)