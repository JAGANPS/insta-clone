import firebase from 'firebase';

const config = {
    apiKey: "AIzaSyCQNYNm2CyMfWtswuPx5yeCnUgHM5JDeRw",
    authDomain: "insta-9b29d.firebaseapp.com",
    databaseURL: "https://insta-9b29d.firebaseio.com",
    projectId: "insta-9b29d",
    storageBucket: "insta-9b29d.appspot.com",
    messagingSenderId: "845132930234",
    appId: "1:845132930234:web:a6fcac6c4a3b88209eb683",
    measurementId: "G-8BYY3FS3W9"
};
firebase.initializeApp(config);

export const f = firebase;
export const database = firebase.database();
export const auth = firebase.auth();
export const storage = firebase.storage();
