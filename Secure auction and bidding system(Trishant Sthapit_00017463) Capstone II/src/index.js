import React from 'react';
import ReactDOM from 'react-dom';
import 'bootstrap/dist/css/bootstrap.css'
import App from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';
import '@fortawesome/fontawesome-free/css/all.min.css';
import 'mdbreact/dist/css/mdb.css';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
TimeAgo.addDefaultLocale(en)

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
